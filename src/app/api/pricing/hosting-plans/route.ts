/**
 * GET /api/pricing/hosting-plans
 *
 * Returns active hosting plans and domain prices for the web purchase wizard.
 * Public endpoint — no auth required.
 */
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";

export async function GET() {
 try {
 const [hostingPlans, domainPrices] = await Promise.all([
 prisma.pricingHostingPlan.findMany({
 where: { isActive: true },
 orderBy: { sortOrder: "asc" },
 select: {
 id: true,
 slug: true,
 name: true,
 nameVi: true,
 monthlyPrice: true,
 months: true,
 discountPct: true,
 period: true,
 periodVi: true,
 features: true,
 featuresVi: true,
 highlighted: true,
 color: true,
 },
 }),
 prisma.pricingDomainPrice.findMany({
 where: { isActive: true },
 orderBy: { sortOrder: "asc" },
 select: {
 id: true,
 extension: true,
 registrationPrice: true,
 renewalPrice: true,
 period: true,
 periodVi: true,
 note: true,
 noteVi: true,
 },
 }),
 ]);

 return ok({ hostingPlans, domainPrices });
 } catch (err) {
 return handleError(err);
 }
}
