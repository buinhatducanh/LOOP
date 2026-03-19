import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/permissions";

// GET - Lấy danh sách activities
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const activities = await prisma.pointActivity.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ data: activities });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

// POST - Tạo activity mới
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const activity = await prisma.pointActivity.create({
      data: body,
    });

    return NextResponse.json({ data: activity });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
