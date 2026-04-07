import { handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { revalidatePath } from "next/cache";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _session = await requirePermission("packages", "update");
    const { id } = await params;
    const data = await req.json();

    const old = await prisma.pricingDomainPrice.findUnique({ where: { id } });
    const price = await prisma.pricingDomainPrice.update({
      where: { id },
      data: {
        extension: data.extension,
        registrationPrice: data.registrationPrice,
        renewalPrice: data.renewalPrice,
        period: data.period,
        periodVi: data.periodVi,
        note: data.note,
        noteVi: data.noteVi,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "pricing_domain_prices",
      resourceId: id,
      oldValues: old as unknown as Record<string, unknown>,
      newValues: data,
    });

    revalidatePath("/vi/pricing");
    revalidatePath("/en/pricing");

    return NextResponse.json({ data: price });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _session = await requirePermission("packages", "delete");
    const { id } = await params;

    const old = await prisma.pricingDomainPrice.findUnique({ where: { id } });
    await prisma.pricingDomainPrice.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "pricing_domain_prices",
      resourceId: id,
      oldValues: old as unknown as Record<string, unknown>,
    });

    revalidatePath("/vi/pricing");
    revalidatePath("/en/pricing");

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return handleError(error);
  }
}
