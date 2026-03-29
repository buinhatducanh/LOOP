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
    { name: "React", category: "frontend", icon: "Code2", sortOrder: 1 },
    { name: "Next.js", category: "frontend", icon: "Globe", sortOrder: 2 },
    { name: "Vue.js", category: "frontend", icon: "Layout", sortOrder: 3 },
    { name: "Tailwind CSS", category: "frontend", icon: "Palette", sortOrder: 4 },
    { name: "HTML/CSS", category: "frontend", icon: "FileCode2", sortOrder: 5 },
    { name: "TypeScript", category: "frontend", icon: "Braces", sortOrder: 6 },

    // Backend
    { name: "Node.js", category: "backend", icon: "Server", sortOrder: 11 },
    { name: "NestJS", category: "backend", icon: "Box", sortOrder: 12 },
    { name: "Python", category: "backend", icon: "Terminal", sortOrder: 13 },
    { name: "Java", category: "backend", icon: "Coffee", sortOrder: 14 },
    { name: "Go", category: "backend", icon: "Zap", sortOrder: 15 },
    { name: "PostgreSQL", category: "backend", icon: "Database", sortOrder: 16 },
    { name: "MongoDB", category: "backend", icon: "ServerCrash", sortOrder: 17 },

    // DevOps & Tools
    { name: "Docker", category: "devops", icon: "Container", sortOrder: 21 },
    { name: "Kubernetes", category: "devops", icon: "Network", sortOrder: 22 },
    { name: "AWS", category: "devops", icon: "Cloud", sortOrder: 23 },
    { name: "Git", category: "devops", icon: "GitBranch", sortOrder: 24 },
    { name: "CI/CD", category: "devops", icon: "Workflow", sortOrder: 25 },

    // Design & Others
    { name: "UI/UX Design", category: "design", icon: "PenTool", sortOrder: 31 },
    { name: "Figma", category: "design", icon: "Figma", sortOrder: 32 },
    { name: "Agile/Scrum", category: "management", icon: "Kanban", sortOrder: 41 },
    { name: "System Architecture", category: "architecture", icon: "Component", sortOrder: 42 },
  ];

  for (const skill of expertises) {
    await prisma.expertise.create({
      data: {
        name: skill.name,
        category: skill.category,
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
// 11. Academy — Instructors, Courses, Lessons, Enrollments
// ══════════════════════════════════════════════════════════════════

async function seedAcademy() {
  console.log("\n[Academy] Seeding instructors, courses, lessons, enrollments...");

  // ── Instructors ────────────────────────────────────────────────────────
  // Upsert from team members first
  const instructors = [
    {
      name: "Akira Sato",
      slug: "akira-sato",
      bio: "10+ năm kinh nghiệm xây dựng sản phẩm SaaS. Từng là Senior Engineer tại các công ty công nghệ Nhật Bản và Việt Nam. Mentor cho 4,100+ học viên. Chuyên gia về React ecosystem và system design.",
      specialties: ["React", "Next.js", "TypeScript", "System Design"],
      rating: 4.9,
      totalStudents: 4100,
    },
    {
      name: "Mei Lin",
      slug: "mei-lin",
      bio: "8 năm thiết kế UI/UX cho startup và enterprise. Từng làm việc tại Singapore và HCM. Mentor cho 1,800+ học viên về Design Systems.",
      specialties: ["Figma", "UI/UX", "Design Systems", "Tailwind CSS"],
      rating: 4.8,
      totalStudents: 1800,
    },
    {
      name: "Ryo Hashimoto",
      slug: "ryo-hashimoto",
      bio: "12 năm backend engineering. Architect cho các hệ thống xử lý hàng triệu request/ngày. Chuyên gia PostgreSQL và microservices.",
      specialties: ["Node.js", "PostgreSQL", "Docker", "AWS", "Go"],
      rating: 4.9,
      totalStudents: 1880,
    },
    {
      name: "Shin Watanabe",
      slug: "shin-watanabe",
      bio: "DevOps architect với 8 năm kinh nghiệm triển khai Kubernetes cho startup Việt Nam và Nhật Bản. Chuyên gia CI/CD và cloud infrastructure.",
      specialties: ["Kubernetes", "Docker", "CI/CD", "AWS", "GCP"],
      rating: 4.7,
      totalStudents: 890,
    },
    {
      name: "Yuna Park",
      slug: "yuna-park",
      bio: "7 năm kinh nghiệm SEO và content marketing. Đã giúp 500+ website Việt Nam tăng trưởng organic traffic 300%. Chuyên gia SaaS B2B marketing.",
      specialties: ["SEO", "Content Marketing", "Growth", "Copywriting"],
      rating: 4.8,
      totalStudents: 3100,
    },
    {
      name: "Rin Nakamura",
      slug: "rin-nakamura",
      bio: "Systems programmer chuyên Rust và Go. 6 năm viết high-performance code cho fintech và blockchain. Tác giả của nhiều open-source libraries.",
      specialties: ["Rust", "Go", "Performance", "Fintech"],
      rating: 5.0,
      totalStudents: 680,
    },
  ];

  const createdInstructors: Record<string, string> = {};
  for (const inst of instructors) {
    const existing = await prisma.instructor.findFirst({ where: { name: inst.name } });
    if (existing) {
      await prisma.instructor.update({
        where: { id: existing.id },
        data: {
          bio: inst.bio,
          specialties: inst.specialties,
          rating: inst.rating,
          totalStudents: inst.totalStudents,
          isActive: true,
        },
      });
      createdInstructors[inst.name] = existing.id;
    } else {
      const created = await prisma.instructor.create({
        data: {
          name: inst.name,
          bio: inst.bio,
          specialties: inst.specialties,
          rating: inst.rating,
          totalStudents: inst.totalStudents,
          isActive: true,
        },
      });
      createdInstructors[inst.name] = created.id;
    }
  }
  console.log(`  ✓ ${instructors.length} instructors`);

  // ── Courses ────────────────────────────────────────────────────────────
  const courses = [
    {
      id: "course-react-nextjs",
      title: "React & Next.js 14 From Zero To Hero",
      titleVi: "React & Next.js 14 Từ Zero Đến Hero",
      desc: "Khóa học toàn diện nhất về React 18 và Next.js 14 tại Việt Nam. Từ nền tảng đến production-ready app. Bao gồm Server Components, Streaming, Caching, TypeScript, Tailwind và deployment trên Vercel.",
      descVi: "Khóa học toàn diện nhất về React 18 và Next.js 14 tại Việt Nam. Từ nền tảng đến production-ready app. Bao gồm Server Components, Streaming, Caching, TypeScript, Tailwind và deployment trên Vercel.",
      price: 2_000_000,
      lpReward: 200,
      durationWeeks: 8,
      maxStudents: 100,
      status: "published",
      instructorName: "Akira Sato",
      lessons: [
        { title: "Giới thiệu React 18 và Concurrent Mode", duration: 45 },
        { title: "JSX, Components và Props", duration: 38 },
        { title: "State, Events và Lifecycle", duration: 52 },
        { title: "Hooks nâng cao: useCallback, useMemo, useRef", duration: 60 },
        { title: "Custom hooks và patterns", duration: 48 },
        { title: "Quiz: React Fundamentals", duration: 15, type: "quiz" },
        { title: "Giới thiệu Next.js 14 và App Router", duration: 40 },
        { title: "Server Components vs Client Components", duration: 55 },
        { title: "Data fetching và caching strategies", duration: 65 },
        { title: "Route Groups, Layouts và Loading UI", duration: 50 },
        { title: "Error handling và Suspense", duration: 40 },
        { title: "TypeScript với React — Basics đến Generics", duration: 72 },
        { title: "Zustand — Global state đơn giản", duration: 45 },
        { title: "React Query & SWR cho data fetching", duration: 58 },
        { title: "Quiz: State Management Patterns", duration: 15, type: "quiz" },
        { title: "Performance optimization và Lighthouse", duration: 62 },
        { title: "Testing với Vitest và React Testing Library", duration: 55 },
        { title: "CI/CD với GitHub Actions và Vercel", duration: 40 },
        { title: "Final Project: SaaS Landing Page", duration: 90, type: "project" },
      ],
    },
    {
      id: "course-figma-tailwind",
      title: "UI/UX Design System with Figma & Tailwind",
      titleVi: "UI/UX Design System với Figma & Tailwind",
      desc: "Học thiết kế UI/UX chuyên nghiệp với Figma và triển khai design system bằng Tailwind CSS. Phù hợp cả designer lẫn developer muốn làm đẹp UI.",
      descVi: "Học thiết kế UI/UX chuyên nghiệp với Figma và triển khai design system bằng Tailwind CSS. Phù hợp cả designer lẫn developer muốn làm đẹp UI.",
      price: 1_500_000,
      lpReward: 150,
      durationWeeks: 5,
      maxStudents: 80,
      status: "published",
      instructorName: "Mei Lin",
      lessons: [
        { title: "Figma interface và workflow cơ bản", duration: 30 },
        { title: "Components, Variants và Slots", duration: 45 },
        { title: "Auto Layout nâng cao", duration: 40 },
        { title: "Quiz: Figma Basics", duration: 15, type: "quiz" },
        { title: "Color system và typography scale", duration: 38 },
        { title: "Component library từ A đến Z", duration: 60 },
        { title: "Design tokens và variables", duration: 42 },
        { title: "Responsive & mobile-first design", duration: 40 },
        { title: "Tailwind CSS cơ bản và config", duration: 35 },
        { title: "Translate Figma to Tailwind", duration: 50 },
        { title: "Custom design system với Tailwind", duration: 48 },
        { title: "Final Project: Landing Page Design", duration: 60, type: "project" },
      ],
    },
    {
      id: "course-nodejs-postgres",
      title: "Node.js API & PostgreSQL: Production-Ready",
      titleVi: "Node.js API & PostgreSQL: Production-Ready",
      desc: "Xây dựng REST API production-ready với Node.js, TypeScript và PostgreSQL. Bao gồm authentication, caching, testing và deployment với Docker trên AWS.",
      descVi: "Xây dựng REST API production-ready với Node.js, TypeScript và PostgreSQL. Bao gồm authentication, caching, testing và deployment với Docker trên AWS.",
      price: 2_500_000,
      lpReward: 250,
      durationWeeks: 7,
      maxStudents: 60,
      status: "published",
      instructorName: "Ryo Hashimoto",
      lessons: [
        { title: "Node.js event loop và async programming", duration: 55 },
        { title: "Express.js architecture và middleware", duration: 48 },
        { title: "TypeScript cho Node.js", duration: 60 },
        { title: "PostgreSQL nâng cao: indexing và explain", duration: 70 },
        { title: "Prisma ORM và database migrations", duration: 55 },
        { title: "Redis caching patterns", duration: 45 },
        { title: "JWT, OAuth2 và refresh token strategy", duration: 65 },
        { title: "API testing với Jest và Supertest", duration: 58 },
        { title: "Docker và CI/CD pipeline", duration: 52 },
        { title: "Final Project: Production API", duration: 90, type: "project" },
      ],
    },
    {
      id: "course-kubernetes-devops",
      title: "Kubernetes & DevOps for Vietnamese Startup",
      titleVi: "Kubernetes & DevOps cho Startup Việt Nam",
      desc: "Từ container cơ bản đến Kubernetes orchestration cho startup Việt Nam. CI/CD pipeline, monitoring, và cloud-native architecture.",
      descVi: "Từ container cơ bản đến Kubernetes orchestration cho startup Việt Nam. CI/CD pipeline, monitoring, và cloud-native architecture.",
      price: 3_000_000,
      lpReward: 300,
      durationWeeks: 6,
      maxStudents: 40,
      status: "published",
      instructorName: "Shin Watanabe",
      lessons: [
        { title: "Docker fundamentals và container basics", duration: 50 },
        { title: "Docker Compose cho development environment", duration: 45 },
        { title: "Kubernetes core concepts: Pods, Services, Deployments", duration: 70 },
        { title: "ConfigMaps, Secrets và persistent storage", duration: 55 },
        { title: "Ingress, Networking và Service Mesh basics", duration: 60 },
        { title: "CI/CD với GitHub Actions và ArgoCD", duration: 65 },
        { title: "Helm charts và GitOps workflow", duration: 50 },
        { title: "Monitoring với Prometheus và Grafana", duration: 55 },
        { title: "Logging với ELK Stack", duration: 45 },
        { title: "Final Project: Deploy production-ready app", duration: 90, type: "project" },
      ],
    },
    {
      id: "course-seo-marketing",
      title: "SEO & Content Marketing for SaaS B2B",
      titleVi: "SEO & Content Marketing cho SaaS B2B",
      desc: "Chiến lược SEO và content marketing hiệu quả cho SaaS B2B. Từ keyword research đến link building và conversion optimization.",
      descVi: "Chiến lược SEO và content marketing hiệu quả cho SaaS B2B. Từ keyword research đến link building và conversion optimization.",
      price: 1_200_000,
      lpReward: 120,
      durationWeeks: 4,
      maxStudents: 120,
      status: "published",
      instructorName: "Yuna Park",
      lessons: [
        { title: "SEO fundamentals và search engine basics", duration: 35 },
        { title: "Keyword research với Ahrefs và SEMrush", duration: 50 },
        { title: "On-page SEO: meta tags, heading structure, content", duration: 45 },
        { title: "Technical SEO: Core Web Vitals, sitemap, robots", duration: 40 },
        { title: "Content strategy cho SaaS B2B", duration: 55 },
        { title: "Link building và authority building", duration: 45 },
        { title: "Quiz: SEO Fundamentals", duration: 15, type: "quiz" },
        { title: "Analytics và performance tracking", duration: 40 },
        { title: "Conversion optimization và CRO basics", duration: 50 },
        { title: "Final Project: SaaS SEO Audit & Plan", duration: 60, type: "project" },
      ],
    },
    {
      id: "course-rust-go",
      title: "High-Performance Rust & Go for Backend",
      titleVi: "High-Performance Rust & Go cho Backend",
      desc: "Khóa học hiệu năng cao với Rust và Go cho backend. Memory management, concurrency patterns, và systems programming cho web developers.",
      descVi: "Khóa học hiệu năng cao với Rust và Go cho backend. Memory management, concurrency patterns, và systems programming cho web developers.",
      price: 4_500_000,
      lpReward: 450,
      durationWeeks: 10,
      maxStudents: 30,
      status: "published",
      instructorName: "Rin Nakamura",
      lessons: [
        { title: "Go basics: syntax, types, và concurrency model", duration: 60 },
        { title: "Goroutines, channels và concurrent patterns", duration: 75 },
        { title: "Go standard library và web frameworks", duration: 55 },
        { title: "Rust ownership, borrowing và lifetimes", duration: 80 },
        { title: "Rust concurrency với async/await", duration: 70 },
        { title: "Performance profiling Go vs Rust", duration: 60 },
        { title: "Building REST API với Go Fiber", duration: 65 },
        { title: "Building REST API với Rust Axum", duration: 65 },
        { title: "Database drivers và ORMs", duration: 50 },
        { title: "Final Project: High-performance microservice", duration: 90, type: "project" },
      ],
    },
    {
      id: "course-python-ml",
      title: "Python ML & AI for Web Developers",
      titleVi: "Python ML & AI cho Web Developer",
      desc: "Machine Learning và AI integration cho web developers. Từ Python basics đến deploying ML models với FastAPI và cloud services.",
      descVi: "Machine Learning và AI integration cho web developers. Từ Python basics đến deploying ML models với FastAPI và cloud services.",
      price: 3_500_000,
      lpReward: 350,
      durationWeeks: 7,
      maxStudents: 50,
      status: "draft",
      instructorName: "Ryo Hashimoto",
      lessons: [
        { title: "Python fundamentals cho web developers", duration: 50 },
        { title: "NumPy và Pandas basics", duration: 60 },
        { title: "Scikit-learn: classification và regression", duration: 75 },
        { title: "Deep learning với PyTorch basics", duration: 80 },
        { title: "Building AI agents với LangChain", duration: 70 },
        { title: "Deploy ML models với FastAPI", duration: 65 },
        { title: "Final Project: AI-powered feature", duration: 90, type: "project" },
      ],
    },
  ];

  const createdCourses: Record<string, string> = {};
  for (const course of courses) {
    const instructorId = createdInstructors[course.instructorName];
    const existing = await prisma.course.findUnique({ where: { id: course.id } });
    const data = {
      title: course.title,
      titleVi: course.titleVi,
      description: course.desc,
      descriptionVi: course.descVi,
      type: "group",
      instructorId,
      price: course.price,
      lpReward: course.lpReward,
      maxStudents: course.maxStudents,
      durationWeeks: course.durationWeeks,
      status: course.status,
    };
    if (existing) {
      await prisma.course.update({ where: { id: existing.id }, data });
      createdCourses[course.id] = existing.id;
    } else {
      const created = await prisma.course.create({ data: { id: course.id, ...data } });
      createdCourses[course.id] = created.id;
    }
  }
  console.log(`  ✓ ${courses.length} courses`);

  // ── Lessons ──────────────────────────────────────────────────────────────
  let lessonCount = 0;
  for (const course of courses) {
    const courseId = createdCourses[course.id];
    for (let i = 0; i < course.lessons.length; i++) {
      const lesson = course.lessons[i];
      const orderIndex = (i + 1) * 10; // 10, 20, 30... for chapter grouping
      const lessonId = `${courseId}-lesson-${orderIndex}`;
      const existing = await prisma.lesson.findUnique({ where: { id: lessonId } });
      if (existing) {
        await prisma.lesson.update({
          where: { id: lessonId },
          data: {
            title: lesson.title,
            titleVi: lesson.title,
            durationMinutes: lesson.duration,
            orderIndex,
            isPublished: course.status === "published",
            content: lesson.type === "quiz"
              ? "Quiz section — questions auto-generated"
              : lesson.type === "project"
              ? "Project assignment — instructions in course materials"
              : null,
          },
        });
      } else {
        await prisma.lesson.create({
          data: {
            id: lessonId,
            courseId,
            title: lesson.title,
            titleVi: lesson.title,
            durationMinutes: lesson.duration,
            orderIndex,
            isPublished: course.status === "published",
            content: lesson.type === "quiz"
              ? "Quiz section — questions auto-generated"
              : lesson.type === "project"
              ? "Project assignment — instructions in course materials"
              : null,
          },
        });
      }
      lessonCount++;
    }
  }
  console.log(`  ✓ ${lessonCount} lessons`);

  // ── Enrollments & Student Progress ─────────────────────────────────────
  // Find admin user
  const adminUser = await prisma.user.findUnique({ where: { email: "admin@loop.vn" } });
  // Find CEO member
  const ceoMember = await prisma.teamMember.findUnique({ where: { slug: "bui-nhat-duc-anh" } });

  const students = [
    { name: "Trần Minh Khoa", email: "tranminhkhoa@example.com", courseId: "course-react-nextjs", progress: 0.85, lessonsDone: 18, totalLessons: 19, completed: false },
    { name: "Lê Thu Hằng", email: "lethuhang@example.com", courseId: "course-react-nextjs", progress: 1.0, lessonsDone: 19, totalLessons: 19, completed: true },
    { name: "Phạm Văn Đức", email: "phamvanduc@example.com", courseId: "course-react-nextjs", progress: 0.42, lessonsDone: 8, totalLessons: 19, completed: false },
    { name: "Nguyễn Thị Lan", email: "nguyenthilan@example.com", courseId: "course-figma-tailwind", progress: 1.0, lessonsDone: 12, totalLessons: 12, completed: true },
    { name: "Hoàng Văn Nam", email: "hoangvannam@example.com", courseId: "course-figma-tailwind", progress: 0.65, lessonsDone: 8, totalLessons: 12, completed: false },
    { name: "Vũ Thanh Tùng", email: "vuthanhtung@example.com", courseId: "course-nodejs-postgres", progress: 0.30, lessonsDone: 3, totalLessons: 10, completed: false },
    { name: "Đỗ Thị Mai", email: "dothimai@example.com", courseId: "course-nodejs-postgres", progress: 0.12, lessonsDone: 1, totalLessons: 10, completed: false },
    { name: "Lý Quốc Bảo", email: "lyquocbao@example.com", courseId: "course-kubernetes-devops", progress: 0.75, lessonsDone: 8, totalLessons: 10, completed: false },
    { name: "Ngô Hải Yến", email: "ngohaiyen@example.com", courseId: "course-seo-marketing", progress: 0.55, lessonsDone: 5, totalLessons: 10, completed: false },
    { name: "Trương Đình Phong", email: "truongdinhphong@example.com", courseId: "course-react-nextjs", progress: 0.08, lessonsDone: 2, totalLessons: 19, completed: false },
  ];

  let enrollmentCount = 0;
  for (const student of students) {
    const courseId = createdCourses[student.courseId];
    // Upsert user
    const pwHash = await hashPassword("student123");
    let user = await prisma.user.findUnique({ where: { email: student.email } });
    if (!user && adminUser) {
      user = await prisma.user.create({
        data: {
          email: student.email,
          name: student.name,
          passwordHash: pwHash,
          role: "viewer",
          isActive: true,
        },
      });
    }

    if (!user) continue;

    // Upsert enrollment
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: { courseId, userId: user.id },
    });

    if (existingEnrollment) {
      await prisma.enrollment.update({
        where: { id: existingEnrollment.id },
        data: {
          status: student.completed ? "completed" : "active",
          progressPercent: Math.round(student.progress * 100),
        },
      });
    } else {
      await prisma.enrollment.create({
        data: {
          courseId,
          userId: user.id,
          paidAmount: 0, // seed = free enrollments for demo
          status: student.completed ? "completed" : "active",
          progressPercent: Math.round(student.progress * 100),
        },
      });
    }

    // Get enrollment to add progress
    const enrollment = await prisma.enrollment.findFirst({
      where: { courseId, userId: user.id },
    });
    if (enrollment) {
      // Add completed lessons progress
      const course = courses.find((c) => c.id === student.courseId);
      if (course) {
        const safeLessonsDone = Math.min(student.lessonsDone, student.totalLessons);
        for (let i = 0; i < safeLessonsDone; i++) {
          const lessonId = `${courseId}-lesson-${(i + 1) * 10}`;
          await prisma.studentProgress.upsert({
            where: {
              enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId },
            },
            create: {
              enrollmentId: enrollment.id,
              lessonId,
              completedAt: new Date(Date.now() - (student.lessonsDone - i) * 3 * 24 * 60 * 60 * 1000),
            },
            update: {},
          });
        }
      }
      enrollmentCount++;
    }
  }

  // Enroll admin user in all courses
  if (adminUser) {
    for (const course of courses) {
      const courseId = createdCourses[course.id];
      const existing = await prisma.enrollment.findFirst({
        where: { courseId, userId: adminUser.id },
      });
      if (!existing) {
        await prisma.enrollment.create({
          data: {
            courseId,
            userId: adminUser.id,
            paidAmount: 0,
            status: "active",
            progressPercent: 0,
          },
        });
      }
    }
  }

  // Enroll CEO member in React course
  if (ceoMember) {
    const courseId = createdCourses["course-react-nextjs"];
    const existing = await prisma.enrollment.findFirst({
      where: { courseId, memberId: ceoMember.id },
    });
    if (!existing) {
      await prisma.enrollment.create({
        data: {
          courseId,
          memberId: ceoMember.id,
          paidAmount: 0,
          status: "completed",
          progressPercent: 100,
        },
      });
      const enrollment = await prisma.enrollment.findFirst({
        where: { courseId, memberId: ceoMember.id },
      });
      if (enrollment) {
        const course = courses.find((c) => c.id === "course-react-nextjs")!;
        for (let i = 0; i < course.lessons.length; i++) {
          const lessonId = `${courseId}-lesson-${(i + 1) * 10}`;
          await prisma.studentProgress.upsert({
            where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } },
            create: { enrollmentId: enrollment.id, lessonId, completedAt: new Date() },
            update: {},
          });
        }
      }
    }
  }

  console.log(`  ✓ ${enrollmentCount} student enrollments with progress`);
  console.log("  ✓ Academy seed complete");
}

// ══════════════════════════════════════════════════════════════════
// Quest & Company Event seed
// ══════════════════════════════════════════════════════════════════

async function seedQuests() {
  const quests = [
    // Daily
    { title: "Điểm danh hàng ngày", description: "Đăng nhập và check-in mỗi ngày để nhận thưởng LP", lpReward: 5, xpReward: 2, frequency: "daily", category: "engagement", icon: "CheckCircle", color: "#22C55E", target: 1, forRoles: ["staff", "manager", "admin"] },
    { title: "Gửi tin nhắn", description: "Gửi ít nhất 1 tin nhắn trong ngày", lpReward: 3, xpReward: 1, frequency: "daily", category: "social", icon: "MessageSquare", color: "#3B82F6", target: 1, forRoles: ["staff", "manager", "admin"] },
    { title: "Xem blog", description: "Đọc ít nhất 1 bài blog trong ngày", lpReward: 2, xpReward: 1, frequency: "daily", category: "engagement", icon: "BookOpen", color: "#8B5CF6", target: 1, forRoles: ["staff", "manager", "admin", "client"] },
    // Weekly
    { title: "Hoàn thành 3 tasks", description: "Hoàn thành ít nhất 3 tasks trong tuần", lpReward: 50, xpReward: 20, frequency: "weekly", category: "project", icon: "CheckSquare", color: "#06B6D4", target: 3, forRoles: ["staff", "manager"] },
    { title: "Viết blog", description: "Viết ít nhất 1 bài blog trong tuần", lpReward: 80, xpReward: 30, frequency: "weekly", category: "learning", icon: "PenTool", color: "#F59E0B", target: 1, forRoles: ["staff", "manager"] },
    { title: "Hoàn thành 1 khóa học", description: "Hoàn thành ít nhất 1 khóa học trong tuần", lpReward: 100, xpReward: 40, frequency: "weekly", category: "learning", icon: "GraduationCap", color: "#E0115F", target: 1, forRoles: ["staff", "manager", "admin"] },
    // Monthly
    { title: "Đánh giá 360°", description: "Hoàn thành đánh giá hiệu suất hàng tháng", lpReward: 200, xpReward: 80, frequency: "monthly", category: "achievement", icon: "Star", color: "#FFD700", target: 1, forRoles: ["staff", "manager", "admin"] },
    { title: "Giới thiệu 1 KH mới", description: "Giới thiệu ít nhất 1 khách hàng tiềm năng trong tháng", lpReward: 500, xpReward: 100, frequency: "monthly", category: "achievement", icon: "Users", color: "#818CF8", target: 1, forRoles: ["staff", "manager", "admin"] },
    // One-time
    { title: "First Blood", description: "Hoàn thành quest đầu tiên của bạn", lpReward: 20, xpReward: 10, frequency: "one_time", category: "achievement", icon: "Zap", color: "#EF4444", target: 1, forRoles: ["staff", "manager", "admin"] },
    { title: "Streak Master 30 ngày", description: "Điểm danh liên tục 30 ngày", lpReward: 1000, xpReward: 300, frequency: "one_time", category: "achievement", icon: "Flame", color: "#F97316", target: 30, forRoles: ["staff", "manager", "admin"] },
    // Client
    { title: "Đặt dịch vụ đầu tiên", description: "Hoàn tất đơn hàng dịch vụ đầu tiên", lpReward: 200, xpReward: 0, frequency: "client", category: "achievement", icon: "ShoppingCart", color: "#3B82F6", target: 1, forRoles: ["client"] },
    { title: "Đánh giá 5 sao", description: "Để lại đánh giá 5 sao cho dịch vụ đã sử dụng", lpReward: 100, xpReward: 0, frequency: "client", category: "achievement", icon: "Star", color: "#FFD700", target: 1, forRoles: ["client"] },
  ];

  let count = 0;
  for (const q of quests) {
    await prisma.quest.upsert({
      where: { id: q.title.toLowerCase().replace(/\s+/g, "-").slice(0, 50) },
      update: { lpReward: q.lpReward, xpReward: q.xpReward, isActive: true },
      create: {
        id: q.title.toLowerCase().replace(/\s+/g, "-").slice(0, 50),
        title: q.title,
        description: q.description,
        lpReward: q.lpReward,
        xpReward: q.xpReward,
        frequency: q.frequency,
        category: q.category,
        icon: q.icon,
        color: q.color,
        target: q.target,
        forRoles: q.forRoles,
        sortOrder: quests.indexOf(q),
      },
    });
    count++;
  }
  console.log(`  ✓ ${count} quests seeded`);
}

async function seedCompanyEvents() {
  const now = new Date();
  const year = now.getFullYear();

  const events = [
    {
      id: "spring-festival-2026",
      title: "Spring Festival 2026",
      description: "Tết Nguyên Đán 2026 — Thưởng LP bonus cho team events và social activities",
      type: "seasonal",
      startDate: new Date(`${year}-01-20T00:00:00.000Z`),
      endDate: new Date(`${year}-02-15T23:59:59.000Z`),
      lpBonus: 500,
      color: "#EF4444",
      icon: "Calendar",
      isActive: true,
    },
    {
      id: "hackathon-q1-2026",
      title: "Hackathon Internal Q1",
      description: "Cuộc thi nội bộ 48 giờ — Xây dựng tính năng mới cho LOOP Platform",
      type: "competition",
      startDate: new Date(`${year}-03-15T09:00:00.000Z`),
      endDate: new Date(`${year}-03-17T17:00:00.000Z`),
      lpBonus: 2000,
      color: "#818CF8",
      icon: "Code",
      isActive: true,
    },
    {
      id: "loop-anniversary",
      title: "LOOP Anniversary",
      description: "Kỷ niệm thành lập công ty — Tri ân thành viên và khách hàng",
      type: "celebration",
      startDate: new Date(`${year}-06-01T00:00:00.000Z`),
      endDate: new Date(`${year}-06-07T23:59:59.000Z`),
      lpBonus: 1000,
      color: "#FFD700",
      icon: "Award",
      isActive: false,
    },
  ];

  let count = 0;
  for (const e of events) {
    await prisma.companyEvent.upsert({
      where: { id: e.id },
      update: { title: e.title, lpBonus: e.lpBonus, isActive: e.isActive },
      create: e,
    });
    count++;
  }
  console.log(`  ✓ ${count} company events seeded`);
}
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
    await seedAcademy();
    await seedQuests();
    await seedCompanyEvents();

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
