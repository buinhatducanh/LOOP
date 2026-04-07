/**
 * GET /api/admin/team/members/invite-accept/validate?token=xxx
 *
 * Validates an invite token without activating the account.
 * Returns member request info for display on register-with-token page.
 *
 * Body: none (token via query param)
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/lib/api";

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "token là bắt buộc" }, { status: 400 });
    }

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
        { error: "Yêu cầu đã bị từ chời từ chối" },
        { status: 403 }
      );
    }

    const isExpired = memberRequest.inviteExpiresAt
      ? memberRequest.inviteExpiresAt < new Date()
      : false;

    return NextResponse.json({
      email: memberRequest.email,
      name: memberRequest.name,
      department: memberRequest.department,
      proposedRole: memberRequest.proposedRole,
      status: memberRequest.status,
      isExpired,
      expiresAt: memberRequest.inviteExpiresAt?.toISOString() ?? null,
    });
  } catch (err) {
    return handleError(err);
  }
}
