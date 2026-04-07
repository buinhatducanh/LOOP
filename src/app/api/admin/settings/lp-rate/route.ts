/**
 * LP Rate Config API
 * GET  /api/admin/settings/lp-rate  → get persisted LPRateConfig from SiteSetting
 * POST /api/admin/settings/lp-rate  → upsert LPRateConfig to SiteSetting
 */

import { handleError, ok } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

const SETTING_KEY = "lp_rate_config";

export async function GET(_req: NextRequest) {
  try {
    const session = await requirePermission("settings", "read");

    const setting = await prisma.siteSetting.findUnique({
      where: { key: SETTING_KEY },
    });

    if (!setting) {
      // Return default config if not yet persisted — do not create
      return ok({
        lp_to_vnd: 1_000,
        salary_iron: 500,
        salary_bronze: 1_200,
        salary_silver: 2_500,
        salary_gold: 5_000,
        salary_platinum: 10_000,
        salary_ruby: 22_000,
        salary_diamond: 50_000,
        perf_bonus_pct: 20,
        tet_bonus_months: 1.5,
        service_per_unit: 300,
        project_small: 500,
        project_medium: 1_500,
        project_large: 4_000,
      });
    }

    const config = JSON.parse(setting.value);
    return ok(config);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("settings", "update");
    const body = await req.json();

    // Basic validation
    if (typeof body.lp_to_vnd !== "number" || body.lp_to_vnd <= 0) {
      return NextResponse.json({ error: "lp_to_vnd must be a positive number" }, { status: 400 });
    }

    const config: Record<string, unknown> = {
      lp_to_vnd: body.lp_to_vnd,
      salary_iron: body.salary_iron ?? 500,
      salary_bronze: body.salary_bronze ?? 1_200,
      salary_silver: body.salary_silver ?? 2_500,
      salary_gold: body.salary_gold ?? 5_000,
      salary_platinum: body.salary_platinum ?? 10_000,
      salary_ruby: body.salary_ruby ?? 22_000,
      salary_diamond: body.salary_diamond ?? 50_000,
      perf_bonus_pct: body.perf_bonus_pct ?? 20,
      tet_bonus_months: body.tet_bonus_months ?? 1.5,
      service_per_unit: body.service_per_unit ?? 300,
      project_small: body.project_small ?? 500,
      project_medium: body.project_medium ?? 1_500,
      project_large: body.project_large ?? 4_000,
    };

    const value = JSON.stringify(config);
    const result = await prisma.siteSetting.upsert({
      where: { key: SETTING_KEY },
      update: { value, group: "lp" },
      create: { key: SETTING_KEY, value, group: "lp" },
    });

    return ok(result, 201);
  } catch (error) {
    return handleError(error);
  }
}
