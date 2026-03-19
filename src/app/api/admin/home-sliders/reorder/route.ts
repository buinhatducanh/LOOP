import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const updates = body.updates as Array<{ id: string; sortOrder: number }>;

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
    }

    // Update all sliders with new sort orders
    await Promise.all(
      updates.map((update) =>
        prisma.homeSlider.update({
          where: { id: update.id },
          data: { sortOrder: update.sortOrder },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Error reordering sliders:", e);
    return NextResponse.json({ error: "Lỗi sắp xếp", details: e.message }, { status: 500 });
  }
}
