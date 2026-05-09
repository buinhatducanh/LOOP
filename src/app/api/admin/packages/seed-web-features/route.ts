/**
 * POST /api/admin/packages/seed-web-features
 *
 * Seed/update FeatureGroup + Feature, sau đó sync ServicePackage.features bằng ID.
 * Idempotent: upsert FeatureGroup/Feature, luôn sync ServicePackage sau đó.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { handleError } from "@/lib/api/response";

// ── Seed data ───────────────────────────────────────────────────────────────
const FEATURE_GROUPS = [
  {
    slug: "giao-dien", groupName: "Giao diện", serviceKey: "web", sortOrder: 1,
    features: [
      { featureName: "Thiết kế Responsive", description: "Tương thích mọi thiết bị: desktop, tablet, mobile", sortOrder: 1, category: "Giao diện", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "Giao diện Hiện đại", description: "Thiết kế theo xu hướng UI/UX mới nhất 2026", sortOrder: 2, category: "Giao diện", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "Hiệu ứng Animation", description: "Micro-interactions, hover effects, page transitions mượt mà", sortOrder: 3, category: "Giao diện", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "Tối ưu UI/UX", description: "Trải nghiệm người dùng được nghiên cứu và tối ưu hóa", sortOrder: 4, category: "Giao diện", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "UI/UX Độc quyền", description: "Thiết kế riêng không dùng template có sẵn", sortOrder: 5, category: "Giao diện", extraPrice: 2000000, includedTiers: [4] },
      { featureName: "Dark Mode", description: "Chế độ giao diện tối cho website", sortOrder: 6, category: "Giao diện", extraPrice: 500000, includedTiers: [2,3,4] },
      { featureName: "Đa ngôn ngữ", description: "Hỗ trợ nhiều ngôn ngữ (VN, EN, JA, KO, ZH)", sortOrder: 7, category: "Giao diện", extraPrice: 1000000, includedTiers: [3,4] },
      { featureName: "File Figma gốc", description: "Bàn giao file thiết kế Figma source đầy đủ", sortOrder: 8, category: "Giao diện", extraPrice: 0, includedTiers: [2,3,4] },
    ],
  },
  {
    slug: "tinh-nang-cot-loi", groupName: "Tính năng cốt lõi", serviceKey: "web", sortOrder: 2,
    features: [
      { featureName: "Trang giới thiệu SP/Dịch vụ", description: "Trang giới thiệu sản phẩm và dịch vụ công ty", sortOrder: 1, category: "Tính năng cốt lõi", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "Admin quản lý bài viết", description: "Bảng điều khiển CMS để quản lý nội dung", sortOrder: 2, category: "Tính năng cốt lõi", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "Form thu thập dữ liệu KH", description: "Form đăng ký, liên hệ, khảo sát thu thập khách hàng", sortOrder: 3, category: "Tính năng cốt lõi", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "Quản lý tệp KH cơ bản", description: "Lưu trữ và quản lý file tài liệu khách hàng", sortOrder: 4, category: "Tính năng cốt lõi", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "Tối ưu SEO On-page", description: "Cấu trúc HTML chuẩn SEO, meta tags, heading hierarchy", sortOrder: 5, category: "Tính năng cốt lõi", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "Hỗ trợ chỉnh sửa sau bàn giao", description: "Bàn giao code + hỗ trợ chỉnh sửa nhỏ sau khi bàn giao", sortOrder: 6, category: "Tính năng cốt lõi", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "Kết nối Mạng xã hội", description: "Tích hợp nút chia sẻ và link social media", sortOrder: 7, category: "Tính năng cốt lõi", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "Chat Widget tích hợp", description: "Ô chat hỗ trợ khách hàng (Zalo OA, Facebook Messenger)", sortOrder: 8, category: "Tính năng cốt lõi", extraPrice: 300000, includedTiers: [1,2,3,4] },
      { featureName: "Bản đồ Google Maps", description: "Nhúng bản đồ địa chỉ công ty lên website", sortOrder: 9, category: "Tính năng cốt lõi", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "API kết nối Zalo", description: "Tích hợp OA Zalo: đăng nhập, chat, notify", sortOrder: 10, category: "Tính năng cốt lõi", extraPrice: 1500000, includedTiers: [4] },
      { featureName: "API kết nối bên thứ 3", description: "Kết nối REST/GraphQL API với hệ thống bên ngoài", sortOrder: 11, category: "Tính năng cốt lõi", extraPrice: 2000000, includedTiers: [4] },
      { featureName: "Tích hợp Cổng thanh toán", description: "Kết nối VNPay, MoMo, ZaloPay, Stripe", sortOrder: 12, category: "Tính năng cốt lõi", extraPrice: 2500000, includedTiers: [4] },
      { featureName: "Tùy chỉnh Core System", description: "Xây dựng logic nghiệp vụ đặc thù riêng", sortOrder: 13, category: "Tính năng cốt lõi", extraPrice: 3000000, includedTiers: [4] },
    ],
  },
  {
    slug: "quan-tri", groupName: "Quản trị", serviceKey: "web", sortOrder: 3,
    features: [
      { featureName: "Bảng điều khiển Admin", description: "Dashboard quản trị với thống kê và biểu đồ", sortOrder: 1, category: "Quản trị", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "Phân quyền người dùng", description: "Hệ thống RBAC: admin, manager, staff, customer", sortOrder: 2, category: "Quản trị", extraPrice: 0, includedTiers: [2,3,4] },
      { featureName: "Tài khoản Admin đa người", description: "Nhiều tài khoản quản trị với vai trò khác nhau", sortOrder: 3, category: "Quản trị", extraPrice: 0, includedTiers: [2,3,4] },
      { featureName: "Nhật ký hoạt động", description: "Audit log toàn bộ thao tác trên hệ thống", sortOrder: 4, category: "Quản trị", extraPrice: 500000, includedTiers: [3,4] },
      { featureName: "Quản lý Kho hàng", description: "Theo dõi tồn kho, nhập/xuất kho, cảnh báo hết hàng", sortOrder: 5, category: "Quản trị", extraPrice: 1500000, includedTiers: [3,4] },
      { featureName: "Quản lý Nhà cung cấp", description: "Danh sách và thông tin nhà cung cấp", sortOrder: 6, category: "Quản trị", extraPrice: 800000, includedTiers: [3,4] },
    ],
  },
  {
    slug: "seo-marketing", groupName: "SEO & Marketing", serviceKey: "web", sortOrder: 4,
    features: [
      { featureName: "SEO On-page cơ bản", description: "Meta title, description, Open Graph, structured data", sortOrder: 1, category: "SEO & Marketing", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "XML Sitemap tự động", description: "Sitemap.xml cập nhật tự động khi có nội dung mới", sortOrder: 2, category: "SEO & Marketing", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "Google Analytics 4", description: "Tích hợp GA4 với dashboard phân tích hành vi", sortOrder: 3, category: "SEO & Marketing", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "Google Search Console", description: "Kết nối GSC, theo dõi ranking và indexing", sortOrder: 4, category: "SEO & Marketing", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "Schema Markup (JSON-LD)", description: "Structured data: Organization, Product, FAQ, Review...", sortOrder: 5, category: "SEO & Marketing", extraPrice: 0, includedTiers: [2,3,4] },
      { featureName: "Tối ưu tốc độ (Speed)", description: "Core Web Vitals đạt 90+, lazy load, CDN, minify", sortOrder: 6, category: "SEO & Marketing", extraPrice: 0, includedTiers: [2,3,4] },
      { featureName: "SEO nâng cao", description: "Internal linking strategy, content clustering, schema strategy", sortOrder: 7, category: "SEO & Marketing", extraPrice: 2000000, includedTiers: [3,4] },
      { featureName: "Email Marketing", description: "Tích hợp email marketing: Mailchimp, SendGrid", sortOrder: 8, category: "SEO & Marketing", extraPrice: 1000000, includedTiers: [3,4] },
      { featureName: "Mã giảm giá / Flash Sale", description: "Hệ thống voucher, mã giảm giá, khuyến mãi theo thời gian", sortOrder: 9, category: "SEO & Marketing", extraPrice: 800000, includedTiers: [3,4] },
      { featureName: "Bộ lọc & Tìm kiếm AI", description: "Tìm kiếm thông minh với gợi ý AI và bộ lọc nâng cao", sortOrder: 10, category: "SEO & Marketing", extraPrice: 1500000, includedTiers: [3,4] },
    ],
  },
  {
    slug: "thuong-mai", groupName: "Thương mại", serviceKey: "web", sortOrder: 5,
    features: [
      { featureName: "Danh mục & Chi tiết sản phẩm", description: "Trang danh mục + chi tiết sản phẩm với gallery, thông số", sortOrder: 1, category: "Thương mại", extraPrice: 0, includedTiers: [2,3,4] },
      { featureName: "Chức năng Giỏ hàng thông minh", description: "Giỏ hàng với wishlist, so sánh sản phẩm, tính phí vận chuyển", sortOrder: 2, category: "Thương mại", extraPrice: 0, includedTiers: [2,3,4] },
      { featureName: "Thanh toán trực tuyến", description: "Tích hợp VNPay, MoMo, ZaloPay, chuyển khoản", sortOrder: 3, category: "Thương mại", extraPrice: 0, includedTiers: [2,3,4] },
      { featureName: "Thống kê đơn hàng & Doanh thu", description: "Dashboard theo dõi đơn hàng, doanh thu, lợi nhuận", sortOrder: 4, category: "Thương mại", extraPrice: 0, includedTiers: [2,3,4] },
      { featureName: "Tài khoản Admin & Khách hàng", description: "Đăng nhập, đăng ký, quản lý tài khoản KH", sortOrder: 5, category: "Thương mại", extraPrice: 0, includedTiers: [2,3,4] },
      { featureName: "Sản phẩm nâng cao", description: "Biến thể: size, màu sắc, thuộc tính đa chiều", sortOrder: 6, category: "Thương mại", extraPrice: 1000000, includedTiers: [3,4] },
      { featureName: "Tích điểm & Đổi quà thành viên", description: "Hệ thống loyalty: tích điểm, cấp độ VIP, đổi quà", sortOrder: 7, category: "Thương mại", extraPrice: 1500000, includedTiers: [3,4] },
      { featureName: "Giỏ hàng đa dịch vụ/sản phẩm", description: "Hỗ trợ nhiều loại sản phẩm: vật lý, dịch vụ, subscription", sortOrder: 8, category: "Thương mại", extraPrice: 800000, includedTiers: [3,4] },
      { featureName: "Đánh giá & Review sản phẩm", description: "Hệ thống đánh giá sao, bình luận, hình ảnh thực tế", sortOrder: 9, category: "Thương mại", extraPrice: 500000, includedTiers: [2,3,4] },
      { featureName: "Tích hợp Vận chuyển", description: "Kết nối GHN, GHTK, J&T: tính phí, theo dõi đơn", sortOrder: 10, category: "Thương mại", extraPrice: 1500000, includedTiers: [3,4] },
    ],
  },
  {
    slug: "nang-cao", groupName: "Nâng cao", serviceKey: "web", sortOrder: 6,
    features: [
      { featureName: "AI Chatbot tích hợp", description: "Chatbot AI trả lời tự động 24/7", sortOrder: 1, category: "Nâng cao", extraPrice: 3000000, includedTiers: [3,4] },
      { featureName: "Marketing Automation", description: "Email sequence, notification, drip campaign tự động", sortOrder: 2, category: "Nâng cao", extraPrice: 2000000, includedTiers: [3,4] },
      { featureName: "Tích hợp CRM", description: "Kết nối CRM: HubSpot, Zoho, Salesforce, Pipedrive", sortOrder: 3, category: "Nâng cao", extraPrice: 2500000, includedTiers: [3,4] },
      { featureName: "Thông báo Real-time", description: "WebSocket/SSE: notification, chat, live update", sortOrder: 4, category: "Nâng cao", extraPrice: 1500000, includedTiers: [3,4] },
      { featureName: "Multi-tenant SaaS", description: "Hệ thống multi-tenant: nhiều khách hàng trên 1 codebase", sortOrder: 5, category: "Nâng cao", extraPrice: 8000000, includedTiers: [4] },
      { featureName: "Tích hợp Mobile App", description: "API cho React Native / Flutter app", sortOrder: 6, category: "Nâng cao", extraPrice: 5000000, includedTiers: [4] },
      { featureName: "Advanced Analytics Dashboard", description: "Dashboard BI với Power BI / Metabase / Looker", sortOrder: 7, category: "Nâng cao", extraPrice: 3000000, includedTiers: [3,4] },
    ],
  },
  {
    slug: "bao-mat", groupName: "Bảo mật", serviceKey: "web", sortOrder: 7,
    features: [
      { featureName: "Chứng chỉ SSL", description: "SSL miễn phí (Let's Encrypt) hoặc SSL cao cấp", sortOrder: 1, category: "Bảo mật", extraPrice: 0, includedTiers: [1,2,3,4] },
      { featureName: "WAF & DDoS Protection", description: "Web Application Firewall bảo vệ khỏi tấn công", sortOrder: 2, category: "Bảo mật", extraPrice: 1000000, includedTiers: [3,4] },
      { featureName: "Xác thực 2 lớp (2FA)", description: "Two-factor authentication cho tài khoản admin", sortOrder: 3, category: "Bảo mật", extraPrice: 500000, includedTiers: [3,4] },
      { featureName: "Tuân thủ GDPR", description: "Cookie consent, privacy policy, data export, right to erasure", sortOrder: 4, category: "Bảo mật", extraPrice: 1500000, includedTiers: [3,4] },
      { featureName: "Backup hàng ngày", description: "Auto backup database + file hàng ngày, lưu trữ 30 ngày", sortOrder: 5, category: "Bảo mật", extraPrice: 0, includedTiers: [2,3,4] },
      { featureName: "Rate Limiting & Throttling", description: "Chống spam, brute-force, API abuse", sortOrder: 6, category: "Bảo mật", extraPrice: 0, includedTiers: [3,4] },
      { featureName: "Kiểm thử Bảo mật", description: "Penetration testing và báo cáo bảo mật", sortOrder: 7, category: "Bảo mật", extraPrice: 3000000, includedTiers: [4] },
      { featureName: "Mã hóa dữ liệu", description: "Encryption at rest + in transit, AES-256", sortOrder: 8, category: "Bảo mật", extraPrice: 2000000, includedTiers: [4] },
    ],
  },
];

// Feature names per package (landing page = tier 1, ban-hang = tier 2, doanh-nghiep = tier 3, yeu-cau = tier 4)
const PKG_FEATURES: Record<string, string[]> = {
  landing: [
    "Thiết kế Responsive","Giao diện Hiện đại","Hiệu ứng Animation","Tối ưu UI/UX",
    "Trang giới thiệu SP/Dịch vụ","Admin quản lý bài viết","Form thu thập dữ liệu KH",
    "Quản lý tệp KH cơ bản","Tối ưu SEO On-page","Hỗ trợ chỉnh sửa sau bàn giao",
    "Bảng điều khiển Admin","SEO On-page cơ bản","XML Sitemap tự động",
    "Google Analytics 4","Google Search Console","Chứng chỉ SSL","Kết nối Mạng xã hội",
    "Chat Widget tích hợp","Bản đồ Google Maps",
  ],
  "ban-hang": [
    "Thiết kế Responsive","Giao diện Hiện đại","Hiệu ứng Animation","Tối ưu UI/UX",
    "Dark Mode","File Figma gốc",
    "Trang giới thiệu SP/Dịch vụ","Admin quản lý bài viết","Form thu thập dữ liệu KH",
    "Quản lý tệp KH cơ bản","Tối ưu SEO On-page","Hỗ trợ chỉnh sửa sau bàn giao",
    "Kết nối Mạng xã hội","Chat Widget tích hợp","Bản đồ Google Maps",
    "Bảng điều khiển Admin","Phân quyền người dùng","Tài khoản Admin đa người",
    "SEO On-page cơ bản","XML Sitemap tự động","Google Analytics 4",
    "Google Search Console","Schema Markup (JSON-LD)","Tối ưu tốc độ (Speed)",
    "Backup hàng ngày",
    "Danh mục & Chi tiết sản phẩm","Chức năng Giỏ hàng thông minh",
    "Thanh toán trực tuyến","Thống kê đơn hàng & Doanh thu",
    "Tài khoản Admin & Khách hàng","Đánh giá & Review sản phẩm",
    "Tặng 5 trang nội dung miễn phí",
  ],
  "doanh-nghiep": [
    "Thiết kế Responsive","Giao diện Hiện đại","Hiệu ứng Animation","Tối ưu UI/UX",
    "Dark Mode","Đa ngôn ngữ","File Figma gốc",
    "Trang giới thiệu SP/Dịch vụ","Admin quản lý bài viết","Form thu thập dữ liệu KH",
    "Quản lý tệp KH cơ bản","Tối ưu SEO On-page","Hỗ trợ chỉnh sửa sau bàn giao",
    "Kết nối Mạng xã hội","Chat Widget tích hợp","Bản đồ Google Maps",
    "Bảng điều khiển Admin","Phân quyền người dùng","Tài khoản Admin đa người",
    "Nhật ký hoạt động","Quản lý Kho hàng","Quản lý Nhà cung cấp",
    "SEO On-page cơ bản","XML Sitemap tự động","Google Analytics 4",
    "Google Search Console","Schema Markup (JSON-LD)","Tối ưu tốc độ (Speed)",
    "SEO nâng cao","Email Marketing","Mã giảm giá / Flash Sale",
    "Bộ lọc & Tìm kiếm AI","Backup hàng ngày","Rate Limiting & Throttling",
    "Danh mục & Chi tiết sản phẩm","Chức năng Giỏ hàng thông minh",
    "Thanh toán trực tuyến","Thống kê đơn hàng & Doanh thu",
    "Tài khoản Admin & Khách hàng","Sản phẩm nâng cao",
    "Tích điểm & Đổi quà thành viên","Giỏ hàng đa dịch vụ/sản phẩm",
    "Đánh giá & Review sản phẩm",
  ],
  "yeu-cau": [
    "Thiết kế Responsive","Giao diện Hiện đại","Hiệu ứng Animation","Tối ưu UI/UX",
    "UI/UX Độc quyền","Dark Mode","Đa ngôn ngữ","File Figma gốc",
    "Trang giới thiệu SP/Dịch vụ","Admin quản lý bài viết","Form thu thập dữ liệu KH",
    "Quản lý tệp KH cơ bản","Tối ưu SEO On-page","Hỗ trợ chỉnh sửa sau bàn giao",
    "Kết nối Mạng xã hội","Chat Widget tích hợp","Bản đồ Google Maps",
    "API kết nối Zalo","API kết nối bên thứ 3","Tích hợp Cổng thanh toán",
    "Tùy chỉnh Core System",
    "Bảng điều khiển Admin","Phân quyền người dùng","Tài khoản Admin đa người",
    "Nhật ký hoạt động","Quản lý Kho hàng","Quản lý Nhà cung cấp",
    "SEO On-page cơ bản","XML Sitemap tự động","Google Analytics 4",
    "Google Search Console","Schema Markup (JSON-LD)","Tối ưu tốc độ (Speed)",
    "SEO nâng cao","Email Marketing","Mã giảm giá / Flash Sale",
    "Bộ lọc & Tìm kiếm AI",
    "Danh mục & Chi tiết sản phẩm","Chức năng Giỏ hàng thông minh",
    "Thanh toán trực tuyến","Thống kê đơn hàng & Doanh thu",
    "Tài khoản Admin & Khách hàng","Sản phẩm nâng cao",
    "Tích điểm & Đổi quà thành viên","Giỏ hàng đa dịch vụ/sản phẩm",
    "Đánh giá & Review sản phẩm","Tích hợp Vận chuyển",
    "AI Chatbot tích hợp","Marketing Automation","Tích hợp CRM",
    "Thông báo Real-time","Multi-tenant SaaS","Tích hợp Mobile App",
    "Advanced Analytics Dashboard",
    "Chứng chỉ SSL","WAF & DDoS Protection","Xác thực 2 lớp (2FA)",
    "Tuân thủ GDPR","Backup hàng ngày","Rate Limiting & Throttling",
    "Kiểm thử Bảo mật","Mã hóa dữ liệu",
  ],
};

export async function POST() {
  try {
    await requirePermission("packages", "create");

    // ── Step 1: Upsert FeatureGroups + Features ──────────────────────────
    let totalGroups = 0;
    let totalFeatures = 0;
    const nameToId: Record<string, string> = {};

    for (const group of FEATURE_GROUPS) {
      const [created] = await Promise.all([
        prisma.featureGroup.upsert({
          where: { slug: group.slug },
          update: { groupName: group.groupName, serviceKey: group.serviceKey, sortOrder: group.sortOrder },
          create: {
            slug: group.slug, groupName: group.groupName,
            serviceKey: group.serviceKey, sortOrder: group.sortOrder, isActive: true,
          },
        }),
      ]);
      totalGroups++;

      for (const f of group.features) {
        const [created_feat] = await Promise.all([
          prisma.feature.upsert({
            where: { groupId_featureName: { groupId: created.id, featureName: f.featureName } },
            update: {
              description: f.description,
              category: f.category, sortOrder: f.sortOrder, extraPrice: f.extraPrice, includedTiers: f.includedTiers,
            },
            create: {
              groupId: created.id,
              featureName: f.featureName, description: f.description,
              category: f.category, sortOrder: f.sortOrder, extraPrice: f.extraPrice,
              includedTiers: f.includedTiers, isActive: true,
            },
          }),
        ]);
        nameToId[f.featureName] = created_feat.id;
        totalFeatures++;
      }
    }

    // ── Step 2: Sync ServicePackage.features với Feature IDs ────────────────
    const packages = await prisma.servicePackage.findMany({
      where: { type: "website" },
      select: { id: true, slug: true },
    });

    for (const sp of packages) {
      const names = PKG_FEATURES[sp.slug] ?? [];
      const ids = names.map((n: string) => nameToId[n]).filter(Boolean);
      await prisma.servicePackage.update({
        where: { id: sp.id },
        data: { features: ids },
      });
    }

    return NextResponse.json({
      message: `Đã seed ${totalGroups} nhóm, ${totalFeatures} tính năng, ${packages.length} gói web đã sync features.`,
      stats: { groups: totalGroups, features: totalFeatures, packages: packages.length },
    });
  } catch (error) {
    return handleError(error);
  }
}
