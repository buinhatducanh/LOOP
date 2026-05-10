/**
 * POST /api/pricing/seed-acknowledgments
 *
 * Seed acknowledgment data cho 4 goi web.
 * Du lieu lay tu WEBSITE_PACKAGES_FALLBACK + WEBSITE_FEATURES_FALLBACK
 * trong BookingWizardClient.tsx.
 *
 * Chay 1 lan de dong bo DB voi FE.
 */

import { NextRequest } from "next/server";
import { ok, badRequest, serverError, handleError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAdmin } from "@/lib/auth/permissions";

// ── Acknowledgment seed data ──────────────────────────────────────────────────
// Key = feature label (exact match voi package.features[])
// ackLabel = mo ta non-tech, giup khach hieu feature do la gi

const LANDING_ACKNOWLEDGMENTS = [
 {
 key: "Giao diện hiện đại, chuẩn Responsive",
 ackLabel: "Website hiển thị đẹp trên mọi thiết bị: điện thoại, máy tính bảng, laptop. Giao diện tự động điều chỉnh kích thước, không cần cuộn ngang. Khách hàng xem website mượt mà như app.",
 ackLabelEn: "Displays beautifully on all devices: phones, tablets, laptops. Layout auto-adjusts, no horizontal scrolling needed.",
 icon: "Smartphone",
 sortOrder: 1,
 },
 {
 key: "Tối ưu trải nghiệm UI/UX",
 ackLabel: "Thiết kế dễ sử dụng, điều hướng trực quan, giúp khách hàng tìm thấy thông tin nhanh chóng. Mỗi nút bấm đều có phản hồi rõ ràng. Không cần suy nghĩ nhiều để biết click đâu tiếp theo.",
 ackLabelEn: "Easy-to-use design with intuitive navigation. Customers find information quickly. Every button has clear feedback.",
 icon: "Sparkles",
 sortOrder: 2,
 },
 {
 key: "Hỗ trợ chỉnh sửa sau bàn giao",
 ackLabel: "Sau khi nhận website, bạn có thể tự chỉnh sửa nội dung cơ bản (text, hình ảnh) mà không cần biết code. LOOP sẽ hướng dẫn chi tiết cách cập nhật.",
 ackLabelEn: "After handover, you can edit basic content (text, images) yourself without coding. LOOP provides detailed guidance.",
 icon: "Edit3",
 sortOrder: 3,
 },
 {
 key: "Trang giới thiệu SP/Dịch vụ",
 ackLabel: "Tạo các trang riêng để giới thiệu chi tiết từng sản phẩm hoặc dịch vụ. Mỗi trang có hình ảnh, mô tả, giá cả (nếu cần). Giúp khách hiểu rõ trước khi liên hệ.",
 ackLabelEn: "Create dedicated pages for each product or service with images, descriptions, and pricing. Helps customers understand before reaching out.",
 icon: "Package",
 sortOrder: 4,
 },
 {
 key: "Admin quản lý bài viết",
 ackLabel: "Bạn có bảng điều khiển riêng (Admin Dashboard) để thêm/sửa/xóa bài viết, cập nhật nội dung website mà không cần liên hệ dev. Giao diện quản lý trực quan, dễ dùng.",
 ackLabelEn: "You get your own dashboard to add/edit/delete posts and update website content without contacting a developer. Simple and intuitive interface.",
 icon: "LayoutDashboard",
 sortOrder: 5,
 },
 {
 key: "Form thu thập dữ liệu KH",
 ackLabel: "Đặt form liên hệ, đăng ký tư vấn, hoặc thu thập email ở bất kỳ trang nào. Mỗi khi khách điền form, bạn nhận được thông báo ngay. Danh sách khách tiềm năng được lưu lại tự động.",
 ackLabelEn: "Place contact forms, consultation sign-ups, or email collection on any page. Get instant notifications when customers submit. Lead list is saved automatically.",
 icon: "FileText",
 sortOrder: 6,
 },
 {
 key: "Quản lý tệp KH có bảo mật",
 ackLabel: "Lưu trữ và quản lý tệp tài liệu khách hàng (hợp đồng, báo giá) một cách có trật tự, bảo mật. Chỉ người được phép mới xem được. Không lo lộ thông tin.",
 ackLabelEn: "Store and manage customer documents (contracts, quotes) securely with access control. Only authorized people can view them.",
 icon: "Shield",
 sortOrder: 7,
 },
 {
 key: "Tối ưu SEO On-page",
 ackLabel: "Website được tối ưu để Google dễ tìm thấy: tiêu đề, mô tả, từ khóa, cấu trúc trang đều chuẩn SEO. Giúp khách hàng tìm thấy bạn trên Google một cách tự nhiên.",
 ackLabelEn: "Website is optimized for Google: titles, descriptions, keywords, and structure follow SEO best practices. Helps customers find you naturally on Google.",
 icon: "Search",
 sortOrder: 8,
 },
];

const BAN_HANG_ACKNOWLEDGMENTS = [
 {
 key: "Bao gồm mọi tính năng Landing Page",
 ackLabel: "Tất cả 8 tính năng từ gói Landing Page đã được bao gồm sẵn trong gói này: responsive, SEO, form thu thập khách, quản lý bài viết...",
 ackLabelEn: "All 8 features from the Landing Page package are included: responsive design, SEO, lead capture forms, post management...",
 icon: "CheckCircle2",
 sortOrder: 1,
 },
 {
 key: "Danh mục & Chi tiết sản phẩm",
 ackLabel: "Tạo danh mục sản phẩm theo loại (VD: Áo, Quần, Phụ kiện). Mỗi sản phẩm có trang riêng với hình ảnh, mô tả chi tiết, giá cả. Khách dễ dàng xem và so sánh sản phẩm trước khi mua.",
 ackLabelEn: "Organize products by category. Each product has its own page with images, detailed description, and pricing. Customers can easily browse and compare before buying.",
 icon: "ShoppingBag",
 sortOrder: 2,
 },
 {
 key: "Chức năng Giỏ hàng thông minh",
 ackLabel: "Khách chọn mua nhiều sản phẩm cùng lúc, giỏ hàng tự động tính tổng tiền. Hỗ trợ cập nhật số lượng, xóa sản phẩm, xem chi tiết đơn hàng. Tất cả diễn ra nhanh chóng trong vài giây.",
 ackLabelEn: "Customers can add multiple products at once. Cart automatically calculates totals, supports quantity updates and removal. Everything happens in seconds.",
 icon: "ShoppingCart",
 sortOrder: 3,
 },
 {
 key: "Thống kê đơn hàng & Doanh thu",
 ackLabel: "Bảng điều khiển hiển thị tổng số đơn hàng, doanh thu theo ngày/tuần/tháng. Biểu đồ trực quan giúp bạn nắm bắt tình hình kinh doanh, biết sản phẩm nào bán chạy nhất.",
 ackLabelEn: "Dashboard shows total orders and revenue by day/week/month. Visual charts help you understand business performance and top-selling products.",
 icon: "BarChart3",
 sortOrder: 4,
 },
 {
 key: "Tài khoản Admin & Khách hàng",
 ackLabel: "Bạn có tài khoản Admin để quản lý toàn bộ website. Khách hàng có tài khoản riêng để xem lịch sử đơn hàng, lưu sản phẩm yêu thích. Mỗi người đều có trải nghiệm phù hợp.",
 ackLabelEn: "You have an Admin account to manage everything. Customers have their own account to view order history and save favorites. Each person gets the right experience.",
 icon: "Users",
 sortOrder: 5,
 },
 {
 key: "Tặng 5 trang nội dung miễn phí",
 ackLabel: "Nhận ngay 5 trang nội dung tùy chỉnh: Giới thiệu, Liên hệ, Chính sách, Tin tức, FAQ... Bạn cung cấp nội dung, LOOP thiết kế và lắp ghép miễn phí. Tiết kiệm thời gian thiết lập.",
 ackLabelEn: "Get 5 custom content pages: About, Contact, Policy, News, FAQ... You provide content, LOOP designs and builds them for free. Saves setup time.",
 icon: "Gift",
 sortOrder: 6,
 },
];

const DOANH_NGHIEP_ACKNOWLEDGMENTS = [
 {
 key: "Bao gồm mọi tính năng Bán Hàng",
 ackLabel: "Tất cả 14 tính năng từ gói Bán Hàng Cơ Bản đã được bao gồm: danh mục sản phẩm, giỏ hàng, thống kê, tài khoản khách hàng...",
 ackLabelEn: "All 14 features from the Basic E-commerce package are included: product catalog, cart, analytics, customer accounts...",
 icon: "CheckCircle2",
 sortOrder: 1,
 },
 {
 key: "Giỏ hàng đa dạng sản phẩm/dịch vụ",
 ackLabel: "Ngoài sản phẩm vật lý, bạn có thể bán cả dịch vụ, gói subscription, vé sự kiện... Giỏ hàng hỗ trợ nhiều loại sản phẩm khác nhau trong cùng một đơn hàng.",
 ackLabelEn: "Beyond physical products, you can sell services, subscription packages, event tickets... Cart supports multiple product types in one order.",
 icon: "Layers",
 sortOrder: 2,
 },
 {
 key: "SP nâng cao (size, màu, thuộc tính)",
 ackLabel: "Mỗi sản phẩm có thể có nhiều biến thể: size (S/M/L), màu sắc, dung lượng, phiên bản... Khách chọn đúng biến thể cần, hệ thống tự động cập nhật giá và tồn kho.",
 ackLabelEn: "Each product can have multiple variants: size (S/M/L), color, capacity, version... Customers select the right variant and the system auto-updates price and stock.",
 icon: "Palette",
 sortOrder: 3,
 },
 {
 key: "Hệ thống Mã giảm giá/Flash sale",
 ackLabel: "Tạo mã giảm giá theo % hoặc số tiền cố định. Đặt thời gian có hiệu lực, giới hạn số lượng sử dụng. Chương trình Flash Sale với đồng hồ đếm ngược tạo sự khan hiếm, kích thích mua ngay.",
 ackLabelEn: "Create discount codes by percentage or fixed amount. Set validity period and usage limits. Flash Sale with countdown timer creates urgency and drives immediate purchases.",
 icon: "Tag",
 sortOrder: 4,
 },
 {
 key: "Tích điểm & Đổi quà thành viên",
 ackLabel: "Khách hàng tích lũy điểm thưởng mỗi lần mua hàng. Điểm tích lũy theo thời gian, có bảng xếp hạng. Đổi điểm lấy quà, voucher, hoặc giảm giá — tạo động lực mua hàng lặp lại.",
 ackLabelEn: "Customers accumulate reward points with each purchase. Points build over time with a leaderboard. Redeem points for gifts, vouchers, or discounts — creates incentive for repeat purchases.",
 icon: "Star",
 sortOrder: 5,
 },
 {
 key: "Bộ lọc & Tìm kiếm AI thông minh",
 ackLabel: "Khách lọc sản phẩm theo giá, màu sắc, size, thương hiệu... Tìm kiếm có gợi ý thông minh, tìm kiếm mờ (fuzzy search) — gõ sai chính tả vẫn ra kết quả. Giúp khách tìm sản phẩm nhanh chóng.",
 ackLabelEn: "Customers filter products by price, color, size, brand... Smart search with suggestions and fuzzy matching — finds results even with typos. Helps customers find products quickly.",
 icon: "Filter",
 sortOrder: 6,
 },
 {
 key: "Quản lý Kho hàng & Nhà cung cấp",
 ackLabel: "Theo dõi tồn kho theo thời gian thực: số lượng từng biến thể, cảnh báo khi sắp hết hàng. Quản lý danh sách nhà cung cấp, theo dõi đơn nhập hàng. Duy trì kho hàng hiệu quả, không bao giờ hết hàng đột ngột.",
 ackLabelEn: "Track real-time inventory: variant quantities, low-stock alerts. Manage supplier list, track purchase orders. Maintain efficient stock levels, never run out unexpectedly.",
 icon: "Warehouse",
 sortOrder: 7,
 },
];

const YEU_CAU_ACKNOWLEDGMENTS = [
 {
 key: "Bao gồm mọi tính năng Doanh Nghiệp",
 ackLabel: "Tất cả 21 tính năng từ gói Doanh Nghiệp đã được bao gồm: giỏ hàng đa dạng, mã giảm giá, tích điểm, bộ lọc AI, quản lý kho...",
 ackLabelEn: "All 21 features from the Enterprise package are included: multi-type cart, discount codes, loyalty points, AI filters, inventory management...",
 icon: "CheckCircle2",
 sortOrder: 1,
 },
 {
 key: "UI/UX Độc quyền (Không mẫu)",
 ackLabel: "Thiết kế riêng biệt 100% cho thương hiệu của bạn — không dùng template có sẵn. LOOP nghiên cứu brand identity, tạo moodboard, thiết kế từ ý tưởng. Website của bạn sẽ khác biệt hoàn toàn với đối thủ.",
 ackLabelEn: "100% custom design for your brand — no pre-made templates. LOOP researches your brand identity, creates moodboards, designs from scratch. Your website will be completely different from competitors.",
 icon: "Palette",
 sortOrder: 2,
 },
 {
 key: "Tùy chỉnh chức năng Core System",
 ackLabel: "Xây dựng các tính năng đặc thù theo yêu cầu riêng của doanh nghiệp: hệ thống booking, quản lý lịch hẹn, dashboard tùy chỉnh, workflow đặc biệt... Không có gì không thể làm được.",
 ackLabelEn: "Build custom features specific to your business: booking systems, appointment management, custom dashboards, special workflows... Nothing is impossible to implement.",
 icon: "Code2",
 sortOrder: 3,
 },
 {
 key: "Tích hợp Cổng thanh toán/Vận chuyển",
 ackLabel: "Kết nối trực tiếp với VNPay, MoMo, ZaloPay, các ngân hàng Việt Nam. Tích hợp giao hàng qua GHN, GHTK, J&T. Khách thanh toán và vận chuyển ngay trên website — không cần chuyển sang bên thứ ba.",
 ackLabelEn: "Direct integration with VNPay, MoMo, ZaloPay, Vietnamese banks. Connect with GHN, GHTK, J&T shipping. Customers pay and ship on your website — no redirect needed.",
 icon: "CreditCard",
 sortOrder: 4,
 },
 {
 key: "API kết nối bên thứ 3 (Zalo, App...)",
 ackLabel: "Website có thể giao tiếp với Zalo OA, app di động, phần mềm ERP/CRM của bạn. Đồng bộ dữ liệu khách hàng, đơn hàng, tồn kho tự động giữa các hệ thống. Không cần nhập tay trùng lặp.",
 ackLabelEn: "Website can communicate with Zalo OA, mobile apps, your ERP/CRM software. Auto-sync customer data, orders, and inventory across systems. No more duplicate manual entry.",
 icon: "Plug",
 sortOrder: 5,
 },
 {
 key: "Bảo mật đa lớp & Tối ưu Speed cực nhanh",
 ackLabel: "Bảo mật theo chuẩn quốc tế: SSL, mã hóa dữ liệu, firewall, bảo vệ DDoS. Tốc độ tải trang dưới 2 giây với CDN, lazy loading, tối ưu hình ảnh. Khách không bỏ ra giữa chừng vì website chậm.",
 ackLabelEn: "International-grade security: SSL, data encryption, firewall, DDoS protection. Page load under 2 seconds with CDN, lazy loading, image optimization. Customers won't leave due to slow loading.",
 icon: "ShieldCheck",
 sortOrder: 6,
 },
];

const SEED_DATA: Record<string, { title: string; acknowledgments: typeof LANDING_ACKNOWLEDGMENTS }> = {
 landing: { title: "Landing Page", acknowledgments: LANDING_ACKNOWLEDGMENTS },
 "ban-hang": { title: "Bán Hàng Cơ Bản", acknowledgments: BAN_HANG_ACKNOWLEDGMENTS },
 "doanh-nghiep": { title: "Quản Trị Doanh Nghiệp", acknowledgments: DOANH_NGHIEP_ACKNOWLEDGMENTS },
 "yeu-cau": { title: "Thiết Kế Theo Yêu Cầu", acknowledgments: YEU_CAU_ACKNOWLEDGMENTS },
};

export async function POST(_req: NextRequest) {
 try {
 const session = await requireAuth();
 if (!isAdmin(session)) {
 return badRequest("Admin access required");
 }

 const results: { slug: string; success: boolean }[] = [];

 for (const [slug, data] of Object.entries(SEED_DATA) as [string, typeof SEED_DATA[string]][]) {
 await prisma.servicePackage.update({
 where: { slug },
 data: {
 acknowledgmentItems: JSON.stringify(data.acknowledgments),
 videoUrl: null,
 videoThumbnail: null,
 showFeatureAcknowledge: true,
 },
 });
 results.push({ slug, success: true });
 }

 return ok({
 success: true,
 message: `Seeded acknowledgments for ${results.length} packages`,
 packages: results,
 });
 } catch (err) {
 return handleError(err);
 }
}
