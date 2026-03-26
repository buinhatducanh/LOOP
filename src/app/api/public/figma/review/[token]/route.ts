import { ok, notFound, badRequest, serverError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

// GET /api/public/figma/review/[token] — public, no auth
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const demo = await prisma.figmaDemo.findUnique({
      where: { clientToken: token },
      include: {
        project: {
          select: { id: true, orderNumber: true, customerName: true, customerEmail: true },
        },
      },
    });

    if (!demo) return notFound("Review link not found or expired.");
    return ok({
      id: demo.id,
      title: demo.title,
      figmaUrl: demo.figmaUrl,
      versionHash: demo.versionHash,
      status: demo.status,
      rejectionNote: demo.rejectionNote,
      sentAt: demo.sentAt,
      project: demo.project,
    });
  } catch (error) {
    console.error("Figma public review GET error:", error);
    return serverError();
  }
}

// POST /api/public/figma/review/[token] — client approves/rejects
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { action, comment } = await req.json();

    if (!["approve", "reject"].includes(action)) {
      return badRequest("Invalid action");
    }

    const demo = await prisma.figmaDemo.findUnique({
      where: { clientToken: token },
    });

    if (!demo) return notFound("Review link not found.");
    if (demo.status !== "pending" && demo.status !== "approved_by_client")
      return badRequest("This review has already been submitted.");

    const rejectionNote = action === "reject"
      ? (comment || "Client requested revisions.")
      : null;

    await prisma.figmaDemo.update({
      where: { id: demo.id },
      data: {
        status: action === "approve" ? "approved_by_client" : "rejected",
        rejectionNote,
      },
    });

    return ok({
      success: true,
      message: action === "approve"
        ? "Thank you for your approval!"
        : "Revision request submitted.",
    });
  } catch (error) {
    console.error("Figma public review POST error:", error);
    return serverError();
  }
}
