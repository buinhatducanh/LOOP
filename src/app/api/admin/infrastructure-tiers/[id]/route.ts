import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

// GET /api/admin/infrastructure-tiers/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("services", "read");
    const { id } = await params;

    const tier = await prisma.infrastructureTier.findUnique({ where: { id } });
    if (!tier) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ data: tier });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// PUT /api/admin/infrastructure-tiers/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("services", "update");
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.infrastructureTier.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.infrastructureTier.update({
      where: { id },
      data: {
        name:        body.name        ?? existing.name,
        nameVi:      body.nameVi      ?? existing.nameVi,
        monthlyCost: body.monthlyCost !== undefined ? parseInt(body.monthlyCost, 10) : existing.monthlyCost,
        setupCost:   body.setupCost   !== undefined ? parseInt(body.setupCost, 10)   : existing.setupCost,
        description:  body.description  ?? existing.description,
        descriptionVi: body.descriptionVi ?? existing.descriptionVi,
        icon:        body.icon        ?? existing.icon,
        color:       body.color       ?? existing.color,
        sortOrder:   body.sortOrder   !== undefined ? parseInt(body.sortOrder, 10) : existing.sortOrder,
        isActive:    body.isActive    ?? existing.isActive,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "infrastructure-tiers",
      resourceId: id,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: body,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// DELETE /api/admin/infrastructure-tiers/[id] (soft-delete = set isActive = false)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("services", "delete");
    const { id } = await params;

    const existing = await prisma.infrastructureTier.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.infrastructureTier.update({
      where: { id },
      data: { isActive: false },
    });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "infrastructure-tiers",
      resourceId: id,
      oldValues: existing as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
