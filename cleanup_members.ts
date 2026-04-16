import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
const prisma = new PrismaClient({ adapter });

const slugsToDelete = [
 "rin-nakamura",
 "haru-tanaka",
 "vu-dinh-trong",
 "kai-tanaka",
 "ryo-hashimoto",
 "yuna-park",
 "akira-sato",
 "tran-huu-phuc",
 "shin-watanabe",
 "mei-lin",
 "quynh-hr",
 "tran-thi-media",
 "nguyen-van-seo",
];

async function main() {
 console.log("=== Deleting old/duplicate members ===\n");

 for (const slug of slugsToDelete) {
 const member = await prisma.teamMember.findUnique({ where: { slug } });
 if (!member) { console.log(` - Not found: ${slug}`); continue; }

 console.log(`\n--- Deleting ${member.name} (${slug}) ---`);
 try {
 // Use raw SQL to handle all FK cascades in one statement
 await prisma.$transaction([
 // Delete User (cascades QuestParticipant, PointTransaction, Attendance)
 prisma.$executeRaw`DELETE FROM "User" WHERE "teamMemberId" = ${member.id}`,
 // Delete MemberExpertise
 prisma.$executeRaw`DELETE FROM "MemberExpertise" WHERE "memberId" = ${member.id}`,
 // Delete ProjectMember
 prisma.$executeRaw`DELETE FROM "ProjectMember" WHERE "memberId" = ${member.id}`,
 // Delete TaskKanban (assignee)
 prisma.$executeRaw`DELETE FROM "TaskKanban" WHERE "assigneeId" = ${member.id}`,
 // Delete Backlog (assignee)
 prisma.$executeRaw`DELETE FROM "Backlog" WHERE "assigneeId" = ${member.id}`,
 // Delete Epic
 prisma.$executeRaw`DELETE FROM "Epic" WHERE "memberId" = ${member.id}`,
 // Delete FigmaDemo
 prisma.$executeRaw`DELETE FROM "FigmaDemo" WHERE "memberId" = ${member.id}`,
 // Delete Notification (recipient)
 prisma.$executeRaw`DELETE FROM "Notification" WHERE "recipientId" = ${member.id}`,
 // Delete AdminNotification
 prisma.$executeRaw`DELETE FROM "AdminNotification" WHERE "recipientId" = ${member.id}`,
 // Delete TeamMember
 prisma.$executeRaw`DELETE FROM "TeamMember" WHERE "id" = ${member.id}`,
 ]);
 console.log(` ✓ All deleted`);
 } catch (e: any) {
 console.error(` ✗ ERROR: ${e.message}`);
 }
 }

 const remaining = await prisma.teamMember.findMany({
 where: { isActive: true },
 select: { id: true, name: true, slug: true, level: true, rank: true, image: true, isFeatured: true }
 });
 console.log("\n=== Remaining active members (" + remaining.length + ") ===");
 remaining.forEach(m => console.log(" " + m.name + " | slug=" + m.slug + " | lv=" + m.level + " | feat=" + m.isFeatured));
}

main().catch(console.error).finally(() => { prisma.$disconnect(); process.exit(0); });
