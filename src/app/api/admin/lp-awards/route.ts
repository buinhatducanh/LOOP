import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("lp-awards", "read");
    const { searchParams } = new URL(req.url);

    const where: Record<string, unknown> = {};
    // Support both orderId and projectId params
    const projectId = searchParams.get("projectId") ?? searchParams.get("orderId");
    if (projectId) where.projectId = projectId;
    const memberId = searchParams.get("memberId");
    if (memberId && memberId !== "all") where.memberId = memberId;
    const status = searchParams.get("status");
    if (status && status !== "all") where.status = status;

    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    const [awards, total] = await Promise.all([
      prisma.lpAward.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          task: { select: { id: true, title: true, status: true } },
          project: { select: { id: true, orderNumber: true, customerName: true } },
        },
      }),
      prisma.lpAward.count({ where }),
    ]);

    // Join member names
    const memberIds = [...new Set(awards.map(a => a.memberId))];
    const members = await prisma.teamMember.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, name: true, role: true },
    });
    const memberMap = Object.fromEntries(members.map(m => [m.id, m]));

    const data = awards.map(a => ({
      ...a,
      member: memberMap[a.memberId] ?? null,
    }));

    return NextResponse.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("lp-awards", "create");
    const data = await req.json();

    const projectId = data.projectId ?? data.orderId;
    if (!projectId || !data.memberId || !data.lpAmount) {
      return NextResponse.json({ error: "projectId, memberId, and lpAmount are required" }, { status: 400 });
    }

    const award = await prisma.lpAward.create({
      data: {
        projectId,
        taskId: data.taskId ?? null,
        memberId: data.memberId,
        lpAmount: parseInt(data.lpAmount),
        expAmount: parseInt(data.expAmount ?? data.lpAmount),
        source: data.source ?? "manual",
        status: data.status ?? "pending",
      },
      include: {
        task: { select: { id: true, title: true } },
        project: { select: { id: true, orderNumber: true } },
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "lp-awards",
      resourceId: award.id,
      newValues: data,
    });

    return NextResponse.json({ data: award }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
