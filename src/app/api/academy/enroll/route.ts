/**
 * POST /api/academy/enroll
 *
 * Enrolls a student in a course.
 * Supports 3 payment modes:
 *   - "vnd": Full VNĐ payment
 *   - "mixed": Partial VNĐ + partial LP (max 50% LP)
 *   - "lp": Full LP payment
 *
 * Auth: requires session (userId or memberId)
 *
 * Request body:
 * {
 *   courseId: string
 *   userId?: string        // for client users
 *   memberId?: string        // for staff members
 *   paymentMethod: "vnd" | "mixed" | "lp"
 *   lpAmount?: number       // LP deducted when paymentMethod = mixed or lp
 * }
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError, badRequest, notFound, conflict } from "@/lib/api/response";

const LP_VND_RATE = 20_000; // 1 LP = 20,000 VND
const MAX_LP_PAYMENT_RATIO = 0.5; // max 50% of course price can be paid with LP

// GET /api/academy/enroll — get user's enrollments
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const memberId = searchParams.get("memberId");

    if (!userId && !memberId) {
      return badRequest("userId or memberId is required");
    }

    const enrollments = await prisma.enrollment.findMany({
      where: {
        ...(userId ? { userId } : {}),
        ...(memberId ? { memberId } : {}),
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            titleVi: true,
            price: true,
            lpReward: true,
            durationWeeks: true,
            instructor: { select: { name: true } },
          },
        },
        _count: {
          select: { progresses: true },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });

    return NextResponse.json({ data: enrollments });
  } catch (error) {
    return handleError(error);
  }
}

// POST /api/academy/enroll — create enrollment
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      courseId,
      userId,
      memberId,
      paymentMethod = "vnd",
      lpAmount = 0,
    } = body;

    if (!courseId || (!userId && !memberId)) {
      return badRequest("courseId and userId or memberId are required");
    }

    if (!["vnd", "mixed", "lp"].includes(paymentMethod)) {
      return badRequest("paymentMethod must be vnd | mixed | lp");
    }

    // Validate course exists and is published
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) return notFound("Course not found");
    if (course.status !== "published") {
      return conflict("Course is not available for enrollment");
    }

    // Check existing enrollment
    const existing = await prisma.enrollment.findFirst({
      where: {
        courseId,
        ...(userId ? { userId } : {}),
        ...(memberId ? { memberId } : {}),
        status: { in: ["active", "completed"] },
      },
    });
    if (existing) {
      return conflict("Already enrolled in this course");
    }

    // Validate LP amount
    const maxLpAllowed = Math.floor((course.price / LP_VND_RATE) * MAX_LP_PAYMENT_RATIO);
    if (paymentMethod === "lp" && lpAmount < maxLpAllowed) {
      return badRequest(
        `Full LP payment requires at least ${maxLpAllowed} LP (${Math.ceil(maxLpAllowed * LP_VND_RATE / 1000)}K VND equivalent)`
      );
    }
    if (paymentMethod === "mixed" && (lpAmount <= 0 || lpAmount > maxLpAllowed)) {
      return badRequest(
        `Mixed payment LP amount must be between 1 and ${maxLpAllowed} LP`
      );
    }

    // Calculate amounts
    let paidAmount = 0;
    let lpCost = 0;
    if (paymentMethod === "vnd") {
      paidAmount = course.price;
    } else if (paymentMethod === "mixed") {
      lpCost = lpAmount;
      paidAmount = Math.max(0, course.price - lpAmount * LP_VND_RATE);
    } else {
      // full lp
      lpCost = Math.ceil(course.price / LP_VND_RATE);
      paidAmount = course.price - lpCost * LP_VND_RATE;
    }

    // Use transaction to ensure atomicity
    const enrollment = await prisma.$transaction(async (tx) => {
      // Deduct LP if paying with LP
      if (lpCost > 0) {
        if (memberId) {
          // Staff member — deduct from TeamMember lpBalance
          const member = await tx.teamMember.update({
            where: { id: memberId },
            data: { availableLp: { decrement: lpCost } },
          });
          if (member.availableLp < 0) {
            throw new Error("Insufficient LP balance");
          }
        } else if (userId) {
          // Client user — deduct from CustomerPoint.balance (LP ledger)
          const point = await tx.customerPoint.findFirst({
            where: { userId },
            select: { id: true, balance: true },
          });
          if (!point) {
            throw new Error("Insufficient LP balance");
          }
          if (point.balance < lpCost) {
            throw new Error("Insufficient LP balance");
          }
          await tx.customerPoint.update({
            where: { id: point.id },
            data: {
              balance: { decrement: lpCost },
              totalSpent: { increment: lpCost },
            },
          });
        }
      }

      // Create enrollment
      return tx.enrollment.create({
        data: {
          courseId,
          userId: userId ?? null,
          memberId: memberId ?? null,
          paidAmount,
          status: "active",
        },
        include: {
          course: { select: { id: true, title: true, titleVi: true, lpReward: true } },
          user: { select: { id: true, name: true, email: true } },
          member: { select: { id: true, name: true } },
        },
      });
    });

    return NextResponse.json({ data: enrollment }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Insufficient LP balance") {
        return badRequest("Insufficient LP balance");
      }
    }
    return handleError(error);
  }
}
