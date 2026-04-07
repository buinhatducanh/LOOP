import { handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

const createSchema = z.object({
  projectId: z.string(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  maxHours: z.number().min(1),
});

export async function GET(_req: NextRequest) {
  try {
    await requirePermission("projects", "read");
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") ?? searchParams.get("orderId");
    const priority = searchParams.get("priority");

    const data = await prisma.slaRule.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(priority ? { priority } : {}),
      },
      include: {
        project: { select: { id: true, orderNumber: true, customerName: true } },
      },
      orderBy: [{ priority: "asc" }, { maxHours: "asc" }],
    });
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(_req: NextRequest) {
  try {
    await requirePermission("projects", "create");
    const body = await req.json();
    const normalized = { ...body, projectId: body.projectId ?? body.orderId };
    const parsed = createSchema.safeParse(normalized);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

    const data = await prisma.slaRule.create({
      data: {
        projectId: parsed.data.projectId,
        priority: parsed.data.priority,
        maxHours: parsed.data.maxHours,
      },
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
