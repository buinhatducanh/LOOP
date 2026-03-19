import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaClient } from "../src/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = (() => {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString: connectionString || "" });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
})();

async function main() {
  console.log("Seeding RBAC...");

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: {
      name: "admin",
      displayName: "Administrator",
      description: "Full system access",
      level: 100,
      isSystem: true,
    },
  });

  const editorRole = await prisma.role.upsert({
    where: { name: "editor" },
    update: {},
    create: {
      name: "editor",
      displayName: "Editor",
      description: "Can edit content",
      level: 50,
      isSystem: false,
    },
  });

  const viewerRole = await prisma.role.upsert({
    where: { name: "viewer" },
    update: {},
    create: {
      name: "viewer",
      displayName: "Viewer",
      description: "Read-only access",
      level: 10,
      isSystem: false,
    },
  });

  console.log("Roles created:", { admin: adminRole.name, editor: editorRole.name, viewer: viewerRole.name });

  // Create permissions for admin role
  const adminPermissions = [
    { resource: "team", action: "create" },
    { resource: "team", action: "read" },
    { resource: "team", action: "update" },
    { resource: "team", action: "delete" },
    { resource: "expertises", action: "create" },
    { resource: "expertises", action: "read" },
    { resource: "expertises", action: "update" },
    { resource: "expertises", action: "delete" },
    { resource: "users", action: "create" },
    { resource: "users", action: "read" },
    { resource: "users", action: "update" },
    { resource: "users", action: "delete" },
  ];

  // Clear existing admin permissions and create new ones
  await prisma.permission.deleteMany({ where: { roleId: adminRole.id } });

  for (const perm of adminPermissions) {
    await prisma.permission.create({
      data: {
        roleId: adminRole.id,
        resource: perm.resource,
        action: perm.action,
        scope: "all",
      },
    });
  }

  console.log("Admin permissions created");

  // Assign admin role to admin user
  const adminUser = await prisma.user.findUnique({ where: { email: "admin@loop.vn" } });
  if (adminUser) {
    // Remove existing roles
    await prisma.userRole.deleteMany({ where: { userId: adminUser.id } });

    // Add admin role
    await prisma.userRole.create({
      data: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    });
    console.log("Admin role assigned to admin@loop.vn");
  } else {
    console.log("Admin user not found!");
  }

  console.log("RBAC seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
