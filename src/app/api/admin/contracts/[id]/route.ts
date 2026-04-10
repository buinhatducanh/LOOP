/**
 * Contract by ID API — /api/admin/contracts/[id]
 * GET / PUT / DELETE
 */

import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { ok, notFound, handleError, badRequest } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft:    ["sent", "cancelled"],
  sent:     ["signed", "cancelled"],
  signed:   ["expired", "cancelled"],
  expired:  [],
  cancelled: [],
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("orders", "read", req);
    const { id } = await params;

    const contract = await prisma.contract.findUnique({ where: { id } });

    if (!contract) return notFound("Contract not found");

    return ok(contract);
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

    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) return notFound("Contract not found");

    // Validate status transition
    if (body.status !== undefined && body.status !== existing.status) {
      const allowed = VALID_TRANSITIONS[existing.status] ?? [];
      if (!allowed.includes(body.status)) {
        return badRequest(
          `Cannot transition from "${existing.status}" to "${body.status}". ` +
          `Allowed: ${allowed.join(", ") || "none"}`
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.orderId !== undefined) updateData.orderId = body.orderId || null;
    if (body.customerId !== undefined) updateData.customerId = body.customerId || null;
    if (body.value !== undefined) updateData.value = body.value ? parseInt(body.value, 10) : null;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.fileUrl !== undefined) updateData.fileUrl = body.fileUrl || null;
    if (body.note !== undefined) updateData.note = body.note || null;

    // Auto-set timestamps on status changes
    if (body.status === "sent" && existing.status !== "sent") {
      updateData.sentAt = new Date();
    }
    if (body.status === "signed" && existing.status !== "signed") {
      updateData.signedAt = new Date();
    }

    if (body.sentAt !== undefined) updateData.sentAt = body.sentAt ? new Date(body.sentAt) : null;
    if (body.signedAt !== undefined) updateData.signedAt = body.signedAt ? new Date(body.signedAt) : null;
    if (body.expiresAt !== undefined) updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

    const contract = await prisma.contract.update({
      where: { id },
      data: updateData,
    });

    return ok(contract);
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

    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) return notFound("Contract not found");

    await prisma.contract.delete({ where: { id } });

    return ok({ id }, 200);
  } catch (err) {
    return handleError(err);
  }
}
