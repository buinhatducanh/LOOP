import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";
import { createAuditLog } from "@/lib/auth/audit";

// Pre-computed hash to use for timing-safe comparison when user doesn't exist
const DUMMY_HASH = "$2a$12$LJ3m4ys3Rl3hPcyFSevMnuGHvZw7KLEqKl6.s8EWYFONbJdRe0Gu2";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email và mật khẩu là bắt buộc" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
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

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60, // 8 hours
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Lỗi hệ thống" },
      { status: 500 }
    );
  }
}
