import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const feature = await prisma.feature.findFirst({
    where: { featureName: "Thiết kế Responsive" }
  });

  if (feature) {
    console.log(`Found feature: ${feature.featureName} (ID: ${feature.id}, isActive: ${feature.isActive})`);
    await prisma.feature.update({
      where: { id: feature.id },
      data: { isActive: false }
    });
    console.log("Successfully updated isActive to false.");
  } else {
    console.log("Feature 'Thiết kế Responsive' not found in Feature model.");
  }
}

main();
