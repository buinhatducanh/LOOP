/**
 * backup-members.ts — Backup team member data to JSON before seed
 * Run: npx tsx prisma/backup-members.ts
 * Output: prisma/backups/members_backup_YYYY-MM-DD_HHMMSS.json
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL not found");
  process.exit(1);
}
const pool = new Pool({ connectionString });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function backup() {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const backupDir = path.join(__dirname, "backups");
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const outPath = path.join(backupDir, `members_backup_${timestamp}.json`);

  console.log("🔄 Fetching all team members...");
  const members = await prisma.teamMember.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  console.log("🔄 Fetching expertise links...");
  const memberExpertise = await prisma.memberExpertise.findMany({
    include: { expertise: { select: { name: true } } },
  });

  console.log("🔄 Fetching user accounts...");
  const users = await prisma.user.findMany({
    where: { teamMemberId: { not: null } },
    select: {
      id: true, email: true, role: true, isActive: true,
      accountType: true, teamMemberId: true,
    },
  });

  console.log("🔄 Fetching departments...");
  const departments = await prisma.department.findMany();

  // Build lookup maps
  const expMap: Record<string, string[]> = {};
  for (const me of memberExpertise) {
    const memberId = (me as unknown as { teamMemberId?: string }).teamMemberId ?? me.memberId;
    if (!memberId) continue;
    if (!expMap[memberId]) expMap[memberId] = [];
    expMap[memberId].push(me.expertise.name);
  }
  const userMap: Record<string, object> = {};
  for (const u of users) {
    if (u.teamMemberId) userMap[u.teamMemberId] = u;
  }
  const deptMap: Record<string, object> = {};
  for (const d of departments) { deptMap[d.id] = d; }

  // Strip internal Prisma metadata, keep all business fields
  const cleanMembers = members.map((m) => ({
    id: m.id,
    slug: m.slug,
    name: m.name,
    nameEn: m.nameEn,
    nameJa: m.nameJa,
    nameKo: m.nameKo,
    nameZh: m.nameZh,
    role: m.role,
    roleEn: m.roleEn,
    roleJa: m.roleJa,
    roleKo: m.roleKo,
    roleZh: m.roleZh,
    bio: m.bio,
    bioEn: m.bioEn,
    bioJa: m.bioJa,
    bioKo: m.bioKo,
    bioZh: m.bioZh,
    shortBio: m.shortBio,
    shortBioEn: m.shortBioEn,
    shortBioJa: m.shortBioJa,
    shortBioKo: m.shortBioKo,
    shortBioZh: m.shortBioZh,
    image: m.image,
    coverImage: m.coverImage,
    quote: m.quote,
    email: m.email,
    phone: m.phone,
    linkedin: m.linkedin,
    twitter: m.twitter,
    github: m.github,
    facebook: m.facebook,
    tiktok: m.tiktok,
    achievements: m.achievements,
    skills: m.skills,
    experience: m.experience,
    level: m.level,
    rank: m.rank,
    currentXp: m.currentXp,
    maxXp: m.maxXp,
    availableLp: m.availableLp,
    lockedLp: m.lockedLp,
    isActive: m.isActive,
    isFeatured: m.isFeatured,
    sortOrder: m.sortOrder,
    roleLevel: m.roleLevel,
    tabPermissions: m.tabPermissions,
    accessTags: m.accessTags,
    departmentId: m.departmentId,
    department: m.departmentId ? deptMap[m.departmentId] : null,
    expertises: expMap[m.id] ?? [],
    user: userMap[m.id] ?? null,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  }));

  const backup = {
    exportedAt: now.toISOString(),
    totalMembers: cleanMembers.length,
    members: cleanMembers,
  };

  fs.writeFileSync(outPath, JSON.stringify(backup, null, 2), "utf-8");
  console.log(`✅ Backup saved: ${outPath}`);
  console.log(`   Total members: ${cleanMembers.length}`);

  // Print summary
  console.log("\n📋 Members summary:");
  for (const m of cleanMembers) {
    const dept = (m.department as { name?: string; key?: string } | null)?.name ?? (m.department as { name?: string; key?: string } | null)?.key ?? "no dept";
    console.log(`  [${m.rank?.padEnd(8)} Lv${String(m.level).padStart(3)}] ${m.name.padEnd(25)} | ${dept.padEnd(15)} | img: ${m.image ? "✅" : "❌"} | lp: ${String(m.availableLp).padStart(6)}`);
  }
}

backup()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
