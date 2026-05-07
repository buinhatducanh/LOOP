/**
 * Seed ServicePackage (4 website packages for BookingWizard)
 * Run: npx tsx prisma/seed-packages.ts
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("\n[ServicePackages] Seeding 4 website packages...");
  const websitePackages = [
    {
      slug: "landing", title: "Landing Page",
      shortDesc: "Chiến dịch Marketing, giới thiệu cá nhân, offline. Phù hợp landing page, trang giới thiệu cá nhân, sản phẩm đơn lẻ.",
      type: "website", price: 1890000, priceText: "1.89 triệu", marketPrice: 2500000,
      features: ["Giao diện Hiện đại, Responsive","Tối ưu Trải nghiệm UI/UX","Hỗ trợ chỉnh sửa sau bàn giao","Trang giới thiệu SP/Dịch vụ","Admin quản lý bài viết","Form thu thập dữ liệu KH","Quản lý tệp KH cơ bản","Tối ưu SEO On-page"],
      tagline: "Chiến dịch Marketing, giới thiệu cá nhân, offline",
      // taglineVi removed (not in schema)
      // "Chiến dịch Marketing, giới thiệu cá nhân, offline",
      color: "#6EB1A8", pages: "8", pagesVi: "8",
      isPopular: false, isActive: true, sortOrder: 1,
    },
    {
      slug: "ban-hang", title: "Bán Hàng Cơ Bản",
      shortDesc: "Shop online nhỏ & vừa, bắt đầu chuyển đổi số. Phù hợp cửa hàng online, boutique, dịch vụ nhỏ.",
      type: "website", price: 5500000, priceText: "5.50 triệu",
      features: ["Bao gồm mọi tính năng Landing Page","Danh mục & Chi tiết sản phẩm","Chức năng Giỏ hàng thông minh","Thống kê đơn hàng & Doanh thu","Tài khoản Admin & Khách hàng","Tặng 5 trang nội dung miễn phí"],
      tagline: "Shop online nhỏ & vừa, bắt đầu chuyển đổi số",
      // taglineVi removed (not in schema)
      // "Shop online nhỏ & vừa, bắt đầu chuyển đổi số",
      color: "#3B82F6", pages: "8", pagesVi: "8",
      marketPrice: 3890000, isPopular: true, isActive: true, sortOrder: 2,
    },
    {
      slug: "doanh-nghiep", title: "Quản Trị Doanh Nghiệp",
      shortDesc: "Doanh nghiệp, hệ thống bán hàng quy mô lớn. Phù hợp doanh nghiệp vừa và lớn, cần quản lý phức tạp.",
      type: "website", price: 8900000, priceText: "8.90 triệu",
      features: ["Bao gồm mọi tính năng Bán Hàng","Giỏ hàng đa dịch vụ/sản phẩm","SP nâng cao (size, màu, thuộc tính)","Hệ thống Mã giảm giá/Flash sale","Tích điểm & Đổi quà thành viên","Bộ lọc & Tìm kiếm AI thông minh","Quản lý Kho hàng & Nhà cung cấp"],
      tagline: "Doanh nghiệp vừa và lớn, quản lý phức tạp",
      // taglineVi removed (not in schema)
      // "Doanh nghiệp vừa và lớn, quản lý phức tạp",
      color: "#8B5CF6", pages: "8", pagesVi: "8",
      marketPrice: 5890000, isPopular: false, isActive: true, sortOrder: 3,
    },
    {
      slug: "yeu-cau", title: "Theo Yêu Cầu",
      shortDesc: "Startups, nền tảng App-web có logic phức tạp. Phù hợp startup, platform, web app có yêu cầu đặc thù riêng.",
      type: "website", price: 12000000, priceText: "12.0 triệu",
      features: ["Bao gồm mọi tính năng Doanh Nghiệp","UI/UX Độc quyền (Không mẫu)","Tùy chỉnh chức năng Core System","Tích hợp Cổng thanh toán/Vận chuyển","API kết nối bên thứ 3 (Zalo, App...)","Bảo mật đa lớp & Tối ưu Speed cực hạn"],
      tagline: "Startups, platform, logic đặc thù riêng",
      // taglineVi removed (not in schema)
      // "Startups, platform, logic đặc thù riêng",
      color: "#EC4899", pages: "8", pagesVi: "8",
      marketPrice: 7890000, isPopular: false, isActive: true, sortOrder: 4,
    },
  ];

  for (const p of websitePackages) {
    await prisma.servicePackage.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
    console.log(`  ✓ ${p.slug} (${p.title})`);
  }
  console.log("✅ ServicePackages Done!");
  await prisma.$disconnect();
}
main().catch(e => { console.error("❌", e); process.exit(1); });
