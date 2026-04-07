import { handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

// GET /api/admin/customer-points/[pointId]
// Returns full point balance + transaction history for one customer.

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ pointId: string }> }
) {
  try {
    await requirePermission("orders", "read");
    const { pointId } = await params;
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));

    const point = await prisma.customerPoint.findUnique({
      where: { id: pointId },
      include: {
        _count: { select: { transactions: true } },
      },
    });

    if (!point) {
      return NextResponse.json({ error: "Customer point not found" }, { status: 404 });
    }

    const [transactions, total] = await Promise.all([
      prisma.pointTransaction.findMany({
        where: { customerPointId: pointId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.pointTransaction.count({ where: { customerPointId: pointId } }),
    ]);

    return NextResponse.json({
      data: { ...point, transactions },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleError(error);
  }
}
