import { NextRequest, NextResponse } from "next/server";
import { ok, handleError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/permissions";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
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
    await requireAuth();
    const { id } = await params;
    const data = await req.json();

    const expertise = await prisma.expertise.update({
      where: { id },
      data: {
        name: data.name,
        nameVi: data.nameVi,
        category: data.category,
        categoryVi: data.categoryVi,
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
    await requireAuth();
    const { id } = await params;

    await prisma.expertise.delete({
      where: { id },
    });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
