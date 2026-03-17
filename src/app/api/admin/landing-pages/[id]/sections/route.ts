import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

// GET - Get sections for a landing page
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const sections = await prisma.landingSection.findMany({
      where: { pageId: id },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ data: sections });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// POST - Create new section
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const data = await req.json();

    // Get max sort order
    const maxOrder = await prisma.landingSection.aggregate({
      where: { pageId: id },
      _max: { sortOrder: true },
    });

    const section = await prisma.landingSection.create({
      data: {
        pageId: id,
        type: data.type,
        title: data.title,
        subtitle: data.subtitle,
        content: data.content || {},
        styles: data.styles || {},
        sortOrder: (maxOrder._max.sortOrder || 0) + 1,
        isActive: data.isActive !== false,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "landing_sections",
      resourceId: section.id,
      newValues: { ...data, pageId: id },
    });

    return NextResponse.json({ data: section }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// PUT - Reorder sections
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const { sections } = await req.json();

    // Update sort orders in transaction
    await prisma.$transaction(
      sections.map((s: { id: string; sortOrder: number }) =>
        prisma.landingSection.update({
          where: { id: s.id },
          data: { sortOrder: s.sortOrder },
        })
      )
    );

    await createAuditLog({
      userId: session.userId,
      action: "reorder",
      resource: "landing_sections",
      resourceId: id,
      newValues: { sections },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
