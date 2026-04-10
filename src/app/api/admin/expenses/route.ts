/**
 * Expenses API — /api/admin/expenses
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

    const category = searchParams.get("category") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (category && category !== "all") where.category = category;
    if (status && status !== "all") where.status = status;

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.expense.count({ where }),
    ]);

    return list(expenses, buildPagination(page, limit, total));
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("orders", "create", req);
    const body = await req.json();

    if (!body.description?.trim()) return badRequest("description is required");
    if (!body.amount || parseInt(body.amount, 10) <= 0) return badRequest("amount must be a positive number");

    const VALID_CATEGORIES = [
      "software", "hardware", "marketing", "salary", "office", "travel", "other",
    ];
    if (body.category && !VALID_CATEGORIES.includes(body.category)) {
      return badRequest(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`);
    }

    const expense = await prisma.expense.create({
      data: {
        category: body.category ?? "other",
        description: body.description.trim(),
        amount: parseInt(body.amount, 10),
        currency: body.currency ?? "VND",
        date: body.date ? new Date(body.date) : new Date(),
        vendor: body.vendor ?? null,
        receiptUrl: body.receiptUrl ?? null,
        status: "pending",
        note: body.note ?? null,
        createdBy: session.userId,
      },
    });

    return ok(expense, 201);
  } catch (err) {
    return handleError(err);
  }
}
