/**
 * POST /api/admin/team/members/pending/:id/approve
 *
 * CEO approves a pending member request:
 *  1. Find the MemberRequest
 *  2. Create User account (pending registration)
 *  3. Assign Role + Tags
 *  4. Update request status
 *  5. Send welcome notification
 */
import { NextRequest } from "next/server";
import { requirePermissionFast, isSuperAdmin } from "@/lib/auth/permissions";
import { ok, handleError, notFound, badRequest } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _session = await requireAuth();

    // Only CEO or super_admin can approve
    if (!isSuperAdmin(session)) {
      requirePermissionFast(session, "users", "create");
    }

    const { id } = await params;

    const memberRequest = await prisma.memberRequest.findUnique({
      where: { id },
    });

    if (!memberRequest) {
      return notFound("MemberRequest not found");
    }

    if (memberRequest.status !== "pending") {
      return badRequest(`Request đã ở trạng thái "${memberRequest.status}", không thể duyệt`);
    }

    const body = await req.json().catch(() => ({}));
    const {
      finalRole,       // Override role chosen by CEO (optional)
      finalTags = [],  // Tags chosen by CEO (optional override)
      notes,
    } = body;

    // Use CEO-chosen values, or fall back to proposed values
    const approvedRole = finalRole ?? memberRequest.proposedRole;
    const approvedTags = finalTags.length > 0
      ? finalTags
      : memberRequest.proposedTags;

    // Default tags always included
    const defaultTags = ["kanban", "order-basic"];
    const allTags = [...new Set([...defaultTags, ...approvedTags])];

    // Find or create the User
    let user = await prisma.user.findUnique({
      where: { email: memberRequest.email },
    });

    if (!user) {
      // Create user with pending password set — they must set it via invite link
      user = await prisma.user.create({
        data: {
          email: memberRequest.email,
          name: memberRequest.name,
          role: approvedRole,
          accountType: "staff",
          isActive: true, // active but role limited until onboarding done
        },
      });
    } else {
      // Update existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          role: approvedRole,
          accountType: "staff",
          isActive: true,
        },
      });
    }

    // Find the Role in DB
    const role = await prisma.role.findUnique({ where: { name: approvedRole } });

    // Transaction: assign role + update request + create audit trail
    const result = await prisma.$transaction(async (tx) => {
      // Remove existing role assignments
      await tx.userRole.deleteMany({ where: { userId: user.id } });

      // Assign new role
      if (role) {
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: role.id,
            isActive: true,
          },
        });
      }

      // Audit trail: who approved what
      await tx.userRoleApproval.create({
        data: {
          userId: user.id,
          roleId: role?.id ?? "",
          approvedBy: session.userId,
          approvedAt: new Date(),
          notes: notes ?? `CEO approved: ${approvedRole}`,
        },
      });

      // Create TeamMember if not exists
      const slug = memberRequest.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      let teamMember = await tx.teamMember.findUnique({ where: { slug } });
      if (!teamMember) {
        teamMember = await tx.teamMember.create({
          data: {
            slug,
            name: memberRequest.name,
            role: approvedRole,
            department: memberRequest.department,
            accessTags: allTags,
            requestStatus: "approved",
            isActive: true,
          },
        });
      } else {
        await tx.teamMember.update({
          where: { id: teamMember.id },
          data: {
            accessTags: allTags,
            requestStatus: "approved",
            isActive: true,
          },
        });
      }

      // Link User → TeamMember
      await tx.user.update({
        where: { id: user.id },
        data: { teamMemberId: teamMember.id },
      });

      // Update request status
      const _updated = await tx.memberRequest.update({
        where: { id },
        data: {
          status: "approved",
          userId: user.id,
          processedBy: session.userId,
          processedAt: new Date(),
        },
      });

      // Create notification for HR
      await tx.notification.create({
        data: {
          userId: session.userId, // sent by
          title: "Phê duyệt nhân sự",
          message: `Đã duyệt nhân viên: ${memberRequest.name} (${memberRequest.email}) — Role: ${approvedRole}`,
          type: "member_approved",
        },
      });

      return updated;
    });

    return ok({
      request: result,
      user,
      role: approvedRole,
      tags: allTags,
    });
  } catch (err) {
    return handleError(err);
  }
}
