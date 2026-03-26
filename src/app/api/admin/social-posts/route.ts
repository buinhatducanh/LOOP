import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

const createSchema = z.object({
  projectId: z.string(),
  platform: z.enum(["facebook", "tiktok", "instagram", "zalo"]),
  content: z.string().optional(),
  mediaUrls: z.array(z.string()).optional().default([]),
  scheduledAt: z.string().transform(s => new Date(s)).optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requirePermission("projects", "read");
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") ?? searchParams.get("orderId");
    const platform = searchParams.get("platform");
    const status = searchParams.get("status");

    const data = await prisma.socialPost.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(platform ? { platform } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        project: { select: { id: true, orderNumber: true, customerName: true } },
      },
      orderBy: { scheduledAt: "asc" },
    });
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("projects", "create");
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

    const data = await prisma.socialPost.create({
      data: {
        projectId: parsed.data.projectId,
        platform: parsed.data.platform,
        content: parsed.data.content ?? null,
        mediaUrls: parsed.data.mediaUrls,
        scheduledAt: parsed.data.scheduledAt ?? null,
        status: parsed.data.scheduledAt ? "scheduled" : "draft",
        publishedBy: session.userId,
      },
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
