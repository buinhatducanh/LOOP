import { handleError, ok } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { revalidatePath, revalidateTag } from "next/cache";

/**
 * POST /api/admin/features/toggle-tier
 *
 * Toggle a feature's inclusion in a specific tier (tierLevel).
 * Updates BOTH:
 *   1. Feature.includedTiers  (the authoritative field)
 *   2. ServicePackage.features (adds/removes Feature CUID from the right package)
 *
 * This ensures both the Feature model and ServicePackage.features stay in sync
 * even if the seed script set includedTiers=[].
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("pricing_features", "update");
    const { featureId, tierLevel, included, includedTiers } = await req.json() as {
      featureId: string;
      tierLevel: number;
      included: boolean;
      includedTiers: number[];
    };

    // 1. Update Feature.includedTiers
    await prisma.feature.update({
      where: { id: featureId },
      data: { includedTiers },
    });

    // 2. Sync ServicePackage.features — find the package for this tierLevel
    const pkg = await prisma.servicePackage.findFirst({
      where: { type: "website", tierLevel },
    });

    if (pkg) {
      const currentFeatures = (pkg.features as string[]) ?? [];
      const updatedFeatures = included
        ? currentFeatures.includes(featureId)
          ? currentFeatures
          : [...currentFeatures, featureId]
        : currentFeatures.filter(id => id !== featureId);

      await prisma.servicePackage.update({
        where: { id: pkg.id },
        data: { features: updatedFeatures },
      });
    }

    revalidatePath("/vi/thiet-ke-website");
    revalidatePath("/en/thiet-ke-website");
    revalidateTag("pricing-config");

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
