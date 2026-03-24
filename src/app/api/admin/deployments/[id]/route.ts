import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

const updateSchema = z.object({
  environment: z.enum(["dev", "staging", "production"]).optional(),
  platform: z.enum(["vercel", "aws", "gcp", "manual"]).optional(),
  deployUrl: z.string().url().optional().or(z.literal("")),
  commitSha: z.string().optional(),
  status: z.enum(["pending", "running", "success", "failed"]).optional(),
  gscVerified: z.boolean().optional(),
  deployedBy: z.string().optional(),
  deployedAt: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("projects", "read");
    const { id } = await params;
    const data = await prisma.deployment.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, orderNumber: true, customerName: true } },
      },
    });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("projects", "update");
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

    const data = await prisma.deployment.update({
      where: { id },
      data: {
        ...parsed.data,
        ...(parsed.data.deployedAt ? { deployedAt: new Date(parsed.data.deployedAt) } : {}),
      },
    });
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("projects", "delete");
    const { id } = await params;
    await prisma.deployment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
