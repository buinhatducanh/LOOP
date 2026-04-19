import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { handleError, ok, notFound } from "@/lib/api";
import { AuthError, isSuperAdmin } from "@/lib/auth/permissions";
import { isCeo } from "@/lib/auth/roles";

// PUT /api/admin/permissions/[memberId]
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const session = await requireAuth();
    if (!isCeo(session.role) && !isSuperAdmin(session)) {
      throw new AuthError("Only CEO or super admin can assign permissions", 403);
    }

    const { memberId } = await params;
    const body = await req.json();
    const { tabPermissions, departmentId, isDeptHead, systemRole, roleLevel } = body;

    const member = await prisma.teamMember.findUnique({ where: { id: memberId } });
    if (!member) return notFound("Member not found");

    // Audit log
    await prisma.permissionAudit.create({
      data: {
        targetUserId: memberId,
        grantedBy: session.userId,
        permission: tabPermissions != null ? "tab_permissions" : (isDeptHead != null ? "dept_head" : "tab_permissions"),
        department: departmentId ?? null,
        action: isDeptHead === true ? "grant_dept_head" : (isDeptHead === false ? "revoke_dept_head" : "set"),
      },
    }).catch(() => { /* audit log non-critical */ });

    // Update member fields (isDeptHead is now managed via MemberDepartment junction, not TeamMember)
    const updated = await prisma.teamMember.update({
      where: { id: memberId },
      data: {
        ...(tabPermissions !== undefined && { tabPermissions: tabPermissions ?? [] }),
        ...(departmentId !== undefined && { departmentId: departmentId ?? null }),
        ...(systemRole !== undefined && { role: systemRole ?? member.role }),
        ...(roleLevel !== undefined && { roleLevel: roleLevel ?? member.roleLevel }),
      },
    });

    // Handle isDeptHead via MemberDepartment junction
    if (isDeptHead !== undefined && departmentId) {
      // Clear all existing heads in this department first
      await prisma.memberDepartment.updateMany({
        where: { departmentId, isDeptHead: true },
        data: { isDeptHead: false },
      }).catch(() => { /* ignore */ });

      if (isDeptHead === true) {
        // Set this member as head of the department
        await prisma.memberDepartment.upsert({
          where: { memberId_departmentId: { memberId, departmentId } },
          update: { isDeptHead: true, isPrimary: true },
          create: { memberId, departmentId, isDeptHead: true, isPrimary: true },
        });
      }
    }

    // Read back isDeptHead from junction for the primary department
    const primaryJunction = await prisma.memberDepartment.findFirst({
      where: { memberId, isPrimary: true },
      select: { isDeptHead: true },
    });

    return ok({
      id: updated.id,
      name: updated.name ?? "",
      role: updated.role ?? "",
      roleLevel: updated.roleLevel ?? 4,
      departmentId: updated.departmentId ?? null,
      isDeptHead: primaryJunction?.isDeptHead ?? false,
      tabPermissions: updated.tabPermissions ?? [],
    });
  } catch (err) {
    return handleError(err);
  }
}
