import { handleError, ok } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

export async function GET(
 _req: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
 await requirePermission("orders", "read");
 const { id } = await params;

 const history = await prisma.orderStatusHistory.findMany({
 where: { orderId: id },
 orderBy: { createdAt: "asc" },
 include: {
 // Try to get the user who made the change
 },
 });

 // Map changedBy to a readable label — changedBy stores userId
 // For now, just return the history
 return ok(history);
 } catch (error) {
 return handleError(error);
 }
}
