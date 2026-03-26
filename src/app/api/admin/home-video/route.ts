import { NextRequest, NextResponse } from "next/server";
import { ok, handleError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const videos = await prisma.homeVideo.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ data: videos });
  } catch (e: any) {
    console.error("Error fetching videos:", e);
    return NextResponse.json({ error: "Lỗi lấy dữ liệu", details: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoUrl, thumbnail, title, description, isActive, sortOrder } = body;

    // Deactivate other videos first (only 1 active at a time)
    if (isActive) {
      await prisma.homeVideo.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    const video = await prisma.homeVideo.create({
      data: {
        videoUrl,
        thumbnail,
        title,
        description,
        isActive: isActive ?? true,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json({ data: video });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, videoUrl, thumbnail, title, description, isActive, sortOrder } = body;

    // If activating, deactivate others
    if (isActive) {
      await prisma.homeVideo.updateMany({
        where: { id: { not: id }, isActive: true },
        data: { isActive: false },
      });
    }

    const video = await prisma.homeVideo.update({
      where: { id },
      data: {
        ...(videoUrl && { videoUrl }),
        ...(thumbnail !== undefined && { thumbnail }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return NextResponse.json({ data: video });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Thiếu ID" }, { status: 400 });
    }

    await prisma.homeVideo.delete({ where: { id } });

    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
