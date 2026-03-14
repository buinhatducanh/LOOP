import { config } from "dotenv";
config({ path: ".env.local", override: true });

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is missing");

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

const ROLES = [
  { name: "super_admin", displayName: "Super Admin", description: "Toàn quyền hệ thống", level: 0, isSystem: true },
  { name: "admin", displayName: "Admin", description: "Quản trị viên", level: 1, isSystem: true },
  { name: "content_manager", displayName: "Content Manager", description: "Quản lý nội dung", level: 2, isSystem: true },
  { name: "sales_manager", displayName: "Sales Manager", description: "Quản lý kinh doanh", level: 2, isSystem: true },
  { name: "content_editor", displayName: "Content Editor", description: "Biên tập viên", level: 3, isSystem: false },
  { name: "sales_rep", displayName: "Sales Rep", description: "Nhân viên kinh doanh", level: 3, isSystem: false },
  { name: "viewer", displayName: "Viewer", description: "Chỉ xem", level: 4, isSystem: false },
];

const RESOURCES = ["services", "projects", "orders", "messages", "users", "team", "testimonials", "packages", "settings", "audit_logs"];
const ACTIONS = ["create", "read", "update", "delete"];

const PERMISSION_MATRIX: Record<string, Record<string, string[]>> = {
  admin: Object.fromEntries(RESOURCES.map((r) => [r, r === "settings" ? ["read"] : ACTIONS])),
  content_manager: { services: ACTIONS, projects: ACTIONS, team: ACTIONS, testimonials: ACTIONS, messages: ["read", "update"], packages: ["read"], orders: ["read"] },
  sales_manager: { orders: ACTIONS, messages: ACTIONS, packages: ["read", "update"], services: ["read"], projects: ["read"], team: ["read"], testimonials: ["read"] },
  content_editor: { services: ["read", "create", "update"], projects: ["read", "create", "update"], team: ["read"], testimonials: ["read", "create", "update"] },
  sales_rep: { orders: ["read", "create", "update"], messages: ["read", "update"], packages: ["read"], services: ["read"], projects: ["read"] },
  viewer: Object.fromEntries(RESOURCES.filter((r) => !["settings", "audit_logs", "users"].includes(r)).map((r) => [r, ["read"]])),
};

async function main() {
  console.log("🔑 Seeding RBAC roles and permissions...\n");

  for (const roleData of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: { displayName: roleData.displayName, description: roleData.description },
      create: roleData,
    });

    const perms = PERMISSION_MATRIX[roleData.name];
    if (perms) {
      for (const [resource, actions] of Object.entries(perms)) {
        for (const action of actions) {
          await prisma.permission.upsert({
            where: { roleId_resource_action: { roleId: role.id, resource, action } },
            update: {},
            create: { roleId: role.id, resource, action },
          });
        }
      }
    }
    console.log(`  ✅ Role: ${roleData.displayName} (${roleData.name})`);
  }

  // Create default super admin user
  const adminEmail = "admin@loop.vn";
  const passwordHash = await bcrypt.hash("Admin@123", 12);

  const superAdminRole = await prisma.role.findUnique({ where: { name: "super_admin" } });

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: "admin" },
    create: { email: adminEmail, name: "LOOP Admin", passwordHash, role: "admin", isActive: true },
  });

  if (superAdminRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: adminUser.id, roleId: superAdminRole.id } },
      update: {},
      create: { userId: adminUser.id, roleId: superAdminRole.id },
    });
  }

  console.log(`\n👤 Default admin user created:`);
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Password: Admin@123`);
  console.log(`   Role: super_admin\n`);
  console.log("🎉 RBAC seeding complete!");
}

main()
  .then(async () => { await prisma.$disconnect(); await pool.end(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); await pool.end(); process.exit(1); });
