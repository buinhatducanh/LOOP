import { handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

export async function GET(_req: NextRequest) {
  try {
    const _session = await requirePermission("settings", "read");

    const settings = await prisma.siteSetting.findMany({
      orderBy: { key: "asc" },
    });

    // Group settings by the `group` field
    const grouped: Record<string, Record<string, string>> = {};
    for (const setting of settings) {
      if (!grouped[setting.group]) {
        grouped[setting.group] = {};
      }
      grouped[setting.group][setting.key] = setting.value;
    }

    return NextResponse.json({ data: grouped });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(_req: NextRequest) {
  try {
    const _session = await requirePermission("settings", "update");
    const { settings } = await req.json();

    if (!Array.isArray(settings)) {
      return NextResponse.json({ error: "settings must be an array" }, { status: 400 });
    }

    const oldSettings = await prisma.siteSetting.findMany({
      where: { key: { in: settings.map((s: { key: string }) => s.key) } },
    });
    const oldMap: Record<string, string> = {};
    for (const s of oldSettings) {
      oldMap[s.key] = s.value;
    }

    const results = [];
    for (const item of settings) {
      const { key, value, group } = item as { key: string; value: string; group: string };
      const result = await prisma.siteSetting.upsert({
        where: { key },
        update: { value, group },
        create: { key, value, group },
      });
      results.push(result);
    }

    const newMap: Record<string, string> = {};
    for (const s of results) {
      newMap[s.key] = s.value;
    }

    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "settings",
      oldValues: oldMap,
      newValues: newMap,
    });

    return NextResponse.json({ data: results });
  } catch (error) {
    return handleError(error);
  }
}
