import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { UserGetPayload } from "@/generated/prisma/models/User";
import { verifyPassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";
import { createAuditLog } from "@/lib/auth/audit";
import { cookies } from "next/headers";
import { ROLE_LEVEL } from "@/lib/auth/roles";

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
  let user: UserGetPayload<{ include: { userRoles: { include: { role: true } } } }> | null = null;

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
        userRoles: { include: { role: { include: { permissions: true } } } },
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

    // Build granular permissions from role-permission join table
    const permissions = user.userRoles.flatMap((ur) =>
      ur.role.permissions.map((p) => ({
        resource: p.resource,
        action: p.action,
        scope: p.scope ?? "global",
      }))
    );

    // Derive roleLevel from the junction table (UserRole → Role),
    // NOT from User.role (which is a denormalized default field).
    // Use the MOST PRIVILEGED role level (lowest number) among all assigned roles.
    const roleLevel = user.userRoles.reduce(
      (min, ur) => Math.min(min, ur.role.level ?? 99),
      99
    );

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
        userId: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        roles,
        permissions,
        roleLevel,
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
