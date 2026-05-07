/**
 * Seed FeatureGroup + Feature for serviceKey="web"
 * Run: npx tsx prisma/seed-web-features.ts
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) { console.error("❌ DATABASE_URL not found"); process.exit(1); }
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

const FEATURE_GROUPS = [
  {
    slug: "giao-dien", groupName: "Giao diện", serviceKey: "web", sortOrder: 1,
    features: [
      { featureName: "Thiết kế Responsive", description: "Tương thích mọi thiết bị", sortOrder: 1, category: "Giao diện", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "Giao diện Hiện đại", description: "Thiết kế theo xu hướng UI/UX mới nhất", sortOrder: 2, category: "Giao diện", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "Hiệu ứng Animation", description: "Micro-interactions, hover effects, page transitions", sortOrder: 3, category: "Giao diện", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "Tối ưu UI/UX", description: "Trải nghiệm người dùng được tối ưu hóa", sortOrder: 4, category: "Giao diện", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "UI/UX Độc quyền", description: "Thiết kế riêng không dùng template", sortOrder: 5, category: "Giao diện", extraPrice: 2000000, includedTiers: [4] },
      { featureName: "Dark Mode", description: "Chế độ giao diện tối", sortOrder: 6, category: "Giao diện", extraPrice: 500000, includedTiers: [2,3,4] },
      { featureName: "Đa ngôn ngữ", description: "Hỗ trợ nhiều ngôn ngữ (VN, EN, JA, KO, ZH)", sortOrder: 7, category: "Giao diện", extraPrice: 1000000, includedTiers: [3,4] },
      { featureName: "File Figma gốc", description: "Bàn giao file thiết kế Figma source", sortOrder: 8, category: "Giao diện", extraPrice: 0, includedTiers: [2,3,4] },
    ],
  },
  {
    slug: "tinh-nang-cot-loi", groupName: "Tính năng cốt lõi", serviceKey: "web", sortOrder: 2,
    features: [
      { featureName: "Trang giới thiệu SP/Dịch vụ", description: "Trang giới thiệu sản phẩm", sortOrder: 1, category: "Tính năng cốt lõi", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "Admin quản lý bài viết", description: "CMS quản lý nội dung", sortOrder: 2, category: "Tính năng cốt lõi", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "Form thu thập dữ liệu KH", description: "Form đăng ký, liên hệ", sortOrder: 3, category: "Tính năng cốt lõi", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "Quản lý tệp KH cơ bản", description: "Lưu trữ file tài liệu KH", sortOrder: 4, category: "Tính năng cốt lõi", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "Tối ưu SEO On-page", description: "HTML chuẩn SEO, meta tags", sortOrder: 5, category: "Tính năng cốt lõi", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "Hỗ trợ chỉnh sửa sau bàn giao", description: "Hỗ trợ chỉnh sửa nhỏ", sortOrder: 6, category: "Tính năng cốt lõi", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "Kết nối Mạng xã hội", description: "Nút chia sẻ social media", sortOrder: 7, category: "Tính năng cốt lõi", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "Chat Widget tích hợp", description: "Zalo OA, Facebook Messenger", sortOrder: 8, category: "Tính năng cốt lõi", extraPrice: 300000, includedTiers: [1,2,3,4] },
      { featureName: "Bản đồ Google Maps", description: "Nhúng bản đồ địa chỉ công ty", sortOrder: 9, category: "Tính năng cốt lõi", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "API kết nối Zalo", description: "Tích hợp OA Zalo", sortOrder: 10, category: "Tính năng cốt lõi", extraPrice: 1500000, includedTiers: [4] },
      { featureName: "API kết nối bên thứ 3", description: "REST/GraphQL API bên ngoài", sortOrder: 11, category: "Tính năng cốt lõi", extraPrice: 2000000, includedTiers: [4] },
      { featureName: "Tích hợp Cổng thanh toán", description: "VNPay, MoMo, ZaloPay, Stripe", sortOrder: 12, category: "Tính năng cốt lõi", extraPrice: 2500000, includedTiers: [4] },
      { featureName: "Tùy chỉnh Core System", description: "Logic nghiệp vụ đặc thù", sortOrder: 13, category: "Tính năng cốt lõi", extraPrice: 3000000, includedTiers: [4] },
    ],
  },
  {
    slug: "quan-tri", groupName: "Quản trị", serviceKey: "web", sortOrder: 3,
    features: [
      { featureName: "Bảng điều khiển Admin", description: "Dashboard quản trị", sortOrder: 1, category: "Quản trị", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "Phân quyền người dùng", description: "RBAC: admin, manager, staff", sortOrder: 2, category: "Quản trị", extraPrice: 0, includedTiers: [2,3,4] },
      { featureName: "Tài khoản Admin đa người", description: "Nhiều tài khoản quản trị", sortOrder: 3, category: "Quản trị", extraPrice: 0, includedTiers: [2,3,4] },
      { featureName: "Nhật ký hoạt động", description: "Audit log toàn bộ thao tác", sortOrder: 4, category: "Quản trị", extraPrice: 500000, includedTiers: [3,4] },
      { featureName: "Quản lý Kho hàng", description: "Tồn kho, nhập/xuất kho", sortOrder: 5, category: "Quản trị", extraPrice: 1500000, includedTiers: [3,4] },
      { featureName: "Quản lý Nhà cung cấp", description: "Danh sách nhà cung cấp", sortOrder: 6, category: "Quản trị", extraPrice: 800000, includedTiers: [3,4] },
    ],
  },
  {
    slug: "seo-marketing", groupName: "SEO & Marketing", serviceKey: "web", sortOrder: 4,
    features: [
      { featureName: "SEO On-page cơ bản", description: "Meta title, description, Open Graph", sortOrder: 1, category: "SEO & Marketing", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "XML Sitemap tự động", description: "Sitemap.xml cập nhật tự động", sortOrder: 2, category: "SEO & Marketing", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "Google Analytics 4", description: "GA4 với dashboard phân tích", sortOrder: 3, category: "SEO & Marketing", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "Google Search Console", description: "Theo dõi ranking và indexing", sortOrder: 4, category: "SEO & Marketing", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "Schema Markup (JSON-LD)", description: "Structured data", sortOrder: 5, category: "SEO & Marketing", extraPrice: 0, includedTiers: [2,3,4] },
      { featureName: "Tối ưu tốc độ (Speed)", description: "Core Web Vitals 90+, CDN", sortOrder: 6, category: "SEO & Marketing", extraPrice: 0, includedTiers: [2,3,4] },
      { featureName: "SEO nâng cao", description: "Internal linking, content clustering", sortOrder: 7, category: "SEO & Marketing", extraPrice: 2000000, includedTiers: [3,4] },
      { featureName: "Email Marketing", description: "Mailchimp, SendGrid", sortOrder: 8, category: "SEO & Marketing", extraPrice: 1000000, includedTiers: [3,4] },
      { featureName: "Mã giảm giá / Flash Sale", description: "Voucher, khuyến mãi", sortOrder: 9, category: "SEO & Marketing", extraPrice: 800000, includedTiers: [3,4] },
      { featureName: "Bộ lọc & Tìm kiếm AI", description: "Tìm kiếm thông minh AI", sortOrder: 10, category: "SEO & Marketing", extraPrice: 1500000, includedTiers: [3,4] },
    ],
  },
  {
    slug: "thuong-mai", groupName: "Thương mại", serviceKey: "web", sortOrder: 5,
    features: [
      { featureName: "Danh mục & Chi tiết sản phẩm", description: "Trang danh mục + chi tiết SP", sortOrder: 1, category: "Thương mại", extraPrice: 0, includedTiers: [2,3,4] },
      { featureName: "Chức năng Giỏ hàng thông minh", description: "Giỏ hàng, wishlist, so sánh", sortOrder: 2, category: "Thương mại", extraPrice: 0, includedTiers: [2,3,4] },
      { featureName: "Thanh toán trực tuyến", description: "VNPay, MoMo, ZaloPay", sortOrder: 3, category: "Thương mại", extraPrice: 0, includedTiers: [2,3,4] },
      { featureName: "Thống kê đơn hàng & Doanh thu", description: "Dashboard đơn hàng, doanh thu", sortOrder: 4, category: "Thương mại", extraPrice: 0, includedTiers: [2,3,4] },
      { featureName: "Tài khoản Admin & Khách hàng", description: "Đăng nhập, đăng ký KH", sortOrder: 5, category: "Thương mại", extraPrice: 0, includedTiers: [2,3,4] },
      { featureName: "Sản phẩm nâng cao", description: "Biến thể: size, màu, thuộc tính", sortOrder: 6, category: "Thương mại", extraPrice: 1000000, includedTiers: [3,4] },
      { featureName: "Tích điểm & Đổi quà thành viên", description: "Loyalty: tích điểm, VIP", sortOrder: 7, category: "Thương mại", extraPrice: 1500000, includedTiers: [3,4] },
      { featureName: "Giỏ hàng đa dịch vụ/sản phẩm", description: "Nhiều loại sản phẩm", sortOrder: 8, category: "Thương mại", extraPrice: 800000, includedTiers: [3,4] },
      { featureName: "Đánh giá & Review sản phẩm", description: "Đánh giá sao, bình luận", sortOrder: 9, category: "Thương mại", extraPrice: 500000, includedTiers: [2,3,4] },
      { featureName: "Tích hợp Vận chuyển", description: "GHN, GHTK, J&T", sortOrder: 10, category: "Thương mại", extraPrice: 1500000, includedTiers: [3,4] },
    ],
  },
  {
    slug: "nang-cao", groupName: "Nâng cao", serviceKey: "web", sortOrder: 6,
    features: [
      { featureName: "AI Chatbot tích hợp", description: "Chatbot AI 24/7", sortOrder: 1, category: "Nâng cao", extraPrice: 3000000, includedTiers: [3,4] },
      { featureName: "Marketing Automation", description: "Email sequence, drip campaign", sortOrder: 2, category: "Nâng cao", extraPrice: 2000000, includedTiers: [3,4] },
      { featureName: "Tích hợp CRM", description: "HubSpot, Zoho, Salesforce", sortOrder: 3, category: "Nâng cao", extraPrice: 2500000, includedTiers: [3,4] },
      { featureName: "Thông báo Real-time", description: "WebSocket/SSE notifications", sortOrder: 4, category: "Nâng cao", extraPrice: 1500000, includedTiers: [3,4] },
      { featureName: "Multi-tenant SaaS", description: "Multi-tenant architecture", sortOrder: 5, category: "Nâng cao", extraPrice: 8000000, includedTiers: [4] },
      { featureName: "Tích hợp Mobile App", description: "API cho React Native/Flutter", sortOrder: 6, category: "Nâng cao", extraPrice: 5000000, includedTiers: [4] },
      { featureName: "Advanced Analytics Dashboard", description: "Dashboard BI nâng cao", sortOrder: 7, category: "Nâng cao", extraPrice: 3000000, includedTiers: [3,4] },
    ],
  },
  {
    slug: "bao-mat", groupName: "Bảo mật", serviceKey: "web", sortOrder: 7,
    features: [
      { featureName: "Chứng chỉ SSL", description: "SSL miễn phí hoặc cao cấp", sortOrder: 1, category: "Bảo mật", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "WAF & DDoS Protection", description: "Web Application Firewall", sortOrder: 2, category: "Bảo mật", extraPrice: 1000000, includedTiers: [3,4] },
      { featureName: "Xác thực 2 lớp (2FA)", description: "Two-factor authentication", sortOrder: 3, category: "Bảo mật", extraPrice: 500000, includedTiers: [3,4] },
      { featureName: "Tuân thủ GDPR", description: "Cookie consent, privacy policy", sortOrder: 4, category: "Bảo mật", extraPrice: 1500000, includedTiers: [3,4] },
      { featureName: "Backup hàng ngày", description: "Auto backup, lưu trữ 30 ngày", sortOrder: 5, category: "Bảo mật", extraPrice: 0, includedTiers: [2,3,4] },
      { featureName: "Rate Limiting & Throttling", description: "Chống spam, brute-force", sortOrder: 6, category: "Bảo mật", extraPrice: 0, includedTiers: [3,4] },
      { featureName: "Kiểm thử Bảo mật", description: "Penetration testing", sortOrder: 7, category: "Bảo mật", extraPrice: 3000000, includedTiers: [4] },
      { featureName: "Mã hóa dữ liệu", description: "Encryption AES-256", sortOrder: 8, category: "Bảo mật", extraPrice: 2000000, includedTiers: [4] },
    ],
  },
];

async function main() {
  console.log("\n[WebFeatures] Seeding FeatureGroup + Feature (serviceKey=web)...");
  let totalGroups = 0, totalFeatures = 0;
  const nameToId: Record<string, string> = {};

  for (const group of FEATURE_GROUPS) {
    const created = await prisma.featureGroup.upsert({
      where: { slug: group.slug },
      update: { groupName: group.groupName, serviceKey: group.serviceKey, sortOrder: group.sortOrder },
      create: { slug: group.slug, groupName: group.groupName, serviceKey: group.serviceKey, sortOrder: group.sortOrder, isActive: true },
    });
    totalGroups++;

    for (const f of group.features) {
      const feat = await prisma.feature.upsert({
        where: { groupId_featureName: { groupId: created.id, featureName: f.featureName } },
        update: { description: f.description, category: f.category, sortOrder: f.sortOrder, extraPrice: f.extraPrice, includedTiers: f.includedTiers },
        create: { groupId: created.id, featureName: f.featureName, description: f.description, category: f.category, sortOrder: f.sortOrder, extraPrice: f.extraPrice, includedTiers: f.includedTiers, isActive: true },
      });
      nameToId[f.featureName] = feat.id;
      totalFeatures++;
    }
  }
  console.log(`  ✓ ${totalGroups} groups, ${totalFeatures} features upserted`);

  // Sync ServicePackage.features with Feature IDs
  const PKG_FEATURES: Record<string, string[]> = {
    landing: ["Thiết kế Responsive","Giao diện Hiện đại","Hiệu ứng Animation","Tối ưu UI/UX","Trang giới thiệu SP/Dịch vụ","Admin quản lý bài viết","Form thu thập dữ liệu KH","Quản lý tệp KH cơ bản","Tối ưu SEO On-page","Hỗ trợ chỉnh sửa sau bàn giao","Bảng điều khiển Admin","SEO On-page cơ bản","XML Sitemap tự động","Google Analytics 4","Google Search Console","Chứng chỉ SSL","Kết nối Mạng xã hội","Chat Widget tích hợp","Bản đồ Google Maps"],
    "ban-hang": ["Thiết kế Responsive","Giao diện Hiện đại","Hiệu ứng Animation","Tối ưu UI/UX","Dark Mode","File Figma gốc","Trang giới thiệu SP/Dịch vụ","Admin quản lý bài viết","Form thu thập dữ liệu KH","Quản lý tệp KH cơ bản","Tối ưu SEO On-page","Hỗ trợ chỉnh sửa sau bàn giao","Kết nối Mạng xã hội","Chat Widget tích hợp","Bản đồ Google Maps","Bảng điều khiển Admin","Phân quyền người dùng","Tài khoản Admin đa người","SEO On-page cơ bản","XML Sitemap tự động","Google Analytics 4","Google Search Console","Schema Markup (JSON-LD)","Tối ưu tốc độ (Speed)","Backup hàng ngày","Danh mục & Chi tiết sản phẩm","Chức năng Giỏ hàng thông minh","Thanh toán trực tuyến","Thống kê đơn hàng & Doanh thu","Tài khoản Admin & Khách hàng","Đánh giá & Review sản phẩm"],
    "doanh-nghiep": ["Thiết kế Responsive","Giao diện Hiện đại","Hiệu ứng Animation","Tối ưu UI/UX","Dark Mode","Đa ngôn ngữ","File Figma gốc","Trang giới thiệu SP/Dịch vụ","Admin quản lý bài viết","Form thu thập dữ liệu KH","Quản lý tệp KH cơ bản","Tối ưu SEO On-page","Hỗ trợ chỉnh sửa sau bàn giao","Kết nối Mạng xã hội","Chat Widget tích hợp","Bản đồ Google Maps","Bảng điều khiển Admin","Phân quyền người dùng","Tài khoản Admin đa người","Nhật ký hoạt động","Quản lý Kho hàng","Quản lý Nhà cung cấp","SEO On-page cơ bản","XML Sitemap tự động","Google Analytics 4","Google Search Console","Schema Markup (JSON-LD)","Tối ưu tốc độ (Speed)","SEO nâng cao","Email Marketing","Mã giảm giá / Flash Sale","Bộ lọc & Tìm kiếm AI","Backup hàng ngày","Rate Limiting & Throttling","Danh mục & Chi tiết sản phẩm","Chức năng Giỏ hàng thông minh","Thanh toán trực tuyến","Thống kê đơn hàng & Doanh thu","Tài khoản Admin & Khách hàng","Sản phẩm nâng cao","Tích điểm & Đổi quà thành viên","Giỏ hàng đa dịch vụ/sản phẩm","Đánh giá & Review sản phẩm"],
    "yeu-cau": ["Thiết kế Responsive","Giao diện Hiện đại","Hiệu ứng Animation","Tối ưu UI/UX","UI/UX Độc quyền","Dark Mode","Đa ngôn ngữ","File Figma gốc","Trang giới thiệu SP/Dịch vụ","Admin quản lý bài viết","Form thu thập dữ liệu KH","Quản lý tệp KH cơ bản","Tối ưu SEO On-page","Hỗ trợ chỉnh sửa sau bàn giao","Kết nối Mạng xã hội","Chat Widget tích hợp","Bản đồ Google Maps","API kết nối Zalo","API kết nối bên thứ 3","Tích hợp Cổng thanh toán","Tùy chỉnh Core System","Bảng điều khiển Admin","Phân quyền người dùng","Tài khoản Admin đa người","Nhật ký hoạt động","Quản lý Kho hàng","Quản lý Nhà cung cấp","SEO On-page cơ bản","XML Sitemap tự động","Google Analytics 4","Google Search Console","Schema Markup (JSON-LD)","Tối ưu tốc độ (Speed)","SEO nâng cao","Email Marketing","Mã giảm giá / Flash Sale","Bộ lọc & Tìm kiếm AI","Danh mục & Chi tiết sản phẩm","Chức năng Giỏ hàng thông minh","Thanh toán trực tuyến","Thống kê đơn hàng & Doanh thu","Tài khoản Admin & Khách hàng","Sản phẩm nâng cao","Tích điểm & Đổi quà thành viên","Giỏ hàng đa dịch vụ/sản phẩm","Đánh giá & Review sản phẩm","Tích hợp Vận chuyển","AI Chatbot tích hợp","Marketing Automation","Tích hợp CRM","Thông báo Real-time","Multi-tenant SaaS","Tích hợp Mobile App","Advanced Analytics Dashboard","Chứng chỉ SSL","WAF & DDoS Protection","Xác thực 2 lớp (2FA)","Tuân thủ GDPR","Backup hàng ngày","Rate Limiting & Throttling","Kiểm thử Bảo mật","Mã hóa dữ liệu"],
  };

  const packages = await prisma.servicePackage.findMany({ where: { type: "website" }, select: { id: true, slug: true } });
  for (const sp of packages) {
    const names = PKG_FEATURES[sp.slug] ?? [];
    const ids = names.map(n => nameToId[n]).filter(Boolean);
    if (ids.length > 0) {
      await prisma.servicePackage.update({ where: { id: sp.id }, data: { features: ids } });
      console.log(`  ✓ ${sp.slug}: ${ids.length} features synced`);
    }
  }

  console.log("✅ Web Features Seed Done!");
  await prisma.$disconnect();
}

main().catch(e => { console.error("❌", e); process.exit(1); });
