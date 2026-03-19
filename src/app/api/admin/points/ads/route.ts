import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/permissions";

// GET - Lấy danh sách ads
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ads = await prisma.advertisement.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ data: ads });
  } catch (error) {
    console.error("Error fetching ads:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// POST - Tạo ad mới
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const ad = await prisma.advertisement.create({
      data: body,
    });

    return NextResponse.json({ data: ad });
  } catch (error) {
    console.error("Error creating ad:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
