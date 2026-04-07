/**
 * GET /api/services
 *
 * Returns all services grouped by category for navbar dropdowns.
 * Supports ?lang=vi|en|ja|ko|zh (default: vi).
 */

import { handleError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { parseLocaleParam, mapLocalizedService } from "@/lib/i18n/localization";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locale = parseLocaleParam(searchParams);

    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });

    const localized = services.map((s) => mapLocalizedService(s, locale));

    // Group services by category for navbar dropdowns
    const grouped: Record<string, typeof localized> = {};
    for (const service of localized) {
      const cat = (service.category as string | null) ?? "Khác";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(service);
    }

    return ok({ services: localized, grouped, categories: Object.keys(grouped) });
  } catch (error) {
    return handleError(error);
  }
}
