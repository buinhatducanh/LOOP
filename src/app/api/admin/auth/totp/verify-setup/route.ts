/**
 * POST /api/admin/auth/totp/verify-setup
 *
 * Finalize TOTP setup after user verifies the code from their authenticator app.
 *
 * Body: { secret, code, backupCodes }
 *
 * 1. Verify the code matches the provided secret
 * 2. Encrypt and store the secret in DB
 * 3. Store hashed backup codes
 * 4. Set totpEnabled = true
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import {
 verifyTotpCode,
 encryptTotpSecret,
 hashBackupCodes,
} from "@/lib/auth/totp";
import { authLogger } from "@/lib/logger";

export async function POST(req: NextRequest) {
 const start = Date.now();

 try {
 const session = await requireAuth();

 if (session.accountType !== "staff") {
 return NextResponse.json({ error: "Chỉ dành cho nhân viên" }, { status: 403 });
 }

 const { secret, code, backupCodes } = await req.json() as {
 secret?: string;
 code?: string;
 backupCodes?: string[];
 };

 if (!secret || !code || !backupCodes || backupCodes.length !== 8) {
 return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
 }

 // Step 1: Verify the TOTP code
 const valid = await verifyTotpCode(secret, code);
 if (!valid) {
 authLogger.withSLO("POST /api/admin/auth/totp/verify-setup", {
 endpoint: "/api/admin/auth/totp/verify-setup",
 method: "POST",
 statusCode: 400,
 latencyMs: Date.now() - start,
 userId: session.userId,
 error: "invalid_totp_code",
 });
 return NextResponse.json(
 { error: "Mã xác thực không đúng. Vui lòng kiểm tra đồng hồ trên điện thoại." },
 { status: 400 }
 );
 }

 // Step 2: Encrypt and store
 const encryptedSecret = encryptTotpSecret(secret);
 const hashedBackupCodes = hashBackupCodes(backupCodes);

 await prisma.user.update({
 where: { id: session.userId },
 data: {
 totpSecret: encryptedSecret,
 totpEnabled: true,
 totpBackupCodes: hashedBackupCodes,
 },
 });

 authLogger.withSLO("POST /api/admin/auth/totp/verify-setup", {
 endpoint: "/api/admin/auth/totp/verify-setup",
 method: "POST",
 statusCode: 200,
 latencyMs: Date.now() - start,
 userId: session.userId,
 });

 return NextResponse.json({
 ok: true,
 message: "Đã bật xác thực 2 lớp thành công!",
 });
 } catch (err) {
 const message = err instanceof Error ? err.message : "Server error";
 authLogger.withSLO("POST /api/admin/auth/totp/verify-setup", {
 endpoint: "/api/admin/auth/totp/verify-setup",
 method: "POST",
 statusCode: 500,
 latencyMs: Date.now() - start,
 error: message,
 });
 return NextResponse.json({ error: message }, { status: 500 });
 }
}
