import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { AUTH_COOKIES } from "@/lib/auth/roles";
import { createAuditLog } from "@/lib/auth/audit";
import { applyRateLimit } from "@/lib/rate-limit";
import { authLogger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const rateLimitResult = await applyRateLimit(req, "auth");
  if (!rateLimitResult.allowed) return rateLimitResult.response!;

  const start = Date.now();

  try {
    const { name, email, password, company, businessType, phone } = await req.json();

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

    // Resolve async teamMember link before spreading into create data
    const teamMemberLink = await linkTeamMember(email.toLowerCase());

    // ⚠️ FIX: wrap user create + audit log in a transaction.
    // If audit log fails, we still have the user — but this ensures audit
    // is committed atomically with the create when both succeed.
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          passwordHash,
          phone: phone?.trim() || null,
          companyName: company?.trim() || null,
          businessType: businessType?.trim() || null,
          role: "member",
          accountType: "customer",
          isOnboarded: false,
          loginCount: 1, // first "login" = registration
          lastLogin: new Date(),
          ...teamMemberLink,
        },
      });
      await tx.auditLog.create({
        data: {
          userId: created.id,
          action: "register",
          resource: "auth",
          resourceId: created.id,
        },
      });
      return created;
    });

    // Determine actual accountType after teamMember link resolution
    const finalAccountType: "staff" | "customer" =
      teamMemberLink.teamMemberId ? "staff" : "customer";

    const ipAddress = req.headers.get("x-forwarded-for")
      ?? req.headers.get("x-real-ip")
      ?? null;
    const userAgent = req.headers.get("user-agent") ?? null;

    const { accessToken, refreshToken } = await createSession(
      user.id,
      {
        roleLevel: 5,
        email: user.email,
        name: user.name,
        role: "member",
        roles: ["member"],
        accessTags: [],
        accountType: finalAccountType,
        isOnboarded: false,
      },
      { ipAddress: ipAddress ?? undefined, userAgent: userAgent ?? undefined }
    );

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
          isOnboarded: user.isOnboarded,
        },
        token: accessToken,
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
