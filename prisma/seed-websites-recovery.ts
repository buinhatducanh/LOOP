import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL not found");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function seedRecoveryData() {
  console.log("\n[Recovery] Seeding WebTemplates and CustomerWebsites...");

  // 1. Web Templates
  const templates = [
    {
      slug: "nha-hang-luxury",
      name: "Luxury Restaurant",
      nameVi: "Nhà hàng Luxury",
      descriptionVi: "Giao diện sang trọng cho nhà hàng cao cấp, tích hợp đặt bàn.",
      category: "ăn uống",
      categoryVi: "ăn uống",
      thumbnail: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800q=80",
      demoUrl: "https://luxury-restaurant.demo.loop.vn",
      deliveryTime: "2-4 tuần",
      price: 1890000,
      isActive: true,
      sortOrder: 1,
    },
    {
      slug: "shop-my-pham",
      name: "Cosmetic Shop",
      nameVi: "Shop Mỹ phẩm",
      descriptionVi: "Tối ưu cho việc trưng bày sản phẩm làm đẹp, mỹ phẩm.",
      category: "mua sắm",
      categoryVi: "mua sắm",
      thumbnail: "https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?w=800q=80",
      demoUrl: "https://cosmetic-shop.demo.loop.vn",
      deliveryTime: "3-5 tuần",
      price: 3890000,
      isActive: true,
      sortOrder: 2,
    },
    {
      slug: "bat-dong-san-pro",
      name: "Real Estate Pro",
      nameVi: "Bất động sản Pro",
      descriptionVi: "Quản lý giỏ hàng bất động sản, tích hợp bản đồ.",
      category: "bất động sản",
      categoryVi: "bất động sản",
      thumbnail: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800q=80",
      demoUrl: "https://real-estate-pro.demo.loop.vn",
      deliveryTime: "4-6 tuần",
      price: 5890000,
      isActive: true,
      sortOrder: 3,
    },
  ];

  for (const t of templates) {
    await prisma.webTemplate.upsert({
      where: { slug: t.slug },
      update: t,
      create: t,
    });
  }
  console.log(`  ✓ ${templates.length} WebTemplates upserted`);

  // 2. Customer Websites
  const hostingPlans = await prisma.pricingHostingPlan.findMany({ take: 1 });
  const hostingId = hostingPlans[0]?.id;

  const customerWebsites = [
    {
      name: "LOOP Solutions Main",
      domain: "loop.vn",
      customerName: "Bùi Nhật Đức Anh",
      customerEmail: "ducanhnhatbui@gmail.com",
      status: "active",
      configStatus: "delivered",
      hostingPlanId: hostingId,
      domainExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      hostingExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
    {
      name: "My Personal Blog",
      domain: "nhatanh.dev",
      customerName: "Nhật Anh",
      customerEmail: "nhatanh@loop.vn",
      status: "active",
      configStatus: "pending_config",
      hostingPlanId: hostingId,
      domainExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      hostingExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const w of customerWebsites) {
    await prisma.customerWebsite.create({
      data: w,
    });
  }
  console.log(`  ✓ ${customerWebsites.length} CustomerWebsites created`);
}

seedRecoveryData()
  .then(() => {
    console.log("✅ Recovery Seed Done!");
    process.exit(0);
  })
  .catch((e) => {
    console.error("❌ Error during recovery seed:", e);
    process.exit(1);
  });
