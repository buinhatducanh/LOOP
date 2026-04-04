import { ok, handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { TeamMemberCreateInput } from "@/generated/prisma/models/TeamMember";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import {
  buildQueryFromParams,
  parsePagination,
  buildPaginationResponse,
  TEAM_MEMBER_FILTER_CONFIG,
} from "@/lib/api/search-utils";
import { computeRankFieldsFromLp } from "@/lib/rank/xp";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("team", "read");
    const { searchParams } = new URL(req.url);
    const { where, orderBy } = buildQueryFromParams(searchParams, TEAM_MEMBER_FILTER_CONFIG);
    const { page, limit } = parsePagination(searchParams);

    const [members, total] = await Promise.all([
      prisma.teamMember.findMany({
        where,
        orderBy,
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

    // ── Aggregate approved LP per member and compute rank fields ───────────
    const memberIds = members.map((m) => m.id);

    const lpAggregates = await prisma.lpAward.groupBy({
      by: ["memberId"],
      where: { memberId: { in: memberIds }, status: "approved" },
      _sum: { lpAmount: true },
    });

    const lpMap = new Map<string, number>(
      lpAggregates.map((a) => [a.memberId, a._sum.lpAmount ?? 0])
    );

    const enriched = members.map((m) => {
      const totalApprovedLp = lpMap.get(m.id) ?? 0;
      const { level, currentXp, maxXp, rank } = computeRankFieldsFromLp(totalApprovedLp);
      return {
        ...m,
        // Override level/XP/rank with computed values (reflect real LP)
        level,
        currentXp,
        maxXp,
        rank,
        totalApprovedLp,
        // LP balances (denormalized on TeamMember)
        lockedLp: m.lockedLp,
        availableLp: m.availableLp,
      };
    });

    return NextResponse.json({
      data: enriched,
      ...buildPaginationResponse(total, page, limit),
    });
  } catch (error) {
    return handleError(error);
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

    // Extract memberExpertise array if present (it's a relation, not a direct field)
    const { memberExpertise, ...memberData } = data;

    // Convert empty strings to null for optional fields (except required fields)
    // Also convert date strings (dd/mm/yyyy) to proper ISO format
    const requiredFields = ['name', 'slug', 'role'];
    const dateFields = ['birthDate', 'contractStart'];
    const cleanedData = Object.fromEntries(
      Object.entries(memberData).map(([key, value]) => {
        if (requiredFields.includes(key)) {
          return [key, value];
        }
        if (value === "") return [key, null];
        // Convert date string to ISO format (supports both dd/mm/yyyy and yyyy-mm-dd)
        if (dateFields.includes(key) && value && typeof value === 'string') {
          // Try to parse dd/mm/yyyy format
          const parts = value.split('/');
          if (parts.length === 3) {
            const [day, month, year] = parts;
            return [key, new Date(`${year}-${month}-${day}T00:00:00.000Z`).toISOString()];
          }
          // Try standard ISO format
          return [key, new Date(value).toISOString()];
        }
        return [key, value];
      })
    );

    const member = await prisma.teamMember.create({
      data: cleanedData as TeamMemberCreateInput,
    });

    // Create member expertise relations with level if provided and not empty
    if (Array.isArray(memberExpertise) && memberExpertise.length > 0) {
      await prisma.memberExpertise.createMany({
        data: memberExpertise.map((exp: { expertiseId: string; level: number }) => ({
          memberId: member.id,
          expertiseId: exp.expertiseId,
          level: exp.level || 5, // Default to 5 if not provided
        })),
      });
    }

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "team",
      resourceId: member.id,
      newValues: cleanedData,
    });

    return NextResponse.json({ data: member }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/team error:", error);
    return handleError(error);
  }
}
