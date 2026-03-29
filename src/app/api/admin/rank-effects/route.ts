import { handleError } from "@/lib/api/response";
import { ok, list } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("effects", "read");
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const skip = (page - 1) * limit;

    const [effects, total] = await Promise.all([
      prisma.rankEffect.findMany({
        skip,
        take: limit,
        orderBy: [{ isEnabled: "asc" }, { minRank: "asc" }, { minLevel: "asc" }],
      }),
      prisma.rankEffect.count(),
    ]);

    return list(effects, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("effects", "create");
    const data = await req.json();

    if (!data.name || !data.type || !data.minRank) {
      return ok({ error: "name, type, and minRank are required" }, 400);
    }

    const effect = await prisma.rankEffect.create({
      data: {
        name: data.name,
        description: data.description ?? "",
        type: data.type,
        rarity: data.rarity ?? "common",
        icon: data.icon ?? "Sparkles",
        color: data.color ?? "#818CF8",
        minRank: data.minRank,
        minLevel: parseInt(data.minLevel ?? "1"),
        maxLevel: data.maxLevel ? parseInt(data.maxLevel) : null,
        isEnabled: data.isEnabled ?? true,
      },
    });

    return ok(effect, 201);
  } catch (error) {
    return handleError(error);
  }
}
