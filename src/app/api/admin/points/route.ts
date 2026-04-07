import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/permissions";
import { handleError, list, buildPagination } from "@/lib/api";

// GET — List customer points
export async function GET(_req: NextRequest) {
  try {
    await getSession(); // auth check only — uses getSession for broad access

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { userEmail: { contains: search, mode: "insensitive" } },
        { userName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customerPoint.findMany({
        where,
        orderBy: { balance: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.customerPoint.count({ where }),
    ]);

    return list(customers, buildPagination(page, limit, total));
  } catch (error) {
    console.error("Error fetching points:", error);
    return handleError(error);
  }
}
