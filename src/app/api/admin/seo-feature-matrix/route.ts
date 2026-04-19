/**
 * GET  /api/admin/seo-feature-matrix — Get SEO feature inclusion matrix
 *     Returns: { [featureId]: [tierLevels...] }
 * POST /api/admin/seo-feature-matrix — Save full matrix + free tier config
 *     Body: { matrix: { [featureId]: [tierLevels...] }, freeTier: { isActive, label, features } }
 *
 * Stored in SiteSetting with group = "seo"
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { ok, handleError } from "@/lib/api";
import { createAuditLog } from "@/lib/auth/audit";

const MATRIX_KEY = "seo_feature_matrix";
const FREE_TIER_KEY = "seo_free_tier";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("services", "read");

    const [matrixSetting, freeTierSetting] = await Promise.all([
      prisma.siteSetting.findUnique({ where: { key: MATRIX_KEY } }),
      prisma.siteSetting.findUnique({ where: { key: FREE_TIER_KEY } }),
    ]);

    // Also fetch all SEO features
    const features = await prisma.serviceAttribute.findMany({
      where: { serviceKey: "seo" },
      select: {
        id: true,
        name: true,
        nameVi: true,
        description: true,
        price: true,
        sortOrder: true,
        isRequired: true,
      },
      orderBy: { sortOrder: "asc" },
    });

    const matrix = matrixSetting?.value ? JSON.parse(matrixSetting.value) : {};
    const freeTier = freeTierSetting?.value ? JSON.parse(freeTierSetting.value) : null;

    return ok({ matrix, freeTier, features });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("services", "update");
    const body = await req.json();
    const { matrix, freeTier } = body;

    if (matrix !== undefined) {
      // Upsert matrix in SiteSetting
      await prisma.siteSetting.upsert({
        where: { key: MATRIX_KEY },
        create: { key: MATRIX_KEY, value: JSON.stringify(matrix), group: "seo", type: "json" },
        update: { value: JSON.stringify(matrix) },
      });
    }

    if (freeTier !== undefined) {
      await prisma.siteSetting.upsert({
        where: { key: FREE_TIER_KEY },
        create: { key: FREE_TIER_KEY, value: JSON.stringify(freeTier), group: "seo", type: "json" },
        update: { value: JSON.stringify(freeTier) },
      });
    }

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "seo_feature_matrix",
      resourceId: "seo",
      newValues: { matrix, freeTier },
    });

    return ok({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
