import { ok, serverError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

// Public API for pricing calculator
export async function GET() {
  try {
    const tiers = await prisma.infrastructureTier.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        nameVi: true,
        monthlyCost: true,
        setupCost: true,
        description: true,
        descriptionVi: true,
        icon: true,
        color: true,
      },
    });

    return ok(tiers);
  } catch (error) {
    console.error("Failed to fetch infrastructure tiers:", error);
    return serverError();
  }
}
