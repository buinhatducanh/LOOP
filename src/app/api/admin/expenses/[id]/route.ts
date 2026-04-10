/**
 * Expense by ID API — /api/admin/expenses/[id]
 * GET / PUT / DELETE / PATCH (approve/reject)
 */

import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { ok, notFound, handleError, badRequest } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("orders", "read", req);
    const { id } = await params;

    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) return notFound("Expense not found");

    return ok(expense);
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("orders", "update", req);
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) return notFound("Expense not found");

    const updateData: Record<string, unknown> = {};
    if (body.description !== undefined) updateData.description = body.description.trim();
    if (body.amount !== undefined) updateData.amount = parseInt(body.amount, 10);
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.date !== undefined) updateData.date = body.date ? new Date(body.date) : existing.date;
    if (body.vendor !== undefined) updateData.vendor = body.vendor || null;
    if (body.receiptUrl !== undefined) updateData.receiptUrl = body.receiptUrl || null;
    if (body.note !== undefined) updateData.note = body.note || null;

    // Status can only be updated by pending → approved/rejected via PATCH
    // But allow updating other fields if pending
    if (existing.status !== "pending") {
      return badRequest("Can only edit pending expenses");
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: updateData,
    });

    return ok(expense);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("orders", "update", req);
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) return notFound("Expense not found");

    if (existing.status !== "pending") {
      return badRequest(`Expense is already ${existing.status}`);
    }

    const { action } = body as { action?: string };

    if (action === "approve") {
      const expense = await prisma.expense.update({
        where: { id },
        data: {
          status: "approved",
          approvedBy: session.userId,
          approvedAt: new Date(),
        },
      });
      return ok(expense);
    }

    if (action === "reject") {
      const expense = await prisma.expense.update({
        where: { id },
        data: {
          status: "rejected",
          approvedBy: session.userId,
          approvedAt: new Date(),
          note: body.note !== undefined ? body.note : existing.note,
        },
      });
      return ok(expense);
    }

    return badRequest("action must be 'approve' or 'reject'");
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("orders", "delete", req);
    const { id } = await params;

    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) return notFound("Expense not found");

    if (existing.status === "approved") {
      return badRequest("Cannot delete approved expenses");
    }

    await prisma.expense.delete({ where: { id } });

    return ok({ id }, 200);
  } catch (err) {
    return handleError(err);
  }
}
