/**
 * GET  /api/portal/demos/[token] — Public token-based FigmaDemo access (no auth)
 * PATCH /api/portal/demos/[token] — Client comments / rejects / approves demo
 *
 * PATCH requires customer or staff auth so that only authorized users
 * can update demo status.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import { handleError } from "@/lib/api";
import { ok, notFound, badRequest } from "@/lib/api/response";

const patchSchema = z.object({
  status: z.enum(["approved_by_client", "rejected"]),
  rejectionNote: z.string().optional(),
});

/**
 * GET /api/portal/demos/[token]
 * Public — no auth required.
 * Returns demo metadata (id, title, figmaUrl, status, versionHash, sentAt, projectId).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const demo = await prisma.figmaDemo.findUnique({
      where: { clientToken: token },
      select: {
        id: true,
        title: true,
        figmaUrl: true,
        status: true,
        versionHash: true,
        sentAt: true,
        projectId: true,
        rejectionNote: true,
        approvedAt: true,
      },
    });

    if (!demo) {
      return notFound("Demo không tồn tại hoặc link đã hết hạn");
    }

    return ok(demo);
  } catch (err) {
    return handleError(err);
  }
}

/**
 * PATCH /api/portal/demos/[token]
 * Auth required (customer or staff).
 * Allows client to comment, reject, or approve a Figma demo.
 *
 * Body: { status: "approved_by_client" | "rejected", rejectionNote?: string }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await requireAuth(req);
    const { token } = await params;

    const demo = await prisma.figmaDemo.findUnique({
      where: { clientToken: token },
      include: { project: { select: { id: true, orderNumber: true } } },
    });

    if (!demo) {
      return notFound("Demo không tồn tại hoặc link đã hết hạn");
    }

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.message);

    const { status, rejectionNote } = parsed.data;

    const updated = await prisma.figmaDemo.update({
      where: { id: demo.id },
      data: {
        status,
        rejectionNote: status === "rejected" ? (rejectionNote ?? null) : demo.rejectionNote,
        approvedAt: status === "approved_by_client" ? new Date() : null,
      },
      select: {
        id: true,
        title: true,
        status: true,
        versionHash: true,
        rejectionNote: true,
        approvedAt: true,
        sentAt: true,
        projectId: true,
      },
    });

    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}
