import { handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    await requirePermission("packages", "read");
    const prices = await prisma.pricingDomainPrice.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ data: prices });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(_req: NextRequest) {
  try {
    const _session = await requirePermission("packages", "create");
    const data = await req.json();

    const price = await prisma.pricingDomainPrice.create({
      data: {
        extension: data.extension,
        registrationPrice: data.registrationPrice,
        renewalPrice: data.renewalPrice,
        period: data.period,
        periodVi: data.periodVi,
        note: data.note || null,
        noteVi: data.noteVi || null,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive ?? true,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "pricing_domain_prices",
      resourceId: price.id,
      newValues: data,
    });

    revalidatePath("/vi/pricing");
    revalidatePath("/en/pricing");

    return NextResponse.json({ data: price }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
