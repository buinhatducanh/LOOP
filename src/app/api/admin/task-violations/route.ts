import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("projects", "read");
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") ?? searchParams.get("orderId");

    const data = await prisma.taskViolation.findMany({
      where: projectId ? {
        task: { backlog: { projectId } },
      } : undefined,
      include: {
        task: {
          select: {
            id: true, title: true, status: true,
            backlog: { select: { projectId: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}
