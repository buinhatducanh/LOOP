import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  figmaUrl: z.string().min(1).optional(),
  status: z.enum(["pending", "approved", "rejected", "approved_by_client"]).optional(),
  clientEmail: z.string().email().optional().nullable(),
  versionHash: z.string().optional().nullable(),
  rejectionNote: z.string().optional().nullable(),
  approvedBy: z.string().optional().nullable(),
  approvedAt: z.string().transform(s => new Date(s)).optional().nullable(),
  sentAt: z.boolean().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("figmas", "read");
    const { id } = await params;
    const demo = await prisma.figmaDemo.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, orderNumber: true, customerName: true, customerEmail: true } },
      },
    });
    if (!demo) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: demo });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission("figmas", "update");
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

    const existing = await prisma.figmaDemo.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updateData: Record<string, unknown> = { ...parsed.data };

    // Mark sentAt when clientEmail is first set
    if (parsed.data.sentAt && parsed.data.clientEmail && !existing.sentAt) {
      updateData.sentAt = new Date();
    }
    delete updateData.sentAt;

    const demo = await prisma.figmaDemo.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, orderNumber: true, customerName: true } },
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "figmas",
      resourceId: id,
      oldValues: existing,
      newValues: parsed.data,
    });

    return NextResponse.json({ data: demo });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission("figmas", "delete");
    const { id } = await params;
    await prisma.figmaDemo.delete({ where: { id } });
    await createAuditLog({ userId: session.userId, action: "delete", resource: "figmas", resourceId: id });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
