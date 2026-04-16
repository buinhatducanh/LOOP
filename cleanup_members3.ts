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
 "bi-nht-c-anh", // corrupt duplicate CEO
];

async function main() {
 console.log("=== Deleting old/duplicate members ===\n");

 for (const slug of slugsToDelete) {
 const member = await prisma.teamMember.findUnique({ where: { slug } });
 if (!member) { console.log(` - Not found: ${slug}`); continue; }

 console.log(`\n--- Deleting ${member.name} (${slug}) ---`);
 try {
 // Use raw SQL with correct lowercase table names
 // Order matters: delete child records first, then users (cascades to quest_participants), then team_members
 await prisma.$transaction([
 // Delete member_expertises (member_id -> team_members)
 prisma.$executeRaw`DELETE FROM member_expertises WHERE member_id = ${member.id}`,
 // Delete project_members (member_id -> team_members)
 prisma.$executeRaw`DELETE FROM project_members WHERE member_id = ${member.id}`,
 // Delete member_effect_overrides (member_id -> team_members)
 prisma.$executeRaw`DELETE FROM member_effect_overrides WHERE member_id = ${member.id}`,
 // Delete off_system_splits (member_id -> team_members)
 prisma.$executeRaw`DELETE FROM off_system_splits WHERE member_id = ${member.id}`,
  // Delete task_kanban (assignee_id -> team_members)
 prisma.$executeRaw`DELETE FROM task_kanban WHERE assignee_id = ${member.id}`,
 // Delete daily_standups (member_id -> team_members)
 prisma.$executeRaw`DELETE FROM daily_standups WHERE member_id = ${member.id}`,
 // Delete users (team_member_id -> team_members) — cascades to quest_participants
 prisma.$executeRaw`DELETE FROM users WHERE team_member_id = ${member.id}`,
 // Delete TeamMember
 prisma.$executeRaw`DELETE FROM team_members WHERE id = ${member.id}`,
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
