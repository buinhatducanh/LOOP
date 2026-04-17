import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  // Map: old garbled slug → new correct slug + dept key
  const oldToNew: Record<string, { slug: string; deptKey: string; role: string }> = {
    "nguyn-phc-thun":  { slug: "nguyen-phuc-thuan",  deptKey: "pm",          role: "Project Manager" },
    "trn-v-hng":       { slug: "tran-vu-hung",       deptKey: "pm",          role: "Project Manager" },
    "l-ngc-xun-qunh":  { slug: "le-ngoc-xuan-quynh", deptKey: "pm",          role: "PM Tập Sự" },
    "nguyn-trng-qu":   { slug: "nguyen-trong-quy",   deptKey: "engineering",  role: "Developer" },
    "dng-gia-lc":      { slug: "duong-gia-lac",      deptKey: "seo",          role: "SEO & Developer" },
    "-tn-ti":          { slug: "do-tan-tai",         deptKey: "engineering",  role: "Developer" },
    "nguyn-minh-tr":   { slug: "nguyen-minh-tri",    deptKey: "engineering",  role: "IT Support" },
    "l-vn-thun":       { slug: "le-van-thuan",       deptKey: "qc",           role: "QA Engineer" },
    "trn-hong-anh":    { slug: "tran-hoang-anh",     deptKey: "qc",           role: "QA Engineer" },
    "h-th-anh":        { slug: "ha-the-anh",         deptKey: "qc",           role: "QA Engineer" },
    "lng-hong-thng":   { slug: "luong-hoang-thong",  deptKey: "qc",           role: "QA Engineer" },
    "nguyn-phc-thnh":  { slug: "nguyen-phuc-thinh",  deptKey: "media",        role: "Trưởng phòng Media" },
    "trn-v-thu-dng":   { slug: "tran-vo-thuy-duong", deptKey: "media",        role: "Đại sứ Truyền thông" },
  };

  // Get new dept IDs
  const depts = await prisma.department.findMany({ select: { id: true, key: true } });
  const deptIds = Object.fromEntries(depts.map(d => [d.key, d.id]));

  let updated = 0;
  let deleted = 0;

  for (const [oldSlug, { slug: newSlug, deptKey, role }] of Object.entries(oldToNew)) {
    const oldMember = await prisma.teamMember.findUnique({ where: { slug: oldSlug } });
    if (!oldMember) {
      console.log(`  - ${oldSlug}: not found (may already be cleaned)`);
      continue;
    }

    // Find the new record for this member
    const newMember = await prisma.teamMember.findUnique({ where: { slug: newSlug } });

    if (newMember) {
      // Both exist
      // Strategy:
      // 1. Reassign LP txns from newMember to oldMember
      // 2. Delete newMember (now safe)
      // 3. Update oldMember with correct dept + slug
      await prisma.lpTransaction.updateMany({
        where: { memberId: newMember.id },
        data: { memberId: oldMember.id },
      });
      await prisma.teamMember.delete({ where: { id: newMember.id } });

      await prisma.teamMember.update({
        where: { id: oldMember.id },
        data: {
          departmentId: deptIds[deptKey] ?? null,
          department: deptKey,
          role,
          slug: newSlug, // fix garbled slug
          sortOrder: oldMember.sortOrder ?? 0,
          isActive: true,
          roleLevel: deptKey === "pm" ? 3 : deptKey === "media" ? 4 : deptKey === "qc" ? 5 : 6,
        },
      });
      console.log(`  ✓ ${newSlug}: reassigned LP txns, deleted new dup (${newMember.id.slice(0,8)}), updated old (${oldMember.id.slice(0,8)}) → dept ${deptKey}`);
      updated++;
      deleted++;
    } else {
      // Only old exists — update it with correct dept
      await prisma.teamMember.update({
        where: { id: oldMember.id },
        data: {
          departmentId: deptIds[deptKey] ?? null,
          department: deptKey,
          role,
          slug: newSlug, // fix the garbled slug too
          sortOrder: oldMember.sortOrder ?? 0,
          isActive: true,
          roleLevel: deptKey === "pm" ? 3 : deptKey === "media" ? 4 : deptKey === "qc" ? 5 : 6,
        },
      });
      console.log(`  ✓ ${newSlug}: updated old (${oldMember.id.slice(0,8)}) → dept ${deptKey}`);
      updated++;
    }
  }

  // Also handle CEO (slug was correct)
  const ceoOld = await prisma.teamMember.findUnique({ where: { slug: "bui-nhat-duc-anh" } });
  if (ceoOld) {
    // Check if there's a duplicate with same email or same name
    const ceoEmail = "ducanhnhatbui@gmail.com";
    const allCeos = await prisma.teamMember.findMany({
      where: {
        OR: [
          { email: ceoEmail },
          { name: "Bùi Nhật Đức Anh" },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    if (allCeos.length > 1) {
      // Keep first, delete rest
      const [keep, ...toDelete] = allCeos;
      for (const d of toDelete) {
        await prisma.teamMember.delete({ where: { id: d.id } });
        console.log(`  ✓ Deleted duplicate CEO: ${d.id.slice(0,8)}`);
        deleted++;
      }
    }

    // Update the kept CEO's department
    await prisma.teamMember.update({
      where: { id: allCeos[0].id },
      data: {
        departmentId: deptIds["ceo_office"] ?? null,
        department: "ceo_office",
        sortOrder: 0,
      },
    });
    console.log(`  ✓ CEO updated to ceo_office`);
    updated++;
  }

  console.log(`\nSummary: ${updated} updated, ${deleted} deleted`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
