import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { hashPassword } from "@/lib/auth/password";
import { createAuditLog } from "@/lib/auth/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("users", "read");
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        userRoles: { include: { role: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("users", "update");
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.name) updateData.name = body.name;
    if (body.email) updateData.email = body.email;
    if (body.role) updateData.role = body.role;
    if (body.avatar !== undefined) updateData.avatar = body.avatar;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.password) updateData.passwordHash = await hashPassword(body.password);

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Update role assignments if provided
    if (body.roleIds) {
      await prisma.userRole.deleteMany({ where: { userId: id } });
      if (body.roleIds.length > 0) {
        await prisma.userRole.createMany({
          data: body.roleIds.map((roleId: string) => ({ userId: id, roleId })),
        });
      }
    }

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "users",
      resourceId: id,
      oldValues: { name: existing.name, email: existing.email, role: existing.role },
      newValues: updateData,
    });

    return NextResponse.json({ data: user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("users", "delete");
    const { id } = await params;

    if (id === session.userId) {
      return NextResponse.json(
        { error: "Không thể xoá chính mình" },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "users",
      resourceId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
