/**
 * POST /api/auth/reset-password
 *
 * Resets the user's password using a valid reset token from /verify-otp.
 * The token proves the user owns the email and passed OTP verification.
 *
 * Body: { resetToken: string; newPassword: string }
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/jwt";
import { hashPassword } from "@/lib/auth/password";
import { sendPasswordChangedNotification } from "@/lib/email";
import { handleError } from "@/lib/api";

export async function POST(_req: NextRequest) {
  try {
    const { resetToken, newPassword } = await req.json();

    if (!resetToken || !newPassword) {
      return NextResponse.json(
        { error: "Token và mật khẩu mới là bắt buộc" },
        { status: 400 }
      );
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Mật khẩu phải có ít nhất 8 ký tự" },
        { status: 400 }
      );
    }

    // Verify reset token
    const payload = verifyToken(resetToken);
    if (!payload) {
      return NextResponse.json(
        { error: "Token không hợp lệ hoặc đã hết hạn" },
        { status: 401 }
      );
    }

    if ((payload as unknown as Record<string, unknown>).purpose !== "password_reset") {
      return NextResponse.json(
        { error: "Token không hợp lệ cho thao tác này" },
        { status: 401 }
      );
    }

    const { email, otpId } = payload as unknown as { email: string; otpId: string; purpose: string };

    // Double-check: OTP record must be marked as used
    const otpRecord = await prisma.otpCode.findUnique({ where: { id: otpId } });
    if (!otpRecord || !otpRecord.used) {
      return NextResponse.json(
        { error: "Vui lòng xác minh OTP trước" },
        { status: 401 }
      );
    }

    // Hash and update password
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    // Send security notification email
    await sendPasswordChangedNotification(email);

    return NextResponse.json({ message: "Đặt lại mật khẩu thành công" });
  } catch (err) {
    return handleError(err);
  }
}
