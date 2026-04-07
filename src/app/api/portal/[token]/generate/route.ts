import { handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { randomUUID } from "crypto";

// POST /api/portal/[token]/generate — generate a new portal link for a project
export async function POST(_req: NextRequest) {
  try {
    const _session = await requirePermission("projects", "read");
    const body = await req.json();
    const { projectId, label, expiresInDays } = body;

    if (!projectId) {
      return NextResponse.json({ error: "projectId bắt buộc" }, { status: 400 });
    }

    // Verify project exists
    const project = await prisma.order.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const token = randomUUID();
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const portalToken = await prisma.projectPortalToken.create({
      data: {
        projectId,
        token,
        label: label ?? "Client Portal",
        expiresAt,
        createdBy: session.userId,
      },
    });

    const portalUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn"}/portal/${token}`;

    return NextResponse.json({
      data: { ...portalToken, portalUrl },
    }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

// GET /api/portal/[token]/generate — list all portal tokens for a project
export async function GET(_req: NextRequest) {
  try {
    await requirePermission("projects", "read");
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId bắt buộc" }, { status: 400 });
    }

    const tokens = await prisma.projectPortalToken.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: tokens });
  } catch (error) {
    return handleError(error);
  }
}
