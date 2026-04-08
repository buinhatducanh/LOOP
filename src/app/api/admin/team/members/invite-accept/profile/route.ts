/**
 * POST /api/admin/team/members/invite-accept/profile
 *
 * Member completes onboarding profile setup after activating account.
 * Updates TeamMember fields (avatar, bio, phone, social links, etc.)
 * EXCLUDES: email, name — these are set by HR/CEO during onboarding request.
 *
 * Auth: requires valid Bearer token (member registers via invite-accept first).
 *
 * Body: { token, avatar?, bio?, phone?, linkedin?, twitter?, github?, image? }
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import { handleError } from "@/lib/api";
import { ok } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);

    // Only staff members can use this endpoint
    if (session.accountType !== "staff") {
      return NextResponse.json({ error: "Chỉ dành cho nhân viên" }, { status: 403 });
    }

    if (!session.teamMemberId) {
      return NextResponse.json({ error: "Không tìm thấy hồ sơ thành viên" }, { status: 404 });
    }

    const body = await req.json();
    const { avatar, bio, phone, linkedin, twitter, github, shortBio } = body;

    // Fields that HR/CEO set — NOT editable by member
    const FORBIDDEN = ["email", "name", "role", "department", "slug", "isActive"];
    const forbidden = Object.keys(body).filter((k) => FORBIDDEN.includes(k));
    if (forbidden.length > 0) {
      return NextResponse.json(
        { error: `Không thể cập nhật: ${forbidden.join(", ")}` },
        { status: 400 }
      );
    }

    // Build update payload — only allowlisted fields
    const updateData: Record<string, unknown> = {};

    if (avatar !== undefined)       updateData.image = avatar === "" ? null : avatar;
    if (bio !== undefined)          updateData.bio = bio === "" ? null : bio;
    if (phone !== undefined)        updateData.phone = phone === "" ? null : phone;
    if (linkedin !== undefined)     updateData.linkedin = linkedin === "" ? null : linkedin;
    if (twitter !== undefined)      updateData.twitter = twitter === "" ? null : twitter;
    if (github !== undefined)       updateData.github = github === "" ? null : github;
    if (shortBio !== undefined)     updateData.shortBio = shortBio === "" ? null : shortBio;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Không có trường nào được cập nhật" }, { status: 400 });
    }

    const member = await prisma.teamMember.update({
      where: { id: session.teamMemberId },
      data: updateData,
    });

    return ok({ data: member });
  } catch (err) {
    return handleError(err);
  }
}
