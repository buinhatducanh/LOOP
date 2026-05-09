import { handleError, ok } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  totalAmount: z.number().int().min(0).optional(),
  lpAllocation: z.record(z.string(), z.number()).optional(),
  milestones: z.array(z.object({
    name: z.string(),
    amount: z.number(),
    dueDate: z.string().optional(),
  })).optional(),
  /** Feature IDs for auto-pricing */
  selectedFeatureIds: z.array(z.string()).optional(),
  /** Infrastructure tier slug for auto-pricing */
  infrastructureTierSlug: z.string().optional().nullable(),
  /** Infrastructure tier ID for auto-pricing */
  infrastructureTierId: z.string().optional().nullable(),
  status: z.enum(["draft", "sent", "viewed", "approved", "signed", "rejected", "expired", "cancelled"]).optional(),
  validUntil: z.string().transform(s => new Date(s)).optional().or(z.literal("")),
  sentAt: z.string().transform(s => new Date(s)).optional().or(z.literal("")),
  approvedAt: z.string().transform(s => new Date(s)).optional().or(z.literal("")),
  signedAt: z.string().transform(s => new Date(s)).optional().or(z.literal("")),
  viewedAt: z.string().transform(s => new Date(s)).optional().or(z.literal("")),
  note: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("quotes", "read");
    const { id } = await params;

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        salesLead: {
          select: {
            id: true,
            customerName: true,
            customerEmail: true,
            customerPhone: true,
            companyName: true,
            area: true,
            tier: true,
          },
        },
        infrastructureTier: {
          select: { id: true, slug: true, name: true, nameVi: true, monthlyCost: true, setupCost: true },
        },
        order: {
          select: { id: true, orderNumber: true, status: true, totalAmount: true, finalPrice: true },
        },
      },
    });

    if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: quote });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("quotes", "update");
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const existing = await prisma.quote.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Validate LP allocation if provided
    if (parsed.data.lpAllocation) {
      const lpSum = Object.values(parsed.data.lpAllocation).reduce((s: number, v: number) => s + v, 0);
      if (lpSum !== 0 && lpSum !== 100) {
        return NextResponse.json(
          { error: `LP allocation phải tổng = 100%. Hiện tại: ${lpSum}%` },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
    if (parsed.data.totalAmount !== undefined) updateData.totalAmount = parsed.data.totalAmount;
    if (parsed.data.lpAllocation !== undefined) updateData.lpAllocation = parsed.data.lpAllocation;
    if (parsed.data.milestones !== undefined) updateData.milestones = parsed.data.milestones;
    if (parsed.data.selectedFeatureIds !== undefined) {
      updateData.selectedFeatureIds = parsed.data.selectedFeatureIds;
    }
    if (parsed.data.infrastructureTierSlug !== undefined) {
      updateData.infrastructureTierSlug = parsed.data.infrastructureTierSlug ?? null;
    }
    if (parsed.data.infrastructureTierId !== undefined) {
      updateData.infrastructureTierId = parsed.data.infrastructureTierId ?? null;
    }
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
    if (parsed.data.note !== undefined) updateData.note = parsed.data.note || null;

    // Handle nullable datetime fields
    const nullableFields = ["validUntil", "sentAt", "approvedAt", "signedAt", "viewedAt"] as const;
    for (const field of nullableFields) {
      if (parsed.data[field] !== undefined) {
        updateData[field] = parsed.data[field] === "" ? null : parsed.data[field];
      }
    }

    const quote = await prisma.quote.update({
      where: { id },
      data: updateData,
      include: {
        salesLead: { select: { id: true, customerName: true, customerEmail: true } },
        order: { select: { id: true, orderNumber: true } },
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "quotes",
      resourceId: id,
      oldValues: existing,
      newValues: body,
    });

    return NextResponse.json({ data: quote });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("quotes", "delete");
    const { id } = await params;

    const existing = await prisma.quote.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.quote.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "quotes",
      resourceId: id,
    });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
