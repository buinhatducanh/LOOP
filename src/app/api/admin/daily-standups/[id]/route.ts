import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("projects", "read");
    const { id } = await params;
    const data = await prisma.dailyStandup.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, orderNumber: true, customerName: true } },
      },
    });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("projects", "update");
    const { id } = await params;
    const body = await req.json();
    const { yesterdayDone, todayPlan, blockers, date } = body;

    const data = await prisma.dailyStandup.update({
      where: { id },
      data: {
        ...(yesterdayDone !== undefined ? { yesterdayDone } : {}),
        ...(todayPlan !== undefined ? { todayPlan } : {}),
        ...(blockers !== undefined ? { blockers } : {}),
        ...(date !== undefined ? { date: new Date(date) } : {}),
      },
    });
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("projects", "delete");
    const { id } = await params;
    await prisma.dailyStandup.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
