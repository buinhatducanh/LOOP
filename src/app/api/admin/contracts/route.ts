/**
 * Contracts API — /api/admin/contracts
 * GET list + POST create
 */

import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { ok, list, badRequest, handleError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { buildPagination } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("orders", "read", req);
    const { searchParams } = req.nextUrl;

    const status = searchParams.get("status") ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const search = searchParams.get("search") ?? undefined;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status && status !== "all") where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { note: { contains: search, mode: "insensitive" } },
      ];
    }

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.contract.count({ where }),
    ]);

    return list(contracts, buildPagination(page, limit, total));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("orders", "create", req);
    const body = await req.json();

    if (!body.title?.trim()) {
      return badRequest("title is required");
    }

    const contract = await prisma.contract.create({
      data: {
        title: body.title.trim(),
        orderId: body.orderId ?? null,
        customerId: body.customerId ?? null,
        value: body.value ? parseInt(body.value, 10) : null,
        status: body.status ?? "draft",
        fileUrl: body.fileUrl ?? null,
        sentAt: body.sentAt ? new Date(body.sentAt) : null,
        signedAt: body.signedAt ? new Date(body.signedAt) : null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        note: body.note ?? null,
        createdBy: session.userId,
      },
    });

    return ok(contract, 201);
  } catch (err) {
    return handleError(err);
  }
}
