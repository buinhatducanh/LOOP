import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

const createSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1),
  figmaUrl: z.string().min(1),
  clientEmail: z.string().email().optional().nullable(),
  versionHash: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    await requirePermission("figmas", "read");
    const { searchParams } = new URL(req.url);

    const where: Record<string, unknown> = {};
    const status = searchParams.get("status");
    if (status && status !== "all") where.status = status;

    // Support both projectId and orderId from frontend
    const projectId = searchParams.get("projectId") ?? searchParams.get("orderId");
    if (projectId) where.projectId = projectId;

    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    const [demos, total] = await Promise.all([
      prisma.figmaDemo.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          project: { select: { id: true, orderNumber: true, customerName: true } },
        },
      }),
      prisma.figmaDemo.count({ where }),
    ]);

    return NextResponse.json({ data: demos, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("figmas", "create");
    const body = await req.json();

    // Accept orderId from frontend, normalise to projectId
    const normalized = { ...body, projectId: body.projectId ?? body.orderId };
    const parsed = createSchema.safeParse(normalized);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

    const { clientEmail, versionHash } = parsed.data;

    // Generate a unique client token for public review link
    const { randomBytes } = await import("crypto");
    const clientToken = randomBytes(16).toString("hex");

    const demo = await prisma.figmaDemo.create({
      data: {
        projectId: parsed.data.projectId,
        title: parsed.data.title,
        figmaUrl: parsed.data.figmaUrl,
        clientEmail: clientEmail ?? null,
        clientToken,
        versionHash: versionHash ?? null,
        status: "pending",
        sentAt: clientEmail ? new Date() : null,
      },
      include: {
        project: { select: { id: true, orderNumber: true, customerName: true } },
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "figmas",
      resourceId: demo.id,
      newValues: { title: demo.title, projectId: demo.projectId },
    });

    return NextResponse.json({ data: demo }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
