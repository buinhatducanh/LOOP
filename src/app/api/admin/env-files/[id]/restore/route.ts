import { handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

/**
 * POST /api/admin/env-files/[id]/restore
 * Restore an env file to a specific historical version.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _session = await requirePermission("projects", "update");
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = z.object({ version: z.number() }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "version required" }, { status: 400 });

    const snapshot = await prisma.envFileHistory.findFirst({
      where: { envFileId: id, version: parsed.data.version },
    });
    if (!snapshot) return NextResponse.json({ error: "Version not found" }, { status: 404 });

    const envFile = await prisma.envFile.findUnique({
      where: { id },
      include: { history: { orderBy: { version: "desc" }, take: 1 } },
    });
    if (!envFile) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const nextVersion = (envFile.history[0]?.version ?? 0) + 1;

    const updated = await prisma.envFile.update({
      where: { id },
      data: { content: snapshot.content, editedBy: session.userId },
    });

    await prisma.envFileHistory.create({
      data: {
        envFileId: id,
        content: snapshot.content,
        editedBy: session.userId,
        version: nextVersion,
      },
    });

    return NextResponse.json({ data: updated, restoredVersion: parsed.data.version });
  } catch (error) {
    return handleError(error);
  }
}
