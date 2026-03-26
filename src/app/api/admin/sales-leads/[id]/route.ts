import { ok, handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

const updateSchema = z.object({
  source: z.string().optional(),
  customerName: z.string().min(1).optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerPhone: z.string().optional().or(z.literal("")),
  companyName: z.string().optional().or(z.literal("")),
  area: z.string().optional(),
  tier: z.string().optional(),
  status: z.string().optional(),
  note: z.string().optional(),
  estimatedBudget: z.number().int().positive().optional(),
  assignedTo: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("sales-leads", "read");
    const { id } = await params;

    const lead = await prisma.salesLead.findUnique({
      where: { id },
      include: {
        quotes: {
          orderBy: { createdAt: "desc" },
          include: { salesLead: { select: { customerName: true } } },
        },
        orders: {
          orderBy: { createdAt: "desc" },
          select: { id: true, orderNumber: true, status: true, totalAmount: true, customerName: true },
        },
      },
    });

    if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: lead });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("sales-leads", "update");
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const existing = await prisma.salesLead.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const lead = await prisma.salesLead.update({
      where: { id },
      data: {
        ...(parsed.data.source !== undefined && { source: parsed.data.source }),
        ...(parsed.data.customerName !== undefined && { customerName: parsed.data.customerName }),
        ...(parsed.data.customerEmail !== undefined && { customerEmail: parsed.data.customerEmail || null }),
        ...(parsed.data.customerPhone !== undefined && { customerPhone: parsed.data.customerPhone || null }),
        ...(parsed.data.companyName !== undefined && { companyName: parsed.data.companyName || null }),
        ...(parsed.data.area !== undefined && { area: parsed.data.area }),
        ...(parsed.data.tier !== undefined && { tier: parsed.data.tier }),
        ...(parsed.data.status !== undefined && { status: parsed.data.status }),
        ...(parsed.data.note !== undefined && { note: parsed.data.note || null }),
        ...(parsed.data.estimatedBudget !== undefined && { estimatedBudget: parsed.data.estimatedBudget }),
        ...(parsed.data.assignedTo !== undefined && { assignedTo: parsed.data.assignedTo }),
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "sales-leads",
      resourceId: id,
      oldValues: existing,
      newValues: body,
    });

    return NextResponse.json({ data: lead });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("sales-leads", "delete");
    const { id } = await params;

    const existing = await prisma.salesLead.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.salesLead.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "sales-leads",
      resourceId: id,
    });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
