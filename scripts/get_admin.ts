/**
 * Get admin user ID from DB.
 * Run: cd d:/LOOP_COMPANY/LOOP && npx tsx scripts/get_admin.ts
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

async function main() {
  const { PrismaClient } = await import("@/generated/prisma/client");
  const connectionString = process.env.DATABASE_URL!;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool as never);
  const prisma = new PrismaClient({ adapter } as never);

  const user = await prisma.user.findUnique({
    where: { email: "admin@loop.vn" },
    select: { id: true },
  });
  console.log("ADMIN_ID=" + (user?.id ?? "NOT_FOUND"));
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e.message?.split("\n")[0] ?? e);
  process.exit(1);
});
