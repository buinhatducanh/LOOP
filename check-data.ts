import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

async function check() {
  const { prisma } = await import("./src/lib/prisma");
  const groups = await prisma.featureGroup.findMany({
    include: {
      features: {
        include: {
          variants: true
        }
      }
    }
  });
  console.log(`Found ${groups.length} feature groups.`);
  for (const g of groups) {
    console.log(`- ${g.groupName} (${g.features.length} features)`);
  }
}

check()
  .catch(console.error);
