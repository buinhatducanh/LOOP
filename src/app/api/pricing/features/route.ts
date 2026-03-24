import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public API for pricing calculator feature catalog
// Returns active service attributes grouped by category, with parent-child structure.
export async function GET() {
  try {
    const features = await prisma.serviceAttribute.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        nameVi: true,
        category: true,
        tier: true,
        price: true,
        xpPoints: true,
        parentId: true,
      },
      orderBy: [
        { category: "asc" },
        { tier: "asc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json({ data: features });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
