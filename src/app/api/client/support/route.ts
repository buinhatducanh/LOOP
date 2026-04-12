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
 const status = searchParams.get("status");

 const where: Record<string, unknown> = { userId: session.userId };
 if (status && status !== "all") where.status = status;

 const [items, total] = await Promise.all([
 prisma.supportTicket.findMany({
 where,
 orderBy: { createdAt: "desc" },
 skip: (page - 1) * limit,
 take: limit,
 // No order relation — use orderId field
 }),
 prisma.supportTicket.count({ where }),
 ]);

 return list(items, { page, limit, total, totalPages: Math.ceil(total / limit) });
 } catch (err) {
 return handleError(err);
 }
}

const createSchema = z.object({
 orderId: z.string().optional(),
 subject: z.string().min(1, "Subject is required").max(200),
 description: z.string().min(10, "Description must be at least 10 characters"),
 priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
});

export async function POST(req: NextRequest) {
 try {
 const session = await requireAuth(req);
 const body = await req.json();
 const parsed = createSchema.safeParse(body);
 if (!parsed.success) return badRequest(parsed.error.message);

 const ticket = await prisma.supportTicket.create({
 data: {
 userId: session.userId,
 orderId: parsed.data.orderId ?? null,
 subject: parsed.data.subject,
 description: parsed.data.description,
 priority: parsed.data.priority,
 status: "open",
 },
 });

 return ok(ticket, 201);
 } catch (err) {
 return handleError(err);
 }
}
