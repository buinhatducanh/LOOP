import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

// GET /api/admin/edu/instructors
export async function GET(req: NextRequest) {
  try {
    await requirePermission("edu", "read");
    const { searchParams } = new URL(req.url);
    const isActive = searchParams.get("isActive");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));

    const where = isActive !== null ? { isActive: isActive === "true" } : {};
    const [instructors, total] = await Promise.all([
      prisma.instructor.findMany({
        where,
        include: {
          member: { select: { id: true, name: true, role: true, image: true } },
          _count: { select: { courses: true } },
        },
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.instructor.count({ where }),
    ]);

    return NextResponse.json({
      data: instructors,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// POST /api/admin/edu/instructors
export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("edu", "create");
    const body = await req.json();
    const { name, bio, email, phone, specialties, isActive, memberId, userId } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    // Validate memberId and userId are not both set
    if (memberId && userId) {
      return NextResponse.json({ error: "Cannot link to both TeamMember and User. Choose one." }, { status: 400 });
    }

    const instructor = await prisma.instructor.create({
      data: {
        name: name.trim(),
        bio: bio ?? null,
        email: email ?? null,
        phone: phone ?? null,
        specialties: Array.isArray(specialties) ? specialties : [],
        isActive: isActive !== false,
        memberId: memberId ?? null,
        userId: userId ?? null,
      },
      include: {
        member: { select: { id: true, name: true, role: true } },
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "edu-instructors",
      resourceId: instructor.id,
      newValues: { name, memberId, userId },
    });

    return NextResponse.json({ data: instructor }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
