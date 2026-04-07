import { NextRequest, NextResponse } from "next/server";
import { ok, handleError, badRequest } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

export async function GET(req: NextRequest) {
  try {
    const sliders = await prisma.homeSlider.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ data: sliders });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission("home-sliders", "create");
    const body = await request.json();
    const { image, title, subtitle, link, sortOrder, isActive } = body;

    if (!image || !title) {
      return badRequest("image and title are required");
    }

    const slider = await prisma.homeSlider.create({
      data: {
        image,
        title,
        subtitle,
        link,
        sortOrder: sortOrder || 0,
        isActive: isActive ?? true,
      },
    });

    return ok(slider, 201);
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requirePermission("home-sliders", "update");
    const body = await request.json();
    const { id, image, title, subtitle, link, sortOrder, isActive } = body;

    if (!id) return badRequest("Slider ID is required");

    const slider = await prisma.homeSlider.update({
      where: { id },
      data: {
        ...(image && { image }),
        ...(title !== undefined && { title }),
        ...(subtitle !== undefined && { subtitle }),
        ...(link !== undefined && { link }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return ok(slider);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requirePermission("home-sliders", "delete");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return badRequest("Slider ID is required");
    }

    await prisma.homeSlider.delete({ where: { id } });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
