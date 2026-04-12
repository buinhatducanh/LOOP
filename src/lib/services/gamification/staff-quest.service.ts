/**
 * Staff Quest Service — 3-Scope XP Distribution (v8)
 *
 * Three scopes:
 * - company: All staff join automatically. XP split equally among active participants.
 * - department: Only staff in the same department join. XP split within department.
 * - personal: Assigned to individual. XP goes 100% to that person.
 *
 * Scope logic:
 * company → totalXp ÷ activeParticipantCount → each gets equal share
 * department → totalXp ÷ deptParticipantCount → each gets equal share
 * personal → xpReward goes 100% to the assigned member
 *
 * Triggered by:
 * - Manual: member clicks "Hoàn thành" on personal quest
 * - Auto: event webhook POST /api/quests/staff/event
 */

import { prisma } from "@/lib/prisma";

// ── Scope helpers ────────────────────────────────────────────────────────────────

export type QuestScope = "company" | "department" | "personal";

/**
 * Get all active participants for a quest based on its scope.
 */
export async function getQuestParticipants(questId: string): Promise<string[]> {
 const quest = await prisma.quest.findUnique({
 where: { id: questId },
 select: { scope: true, departmentId: true },
 });

 if (!quest) return [];

 if (quest.scope === "company") {
 // All active team members
 const members = await prisma.teamMember.findMany({
 where: { isActive: true, requestStatus: "approved" },
 select: { id: true },
 });
 return members.map(m => m.id);
 }

 if (quest.scope === "department") {
 // Members in the same department
 if (!quest.departmentId) return [];
 const members = await prisma.teamMember.findMany({
 where: {
 isActive: true,
 requestStatus: "approved",
 departmentId: quest.departmentId,
 },
 select: { id: true },
 });
 return members.map(m => m.id);
 }

 // personal: handled separately by assignMemberQuest
 return [];
}

/**
 * Distribute XP rewards to quest participants based on scope.
 *
 * Company/Department: XP split equally.
 * Personal: Full XP to assigned member.
 */
export async function distributeQuestXp(params: {
 questId: string;
 memberId?: string; // required for personal scope
 xpReward: number;
}): Promise<void> {
 const { questId, memberId, xpReward } = params;

 if (xpReward <= 0) return;

 const quest = await prisma.quest.findUnique({
 where: { id: questId },
 select: { scope: true, departmentId: true },
 });

 if (!quest) return;

 let recipients: { memberId: string; xpAmount: number }[] = [];

 if (quest.scope === "personal") {
 // Personal: 100% XP to assigned member
 if (!memberId) return;
 recipients = [{ memberId, xpAmount: xpReward }];
 } else {
 // Company or Department: split equally among active participants
 const participantIds = await getQuestParticipants(questId);
 if (participantIds.length === 0) return;

 const xpPerMember = Math.floor(xpReward / participantIds.length);
 if (xpPerMember === 0) return;

 recipients = participantIds.map(id => ({ memberId: id, xpAmount: xpPerMember }));
 }

 // Credit XP to each recipient
 for (const { memberId: recipientId, xpAmount } of recipients) {
 await creditMemberXp(recipientId, xpAmount, questId);
 }
}

/**
 * Credit XP to a team member and update their level/rank.
 */
async function creditMemberXp(memberId: string, xpAmount: number, _questId: string): Promise<void> {
 if (xpAmount <= 0) return;

 const member = await prisma.teamMember.findUnique({
 where: { id: memberId },
 select: { currentXp: true, level: true, maxXp: true },
 });

 if (!member) return;

 const newXp = member.currentXp + xpAmount;
 let newLevel = member.level;
 let newCurrentXp = newXp;
 const xpNeeded = member.maxXp;

 if (newXp >= xpNeeded) {
 // Level up
 newLevel = member.level + 1;
 newCurrentXp = newXp - xpNeeded;
 const newMaxXp = newLevel * 100;

 await prisma.teamMember.update({
 where: { id: memberId },
 data: {
 currentXp: newCurrentXp,
 level: newLevel,
 maxXp: newMaxXp,
 },
 });
 } else {
 await prisma.teamMember.update({
 where: { id: memberId },
 data: { currentXp: newXp },
 });
 }
}

/**
 * Assign a personal quest to a specific member and credit their XP.
 */
export async function assignPersonalQuest(params: {
 questId: string;
 memberId: string;
}): Promise<void> {
 const { questId, memberId } = params;

 const quest = await prisma.quest.findUnique({
 where: { id: questId },
 select: { xpReward: true, scope: true },
 });

 if (!quest || quest.scope !== "personal") return;

 // Credit full XP
 await distributeQuestXp({
 questId,
 memberId,
 xpReward: quest.xpReward,
 });

 // Mark participant as completed
 await prisma.questParticipant.upsert({
 where: {
 userId_questId: { userId: memberId, questId },
 },
 create: {
 userId: memberId,
 questId,
 progress: 1,
 completed: true,
 xpEarned: quest.xpReward,
 claimedAt: new Date(),
 },
 update: {
 progress: 1,
 completed: true,
 xpEarned: quest.xpReward,
 claimedAt: new Date(),
 },
 });
}
