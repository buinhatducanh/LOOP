import { handleError, ok } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

export async function GET(req: NextRequest) {
 try {
 await requirePermission("orders", "read");

 const { searchParams } = new URL(req.url);
 const orderType = searchParams.get("orderType");

 const where = orderType ? { orderType } : {};

 const [total, byStatus, byPaymentStatus] = await Promise.all([
 prisma.order.count({ where }),
 prisma.order.groupBy({
 by: ["status"],
 where,
 _count: true,
 }),
 prisma.order.groupBy({
 by: ["paymentStatus"],
 where,
 _count: true,
 }),
 ]);

 const statusCounts: Record<string, number> = {};
 for (const row of byStatus) {
 statusCounts[row.status] = row._count;
 }

 const paymentCounts: Record<string, number> = {};
 for (const row of byPaymentStatus) {
 paymentCounts[row.paymentStatus] = row._count;
 }

 return ok({ total, statusCounts, paymentCounts });
 } catch (error) {
 return handleError(error);
 }
}
