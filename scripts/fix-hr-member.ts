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

  // Fix Quynh HR's departmentId
  const hrDept = await prisma.department.findUnique({ where: { key: "hr" } });
  if (hrDept) {
    await prisma.teamMember.updateMany({
      where: { slug: "quynh-hr" },
      data: { departmentId: hrDept.id },
    });
    console.log("Quynh HR departmentId →", hrDept.id.slice(0, 8));
  }

  // Final summary
  const members = await prisma.teamMember.findMany({
    select: { name: true, slug: true, department: true, departmentId: true, role: true, isActive: true },
    orderBy: { department: "asc" },
  });

  const byDept: Record<string, typeof members> = {};
  for (const m of members) {
    const d = m.department || "(null deptId)";
    if (!byDept[d]) byDept[d] = [];
    byDept[d].push(m);
  }

  for (const [dept, ms] of Object.entries(byDept).sort()) {
    console.log(`\n[${dept}] ${ms.length} members:`);
    for (const m of ms) {
      console.log(`  - ${m.name} | ${m.role?.slice(0, 20)} | deptId: ${m.departmentId?.slice(0, 8) || "(null)"}`);
    }
  }

  // Also verify department headIds
  const depts = await prisma.department.findMany({
    select: { key: true, name: true, headId: true },
  });
  console.log("\nDepartment heads:");
  for (const d of depts) {
    if (d.headId) {
      const head = members.find(m => m.departmentId === d.headId || m.name === "Bùi Nhật Đức Anh");
      console.log(`  ${d.key}: headId=${d.headId.slice(0, 8)}`);
    } else {
      console.log(`  ${d.key}: (no head)`);
    }
  }

  await prisma.$disconnect();
  await pool.end();
  console.log("\nDone");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
