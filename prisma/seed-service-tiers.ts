/**
 * seed-service-tiers-only.ts
 * Chạy: npx tsx prisma/seed-service-tiers-only.ts
 *
 * Seed ServiceTiers (web 4-tiers) mà KHÔNG đụng gì nhân sự.
 * An toàn tuyệt đối cho dữ liệu thành viên.
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL not found");
  process.exit(1);
}
const pool = new Pool({ connectionString });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function seedServiceTiers() {
  console.log("\n[ServiceTiers] Seeding web (4 tiers) + app/dashboard/seo (3 tiers each)...");

  const tiers = [
    // ── WEB ──────────────────────────────────────────────────────
    // 4-tiers: Landing Page | Bán Hàng Cơ Bản | Doanh Nghiệp | Theo Yêu Cầu
    { serviceKey: "web", level: 1, name: "Landing Page", nameEn: "Landing Page",
      shortDesc: "Chạy quảng cáo nhanh 1 sản phẩm/dịch vụ cụ thể",
      shortDescEn: "Quick landing page for a single product or service campaign",
      basePrice: 1_890_000, marketPrice: 2_500_000, lpReward: 30, sortOrder: 1 },
    { serviceKey: "web", level: 2, name: "Bán Hàng Cơ Bản", nameEn: "Basic E-commerce",
      shortDesc: "Cửa hàng nhỏ muốn có kênh trưng bày và chốt đơn tự động",
      shortDescEn: "Small store needing a showcase channel and automated sales",
      basePrice: 3_890_000, marketPrice: 5_500_000, lpReward: 50, sortOrder: 2 },
    { serviceKey: "web", level: 3, name: "Doanh Nghiệp", nameEn: "Business",
      shortDesc: "Công ty cần hồ sơ năng lực số chuyên nghiệp để tăng uy tín",
      shortDescEn: "Company needing a professional digital portfolio to boost credibility",
      basePrice: 5_890_000, marketPrice: 8_900_000, lpReward: 80, sortOrder: 3 },
    { serviceKey: "web", level: 4, name: "Theo Yêu Cầu", nameEn: "Custom",
      shortDesc: "Hệ thống lớn, luồng kinh doanh đặc thù cần đo ni đóng giày",
      shortDescEn: "Large system or bespoke business flow requiring custom development",
      basePrice: 7_890_000, marketPrice: 9_900_000, lpReward: 120, sortOrder: 4 },

    // ── APP/SaaS ─────────────────────────────────────────────────
    { serviceKey: "app", level: 1, name: "Cơ Bản", nameEn: "Basic",
      shortDesc: "App cơ bản với tính năng thiết yếu, MVP nhanh chóng",
      shortDescEn: "Essential app features, fast MVP launch",
      basePrice: 19_980_000, marketPrice: 25_000_000, lpReward: 200, sortOrder: 1 },
    { serviceKey: "app", level: 2, name: "Doanh Nghiệp", nameEn: "Business",
      shortDesc: "App đầy đủ tính năng, tích hợp push notification và analytics",
      shortDescEn: "Full-featured app with push notifications and analytics",
      basePrice: 39_800_000, marketPrice: 49_000_000, lpReward: 400, sortOrder: 2 },
    { serviceKey: "app", level: 3, name: "Chuyên Nghiệp", nameEn: "Experience",
      shortDesc: "App SaaS độc quyền, tích hợp AI, real-time, multi-tenant",
      shortDescEn: "Exclusive SaaS app with AI, real-time, and multi-tenant support",
      basePrice: 79_800_000, marketPrice: 99_000_000, lpReward: 800, sortOrder: 3 },

    // ── DASHBOARD ─────────────────────────────────────────────────
    { serviceKey: "dashboard", level: 1, name: "Cơ Bản", nameEn: "Basic",
      shortDesc: "Dashboard cơ bản với biểu đồ và báo cáo, phù hợp nhóm nhỏ",
      shortDescEn: "Basic dashboard with charts and reports for small teams",
      basePrice: 9_900_000, marketPrice: 15_000_000, lpReward: 100, sortOrder: 1 },
    { serviceKey: "dashboard", level: 2, name: "Doanh Nghiệp", nameEn: "Business",
      shortDesc: "Dashboard nâng cao, multi-user, quyền hạn theo role",
      shortDescEn: "Advanced dashboard with multi-user and role-based access",
      basePrice: 19_900_000, marketPrice: 29_000_000, lpReward: 200, sortOrder: 2 },
    { serviceKey: "dashboard", level: 3, name: "Chuyên Nghiệp", nameEn: "Experience",
      shortDesc: "Enterprise dashboard với AI analytics, API đầy đủ, SLA",
      shortDescEn: "Enterprise dashboard with AI analytics, full API, SLA support",
      basePrice: 49_900_000, marketPrice: 69_000_000, lpReward: 500, sortOrder: 3 },

    // ── SEO ───────────────────────────────────────────────────────
    { serviceKey: "seo", level: 1, name: "Cơ Bản", nameEn: "Basic",
      shortDesc: "10 bài chuẩn SEO, tối ưu on-page cơ bản",
      shortDescEn: "10 SEO articles, basic on-page optimization",
      basePrice: 2_000_000, marketPrice: 3_000_000, lpReward: 20, sortOrder: 1 },
    { serviceKey: "seo", level: 2, name: "Doanh Nghiệp", nameEn: "Business",
      shortDesc: "30 bài/tháng, SEO technical, Google Search Console",
      shortDescEn: "30 articles/month, technical SEO, Google Search Console",
      basePrice: 6_000_000, marketPrice: 9_000_000, lpReward: 60, sortOrder: 2 },
    { serviceKey: "seo", level: 3, name: "Chuyên Nghiệp", nameEn: "Experience",
      shortDesc: "SEO toàn diện: content, link building, AI content, 6 tháng",
      shortDescEn: "Full SEO: content, link building, AI content, 6-month campaign",
      basePrice: 36_000_000, marketPrice: 48_000_000, lpReward: 360, sortOrder: 3 },
  ];

  let upserted = 0;
  for (const t of tiers) {
    const existing = await prisma.serviceTier.findUnique({
      where: { serviceKey_level: { serviceKey: t.serviceKey, level: t.level } },
    });

    if (existing) {
      await prisma.serviceTier.update({
        where: { id: existing.id },
        data: {
          name: t.name, nameEn: t.nameEn,
          shortDesc: t.shortDesc, shortDescEn: t.shortDescEn,
          basePrice: t.basePrice, marketPrice: t.marketPrice,
          lpReward: t.lpReward, sortOrder: t.sortOrder,
        },
      });
      console.log(`  ↻ [${t.serviceKey}] Lv${t.level}: ${t.name} → ${t.basePrice.toLocaleString()}đ`);
    } else {
      await prisma.serviceTier.create({
        data: {
          serviceKey: t.serviceKey, level: t.level,
          name: t.name, nameEn: t.nameEn,
          shortDesc: t.shortDesc, shortDescEn: t.shortDescEn,
          basePrice: t.basePrice, marketPrice: t.marketPrice,
          lpReward: t.lpReward, sortOrder: t.sortOrder, isActive: true,
        },
      });
      console.log(`  ✓ [${t.serviceKey}] Lv${t.level}: ${t.name} → ${t.basePrice.toLocaleString()}đ (NEW)`);
    }
    upserted++;
  }

  // Summary
  const counts = await prisma.serviceTier.groupBy({
    by: ["serviceKey"],
    _count: { serviceKey: true },
  });
  console.log("\n[Summary]");
  for (const c of counts) {
    console.log(`  ${c.serviceKey}: ${c._count.serviceKey} tiers`);
  }
}

async function main() {
  console.log("=".repeat(50));
  console.log("🌱 ServiceTiers Only — Web 4-tiers + App/Dashboard/SEO");
  console.log("=".repeat(50));
  console.log("⚠️  KHÔNG đụng gì nhân sự — chỉ seed ServiceTier\n");

  try {
    await seedServiceTiers();
    console.log("\n✅ Done!");
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
