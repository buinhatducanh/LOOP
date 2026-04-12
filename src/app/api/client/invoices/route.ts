import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import { handleError, ok, list } from "@/lib/api";

export async function GET(req: NextRequest) {
 try {
 const session = await requireAuth(req);
 const { searchParams } = new URL(req.url);
 const page = parseInt(searchParams.get("page") ?? "1");
 const limit = parseInt(searchParams.get("limit") ?? "20");
 const status = searchParams.get("status");

 const where: Record<string, unknown> = { customerId: session.userId };
 if (status && status !== "all") where.status = status;

 const [items, total] = await Promise.all([
 prisma.invoice.findMany({
 where,
 orderBy: { createdAt: "desc" },
 skip: (page - 1) * limit,
 take: limit,
 }),
 prisma.invoice.count({ where }),
 ]);

 return list(items, { page, limit, total, totalPages: Math.ceil(total / limit) });
 } catch (err) {
 return handleError(err);
 }
}
