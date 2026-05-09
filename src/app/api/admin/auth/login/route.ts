/**
 * POST /api/admin/auth/login
 *
 * Staff credentials login: email + password → issue access + refresh tokens.
 *
 * Split Auth Architecture (Option C):
 * 1. Sets loop-staff-token cookie (HttpOnly, access token, 5 min)
 * 2. Sets refresh-token cookie (HttpOnly, refresh token, 7d)
 * 3. Clears loop-customer-token cookie (if any — prevent cross-account)
 * 4. Sets auth-method=credentials (non-HttpOnly, FE flag)
 * 5. Sets auth-logged-in=1 (non-HttpOnly)
 * 6. Returns { user, token, refreshToken } in body
 *
 * Security:
 * - LoginAttempt lockout: 5 failed attempts → 15 min lock
 * - Timing-safe password comparison (constant-time even for non-existent users)
 * - Audit log: login_success / login_failed
 * - TOTP 2FA: if enabled, returns { requiresTotp: true } and requires /login-totp step
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import {
 createSession,
 checkLoginLockout,
 recordLoginAttempt,
 parseDeviceType,
} from "@/lib/auth/session";
import { createAuditLog } from "@/lib/auth/audit";
import { ROLE_LEVEL } from "@/lib/auth/roles";
import { applyRateLimit, extractClientIp } from "@/lib/rate-limit";
import { authLogger } from "@/lib/logger";

// Pre-computed hash for timing-safe comparison when user doesn't exist
const DUMMY_HASH = "$2a$12$LJ3m4ys3Rl3hPcyFSevMnuGHvZw7KLEqKl6.s8EWYFONbJdRe0Gu2";

function isDbUnavailableError(err: unknown): boolean {
 if (err instanceof Error) {
 const msg = err.message;
 return (
 msg.includes("Can't reach database") ||
 msg.includes("Connection terminated") ||
 msg.includes("timeout") ||
 msg.includes("P1001") ||
 msg.includes("P2024")
 );
 }
 return false;
}

/** Extract a clean user object from the DB result */
type LoginUser = {
 id: string;
 email: string;
 passwordHash: string | null;
 name: string | null;
 avatar: string | null;
 role: string;
 isActive: boolean;
 accountType: string;
 teamMemberId: string | null;
 isOnboarded: boolean;
 totpEnabled: boolean;
 userRoles: {
 role: {
 name: string;
 level: number;
 permissions: { resource: string; action: string; scope: string }[];
 };
 }[];
 teamMember: {
 accessTags: string[];
 rank?: string | null;
 availableLp?: number | null;
 tabPermissions?: string[];
 departmentId?: string | null;
 memberDepartments?: { isDeptHead: boolean }[];
 } | null;
};

export async function POST(req: NextRequest) {
 const start = Date.now();
 const ipAddress = extractClientIp(req);

 // ── Rate limit: 5 attempts/min per IP ─────────────────────────────────────
 const rateLimitResult = await applyRateLimit(req, "auth");
 if (!rateLimitResult.allowed) {
 return rateLimitResult.response!;
 }

 let user: LoginUser | null = null;

 try {
 const { email, password } = await req.json();

 if (!email || !password) {
 return NextResponse.json(
 { error: "Email và mật khẩu là bắt buộc" },
 { status: 400 }
 );
 }

 // ── LoginAttempt lockout check ────────────────────────────────────────────
 const lockout = await checkLoginLockout(email, ipAddress);
 if (lockout.locked) {
 authLogger.withSLO("POST /api/admin/auth/login — LOCKED OUT", {
 endpoint: "/api/admin/auth/login",
 method: "POST",
 statusCode: 429,
 latencyMs: Date.now() - start,
 ip: ipAddress,
 });
 return NextResponse.json(
 {
 error: `Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau.`,
 retryAfter: lockout.lockedUntil
 ? Math.ceil((lockout.lockedUntil.getTime() - Date.now()) / 1000)
 : 900,
  },
 { status: 429, headers: { "Retry-After": "900" } }
 );
 }

 // ── Fetch user ────────────────────────────────────────────────────────────
 user = await prisma.user.findUnique({
 where: { email },
 select: {
 id: true,
 email: true,
 passwordHash: true,
 name: true,
 avatar: true,
 role: true,
 isActive: true,
 accountType: true,
 teamMemberId: true,
 isOnboarded: true,
 totpEnabled: true,
 userRoles: {
 select: {
 role: {
 select: {
 name: true,
 level: true,
 permissions: {
 select: { resource: true, action: true, scope: true },
 },
 },
  },
 },
 },
 teamMember: {
 select: {
 accessTags: true,
 rank: true,
 availableLp: true,
 tabPermissions: true,
 departmentId: true,
 memberDepartments: { select: { isDeptHead: true } },
 },
 },
 },
  });

 // ── Timing-safe password verification ─────────────────────────────────────
 const hashToCompare = user?.passwordHash || DUMMY_HASH;
 const valid = await verifyPassword(password, hashToCompare);

 if (!user || !user.passwordHash || !valid) {
 // Record failed attempt
 if (user) {
 await recordLoginAttempt(email, ipAddress, user.id);
 await createAuditLog({ userId: user.id, action: "login_failed", resource: "auth" });
 }
 return NextResponse.json(
 { error: "Email hoặc mật khẩu không đúng" },
 { status: 401 }
 );
 }

 // ── Account status check ──────────────────────────────────────────────────
 if (!user.isActive) {
 return NextResponse.json(
 { error: "Tài khoản đã bị vô hiệu hoá" },
 { status: 403 }
 );
 }

 // ── TOTP 2FA check ────────────────────────────────────────────────────────
 // If TOTP is enabled, require step 2 verification before issuing tokens.
 // Frontend should prompt for TOTP code and call POST /api/admin/auth/login-totp
 if (user.totpEnabled) {
 // Clear lockout but do NOT issue tokens yet
  await prisma.loginAttempt.deleteMany({ where: { email } });
 await createAuditLog({ userId: user.id, action: "login_totp_required", resource: "auth" });

 authLogger.withSLO("POST /api/admin/auth/login — TOTP required", {
  endpoint: "/api/admin/auth/login",
 method: "POST",
 statusCode: 200,
 latencyMs: Date.now() - start,
 userId: user.id,
 });

 return NextResponse.json({
 requiresTotp: true,
 userId: user.id,
 message: "Vui lòng nhập mã xác thực từ ứng dụng Authenticator.",
 });
 }

 // ── Success: clear lockout + track login ────────────────────────────────────
 // NOTE: PrismaNeonHttp (HTTP adapter) does NOT support $transaction.
 // Sequential await is fine here — these ops are non-critical side-effects
 // of a successful login and must not block the auth response.
 (async () => {
 try {
 await prisma.loginAttempt.deleteMany({ where: { email } });
 await prisma.user.update({
 where: { id: user!.id },
 data: { loginCount: { increment: 1 }, lastLogin: new Date() },
 });
 await prisma.auditLog.create({
 data: {
 userId: user!.id,
 action: "login_success",
 resource: "auth",
 resourceId: user!.id,
 },
 });
 } catch {
 // Non-critical — do not surface to client
 }
 })();

 // ── Build session ──────────────────────────────────────────────────────────
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const u = user as any;
 const roles = u.userRoles.map((ur: { role: { name: string } }) => ur.role.name);
 const permissions = u.userRoles.flatMap((ur: { role: { permissions: { resource: string; action: string; scope?: string }[] } }) =>
 ur.role.permissions.map((p: { resource: string; action: string; scope?: string }) => ({
 resource: p.resource,
 action: p.action,
 scope: p.scope ?? "global",
 }))
 );

 const effectiveRoleLevel =
 user.teamMemberId !== null
 ? ROLE_LEVEL[user.role] ?? 1
 : user.userRoles.length > 0
 ? Math.min(...user!.userRoles.map((ur: { role: { level: number | null } }) => ur.role.level ?? 99))
 : ROLE_LEVEL[user.role] ?? 99;

 const accountType: "staff" | "customer" =
 effectiveRoleLevel <= 5 ? "staff" : "customer";

 const userAgent = req.headers.get("user-agent") ?? "";
 const deviceType = parseDeviceType(userAgent);

 const resolvedIsOnboarded = accountType === "staff" ? true : (user.isOnboarded ?? false);

 const { accessToken, refreshToken } = await createSession(user.id, {
 roleLevel: effectiveRoleLevel,
 email: user.email,
 name: user.name ?? "",
 role: user.role,
 roles,
 accessTags: user.teamMember?.accessTags ?? [],
  tabPermissions: user.teamMember?.tabPermissions ?? [],
 departmentId: user.teamMember?.departmentId ?? null,
 isDeptHead: (user.teamMember?.memberDepartments ?? []).some((md: { isDeptHead: boolean }) => md.isDeptHead) ?? false,
 accountType,
 isOnboarded: resolvedIsOnboarded,
 rank: user.teamMember?.rank ?? undefined,
 availableLp: user.teamMember?.availableLp ?? undefined,
 }, {
 deviceType,
 ipAddress,
 userAgent,
 });

 authLogger.withSLO("POST /api/admin/auth/login success", {
 endpoint: "/api/admin/auth/login",
 method: "POST",
 statusCode: 200,
 latencyMs: Date.now() - start,
 });

 // ── Build response ────────────────────────────────────────────────────────
 const response = NextResponse.json({
 user: {
 userId: user.id,
 email: user.email,
 name: user.name,
 avatar: user.avatar,
 role: user.role,
 roles,
 permissions,
 roleLevel: effectiveRoleLevel,
 accountType,
 teamMemberId: user.teamMemberId,
 accessTags: user.teamMember?.accessTags ?? [],
 tabPermissions: user.teamMember?.tabPermissions ?? [],
 departmentId: user.teamMember?.departmentId ?? null,
 isDeptHead: (user.teamMember?.memberDepartments ?? []).some((md: { isDeptHead: boolean }) => md.isDeptHead) ?? false,
 isOnboarded: resolvedIsOnboarded,
 rank: user.teamMember?.rank,
 availableLp: user.teamMember?.availableLp,
 },
 token: accessToken,
 refreshToken,
 });

 // ── Set cookies ────────────────────────────────────────────────────────────
 const cookieOptions = (maxAge: number) => ({
 httpOnly: true,
 secure: process.env.NODE_ENV === "production",
 sameSite: "strict" as const,
 maxAge,
 path: "/",
 });


  // Staff access token — HttpOnly, 24 hours
 // NOTE: Short TTL (5 min) + refresh was designed but the FE doesn't
 // implement auto-refresh. Set to 24h to avoid 401 after ~5 min.
 const ACCESS_TOKEN_TTL = 24 * 60 * 60;
 response.cookies.set("loop-staff-token", accessToken, cookieOptions(ACCESS_TOKEN_TTL));

 // Also keep legacy auth-token for backward compat during migration
 response.cookies.set("auth-token", accessToken, {
 ...cookieOptions(ACCESS_TOKEN_TTL),
 httpOnly: true,
 });

 // Refresh token — HttpOnly, 7 days
 response.cookies.set("refresh-token", refreshToken, cookieOptions(7 * 24 * 3600));

 // Clear customer token on staff login (prevent cross-account state)
 response.cookies.set("loop-customer-token", "", {
 httpOnly: true,
 secure: process.env.NODE_ENV === "production",
 sameSite: "strict",
 maxAge: 0,
 path: "/",
 });

 // Legacy flags (non-HttpOnly, FE reads these)
 response.cookies.set("auth-method", "credentials", {
 httpOnly: false,
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

 return response;
 } catch (err) {
 authLogger.withSLO("POST /api/admin/auth/login failed", {
 endpoint: "/api/admin/auth/login",
 method: "POST",
 statusCode: 500,
 latencyMs: Date.now() - start,
 error: err instanceof Error ? err.message : String(err),
 });

 if (isDbUnavailableError(err)) {
 return NextResponse.json(
 { error: "Không thể kết nối máy chủ. Vui lòng thử lại sau." },
 { status: 503 }
 );
 }
 return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
 }
}
