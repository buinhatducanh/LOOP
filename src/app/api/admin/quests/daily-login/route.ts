/**
 * POST /api/admin/quests/daily-login
 *
 * Staff daily login quest — awards LP + XP based on login streak.
 * Idempotent: one claim per calendar day per user.
 *
 * Flow:
 *   1. Re-read User.lastLogin inside tx (TOCTOU protection)
 *   2. Guard: ALREADY_CLAIMED if lastLogin was today
 *   3. Streak: +1 if last login was yesterday, else reset to 1
 *   4. Look up DailyReward (day 1–7) → lpEarned + xpEarned
 *   5. Create LpAward (status=approved) so syncRankFields() picks it up
 *   6. Update TeamMember: currentXp↑, level↑, maxXp↑
 *   7. Ledger: LpTransaction(type="award", source="daily_login")
 *   8. QuestParticipant: upsert q-daily-1 record
 *
 * Body: { questId?: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";
import { requireAuth } from "@/lib/auth/permissions";
import { handleError, ok } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();

    // Staff only — customers use /api/points with action: "daily_login"
    if (session.accountType !== "staff") {
      return NextResponse.json(
        { error: "Chỉ dành cho nhân viên" },
        { status: 403 }
      );
    }

    if (!session.teamMemberId) {
      return NextResponse.json(
        { error: "Tài khoản chưa liên kết hồ sơ nhân viên" },
        { status: 403 }
      );
    }

    const { questId } = (await req.json().catch(() => ({}))) as { questId?: string };

    // ── Date helpers ───────────────────────────────────────────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // ── Atomic transaction ─────────────────────────────────────────────────────
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Re-read inside tx — prevents TOCTOU race on duplicate claim
      const user = await tx.user.findUnique({
        where: { id: session.userId },
        select: { lastLogin: true, loginStreak: true },
      });

      if (!user) throw new Error("user_not_found");

      // Normalise lastLogin to start-of-day for streak comparison
      const lastLogin = user.lastLogin ? new Date(user.lastLogin) : null;
      const lastLoginDay = lastLogin
        ? (() => {
            const d = new Date(lastLogin);
            d.setHours(0, 0, 0, 0);
            return d;
          })()
        : null;

      // Duplicate claim guard: already claimed today
      if (lastLoginDay && lastLoginDay.getTime() === today.getTime()) {
        throw new Error("ALREADY_CLAIMED");
      }

      // Streak: +1 if last login was yesterday, else reset to 1
      let newStreak = 1;
      if (lastLoginDay && lastLoginDay.getTime() === yesterday.getTime()) {
        newStreak = user.loginStreak + 1;
      }

      // Look up reward tier (capped at day 7)
      const day = Math.min(newStreak, 7);
      const reward = await tx.dailyReward.findUnique({ where: { day } });
      const lpEarned = reward?.points ?? 10;
      const xpEarned = reward?.xpBonus ?? 10;

      // ── Update User: lastLogin + streak ──────────────────────────────────────
      await tx.user.update({
        where: { id: session.userId },
        data: {
          lastLogin: new Date(),
          loginStreak: newStreak,
        },
      });

      // ── Create LpAward (status=approved) ────────────────────────────────────
      // FIX C1: Use LpAward so syncRankFields() aggregates it correctly.
      // Daily login is auto-approved since we're inside a verified transaction.
      await tx.lpAward.create({
        data: {
          memberId: session.teamMemberId!,
          lpAmount: lpEarned,
          expAmount: xpEarned,
          source: "daily_login",
          status: "approved",
          approvedBy: session.userId,
          approvedAt: new Date(),
          projectId: null,
        },
      });

      // ── Credit XP to TeamMember (LP comes from syncRankFields via LpAward) ─
      const member = await tx.teamMember.findUnique({
        where: { id: session.teamMemberId! },
        select: {
          currentXp: true,
          level: true,
          maxXp: true,
        },
      });

      if (member) {
        const newXp = member.currentXp + xpEarned;
        const xpNeeded = member.maxXp; // level × 100

        if (newXp >= xpNeeded) {
          // Level up — XP overflows to next level
          const newLevel = member.level + 1;
          const newCurrentXp = newXp - xpNeeded;
          const newMaxXp = newLevel * 100;

          await tx.teamMember.update({
            where: { id: session.teamMemberId! },
            data: {
              currentXp: newCurrentXp,
              level: newLevel,
              maxXp: newMaxXp,
            },
          });
        } else {
          // No level up — just credit XP
          await tx.teamMember.update({
            where: { id: session.teamMemberId! },
            data: {
              currentXp: newXp,
            },
          });
        }

        // ── Ledger entry ────────────────────────────────────────────────────
        // balanceAfter uses lpEarned — syncRankFields will compute total from LpAward
        await tx.lpTransaction.create({
          data: {
            memberId: session.teamMemberId!,
            amount: lpEarned,
            balanceAfter: lpEarned, // provisional; recomputed by syncRankFields on read
            type: "award",
            status: "completed",
            description: `Điểm danh ngày ${newStreak}: +${lpEarned} LP + ${xpEarned} XP`,
            source: "daily_login",
          },
        });
      }

      // ── QuestParticipant record ─────────────────────────────────────────────
      if (questId) {
        await tx.questParticipant.upsert({
          where: {
            userId_questId: { userId: session.userId, questId },
          },
          create: {
            userId: session.userId,
            questId,
            progress: 1,
            completed: true,
            lpEarned,
            xpEarned,
            claimedAt: new Date(),
          },
          update: {
            progress: 1,
            completed: true,
            lpEarned,
            xpEarned,
            claimedAt: new Date(),
          },
        });
      }

      return {
        lpEarned,
        xpEarned,
        loginStreak: newStreak,
        level: member?.level ?? 1,
        currentXp: member?.currentXp ?? 0,
      };
    });

    return ok({
      success: true,
      action: "daily_login",
      ...result,
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "ALREADY_CLAIMED") {
        return NextResponse.json(
          { error: "Bạn đã nhận thưởng điểm danh hôm nay rồi" },
          { status: 400 }
        );
      }
      if (err.message === "user_not_found") {
        return NextResponse.json(
          { error: "Không tìm thấy tài khoản" },
          { status: 404 }
        );
      }
    }
    return handleError(err);
  }
}