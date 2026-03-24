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
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
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

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "lp-awards",
      resourceId: id,
      oldValues: existing,
      newValues: data,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requirePermission("lp-awards", "delete");
    const { id } = await params;
    await prisma.lpAward.delete({ where: { id } });
    await createAuditLog({ userId: session.userId, action: "delete", resource: "lp-awards", resourceId: id });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
