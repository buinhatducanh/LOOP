import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import {
  executeTransfer,
  getTransferLimitStatus,
  LP_TRANSFER_FEE,
  LP_TRANSFER_DAILY_LIMIT,
} from "@/lib/services/gamification/transfer.service";

// GET /api/admin/lp-transfers
// Get transfer history and transfer limit status for the authenticated member.

export async function GET(req: NextRequest) {
  try {
    const session = await requirePermission("team", "read");
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId") ?? session.teamMemberId;

    if (!memberId) {
      return NextResponse.json({ error: "memberId required" }, { status: 400 });
    }

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));

    // Transfer history: both sent and received
    const where = {
      OR: [
        { memberId, type: { in: ["transfer_sent", "transfer_received"] } },
        { counterpartyId: memberId, type: { in: ["transfer_sent", "transfer_received"] } },
      ],
    };

    const [transactions, total] = await Promise.all([
      prisma.lpTransaction.findMany({
        where,
        include: {
          member: { select: { id: true, name: true, role: true } },
          counterparty: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.lpTransaction.count({ where }),
    ]);

    // Today's transfer count for this member
    const limitStatus = memberId
      ? await getTransferLimitStatus(memberId)
      : null;

    return NextResponse.json({
      data: {
        transactions,
        limitStatus: limitStatus ?? {
          usedToday: 0, limit: LP_TRANSFER_DAILY_LIMIT,
          remaining: LP_TRANSFER_DAILY_LIMIT, canTransfer: true,
        },
        fee: LP_TRANSFER_FEE,
      },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/admin/lp-transfers
// Execute a peer-to-peer LP transfer.
// Body: { fromMemberId, toMemberId, amount, description? }

export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("team", "update");

    const { fromMemberId, toMemberId, amount, description } = await req.json();

    // Validate sender is either the session user or an admin
    const isAdmin = session.roles.includes("super_admin") || session.roles.includes("admin");
    const senderMatches = fromMemberId === session.teamMemberId || isAdmin;
    if (!senderMatches) {
      return NextResponse.json(
        { error: "You can only transfer LP from your own account" },
        { status: 403 }
      );
    }

    if (!fromMemberId || !toMemberId || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "fromMemberId, toMemberId, and positive amount are required" },
        { status: 400 }
      );
    }

    // Verify both members exist
    const [fromMember, toMember] = await Promise.all([
      prisma.teamMember.findUnique({ where: { id: fromMemberId }, select: { id: true, name: true } }),
      prisma.teamMember.findUnique({ where: { id: toMemberId },   select: { id: true, name: true } }),
    ]);

    if (!fromMember) return NextResponse.json({ error: "Sender not found" }, { status: 404 });
    if (!toMember)   return NextResponse.json({ error: "Receiver not found" }, { status: 404 });

    const result = await executeTransfer({
      fromMemberId,
      toMemberId,
      amount,
      description,
      createdBy: session.teamMemberId ?? session.userId,
    });

    if (!result.ok) {
      const status = result.error?.includes("limit") ? 429
        : result.error?.includes("Insufficient") ? 400
        : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    await createAuditLog({
      userId: session.userId,
      action: "transfer",
      resource: "lp-transfers",
      resourceId: result.transferId ?? "unknown",
      newValues: { fromMemberId, toMemberId, amount, fee: result.fee },
    });

    return NextResponse.json({
      data: {
        transferId: result.transferId,
        fromMember: { id: fromMember.id, name: fromMember.name },
        toMember:   { id: toMember.id,   name: toMember.name },
        grossAmount: amount,
        fee: result.fee,
        sentAmount: result.sentAmount,
        senderNewBalance: result.senderNewBalance,
        receiverNewBalance: result.receiverNewBalance,
      },
    }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
