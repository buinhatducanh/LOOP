/**
 * POST /api/auth/verify-otp
 *
 * Verifies a 6-digit OTP code.
 * If valid and not expired, returns a short-lived JWT that can be used
 * to reset the password (no login required).
 *
 * Anti-brute-force: max 5 wrong attempts per code, then invalidate it.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signResetToken } from "@/lib/auth/jwt";
import { handleError } from "@/lib/api";

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email và mã OTP là bắt buộc" }, { status: 400 });
    }

    const normalized = email.toLowerCase().trim();

    // Find the most recent unused password_reset OTP for this email
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        email: normalized,
        type: "password_reset",
        used: false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: "Mã OTP không tồn tại hoặc đã được sử dụng" },
        { status: 400 }
      );
    }

    // Check attempts
    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { used: true },
      });
      return NextResponse.json(
        { error: "Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới." },
        { status: 429 }
      );
    }

    // Check expiry
    if (new Date() > otpRecord.expiresAt) {
      return NextResponse.json(
        { error: "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới." },
        { status: 400 }
      );
    }

    // Verify code
    if (otpRecord.code !== code.trim()) {
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 },
      });
      const left = MAX_ATTEMPTS - otpRecord.attempts - 1;
      return NextResponse.json(
        { error: "Mã OTP không đúng", attemptsLeft: left },
        { status: 400 }
      );
    }

    // Code valid — mark as used
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    // Issue short-lived reset token (10 min, no login needed)
    const resetToken = signResetToken(normalized, otpRecord.id);

    return NextResponse.json({
      message: "Xác minh thành công",
      resetToken,
    });
  } catch (err) {
    return handleError(err);
  }
}
