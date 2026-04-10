import { handleError, ok } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { randomUUID } from "crypto";

// GET /api/admin/portal?projectId=xxx — list portal tokens
// POST /api/admin/portal — create portal token
export async function GET(req: NextRequest) {
  try {
    await requirePermission("projects", "read");
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    if (!projectId) return NextResponse.json({ error: "projectId bắt buộc" }, { status: 400 });

    const tokens = await prisma.projectPortalToken.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: tokens });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("projects", "update");
    const body = await req.json();
    const { projectId, label, expiresInDays } = body;

    if (!projectId) return NextResponse.json({ error: "projectId bắt buộc" }, { status: 400 });

    const project = await prisma.order.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

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

    const portalUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loops.vn"}/portal/${token}`;

    return NextResponse.json({ data: { ...portalToken, portalUrl } }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requirePermission("projects", "delete");
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id bắt buộc" }, { status: 400 });

    await prisma.projectPortalToken.delete({ where: { id } });
    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
