import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

const createSchema = z.object({
  projectId: z.string(),
  status: z.enum(["draft", "pending_review", "approved", "handed_over"]).optional().default("draft"),
  handoverDate: z.string().transform(s => new Date(s)).optional(),
  items: z.array(z.object({
    key: z.string(),
    label: z.string(),
    checked: z.boolean().default(false),
    notes: z.string().optional(),
  })).optional().default([]),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requirePermission("projects", "read");
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") ?? searchParams.get("orderId");
    const status = searchParams.get("status");

    const data = await prisma.handoverPackage.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        project: { select: { id: true, orderNumber: true, customerName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("projects", "create");
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

    const data = await prisma.handoverPackage.create({
      data: {
        projectId: parsed.data.projectId,
        status: parsed.data.status,
        handoverDate: parsed.data.handoverDate,
        items: parsed.data.items,
        notes: parsed.data.notes,
        deliveredBy: session.userId,
      },
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
