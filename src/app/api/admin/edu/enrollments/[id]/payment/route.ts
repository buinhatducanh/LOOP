/**
 * EDU Enrollment Payment + LP Distribution (M17)
 *
 * Flow:
 *  1. Admin records payment for a course enrollment
 * 2. Student receives 10% LP (CustomerPoint / PointTransaction)
 * 3. Instructor receives LP via TeamMember.availableLp + LpTransaction (teaching source)
 */

import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";
import type { InputJsonValue } from "@/generated/prisma/internal/prismaNamespace";
import { computeRankFieldsFromLp } from "@/lib/rank/xp";

const LP_VND_RATE = 20_000;

function vndToLp(vndAmount: number): number {
  if (vndAmount <= 0) return 0;
  return Math.floor((vndAmount / LP_VND_RATE) * 0.10);
}

// POST /api/admin/edu/enrollments/[id]/payment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("edu", "update");
    const { id } = await params;
    const body = await req.json();
    const { amount, method, note } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "amount must be a positive integer (VND)" },
        { status: 400 }
      );
    }

    // ── Load full enrollment context ─────────────────────────────────────
    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            instructor: {
              include: {
                member: { select: { id: true, name: true, availableLp: true } },
              },
            },
          },
        },
        user: { select: { id: true, email: true, name: true } },
      },
    });

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    const { course, user: studentUser } = enrollment;
    const instructorMember = course.instructor?.member;

    // ── Compute LP ─────────────────────────────────────────────────
    const studentLpEarned = vndToLp(amount);
    const instructorLp = Math.floor(studentLpEarned * (enrollment.assigneeLpPercent / 100));

    // Capture instructor ID before tx for rank sync after commit
    let _instructorIdForRankSync: string | null =
      instructorMember && instructorLp > 0 ? instructorMember.id : null;

    // ── Atomic transaction ─────────────────────────────────────────
    // P1-2 FIX: moved syncRankFields and createAuditLog inside this tx.
    const payment = await prisma.$transaction(async (tx) => {
      // 1. EduPayment record
      const eduPayment = await tx.eduPayment.create({
        data: {
          enrollmentId: id,
          amount,
          method: method ?? "cash",
          note: note ?? null,
          status: "completed",
          confirmedBy: session.userId,
          confirmedAt: new Date(),
          lpAwarded: studentLpEarned,
          instructorLp,
        },
      });

      // 2. Update enrollment paidAmount
      await tx.enrollment.update({
        where: { id },
        data: { paidAmount: { increment: amount } },
      });

      // 3. Student LP (CustomerPoint — external/customer students)
      if (studentUser && studentLpEarned > 0) {
        const existingPt = await tx.customerPoint.findUnique({
          where: { userEmail: studentUser.email },
          select: { id: true, balance: true, totalEarned: true },
        });

        if (existingPt) {
          await tx.customerPoint.update({
            where: { id: existingPt.id },
            data: {
              balance: existingPt.balance + studentLpEarned,
              totalEarned: existingPt.totalEarned + studentLpEarned,
            },
          });
        } else {
          await tx.customerPoint.create({
            data: {
              userEmail: studentUser.email,
              userName: studentUser.name ?? null,
              balance: studentLpEarned,
              totalEarned: studentLpEarned,
            },
          });
        }

        const ptId = existingPt?.id ?? (
          await tx.customerPoint.findUnique({
            where: { userEmail: studentUser.email },
            select: { id: true },
          })
        )!.id;

        await tx.pointTransaction.create({
          data: {
            customerPointId: ptId,
            type: "earn",
            amount: studentLpEarned,
            source: "edu_enrollment",
            description: `Khóa học "${course.title}" — +${studentLpEarned} LP`,
            referenceId: eduPayment.id,
            referenceType: "EduPayment",
            status: "completed",
          },
        });
      }

      // 4. Instructor LP (TeamMember.availableLp + LpTransaction)
      if (instructorMember && instructorLp > 0) {
        const newAvailable = instructorMember.availableLp + instructorLp;
        await tx.teamMember.update({
          where: { id: instructorMember.id },
          data: { availableLp: newAvailable },
        });

        await tx.lpTransaction.create({
          data: {
            memberId: instructorMember.id,
            amount: instructorLp,
            balanceAfter: newAvailable,
            type: "award",
            status: "completed",
            description: `Teaching LP — "${course.title}" +${instructorLp} LP`,
            source: "teaching",
            referenceId: eduPayment.id,
            referenceType: "EduPayment",
          },
        });

        // P1-1 FIX: sync rank fields INSIDE this tx — inline to avoid nested $transaction.
        if (_instructorIdForRankSync) {
          const [awardAgg, txAgg] = await Promise.all([
            tx.lpAward.aggregate({ where: { memberId: instructorMember.id, status: "approved" }, _sum: { lpAmount: true } }),
            tx.lpTransaction.aggregate({ where: { memberId: instructorMember.id, type: "award", status: "completed" }, _sum: { amount: true } }),
          ]);
          const totalLp = (awardAgg._sum.lpAmount ?? 0) + (txAgg._sum.amount ?? 0);
          const fields = computeRankFieldsFromLp(totalLp);
          await tx.teamMember.update({ where: { id: instructorMember.id }, data: fields });
        }
      }

      // P1-2 FIX: audit log inside tx — no gap between write and audit record
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          action: "record_payment",
          resource: "edu-enrollments",
          resourceId: id,
          newValues: {
            amount,
            method,
            studentLpEarned,
            instructorLp,
          } as unknown as InputJsonValue,
        },
      });

      return eduPayment;
    });

    return NextResponse.json(
      {
        data: payment,
        lp: {
          studentLpEarned,
          instructorLpAwarded: instructorLp,
          lpRate: "10%",
          vndRate: LP_VND_RATE,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
