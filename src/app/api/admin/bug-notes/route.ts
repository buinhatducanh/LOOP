import { handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

export async function GET(_req: NextRequest) {
  try {
    await requirePermission("bug-notes", "read");
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");

    const data = await prisma.bugNote.findMany({
      where: taskId ? { taskId } : undefined,
      include: {
        task: {
          select: {
            id: true, title: true, status: true,
            backlog: { select: { projectId: true } },
          },
        },
        author: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(_req: NextRequest) {
  try {
    const _session = await requirePermission("bug-notes", "create");
    const body = await req.json();
    const parsed = z.object({
      taskId: z.string(),
      content: z.string().min(1),
      severity: z.enum(["low", "medium", "high", "critical"]),
    }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

    // Resolve author TeamMember.id from session.userId via User.teamMemberId
    const authorMember = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { teamMemberId: true },
    });

    const data = await prisma.bugNote.create({
      data: {
        taskId: parsed.data.taskId,
        authorId: authorMember?.teamMemberId ?? session.userId,
        content: parsed.data.content,
        severity: parsed.data.severity,
        status: "open",
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "bug-notes",
      resourceId: data.id,
      newValues: parsed.data,
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
