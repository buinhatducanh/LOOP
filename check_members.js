const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function main() {
 // Find all Bùi Nhật Đức Anh
 const ceoEntries = await prisma.teamMember.findMany({
 where: { name: { contains: 'Đức Anh' } },
 select: { id: true, name: true, slug: true, level: true, rank: true, image: true, availableLp: true }
 });
 console.log('=== Bùi Nhật Đức Anh entries ===');
 console.log(JSON.stringify(ceoEntries, null, 2));

 // Show ALL active members
 const allMembers = await prisma.teamMember.findMany({
  where: { isActive: true },
 select: { id: true, name: true, slug: true, level: true, rank: true, image: true, isFeatured: true }
 });
 console.log('\n=== ALL active members (' + allMembers.length + ') ===');
 for (const m of allMembers) {
 console.log(' ' + m.name + ' | slug=' + m.slug + ' | lv=' + m.level + ' | rank=' + m.rank + ' | featured=' + m.isFeatured + ' | img=' + (m.image ? 'YES' : 'NO'));
 }
}

main().catch(console.error).finally(() => prisma.$disconnect());
