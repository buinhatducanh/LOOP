/**
 * POST /api/admin/team/invite
 *
 * Sends a team invite email to a newly created or existing team member.
 * Admin can call this from the Members page after creating a member,
 * or to resend an invite to a member who hasn't logged in yet.
 *
 * Request body:
 *   { memberId: string }
 *
 * Response:
 *   { success: true, sentTo: "email@example.com" }
 *   { success: false, error: "..." }
 */
import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { handleError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { signInviteToken, buildInviteUrl } from "@/lib/auth/invite-token";
import { sendTeamInviteEmail } from "@/lib/email/team-invite";

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("team", "read");
    const body = await req.json();

    const { memberId } = body as { memberId: string };

    if (!memberId || typeof memberId !== "string") {
      return NextResponse.json(
        { success: false, error: "memberId is required" },
        { status: 400 }
      );
    }

    // 1. Load member
    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        user: { select: { id: true } }, // check if already linked
      },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy thành viên" },
        { status: 404 }
      );
    }

    if (!member.email) {
      return NextResponse.json(
        { success: false, error: "Thành viên chưa có email. Vui lòng cập nhật email trước." },
        { status: 400 }
      );
    }

    if (!member.isActive) {
      return NextResponse.json(
        { success: false, error: "Tài khoản đang bị vô hiệu hóa" },
        { status: 400 }
      );
    }

    if (member.user) {
      return NextResponse.json(
        { success: false, error: "Thành viên đã có tài khoản và đăng nhập rồi" },
        { status: 409 }
      );
    }

    // 2. Get inviter info
    const inviterName = session.name ?? "LOOP Admin";
    const inviterEmail = session.email ?? "hello@loop.vn";

    // 3. Sign invite token (7-day TTL)
    const token = await signInviteToken({
      memberId: member.id,
      email: member.email,
      inviterId: session.userId,
      inviterName,
      inviterEmail,
      memberName: member.name,
    });

    // 4. Build invite URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://loops.vn";
    const inviteUrl = buildInviteUrl(token, baseUrl);

    // 5. Send email via Resend
    const deptLabels: Record<string, string> = {
      engineering: "Phòng Kỹ thuật",
      design: "Phòng Thiết kế",
      media: "Phòng Media",
      marketing: "Phòng Marketing",
      sales: "Phòng Kinh doanh",
      finance: "Phòng Tài chính",
      hr: "Phòng Nhân sự",
      management: "Ban Quản lý",
    };

    const result = await sendTeamInviteEmail({
      memberName: member.name,
      memberEmail: member.email,
      inviterName,
      inviterEmail,
      department: deptLabels[member.department] ?? member.department,
      role: member.role,
      inviteUrl,
      expiresDays: 7,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: `Gửi email thất bại: ${result.error}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, sentTo: member.email },
      { status: 200 }
    );
  } catch (err) {
    return handleError(err);
  }
}
