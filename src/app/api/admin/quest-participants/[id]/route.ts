import { ok, handleError, notFound, badRequest } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { syncRankFields } from "@/lib/rank/xp";
import type { Prisma } from "@/generated/prisma";

/**
 * PATCH /api/admin/quest-participants/[id]
 * Complete a quest participant and award LP + XP.
 *
 * Body: { action: "complete" | "reset_progress" }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission("quests", "update");
    const { id } = await params;
    const body = await req.json();
    const { action } = body as { action?: string };

    const participant = await prisma.questParticipant.findUnique({
      where: { id },
      include: { quest: true, event: true },
    });
    if (!participant) return notFound("Quest participant not found");

    if (action === "complete") {
      if (participant.completed) {
        return badRequest("Quest already completed");
      }

      const lpReward = participant.quest?.lpReward ?? participant.event?.lpBonus ?? 0;
      const xpReward = participant.quest?.xpReward ?? 0;

      // P0-4 FIX: wrap participant update + LP transaction in a transaction.
      // Previously used Promise.all — if lpTransaction.create failed, participant
      // was marked complete but LP was never credited (phantom completion).
      const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const up = await tx.questParticipant.update({
          where: { id },
          data: {
            completed: true,
            claimedAt: new Date(),
            lpEarned: lpReward,
            xpEarned: xpReward,
            progress: participant.quest?.target ?? participant.progress,
          },
        });

        if (lpReward > 0) {
          await tx.lpTransaction.create({
            data: {
              memberId: participant.userId,
              type: "award",
              amount: lpReward,
              source: "quest",
              description: participant.quest
                ? `Quest: ${participant.quest.title}`
                : `Event: ${participant.event?.title ?? "Unknown"}`,
            },
          });
        }

        return up;
      });

      // Sync rank fields after LP award
      await syncRankFields(participant.userId);

      return ok({ data: updated, lpAwarded: lpReward });
    }

    if (action === "reset_progress") {
      const reset = await prisma.questParticipant.update({
        where: { id },
        data: { progress: 0, completed: false, claimedAt: null, lpEarned: 0, xpEarned: 0 },
      });
      return ok(reset);
    }

    return badRequest("Unknown action. Use 'complete' or 'reset_progress'.");
  } catch (error) {
    return handleError(error);
  }
}
