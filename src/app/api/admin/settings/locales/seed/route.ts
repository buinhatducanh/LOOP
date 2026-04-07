/**
 * POST /api/admin/settings/locales/seed
 * Seed initial supported locales. Safe to run multiple times.
 */


import { requirePermissionFast } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { handleError } from "@/lib/api";

const SEED_LOCALES = [
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt",  isEnabled: true,  isDefault: true,  order: 1 },
  { code: "en", name: "English",   nativeName: "English",   isEnabled: true,  isDefault: false, order: 2 },
  { code: "ja", name: "Japanese",  nativeName: "日本語",        isEnabled: true,  isDefault: false, order: 3 },
  { code: "ko", name: "Korean",    nativeName: "한국어",        isEnabled: true,  isDefault: false, order: 4 },
  { code: "zh", name: "Chinese",   nativeName: "简体中文",       isEnabled: true,  isDefault: false, order: 5 },
];

export async function POST() {
  try {
    const _session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    requirePermissionFast(session, "settings", "update");

    await Promise.all(
      SEED_LOCALES.map((locale) =>
        prisma.supportedLocale.upsert({
          where: { code: locale.code },
          update: {
            name: locale.name,
            nativeName: locale.nativeName,
            isEnabled: locale.isEnabled,
            isDefault: locale.isDefault,
            order: locale.order,
          },
          create: locale,
        })
      )
    );

    const all = await prisma.supportedLocale.findMany({ orderBy: { order: "asc" } });
    return ok({ seeded: SEED_LOCALES.length, locales: all });
  } catch (err) {
    return handleError(err);
  }
}