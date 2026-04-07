import { handleError, ok } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

// GET - Get single section
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    await requireAuth(req);
    const { sectionId } = await params;

    const section = await prisma.landingSection.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    return NextResponse.json({ data: section });
  } catch (error) {
    return handleError(error);
  }
}

// PUT - Update section
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const session = await requireAuth(req);
    const { sectionId } = await params;
    const data = await req.json();

    const section = await prisma.landingSection.update({
      where: { id: sectionId },
      data: {
        type: data.type,
        title: data.title,
        subtitle: data.subtitle,
        content: data.content,
        styles: data.styles,
        isActive: data.isActive,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "landing_sections",
      resourceId: sectionId,
      newValues: data,
    });

    return NextResponse.json({ data: section });
  } catch (error) {
    return handleError(error);
  }
}

// DELETE - Delete section
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const session = await requireAuth(req);
    const { sectionId } = await params;

    const existing = await prisma.landingSection.findUnique({
      where: { id: sectionId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    await prisma.landingSection.delete({
      where: { id: sectionId },
    });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "landing_sections",
      resourceId: sectionId,
      oldValues: existing,
    });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
