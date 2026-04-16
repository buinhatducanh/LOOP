import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
const prisma = new PrismaClient({ adapter });

// 14 old members (Japanese names + 3 garbage entries)
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
 console.log("=== Deleting 14 old/duplicate members ===\n");

 for (const slug of slugsToDelete) {
 const member = await prisma.teamMember.findUnique({ where: { slug } });
 if (!member) { console.log(` - Not found: ${slug}`); continue; }

 console.log(`--- Deleting ${member.name} (${slug}) ---`);
 try {
 // Order matters — handle RESTRICT tables first, then CASCADE tables
 await prisma.$transaction([
 // 1. lp_transactions (RESTRICT) — must delete before users
 prisma.$executeRaw`DELETE FROM lp_transactions WHERE member_id = ${member.id}`,
 // 2. users (SET NULL → cascades to quest_participants)
 prisma.$executeRaw`DELETE FROM users WHERE team_member_id = ${member.id}`,
 // 3. CASCADE tables auto-delete: member_expertises, project_members, member_effect_overrides
 // 4. Finally delete the TeamMember itself
 prisma.$executeRaw`DELETE FROM team_members WHERE id = ${member.id}`,
 ]);
 console.log(` ✓ Deleted`);
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
