const { PrismaClient } = require("./src/generated/prisma");
const prisma = new PrismaClient();

async function main() {
  const tiers = await prisma.serviceTier.findMany({
    where: { serviceKey: "seo" },
    orderBy: { level: "asc" },
  });
  console.log("SEO TIERS:");
  tiers.forEach(t => {
    console.log(`- ID: ${t.id}, Level: ${t.level}, Name: ${t.name}, SortOrder: ${t.sortOrder}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
