/**
 * Unified Seed Script
 * Run: npx tsx prisma/seed.ts
 */
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local explicitly (next.js style)
config({ path: resolve(process.cwd(), ".env.local") });

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "@/lib/auth/password";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL not found in .env.local");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

// ══════════════════════════════════════════════════════════════════
// 1. RBAC — Roles & Permissions
// ══════════════════════════════════════════════════════════════════

async function seedRBAC() {
  console.log("\n[RBAC] Seeding roles & permissions...");

  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: {
      name: "admin",
      displayName: "Administrator",
      description: "Full system access",
      color: "red",
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
      color: "indigo",
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
      color: "amber",
      level: 10,
      isSystem: false,
    },
  });

  console.log("  ✓ Roles:", adminRole.name, editorRole.name, viewerRole.name);

  // Admin permissions
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

  await prisma.permission.deleteMany({ where: { roleId: adminRole.id } });
  for (const perm of adminPermissions) {
    await prisma.permission.create({
      data: { roleId: adminRole.id, resource: perm.resource, action: perm.action, scope: "all" },
    });
  }
  console.log("  ✓ Admin permissions created");
}

// ══════════════════════════════════════════════════════════════════
// 2. Admin User
// ══════════════════════════════════════════════════════════════════

async function seedAdmin() {
  console.log("\n[Admin] Seeding admin user...");

  const existing = await prisma.user.findUnique({ where: { email: "admin@loop.vn" } });
  if (existing) {
    console.log("  ✓ Admin user already exists — skipping");
    return existing;
  }

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
  console.log(`  ✓ Admin created: ${admin.email} / admin123`);

  // Assign admin role
  const adminRole = await prisma.role.findUnique({ where: { name: "admin" } });
  if (adminRole) {
    await prisma.userRole.deleteMany({ where: { userId: admin.id } });
    await prisma.userRole.create({ data: { userId: admin.id, roleId: adminRole.id } });
    console.log("  ✓ Admin role assigned");
  }

  return admin;
}

// ══════════════════════════════════════════════════════════════════
// 3. CEO / Team Member
// ══════════════════════════════════════════════════════════════════

async function seedCEO() {
  console.log("\n[Team] Seeding CEO...");

  const existing = await prisma.teamMember.findUnique({ where: { slug: "bui-nhat-duc-anh" } });
  const data = {
    slug: "bui-nhat-duc-anh",
    name: "Bùi Nhật Đức Anh",
    role: "Founder & CEO",
    shortBio: "Một Gen Z đam mê công nghệ và nghệ thuật, người sáng lập LOOP với khát vọng xây dựng một môi trường lập trình tự do, sáng tạo và trân trọng tư duy thực tế.",
    bio: `"Xuất phát điểm là một Gen Z với tình yêu lớn dành cho việc giải quyết vấn đề, sáng tác âm nhạc và giáo dục, tôi luôn ấp ủ mang đến một làn gió mới cho ngành IT: trẻ trung, tự do và đậm chất nghệ thuật. Bước ra từ giai đoạn thị trường công nghệ đang có dấu hiệu bão hòa, tôi nhận thấy nhiều bạn trẻ đầy năng lượng lại dễ bị cản bước bởi những định kiến về "bằng cấp" hay "điểm số".

Chính vì vậy, tôi quyết định thành lập LOOP. Đây không chỉ là một tổ chức mà còn là một "sân chơi" công bằng, nơi tư duy logic và khả năng xử lý vấn đề thực tế được đặt lên hàng đầu. Tại LOOP, chúng tôi cùng nhau phá vỡ những giới hạn cũ để hết mình theo đuổi đam mê kiến tạo công nghệ trong kỷ nguyên số."`,
    image: "/images/team/ceo-placeholder.jpg",
    coverImage: "/images/team/ceo-cover-placeholder.jpg",
    quote: "Tư duy xử lý vấn đề quan trọng hơn bất kỳ điểm số hay nhãn mác nào.",
    email: "ducanhnhatbui@gmail.com",
    phone: "0378443602",
    linkedin: "https://linkedin.com/in/bui-nhat-duc-anh",
    achievements: [],
    skills: ["Leadership", "Product Strategy", "Enterprise Architecture", "Cloud Native"],
    roleLevel: 0,
    isFeatured: true,
    isActive: true,
    sortOrder: 0,
  };

  if (existing) {
    await prisma.teamMember.update({ where: { id: existing.id }, data });
    console.log("  ✓ CEO updated");
  } else {
    await prisma.teamMember.create({ data });
    console.log("  ✓ CEO created");
  }
}

// ══════════════════════════════════════════════════════════════════
// 4. Service Attributes (Feature Catalog)
// ══════════════════════════════════════════════════════════════════

async function seedServiceAttributes() {
  console.log("\n[ServiceAttributes] Seeding...");

  await prisma.serviceAttribute.deleteMany({});

  // Parent groups
  const ecommerce = await prisma.serviceAttribute.create({
    data: { slug: "shopping-cart", name: "Shopping Cart", nameVi: "Giỏ hàng", category: "Ecommerce", categoryVi: "Thương mại điện tử", price: 0, isRequired: false, tier: "basic", sortOrder: 1 },
  });

  const seo = await prisma.serviceAttribute.create({
    data: { slug: "seo", name: "SEO", nameVi: "SEO", category: "Marketing", categoryVi: "Marketing", price: 0, isRequired: false, tier: "basic", sortOrder: 10 },
  });

  const security = await prisma.serviceAttribute.create({
    data: { slug: "security", name: "Security", nameVi: "Bảo mật", category: "Security", categoryVi: "Bảo mật", price: 0, isRequired: false, tier: "basic", sortOrder: 20 },
  });

  // Children — Ecommerce
  await prisma.serviceAttribute.create({ data: { slug: "basic-cart", name: "Basic Cart", nameVi: "Giỏ hàng cơ bản", description: "Chức năng giỏ hàng cơ bản - thêm/sửa/xóa sản phẩm", descriptionVi: "Chức năng giỏ hàng cơ bản - thêm/sửa/xóa sản phẩm", category: "Ecommerce", categoryVi: "Thương mại điện tử", price: 500000, isRequired: false, tier: "basic", parentId: ecommerce.id, sortOrder: 2 } });
  await prisma.serviceAttribute.create({ data: { slug: "advanced-cart", name: "Advanced Cart", nameVi: "Giỏ hàng nâng cao", description: "Giỏ hàng nâng cao với so sánh sản phẩm, wishlist, notify giá giảm", descriptionVi: "Giỏ hàng nâng cao với so sánh sản phẩm, wishlist, notify giá giảm", category: "Ecommerce", categoryVi: "Thương mại điện tử", price: 2000000, isRequired: false, tier: "advanced", parentId: ecommerce.id, sortOrder: 3 } });

  // Children — SEO
  await prisma.serviceAttribute.create({ data: { slug: "basic-seo", name: "Basic SEO", nameVi: "SEO cơ bản", description: "Meta tags, sitemap, schema markup cơ bản", descriptionVi: "Meta tags, sitemap, schema markup cơ bản", category: "Marketing", categoryVi: "Marketing", price: 300000, isRequired: false, tier: "basic", parentId: seo.id, sortOrder: 11 } });
  await prisma.serviceAttribute.create({ data: { slug: "advanced-seo", name: "Advanced SEO", nameVi: "SEO nâng cao", description: "Audit SEO toàn diện, tối ưu tốc độ, backlink strategy", descriptionVi: "Audit SEO toàn diện, tối ưu tốc độ, backlink strategy", category: "Marketing", categoryVi: "Marketing", price: 1000000, isRequired: false, tier: "advanced", parentId: seo.id, sortOrder: 12 } });

  // Children — Security
  await prisma.serviceAttribute.create({ data: { slug: "basic-ssl", name: "Basic SSL", nameVi: "SSL cơ bản", description: "Chứng chỉ SSL miễn phí Let's Encrypt", descriptionVi: "Chứng chỉ SSL miễn phí Let's Encrypt", category: "Security", categoryVi: "Bảo mật", price: 0, isRequired: false, tier: "basic", parentId: security.id, sortOrder: 21 } });
  await prisma.serviceAttribute.create({ data: { slug: "advanced-ssl", name: "Advanced SSL", nameVi: "SSL nâng cao", description: "Chứng chỉ SSL cao cấp với bảo hiểm bảo mật", descriptionVi: "Chứng chỉ SSL cao cấp với bảo hiểm bảo mật", category: "Security", categoryVi: "Bảo mật", price: 500000, isRequired: false, tier: "advanced", parentId: security.id, sortOrder: 22 } });

  // Standalone features
  await prisma.serviceAttribute.createMany({
    data: [
      { slug: "menu", name: "Navigation Menu", nameVi: "Menu điều hướng", description: "Menu điều hướng responsive", descriptionVi: "Menu điều hướng responsive", category: "Core", categoryVi: "Cốt lõi", price: 0, isRequired: true, tier: "basic", sortOrder: 30 },
      { slug: "responsive", name: "Responsive Design", nameVi: "Thiết kế responsive", description: "Tương thích mọi thiết bị", descriptionVi: "Tương thích mọi thiết bị", category: "Core", categoryVi: "Cốt lõi", price: 0, isRequired: true, tier: "basic", sortOrder: 31 },
      { slug: "multilang", name: "Multi-language", nameVi: "Đa ngôn ngữ", description: "Hỗ trợ nhiều ngôn ngữ", descriptionVi: "Hỗ trợ nhiều ngôn ngữ", category: "Core", categoryVi: "Cốt lõi", price: 500000, isRequired: false, tier: "basic", sortOrder: 32 },
    ],
  });

  console.log("  ✓ Service attributes seeded");
}

// ══════════════════════════════════════════════════════════════════
// 5. Pricing — Web Packages, Categories, Features, Hosting, Domain, Deployment
// ══════════════════════════════════════════════════════════════════

async function seedPricing() {
  console.log("\n[Pricing] Seeding...");

  await prisma.pricingComparisonFeature.deleteMany();
  await prisma.pricingFeatureCategory.deleteMany();
  await prisma.pricingWebPackage.deleteMany();
  await prisma.pricingHostingPlan.deleteMany();
  await prisma.pricingDomainPrice.deleteMany();
  await prisma.pricingDeploymentItem.deleteMany();

  // Web Packages
  await prisma.pricingWebPackage.createMany({
    data: [
      { slug: "starter", name: "Starter", nameVi: "Khởi Đầu", tagline: "Perfect for landing pages & startups", taglineVi: "Phù hợp landing page & startup", price: 2980000, currency: "VND", period: "one-time", periodVi: "trọn gói", highlighted: false, cta: "Get Started", ctaVi: "Bắt Đầu", color: "#3B82F6", pages: "1-3 pages", pagesVi: "1-3 trang", sortOrder: 1 },
      { slug: "business", name: "Business", nameVi: "Doanh Nghiệp", tagline: "Best for growing businesses", taglineVi: "Tốt nhất cho doanh nghiệp đang phát triển", price: 4980000, currency: "VND", period: "one-time", periodVi: "trọn gói", highlighted: true, cta: "Get Started", ctaVi: "Bắt Đầu", color: "#6366F1", pages: "5-10 pages", pagesVi: "5-10 trang", sortOrder: 2 },
      { slug: "professional", name: "Professional", nameVi: "Chuyên Nghiệp", tagline: "Full-featured for established brands", taglineVi: "Đầy đủ tính năng cho thương hiệu lớn", price: 6980000, currency: "VND", period: "one-time", periodVi: "trọn gói", highlighted: false, cta: "Get Started", ctaVi: "Bắt Đầu", color: "#8B5CF6", pages: "15-30 pages", pagesVi: "15-30 trang", sortOrder: 3 },
      { slug: "enterprise", name: "Enterprise", nameVi: "Tập Đoàn", tagline: "Comprehensive solution for large organizations", taglineVi: "Giải pháp toàn diện cho tổ chức lớn", price: 8980000, currency: "VND", period: "one-time", periodVi: "trọn gói", highlighted: false, cta: "Contact Us", ctaVi: "Liên Hệ", color: "#EC4899", pages: "Unlimited", pagesVi: "Không giới hạn", sortOrder: 4 },
    ],
  });
  console.log("  ✓ Web Packages");

  // Feature Categories
  const categoryMap: Record<string, string> = {};
  const categoryData = [
    { slug: "design", name: "Design", nameVi: "Thiết Kế", sortOrder: 1 },
    { slug: "development", name: "Development", nameVi: "Phát Triển", sortOrder: 2 },
    { slug: "seo", name: "SEO & Marketing", nameVi: "SEO & Marketing", sortOrder: 3 },
    { slug: "infrastructure", name: "Infrastructure", nameVi: "Hạ Tầng", sortOrder: 4 },
    { slug: "support", name: "Support", nameVi: "Hỗ Trợ", sortOrder: 5 },
  ];
  for (const cat of categoryData) {
    const created = await prisma.pricingFeatureCategory.create({ data: cat });
    categoryMap[cat.slug] = created.id;
  }
  console.log("  ✓ Feature Categories");

  // Comparison Features
  const features = [
    { categorySlug: "design", slug: "responsive", name: "Responsive Design", nameVi: "Thiết kế responsive", values: { starter: true, business: true, professional: true, enterprise: true }, sortOrder: 1 },
    { categorySlug: "design", slug: "custom-design", name: "Custom Design", nameVi: "Thiết kế tùy chỉnh", values: { starter: "Template", business: true, professional: true, enterprise: true }, sortOrder: 2 },
    { categorySlug: "design", slug: "animations", name: "Animations & Effects", nameVi: "Hiệu ứng & animation", values: { starter: false, business: "Cơ bản", professional: true, enterprise: true }, sortOrder: 3 },
    { categorySlug: "design", slug: "ui-kit", name: "UI/UX Design Kit", nameVi: "Bộ UI/UX Design", values: { starter: false, business: false, professional: true, enterprise: true }, sortOrder: 4 },
    { categorySlug: "design", slug: "figma", name: "Figma Source File", nameVi: "File Figma gốc", values: { starter: false, business: false, professional: true, enterprise: true }, sortOrder: 5 },
    { categorySlug: "development", slug: "cms", name: "CMS Integration", nameVi: "Tích hợp CMS", values: { starter: false, business: true, professional: true, enterprise: true }, sortOrder: 1 },
    { categorySlug: "development", slug: "multilang", name: "Multi-language", nameVi: "Đa ngôn ngữ", values: { starter: false, business: false, professional: true, enterprise: true }, sortOrder: 2 },
    { categorySlug: "development", slug: "ecommerce", name: "E-Commerce Features", nameVi: "Tính năng E-Commerce", values: { starter: false, business: false, professional: "Cơ bản", enterprise: true }, sortOrder: 3 },
    { categorySlug: "development", slug: "contact-form", name: "Contact Form", nameVi: "Form liên hệ", values: { starter: true, business: true, professional: true, enterprise: true }, sortOrder: 4 },
    { categorySlug: "development", slug: "custom-features", name: "Custom Features", nameVi: "Tính năng tùy chỉnh", values: { starter: false, business: false, professional: "Theo yêu cầu", enterprise: true }, sortOrder: 5 },
    { categorySlug: "seo", slug: "basic-seo", name: "Basic SEO Setup", nameVi: "SEO cơ bản", values: { starter: true, business: true, professional: true, enterprise: true }, sortOrder: 1 },
    { categorySlug: "seo", slug: "analytics", name: "Google Analytics", nameVi: "Google Analytics", values: { starter: false, business: true, professional: true, enterprise: true }, sortOrder: 2 },
    { categorySlug: "seo", slug: "sitemap", name: "XML Sitemap", nameVi: "XML Sitemap", values: { starter: true, business: true, professional: true, enterprise: true }, sortOrder: 3 },
    { categorySlug: "seo", slug: "schema", name: "Schema Markup", nameVi: "Schema Markup (JSON-LD)", values: { starter: false, business: true, professional: true, enterprise: true }, sortOrder: 4 },
    { categorySlug: "seo", slug: "gsc", name: "Google Search Console", nameVi: "Google Search Console", values: { starter: false, business: true, professional: true, enterprise: true }, sortOrder: 5 },
    { categorySlug: "infrastructure", slug: "ssl", name: "SSL Certificate", nameVi: "Chứng chỉ SSL", values: { starter: true, business: true, professional: true, enterprise: true }, sortOrder: 1 },
    { categorySlug: "infrastructure", slug: "cdn", name: "CDN Integration", nameVi: "Tích hợp CDN", values: { starter: false, business: true, professional: true, enterprise: true }, sortOrder: 2 },
    { categorySlug: "infrastructure", slug: "cicd", name: "CI/CD Pipeline", nameVi: "CI/CD Pipeline", values: { starter: false, business: false, professional: true, enterprise: true }, sortOrder: 3 },
    { categorySlug: "infrastructure", slug: "monitoring", name: "Performance Monitoring", nameVi: "Giám sát hiệu suất", values: { starter: false, business: false, professional: true, enterprise: true }, sortOrder: 4 },
    { categorySlug: "infrastructure", slug: "lighthouse", name: "Lighthouse Score", nameVi: "Điểm Lighthouse", values: { starter: "85+", business: "90+", professional: "95+", enterprise: "95+" }, sortOrder: 5 },
    { categorySlug: "support", slug: "support-duration", name: "Free Support", nameVi: "Hỗ trợ miễn phí", values: { starter: "1 tháng", business: "3 tháng", professional: "6 tháng", enterprise: "12 tháng" }, sortOrder: 1 },
    { categorySlug: "support", slug: "revisions", name: "Revision Rounds", nameVi: "Số lần chỉnh sửa", values: { starter: "2 lần", business: "5 lần", professional: "Không giới hạn", enterprise: "Không giới hạn" }, sortOrder: 2 },
    { categorySlug: "support", slug: "priority", name: "Priority Support", nameVi: "Hỗ trợ ưu tiên", values: { starter: false, business: false, professional: true, enterprise: true }, sortOrder: 3 },
    { categorySlug: "support", slug: "pm", name: "Dedicated PM", nameVi: "PM chuyên trách", values: { starter: false, business: false, professional: false, enterprise: true }, sortOrder: 4 },
    { categorySlug: "support", slug: "training", name: "Content Training", nameVi: "Đào tạo quản trị", values: { starter: false, business: true, professional: true, enterprise: true }, sortOrder: 5 },
    { categorySlug: "support", slug: "source-code", name: "Source Code Ownership", nameVi: "Sở hữu mã nguồn", values: { starter: true, business: true, professional: true, enterprise: true }, sortOrder: 6 },
  ];
  for (const f of features) {
    await prisma.pricingComparisonFeature.create({
      data: {
        name: f.name,
        nameVi: f.nameVi,
        values: f.values as object,
        sortOrder: f.sortOrder,
        categoryId: categoryMap[f.categorySlug],
      },
    });
  }
  console.log("  ✓ Comparison Features");

  // Hosting Plans
  await prisma.pricingHostingPlan.createMany({
    data: [
      { slug: "hosting-basic", name: "Basic Hosting", nameVi: "Hosting Cơ Bản", price: 150000, period: "month", periodVi: "tháng", features: ["Shared hosting", "5GB SSD storage", "SSL certificate", "Daily backup", "99.5% uptime"], featuresVi: ["Shared hosting", "5GB SSD lưu trữ", "Chứng chỉ SSL", "Sao lưu hàng ngày", "99.5% uptime"], highlighted: false, color: "#3B82F6", sortOrder: 1 },
      { slug: "hosting-pro", name: "Pro Hosting", nameVi: "Hosting Nâng Cao", price: 350000, period: "month", periodVi: "tháng", features: ["VPS hosting", "20GB SSD storage", "SSL certificate", "CDN integration", "Daily backup", "99.9% uptime"], featuresVi: ["VPS hosting", "20GB SSD lưu trữ", "Chứng chỉ SSL", "Tích hợp CDN", "Sao lưu hàng ngày", "99.9% uptime"], highlighted: true, color: "#6366F1", sortOrder: 2 },
      { slug: "hosting-enterprise", name: "Enterprise Hosting", nameVi: "Hosting Doanh Nghiệp", price: 900000, period: "month", periodVi: "tháng", features: ["Dedicated server", "Unlimited storage", "SSL certificate", "CDN integration", "Real-time backup", "99.99% uptime SLA", "24/7 monitoring"], featuresVi: ["Server chuyên dụng", "Không giới hạn lưu trữ", "Chứng chỉ SSL", "Tích hợp CDN", "Sao lưu real-time", "99.99% uptime SLA", "Giám sát 24/7"], highlighted: false, color: "#8B5CF6", sortOrder: 3 },
    ],
  });
  console.log("  ✓ Hosting Plans");

  // Domain Prices
  await prisma.pricingDomainPrice.createMany({
    data: [
      { extension: ".com", registrationPrice: 280000, renewalPrice: 280000, period: "year", periodVi: "năm", sortOrder: 1 },
      { extension: ".vn", registrationPrice: 350000, renewalPrice: 350000, period: "year", periodVi: "năm", note: "Requires Vietnamese business license (GPKD)", noteVi: "Yêu cầu GPKD", sortOrder: 2 },
      { extension: ".com.vn", registrationPrice: 450000, renewalPrice: 450000, period: "year", periodVi: "năm", note: "Requires Vietnamese business license (GPKD)", noteVi: "Yêu cầu GPKD", sortOrder: 3 },
      { extension: ".net", registrationPrice: 320000, renewalPrice: 320000, period: "year", periodVi: "năm", sortOrder: 4 },
    ],
  });
  console.log("  ✓ Domain Prices");

  // Deployment Items
  await prisma.pricingDeploymentItem.createMany({
    data: [
      { slug: "source-code", title: "Source Code", titleVi: "Mã Nguồn", description: "Full access to Git repository with complete source code", descriptionVi: "Toàn quyền truy cập Git repository với mã nguồn đầy đủ", handedToClient: true, icon: "GitBranch", sortOrder: 1 },
      { slug: "admin-access", title: "Admin Dashboard", titleVi: "Bảng Điều Khiển Admin", description: "Admin/CMS credentials for content management", descriptionVi: "Tài khoản admin/CMS để quản trị nội dung", handedToClient: true, icon: "LayoutDashboard", sortOrder: 2 },
      { slug: "hosting-panel", title: "Hosting Panel", titleVi: "Hosting Panel", description: "Access to Vercel dashboard or VPS control panel", descriptionVi: "Truy cập Vercel dashboard hoặc VPS panel", handedToClient: true, icon: "Server", sortOrder: 3 },
      { slug: "analytics", title: "Analytics Access", titleVi: "Truy Cập Analytics", description: "Google Analytics & Search Console ownership transfer", descriptionVi: "Chuyển quyền sở hữu Google Analytics & Search Console", handedToClient: true, icon: "BarChart3", sortOrder: 4 },
      { slug: "ssl", title: "SSL Certificate", titleVi: "Chứng Chỉ SSL", description: "Auto-renewed SSL certificate via Let's Encrypt", descriptionVi: "Chứng chỉ SSL tự động gia hạn qua Let's Encrypt", handedToClient: true, icon: "ShieldCheck", sortOrder: 5 },
      { slug: "cicd-docs", title: "CI/CD Documentation", titleVi: "Tài Liệu CI/CD", description: "Complete deployment pipeline documentation", descriptionVi: "Tài liệu đầy đủ về quy trình triển khai", handedToClient: true, icon: "FileText", sortOrder: 6 },
      { slug: "dns-guide", title: "DNS Configuration", titleVi: "Cấu Hình DNS", description: "Step-by-step DNS setup guide for your domain", descriptionVi: "Hướng dẫn cấu hình DNS chi tiết cho tên miền", handedToClient: true, icon: "Globe", sortOrder: 7 },
      { slug: "training", title: "Content Training", titleVi: "Đào Tạo Quản Trị", description: "Hands-on training session for content management", descriptionVi: "Buổi đào tạo thực hành quản trị nội dung", handedToClient: true, icon: "GraduationCap", sortOrder: 8 },
      { slug: "domain", title: "Domain Registration", titleVi: "Đăng Ký Tên Miền", description: "Domain registration requires the owner's business license", descriptionVi: "Đăng ký tên miền yêu cầu GPKD của chính chủ sở hữu", handedToClient: false, icon: "AlertTriangle", note: "Vietnamese .vn domains require GPKD. We recommend registering through PA Vietnam, Mắt Bão, or Nhân Hòa.", noteVi: "Tên miền .vn yêu cầu Giấy phép Kinh doanh (GPKD). Chúng tôi khuyến nghị đăng ký qua PA Vietnam, Mắt Bão, hoặc Nhân Hòa.", sortOrder: 9 },
    ],
  });
  console.log("  ✓ Deployment Items");
}

// ══════════════════════════════════════════════════════════════════
// 6. Points System — Daily Rewards, Activities, Advertisements
// ══════════════════════════════════════════════════════════════════

async function seedPointsSystem() {
  console.log("\n[Points] Seeding daily rewards, activities & ads...");

  // Daily Rewards
  const dailyRewards = [
    { day: 1, points: 10, xpBonus: 1 },
    { day: 2, points: 15, xpBonus: 2 },
    { day: 3, points: 20, xpBonus: 3 },
    { day: 4, points: 25, xpBonus: 4 },
    { day: 5, points: 30, xpBonus: 5 },
    { day: 6, points: 40, xpBonus: 7 },
    { day: 7, points: 50, xpBonus: 10 },
  ];
  for (const reward of dailyRewards) {
    await prisma.dailyReward.upsert({ where: { day: reward.day }, update: reward, create: reward });
  }
  console.log(`  ✓ ${dailyRewards.length} daily reward tiers`);

  // Point Activities
  const activities = [
    { slug: "daily-login", name: "Daily Login", nameVi: "Đăng nhập hàng ngày", description: "Login every day to earn points", descriptionVi: "Đăng nhập mỗi ngày để nhận điểm thưởng", points: 10, xpBonus: 1, dailyLimit: 1, minLevel: 1, requiresPurchase: false, sortOrder: 1 },
    { slug: "purchase", name: "Purchase Reward", nameVi: "Thưởng khi mua hàng", description: "Earn points when making a purchase", descriptionVi: "Nhận điểm thưởng khi mua sản phẩm/dịch vụ", points: 100, xpBonus: 20, requiresPurchase: false, sortOrder: 2 },
    { slug: "review-website", name: "Review Website", nameVi: "Đánh giá website", description: "Write a review for your purchased website", descriptionVi: "Viết đánh giá về website đã mua", points: 50, xpBonus: 10, dailyLimit: 1, minLevel: 1, requiresPurchase: true, sortOrder: 3 },
    { slug: "referral", name: "Referral Program", nameVi: "Giới thiệu bạn bè", description: "Earn points when your referral makes a purchase", descriptionVi: "Nhận điểm khi bạn bè được giới thiệu mua hàng", points: 200, xpBonus: 50, minLevel: 1, requiresPurchase: false, sortOrder: 4 },
    { slug: "upgrade", name: "Website Upgrade", nameVi: "Nâng cấp website", description: "Earn bonus points when upgrading your website package", descriptionVi: "Nhận điểm thưởng khi nâng cấp gói website", points: 150, xpBonus: 30, minLevel: 1, requiresPurchase: false, sortOrder: 5 },
  ];
  for (const a of activities) {
    await prisma.pointActivity.upsert({ where: { slug: a.slug }, update: a, create: a });
  }
  console.log(`  ✓ ${activities.length} point activities`);

  // Advertisements
  const ads = [
    { slug: "loop-intro", title: "LOOP Introduction", titleVi: "Giới thiệu về LOOP", description: "Watch our company introduction video", descriptionVi: "Xem video giới thiệu về công ty LOOP", videoUrl: "/videos/loop-intro.mp4", thumbnailUrl: "/images/ads/loop-intro.jpg", duration: 30, points: 5, xpBonus: 1, dailyLimit: 10, watchCooldown: 60, minLevel: 1, requiresPurchase: false, sortOrder: 1 },
    { slug: "web-design-tips", title: "Web Design Tips", titleVi: "Mẹo thiết kế website", description: "Learn web design tips from experts", descriptionVi: "Học các mẹo thiết kế web từ chuyên gia", videoUrl: "/videos/web-tips.mp4", thumbnailUrl: "/images/ads/web-tips.jpg", duration: 60, points: 10, xpBonus: 2, dailyLimit: 5, watchCooldown: 120, minLevel: 2, requiresPurchase: false, sortOrder: 2 },
    { slug: "seo-basics", title: "SEO Basics", titleVi: "Cơ bản về SEO", description: "Learn the basics of SEO for your website", descriptionVi: "Học kiến thức cơ bản về SEO cho website của bạn", videoUrl: "/videos/seo-basics.mp4", thumbnailUrl: "/images/ads/seo-basics.jpg", duration: 45, points: 8, xpBonus: 2, dailyLimit: 5, watchCooldown: 120, minLevel: 1, requiresPurchase: false, sortOrder: 3 },
    { slug: "hosting-benefits", title: "Premium Hosting Benefits", titleVi: "Lợi ích Hosting Premium", description: "Discover premium hosting features", descriptionVi: "Khám phá các tính năng hosting cao cấp", videoUrl: "/videos/hosting-benefits.mp4", thumbnailUrl: "/images/ads/hosting-benefits.jpg", duration: 90, points: 15, xpBonus: 3, dailyLimit: 3, watchCooldown: 300, minLevel: 3, requiresPurchase: true, sortOrder: 4 },
  ];
  for (const ad of ads) {
    await prisma.advertisement.upsert({ where: { slug: ad.slug }, update: ad, create: ad });
  }
  console.log(`  ✓ ${ads.length} advertisements`);
}

// ══════════════════════════════════════════════════════════════════
// 7. Expertises (Developer Skills)
// ══════════════════════════════════════════════════════════════════

async function seedExpertises() {
  console.log("\n[Expertise] Seeding developer skills...");
  
  await prisma.expertise.deleteMany();

  const expertises = [
    // Frontend
    { name: "React", nameVi: "React", category: "frontend", categoryVi: "Frontend", icon: "Code2", sortOrder: 1 },
    { name: "Next.js", nameVi: "Next.js", category: "frontend", categoryVi: "Frontend", icon: "Globe", sortOrder: 2 },
    { name: "Vue.js", nameVi: "Vue.js", category: "frontend", categoryVi: "Frontend", icon: "Layout", sortOrder: 3 },
    { name: "Tailwind CSS", nameVi: "Tailwind CSS", category: "frontend", categoryVi: "Frontend", icon: "Palette", sortOrder: 4 },
    { name: "HTML/CSS", nameVi: "HTML/CSS", category: "frontend", categoryVi: "Frontend", icon: "FileCode2", sortOrder: 5 },
    { name: "TypeScript", nameVi: "TypeScript", category: "frontend", categoryVi: "Frontend", icon: "Braces", sortOrder: 6 },
    
    // Backend
    { name: "Node.js", nameVi: "Node.js", category: "backend", categoryVi: "Backend", icon: "Server", sortOrder: 11 },
    { name: "NestJS", nameVi: "NestJS", category: "backend", categoryVi: "Backend", icon: "Box", sortOrder: 12 },
    { name: "Python", nameVi: "Python", category: "backend", categoryVi: "Backend", icon: "Terminal", sortOrder: 13 },
    { name: "Java", nameVi: "Java", category: "backend", categoryVi: "Backend", icon: "Coffee", sortOrder: 14 },
    { name: "Go", nameVi: "Go", category: "backend", categoryVi: "Backend", icon: "Zap", sortOrder: 15 },
    { name: "PostgreSQL", nameVi: "PostgreSQL", category: "backend", categoryVi: "Backend", icon: "Database", sortOrder: 16 },
    { name: "MongoDB", nameVi: "MongoDB", category: "backend", categoryVi: "Backend", icon: "ServerCrash", sortOrder: 17 },
    
    // DevOps & Tools
    { name: "Docker", nameVi: "Docker", category: "devops", categoryVi: "DevOps", icon: "Container", sortOrder: 21 },
    { name: "Kubernetes", nameVi: "Kubernetes", category: "devops", categoryVi: "DevOps", icon: "Network", sortOrder: 22 },
    { name: "AWS", nameVi: "AWS", category: "devops", categoryVi: "DevOps", icon: "Cloud", sortOrder: 23 },
    { name: "Git", nameVi: "Git", category: "devops", categoryVi: "DevOps", icon: "GitBranch", sortOrder: 24 },
    { name: "CI/CD", nameVi: "CI/CD", category: "devops", categoryVi: "DevOps", icon: "Workflow", sortOrder: 25 },
    
    // Design & Others
    { name: "UI/UX Design", nameVi: "Thiết kế UI/UX", category: "design", categoryVi: "Thiết kế", icon: "PenTool", sortOrder: 31 },
    { name: "Figma", nameVi: "Figma", category: "design", categoryVi: "Thiết kế", icon: "Figma", sortOrder: 32 },
    { name: "Agile/Scrum", nameVi: "Agile/Scrum", category: "management", categoryVi: "Quản lý", icon: "Kanban", sortOrder: 41 },
    { name: "System Architecture", nameVi: "Kiến trúc hệ thống", category: "architecture", categoryVi: "Kiến trúc", icon: "Component", sortOrder: 42 },
  ];

  for (const skill of expertises) {
    await prisma.expertise.create({
      data: {
        name: skill.name,
        nameVi: skill.nameVi,
        category: skill.category,
        categoryVi: skill.categoryVi,
        icon: skill.icon,
        isActive: true,
        sortOrder: skill.sortOrder,
      },
    });
  }
  console.log(`  ✓ ${expertises.length} developer skills`);
}

// ══════════════════════════════════════════════════════════════════
// 8. Addon Services
// ══════════════════════════════════════════════════════════════════

async function seedAddonServices() {
  console.log("\n[AddonServices] Seeding...");

  const addons = [
    { slug: "seo-optimization", name: "SEO Optimization", nameVi: "Tối ưu SEO", description: "Complete SEO setup including meta tags, sitemap, schema markup and content optimization", descriptionVi: "Thiết lập SEO toàn diện bao gồm meta tags, sitemap, schema markup và tối ưu nội dung", type: "one_time", price: 1500000 },
    { slug: "google-analytics", name: "Google Analytics Setup", nameVi: "Cài đặt Google Analytics", description: "Full Google Analytics 4 setup with conversion tracking and custom events", descriptionVi: "Thiết lập Google Analytics 4 đầy đủ với theo dõi chuyển đổi và sự kiện tùy chỉnh", type: "one_time", price: 800000 },
    { slug: "maintenance-monthly", name: "Monthly Maintenance", nameVi: "Bảo trì hàng tháng", description: "Monthly website maintenance including updates, backups and security monitoring", descriptionVi: "Bảo trì website hàng tháng bao gồm cập nhật, sao lưu và giám sát bảo mật", type: "recurring", price: 500000, billingPeriod: "monthly" },
    { slug: "ssl-premium", name: "Premium SSL Certificate", nameVi: "Chứng chỉ SSL Premium", description: "Premium SSL with warranty and priority support", descriptionVi: "SSL cao cấp kèm bảo hiểm và hỗ trợ ưu tiên", type: "one_time", price: 2000000 },
    { slug: "speed-optimization", name: "Speed Optimization", nameVi: "Tối ưu tốc độ", description: "Performance optimization achieving 95+ Lighthouse score", descriptionVi: "Tối ưu hiệu suất đạt điểm Lighthouse 95+", type: "one_time", price: 1000000 },
    { slug: "backup-weekly", name: "Weekly Backup Service", nameVi: "Dịch vụ Backup Hàng Tuần", description: "Automated weekly backups with 30-day retention", descriptionVi: "Sao lưu tự động hàng tuần với lưu trữ 30 ngày", type: "recurring", price: 300000, billingPeriod: "monthly" },
    { slug: "training-session", name: "Admin Training Session", nameVi: "Buổi Đào Tạo Quản Trị", description: "2-hour hands-on training for content management", descriptionVi: "Buổi đào tạo thực hành quản trị nội dung 2 giờ", type: "one_time", price: 600000 },
    { slug: "custom-domain-email", name: "Custom Domain Email", nameVi: "Email Tên Miền Riêng", description: "5 custom email accounts with your domain (name@yourcompany.com)", descriptionVi: "5 tài khoản email tùy chỉnh với tên miền riêng", type: "recurring", price: 200000, billingPeriod: "monthly" },
  ];

  for (const addon of addons) {
    await prisma.addonService.upsert({
      where: { slug: addon.slug },
      update: addon,
      create: addon,
    });
  }
  console.log(`  ✓ ${addons.length} addon services`);
}

// ══════════════════════════════════════════════════════════════════
// 9. Reward Tiers
// ══════════════════════════════════════════════════════════════════

async function seedRewardTiers() {
  console.log("\n[RewardTiers] Seeding...");

  // Get addon services for tier items
  const maintenance = await prisma.addonService.findUnique({ where: { slug: "maintenance-monthly" } });
  const seo = await prisma.addonService.findUnique({ where: { slug: "seo-optimization" } });
  const training = await prisma.addonService.findUnique({ where: { slug: "training-session" } });
  const backup = await prisma.addonService.findUnique({ where: { slug: "backup-weekly" } });

  const tiers = [
    {
      level: 2,
      name: "Bronze Member",
      nameVi: "Thành viên Đồng",
      description: "Entry-level reward tier for new customers",
      minXp: 100,
      items: [
        { addonServiceId: backup?.id, quantity: 1, durationMonths: 1 },
      ],
    },
    {
      level: 3,
      name: "Silver Member",
      nameVi: "Thành viên Bạc",
      description: "Mid-tier rewards for active customers",
      minXp: 500,
      items: [
        { addonServiceId: backup?.id, quantity: 1, durationMonths: 3 },
        { addonServiceId: training?.id, quantity: 1, durationMonths: null },
      ],
    },
    {
      level: 4,
      name: "Gold Member",
      nameVi: "Thành viên Vàng",
      description: "Premium rewards for loyal customers",
      minXp: 1000,
      items: [
        { addonServiceId: maintenance?.id, quantity: 1, durationMonths: 3 },
        { addonServiceId: seo?.id, quantity: 1, durationMonths: null },
        { addonServiceId: backup?.id, quantity: 1, durationMonths: 6 },
      ],
    },
    {
      level: 5,
      name: "Platinum Member",
      nameVi: "Thành viên Bạch Kim",
      description: "Top-tier rewards for VIP customers",
      minXp: 3000,
      items: [
        { addonServiceId: maintenance?.id, quantity: 1, durationMonths: 12 },
        { addonServiceId: seo?.id, quantity: 1, durationMonths: null },
        { addonServiceId: training?.id, quantity: 2, durationMonths: null },
        { addonServiceId: backup?.id, quantity: 1, durationMonths: 12 },
      ],
    },
  ];

  for (const tier of tiers) {
    const { items, ...tierData } = tier;
    const created = await prisma.rewardTier.upsert({
      where: { level: tier.level },
      update: tierData,
      create: tierData,
    });

    for (const item of items) {
      if (item.addonServiceId) {
        await prisma.rewardTierItem.upsert({
          where: { rewardTierId_addonServiceId: { rewardTierId: created.id, addonServiceId: item.addonServiceId } },
          update: { quantity: item.quantity, durationMonths: item.durationMonths },
          create: { rewardTierId: created.id, addonServiceId: item.addonServiceId, quantity: item.quantity, durationMonths: item.durationMonths },
        });
      }
    }
  }
  console.log(`  ✓ ${tiers.length} reward tiers`);
}

// ══════════════════════════════════════════════════════════════════
// 10. Landing Page & Content Seeds
// ══════════════════════════════════════════════════════════════════

async function seedContent() {
  console.log("\n[Content] Seeding landing page & home slider...");

  // Default Home Slider
  const sliderExists = await prisma.homeSlider.findFirst();
  if (!sliderExists) {
    await prisma.homeSlider.create({
      data: {
        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&q=80",
        title: "Thiết kế Website Chuyên Nghiệp",
        subtitle: "Biến ý tưởng của bạn thành hiện thực số",
        sortOrder: 0,
        isActive: true,
      },
    });
    console.log("  ✓ Home slider created");
  } else {
    console.log("  ✓ Home slider already exists");
  }

  // Default Home Video
  const videoExists = await prisma.homeVideo.findFirst();
  if (!videoExists) {
    await prisma.homeVideo.create({
      data: {
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        thumbnail: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1280&q=80",
        title: "Giới thiệu LOOP",
        description: "Khám phá cách LOOP giúp doanh nghiệp của bạn phát triển trong kỷ nguyên số",
        isActive: true,
        sortOrder: 0,
      },
    });
    console.log("  ✓ Home video created");
  } else {
    console.log("  ✓ Home video already exists");
  }

  // Default Landing Page
  const landingExists = await prisma.landingPage.findUnique({ where: { slug: "default" } });
  if (!landingExists) {
    const page = await prisma.landingPage.create({
      data: {
        slug: "default",
        name: "Trang chủ mặc định",
        locale: "vi",
        isPublished: true,
        isDefault: true,
        seoTitle: "LOOP - Thiết kế Website & Ứng dụng chuyên nghiệp",
        seoDesc: "Công ty thiết kế website thương mại, ứng dụng di động, phần mềm quản lý doanh nghiệp. Tối ưu SEO, hiệu suất cao.",
      },
    });

    // Hero section
    await prisma.landingSection.create({
      data: {
        pageId: page.id,
        type: "hero",
        title: "Xây dựng Website Vượt Trội",
        subtitle: "Giải pháp số toàn diện cho doanh nghiệp của bạn",
        sortOrder: 0,
        isActive: true,
      },
    });
    console.log("  ✓ Default landing page created");
  } else {
    console.log("  ✓ Default landing page already exists");
  }

  // Site Settings
  const settings = [
    { key: "hero_banner_1", value: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&q=80", group: "hero" },
    { key: "hero_enable", value: "1", group: "hero" },
    { key: "stat_projects", value: "150+", group: "stats" },
    { key: "stat_satisfaction", value: "98%", group: "stats" },
    { key: "stat_team_size", value: "50+", group: "stats" },
    { key: "stat_years", value: "8+", group: "stats" },
    { key: "company_name", value: "LOOP", group: "general" },
    { key: "company_email", value: "contact@loop.vn", group: "general" },
    { key: "company_phone", value: "0378443602", group: "general" },
    { key: "company_address", value: "Ho Chi Minh City, Vietnam", group: "general" },
  ];

  for (const setting of settings) {
    const existing = await prisma.siteSetting.findUnique({ where: { key: setting.key } });
    if (!existing) {
      await prisma.siteSetting.create({ data: setting });
    }
  }
  console.log(`  ✓ ${settings.length} site settings`);
}

// ══════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════

async function main() {
  console.log("=".repeat(50));
  console.log("🌱 LOOP — Unified Seed Script");
  console.log("=".repeat(50));

  try {
    await seedRBAC();
    await seedAdmin();
    await seedCEO();
    await seedServiceAttributes();
    await seedPricing();
    await seedPointsSystem();
    await seedExpertises();
    await seedAddonServices();
    await seedRewardTiers();
    await seedContent();

    console.log("\n" + "=".repeat(50));
    console.log("✅ All seeds completed successfully!");
    console.log("=".repeat(50));
  } catch (err) {
    console.error("\n❌ Seed failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
