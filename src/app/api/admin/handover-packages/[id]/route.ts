import { handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

const updateSchema = z.object({
  status: z.enum(["draft", "pending_review", "approved", "handed_over"]).optional(),
  handoverDate: z.string().transform(s => new Date(s)).optional().nullable(),
  items: z.array(z.object({
    key: z.string(),
    label: z.string(),
    checked: z.boolean(),
    notes: z.string().optional(),
  })).optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("projects", "read");
    const { id } = await params;
    const data = await prisma.handoverPackage.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, orderNumber: true, customerName: true } },
      },
    });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("projects", "update");
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

    const data = await prisma.handoverPackage.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("projects", "delete");
    const { id } = await params;
    await prisma.handoverPackage.delete({ where: { id } });
    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
