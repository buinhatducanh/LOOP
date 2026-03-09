import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

export async function GET() {
  try {
    await requirePermission("users", "read");

    const roles = await prisma.role.findMany({
      orderBy: { level: "asc" },
      include: {
        _count: { select: { users: true, permissions: true } },
        permissions: true,
      },
    });

    return NextResponse.json({ data: roles });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
