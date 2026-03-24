import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public API for pricing calculator
export async function GET() {
  try {
    const tiers = await prisma.infrastructureTier.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        nameVi: true,
        monthlyCost: true,
        setupCost: true,
        description: true,
        descriptionVi: true,
        icon: true,
        color: true,
      },
    });

    return NextResponse.json({ data: tiers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
