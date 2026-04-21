/**
 * Run: npx tsx scripts/seed-web-features.ts
 * Upsert FeatureGroup + Feature + sync ServicePackage.features bằng Feature IDs.
 * Idempotent: upsert → không mất data cũ.
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
const prisma = new PrismaClient({ adapter });

const FEATURE_GROUPS = [
  { slug: "giao-dien", groupName: "Giao diện", serviceKey: "web", sortOrder: 1, features: [
    "Thiết kế Responsive","Giao diện Hiện đại","Hiệu ứng Animation","Tối ưu UI/UX","UI/UX Độc quyền","Dark Mode","Đa ngôn ngữ","File Figma gốc",
  ]},
  { slug: "tinh-nang-cot-loi", groupName: "Tính năng cốt lõi", serviceKey: "web", sortOrder: 2, features: [
    "Trang giới thiệu SP/Dịch vụ","Admin quản lý bài viết","Form thu thập dữ liệu KH","Quản lý tệp KH cơ bản","Tối ưu SEO On-page","Hỗ trợ chỉnh sửa sau bàn giao","Kết nối Mạng xã hội","Chat Widget tích hợp","Bản đồ Google Maps","API kết nối Zalo","API kết nối bên thứ 3","Tích hợp Cổng thanh toán","Tùy chỉnh Core System",
  ]},
  { slug: "quan-tri", groupName: "Quản trị", serviceKey: "web", sortOrder: 3, features: [
    "Bảng điều khiển Admin","Phân quyền người dùng","Tài khoản Admin đa người","Nhật ký hoạt động","Quản lý Kho hàng","Quản lý Nhà cung cấp",
  ]},
  { slug: "seo-marketing", groupName: "SEO & Marketing", serviceKey: "web", sortOrder: 4, features: [
    "SEO On-page cơ bản","XML Sitemap tự động","Google Analytics 4","Google Search Console","Schema Markup (JSON-LD)","Tối ưu tốc độ (Speed)","SEO nâng cao","Email Marketing","Mã giảm giá / Flash Sale","Bộ lọc & Tìm kiếm AI",
  ]},
  { slug: "thuong-mai", groupName: "Thương mại", serviceKey: "web", sortOrder: 5, features: [
    "Danh mục & Chi tiết sản phẩm","Chức năng Giỏ hàng thông minh","Thanh toán trực tuyến","Thống kê đơn hàng & Doanh thu","Tài khoản Admin & Khách hàng","Sản phẩm nâng cao","Tích điểm & Đổi quà thành viên","Giỏ hàng đa dịch vụ/sản phẩm","Đánh giá & Review sản phẩm","Tích hợp Vận chuyển",
  ]},
  { slug: "nang-cao", groupName: "Nâng cao", serviceKey: "web", sortOrder: 6, features: [
    "AI Chatbot tích hợp","Marketing Automation","Tích hợp CRM","Thông báo Real-time","Multi-tenant SaaS","Tích hợp Mobile App","Advanced Analytics Dashboard",
  ]},
  { slug: "bao-mat", groupName: "Bảo mật", serviceKey: "web", sortOrder: 7, features: [
    "Chứng chỉ SSL","WAF & DDoS Protection","Xác thực 2 lớp (2FA)","Tuân thủ GDPR","Backup hàng ngày","Rate Limiting & Throttling","Kiểm thử Bảo mật","Mã hóa dữ liệu",
  ]},
];

const PKG_FEATURES: Record<string, string[]> = {
  landing: ["Thiết kế Responsive","Giao diện Hiện đại","Hiệu ứng Animation","Tối ưu UI/UX","Trang giới thiệu SP/Dịch vụ","Admin quản lý bài viết","Form thu thập dữ liệu KH","Quản lý tệp KH cơ bản","Tối ưu SEO On-page","Hỗ trợ chỉnh sửa sau bàn giao","Bảng điều khiển Admin","SEO On-page cơ bản","XML Sitemap tự động","Google Analytics 4","Google Search Console","Chứng chỉ SSL","Kết nối Mạng xã hội","Chat Widget tích hợp","Bản đồ Google Maps"],
  "ban-hang": ["Thiết kế Responsive","Giao diện Hiện đại","Hiệu ứng Animation","Tối ưu UI/UX","Dark Mode","File Figma gốc","Trang giới thiệu SP/Dịch vụ","Admin quản lý bài viết","Form thu thập dữ liệu KH","Quản lý tệp KH cơ bản","Tối ưu SEO On-page","Hỗ trợ chỉnh sửa sau bàn giao","Kết nối Mạng xã hội","Chat Widget tích hợp","Bản đồ Google Maps","Bảng điều khiển Admin","Phân quyền người dùng","Tài khoản Admin đa người","SEO On-page cơ bản","XML Sitemap tự động","Google Analytics 4","Google Search Console","Schema Markup (JSON-LD)","Tối ưu tốc độ (Speed)","Backup hàng ngày","Danh mục & Chi tiết sản phẩm","Chức năng Giỏ hàng thông minh","Thanh toán trực tuyến","Thống kê đơn hàng & Doanh thu","Tài khoản Admin & Khách hàng","Đánh giá & Review sản phẩm"],
  "doanh-nghiep": ["Thiết kế Responsive","Giao diện Hiện đại","Hiệu ứng Animation","Tối ưu UI/UX","Dark Mode","Đa ngôn ngữ","File Figma gốc","Trang giới thiệu SP/Dịch vụ","Admin quản lý bài viết","Form thu thập dữ liệu KH","Quản lý tệp KH cơ bản","Tối ưu SEO On-page","Hỗ trợ chỉnh sửa sau bàn giao","Kết nối Mạng xã hội","Chat Widget tích hợp","Bản đồ Google Maps","Bảng điều khiển Admin","Phân quyền người dùng","Tài khoản Admin đa người","Nhật ký hoạt động","Quản lý Kho hàng","Quản lý Nhà cung cấp","SEO On-page cơ bản","XML Sitemap tự động","Google Analytics 4","Google Search Console","Schema Markup (JSON-LD)","Tối ưu tốc độ (Speed)","SEO nâng cao","Email Marketing","Mã giảm giá / Flash Sale","Bộ lọc & Tìm kiếm AI","Backup hàng ngày","Rate Limiting & Throttling","Danh mục & Chi tiết sản phẩm","Chức năng Giỏ hàng thông minh","Thanh toán trực tuyến","Thống kê đơn hàng & Doanh thu","Tài khoản Admin & Khách hàng","Sản phẩm nâng cao","Tích điểm & Đổi quà thành viên","Giỏ hàng đa dịch vụ/sản phẩm","Đánh giá & Review sản phẩm","Tích hợp Vận chuyển"],
  "yeu-cau": ["Thiết kế Responsive","Giao diện Hiện đại","Hiệu ứng Animation","Tối ưu UI/UX","UI/UX Độc quyền","Dark Mode","Đa ngôn ngữ","File Figma gốc","Trang giới thiệu SP/Dịch vụ","Admin quản lý bài viết","Form thu thập dữ liệu KH","Quản lý tệp KH cơ bản","Tối ưu SEO On-page","Hỗ trợ chỉnh sửa sau bàn giao","Kết nối Mạng xã hội","Chat Widget tích hợp","Bản đồ Google Maps","API kết nối Zalo","API kết nối bên thứ 3","Tích hợp Cổng thanh toán","Tùy chỉnh Core System","Bảng điều khiển Admin","Phân quyền người dùng","Tài khoản Admin đa người","Nhật ký hoạt động","Quản lý Kho hàng","Quản lý Nhà cung cấp","SEO On-page cơ bản","XML Sitemap tự động","Google Analytics 4","Google Search Console","Schema Markup (JSON-LD)","Tối ưu tốc độ (Speed)","SEO nâng cao","Email Marketing","Mã giảm giá / Flash Sale","Bộ lọc & Tìm kiếm AI","Danh mục & Chi tiết sản phẩm","Chức năng Giỏ hàng thông minh","Thanh toán trực tuyến","Thống kê đơn hàng & Doanh thu","Tài khoản Admin & Khách hàng","Sản phẩm nâng cao","Tích điểm & Đổi quà thành viên","Giỏ hàng đa dịch vụ/sản phẩm","Đánh giá & Review sản phẩm","Tích hợp Vận chuyển","AI Chatbot tích hợp","Marketing Automation","Tích hợp CRM","Thông báo Real-time","Multi-tenant SaaS","Tích hợp Mobile App","Advanced Analytics Dashboard","Chứng chỉ SSL","WAF & DDoS Protection","Xác thực 2 lớp (2FA)","Tuân thủ GDPR","Backup hàng ngày","Rate Limiting & Throttling","Kiểm thử Bảo mật","Mã hóa dữ liệu"],
};

async function main() {
  console.log("🌱 Seeding FeatureGroup + Feature...");

  let totalGroups = 0;
  let totalFeatures = 0;
  const nameToId: Record<string, string> = {};

  for (const group of FEATURE_GROUPS) {
    const [created] = await Promise.all([
      prisma.featureGroup.upsert({
        where: { slug: group.slug },
        update: { groupName: group.groupName, sortOrder: group.sortOrder },
        create: { slug: group.slug, groupName: group.groupName, serviceKey: group.serviceKey, sortOrder: group.sortOrder, isActive: true },
      }),
    ]);
    totalGroups++;

    for (const featName of group.features) {
      const [f] = await Promise.all([
        prisma.feature.upsert({
          where: { groupId_featureName: { groupId: created.id, featureName: featName } },
          update: {},
          create: {
            groupId: created.id, featureName: featName,
            category: group.groupName, sortOrder: 0, extraPrice: 0,
            includedTiers: [], isActive: true,
          },
        }),
      ]);
      nameToId[featName] = f.id;
      totalFeatures++;
    }
  }

  // Sync ServicePackage.features với Feature IDs
  const packages = await prisma.servicePackage.findMany({
    where: { type: "website" },
    select: { id: true, slug: true },
  });

  for (const sp of packages) {
    const names = PKG_FEATURES[sp.slug] ?? [];
    const ids = names.map(n => nameToId[n]).filter(Boolean);
    await prisma.servicePackage.update({
      where: { id: sp.id },
      data: { features: ids },
    });
  }

  console.log(`✅ ${totalGroups} nhóm, ${totalFeatures} tính năng, ${packages.length} gói đã sync.`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
