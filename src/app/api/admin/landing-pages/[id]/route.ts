import { ok, handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

// GET - Get single landing page with sections
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(req);
    const { id } = await params;

    const landingPage = await prisma.landingPage.findUnique({
      where: { id },
      include: {
        sections: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!landingPage) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json({ data: landingPage });
  } catch (error) {
    return handleError(error);
  }
}

// PUT - Update landing page
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;
    const data = await req.json();

    // Check if slug is being changed and if it conflicts
    const existing = await prisma.landingPage.findFirst({
      where: { slug: data.slug, NOT: { id } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 400 }
      );
    }

    // If isDefault, unset other default pages
    if (data.isDefault) {
      await prisma.landingPage.updateMany({
        where: { isDefault: true, locale: data.locale, NOT: { id } },
        data: { isDefault: false },
      });
    }

    const landingPage = await prisma.landingPage.update({
      where: { id },
      data: {
        slug: data.slug,
        name: data.name,
        locale: data.locale,
        isPublished: data.isPublished,
        isDefault: data.isDefault,
        seoTitle: data.seoTitle,
        seoDesc: data.seoDesc,
        seoKeywords: data.seoKeywords,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "landing_pages",
      resourceId: id,
      newValues: data,
    });

    return NextResponse.json({ data: landingPage });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE - Delete landing page
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;

    // Check if page exists
    const existing = await prisma.landingPage.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    // Delete page (sections will be cascade deleted)
    await prisma.landingPage.delete({
      where: { id },
    });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "landing_pages",
      resourceId: id,
      oldValues: existing,
    });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
