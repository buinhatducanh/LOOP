/**
 * GET /api/team
 *
 * Returns all active team members ordered by role level + name.
 * Supports ?lang=vi|en|ja|ko|zh (default: vi).
 */

import { handleError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { parseLocaleParam, mapLocalizedTeamMember } from "@/lib/i18n/localization";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locale = parseLocaleParam(searchParams);

    const members = await prisma.teamMember.findMany({
      where: { isActive: true },
      orderBy: [{ roleLevel: "asc" }, { sortOrder: "asc" }],
    });

    const localized = members.map((m) => mapLocalizedTeamMember(m, locale));
    return ok(localized);
  } catch (error) {
    return handleError(error);
  }
}
