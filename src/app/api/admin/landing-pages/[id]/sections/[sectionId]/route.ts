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
    await requireAuth();
    const { sectionId } = await params;

    const section = await prisma.landingSection.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    return NextResponse.json({ data: section });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// PUT - Update section
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const session = await requireAuth();
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
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// DELETE - Delete section
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const session = await requireAuth();
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

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
