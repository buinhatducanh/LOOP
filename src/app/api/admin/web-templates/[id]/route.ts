import { ok, handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { revalidatePath } from "next/cache";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("services", "read");
    const { id } = await params;

    const template = await prisma.webTemplate.findUnique({
      where: { id },
      include: {
        bundledAttributes: {
          include: {
            attribute: true,
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: template });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("services", "update");
    const { id } = await params;
    const data = await req.json();

    const existing = await prisma.webTemplate.findUnique({
      where: { id },
      include: { bundledAttributes: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Update template + sync bundled attributes in a transaction
    const template = await prisma.$transaction(async (tx) => {
      const updated = await tx.webTemplate.update({
        where: { id },
        data: {
          slug: data.slug,
          name: data.name,
          nameVi: data.nameVi,
          description: data.description ?? null,
          descriptionVi: data.descriptionVi ?? null,
          category: data.category,
          categoryVi: data.categoryVi,
          thumbnail: data.thumbnail,
          screenshots: data.screenshots || [],
          demoUrl: data.demoUrl,
          price: Number(data.price) || 0,
          originalPrice: data.originalPrice ? Number(data.originalPrice) : null,
          currency: data.currency || "VND",
          technologies: data.technologies || [],
          deliveryTime: data.deliveryTime,
          highlighted: data.highlighted ?? false,
          sortOrder: Number(data.sortOrder) || 0,
          isActive: data.isActive ?? true,
        },
      });

      // Sync bundled attributes if provided
      if (data.attributeIds !== undefined) {
        // Remove old
        await tx.webTemplateAttribute.deleteMany({ where: { templateId: id } });
        // Add new
        if (data.attributeIds.length > 0) {
          await tx.webTemplateAttribute.createMany({
            data: data.attributeIds.map((attrId: string) => ({
              templateId: id,
              attributeId: attrId,
            })),
          });
        }
      }

      return tx.webTemplate.findUnique({
        where: { id },
        include: {
          bundledAttributes: {
            include: {
              attribute: { select: { id: true, name: true, nameVi: true } },
            },
          },
        },
      });
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "web_templates",
      resourceId: id,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: data,
    });

    revalidatePath("/vi/services");
    revalidatePath("/en/services");

    return NextResponse.json({ data: template });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("services", "delete");
    const { id } = await params;

    const existing = await prisma.webTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.webTemplate.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "web_templates",
      resourceId: id,
      oldValues: existing as unknown as Record<string, unknown>,
    });

    revalidatePath("/vi/services");
    revalidatePath("/en/services");

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
