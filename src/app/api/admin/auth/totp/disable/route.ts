/**
 * POST /api/admin/auth/totp/disable
 *
 * Disable TOTP 2FA for the current user.
 * Requires current password as confirmation.
 *
 * Body: { password, code } — code is required if TOTP is currently enabled.
 * Body: { password } — if TOTP is not enabled (no-op, return ok).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import { verifyPassword } from "@/lib/auth/password";
import { decryptTotpSecret, verifyTotpCode } from "@/lib/auth/totp";
import { authLogger } from "@/lib/logger";

export async function POST(req: NextRequest) {
 const start = Date.now();

 try {
 const session = await requireAuth();

 if (session.accountType !== "staff") {
 return NextResponse.json({ error: "Chỉ dành cho nhân viên" }, { status: 403 });
 }

 const { password, code } = await req.json() as { password?: string; code?: string };

 if (!password) {
 return NextResponse.json({ error: "Mật khẩu là bắt buộc" }, { status: 400 });
 }

 // Get user with password hash and TOTP status
 const user = await prisma.user.findUnique({
 where: { id: session.userId },
 select: { passwordHash: true, totpEnabled: true, totpSecret: true },
 });

 if (!user) {
 return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 404 });
 }

 // Verify password
 if (!user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
 return NextResponse.json({ error: "Mật khẩu không đúng" }, { status: 401 });
 }

 // If TOTP is enabled, require TOTP code
 if (user.totpEnabled) {
 if (!code) {
 return NextResponse.json(
 { error: "Mã xác thực 2FA là bắt buộc", requiresTotpCode: true },
 { status: 400 }
 );
 }

 if (!user.totpSecret) {
 return NextResponse.json({ error: "Cấu hình TOTP không hợp lệ" }, { status: 500 });
 }

 const decryptedSecret = decryptTotpSecret(user.totpSecret);
 if (!verifyTotpCode(decryptedSecret, code)) {
 authLogger.withSLO("POST /api/admin/auth/totp/disable", {
 endpoint: "/api/admin/auth/totp/disable",
 method: "POST",
 statusCode: 401,
 latencyMs: Date.now() - start,
 userId: session.userId,
 error: "invalid_totp",
 });
 return NextResponse.json({ error: "Mã xác thực 2FA không đúng" }, { status: 401 });
 }
 }

 // Disable TOTP
 await prisma.user.update({
 where: { id: session.userId },
 data: {
 totpSecret: null,
 totpEnabled: false,
 totpBackupCodes: null,
 },
 });

 authLogger.withSLO("POST /api/admin/auth/totp/disable", {
 endpoint: "/api/admin/auth/totp/disable",
 method: "POST",
 statusCode: 200,
 latencyMs: Date.now() - start,
 userId: session.userId,
 });

 return NextResponse.json({ ok: true, message: "Đã tắt xác thực 2 lớp." });
 } catch (err) {
 const message = err instanceof Error ? err.message : "Server error";
 authLogger.withSLO("POST /api/admin/auth/totp/disable", {
 endpoint: "/api/admin/auth/totp/disable",
 method: "POST",
 statusCode: 500,
 latencyMs: Date.now() - start,
 error: message,
 });
 return NextResponse.json({ error: message }, { status: 500 });
 }
}
