/**
 * GET  /api/admin/team/members/me  — Get current member's own profile
 * PUT  /api/admin/team/members/me  — Update current member's own profile
 *
 * Self-service: member can edit their name, avatar, phone, bio, social links.
 * Fields protected (admin-only): role, department, rank, level, LP, accessTags.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/permissions";
import { ok, handleError, badRequest, notFound } from "@/lib/api/response";
import { addAvatar } from "@/lib/api/mappings";
import { prisma } from "@/lib/prisma";

/** Fields a member can update on their own profile */
const SELF_EDITABLE_FIELDS = [
  "name", "phone", "bio", "location",
  "facebook", "linkedin", "github", "website",
];

/** Fields only admin can change */
const PROTECTED_FIELDS = [
  "role", "department", "rank", "level", "accessTags",
  "availableLp", "lockedLp", "totalXp", "isActive", "slug",
];

export async function GET(_req: NextRequest) {
  try {
    const session = await requireAuth();

    if (!session.teamMemberId) {
      return NextResponse.json(
        { error: "Tài khoản này chưa được liên kết với hồ sơ nhân viên" },
        { status: 403 }
      );
    }

    const member = await prisma.teamMember.findUnique({
      where: { id: session.teamMemberId },
      include: {
        memberExpertise: {
          include: { expertise: true },
          orderBy: { level: "desc" },
        },
      },
    });

    if (!member) {
      return notFound("Không tìm thấy hồ sơ nhân viên");
    }

    return ok(addAvatar(member));
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireAuth();

    if (!session.teamMemberId) {
      return NextResponse.json(
        { error: "Tài khoản này chưa được liên kết với hồ sơ nhân viên" },
        { status: 403 }
      );
    }

    const body = await req.json();

    // ── Protect admin-only fields ───────────────────────────────────────────────
    const attemptedProtected = PROTECTED_FIELDS.filter(
      (f) => f in body
    );
    if (attemptedProtected.length > 0) {
      return badRequest(
        `Không có quyền thay đổi: ${attemptedProtected.join(", ")}`
      );
    }

    // ── Build update data (only self-editable fields) ───────────────────────────
    const updateData: Record<string, unknown> = {};
    for (const field of SELF_EDITABLE_FIELDS) {
      if (field in body) {
        // Convert empty string to null for optional text fields
        updateData[field] = body[field] === "" ? null : body[field];
      }
    }

    // Handle avatar separately (it's on User, not TeamMember)
    const { avatar, ...restBody } = body;
    void restBody;

    // ── Update User avatar if provided ─────────────────────────────────────────
    if (typeof avatar === "string") {
      await prisma.user.update({
        where: { id: session.userId },
        data: { avatar },
      });
    }

    // ── Update TeamMember ───────────────────────────────────────────────────────
    if (Object.keys(updateData).length === 0) {
      return badRequest("Không có trường nào hợp lệ để cập nhật");
    }

    const updated = await prisma.teamMember.update({
      where: { id: session.teamMemberId },
      data: updateData,
      include: {
        memberExpertise: {
          include: { expertise: true },
          orderBy: { level: "desc" },
        },
      },
    });

    return ok(addAvatar(updated));
  } catch (err) {
    return handleError(err);
  }
}
