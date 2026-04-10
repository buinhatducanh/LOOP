/**
 * Leave Requests API — /api/admin/leave-requests
 * GET list + POST create
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/permissions";
import { ok, list, badRequest, handleError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { buildPagination } from "@/lib/api/response";

const VALID_TYPES = ["annual", "sick", "unpaid", "maternity", "paternity", "bereavement"];

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const { searchParams } = req.nextUrl;

    const memberId = searchParams.get("memberId") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const type = searchParams.get("type") ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (memberId) where.memberId = memberId;
    if (status && status !== "all") where.status = status;
    if (type && type !== "all") where.type = type;

    const [requests, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    return list(requests, buildPagination(page, limit, total));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const body = await req.json();

    if (!body.startDate || !body.endDate) {
      return badRequest("startDate and endDate are required");
    }

    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return badRequest("Invalid date format");
    }
    if (endDate < startDate) {
      return badRequest("endDate must be after startDate");
    }

    if (body.type && !VALID_TYPES.includes(body.type)) {
      return badRequest(`Invalid type. Must be one of: ${VALID_TYPES.join(", ")}`);
    }

    // Calculate days (simple diff — count calendar days)
    const daysMs = endDate.getTime() - startDate.getTime();
    const days = Math.max(1, Math.round(daysMs / (1000 * 60 * 60 * 24)) + 1);

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        memberId: session.teamMemberId ?? body.memberId ?? "",
        type: body.type ?? "annual",
        startDate,
        endDate,
        days,
        reason: body.reason ?? null,
        status: "pending",
      },
    });

    return ok(leaveRequest, 201);
  } catch (err) {
    return handleError(err);
  }
}
