import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

const createSchema = z.object({
  projectId: z.string(),
  memberId: z.string(),
  date: z.string().transform(s => new Date(s)),
  yesterdayDone: z.string().optional(),
  todayPlan: z.string().optional(),
  blockers: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requirePermission("projects", "read");
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") ?? searchParams.get("orderId");
    const memberId = searchParams.get("memberId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const data = await prisma.dailyStandup.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(memberId ? { memberId } : {}),
        ...(from || to ? {
          date: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        } : {}),
      },
      include: {
        project: { select: { id: true, orderNumber: true, customerName: true } },
      },
      orderBy: { date: "desc" },
    });
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("projects", "create");
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

    const existing = await prisma.dailyStandup.findUnique({
      where: {
        projectId_memberId_date: {
          projectId: parsed.data.projectId,
          memberId: parsed.data.memberId,
          date: parsed.data.date,
        },
      },
    });
    if (existing) {
      return NextResponse.json({ error: "Standup already exists for this date" }, { status: 409 });
    }

    const standup = await prisma.dailyStandup.create({
      data: {
        projectId: parsed.data.projectId,
        memberId: parsed.data.memberId,
        date: parsed.data.date,
        yesterdayDone: parsed.data.yesterdayDone,
        todayPlan: parsed.data.todayPlan,
        blockers: parsed.data.blockers,
      },
    });
    return NextResponse.json({ data: standup }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
