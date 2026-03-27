import { ok, handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

// ─── Status flow ───────────────────────────────────────────────────────────────
//
//  pending ──→ confirmed ──→ in_progress ──→ delivered ──→ approved
//     │                                        │
//     └────────────────→ cancelled ←─────────────┘
//                                        │
//                                        └──→ rejected
//
// Rejected can go back to in_progress for revision.

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending:      ["confirmed", "cancelled"],
  confirmed:    ["in_progress", "cancelled"],
  in_progress: ["delivered", "cancelled"],
  delivered:   ["approved", "rejected"],
  approved:    [],       // terminal
  rejected:    ["in_progress"], // allow revision round
  cancelled:   [],       // terminal
};

// ─── POST /api/admin/media-bookings/[id]/transition ───────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("media-bookings", "update");
    const { id } = await params;
    const body = await req.json();
    const { toStatus, note } = body;

    if (!toStatus || typeof toStatus !== "string") {
      return NextResponse.json(
        { error: "toStatus is required" },
        { status: 400 }
      );
    }

    const booking = await prisma.mediaBooking.findUnique({ where: { id } });
    if (!booking) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const validNext = VALID_TRANSITIONS[booking.status] ?? [];
    if (!validNext.includes(toStatus)) {
      return NextResponse.json(
        {
          error: `Invalid transition from "${booking.status}" to "${toStatus}". Valid transitions: ${validNext.join(", ") || "none"}.`,
        },
        { status: 422 }
      );
    }

    // Build update payload
    const updateData: Record<string, unknown> = { status: toStatus };

    if (note) {
      // Append to existing revisionNotes
      const existingNote = booking.note ?? "";
      updateData.note = existingNote ? `${existingNote}\n[${new Date().toISOString()}] ${note}` : note;
    }

    // Auto-set timestamps on specific transitions
    if (toStatus === "delivered") {
      updateData.deliveredAt = new Date();
    }
    if (toStatus === "approved") {
      updateData.approvedAt = new Date();
      updateData.approvedBy = session.userId;
    }
    if (toStatus === "rejected") {
      updateData.rejectedAt = new Date();
      updateData.rejectedBy = session.userId;
    }

    const updated = await prisma.mediaBooking.update({
      where: { id },
      data: updateData,
      include: {
        package: { select: { title: true } },
        teamMember: { select: { name: true } },
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "media-bookings",
      resourceId: id,
      newValues: { status: toStatus, note },
    });

    return ok(updated);
  } catch (error) {
    return handleError(error);
  }
}
