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
import { academyLogger } from "@/lib/logger";
import { withIdempotency } from "@/lib/idempotency";
import { applyRateLimit } from "@/lib/rate-limit";
import { syncRankFields } from "@/lib/rank/xp";
import { requireAuth } from "@/lib/auth/permissions";
import { LP_VND_RATE } from "@/lib/constants";

const MAX_LP_PAYMENT_RATIO = 0.5; // max 50% of course price can be paid with LP

// GET /api/academy/enroll — get user's enrollments
export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const memberId = searchParams.get("memberId");

    // Auth: session user can only read their own enrollments unless admin
    const isAdmin = session.roleLevel <= 1;
    const targetUserId = isAdmin ? (userId ?? session.userId) : session.userId;
    const targetMemberId = isAdmin ? memberId : session.teamMemberId;

    if (!targetUserId && !targetMemberId) {
      return badRequest("userId or memberId is required");
    }

    const enrollments = await prisma.enrollment.findMany({
      where: {
        ...(targetUserId ? { userId: targetUserId } : {}),
        ...(targetMemberId ? { memberId: targetMemberId } : {}),
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
export const POST = withIdempotency(
  "create_enrollment",
  async (req: NextRequest) => {
    // ── Auth + Rate limit: 20/min per IP ──────────────────────────────────────
    const session = await requireAuth(req);
    const rateLimitResult = await applyRateLimit(req, "public");
    if (!rateLimitResult.allowed) return rateLimitResult.response!;

    try {
      const body = await req.json();
      const {
        courseId,
        userId,
        memberId,
        paymentMethod = "vnd",
        lpAmount = 0,
      } = body;

      // Determine actor: staff uses session.teamMemberId, customer uses session.userId
      const actorMemberId = memberId ?? session.teamMemberId;
      const actorUserId = userId ?? session.userId;

      if (!courseId || (!actorUserId && !actorMemberId)) {
        return badRequest("courseId and userId or memberId are required");
      }

      if (!["vnd", "mixed", "lp"].includes(paymentMethod)) {
        return badRequest("paymentMethod must be vnd | mixed | lp");
      }

      // Validate course exists and is published
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) return notFound("Course not found");
      if (course.status !== "published") {
        return conflict("Course is not available for enrollment");
      }

      // Check existing enrollment
      const existing = await prisma.enrollment.findFirst({
        where: {
          courseId,
          ...(actorUserId ? { userId: actorUserId } : {}),
          ...(actorMemberId ? { memberId: actorMemberId } : {}),
          status: { in: ["active", "completed"] },
        },
      });
      if (existing) return conflict("Already enrolled in this course");

      // LP payment limits
      const maxLpAllowed = Math.floor((course.price / LP_VND_RATE) * MAX_LP_PAYMENT_RATIO);
      if (paymentMethod === "lp" && lpAmount < maxLpAllowed) {
        return badRequest(
          `Full LP payment requires at least ${maxLpAllowed} LP (${Math.ceil(maxLpAllowed * LP_VND_RATE / 1000)}K VND equivalent)`
        );
      }
      if (paymentMethod === "mixed" && (lpAmount <= 0 || lpAmount > maxLpAllowed)) {
        return badRequest(`Mixed payment LP amount must be between 1 and ${maxLpAllowed} LP`);
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
        lpCost = Math.ceil(course.price / LP_VND_RATE);
        paidAmount = course.price - lpCost * LP_VND_RATE;
      }

      // ── Transaction: enrollment + LP deduction + ledger entry ──────────────
      const enrollment = await prisma.$transaction(async (tx) => {
        if (lpCost > 0) {
          if (actorMemberId) {
            // Staff: atomic LP deduction with TOCTOU guard
            const result = await tx.teamMember.updateMany({
              where: {
                id: actorMemberId,
                availableLp: { gte: lpCost },
              },
              data: { availableLp: { decrement: lpCost } },
            });
            if (result.count === 0) {
              throw new Error("Insufficient LP balance");
            }

            // Get updated balance for ledger
            const member = await tx.teamMember.findUnique({
              where: { id: actorMemberId },
              select: { availableLp: true, name: true },
            });

            // LP ledger entry
            await tx.lpTransaction.create({
              data: {
                memberId: actorMemberId,
                amount: -lpCost,
                balanceAfter: member!.availableLp,
                type: "spent",
                status: "completed",
                description: `Học phí khóa học: ${course.titleVi || course.title}`,
                source: "academy_enrollment",
                referenceId: courseId,
                referenceType: "Course",
                createdBy: session.userId,
              },
            });
          } else if (actorUserId) {
            // Customer: atomic LP deduction on CustomerPoint
            const result = await tx.customerPoint.updateMany({
              where: {
                userId: actorUserId,
                balance: { gte: lpCost },
              },
              data: {
                balance: { decrement: lpCost },
                totalSpent: { increment: lpCost },
              },
            });
            if (result.count === 0) {
              throw new Error("Insufficient LP balance");
            }
          }
        }

        return tx.enrollment.create({
          data: {
            courseId,
            userId: actorUserId ?? null,
            memberId: actorMemberId ?? null,
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

      // After LP deduction (member spending LP on education), sync rank fields
      if (lpCost > 0 && actorMemberId) {
        await syncRankFields(actorMemberId);
      }

      academyLogger.info("Academy enrollment successful", {
        enrollmentId: enrollment.id,
        courseId: enrollment.courseId,
        userId: enrollment.userId ?? undefined,
        memberId: enrollment.memberId ?? undefined,
        paymentMethod,
        paidAmount,
      });
      return NextResponse.json({ data: enrollment }, { status: 201 });
    } catch (error) {
      academyLogger.withSLO("POST /api/academy/enroll failed", {
        endpoint: "/api/academy/enroll",
        statusCode: 500,
        userId: undefined,
      });
      if (error instanceof Error && error.message === "Insufficient LP balance") {
        return badRequest("Insufficient LP balance");
      }
      return handleError(error);
    }
  }
);
