import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

// GET /api/admin/service-tiers/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("services", "read");
    const { id } = await params;
    const tier = await prisma.serviceTier.findUnique({ where: { id } });
    if (!tier) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: tier });
  } catch (error) {
    return handleError(error);
  }
}

// PUT /api/admin/service-tiers/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission("services", "update");
    const { id } = await params;
    const data = await req.json();

    const tier = await prisma.serviceTier.update({ where: { id }, data });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "service_tiers",
      resourceId: tier.id,
      newValues: data,
    });

    return NextResponse.json({ data: tier });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE /api/admin/service-tiers/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission("services", "delete");
    const { id } = await params;
    await prisma.serviceTier.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "service_tiers",
      resourceId: id,
    });

    return NextResponse.json({ data: { id } });
  } catch (error) {
    return handleError(error);
  }
}
