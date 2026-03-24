import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("projects", "read");
    const { id } = await params;
    const data = await prisma.envFile.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, orderNumber: true, customerName: true } },
        editor: { select: { id: true, name: true } },
        history: {
          orderBy: { version: "desc" },
          take: 20,
          include: { envFile: { select: { id: true } } },
        },
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
    const session = await requirePermission("projects", "update");
    const { id } = await params;
    const body = await req.json();
    const parsed = z.object({
      content: z.string().optional(),
    }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

    const envFile = await prisma.envFile.findUnique({
      where: { id },
      include: { history: { orderBy: { version: "desc" }, take: 1 } },
    });
    if (!envFile) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const nextVersion = (envFile.history[0]?.version ?? 0) + 1;

    const updated = await prisma.envFile.update({
      where: { id },
      data: {
        content: parsed.data.content ?? envFile.content,
        editedBy: session.userId,
      },
    });

    if (parsed.data.content !== undefined) {
      await prisma.envFileHistory.create({
        data: {
          envFileId: id,
          content: parsed.data.content,
          editedBy: session.userId,
          version: nextVersion,
        },
      });
    }

    return NextResponse.json({ data: updated });
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
    await prisma.envFile.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
