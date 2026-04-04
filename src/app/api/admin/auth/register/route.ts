import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";
import { createAuditLog } from "@/lib/auth/audit";
import { applyRateLimit } from "@/lib/rate-limit";
import { authLogger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const rateLimitResult = await applyRateLimit(req, "auth");
  if (!rateLimitResult.allowed) return rateLimitResult.response!;

  const start = Date.now();

  try {
    const { name, email, password, company } = await req.json();

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: "Họ tên, email và mật khẩu là bắt buộc" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Mật khẩu phải có ít nhất 8 ký tự" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email không hợp lệ" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      if (existing.googleId) {
        return NextResponse.json(
          { error: "Email này đã được đăng ký qua Google. Vui lòng đăng nhập bằng Google." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: "Email đã được sử dụng" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: "member",
        accountType: "customer",
        // Link to TeamMember if email matches an active member
        ...(await linkTeamMember(email.toLowerCase())),
      },
    });

    await createAuditLog({ userId: user.id, action: "register", resource: "auth", resourceId: user.id });

    const token = signToken({ userId: user.id, email: user.email, role: user.role, roles: ["member"], roleLevel: 5 });

    authLogger.withSLO("POST /api/admin/auth/register success", {
      endpoint: "/api/admin/auth/register",
      method: "POST",
      statusCode: 201,
      latencyMs: Date.now() - start,
    });

    const response = NextResponse.json(
      {
        user: {
          userId: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
        },
        token,
      },
      { status: 201 }
    );

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60,
      path: "/",
    });
    response.cookies.set("auth-method", "credentials", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err) {
    authLogger.withSLO("POST /api/admin/auth/register failed", {
      endpoint: "/api/admin/auth/register",
      method: "POST",
      statusCode: 500,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Lỗi hệ thống" }, { status: 500 });
  }
}

/** Auto-link to TeamMember if email matches an active member */
async function linkTeamMember(email: string) {
  const member = await prisma.teamMember.findFirst({
    where: { email: { mode: "insensitive", equals: email }, isActive: true },
    select: { id: true },
  });
  if (member) {
    return { teamMemberId: member.id, accountType: "staff" as const };
  }
  return {};
}
