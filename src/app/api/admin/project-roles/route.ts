import { handleError, ok } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

export async function GET(_req: NextRequest) {
 try {
 await requirePermission("project-members", "read");
 const roles = await prisma.projectRole.findMany({
 where: { isActive: true },
 orderBy: { sortOrder: "asc" },
 });
 return ok(roles);
 } catch (error) {
 return handleError(error);
 }
}
