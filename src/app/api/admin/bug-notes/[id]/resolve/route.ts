import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

// POST /api/admin/bug-notes/[id]/resolve
// Marks bug note as resolved
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("bug-notes", "update");
    const { id } = await params;

    const existing = await prisma.bugNote.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data = await prisma.bugNote.update({
      where: { id },
      data: {
        status: "resolved",
        resolvedAt: new Date(),
      },
    });

    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}
