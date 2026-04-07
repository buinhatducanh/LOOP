import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

const createSchema = z.object({
  projectId: z.string(),
  environment: z.enum(["dev", "staging", "production"]),
  platform: z.enum(["vercel", "aws", "gcp", "manual"]).optional().default("manual"),
  deployUrl: z.string().url().optional().or(z.literal("")),
  commitSha: z.string().optional(),
  status: z.enum(["pending", "running", "success", "failed"]).optional().default("pending"),
  deployedBy: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requirePermission("projects", "read");
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") ?? searchParams.get("orderId");
    const environment = searchParams.get("environment");
    const status = searchParams.get("status");

    const data = await prisma.deployment.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(environment ? { environment } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        project: { select: { id: true, orderNumber: true, customerName: true } },
      },
      orderBy: { deployedAt: "desc" },
    });
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("projects", "create");
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

    const data = await prisma.deployment.create({
      data: {
        projectId: parsed.data.projectId,
        environment: parsed.data.environment,
        platform: parsed.data.platform,
        deployUrl: parsed.data.deployUrl || null,
        commitSha: parsed.data.commitSha || null,
        status: parsed.data.status,
        deployedBy: parsed.data.deployedBy || null,
        deployedAt: new Date(),
        gscVerified: false,
      },
    });
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
