import { handleError, ok } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

// GET — list project members for an Order project
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("project-members", "read");
    const { id } = await params;

    const projectMembers = await prisma.projectMember.findMany({
      where: { projectId: id },
      include: {
        member: { select: { id: true, name: true, email: true, role: true, image: true } },
        projectRole: true,
      },
      orderBy: { joinedAt: "asc" },
    });

    return NextResponse.json({
      data: projectMembers.map((pm) => ({
        id: pm.id,
        memberId: pm.memberId,
        projectRoleKey: pm.projectRoleKey,
        assignedLp: pm.assignedLp,
        earnedLp: pm.earnedLp,
        exp: pm.exp,
        joinedAt: pm.joinedAt,
        member: { ...pm.member, avatar: pm.member.image },
        projectRole: pm.projectRole
          ? { key: pm.projectRole.key, label: pm.projectRole.label, color: pm.projectRole.color }
          : null,
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}

// POST — assign a member to the project with a role
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("project-members", "create");
    const { id: projectId } = await params;
    const { memberId, projectRoleKey } = await req.json();

    if (!memberId || !projectRoleKey) {
      return NextResponse.json({ error: "memberId and projectRoleKey are required" }, { status: 400 });
    }

    const role = await prisma.projectRole.findUnique({ where: { key: projectRoleKey } });
    if (!role || !role.isActive) {
      return NextResponse.json({ error: `Invalid or inactive projectRoleKey "${projectRoleKey}"` }, { status: 400 });
    }

    const existing = await prisma.projectMember.findFirst({ where: { projectId, memberId } });
    if (existing) {
      return NextResponse.json({ error: "Member is already assigned to this project" }, { status: 409 });
    }

    const pm = await prisma.projectMember.create({
      data: { memberId, projectRoleKey, projectId },
      include: {
        member: { select: { id: true, name: true, email: true, role: true, image: true } },
        projectRole: true,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "project-members",
      resourceId: pm.id,
      newValues: { memberId, projectRoleKey, projectId },
    });

    return ok(
      {
        id: pm.id,
        memberId: pm.memberId,
        projectRoleKey: pm.projectRoleKey,
        assignedLp: pm.assignedLp,
        earnedLp: pm.earnedLp,
        exp: pm.exp,
        joinedAt: pm.joinedAt,
        member: { ...pm.member, avatar: pm.member.image },
        projectRole: pm.projectRole
          ? { key: pm.projectRole.key, label: pm.projectRole.label, color: pm.projectRole.color }
          : null,
      },
      201
    );
  } catch (error) {
    return handleError(error);
  }
}

// PATCH — update member's projectRoleKey or assignedLp
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("project-members", "update");
    const { id: projectId } = await params;
    const { memberId, projectRoleKey, assignedLp } = await req.json();

    if (!memberId) {
      return NextResponse.json({ error: "memberId is required" }, { status: 400 });
    }

    if (projectRoleKey !== undefined) {
      const role = await prisma.projectRole.findUnique({ where: { key: projectRoleKey } });
      if (!role || !role.isActive) {
        return NextResponse.json({ error: `Invalid or inactive projectRoleKey "${projectRoleKey}"` }, { status: 400 });
      }
    }

    const existing = await prisma.projectMember.findFirst({ where: { projectId, memberId } });
    if (!existing) {
      return NextResponse.json({ error: "Project member not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (projectRoleKey !== undefined) updateData.projectRoleKey = projectRoleKey;
    if (assignedLp !== undefined) updateData.assignedLp = assignedLp;

    const updated = await prisma.projectMember.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        member: { select: { id: true, name: true, email: true, role: true, image: true } },
        projectRole: true,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "project-members",
      resourceId: existing.id,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: updateData,
    });

    return ok({
      id: updated.id,
      memberId: updated.memberId,
      projectRoleKey: updated.projectRoleKey,
      assignedLp: updated.assignedLp,
      earnedLp: updated.earnedLp,
      exp: updated.exp,
      joinedAt: updated.joinedAt,
      member: { ...updated.member, avatar: updated.member.image },
      projectRole: updated.projectRole
        ? { key: updated.projectRole.key, label: updated.projectRole.label, color: updated.projectRole.color }
        : null,
    });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE — remove member from project
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("project-members", "delete");
    const { id: projectId } = await params;
    const { memberId } = await req.json();

    if (!memberId) {
      return NextResponse.json({ error: "memberId is required" }, { status: 400 });
    }

    const existing = await prisma.projectMember.findFirst({ where: { projectId, memberId } });
    if (!existing) {
      return NextResponse.json({ error: "Project member not found" }, { status: 404 });
    }

    await prisma.projectMember.delete({ where: { id: existing.id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "project-members",
      resourceId: existing.id,
      oldValues: existing as unknown as Record<string, unknown>,
    });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
