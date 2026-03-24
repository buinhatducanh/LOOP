import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/public/figma/review/[token] — public, no auth
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;

    const demo = await prisma.figmaDemo.findUnique({
      where: { clientToken: token },
      include: {
        project: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            customerEmail: true,
          },
        },
      },
    });

    if (!demo) {
      return NextResponse.json({ error: "Review link not found or expired." }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: demo.id,
        title: demo.title,
        figmaUrl: demo.figmaUrl,
        versionHash: demo.versionHash,
        status: demo.status,
        rejectionNote: demo.rejectionNote,
        sentAt: demo.sentAt,
        project: demo.project,
      },
    });
  } catch (error) {
    console.error("Figma public review error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/public/figma/review/[token] — client approves/rejects
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const { action, comment } = await req.json(); // "approve" | "reject"

    const demo = await prisma.figmaDemo.findUnique({
      where: { clientToken: token },
      include: { project: { select: { customerName: true } } },
    });

    if (!demo) {
      return NextResponse.json({ error: "Review link not found." }, { status: 404 });
    }

    if (demo.status !== "pending" && demo.status !== "approved_by_client") {
      return NextResponse.json({ error: "This review has already been submitted." }, { status: 400 });
    }

    const rejectionNote = action === "reject"
      ? (comment || "Client requested revisions.")
      : null;

    if (action === "approve") {
      await prisma.figmaDemo.update({
        where: { id: demo.id },
        data: {
          status: "approved_by_client",
        },
      });
      return NextResponse.json({ success: true, message: "Thank you for your approval!" });
    }

    if (action === "reject") {
      await prisma.figmaDemo.update({
        where: { id: demo.id },
        data: {
          status: "rejected",
          rejectionNote,
        },
      });
      return NextResponse.json({ success: true, message: "Revision request submitted." });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Figma review submit error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
