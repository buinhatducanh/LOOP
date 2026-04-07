import { ok, notFound, badRequest, serverError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import type { NextRequest } from "next/server";

// GET /api/public/figma-review/[token]
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

    if (!demo) return notFound("Not found");
    return ok({
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
    });
  } catch (error) {
    console.error("Figma review GET error:", error);
    return serverError();
  }
}

// POST /api/public/figma-review/[token]
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
    if (!parsed.success) return badRequest("Invalid request");

    const demo = await prisma.figmaDemo.findUnique({
      where: { clientToken: token },
    });

    if (!demo) return notFound("Not found");
    if (demo.status !== "pending")
      return badRequest("Demo already reviewed");

    if (parsed.data.action === "approve") {
      await prisma.figmaDemo.update({
        where: { id: demo.id },
        data: { status: "approved_by_client", approvedAt: new Date() },
      });
    } else {
      await prisma.figmaDemo.update({
        where: { id: demo.id },
        data: { status: "rejected", rejectionNote: parsed.data.reason ?? null },
      });
    }

    return ok({ success: true, action: parsed.data.action });
  } catch (error) {
    console.error("Figma review POST error:", error);
    return serverError();
  }
}
