import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth/password";

async function main() {
  console.log("Resetting admin password...");

  const passwordHash = await hashPassword("admin123");

  await prisma.user.update({
    where: { email: "admin@loop.vn" },
    data: { passwordHash },
  });

  console.log("Admin password reset to: admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
