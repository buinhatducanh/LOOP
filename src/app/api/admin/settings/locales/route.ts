/**
 * GET /api/admin/settings/locales
 * List all supported locales.
 * POST /api/admin/settings/locales
 * Create or update supported locales (bulk upsert).
 */

import { NextResponse } from "next/server";
import { requirePermissionFast } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { ok, badRequest, handleError } from "@/lib/api";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    requirePermissionFast(session, "settings", "read");

    const locales = await prisma.supportedLocale.findMany({
      orderBy: { order: "asc" },
    });
    return ok(locales);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    requirePermissionFast(session, "settings", "update");

    const body = await req.json();
    if (!Array.isArray(body.locales)) {
      return badRequest("locales must be an array");
    }

    // Upsert each locale
    await Promise.all(
      body.locales.map((locale: {
        code: string;
        name: string;
        nativeName: string;
        isEnabled: boolean;
        isDefault: boolean;
        order: number;
      }) =>
        prisma.supportedLocale.upsert({
          where: { code: locale.code },
          update: {
            name: locale.name,
            nativeName: locale.nativeName,
            isEnabled: locale.isEnabled,
            isDefault: locale.isDefault,
            order: locale.order,
          },
          create: {
            code: locale.code,
            name: locale.name,
            nativeName: locale.nativeName,
            isEnabled: locale.isEnabled,
            isDefault: locale.isDefault,
            order: locale.order,
          },
        })
      )
    );

    // Ensure only one default
    const defaults = body.locales.filter((l: { isDefault: boolean }) => l.isDefault);
    if (defaults.length > 1) {
      return badRequest("Only one locale can be default");
    }

    const all = await prisma.supportedLocale.findMany({ orderBy: { order: "asc" } });
    return ok(all, 201);
  } catch (err) {
    return handleError(err);
  }
}
