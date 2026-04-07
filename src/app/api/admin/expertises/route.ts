import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { handleError, ok } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("expertises", "read");
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "true";
    const where = activeOnly ? { isActive: true } : {};

    const expertises = await prisma.expertise.findMany({
      where,
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    });

    return ok(expertises);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("expertises", "create");
    const data = await req.json();

    const expertise = await prisma.expertise.create({
      data: {
        name: data.name,
        category: data.category,
        // Translations (optional)
        nameEn: data.nameEn,
        nameJa: data.nameJa,
        nameKo: data.nameKo,
        nameZh: data.nameZh,
        categoryEn: data.categoryEn,
        categoryJa: data.categoryJa,
        categoryKo: data.categoryKo,
        categoryZh: data.categoryZh,
        // Non-translatable
        icon: data.icon || null,
        logo: data.logo || null,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive ?? true,
      },
    });

    return NextResponse.json({ data: expertise }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
