/**
 * POST /api/auth/forgot-password
 *
 * Generates a 6-digit OTP and sends it to the user's email.
 * If the email doesn't exist in our DB, we still return success
 * (to prevent email enumeration attacks).
 *
 * Rate limited: 3 requests per IP per 15 minutes.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetOtp } from "@/lib/email";
import { applyRateLimit } from "@/lib/rate-limit";
import { handleError } from "@/lib/api";

const OTP_DIGITS = 6;
const OTP_VALID_MINUTES = 5;
const MAX_OTP_PER_EMAIL_PER_DAY = 5;

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  // Rate limit
  const rateLimit = await applyRateLimit(req, "auth");
  if (!rateLimit.allowed) return rateLimit.response!;

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Email không hợp lệ" }, { status: 400 });
    }

    const normalized = email.toLowerCase().trim();

    // Check if user exists (but don't reveal it)
    const user = await prisma.user.findUnique({
      where: { email: normalized },
      select: { id: true, email: true },
    });

    // Always generate and store an OTP, even if user doesn't exist.
    // This prevents attackers from knowing which emails are registered.
    const code = generateCode();
    const expiresAt = new Date(Date.now() + OTP_VALID_MINUTES * 60 * 1000);

    // Invalidate any existing unused password_reset OTPs for this email
    await prisma.otpCode.updateMany({
      where: { email: normalized, type: "password_reset", used: false },
      data: { used: true },
    });

    // Count today's OTP requests for this email
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCount = await prisma.otpCode.count({
      where: { email: normalized, type: "password_reset", createdAt: { gte: todayStart } },
    });
    if (todayCount >= MAX_OTP_PER_EMAIL_PER_DAY) {
      return NextResponse.json(
        { error: "Bạn đã yêu cầu quá nhiều mã. Vui lòng thử lại sau 24 giờ." },
        { status: 429 }
      );
    }

    // Store OTP (plain text for now — can be hashed if needed)
    await prisma.otpCode.create({
      data: {
        email: normalized,
        code,          // In production, hash this with bcrypt
        type: "password_reset",
        expiresAt,
        userId: user?.id ?? null,
      },
    });

    // Send email
    if (user) {
      await sendPasswordResetOtp(normalized, code, OTP_VALID_MINUTES);
    }

    return NextResponse.json({
      message: "Mã OTP đã được gửi đến email của bạn",
      // DEV ONLY: include code in response for testing
      ...(process.env.NODE_ENV === "development" ? { _dev_code: code } : {}),
    });
  } catch (err) {
    return handleError(err);
  }
}
