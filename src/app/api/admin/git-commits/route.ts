import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("git-commits", "read");
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const branch = searchParams.get("branch");
    const merged = searchParams.get("merged");
    const taskId = searchParams.get("taskId");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (branch) where.branch = branch;
    if (merged === "true") where.mergedToMain = true;
    if (taskId) where.taskId = taskId;

    const data = await prisma.gitCommit.findMany({
      where,
      include: {
        task: { select: { id: true, title: true, status: true } },
        project: { select: { id: true, orderNumber: true, customerName: true } },
      },
      orderBy: { committedAt: "desc" },
      take: 200,
    });

    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}
