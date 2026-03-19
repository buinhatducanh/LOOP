import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { hashPassword } from "@/lib/auth/password";
import { createAuditLog } from "@/lib/auth/audit";
import {
  buildQueryFromParams,
  parsePagination,
  buildPaginationResponse,
  USER_FILTER_CONFIG,
} from "@/lib/api/search-utils";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("users", "read");
    const { searchParams } = new URL(req.url);
    const { where, orderBy } = buildQueryFromParams(searchParams, USER_FILTER_CONFIG);
    const { page, limit } = parsePagination(searchParams);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          userRoles: { include: { role: { select: { name: true, displayName: true } } } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      data: users,
      ...buildPaginationResponse(total, page, limit),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("users", "create");
    const { name, email, password, role, roleIds } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Tên, email, và mật khẩu là bắt buộc" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email đã tồn tại" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role || "user",
        userRoles: roleIds?.length
          ? { create: roleIds.map((roleId: string) => ({ roleId })) }
          : undefined,
      },
      include: {
        userRoles: { include: { role: { select: { name: true, displayName: true } } } },
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "users",
      resourceId: user.id,
      newValues: { name, email, role },
    });

    return NextResponse.json({
      data: { ...user, passwordHash: undefined },
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
