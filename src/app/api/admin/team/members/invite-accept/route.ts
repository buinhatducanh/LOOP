/**
 * POST /api/admin/team/members/invite-accept
 *
 * Member accepts invite from email link:
 *   1. Validate invite token (MemberRequest + User)
 *   2. Set password
 *   3. Activate account
 *   4. Create session with access + refresh tokens
 *   5. Return JWT + redirect info
 *
 * Body: { token: string, password: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { ROLE_LEVEL } from "@/lib/auth/roles";
import { handleError } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = body;

    // ── Validate input ───────────────────────────────────────────────────────────
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "token không hợp lệ" }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Mật khẩu phải có ít nhất 8 ký tự" }, { status: 400 });
    }

    // ── Transaction: validate + activate atomically ────────────────────────────
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const memberRequest = await tx.memberRequest.findUnique({
        where: { inviteToken: token },
      });

      if (!memberRequest) {
        throw Object.assign(new Error("TOKEN_INVALID"), { status: 404 });
      }
      if (memberRequest.status === "approved") {
        throw Object.assign(new Error("ALREADY_ACTIVATED"), { status: 409 });
      }
      if (memberRequest.status === "rejected") {
        throw Object.assign(new Error("REQUEST_REJECTED"), { status: 403 });
      }
      if (memberRequest.inviteExpiresAt && memberRequest.inviteExpiresAt < new Date()) {
        throw Object.assign(new Error("TOKEN_EXPIRED"), { status: 410 });
      }

      // Double-use guard: user already exists with password
      const existingUser = await tx.user.findUnique({
        where: { email: memberRequest.email },
        select: { id: true, passwordHash: true },
      });
      if (existingUser?.passwordHash) {
        throw Object.assign(new Error("ALREADY_ACTIVATED"), { status: 409 });
      }

      const passwordHash = await hashPassword(password);

      let user;
      if (existingUser) {
        user = await tx.user.update({
          where: { id: existingUser.id },
          data: {
            passwordHash,
            name: memberRequest.name,
            isActive: true,
          },
        });
      } else {
        user = await tx.user.create({
          data: {
            email: memberRequest.email,
            name: memberRequest.name,
            passwordHash,
            role: memberRequest.proposedRole,
            accountType: "staff",
            isActive: true,
          },
        });
      }

      // Create session with access + refresh tokens
      const ipAddress = req.headers.get("x-forwarded-for")
        ?? req.headers.get("x-real-ip")
        ?? null;
      const userAgent = req.headers.get("user-agent") ?? null;
      const roleLevel = ROLE_LEVEL[user.role] ?? 5;

      const { accessToken } = await createSession(
        user.id,
        {
          roleLevel,
          email: user.email,
          name: user.name,
          role: user.role,
          roles: [user.role],
          accessTags: [],
          accountType: "staff",
          isOnboarded: true,
        },
        { ipAddress: ipAddress ?? undefined, userAgent: userAgent ?? undefined }
      );

      return { user, accessToken };
    });

    return NextResponse.json({
      message: "Tài khoản đã được kích hoạt",
      token: result.accessToken,
      user: {
        userId: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        accountType: "staff",
      },
    }, { status: 200 });
  } catch (err) {
    if (err instanceof Error && "status" in err) {
      const e = err as Error & { status: number };
      switch (e.message) {
        case "TOKEN_INVALID":
          return NextResponse.json({ error: "Link mời không hợp lệ hoặc đã hết hạn" }, { status: 404 });
        case "ALREADY_ACTIVATED":
          return NextResponse.json({ error: "Tài khoản đã được kích hoạt trước đó" }, { status: 409 });
        case "REQUEST_REJECTED":
          return NextResponse.json({ error: "Yêu cầu đã bị từ chối" }, { status: 403 });
        case "TOKEN_EXPIRED":
          return NextResponse.json({ error: "Link mời đã hết hạn (48 giờ)" }, { status: 410 });
      }
    }
    return handleError(err);
  }
}
