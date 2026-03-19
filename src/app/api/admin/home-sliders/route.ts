import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const sliders = await prisma.homeSlider.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ data: sliders });
  } catch (e: any) {
    console.error("Error fetching sliders:", e);
    return NextResponse.json({ error: "Lỗi lấy dữ liệu", details: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, title, subtitle, link, sortOrder, isActive } = body;

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

    return NextResponse.json({ data: slider });
  } catch (e: any) {
    console.error("Error creating slider:", e);
    return NextResponse.json({ error: "Lỗi tạo slider", details: e.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, image, title, subtitle, link, sortOrder, isActive } = body;

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

    return NextResponse.json({ data: slider });
  } catch (e: any) {
    console.error("Error updating slider:", e);
    return NextResponse.json({ error: "Lỗi cập nhật slider", details: e.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Thiếu ID" }, { status: 400 });
    }

    await prisma.homeSlider.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Error deleting slider:", e);
    return NextResponse.json({ error: "Lỗi xóa slider", details: e.message }, { status: 500 });
  }
}
