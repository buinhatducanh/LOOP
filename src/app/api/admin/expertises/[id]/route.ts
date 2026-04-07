import { NextRequest, NextResponse } from "next/server";
import { handleError, ok } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(req);
    const { id } = await params;

    const expertise = await prisma.expertise.findUnique({
      where: { id },
    });

    if (!expertise) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: expertise });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(req);
    const { id } = await params;
    const data = await req.json();

    const expertise = await prisma.expertise.update({
      where: { id },
      data: {
        name: data.name,
        category: data.category,
        nameEn: data.nameEn,
        nameJa: data.nameJa,
        nameKo: data.nameKo,
        nameZh: data.nameZh,
        categoryEn: data.categoryEn,
        categoryJa: data.categoryJa,
        categoryKo: data.categoryKo,
        categoryZh: data.categoryZh,
        icon: data.icon || null,
        logo: data.logo || null,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive ?? true,
      },
    });

    return NextResponse.json({ data: expertise });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(req);
    const { id } = await params;

    await prisma.expertise.delete({
      where: { id },
    });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
