/**
 * POST /api/admin/auth/login-totp
 *
 * Step 2 of login when TOTP 2FA is enabled.
 * Verify the TOTP code (or backup code) and issue tokens.
 *
 * Body: { userId, totpCode }
 * Response: { token, refreshToken, user } | 401
 *
 * Security:
 * - Rate limited (same as login — 5 attempts/min per IP)
 * - 5 failed TOTP attempts → 5 min lockout
 * - Backup codes are single-use
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import {
 decryptTotpSecret,
 verifyTotpCode,
 verifyBackupCode,
 removeBackupCode,
} from "@/lib/auth/totp";
import { rotateRefreshToken } from "@/lib/auth/session";
import { applyRateLimit, extractClientIp } from "@/lib/rate-limit";
import { authLogger } from "@/lib/logger";
import { createAuditLog } from "@/lib/auth/audit";
import { ROLE_LEVEL } from "@/lib/auth/roles";

const MAX_TOTP_FAILS = 5;
const TOTP_LOCKOUT_MS = 5 * 60 * 1000;

export async function POST(req: NextRequest) {
 const start = Date.now();
 const ipAddress = extractClientIp(req);

 const rateLimitResult = await applyRateLimit(req, "auth");
 if (!rateLimitResult.allowed) {
 return rateLimitResult.response!;
 }

 try {
 const session = await requireAuth();
 const { totpCode } = await req.json() as { totpCode?: string };

 if (!totpCode) {
 return NextResponse.json({ error: "Mã xác thực là bắt buộc" }, { status: 400 });
 }

 // Get user with TOTP status
 const user = await prisma.user.findUnique({
 where: { id: session.userId },
 include: {
 userRoles: {
 select: {
 role: {
 select: { name: true, level: true },
 },
 },
 },
 teamMember: {
 select: {
 accessTags: true, rank: true, availableLp: true,
 tabPermissions: true, departmentId: true, memberDepartments: { select: { isDeptHead: true } },
 },
 },
 },
 });

 if (!user) {
 return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 404 });
 }

 if (!user.totpEnabled || !user.totpSecret) {
 // TOTP not enabled — shouldn't happen if frontend follows flow
 return NextResponse.json({ error: "TOTP chưa được kích hoạt" }, { status: 400 });
 }

 // Check TOTP lockout
 // Use in-memory store for TOTP lockout (simple, short-lived)
 const lockoutEntry = TOTP_LOCKOUT_STORE.get(user.id);
 if (lockoutEntry && lockoutEntry.until > Date.now()) {
 const remaining = Math.ceil((lockoutEntry.until - Date.now()) / 1000);
 return NextResponse.json(
 { error: `Quá nhiều lần xác thực thất bại. Thử lại sau ${remaining} giây.`, retryAfter: remaining },
 { status: 429, headers: { "Retry-After": String(remaining) } }
 );
 }

 // Decrypt secret and verify
 let valid = false;
 let usedBackupCode = false;

 try {
 const secret = decryptTotpSecret(user.totpSecret);
 valid = await verifyTotpCode(secret, totpCode);
 } catch {
 valid = false;
 }

 // Check backup codes if TOTP code failed
 if (!valid && user.totpBackupCodes) {
 const backupIndex = verifyBackupCode(user.totpBackupCodes, totpCode);
 if (backupIndex >= 0) {
 valid = true;
 usedBackupCode = true;
 // Remove used backup code
 const newHashes = removeBackupCode(user.totpBackupCodes, backupIndex);
 await prisma.user.update({
 where: { id: user.id },
 data: { totpBackupCodes: newHashes || null },
 });
 }
 }

 if (!valid) {
 // Record failure
 const current = TOTP_LOCKOUT_STORE.get(user.id) ?? { count: 0, until: 0 };
 current.count++;
 if (current.count >= MAX_TOTP_FAILS) {
 current.until = Date.now() + TOTP_LOCKOUT_MS;
 current.count = 0;
 }
 TOTP_LOCKOUT_STORE.set(user.id, current);

 authLogger.withSLO("POST /api/admin/auth/login-totp", {
 endpoint: "/api/admin/auth/login-totp",
 method: "POST",
 statusCode: 401,
 latencyMs: Date.now() - start,
 userId: user.id,
 error: "invalid_totp",
 });

 await createAuditLog({ userId: user.id, action: "login_totp_failed", resource: "auth" });

 return NextResponse.json(
 { error: "Mã xác thực không đúng" },
 { status: 401 }
 );
 }

 // Clear lockout on success
 TOTP_LOCKOUT_STORE.delete(user.id);

 // Issue tokens
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const u = user as any;
 const roles = u.userRoles.map((ur: { role: { name: string } }) => ur.role.name);
 const effectiveRoleLevel =
 u.userRoles.length > 0
 ? Math.min(...u.userRoles.map((ur: { role: { level: number | null } }) => ur.role.level ?? 99))
 : ROLE_LEVEL[user.role] ?? 1;

 const accountType: "staff" | "customer" = effectiveRoleLevel <= 5 ? "staff" : "customer";

 const result = await rotateRefreshToken(
 req.cookies.get("refresh-token")?.value ?? "",
 { ipAddress, userAgent: req.headers.get("user-agent") ?? undefined }
 );

 if (!result) {
 // No existing session — create new
 const { createSession } = await import("@/lib/auth/session");
 const deviceType = req.headers.get("user-agent") ?? "Unknown";
 const sessionResult = await createSession(user.id, {
 roleLevel: effectiveRoleLevel,
 email: user.email,
 name: user.name ?? "",
 role: user.role,
 roles,
 accessTags: user.teamMember?.accessTags ?? [],
 tabPermissions: user.teamMember?.tabPermissions ?? [],
 departmentId: user.teamMember?.departmentId ?? null,
 isDeptHead: (user.teamMember?.memberDepartments ?? []).some((md: any) => md.isDeptHead) ?? false,
 accountType,
 isOnboarded: user.isOnboarded,
 rank: user.teamMember?.rank ?? undefined,
 availableLp: user.teamMember?.availableLp ?? undefined,
 }, { deviceType, ipAddress, userAgent: req.headers.get("user-agent") ?? undefined });

 authLogger.withSLO("POST /api/admin/auth/login-totp (new session)", {
 endpoint: "/api/admin/auth/login-totp",
 method: "POST",
 statusCode: 200,
 latencyMs: Date.now() - start,
 userId: user.id,
 });

 const response = NextResponse.json({
 token: sessionResult.accessToken,
 refreshToken: sessionResult.refreshToken,
 user: {
 userId: user.id,
 email: user.email,
 name: user.name,
 avatar: user.avatar,
 role: user.role,
 roles,
 roleLevel: effectiveRoleLevel,
 accountType,
 teamMemberId: user.teamMemberId,
 rank: user.teamMember?.rank,
 availableLp: user.teamMember?.availableLp,
 isOnboarded: user.isOnboarded,
 },
 backupCodeUsed: usedBackupCode,
 });

 setAuthCookies(response, sessionResult.accessToken, sessionResult.refreshToken);
 return response;
 }

 // Update existing session with new tokens
 authLogger.withSLO("POST /api/admin/auth/login-totp", {
 endpoint: "/api/admin/auth/login-totp",
 method: "POST",
 statusCode: 200,
 latencyMs: Date.now() - start,
 userId: user.id,
 });

 await createAuditLog({ userId: user.id, action: "login_totp_success", resource: "auth" });

 const response = NextResponse.json({
 token: result.accessToken,
 refreshToken: result.refreshToken,
 user: {
 userId: user.id,
 email: user.email,
 name: user.name,
 avatar: user.avatar,
 role: user.role,
 roles,
 roleLevel: effectiveRoleLevel,
 accountType,
 teamMemberId: user.teamMemberId,
 rank: user.teamMember?.rank,
 availableLp: user.teamMember?.availableLp,
 isOnboarded: user.isOnboarded,
 },
 backupCodeUsed: usedBackupCode,
 });

 setAuthCookies(response, result.accessToken, result.refreshToken);
 return response;
 } catch (err) {
 const message = err instanceof Error ? err.message : "Server error";
 authLogger.withSLO("POST /api/admin/auth/login-totp", {
 endpoint: "/api/admin/auth/login-totp",
 method: "POST",
 statusCode: 500,
 latencyMs: Date.now() - start,
 error: message,
 });
 return NextResponse.json({ error: message }, { status: 500 });
 }
}

function setAuthCookies(response: NextResponse, token: string, refreshToken: string) {
 response.cookies.set("loop-staff-token", token, {
 httpOnly: true,
 secure: process.env.NODE_ENV === "production",
 sameSite: "strict",
 maxAge: 5 * 60,
 path: "/",
 });
 response.cookies.set("auth-token", token, {
 httpOnly: true,
 secure: process.env.NODE_ENV === "production",
 sameSite: "strict",
 maxAge: 5 * 60,
 path: "/",
 });
 response.cookies.set("refresh-token", refreshToken, {
 httpOnly: true,
 secure: process.env.NODE_ENV === "production",
 sameSite: "strict",
 maxAge: 7 * 24 * 3600,
 path: "/",
 });
 response.cookies.set("auth-logged-in", "1", {
 httpOnly: false,
 secure: process.env.NODE_ENV === "production",
 sameSite: "strict",
 maxAge: 7 * 24 * 3600,
 path: "/",
 });
}

// In-memory TOTP lockout store (short-lived, per-process)
// For production with multiple instances, use Redis
const TOTP_LOCKOUT_STORE = new Map<string, { count: number; until: number }>();
