/**
 * GET /api/admin/pricing/hosting-plans — list all
 * POST  /api/admin/pricing/hosting-plans — create
 * PUT /api/admin/pricing/hosting-plans — update (id in body)
 * DELETE /api/admin/pricing/hosting-plans?id= — delete
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { handleError, ok, badRequest } from "@/lib/api";

const planSchema = z.object({
 id: z.string().optional(),
 slug: z.string().min(1),
 name: z.string().min(1),
 nameVi: z.string().min(1),
 monthlyPrice: z.number().int().min(0),
 period: z.string().default("12 tháng"),
 periodVi: z.string().default("12 tháng"),
 months: z.number().int().min(1).max(60).default(12),
 discountPct: z.number().min(0).max(100).default(0),
 features: z.array(z.string()).default([]),
 featuresVi: z.array(z.string()).default([]),
 highlighted: z.boolean().default(false),
 color: z.string().default("#3B82F6"),
 sortOrder: z.number().int().min(0).default(0),
 isActive: z.boolean().default(true),
});

export async function GET() {
 try {
 await requirePermission("services", "read");
 const plans = await prisma.pricingHostingPlan.findMany({
 orderBy: { sortOrder: "asc" },
 });
 return ok(plans);
 } catch (err) {
 return handleError(err);
 }
}

export async function POST(req: NextRequest) {
 try {
 const session = await requirePermission("services", "create");
 const body = await req.json();
 const parsed = planSchema.safeParse(body);
 if (!parsed.success) return badRequest(parsed.error.message);
 const data = parsed.data;

 const plan = await prisma.pricingHostingPlan.create({
 data: {
 slug: data.slug,
 name: data.name,
 nameVi: data.nameVi,
 monthlyPrice: data.monthlyPrice,
 period: data.period,
 periodVi: data.periodVi,
 months: data.months,
 discountPct: data.discountPct,
 features: data.features,
 featuresVi: data.featuresVi,
 highlighted: data.highlighted,
 color: data.color,
 sortOrder: data.sortOrder,
 isActive: data.isActive,
 },
 });

 return ok(plan, 201);
 } catch (err) {
 return handleError(err);
 }
}

export async function PUT(req: NextRequest) {
 try {
 await requirePermission("services", "update");
 const body = await req.json();
 const parsed = planSchema.safeParse(body);
 if (!parsed.success) return badRequest(parsed.error.message);
 const data = parsed.data;

 if (!data.id) return badRequest("id is required for update");

 const plan = await prisma.pricingHostingPlan.update({
 where: { id: data.id },
 data: {
 slug: data.slug,
 name: data.name,
 nameVi: data.nameVi,
 monthlyPrice: data.monthlyPrice,
 period: data.period,
 periodVi: data.periodVi,
 months: data.months,
 discountPct: data.discountPct,
 features: data.features,
 featuresVi: data.featuresVi,
 highlighted: data.highlighted,
 color: data.color,
 sortOrder: data.sortOrder,
 isActive: data.isActive,
 },
 });

 return ok(plan);
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

 await prisma.pricingHostingPlan.delete({ where: { id } });
 return ok({ success: true });
 } catch (err) {
 return handleError(err);
 }
}
