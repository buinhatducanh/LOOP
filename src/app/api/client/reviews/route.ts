import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import { handleError, ok, list, badRequest } from "@/lib/api";
import { z } from "zod";

export async function GET(req: NextRequest) {
 try {
 const session = await requireAuth(req);
 const { searchParams } = new URL(req.url);
 const page = parseInt(searchParams.get("page") ?? "1");
 const limit = parseInt(searchParams.get("limit") ?? "20");

 const [items, total] = await Promise.all([
 prisma.projectReview.findMany({
 where: { userId: session.userId },
 orderBy: { createdAt: "desc" },
 skip: (page - 1) * limit,
 take: limit,
 }),
 prisma.projectReview.count({ where: { userId: session.userId } }),
 ]);

 return list(items, { page, limit, total, totalPages: Math.ceil(total / limit) });
 } catch (err) {
 return handleError(err);
 }
}

const createSchema = z.object({
 orderId: z.string().min(1),
 rating: z.number().int().min(1).max(5),
 title: z.string().optional(),
 comment: z.string().optional(),
	aspects: z.any().optional(),
});

export async function POST(req: NextRequest) {
 try {
 const session = await requireAuth(req);
 const body = await req.json();
 const parsed = createSchema.safeParse(body);
 if (!parsed.success) return badRequest(parsed.error.message);

 // Check if order exists and is completed
 const order = await prisma.order.findUnique({
 where: { id: parsed.data.orderId },
 select: { id: true, status: true, customerEmail: true },
 });

 if (!order) return badRequest("Order not found");

 // Verify order belongs to session user via email
 const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { email: true } });
 if (!user || order.customerEmail !== user.email) return badRequest("Not your order");

 if (order.status !== "completed" && order.status !== "done") {
 return badRequest("Can only review completed orders");
 }

 // Check if already reviewed
 const existing = await prisma.projectReview.findFirst({
 where: { orderId: parsed.data.orderId, userId: session.userId },
 });
 if (existing) return badRequest("Already reviewed this order");

 const review = await prisma.projectReview.create({
 data: {
 orderId: parsed.data.orderId,
 userId: session.userId,
 rating: parsed.data.rating,
 title: parsed.data.title ?? null,
 comment: parsed.data.comment ?? null,
 aspects: parsed.data.aspects ?? undefined,
 },
 });

 return ok(review, 201);
 } catch (err) {
 return handleError(err);
 }
}
