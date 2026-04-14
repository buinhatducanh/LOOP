/**
 * GET /api/admin/pricing/domain-prices — list all
 * POST /api/admin/pricing/domain-prices — create
 * PUT /api/admin/pricing/domain-prices — update
 * DELETE /api/admin/pricing/domain-prices?id= — delete
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { handleError, ok, badRequest } from "@/lib/api";

const schema = z.object({
 id: z.string().optional(),
 extension: z.string().min(1),
 registrationPrice: z.number().int().min(0),
 renewalPrice: z.number().int().min(0),
 period: z.string().default("1"),
 periodVi: z.string().default("1 năm"),
 note: z.string().optional(),
 noteVi: z.string().optional(),
 sortOrder: z.number().int().min(0).default(0),
 isActive: z.boolean().default(true),
});

export async function GET() {
 try {
 await requirePermission("services", "read");
 const prices = await prisma.pricingDomainPrice.findMany({
 orderBy: { sortOrder: "asc" },
 });
 return ok(prices);
 } catch (err) {
 return handleError(err);
 }
}

export async function POST(req: NextRequest) {
 try {
 await requirePermission("services", "create");
 const body = await req.json();
 const parsed = schema.safeParse(body);
 if (!parsed.success) return badRequest(parsed.error.message);
 const data = parsed.data;

 const price = await prisma.pricingDomainPrice.create({
 data: {
 extension: data.extension,
 registrationPrice: data.registrationPrice,
 renewalPrice: data.renewalPrice,
 period: data.period,
 periodVi: data.periodVi,
 note: data.note ?? null,
 noteVi: data.noteVi ?? null,
 sortOrder: data.sortOrder,
 isActive: data.isActive,
 },
 });

 return ok(price, 201);
 } catch (err) {
 return handleError(err);
 }
}

export async function PUT(req: NextRequest) {
 try {
 await requirePermission("services", "update");
 const body = await req.json();
 const parsed = schema.safeParse(body);
 if (!parsed.success) return badRequest(parsed.error.message);
 const data = parsed.data;

 if (!data.id) return badRequest("id is required for update");

 const price = await prisma.pricingDomainPrice.update({
 where: { id: data.id },
 data: {
 extension: data.extension,
 registrationPrice: data.registrationPrice,
 renewalPrice: data.renewalPrice,
 period: data.period,
 periodVi: data.periodVi,
 note: data.note ?? null,
 noteVi: data.noteVi ?? null,
 sortOrder: data.sortOrder,
 isActive: data.isActive,
 },
 });

 return ok(price);
 } catch (err) {
 return handleError(err);
 }
}

export async function DELETE(req: NextRequest) {
 try {
 await requirePermission("services", "delete");
 const { searchParams } = new URL(req.url);
 const id = searchParams.get("id");
 if (!id) return badRequest("id is required");

 await prisma.pricingDomainPrice.delete({ where: { id } });
 return ok({ success: true });
 } catch (err) {
 return handleError(err);
 }
}
