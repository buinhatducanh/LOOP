import { handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

export async function GET(_req: NextRequest) {
  try {
    await requirePermission("env-files", "read");
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") ?? searchParams.get("orderId");
    const environment = searchParams.get("environment");

    const data = await prisma.envFile.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(environment ? { environment } : {}),
      },
      include: {
        project: { select: { id: true, orderNumber: true, customerName: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(_req: NextRequest) {
  try {
    await requirePermission("env-files", "update");
    const body = await req.json();
    const parsed = z.object({
      projectId: z.string(),
      environment: z.enum(["dev", "staging", "production", "prod"]),
      fileKey: z.string(),
      content: z.string(),
    }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

    // Upsert: unique per projectId + environment + fileKey
    const existing = await prisma.envFile.findUnique({
      where: {
        projectId_environment_fileKey: {
          projectId: parsed.data.projectId,
          environment: parsed.data.environment,
          fileKey: parsed.data.fileKey,
        },
      },
    });

    let envFile;
    if (existing) {
      // Snapshot history
      await prisma.envFileHistory.create({
        data: {
          envFileId: existing.id,
          content: existing.content,
          version: existing.version,
        },
      });
      envFile = await prisma.envFile.update({
        where: { id: existing.id },
        data: {
          content: parsed.data.content,
          version: { increment: 1 },
          editedBy: body.editedBy ?? null,
        },
      });
    } else {
      envFile = await prisma.envFile.create({
        data: {
          projectId: parsed.data.projectId,
          environment: parsed.data.environment,
          fileKey: parsed.data.fileKey,
          content: parsed.data.content,
          version: 1,
          editedBy: body.editedBy ?? null,
        },
      });
      await prisma.envFileHistory.create({
        data: {
          envFileId: envFile.id,
          content: parsed.data.content,
          version: 1,
          editedBy: body.editedBy ?? null,
        },
      });
    }

    await createAuditLog({
      userId: body.editedBy ?? "system",
      action: existing ? "update" : "create",
      resource: "env-files",
      resourceId: envFile.id,
      newValues: { fileKey: parsed.data.fileKey, environment: parsed.data.environment },
    });

    return NextResponse.json({ data: envFile }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
