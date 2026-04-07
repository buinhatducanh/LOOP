/**
 * GET  /api/admin/team/members/pending   — List pending member requests (CEO/Admin)
 * POST /api/admin/team/members/pending   — HR creates a new member request
 */
import { NextRequest } from "next/server";
import { requirePermissionFast } from "@/lib/auth/permissions";
import { ok, list, handleError, badRequest, buildPagination } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  try {
    const _session = await requireAuth();
    requirePermissionFast(session, "users", "read");

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const skip = (page - 1) * limit;
    const status = searchParams.get("status") ?? "pending";
    const department = searchParams.get("department");

    const where: Record<string, unknown> = {};
    if (status && status !== "all") where.status = status;
    if (department && department !== "all") where.department = department;

    const [requests, total] = await Promise.all([
      prisma.memberRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.memberRequest.count({ where }),
    ]);

    const pagination = buildPagination(page, limit, total);

    return list(requests, pagination);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(_req: NextRequest) {
  try {
    const _session = await requireAuth();
    requirePermissionFast(session, "users", "create");

    const body = await req.json();
    const { email, name, department, proposedRole, proposedTags } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return badRequest("email không hợp lệ");
    }
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return badRequest("name là bắt buộc");
    }
    if (!department || typeof department !== "string") {
      return badRequest("department là bắt buộc");
    }

    const validDepts = [
      "engineering", "design", "media", "marketing",
      "sales", "finance", "hr", "management",
    ];
    if (!validDepts.includes(department)) {
      return badRequest("department không hợp lệ");
    }

    // Check for duplicate email
    const existing = await prisma.memberRequest.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email đã có request đang chờ hoặc đã tồn tại" },
        { status: 409 }
      );
    }

    // Generate short-lived invite token (48h)
    const inviteToken = crypto.randomUUID();
    const inviteExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const request = await prisma.memberRequest.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        department,
        proposedRole: proposedRole ?? "member",
        proposedTags: Array.isArray(proposedTags) ? proposedTags : [],
        status: "pending",
        inviteToken,
        inviteExpiresAt,
      },
    });

    return ok(request, 201);
  } catch (err) {
    return handleError(err);
  }
}
