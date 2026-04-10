import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { AUTH_COOKIES } from "@/lib/auth/roles";
import { applyRateLimit } from "@/lib/rate-limit";
import { authLogger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const rateLimitResult = await applyRateLimit(req, "auth");
  if (!rateLimitResult.allowed) return rateLimitResult.response!;

  const start = Date.now();

  try {
    const { name, email, password, phone } = await req.json();

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: "Họ tên và email và mật khẩu là bắt buộc" }, { status: 400 });
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

    // Check if email matches a TeamMember → auto-link staff account
    const teamMember = await prisma.teamMember.findFirst({
      where: { email: { mode: "insensitive", equals: email }, isActive: true },
      select: { id: true },
    });

    const isStaff = !!teamMember;
    const finalAccountType: "staff" | "customer" = isStaff ? "staff" : "customer";

    const created = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        phone: phone?.trim() || null,
        role: "member",
        accountType: finalAccountType,
        isOnboarded: false,
        loginCount: 1,
        lastLogin: new Date(),
        ...(teamMember ? { teamMemberId: teamMember.id } : {}),
      },
    });

    // Non-critical audit log
    prisma.auditLog.create({
      data: {
        userId: created.id,
        action: "register",
        resource: "auth",
        resourceId: created.id,
      },
    }).catch(() => { /* non-critical */ });

    const ipAddress = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? null;
    const userAgent = req.headers.get("user-agent") ?? null;

    const { accessToken, refreshToken } = await createSession(
      created.id,
      {
        roleLevel: 6,
        email: created.email,
        name: created.name,
        role: "member",
        roles: ["member"],
        accessTags: [],
        accountType: finalAccountType,
        isOnboarded: false,
      },
      { ipAddress: ipAddress ?? undefined, userAgent: userAgent ?? undefined }
    );

    authLogger.withSLO("POST /api/auth/register success", {
      endpoint: "/api/auth/register",
      method: "POST",
      statusCode: 201,
      latencyMs: Date.now() - start,
    });

    const response = NextResponse.json(
      {
        user: {
          userId: created.id,
          email: created.email,
          name: created.name,
          avatar: created.avatar,
          role: created.role,
          accountType: finalAccountType,
          isOnboarded: created.isOnboarded,
        },
      },
      { status: 201 }
    );

    response.cookies.set(AUTH_COOKIES.ACCESS_TOKEN, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60,
      path: "/",
    });
    response.cookies.set(AUTH_COOKIES.REFRESH_TOKEN, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });
    response.cookies.set(AUTH_COOKIES.AUTH_METHOD, "credentials", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err) {
    authLogger.withSLO("POST /api/auth/register failed", {
      endpoint: "/api/auth/register",
      method: "POST",
      statusCode: 500,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Lỗi hệ thống. Vui lòng thử lại sau." }, { status: 500 });
  }
}
