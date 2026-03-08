import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

export async function GET() {
  try {
    await requirePermission("team", "read");

    const members = await prisma.teamMember.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ data: members });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
