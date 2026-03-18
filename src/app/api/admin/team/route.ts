import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("team", "read");
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { slug: { contains: search, mode: "insensitive" as const } },
            { role: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [members, total] = await Promise.all([
      prisma.teamMember.findMany({
        where,
        orderBy: { sortOrder: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          memberExpertise: {
            include: {
              expertise: true,
            },
          },
        },
      }),
      prisma.teamMember.count({ where }),
    ]);

    return NextResponse.json({
      data: members,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("team", "create");
    const data = await req.json();

    if (!data.name || !data.role || !data.slug) {
      return NextResponse.json(
        { error: "Tên, vai trò và slug là bắt buộc" },
        { status: 400 }
      );
    }

    // Extract expertise array if present (it's a relation, not a direct field)
    const { expertise, ...memberData } = data;

    const member = await prisma.teamMember.create({
      data: memberData,
    });

    // Create member expertise relations if provided
    if (expertise && Array.isArray(expertise) && expertise.length > 0) {
      await prisma.memberExpertise.createMany({
        data: expertise.map((expId: string) => ({
          memberId: member.id,
          expertiseId: expId,
          level: 3, // Default level
        })),
      });
    }

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "team",
      resourceId: member.id,
      newValues: memberData,
    });

    return NextResponse.json({ data: member }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
