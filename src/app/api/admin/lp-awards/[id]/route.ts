import { handleError, ok } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermission("lp-awards", "read");
    const { id } = await params;
    const award = await prisma.lpAward.findUnique({
      where: { id },
      include: {
        task: { select: { id: true, title: true } },
        project: { select: { id: true, orderNumber: true, customerName: true } },
        member: { select: { id: true, name: true, role: true } },
        approver: { select: { id: true, name: true } },
      },
    });
    if (!award) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: award });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermission("lp-awards", "update");
    const { id } = await params;
    const data = await req.json();
    const existing = await prisma.lpAward.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Financial fields (lpAmount, expAmount) can only be set on pending awards.
    // Once approved/rejected, use the approve/reject endpoint to change status.
    // This prevents silent balance corruption from mid-edit PATCHes.
    if (existing.status !== "pending") {
      if (data.lpAmount !== undefined || data.expAmount !== undefined || data.status !== undefined) {
        return NextResponse.json(
          {
            error:
              "Cannot modify lpAmount, expAmount, or status on processed awards. " +
              "Use the approve/reject endpoint.",
          },
          { status: 409 }
        );
      }
    }

    // Sequential writes (PrismaNeon HTTP adapter does NOT support $transaction)
    const updated = await prisma.lpAward.update({
      where: { id },
      data: {
        source:
          existing.status === "pending" ? (data.source ?? undefined) : undefined,
        lpAmount:
          existing.status === "pending" && data.lpAmount !== undefined
            ? parseInt(data.lpAmount)
            : undefined,
        expAmount:
          existing.status === "pending" && data.expAmount !== undefined
            ? parseInt(data.expAmount)
            : undefined,
      },
    });
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "update",
        resource: "lp-awards",
        resourceId: id,
        oldValues: existing,
        newValues: data,
      },
    }).catch(() => { /* non-critical */ });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermission("lp-awards", "delete");
    const { id } = await params;

    // Load first so we know status before deleting
    const award = await prisma.lpAward.findUnique({
      where: { id },
      select: { status: true, memberId: true, lpAmount: true },
    });
    if (!award) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Sequential writes (PrismaNeon HTTP adapter does NOT support $transaction)
    if (award.status === "pending") {
      // Pending awards have LP locked — release it back to available
      const member = await prisma.teamMember.findUnique({
        where: { id: award.memberId },
        select: { lockedLp: true, availableLp: true },
      });
      if (member) {
        const toRelease = Math.min(award.lpAmount, member.lockedLp);
        await prisma.teamMember.update({
          where: { id: award.memberId },
          data: {
            lockedLp: { decrement: toRelease },
            availableLp: { increment: toRelease },
          },
        });
      }
    } else if (award.status === "approved") {
      // Approved awards have LP moved to available — deduct it back
      const member = await prisma.teamMember.findUnique({
        where: { id: award.memberId },
        select: { availableLp: true },
      });
      if (member) {
        await prisma.teamMember.update({
          where: { id: award.memberId },
          data: { availableLp: { decrement: award.lpAmount } },
        });
      }
    }
    // "rejected" awards: LP was never credited, nothing to reverse

    await prisma.lpAward.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: "delete",
        resource: "lp-awards",
        resourceId: id,
        newValues: { status: award.status, lpAmount: award.lpAmount, memberId: award.memberId },
      },
    }).catch(() => { /* non-critical */ });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
