import { ok, handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

// ─── GET /api/admin/media-bookings/[id] ───────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("media-bookings", "read");
    const { id } = await params;

    const booking = await prisma.mediaBooking.findUnique({
      where: { id },
      include: {
        package: { select: { title: true } },
        teamMember: { select: { id: true, name: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return ok(booking);
  } catch (error) {
    return handleError(error);
  }
}

// ─── PUT /api/admin/media-bookings/[id] ───────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("media-bookings", "update");
    const { id } = await params;
    const data = await req.json();

    const existing = await prisma.mediaBooking.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Guard: deliveredAt can only be set once (first time → delivered)
    // Guard: approvedAt can only be set once (first time → approved)
    // These are idempotent: setting them again is a no-op

    const updateData: Record<string, unknown> = {};

    // Scalar fields
    if (data.packageId !== undefined) updateData.packageId = data.packageId || null;
    if (data.orderId !== undefined) updateData.orderId = data.orderId || null;
    if (data.customerName !== undefined) updateData.customerName = data.customerName;
    if (data.customerEmail !== undefined) updateData.customerEmail = data.customerEmail;
    if (data.customerPhone !== undefined) updateData.customerPhone = data.customerPhone || null;
    if (data.companyName !== undefined) updateData.companyName = data.companyName || null;
    if (data.bookingType !== undefined) updateData.bookingType = data.bookingType;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.requirements !== undefined) updateData.requirements = data.requirements || null;
    if (data.note !== undefined) updateData.note = data.note || null;
    if (data.revisionNotes !== undefined) updateData.revisionNotes = data.revisionNotes || null;
    if (data.deadline !== undefined) updateData.deadline = data.deadline ? new Date(data.deadline) : null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.paymentStatus !== undefined) updateData.paymentStatus = data.paymentStatus;
    if (data.totalAmount !== undefined) updateData.totalAmount = data.totalAmount ? parseInt(data.totalAmount, 10) : null;
    if (data.paidAmount !== undefined) updateData.paidAmount = parseInt(data.paidAmount, 10);
    if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo || null;
    if (data.teamMemberId !== undefined) updateData.teamMemberId = data.teamMemberId || null;

    // Timestamps: only set if not already set (idempotent)
    if (data.deliveredAt !== undefined && !existing.deliveredAt) {
      updateData.deliveredAt = new Date();
    }
    if (data.approvedAt !== undefined && !existing.approvedAt) {
      updateData.approvedAt = new Date();
      updateData.approvedBy = session.userId;
    }
    if (data.rejectedAt !== undefined && !existing.rejectedAt) {
      updateData.rejectedAt = new Date();
      updateData.rejectedBy = session.userId;
    }

    // Media assets (JSON array)
    if (data.deliveredAssets !== undefined) {
      updateData.deliveredAssets = Array.isArray(data.deliveredAssets) ? data.deliveredAssets : [];
    }

    const updated = await prisma.mediaBooking.update({
      where: { id },
      data: updateData,
      include: {
        package: { select: { title: true } },
        teamMember: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "media-bookings",
      resourceId: id,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: data,
    });

    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}

// ─── DELETE /api/admin/media-bookings/[id] ────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("media-bookings", "delete");
    const { id } = await params;

    const existing = await prisma.mediaBooking.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Guard: only pending/cancelled bookings can be deleted
    const ALLOWED_DELETE = ["pending", "cancelled"];
    if (!ALLOWED_DELETE.includes(existing.status)) {
      return NextResponse.json(
        { error: `Cannot delete booking with status "${existing.status}". Only pending or cancelled bookings can be deleted.` },
        { status: 409 }
      );
    }

    await prisma.mediaBooking.delete({ where: { id } });

    await createAuditLog({
      userId: session.userId,
      action: "delete",
      resource: "media-bookings",
      resourceId: id,
      oldValues: existing as unknown as Record<string, unknown>,
    });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
