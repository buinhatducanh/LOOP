import { handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    await requirePermission("packages", "read");
    const items = await prisma.pricingDeploymentItem.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ data: items });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(_req: NextRequest) {
  try {
    const _session = await requirePermission("packages", "create");
    const data = await req.json();

    const item = await prisma.pricingDeploymentItem.create({
      data: {
        slug: data.slug,
        title: data.title,
        titleVi: data.titleVi,
        description: data.description,
        descriptionVi: data.descriptionVi,
        handedToClient: data.handedToClient ?? true,
        icon: data.icon,
        note: data.note || null,
        noteVi: data.noteVi || null,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive ?? true,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "pricing_deployment_items",
      resourceId: item.id,
      newValues: data,
    });

    revalidatePath("/vi/pricing");
    revalidatePath("/en/pricing");

    return NextResponse.json({ data: item }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
