import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// GET /api/public/figma-review/[token]
// Returns FigmaDemo by clientToken (no auth required)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const demo = await prisma.figmaDemo.findUnique({
      where: { clientToken: token },
      include: {
        project: {
          select: { orderNumber: true, customerName: true, customerEmail: true },
        },
      },
    });

    if (!demo) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: demo.id,
        title: demo.title,
        figmaUrl: demo.figmaUrl,
        versionHash: demo.versionHash,
        status: demo.status,
        rejectionNote: demo.rejectionNote,
        approvedBy: demo.approvedBy,
        approvedAt: demo.approvedAt,
        sentAt: demo.sentAt,
        createdAt: demo.createdAt,
        project: demo.project,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/public/figma-review/[token]
// Client approves or rejects a demo
const actionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await req.json();
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const demo = await prisma.figmaDemo.findUnique({
      where: { clientToken: token },
    });

    if (!demo) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (demo.status !== "pending") {
      return NextResponse.json({ error: "Demo already reviewed" }, { status: 400 });
    }

    if (parsed.data.action === "approve") {
      await prisma.figmaDemo.update({
        where: { id: demo.id },
        data: {
          status: "approved_by_client",
          approvedAt: new Date(),
        },
      });
    } else {
      await prisma.figmaDemo.update({
        where: { id: demo.id },
        data: {
          status: "rejected",
          rejectionNote: parsed.data.reason ?? null,
        },
      });
    }

    return NextResponse.json({ success: true, action: parsed.data.action });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
