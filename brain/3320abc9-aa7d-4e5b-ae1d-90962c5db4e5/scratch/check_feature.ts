import { prisma } from "../../src/lib/prisma";

async function main() {
  const serviceAttrs = await prisma.serviceAttribute.findMany({
    where: { nameVi: { contains: "Responsive" } }
  });
  console.log("ServiceAttributes (Calculator):");
  console.log(JSON.stringify(serviceAttrs, null, 2));

  const features = await prisma.feature.findMany({
    where: { featureName: { contains: "Responsive" } }
  });
  console.log("\nFeatures (Comparison Matrix):");
  console.log(JSON.stringify(features, null, 2));
}

main();
