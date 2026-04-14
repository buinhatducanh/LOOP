/**
 * GET /api/v1/web-packages
 *
 * Public endpoint — returns active PricingWebPackage list for the portal wizard.
 * No auth required.
 */
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";

export async function GET() {
 try {
 const packages = await prisma.pricingWebPackage.findMany({
 where: { isActive: true },
 orderBy: { sortOrder: "asc" },
 select: {
 id: true,
 slug: true,
  name: true,
 nameVi: true,
 tagline: true,
 taglineVi: true,
 price: true,
 currency: true,
 period: true,
 periodVi: true,
 highlighted: true,
 color: true,
 pages: true,
 pagesVi: true,
 },
 });

 return ok(packages);
 } catch (err) {
 return handleError(err);
 }
}
