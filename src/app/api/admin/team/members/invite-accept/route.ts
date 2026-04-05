/**
 * POST /api/admin/team/members/invite-accept
 *
 * Member accepts invite from email link:
 *   1. Validate invite token (MemberRequest + User)
 *   2. Set password
 *   3. Activate account
 *   4. Return JWT + redirect info
 *
 * Body: { token: string, password: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { signToken } from "@/lib/auth/jwt";
import { badRequest, handleError } from "@/lib/api";
import { ROLE_LEVEL } from "@/lib/auth/roles";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = body;

    // ── Validate input ───────────────────────────────────────────────────────────
    if (!token || typeof token !== "string") {
      return badRequest("token không hợp lệ");
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return badRequest("Mật khẩu phải có ít nhất 8 ký tự");
    }

    // ── Find MemberRequest by inviteToken ──────────────────────────────────────
    // inviteToken is @unique in schema — use findUnique for type safety
    const memberRequest = await prisma.memberRequest.findUnique({
      where: { inviteToken: token },
    });

    if (!memberRequest) {
      return NextResponse.json(
        { error: "Link mời không hợp lệ hoặc đã hết hạn" },
        { status: 404 }
      );
    }

    if (memberRequest.status === "approved") {
      return NextResponse.json(
        { error: "Tài khoản đã được kích hoạt trước đó" },
        { status: 409 }
      );
    }
    if (memberRequest.status === "rejected") {
      return NextResponse.json(
        { error: "Yêu cầu đã bị từ chối" },
        { status: 403 }
      );
    }

    if (memberRequest.inviteExpiresAt && memberRequest.inviteExpiresAt < new Date()) {
      return NextResponse.json(
        { error: "Link mời đã hết hạn (48 giờ)" },
        { status: 410 }
      );
    }

    // ── Find or validate User ───────────────────────────────────────────────────
    let user = await prisma.user.findUnique({
      where: { email: memberRequest.email },
    });

    if (user && user.passwordHash) {
      return NextResponse.json(
        { error: "Tài khoản đã có mật khẩu. Vui lòng đăng nhập." },
        { status: 409 }
      );
    }

    // ── Set password + activate account ────────────────────────────────────────
    const passwordHash = await hashPassword(password);

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          name: memberRequest.name,
          isActive: true,
        },
      });
    } else {
      // Create new user (shouldn't happen in normal flow, but handle gracefully)
      user = await prisma.user.create({
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

    // ── Sign JWT for auto-login ──────────────────────────────────────────────────
    const jwtToken = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      roles: [user.role],
      roleLevel: ROLE_LEVEL[user.role] ?? 5,
      accountType: "staff",
    });

    return NextResponse.json({
      message: "Tài khoản đã được kích hoạt",
      token: jwtToken,
      user: {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        accountType: "staff",
      },
    });
  } catch (err) {
    return handleError(err);
  }
}
