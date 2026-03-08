import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import type { Prisma } from "@/generated/prisma/client";

export async function createAuditLog(params: {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
}) {
  const headersList = await headers();
  const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip");
  const userAgent = headersList.get("user-agent");

  return prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      oldValues: params.oldValues as Prisma.InputJsonValue | undefined,
      newValues: params.newValues as Prisma.InputJsonValue | undefined,
      ipAddress,
      userAgent,
    },
  });
}
