import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public API — no auth required
export async function GET() {
  try {
    const groups = await prisma.featureGroup.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        groupName: true,
        slug: true,
        sortOrder: true,
        features: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            featureName: true,
            description: true,
            logicLevel: true,
            isRequired: true,
            variants: {
              where: { isActive: true },
              orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
              select: {
                id: true,
                variantName: true,
                description: true,
                price: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(groups);
  } catch (error: any) {
    console.error("Failed to fetch pricing calculator data:", error);
    return NextResponse.json(
      { error: "Failed to fetch pricing data", details: String(error), stack: error.stack },
      { status: 500 }
    );
  }
}
