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

  const ceo = await prisma.teamMember.findUnique({ where: { slug: "bui-nhat-duc-anh" } });
  const mediaHead = await prisma.teamMember.findUnique({ where: { slug: "nguyen-phuc-thinh" } });

  if (ceo) {
    await prisma.department.updateMany({ where: { key: "ceo_office" }, data: { headId: ceo.id } });
    console.log("ceo_office headId →", ceo.id.slice(0, 8), ceo.name);
  } else {
    console.log("CEO not found!");
  }

  if (mediaHead) {
    await prisma.department.updateMany({ where: { key: "media" }, data: { headId: mediaHead.id } });
    await prisma.teamMember.updateMany({ where: { slug: "nguyen-phuc-thinh" }, data: { isDeptHead: true } });
    console.log("media headId →", mediaHead.id.slice(0, 8), mediaHead.name);
  } else {
    console.log("Media head not found!");
  }

  await prisma.$disconnect();
  await pool.end();
  console.log("Done");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
