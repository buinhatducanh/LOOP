import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "true";
    const where = activeOnly ? { isActive: true } : {};

    const expertises = await prisma.expertise.findMany({
      where,
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    });

    return NextResponse.json({ data: expertises });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const categories: Record<string, string> = {
      frontend: "Frontend",
      backend: "Backend",
      design: "Thiết kế",
      management: "Quản lý",
      marketing: "Marketing",
      data: "Data/AI",
      devops: "DevOps",
      mobile: "Di động",
      other: "Khác",
    };

    const expertise = await prisma.expertise.create({
      data: {
        name: data.name,
        nameVi: data.nameVi || data.name,
        category: data.category,
        categoryVi: data.categoryVi || categories[data.category] || data.category,
        icon: data.icon || null,
        logo: data.logo || null,
        sortOrder: data.sortOrder || 0,
        isActive: data.isActive ?? true,
      },
    });

    return NextResponse.json({ data: expertise }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
