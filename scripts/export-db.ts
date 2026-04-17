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

  const [depts, members] = await Promise.all([
    prisma.department.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.teamMember.findMany({
      include: { departmentRelation: true, user: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  console.log("=== DEPARTMENTS ===");
  console.log(
    JSON.stringify(
      depts.map((d) => ({
        id: d.id,
        key: d.key,
        name: d.name,
        shortName: d.shortName,
        color: d.color,
        description: d.description,
        mission: d.mission,
        headId: d.headId,
        memberCount: d.memberCount,
      })),
      null,
      2
    )
  );
  console.log("\n=== TEAM MEMBERS ===");
  console.log(
    JSON.stringify(
      members.map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        department: m.department,
        departmentId: m.departmentId,
        departmentName: m.departmentRelation?.name,
        departmentKey: m.departmentRelation?.key,
        avatar: m.image,
        sortOrder: m.sortOrder,
        rank: m.rank,
        level: m.level,
        lpBalance: m.lpBalance,
        isActive: m.isActive,
        userEmail: m.user?.email,
        userRole: m.user?.role,
      })),
      null,
      2
    )
  );

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
