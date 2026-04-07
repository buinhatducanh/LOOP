import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import { lpLogger } from "@/lib/logger";
import { withIdempotency } from "@/lib/idempotency";

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
    lpLogger.withSLO("GET /api/admin/lp-awards failed", {
      endpoint: "/api/admin/lp-awards",
      method: "GET",
      statusCode: 500,
      error: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}

export const POST = withIdempotency(
  "create_lp_award",
  async (req: NextRequest) => {
    try {
      const session = await requirePermission("lp-awards", "create");
      const data = await req.json();

      const projectId = data.projectId ?? data.orderId;
      if (!projectId || !data.memberId || !data.lpAmount) {
        return NextResponse.json({ error: "projectId, memberId, and lpAmount are required" }, { status: 400 });
      }

      // Accept memberId as string (CUID) or number — convert to string for DB
      const memberIdStr = String(data.memberId);
      if (!memberIdStr.trim()) {
        return NextResponse.json({ error: "memberId is required" }, { status: 400 });
      }

      const lpAmount = parseInt(data.lpAmount);
      if (isNaN(lpAmount) || lpAmount <= 0) {
        return NextResponse.json({ error: "lpAmount must be a positive integer" }, { status: 400 });
      }

      const isPending = (data.status ?? "pending") === "pending";

      // Atomic: create award + lock LP on member
      const award = await prisma.$transaction(async (tx) => {
        const created = await tx.lpAward.create({
          data: {
            projectId,
            taskId: data.taskId ?? null,
            memberId: memberIdStr,
            lpAmount,
            expAmount: parseInt(data.expAmount ?? lpAmount),
            source: data.source ?? "manual",
            status: data.status ?? "pending",
          },
          include: {
            task: { select: { id: true, title: true } },
            project: { select: { id: true, orderNumber: true } },
          },
        });

        if (isPending) {
          const member = await tx.teamMember.findUnique({
            where: { id: memberIdStr },
            select: { lockedLp: true },
          });
          if (member) {
            await tx.teamMember.update({
              where: { id: memberIdStr },
              data: { lockedLp: member.lockedLp + lpAmount },
            });
          }
        }
        return created;
      });

      await createAuditLog({
        userId: session.userId,
        action: "create",
        resource: "lp-awards",
        resourceId: award.id,
        newValues: data,
      });

      lpLogger.info("LP award created", {
        awardId: award.id,
        memberId: memberIdStr,
        projectId,
        lpAmount,
        status: award.status,
        createdBy: session.userId,
      });

      return NextResponse.json({ data: award }, { status: 201 });
    } catch (error) {
      lpLogger.withSLO("POST /api/admin/lp-awards failed", {
        endpoint: "/api/admin/lp-awards",
        statusCode: 500,
      });
      return handleError(error);
    }
  }
);
