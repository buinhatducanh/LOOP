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
import { requirePermissionFast, isSuperAdmin, requireAuth } from "@/lib/auth/permissions";
import { ok, handleError, notFound, badRequest } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(req);

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
      finalRoles = [],  // Array of role names chosen by CEO (multi-role support)
      finalTags = [],   // Tags chosen by CEO (optional override)
      notes,
    } = body;

    // Use CEO-chosen values, or fall back to proposed values
    // Support both legacy `finalRole` (single) and `finalRoles` (array)
    const legacyRole = body.finalRole as string | undefined;
    const approvedRoleNames: string[] =
      finalRoles.length > 0
        ? finalRoles
        : legacyRole
        ? [legacyRole]
        : [memberRequest.proposedRole];

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

    // Primary role = first in array (used for User.role scalar)
    const primaryRole = approvedRoleNames[0];

    if (!user) {
      // Create user with pending password set — they must set it via invite link
      user = await prisma.user.create({
        data: {
          email: memberRequest.email,
          name: memberRequest.name,
          role: primaryRole,
          accountType: "staff",
          isActive: true, // active but role limited until onboarding done
        },
      });
    } else {
      // Update existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          role: primaryRole,
          accountType: "staff",
          isActive: true,
        },
      });
    }

    // Find all roles in DB
    const roles = await prisma.role.findMany({
      where: { name: { in: approvedRoleNames } },
    });

    // Transaction: assign all roles + update request + create audit trail
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Remove all existing role assignments
      await tx.userRole.deleteMany({ where: { userId: user.id } });

      // Assign ALL roles from the array (multi-role support)
      if (roles.length > 0) {
        await tx.userRole.createMany({
          data: roles.map((r: typeof roles[number]) => ({
            userId: user.id,
            roleId: r.id,
            isActive: true,
            assignedBy: session.userId,
          })),
        });
      }

      // Audit trail: one entry per role
      await Promise.all(
        roles.map((r) =>
          tx.userRoleApproval.create({
            data: {
              userId: user.id,
              roleId: r.id,
              approvedBy: session.userId,
              approvedAt: new Date(),
              notes: notes ?? `CEO approved multi-role: ${approvedRoleNames.join(", ")}`,
            },
          })
        )
      );

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
            role: primaryRole,
            department: memberRequest.department,
            accessTags: allTags,
            requestStatus: "approved",
            isActive: true,
          },
        });

        // FIX P1-9: Auto-set as department head if no head exists yet (via MemberDepartment junction)
        if (memberRequest.department) {
          const dept = await tx.department.findUnique({
            where: { key: memberRequest.department },
            include: { memberDepartments: { where: { isDeptHead: true } } },
          });
          if (dept && dept.memberDepartments.length === 0) {
            await tx.memberDepartment.upsert({
              where: { memberId_departmentId: { memberId: teamMember.id, departmentId: dept.id } },
              update: { isDeptHead: true, isPrimary: true },
              create: { memberId: teamMember.id, departmentId: dept.id, isDeptHead: true, isPrimary: true },
            });
          }
        }
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
          message: `Đã duyệt nhân viên: ${memberRequest.name} (${memberRequest.email}) — Roles: ${approvedRoleNames.join(", ")}`,
          type: "member_approved",
        },
      });

      return _updated;
    });

    return ok({
      request: result,
      user,
      roles: approvedRoleNames,
      tags: allTags,
    });
  } catch (err) {
    return handleError(err);
  }
}
