import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/auth/password";

async function main() {
  console.log("Creating admin user...");

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@loop.vn" },
  });

  if (existingAdmin) {
    console.log("Admin user already exists!");
    return;
  }

  // Create admin user
  const passwordHash = await hashPassword("admin123");

  const admin = await prisma.user.create({
    data: {
      email: "admin@loop.vn",
      name: "Admin",
      passwordHash,
      role: "admin",
      isActive: true,
    },
  });

  console.log(`Admin user created: ${admin.email}`);
  console.log("Password: admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
