import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "./src/generated/prisma/client";

const rawUrl = process.env.DATABASE_URL ?? "";
const pool = new Pool({ connectionString: rawUrl });
const adapter = new PrismaPg({ connectionString: rawUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
 const ceoEntries = await prisma.teamMember.findMany({
 where: { name: { contains: 'Anh' } },
 select: { id: true, name: true, slug: true, level: true, rank: true, image: true, isFeatured: true }
 });
 console.log('=== Members with Anh ===');
 ceoEntries.forEach(m => console.log(JSON.stringify(m)));

 const all = await prisma.teamMember.findMany({
 where: { isActive: true },
 select: { id: true, name: true, slug: true, level: true, rank: true, image: true, isFeatured: true }
 });
 console.log('\n=== ALL active (' + all.length + ') ===');
 all.forEach(m => console.log(m.name + ' | lv=' + m.level + ' | rank=' + m.rank + ' | img=' + (m.image ? 'YES' : 'NO') + ' | feat=' + m.isFeatured));
}

main().catch(console.error).finally(() => { prisma.$disconnect(); process.exit(0); });
