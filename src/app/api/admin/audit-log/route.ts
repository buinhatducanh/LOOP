import { handleError, list } from "@/lib/api/response";
import { buildPagination } from "@/lib/api";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("audit_logs", "read");
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const resource = searchParams.get("resource") || "";
    const action = searchParams.get("action") || "";

    const where: Record<string, unknown> = {};
    if (resource) where.resource = resource;
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { name: true, email: true, avatar: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return list(logs, buildPagination(page, limit, total));
  } catch (error) {
    return handleError(error);
  }
}
