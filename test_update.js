const { PrismaClient } = require("./src/generated/prisma");
const prisma = new PrismaClient();

async function main() {
  const id = 'cmollcma800083guy7qctvqiz';
  const body = {
    level: 0,
    name: "Miễn phí",
    nameEn: "Free",
    shortDesc: "Gói SEO cơ bản miễn phí",
    basePrice: 0,
    marketPrice: 0,
    lpReward: 0,
    sortOrder: 1,
    isActive: true
  };

  console.log("Updating tier...");
  const updated = await prisma.serviceTier.update({
    where: { id },
    data: {
      ...(body.level !== undefined && { level: Number(body.level) }),
      ...(body.name !== undefined && { name: String(body.name).trim() }),
      ...(body.nameEn !== undefined && { nameEn: body.nameEn?.trim() || null }),
      ...(body.shortDesc !== undefined && { shortDesc: body.shortDesc?.trim() || null }),
      ...(body.basePrice !== undefined && { basePrice: Number(body.basePrice) }),
      ...(body.marketPrice !== undefined && { marketPrice: body.marketPrice ? Number(body.marketPrice) : null }),
      ...(body.lpReward !== undefined && { lpReward: Number(body.lpReward ?? 0) }),
      ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) }),
      ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
    },
  });
  console.log("Updated:", updated);
}

main()
  .catch((e) => {
    console.error("ERROR:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
