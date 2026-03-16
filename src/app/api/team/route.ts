import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const members = await prisma.teamMember.findMany({
      where: { isActive: true },
      orderBy: [{ roleLevel: "asc" }, { sortOrder: "asc" }],
    });

    return NextResponse.json({ data: members });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
