/**
 * Leave Request by ID API — /api/admin/leave-requests/[id]
 * GET / PUT (self-update) / DELETE / PATCH (approve/reject)
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/permissions";
import { ok, notFound, handleError, badRequest } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

const VALID_TYPES = ["annual", "sick", "unpaid", "maternity", "paternity", "bereavement"];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;

    const leaveRequest = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!leaveRequest) return notFound("Leave request not found");

    return ok(leaveRequest);
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!existing) return notFound("Leave request not found");

    // Only the member themselves or admin can update
    const roleLevel = (session as { roleLevel?: number }).roleLevel ?? 99;
    const isAdmin = roleLevel <= 1;
    const isOwner = existing.memberId === session.teamMemberId;

    if (!isOwner && !isAdmin) {
      return badRequest("You can only edit your own leave requests");
    }
    if (existing.status !== "pending") {
      return badRequest("Only pending requests can be edited");
    }

    const startDate = body.startDate ? new Date(body.startDate) : existing.startDate;
    const endDate = body.endDate ? new Date(body.endDate) : existing.endDate;
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return badRequest("Invalid date format");
    }
    const daysMs = endDate.getTime() - startDate.getTime();
    const days = Math.max(1, Math.round(daysMs / (1000 * 60 * 60 * 24)) + 1);

    if (body.type && !VALID_TYPES.includes(body.type)) {
      return badRequest(`Invalid type. Must be one of: ${VALID_TYPES.join(", ")}`);
    }

    const leaveRequest = await prisma.leaveRequest.update({
      where: { id },
      data: {
        type: body.type ?? existing.type,
        startDate,
        endDate,
        days,
        reason: body.reason !== undefined ? (body.reason || null) : existing.reason,
      },
    });

    return ok(leaveRequest);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!existing) return notFound("Leave request not found");

    if (existing.status !== "pending") {
      return badRequest(`Leave request is already ${existing.status}`);
    }

    const { action } = body as { action?: string; note?: string };

    if (action === "approve") {
      const leaveRequest = await prisma.leaveRequest.update({
        where: { id },
        data: {
          status: "approved",
          respondedBy: session.userId,
          respondedAt: new Date(),
          note: body.note !== undefined ? body.note : existing.note,
        },
      });
      return ok(leaveRequest);
    }

    if (action === "reject") {
      const leaveRequest = await prisma.leaveRequest.update({
        where: { id },
        data: {
          status: "rejected",
          respondedBy: session.userId,
          respondedAt: new Date(),
          note: body.note !== undefined ? body.note : existing.note,
        },
      });
      return ok(leaveRequest);
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
    const session = await requireAuth(req);
    const { id } = await params;

    const existing = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!existing) return notFound("Leave request not found");

    const roleLevel = (session as { roleLevel?: number }).roleLevel ?? 99;
    const isAdmin = roleLevel <= 1;
    const isOwner = existing.memberId === session.teamMemberId;

    if (!isOwner && !isAdmin) {
      return badRequest("You can only delete your own leave requests");
    }
    if (existing.status === "approved") {
      return badRequest("Cannot delete approved leave requests");
    }

    await prisma.leaveRequest.delete({ where: { id } });

    return ok({ id }, 200);
  } catch (err) {
    return handleError(err);
  }
}
