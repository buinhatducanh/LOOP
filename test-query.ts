import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

import { prisma } from "./src/lib/prisma";

async function check() {
  try {
    const groups = await prisma.featureGroup.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        groupName: true,
        slug: true,
        sortOrder: true,
        features: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            featureName: true,
            description: true,
            logicLevel: true,
            isRequired: true,
            variants: {
              where: { isActive: true },
              orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
              select: {
                id: true,
                variantName: true,
                description: true,
                price: true,
              },
            },
          },
        },
      },
    });
    console.log("Success! Groups found:", groups.length);
  } catch (err: any) {
    console.error("Query failed, writing to error.txt");
    require("fs").writeFileSync("error.txt", String(err) + "\n" + (err.stack || ""));
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
