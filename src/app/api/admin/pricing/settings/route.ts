/**
 * GET  /api/admin/pricing/settings  — List all pricing-related site settings
 * PUT  /api/admin/pricing/settings  — Update one or more settings
 *
 * Manages:
 *   - custom_web_base_price  (default: 3000000 VND)
 *   - xp_per_level          (default: 100 XP)
 *   - lp_rate               (default: 500 LP = 500k VND)
 *   - vnd_per_lp            (default: 1000 VND per LP)
 *   - max_discount_percent  (default: 20%)
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { ok, handleError, badRequest } from "@/lib/api";
import { createAuditLog } from "@/lib/auth/audit";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("settings", "read");

    const PRICING_KEYS = [
      "custom_web_base_price",
      "xp_per_level",
      "lp_rate",
      "vnd_per_lp",
      "max_discount_percent",
      "lp_earn_per_million",
      "max_lp_per_order",
    ];

    const settings = await prisma.siteSetting.findMany({
      where: { key: { in: PRICING_KEYS } },
    });

    // Merge with defaults so UI always has values
    const defaults: Record<string, string> = {
      custom_web_base_price: "3000000",
      xp_per_level: "100",
      lp_rate: "500",
      vnd_per_lp: "1000",
      max_discount_percent: "20",
      lp_earn_per_million: "50",
      max_lp_per_order: "200000",
    };

    const merged = PRICING_KEYS.map((key) => {
      const found = settings.find((s) => s.key === key);
      return {
        key,
        value: found?.value ?? defaults[key] ?? "",
        group: found?.group ?? "pricing",
        type: found?.type ?? "string",
      };
    });

    return ok(merged);
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requirePermission("settings", "update");
    const body = await req.json();
    const { settings } = body as { settings: { key: string; value: string }[] };

    if (!Array.isArray(settings) || settings.length === 0) {
      return badRequest("settings là bắt buộc (array {key, value})");
    }

    const VALID_KEYS = [
      "custom_web_base_price",
      "xp_per_level",
      "lp_rate",
      "vnd_per_lp",
      "max_discount_percent",
      "lp_earn_per_million",
      "max_lp_per_order",
    ];

    const results = await Promise.all(
      settings.map(async ({ key, value }: { key: string; value: string }) => {
        if (!VALID_KEYS.includes(key)) return null;
        const num = parseInt(value, 10);
        if (isNaN(num) || num < 0) {
          throw new Error(`Giá trị không hợp lệ cho ${key}: ${value}`);
        }
        return prisma.siteSetting.upsert({
          where: { key },
          create: { key, value: String(num), group: "pricing", type: "number" },
          update: { value: String(num) },
        });
      })
    );

    const updated = results.filter(Boolean);

    // Audit log
    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "site-setting",
      resourceId: "pricing",
      newValues: Object.fromEntries(settings.map((s) => [s.key, s.value])),
    });

    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}
