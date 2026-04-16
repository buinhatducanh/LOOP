import 'dotenv/config';
import { PrismaClient } from './src/generated/prisma/client';

const prisma = new PrismaClient();

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
console.log('\n=== ALL (' + all.length + ') ===');
all.forEach(m => console.log(m.name + ' | lv=' + m.level + ' | rank=' + m.rank + ' | img=' + (m.image ? 'YES' : 'NO') + ' | feat=' + m.isFeatured));

await prisma.$disconnect();
