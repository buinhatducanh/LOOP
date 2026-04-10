/**
 * Audit Log API — /api/admin/audit-log
 * GET list (read-only)
 * RBAC: ceo + super_admin only (roleLevel ≤ 0)
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/permissions";
import { ok, list, handleError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { buildPagination } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);

    // Only ceo / super_admin can view audit log
    const roleLevel = (session as { roleLevel?: number }).roleLevel ?? 99;
    if (roleLevel > 0) {
      return ok({ data: [], pagination: buildPagination(1, 50, 0) });
    }

    const { searchParams } = req.nextUrl;

    const userId = searchParams.get("userId") ?? undefined;
    const resource = searchParams.get("resource") ?? undefined;
    const action = searchParams.get("action") ?? undefined;
    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (resource) where.resource = resource;
    if (action) where.action = action;
    if (from || to) {
      where.createdAt = {} as Record<string, unknown>;
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return list(logs, buildPagination(page, limit, total));
  } catch (err) {
    return handleError(err);
  }
}
