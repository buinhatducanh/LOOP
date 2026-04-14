/**
 * POST /api/admin/auth/totp/setup
 *
 * Initiates TOTP 2FA setup for the current user.
 *
 * Flow:
 * 1. Generate TOTP secret + backup codes
 * 2. Return secret + backup codes (plaintext, shown only NOW)
 * 3. User verifies with authenticator app code
 * 4. User calls /verify-setup to enable TOTP
 *
 * Security: Requires authentication. Generates temp setup token (not stored in DB).
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/permissions";
import { generateTotpSetup } from "@/lib/auth/totp";
import { authLogger } from "@/lib/logger";

export async function POST(req: NextRequest) {
 const start = Date.now();

 try {
 const session = await requireAuth();

 if (session.accountType !== "staff") {
 return NextResponse.json({ error: "Chỉ dành cho nhân viên" }, { status: 403 });
 }

 const body = await req.json().catch(() => ({}));
 const { action } = body as { action?: string };

 if (action === "cancel") {
 // Just acknowledge cancel (no state stored on server yet)
 return NextResponse.json({ ok: true });
 }

 // Generate TOTP setup
 const setup = generateTotpSetup(session.email);

 authLogger.withSLO("POST /api/admin/auth/totp/setup", {
 endpoint: "/api/admin/auth/totp/setup",
 method: "POST",
 statusCode: 200,
 latencyMs: Date.now() - start,
 userId: session.userId,
 });

 return NextResponse.json({
 ok: true,
 secret: setup.secret,
 otpauthUrl: setup.otpauthUrl,
 backupCodes: setup.backupCodes,
 warning: "Hãy lưu lại các mã dự phòng! Chúng sẽ không hiển thị lại.",
 });
 } catch (err) {
 const message = err instanceof Error ? err.message : "Server error";
 authLogger.withSLO("POST /api/admin/auth/totp/setup", {
 endpoint: "/api/admin/auth/totp/setup",
 method: "POST",
 statusCode: 500,
 latencyMs: Date.now() - start,
 error: message,
 });
 return NextResponse.json({ error: message }, { status: 500 });
 }
}
