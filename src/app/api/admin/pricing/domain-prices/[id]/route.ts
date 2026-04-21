/**
 * PUT  /api/admin/pricing/domain-prices/[id]
 * DELETE /api/admin/pricing/domain-prices/[id]
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { handleError, ok, badRequest } from "@/lib/api";

const updateSchema = z.object({
  id: z.string(),
  extension: z.string().min(1),
  registrationPrice: z.number().int().min(0),
  renewalPrice: z.number().int().min(0),
  period: z.string(),
  periodVi: z.string(),
  note: z.string().optional(),
  noteVi: z.string().optional(),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("packages", "update");
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) return badRequest(parsed.error.message);
    const data = parsed.data;

    // Ensure id in body matches route param
    if (data.id !== id) return badRequest("ID mismatch");

    const price = await prisma.pricingDomainPrice.update({
      where: { id },
      data: {
        extension: data.extension,
        registrationPrice: data.registrationPrice,
        renewalPrice: data.renewalPrice,
        period: data.period,
        periodVi: data.periodVi,
        note: data.note ?? null,
        noteVi: data.noteVi ?? null,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      },
    });

    return ok(price);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("packages", "delete");
    const { id } = await params;

    await prisma.pricingDomainPrice.delete({ where: { id } });
    return ok({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
