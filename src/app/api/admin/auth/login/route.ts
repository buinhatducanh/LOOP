import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";
import { createAuditLog } from "@/lib/auth/audit";
import { cookies } from "next/headers";

// Pre-computed hash to use for timing-safe comparison when user doesn't exist
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

export async function POST(req: NextRequest) {
  let user: Awaited<ReturnType<typeof prisma.user.findUnique>> | null = null;

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email và mật khẩu là bắt buộc" },
        { status: 400 }
      );
    }

    user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: { include: { role: true } },
      },
    });

    // Always run password verification to prevent timing attacks
    const hashToCompare = user?.passwordHash || DUMMY_HASH;
    const valid = await verifyPassword(password, hashToCompare);

    if (!user || !user.passwordHash || !valid) {
      if (user) {
        await createAuditLog({
          userId: user.id,
          action: "login_failed",
          resource: "auth",
        });
      }
      return NextResponse.json(
        { error: "Email hoặc mật khẩu không đúng" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Tài khoản đã bị vô hiệu hoá" },
        { status: 403 }
      );
    }

    const roles = user.userRoles.map((ur) => ur.role.name);

    // Create JWT token for custom auth
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      roles,
    });

    await createAuditLog({
      userId: user.id,
      action: "login_success",
      resource: "auth",
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        roles,
      },
    });

    // Set auth token cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60, // 8 hours
      path: "/",
    });

    // Marker cookie to identify credentials auth (used by getSession to skip NextAuth path)
    response.cookies.set("auth-method", "credentials", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[/api/admin/auth/login]", err);
    // If DB is down, tell the user — don't confuse them with wrong password error
    if (isDbUnavailableError(err)) {
      return NextResponse.json(
        { error: "Không thể kết nối máy chủ. Vui lòng thử lại sau." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Lỗi hệ thống" },
      { status: 500 }
    );
  }
}
