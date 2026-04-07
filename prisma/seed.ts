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

  // super_admin (level 0): bypasses ALL permission checks
  const superAdminRole = await prisma.role.upsert({
    where: { name: "super_admin" },
    update: { level: 0, description: "Full system access — bypasses all permission checks" },
    create: {
      name: "super_admin",
      displayName: "Quản trị tối cao",
      description: "Full system access — bypasses all permission checks",
      color: "red",
      level: 0,
      isSystem: true,
    },
  });

  // Clear + grant wildcard permission to super_admin (bypass everything)
  await prisma.permission.deleteMany({ where: { roleId: superAdminRole.id } });
  await prisma.permission.create({
    data: { roleId: superAdminRole.id, resource: "*", action: "*", scope: "all" },
  });

  // admin (level 1): full operational access
  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: {
      name: "admin",
      displayName: "Administrator",
      description: "Full operational access",
      color: "indigo",
      level: 1,
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

  console.log("  ✓ Roles:", superAdminRole.name, adminRole.name, editorRole.name, viewerRole.name);

  // super_admin: wildcard permission (bypass everything — handled in code)
  // admin: grant ALL resource permissions so they can access all tabs
  // Note: requirePermissionFast() in permissions.ts bypasses admin via isAdmin() check,
  // but we seed explicit permissions for completeness
  const allResources = [
    "team", "services", "projects", "orders", "blog-posts", "academy",
    "figma-demos", "lp-awards", "lp-redemptions", "edu", "backlogs",
    "tasks", "standups", "deployments", "env-files", "git-commits",
    "social-posts", "handover", "sales-leads", "quotes",
    "web-templates", "service-attributes", "addon-services", "packages",
    "hosting-plans", "domain-prices", "pricing-features", "quote-requests",
    "customer-points", "users", "roles", "audit-log", "settings",
    "home-sliders", "landing-pages", "expertises", "testimonials",
    "messages", "websites", "points", "reward-tiers",
  ];
  const allActions = ["create", "read", "update", "delete", "export", "approve"] as const;

  await prisma.permission.deleteMany({ where: { roleId: adminRole.id } });
  for (const resource of allResources) {
    for (const action of allActions) {
      await prisma.permission.create({
        data: { roleId: adminRole.id, resource, action, scope: "all" },
      });
    }
  }
  console.log(`  ✓ Admin permissions: ${allResources.length} resources × ${allActions.length} actions`);
}

// ══════════════════════════════════════════════════════════════════
// 2. Admin User
// ══════════════════════════════════════════════════════════════════

async function seedAdmin() {
  console.log("\n[Admin] Seeding admin user...");

  const passwordHash = await hashPassword("admin123");

  // upsert: create if not exists, or update accountType if it already does
  const admin = await prisma.user.upsert({
    where: { email: "admin@loop.vn" },
    update: {
      name: "Admin",
      passwordHash,
      role: "super_admin",
      accountType: "staff",
      isActive: true,
    },
    create: {
      email: "admin@loop.vn",
      name: "Admin",
      passwordHash,
      role: "super_admin",
      accountType: "staff",
      isActive: true,
    },
  });
  console.log(`  ✓ Admin upserted: ${admin.email} / admin123`);

  // Assign super_admin role (level 0) — bypasses ALL permission checks
  const superAdminRole = await prisma.role.findUnique({ where: { name: "super_admin" } });
  const adminRole = await prisma.role.findUnique({ where: { name: "admin" } });

  await prisma.userRole.deleteMany({ where: { userId: admin.id } });

  if (superAdminRole) {
    await prisma.userRole.create({ data: { userId: admin.id, roleId: superAdminRole.id, isActive: true } });
    console.log("  ✓ super_admin role assigned (level 0 — bypasses everything)");
  } else {
    // Fallback to admin role
    if (adminRole) {
      await prisma.userRole.create({ data: { userId: admin.id, roleId: adminRole.id, isActive: true } });
      console.log("  ✓ admin role assigned (fallback — level 1)");
    }
  }

  return admin;
}

// ══════════════════════════════════════════════════════════════════
// 2b. Access Tags (Member Onboarding v3)
async function seedAccessTags() {
  console.log("\n[AccessTags] Seeding member onboarding tags...");

  const tags = [
    // Default tags — all members get these automatically (cannot revoke)
    { slug: "kanban",       label: "Kanban Board",    description: "Truy cập Kanban Board và xem công việc",   color: "#14B8A6", isDefault: true  },
    { slug: "order-basic",  label: "Xem đơn hàng",   description: "Chỉ xem đơn hàng, không chỉnh sửa",         color: "#64748B", isDefault: true  },

    // Content management
    { slug: "blog-post",          label: "Quản trị bài viết",  description: "Tạo / sửa / xóa blog công ty",            color: "#8B5CF6", isDefault: false },
    { slug: "project-content",     label: "Nội dung dự án",    description: "Quản lý nội dung dự án, demo links",         color: "#6366F1", isDefault: false },
    { slug: "seo-content",         label: "Nội dung SEO",       description: "Quản lý SEO tags, GSC data, meta",          color: "#22C55E", isDefault: false },
    { slug: "media-content",       label: "Nội dung Media",     description: "Upload / quản lý hình ảnh và video",        color: "#EC4899", isDefault: false },
    { slug: "portfolio-manage",     label: "Quản lý Portfolio", description: "CRUD dự án portfolio và demo links",        color: "#F59E0B", isDefault: false },

    // Operations
    { slug: "order-manage",        label: "Quản lý đơn hàng",  description: "CRUD đơn hàng, gán PM, chat với khách",  color: "#3B82F6", isDefault: false },
    { slug: "client-manage",       label: "Quản lý khách hàng",description: "CRM, profiles, referral codes",           color: "#10B981", isDefault: false },
    { slug: "quotation-manage",    label: "Quản lý báo giá",   description: "Cấu hình pricing wizard và quotes",       color: "#F97316", isDefault: false },

    // HR / Finance
    { slug: "hr-manage",           label: "Quản lý nhân sự",   description: "CRUD members, departments, invitation",      color: "#A855F7", isDefault: false },
    { slug: "salary",              label: "Xem lương",          description: "Truy cập thông tin lương (threshold)",      color: "#EF4444", isDefault: false },
    { slug: "lp-manage",          label: "Quản lý LP",        description: "Duyệt LP awards, xem LP transactions",     color: "#EAB308", isDefault: false },
    { slug: "finance-view",        label: "Xem tài chính",     description: "Xem revenue, báo cáo tài chính",          color: "#84CC16", isDefault: false },
    { slug: "finance-manage",      label: "Quản lý tài chính", description: "CRUD financial data, thuế, web packages",  color: "#0EA5E9", isDefault: false },

    // Academy / QA
    { slug: "academy-manage",      label: "Quản lý học viện",  description: "CRUD courses, enrollments, instructors",   color: "#818CF8", isDefault: false },
    { slug: "qa-manage",           label: "Quản lý QA",        description: "Bug tracking, testing, test cases",        color: "#22D3EE", isDefault: false },
  ];

  let count = 0;
  for (const tag of tags) {
    await prisma.accessTag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    });
    count++;
  }
  console.log(`  ✓ ${count} access tags seeded`);
}

// ══════════════════════════════════════════════════════════════════
// 2c. Sample Pending Member Request (demo)
async function seedMemberRequests() {
  console.log("\n[MemberRequests] Seeding sample pending requests...");

  // SEO Specialist pending approval
  await prisma.memberRequest.upsert({
    where: { email: "seo@loop.vn" },
    update: { status: "pending" },
    create: {
      email: "seo@loop.vn",
      name: "Nguyễn Văn SEO",
      department: "marketing",
      proposedRole: "member",
      proposedTags: ["blog-post", "seo-content", "kanban", "order-basic"],
      status: "pending",
    },
  });

  // Media Designer pending approval
  await prisma.memberRequest.upsert({
    where: { email: "media@loop.vn" },
    update: { status: "pending" },
    create: {
      email: "media@loop.vn",
      name: "Trần Thị Media",
      department: "media",
      proposedRole: "member",
      proposedTags: ["blog-post", "media-content", "kanban", "order-basic"],
      status: "pending",
    },
  });

  console.log("  ✓ 2 pending member requests seeded");
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
        categoryEn: null,
        icon: skill.icon,
        isActive: true,
        sortOrder: skill.sortOrder,
      },
    });
  }
  console.log(`  ✓ ${expertises.length} developer skills`);
}

// ══════════════════════════════════════════════════════════════════
// 8. Services (Public — used by /api/v1/services)
// NOTE: Only base fields (title, shortDescription, features, etc.) are seeded.
// Localization fields (titleEn/Ja/Ko/Zh etc.) require DB migration.
// They default to null on create and can be added via Admin CMS.

async function seedServices() {
  console.log("\n[Services] Seeding public services...");

  const services = [
    {
      slug: 'web-design',
      icon: 'Globe',
      title: 'Thiết kế Website',
      titleEn: 'Web Design & Development',
      shortDescription: 'Thiết kế website chuyên nghiệp, tối ưu SEO, responsive trên mọi thiết bị.',
      shortDescriptionEn: 'Professional website design, SEO optimized, responsive across all devices.',
      longDescription: 'Chúng tôi xây dựng website với công nghệ hiện đại nhất, đảm bảo tốc độ load nhanh, bảo mật cao và dễ dàng quản trị nội dung.',
      longDescriptionEn: 'We build websites with the latest technology, ensuring fast loading, high security, and easy content management.',
      features: ['Giao diện hiện đại', 'Responsive mobile', 'SEO tối ưu', 'Tốc độ nhanh', 'Bảo mật cao', 'Quản trị dễ dàng'],
      featuresEn: ['Modern design', 'Mobile responsive', 'SEO optimized', 'Fast loading', 'High security', 'Easy CMS'],
      technologies: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Node.js'],
      startingPrice: 1_980_000,
      deliveryTime: '2-4 tuần',
      category: 'Development',
    },
    {
      slug: 'app-development',
      icon: 'Smartphone',
      title: 'Ứng dụng di động',
      titleEn: 'Mobile App Development',
      shortDescription: 'Phát triển ứng dụng iOS, Android native hoặc cross-platform với React Native.',
      shortDescriptionEn: 'Develop iOS, Android native or cross-platform apps with React Native.',
      longDescription: 'Ứng dụng di động với trải nghiệm người dùng mượt mà, hiệu suất cao, tích hợp push notification và đồng bộ dữ liệu real-time.',
      longDescriptionEn: 'Mobile apps with smooth UX, high performance, push notifications, and real-time data sync.',
      features: ['iOS & Android', 'Cross-platform', 'Push notification', 'Offline mode', 'Biometric auth', 'Real-time sync'],
      featuresEn: ['iOS & Android', 'Cross-platform', 'Push notifications', 'Offline mode', 'Biometric auth', 'Real-time sync'],
      technologies: ['React Native', 'TypeScript', 'Firebase', 'Expo', 'GraphQL'],
      startingPrice: 19_980_000,
      deliveryTime: '4-8 tuần',
      category: 'Development',
    },
    {
      slug: 'tech-support-software',
      icon: 'BarChart3',
      title: 'Phần mềm hỗ trợ kỹ thuật',
      titleEn: 'Technical Support Software',
      shortDescription: 'Công cụ hỗ trợ nội bộ, quản lý dữ liệu, tự động hóa quy trình cho doanh nghiệp.',
      shortDescriptionEn: 'Internal tools, data management, process automation software for businesses.',
      longDescription: 'Xây dựng công cụ hỗ trợ nội bộ, hệ thống quản lý dữ liệu, tự động hóa quy trình với chi phí hợp lý.',
      longDescriptionEn: 'Build internal support tools, data management systems, process automation with affordable cost.',
      features: ['Quản lý dữ liệu nội bộ', 'Tự động hóa quy trình', 'Báo cáo & thống kê', 'API kết nối hệ thống', 'Cloud & on-premise', 'Hỗ trợ kỹ thuật 24/7'],
      featuresEn: ['Internal data management', 'Process automation', 'Reports & analytics', 'API integrations', 'Cloud & on-premise', '24/7 tech support'],
      technologies: ['Next.js', 'Prisma', 'PostgreSQL', 'Node.js', 'Docker'],
      startingPrice: 200000,
      deliveryTime: '1-4 tuần',
      category: 'Development',
    },
    {
      slug: 'seo-marketing',
      icon: 'Search',
      title: 'SEO & Marketing',
      titleEn: 'SEO & Digital Marketing',
      shortDescription: '10 bài chuẩn SEO theo doanh nghiệp (có sẵn assets). Tăng trưởng organic bền vững với chi phí minh bạch.',
      shortDescriptionEn: '10 SEO articles per business (ready assets). Sustainable organic growth with transparent pricing.',
      longDescription: 'Gói SEO chuẩn: 200,000 VNĐ/10 bài (có assets sẵn). 30 bài/tháng: 600,000 VNĐ. Gói dài hạn giảm 10%-30%.',
      longDescriptionEn: 'SEO packages: 200,000 VND/10 articles (ready assets). 30 articles/month: 600,000 VND. Long-term packages save 10%-30%.',
      features: ['10 bài chuẩn SEO có assets', '30 bài/tháng: 600,000 VNĐ', 'Gói 6 tháng: giảm 10%', 'Gói 1 năm: giảm 20%', 'Gói 2 năm: giảm 30%', 'Content theo doanh nghiệp'],
      featuresEn: ['10 SEO-ready articles with assets', '30 articles/month: 600,000 VND', '6-month package: 10% off', '1-year package: 20% off', '2-year package: 30% off', 'Business-specific content'],
      technologies: ['Google Analytics', 'Search Console', 'Ahrefs', 'SEMrush', 'Google Tag Manager'],
      startingPrice: 200000,
      deliveryTime: '1 tháng',
      category: 'Marketing',
    },
  ];

  for (let i = 0; i < services.length; i++) {
    const svc = services[i];
    await prisma.service.upsert({
      where: { slug: svc.slug },
      create: {
        slug: svc.slug,
        icon: svc.icon,
        title: svc.title,
        titleEn: svc.titleEn,
        shortDescription: svc.shortDescription,
        shortDescriptionEn: svc.shortDescriptionEn,
        longDescription: svc.longDescription,
        longDescriptionEn: svc.longDescriptionEn,
        features: svc.features,
        featuresEn: svc.featuresEn,
        technologies: svc.technologies,
        startingPrice: svc.startingPrice,
        deliveryTime: svc.deliveryTime,
        category: svc.category,
        isActive: true,
        sortOrder: i,
      },
      update: {
        icon: svc.icon,
        title: svc.title,
        titleEn: svc.titleEn,
        shortDescription: svc.shortDescription,
        shortDescriptionEn: svc.shortDescriptionEn,
        longDescription: svc.longDescription,
        longDescriptionEn: svc.longDescriptionEn,
        features: svc.features,
        featuresEn: svc.featuresEn,
        technologies: svc.technologies,
        startingPrice: svc.startingPrice,
        deliveryTime: svc.deliveryTime,
        category: svc.category,
        isActive: true,
        sortOrder: i,
      },
    });
  }
  console.log('  ✓ ' + services.length + ' services');
}

// 9. Addon Services// 9. Addon Services
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
        titleEn: "Professional Website Design",
        titleJa: "プロフェッショナルウェブサイトデザイン",
        titleKo: "전문 웹사이트 디자인",
        titleZh: "专业网站设计",
        subtitleEn: "Turn your ideas into digital reality",
        subtitleJa: "アイデアをデジタル現実に変える",
        subtitleKo: "아이디어를 디지털 현실로 바꾸세요",
        subtitleZh: "将您的想法变为数字现实",
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
    { key: "vat_rate", value: "0.1", group: "pricing" },  // 10% VAT — used by /api/pricing/config
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
          bioEn: inst.bio ?? null,
          bioJa: null,
          bioKo: null,
          bioZh: null,
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
          bioEn: inst.bio ?? null,
          bioJa: null,
          bioKo: null,
          bioZh: null,
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
      title: "React & Next.js 14 Từ Zero Đến Hero",
      titleVi: "React & Next.js 14 Từ Zero Đến Hero",
      titleEn: "React & Next.js 14: Zero to Production Hero",
      titleJa: "React & Next.js 14：ゼロからプロダクションヒーローへ",
      titleKo: "React & Next.js 14: 제로에서 프로덕션 히어로까지",
      titleZh: "React & Next.js 14：从零到生产级专家",
      desc: "Khóa học toàn diện nhất về React 18 và Next.js 14 tại Việt Nam. Từ nền tảng đến production-ready app. Bao gồm Server Components, Streaming, Caching, TypeScript, Tailwind và deployment trên Vercel.",
      descVi: "Khóa học toàn diện nhất về React 18 và Next.js 14 tại Việt Nam. Từ nền tảng đến production-ready app. Bao gồm Server Components, Streaming, Caching, TypeScript, Tailwind và deployment trên Vercel.",
      descEn: "The most comprehensive React 18 & Next.js 14 course in Vietnam. From fundamentals to production-ready apps. Covers Server Components, Streaming, Caching, TypeScript, Tailwind, and Vercel deployment.",
      descJa: "ベトナムで最も総合的なReact 18＆Next.js 14コース。基礎からプロダクション対応アプリまで。Server Components、Streaming、キャシング、TypeScript、Tailwind、Vercelへのデプロイメントをカバーします。",
      descKo: "베트남에서 가장 종합적인 React 18 및 Next.js 14 과정. 기초부터 프로덕션 준비 완료 앱까지. Server Components, Streaming, Caching, TypeScript, Tailwind 및 Vercel 배포를 다룹니다.",
      descZh: "越南最全面的React 18和Next.js 14课程。从基础到生产级应用。涵盖Server Components、Streaming、Caching、TypeScript、Tailwind和Vercel部署。",
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
      title: "UI/UX Design System với Figma & Tailwind",
      titleVi: "UI/UX Design System với Figma & Tailwind",
      titleEn: "UI/UX Design Systems with Figma & Tailwind CSS",
      titleJa: "FigmaとTailwind CSSによるUI/UXデザインシステム",
      titleKo: "Figma 및 Tailwind CSS를 활용한 UI/UX 디자인 시스템",
      titleZh: "Figma与Tailwind CSS的UI/UX设计系统",
      desc: "Học thiết kế UI/UX chuyên nghiệp với Figma và triển khai design system bằng Tailwind CSS. Phù hợp cả designer lẫn developer muốn làm đẹp UI.",
      descVi: "Học thiết kế UI/UX chuyên nghiệp với Figma và triển khai design system bằng Tailwind CSS. Phù hợp cả designer lẫn developer muốn làm đẹp UI.",
      descEn: "Master professional UI/UX design with Figma and implement a complete design system using Tailwind CSS. Perfect for both designers and developers who want to create beautiful interfaces.",
      descJa: "FigmaでプロフェッショナルなUI/UXデザインをマスターし、Tailwind CSSを使用して完全なデザインシステムを実装します。美しいインターフェースを作成したいデザイナーと開発者の両方に最適です。",
      descKo: "Figma로 전문적인 UI/UX 디자인을 마스터하고 Tailwind CSS를 사용하여 완전한 디자인 시스템을 구현합니다. 아름다운 인터페이스를 만들고 싶은 디자이너와 개발자에게 이상적입니다.",
      descZh: "掌握Figma专业UI/UX设计，使用Tailwind CSS实现完整的设计系统。非常适合希望创建精美界面的设计师和开发人员。",
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
      titleEn: "Node.js API & PostgreSQL: Production-Ready Backend",
      titleJa: "Node.js APIとPostgreSQL：プロダクション対応バックエンド",
      titleKo: "Node.js API 및 PostgreSQL: 프로덕션 준비 완료 백엔드",
      titleZh: "Node.js API和PostgreSQL：生产级后端",
      desc: "Xây dựng REST API production-ready với Node.js, TypeScript và PostgreSQL. Bao gồm authentication, caching, testing và deployment với Docker trên AWS.",
      descVi: "Xây dựng REST API production-ready với Node.js, TypeScript và PostgreSQL. Bao gồm authentication, caching, testing và deployment với Docker trên AWS.",
      descEn: "Build production-ready REST APIs with Node.js, TypeScript, and PostgreSQL. Covers authentication, caching, testing, and Docker deployment on AWS.",
      descJa: "Node.js、TypeScript、PostgreSQLでプロダクション対応REST APIを構築します。認証、キャシング、テスト、DockerによるAWSへのデプロイメントをカバーします。",
      descKo: "Node.js, TypeScript, PostgreSQL로 프로덕션 준비 REST API를 구축합니다. 인증, 캐싱, 테스트, Docker를 통한 AWS 배포를 다룹니다.",
      descZh: "使用Node.js、TypeScript和PostgreSQL构建生产级REST API。包括认证、缓存、测试和Docker部署到AWS。",
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
      title: "Kubernetes & DevOps cho Startup Việt Nam",
      titleVi: "Kubernetes & DevOps cho Startup Việt Nam",
      titleEn: "Kubernetes & DevOps for Startups",
      titleJa: "スタートアップ向けKubernetesとDevOps",
      titleKo: "스타트업을 위한 Kubernetes 및 DevOps",
      titleZh: "面向初创公司的Kubernetes与DevOps",
      desc: "Từ container cơ bản đến Kubernetes orchestration cho startup Việt Nam. CI/CD pipeline, monitoring, và cloud-native architecture.",
      descVi: "Từ container cơ bản đến Kubernetes orchestration cho startup Việt Nam. CI/CD pipeline, monitoring, và cloud-native architecture.",
      descEn: "From Docker basics to Kubernetes orchestration for Vietnamese startups. Covers CI/CD pipelines, monitoring, and cloud-native architecture.",
      descJa: "Docker基礎からベトナムスタートアップ向けKubernetesオーケストレーションまで。CI/CDパイプライン、モニタリング、クラウドネイティブアーキテクチャをカバーします。",
      descKo: "Docker 기초부터 베트남 스타트업용 Kubernetes 오케스트레이션까지. CI/CD 파이프라인, 모니터링, 클라우드 네이티브 아키텍처를 다룹니다.",
      descZh: "从Docker基础到面向越南初创公司的Kubernetes编排。涵盖CI/CD管道、监控和云原生架构。",
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
      title: "SEO & Content Marketing cho SaaS B2B",
      titleVi: "SEO & Content Marketing cho SaaS B2B",
      titleEn: "SEO & Content Marketing for SaaS B2B",
      titleJa: "SaaS B2B向けSEO＆コンテンツマーケティング",
      titleKo: "SaaS B2B를 위한 SEO 및 콘텐츠 마케팅",
      titleZh: "SaaS B2B的SEO和内容营销",
      desc: "Chiến lược SEO và content marketing hiệu quả cho SaaS B2B. Từ keyword research đến link building và conversion optimization.",
      descVi: "Chiến lược SEO và content marketing hiệu quả cho SaaS B2B. Từ keyword research đến link building và conversion optimization.",
      descEn: "Effective SEO and content marketing strategy for SaaS B2B. From keyword research to link building and conversion optimization.",
      descJa: "SaaS B2Bのための効果的なSEOとコンテンツマーケティング戦略。キーワードリサーチからリンクビルディング、コンバージョン最適化まで。",
      descKo: "SaaS B2B를 위한 효과적인 SEO 및 콘텐츠 마케팅 전략. 키워드 리서치부터 링크 빌딩, 전환 최적화까지.",
      descZh: "面向SaaS B2B的有效SEO和内容营销策略。从关键词研究到链接建设和转化优化。",
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
      title: "High-Performance Rust & Go cho Backend",
      titleVi: "High-Performance Rust & Go cho Backend",
      titleEn: "High-Performance Rust & Go for Backend",
      titleJa: "バックエンド向け高性能Rust＆Go",
      titleKo: "백엔드를 위한 고성능 Rust 및 Go",
      titleZh: "面向后端的高性能Rust和Go",
      desc: "Khóa học hiệu năng cao với Rust và Go cho backend. Memory management, concurrency patterns, và systems programming cho web developers.",
      descVi: "Khóa học hiệu năng cao với Rust và Go cho backend. Memory management, concurrency patterns, và systems programming cho web developers.",
      descEn: "High-performance backend development with Rust and Go. Covers memory management, concurrency patterns, and systems programming for web developers.",
      descJa: "RustとGoによる高性能バックエンド開発。メモリ管理、並行性パターン、Web開発者のためのシステムプログラミングをカバーします。",
      descKo: "Rust와 Go를 활용한 고성능 백엔드 개발. 메모리 관리, 동시성 패턴, 웹 개발자를 위한 시스템 프로그래밍을 다룹니다.",
      descZh: "使用Rust和Go进行高性能后端开发。涵盖内存管理、并发模式和面向Web开发人员的系统编程。",
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
      titleEn: "Python Machine Learning & AI for Web Developers",
      titleJa: "Web開発者のためのPython機械学習とAI",
      titleKo: "웹 개발자를 위한 Python 머신러닝 및 AI",
      titleZh: "面向Web开发人员的Python机器学习和AI",
      desc: "Machine Learning và AI integration cho web developers. Từ Python basics đến deploying ML models với FastAPI và cloud services.",
      descVi: "Machine Learning và AI integration cho web developers. Từ Python basics đến deploying ML models với FastAPI và cloud services.",
      descEn: "Machine Learning and AI integration for web developers. From Python basics to deploying ML models with FastAPI and cloud services.",
      descJa: "Web開発者のための機械学習とAIの統合。Pythonの基礎からFastAPIとクラウドサービスでのMLモデルのデプロイメントまで。",
      descKo: "웹 개발자를 위한 머신러닝 및 AI 통합. Python 기초부터 FastAPI 및 클라우드 서비스로 ML 모델 배포까지.",
      descZh: "面向Web开发人员的机器学习和AI集成。从Python基础到使用FastAPI和云服务部署ML模型。",
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
      titleEn: course.titleEn ?? null,
      titleJa: course.titleJa ?? null,
      titleKo: course.titleKo ?? null,
      titleZh: course.titleZh ?? null,
      description: course.desc ?? course.titleVi,
      descriptionVi: course.descVi,
      descriptionEn: course.descEn ?? null,
      descriptionJa: course.descJa ?? null,
      descriptionKo: course.descKo ?? null,
      descriptionZh: course.descZh ?? null,
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
            titleEn: lesson.title,
            titleJa: null,
            titleKo: null,
            titleZh: null,
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
            titleEn: lesson.title,
            titleJa: null,
            titleKo: null,
            titleZh: null,
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
// R2 — UNIFIED SEED DATA (2026-03-30)
// Canonical: LP/level/rank from memberData.ts; orders from loopStore INIT_ORDERS;
//   effects from loopStore INIT_EFFECTS; quests/events from authStore INIT_QUESTS/INIT_EVENTS
// ══════════════════════════════════════════════════════════════════

// ── Seed all 26 team members (CEO already seeded) ─────────────────────────────
async function seedAllTeamMembers() {
  console.log("\n[R2-TeamMembers] Seeding 26 team members...");

  // memberData.ts canonical LP values (source of truth per fe-reseed-plan)
  const members = [
    // id=1: Kai Tanaka
    { slug: "kai-tanaka",       name: "Kai Tanaka",          title: "Junior Operative",          bio: "Thanh kiếm vẫn đang được rèn giũa. Tiềm năng thô đang chờ đợi ngọn lửa kinh nghiệm.",     shortBio: "Frontend Dev chuyên Vue.js & CSS Animations.",  level: 8,   rank: "iron",     availableLp: 850,   totalEarnedLp: 1200,  totalSpentLp: 350,  currentXp: 45,  maxXp: 100, isActive: true,  isFeatured: false, sortOrder: 1 },
    // id=2: Mei Lin
    { slug: "mei-lin",           name: "Mei Lin",              title: "Visual Artisan",            bio: "Một hòn than hồng rực cháy ổn định. Kỹ năng sắc bén qua từng chu kỳ thiết kế.",                    shortBio: "UI/UX Designer — Design Systems & Figma.",          level: 24,  rank: "bronze",   availableLp: 3200,  totalEarnedLp: 8500,  totalSpentLp: 5300, currentXp: 78,  maxXp: 100, isActive: true,  isFeatured: false, sortOrder: 2 },
    // id=3: Ryo Hashimoto
    { slug: "ryo-hashimoto",     name: "Ryo Hashimoto",        title: "Code Sentinel",           bio: "Những con đường bạc được khắc qua vô số cơn bão debug. API phải tuân lệnh anh.",            shortBio: "Backend Dev — Node.js & Microservices.",          level: 43,  rank: "silver",   availableLp: 8500,  totalEarnedLp: 22000, totalSpentLp: 13500, currentXp: 62,  maxXp: 100, isActive: true,  isFeatured: false, sortOrder: 3 },
    // id=4: Yuna Park
    { slug: "yuna-park",         name: "Yuna Park",            title: "Dual-Path Operative",     bio: "Nơi mã nguồn gặp gỡ nghệ thuật — Yuna điều khiển cả hai với sự uyển chuyển tự nhiên.", shortBio: "Full Stack Dev — React & System Architecture.", level: 68,  rank: "gold",     availableLp: 15800, totalEarnedLp: 65000, totalSpentLp: 49200, currentXp: 85,  maxXp: 100, isActive: true,  isFeatured: false, sortOrder: 4 },
    // id=5: Shin Watanabe
    { slug: "shin-watanabe",    name: "Shin Watanabe",         title: "Infrastructure Warden",   bio: "Người thì thầm với hạ tầng. Không hệ thống nào thoát khỏi trật tự của anh.",              shortBio: "DevOps Engineer — Kubernetes & CI/CD.",               level: 85,  rank: "platinum", availableLp: 28500, totalEarnedLp: 142000,totalSpentLp: 113500,currentXp: 40,  maxXp: 100, isActive: true,  isFeatured: false, sortOrder: 5 },
    // id=6: Rin Nakamura
    { slug: "rin-nakamura",      name: "Rin Nakamura",           title: "Crimson Architect",        bio: "Sự chính xác đầy quyết đoán. Mọi hàm số là một đòn tấn công.",                            shortBio: "Backend Lead — High-Performance Systems.",            level: 103, rank: "ruby",     availableLp: 52000, totalEarnedLp: 380000,totalSpentLp: 328000,currentXp: 60,  maxXp: 100, isActive: true,  isFeatured: false, sortOrder: 6 },
    // id=7: Akira Sato
    { slug: "akira-sato",        name: "Akira Sato",             title: "Guild Master",             bio: "Đặc vụ đỉnh cao. Một huyền thoại được khắc trên silicon và ánh sao. Guild cúi chào.", shortBio: "Tech Lead — Vision & System Architecture.",       level: 118, rank: "diamond",  availableLp: 98000, totalEarnedLp: 820000,totalSpentLp: 722000,currentXp: 92,  maxXp: 100, isActive: true,  isFeatured: true,  sortOrder: 7 },
    // id=8: Trần Hữu Phúc
    { slug: "tran-huu-phuc",     name: "Trần Hữu Phúc",         title: "Senior Operative",       bio: "Sự chính xác trong từng pixel. Một bậc thầy của nghệ thuật dàn trang.",                        shortBio: "Frontend Dev — Tailwind CSS & React Hooks.",         level: 28,  rank: "bronze",   availableLp: 4500,  totalEarnedLp: 12000, totalSpentLp: 7500,  currentXp: 32,  maxXp: 100, isActive: true,  isFeatured: false, sortOrder: 8 },
    // id=9: Nguyễn Minh Thư
    { slug: "nguyen-minh-thu",   name: "Nguyễn Minh Thư",       title: "Creative Artisan",         bio: "Thiết kế những giao diện đầy sức sống.",                                                   shortBio: "UI Designer — Minimalist UX & Visual Systems.",    level: 48,  rank: "silver",   availableLp: 7800,  totalEarnedLp: 25000, totalSpentLp: 17200, currentXp: 65,  maxXp: 100, isActive: true,  isFeatured: false, sortOrder: 9 },
    // id=10: Lê Văn Nam
    { slug: "le-van-nam",        name: "Lê Văn Nam",             title: "Junior Operative",        bio: "Lặng lẽ, hiệu quả và sắc bén trong việc sửa lỗi.",                                      shortBio: "Backend Dev — API Development & SQL Optimization.", level: 12,  rank: "iron",     availableLp: 1200,  totalEarnedLp: 2500,  totalSpentLp: 1300,  currentXp: 85,  maxXp: 100, isActive: true,  isFeatured: false, sortOrder: 10 },
    // id=11: Phạm Hoàng Long
    { slug: "pham-hoang-long",    name: "Phạm Hoàng Long",        title: "System Guardian",          bio: "Bảo vệ ranh giới hệ thống. Đảm bảo luồng dữ liệu không bao giờ bị gián đoạn.",           shortBio: "DevOps — AWS & Kubernetes.",                       level: 65,  rank: "gold",     availableLp: 12500, totalEarnedLp: 58000, totalSpentLp: 45500, currentXp: 22,  maxXp: 100, isActive: true,  isFeatured: false, sortOrder: 11 },
    // id=12: Đặng Mỹ Linh
    { slug: "dang-my-linh",       name: "Đặng Mỹ Linh",           title: "Strategic Overseer",      bio: "Điều phối các chiến dịch phức tạp với sự điềm tĩnh thiền định.",                     shortBio: "Project Manager — Agile Strategy & Resource Mgmt.", level: 88,  rank: "platinum", availableLp: 32000, totalEarnedLp: 135000,totalSpentLp: 103000,currentXp: 45,  maxXp: 100, isActive: true,  isFeatured: false, sortOrder: 12 },
    // id=13: Vũ Đình Trọng
    { slug: "vu-dinh-trong",      name: "Vũ Đình Trọng",          title: "Quality Sentry",          bio: "Không lỗi nào thoát khỏi tầm mắt của lính gác.",                                       shortBio: "QA Lead — Automated Testing & Security Audits.",    level: 52,  rank: "silver",   availableLp: 6200,  totalEarnedLp: 22000, totalSpentLp: 15800, currentXp: 15,  maxXp: 100, isActive: true,  isFeatured: false, sortOrder: 13 },
    // id=14: Haru Tanaka (Media Manager — matches DEMO_USERS.manager_media)
    { slug: "haru-tanaka",       name: "Haru Tanaka",            title: "Media Artisan",            bio: "Kiến trúc sư của hình ảnh và âm thanh. Mỗi khung hình là một tuyên bố nghệ thuật.",        shortBio: "Media Manager — Media Production & Brand Identity.",  level: 72,  rank: "ruby",     availableLp: 45000, totalEarnedLp: 175000,totalSpentLp: 130000,currentXp: 88,  maxXp: 100, isActive: true,  isFeatured: false, sortOrder: 14 },
    // id=15: Lý Gia Hưng
    { slug: "ly-gia-hung",       name: "Lý Gia Hưng",            title: "Data Oracle",             bio: "Nhìn thấy các mô hình nơi người khác chỉ thấy sự nhiễu loạn.",                              shortBio: "Data Scientist — Predictive Analytics & AI Models.",   level: 82,  rank: "platinum", availableLp: 24000, totalEarnedLp: 110000,totalSpentLp: 86000, currentXp: 38,  maxXp: 100, isActive: true,  isFeatured: false, sortOrder: 15 },
    // id=16: Dương Bảo Ngọc
    { slug: "duong-bao-ngoc",     name: "Dương Bảo Ngọc",         title: "Vocal Vanguard",          bio: "Khuếch đại tiếng vang của guild khắp cõi hư vô kỹ thuật số.",                           shortBio: "Marketing Lead — Growth Hacking & Brand Narrative.",  level: 62,  rank: "gold",     availableLp: 11200, totalEarnedLp: 45000, totalSpentLp: 33800, currentXp: 55,  maxXp: 100, isActive: true,  isFeatured: false, sortOrder: 16 },
    // id=17: Bùi Tiến Dũng
    { slug: "bui-tien-dung",     name: "Bùi Tiến Dũng",          title: "Mobile Specialist",       bio: "Xây dựng những trải nghiệm bản địa nằm gọn trong lòng bàn tay bạn.",                        shortBio: "Mobile Developer — React Native & iOS Dev.",       level: 32,  rank: "bronze",   availableLp: 3800,  totalEarnedLp: 15000, totalSpentLp: 11200, currentXp: 42,  maxXp: 100, isActive: true,  isFeatured: false, sortOrder: 17 },
    // id=18: Hồ Diệu Thảo
    { slug: "ho-dieu-thao",       name: "Hồ Diệu Thảo",           title: "Culture Guardian",         bio: "Nuôi dưỡng yếu tố con người trong guild silicon.",                                  shortBio: "HR Specialist — Talent Acquisition & Guild Culture.", level: 42,  rank: "silver",   availableLp: 5500,  totalEarnedLp: 18000, totalSpentLp: 12500, currentXp: 28,  maxXp: 100, isActive: true,  isFeatured: false, sortOrder: 18 },
    // id=19: Trương Công Định
    { slug: "truong-cong-dinh",   name: "Trương Công Định",       title: "Product Visionary",       bio: "Xác định con đường phía trước. Kim chỉ nam cho sự tiến hóa sản phẩm.",               shortBio: "Product Owner — Product Lifecycle & Market Strategy.", level: 92,  rank: "platinum", availableLp: 35000, totalEarnedLp: 150000,totalSpentLp: 115000,currentXp: 68,  maxXp: 100, isActive: true,  isFeatured: false, sortOrder: 19 },
    // id=20: Đỗ Quyên
    { slug: "do-quyen",           name: "�Ứoàn Quyên",            title: "Visual Master",            bio: "Vượt lên trên những giao diện. Tạo ra những trải nghiệm số chạm đến tâm hồn.",        shortBio: "UI/UX Designer — Immersive UX & Design Psychology.", level: 98,  rank: "ruby",     availableLp: 48000, totalEarnedLp: 320000,totalSpentLp: 272000,currentXp: 12,  maxXp: 100, isActive: true,  isFeatured: false, sortOrder: 20 },
    // id=21: Phan Anh Tuấn
    { slug: "phan-anh-tuan",      name: "Phan Anh Tuấn",          title: "Digital Sentinel",         bio: "Lá chắn tối thượng. Bảo vệ tài sản số của guild với sự cảnh giác không lay chuyển.",   shortBio: "Security Engineer — Cybersecurity & Ethical Hacking.", level: 105, rank: "ruby",     availableLp: 55000, totalEarnedLp: 400000,totalSpentLp: 345000,currentXp: 45,  maxXp: 100, isActive: true,  isFeatured: false, sortOrder: 21 },
    // id=22: Võ Minh Tuấn
    { slug: "vo-minh-tuan",      name: "Võ Minh Tuấn",           title: "Grand Architect",         bio: "Phác thảo bản thiết kế của tương lai. Kiến trúc sư của những hệ thống phức tạp nhất.", shortBio: "Solution Architect — Distributed Systems & Enterprise Architecture.", level: 122, rank: "diamond",  availableLp: 110000,totalEarnedLp: 950000,totalSpentLp: 840000,currentXp: 15,  maxXp: 100, isActive: true,  isFeatured: false, sortOrder: 22 },
    // id=23: Mai Phương Linh
    { slug: "mai-phuong-linh",   name: "Mai Phương Linh",        title: "Messenger",               bio: "Xây dựng những thông điệp xuyên qua sự nhiễu loạn.",                                   shortBio: "Content Strategist — Copywriting & Content Marketing.", level: 5,   rank: "iron",     availableLp: 650,   totalEarnedLp: 1500,  totalSpentLp: 850,   currentXp: 62,  maxXp: 100, isActive: true,  isFeatured: false, sortOrder: 23 },
    // id=24: Cao Hữu Việt
    { slug: "cao-huu-viet",      name: "Cao Hữu Việt",           title: "Initiate",                bio: "Mài giũa thanh kiếm Backend. Hiệu quả là mục tiêu cuối cùng.",                        shortBio: "Junior Backend — Node.js Basics & DB Queries.",       level: 14,  rank: "iron",     availableLp: 1500,  totalEarnedLp: 3200,  totalSpentLp: 1700,  currentXp: 95,  maxXp: 100, isActive: true,  isFeatured: false, sortOrder: 24 },
    // id=25: Đoàn Minh Quân
    { slug: "doan-minh-quan",    name: "Đoàn Minh Quân",          title: "Elite Operative",        bio: "Làm chủ nghệ thuật tương tác. Mỗi khung hình là một sự lựa chọn có chủ đích.",      shortBio: "Senior Frontend — Animation Systems & State Management.", level: 94,  rank: "platinum", availableLp: 42000, totalEarnedLp: 210000,totalSpentLp: 168000,currentXp: 92,  maxXp: 100, isActive: true,  isFeatured: false, sortOrder: 25 },
    // id=26: Tạ Minh Tâm
    { slug: "ta-minh-tam",       name: "Tạ Minh Tâm",            title: "Void Weaver",             bio: "Dệt nên niềm tin vào hư vô. Bậc thầy của sổ cái bất biến.",                         shortBio: "Blockchain Dev — Smart Contracts & DeFi Architecture.", level: 112, rank: "ruby",     availableLp: 68000, totalEarnedLp: 480000,totalSpentLp: 412000,currentXp: 82,  maxXp: 100, isActive: true,  isFeatured: false, sortOrder: 26 },
    // id=27: Đinh Tiến Đạt
    { slug: "dinh-tien-dat",     name: "Đinh Tiến Đạt",          title: "Talent Scout",            bio: "Xác định những huyền thoại tiếp theo trước khi họ tự nhận ra điều đó.",                   shortBio: "Tech Recruiter — Sourcing & Technical Assessment.", level: 22,  rank: "bronze",   availableLp: 2800,  totalEarnedLp: 10000, totalSpentLp: 7200,  currentXp: 58,  maxXp: 100, isActive: true,  isFeatured: false, sortOrder: 27 },
  ];

  const memberCUIDs: Record<string, string> = {};
  for (const m of members) {
    const existing = await prisma.teamMember.findUnique({ where: { slug: m.slug } });
    if (existing) {
      await prisma.teamMember.update({
        where: { id: existing.id },
        data: {
          name: m.name, role: m.title, bio: m.bio, shortBio: m.shortBio,
          nameEn: m.name, nameJa: null, nameKo: null, nameZh: null,
          roleEn: m.title, roleJa: null, roleKo: null, roleZh: null,
          bioEn: m.bio, bioJa: null, bioKo: null, bioZh: null,
          shortBioEn: m.shortBio, shortBioJa: null, shortBioKo: null, shortBioZh: null,
          level: m.level, rank: m.rank, availableLp: m.availableLp,
          currentXp: m.currentXp, maxXp: m.maxXp,
          isActive: m.isActive, isFeatured: m.isFeatured, sortOrder: m.sortOrder,
        },
      });
      memberCUIDs[m.slug] = existing.id;
      console.log(`  ↻ ${m.name} (${m.rank}/${m.level}) updated`);
    } else {
      const created = await prisma.teamMember.create({
        data: {
          slug: m.slug, name: m.name, role: m.title, bio: m.bio, shortBio: m.shortBio,
          nameEn: m.name, nameJa: null, nameKo: null, nameZh: null,
          roleEn: m.title, roleJa: null, roleKo: null, roleZh: null,
          bioEn: m.bio, bioJa: null, bioKo: null, bioZh: null,
          shortBioEn: m.shortBio, shortBioJa: null, shortBioKo: null, shortBioZh: null,
          level: m.level, rank: m.rank, availableLp: m.availableLp,
          currentXp: m.currentXp, maxXp: m.maxXp,
          isActive: m.isActive, isFeatured: m.isFeatured, sortOrder: m.sortOrder,
        },
      });
      memberCUIDs[m.slug] = created.id;
      console.log(`  ✓ ${m.name} (${m.rank}/${m.level}) created`);
    }
  }
  return memberCUIDs;
}

// ── Seed Team Users (User records for team members — needed for QuestParticipant) ─
async function seedTeamUsers(memberCUIDs: Record<string, string>): Promise<Record<string, string>> {
  console.log("\n[R2-TeamUsers] Creating User records for team members...");

  // Create User accounts for top members (so they can participate in quests/events)
  // Use loop.vn emails that don't conflict with existing users
  const teamUsers: Array<{ slug: string; name: string; email: string }> = [
    { slug: "akira-sato",      name: "Akira Sato",       email: "akira.sato@loop.vn" },
    { slug: "yuna-park",       name: "Yuna Park",         email: "yuna.park@loop.vn" },
    { slug: "ryo-hashimoto",   name: "Ryo Hashimoto",     email: "ryo.hashimoto@loop.vn" },
    { slug: "mei-lin",         name: "Mei Lin",           email: "mei.lin@loop.vn" },
    { slug: "shin-watanabe",   name: "Shin Watanabe",      email: "shin.watanabe@loop.vn" },
    { slug: "haru-tanaka",     name: "Haru Tanaka",       email: "haru.tanaka@loop.vn" },
    { slug: "tran-huu-phuc",   name: "Trần Hữu Phúc",     email: "tran.huuphuoc@loop.vn" },
    { slug: "vu-dinh-trong",   name: "Vũ Đình Trọng",     email: "vu.dinhtrong@loop.vn" },
    { slug: "pham-hoang-long", name: "Phạm Hoàng Long",   email: "phamhoanglong@loop.vn" },
    { slug: "dang-my-linh",    name: "Đặng Mỹ Linh",      email: "dangmylinh@loop.vn" },
    { slug: "rin-nakamura",    name: "Rin Nakamura",        email: "rin.nakamura@loop.vn" },
    { slug: "nguyen-minh-thu", name: "Nguyễn Minh Thư",   email: "nguyenminhthu@loop.vn" },
    { slug: "le-van-nam",      name: "Lê Văn Nam",         email: "levannam@loop.vn" },
    { slug: "ly-gia-hung",     name: "Lý Gia Hưng",       email: "ly.giahung@loop.vn" },
    { slug: "duong-bao-ngoc",  name: "Dương Bảo Ngọc",   email: "duongbaongoc@loop.vn" },
  ];

  const userIdMap: Record<string, string> = {};
  for (const u of teamUsers) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      userIdMap[u.slug] = existing.id;
    } else {
      const created = await prisma.user.create({
        data: {
          email: u.email,
          name: u.name,
          passwordHash: undefined,
          role: "user",
          isActive: true,
          accountType: "team",
        },
      });
      userIdMap[u.slug] = created.id;
    }
  }
  console.log(`  ✓ ${Object.keys(userIdMap).length} team user accounts`);
  return userIdMap;
}

// ── Seed MemberExpertise ──────────────────────────────────────────────────────────
async function seedMemberExpertise(memberCUIDs: Record<string, string>) {
  console.log("\n[R2-Expertise] Seeding member-expertise links...");

  const expertiseLinks: Record<string, string[]> = {
    "kai-tanaka":         ["Vue.js", "Tailwind CSS", "TypeScript", "Figma"],
    "mei-lin":            ["Figma", "Adobe XD", "Framer", "Protopie", "Spline"],
    "ryo-hashimoto":      ["Node.js", "PostgreSQL", "Redis", "Docker", "GraphQL"],
    "yuna-park":          ["React", "Next.js", "Prisma", "PostgreSQL", "AWS", "Tailwind"],
    "shin-watanabe":      ["Kubernetes", "Terraform", "AWS", "Git", "CI/CD"],
    "rin-nakamura":       ["Rust", "Go", "PostgreSQL", "Kafka", "gRPC"],
    "akira-sato":         ["React", "Next.js", "TypeScript", "AWS", "GCP"],
    "tran-huu-phuc":      ["React", "TypeScript", "Tailwind CSS", "Framer Motion"],
    "nguyen-minh-thu":    ["Figma", "Adobe XD", "Spline", "Rive"],
    "le-van-nam":         ["Node.js", "Express", "PostgreSQL"],
    "pham-hoang-long":     ["AWS", "Docker", "Kubernetes", "Terraform"],
    "dang-my-linh":       ["Jira", "Notion", "Miro", "ClickUp"],
    "vu-dinh-trong":      ["Cypress", "Playwright", "Jest", "Postman"],
    "haru-tanaka":        ["Figma", "Adobe Premiere", "After Effects", "DaVinci Resolve", "Blender"],
    "ly-gia-hung":        ["Python", "TensorFlow", "PyTorch", "Pandas"],
    "duong-bao-ngoc":      ["Google Ads", "Meta Ads", "SEO", "Analytics"],
    "bui-tien-dung":      ["React Native", "Swift", "Kotlin", "Expo"],
    "ho-dieu-thao":       ["LinkedIn", "Notion", "Slack"],
    "truong-cong-dinh":   ["Jira", "Amplitude", "Hotjar", "Mixpanel"],
    "do-quyen":           ["Figma", "Blender", "After Effects", "Protopie"],
    "phan-anh-tuan":      ["Kali Linux", "Metasploit", "Wireshark", "Burp Suite"],
    "vo-minh-tuan":       ["Microservices", "Event Sourcing", "Cloud Native", "Kubernetes"],
    "mai-phuong-linh":    ["Notion", "Grammarly", "Canva"],
    "cao-huu-viet":       ["Node.js", "MySQL", "JavaScript"],
    "doan-minh-quan":     ["React", "Zustand", "Framer Motion", "Three.js"],
    "ta-minh-tam":        ["Solidity", "Rust", "Web3.js", "Ethereum"],
    "dinh-tien-dat":      ["LinkedIn Recruiter", "Greenhouse", "Notion"],
  };

  // Get all expertises
  const expertises = await prisma.expertise.findMany();
  const expMap: Record<string, string> = {};
  for (const e of expertises) expMap[e.name] = e.id;

  let linkCount = 0;
  for (const [slug, skillNames] of Object.entries(expertiseLinks)) {
    const memberId = memberCUIDs[slug];
    if (!memberId) continue;
    for (const skillName of skillNames) {
      const expId = expMap[skillName];
      if (!expId) continue;
      await prisma.memberExpertise.upsert({
        where: { memberId_expertiseId: { memberId, expertiseId: expId } },
        create: { memberId, expertiseId: expId, level: 5 },
        update: {},
      });
      linkCount++;
    }
  }
  console.log(`  ✓ ${linkCount} member-expertise links`);
  return memberCUIDs;
}

// ── Seed RankEffects ────────────────────────────────────────────────────────────
// DISABLED — Effects are FIXED in code (guildMemberData.ts) per rank tier.
// DB RankEffect table kept for future use, but UI does NOT read it.
// To re-enable, uncomment this function AND add call in seedR2().
/*
async function seedRankEffects() {
  console.log("\n[R2-RankEffects] Seeding 12 rank effects...");

  const effects = [
    { id: "eff-1",  name: "Particle Glow cơ bản",  description: "Hiệu ứng particle nhẹ xung quanh card",      type: "particle",    minRank: "iron",     minLevel: 1,   isEnabled: true,  rarity: "common",    icon: "✨", color: "#9CA3AF", maxLevel: null },
    { id: "eff-2",  name: "Border Gradient",          description: "Viền gradient xoay theo rank color",          type: "border",       minRank: "bronze",   minLevel: 15,  isEnabled: true,  rarity: "common",    icon: "◈", color: "#CD7F32", maxLevel: null },
    { id: "eff-3",  name: "Silver Shimmer",          description: "Hiệu ứng lấp lánh bạc trên card",            type: "glow",         minRank: "silver",   minLevel: 35,  isEnabled: true,  rarity: "rare",      icon: "◇", color: "#CBD5E1", maxLevel: null },
    { id: "eff-4",  name: "Gold Aura",               description: "Hào quang vàng bao quanh avatar",             type: "aura",         minRank: "gold",     minLevel: 55,  isEnabled: true,  rarity: "rare",      icon: "★", color: "#FFD700", maxLevel: null },
    { id: "eff-5",  name: "Platinum Trail",           description: "Vệt sáng theo chuyển động",                   type: "trail",        minRank: "platinum", minLevel: 75,  isEnabled: true,  rarity: "epic",      icon: "❋", color: "#14B8A6", maxLevel: null },
    { id: "eff-6",  name: "Ruby Fire Particles",       description: "Particles lửa đỏ xung quanh card",            type: "particle",     minRank: "ruby",     minLevel: 85,  isEnabled: true,  rarity: "epic",      icon: "♦", color: "#EF4444", maxLevel: null },
    { id: "eff-7",  name: "Diamond Holographic",      description: "Hiệu ứng holographic toàn card",              type: "aura",         minRank: "diamond",  minLevel: 95,  isEnabled: true,  rarity: "legendary", icon: "✦", color: "#818CF8", maxLevel: null },
    { id: "eff-8",  name: "Cosmic Badge",             description: "Badge đặc biệt hiển thị trên avatar",         type: "badge",        minRank: "diamond",  minLevel: 100, isEnabled: true,  rarity: "legendary", icon: "🌟", color: "#818CF8", maxLevel: null },
    { id: "eff-9",  name: "Neon Pulse Border",       description: "Viền neon nhấp nháy theo nhịp",               type: "border",       minRank: "gold",     minLevel: 60,  isEnabled: true,  rarity: "rare",      icon: "💫", color: "#3B82F6", maxLevel: null },
    { id: "eff-10", name: "Matrix Rain",               description: "Hiệu ứng mưa matrix trên card",               type: "particle",     minRank: "platinum", minLevel: 80,  isEnabled: false, rarity: "epic",      icon: "🌧", color: "#22C55E", maxLevel: null },
    { id: "eff-11", name: "Bronze Ember",              description: "Tia lửa màu đồng bay lên",                    type: "particle",     minRank: "bronze",   minLevel: 20,  isEnabled: true,  rarity: "common",    icon: "🔥", color: "#CD7F32", maxLevel: null },
    { id: "eff-12", name: "Iron Shield Pulse",         description: "Vòng khiên kim loại rung nhẹ",                type: "border",       minRank: "iron",     minLevel: 5,   isEnabled: true,  rarity: "common",    icon: "🛡", color: "#9CA3AF", maxLevel: null },
  ];

  for (const e of effects) {
    await prisma.rankEffect.upsert({
      where: { id: e.id },
      create: e,
      update: { name: e.name, description: e.description, type: e.type, minRank: e.minRank, minLevel: e.minLevel, isEnabled: e.isEnabled, rarity: e.rarity, icon: e.icon, color: e.color, maxLevel: e.maxLevel },
    });
  }
  console.log(`  ✓ ${effects.length} rank effects`);
}

// ── Seed MemberEffectOverrides ─────────────────────────────────────────────────
async function seedMemberOverrides(memberCUIDs: Record<string, string>) {
  console.log("\n[R2-Overrides] Seeding member effect overrides...");

  const overrides = [
    { memberSlug: "akira-sato",      effectId: "eff-7", visible: true,  selectedByMember: true,  priority: 10 },
    { memberSlug: "akira-sato",      effectId: "eff-8", visible: true,  selectedByMember: true,  priority: 9  },
    { memberSlug: "akira-sato",      effectId: "eff-6", visible: false, selectedByMember: false, priority: 0  },
    { memberSlug: "ryo-hashimoto",   effectId: "eff-5", visible: true,  selectedByMember: true,  priority: 8  },
    { memberSlug: "vu-dinh-trong",   effectId: "eff-7", visible: true,  selectedByMember: true,  priority: 7  },
    { memberSlug: "haru-tanaka",     effectId: "eff-9", visible: true,  selectedByMember: true,  priority: 6  },
  ];

  for (const o of overrides) {
    const memberId = memberCUIDs[o.memberSlug];
    if (!memberId) { console.warn(`  ⚠ member ${o.memberSlug} not found — skipping override`); continue; }
    await prisma.memberEffectOverride.upsert({
      where: { memberId_effectId: { memberId, effectId: o.effectId } },
      create: { memberId, effectId: o.effectId, visible: o.visible, selectedByMember: o.selectedByMember, priority: o.priority },
      update: { visible: o.visible, selectedByMember: o.selectedByMember, priority: o.priority },
    });
  }
  console.log(`  ✓ ${overrides.length} member effect overrides`);
}
*/

// ── Seed Projects (6 portfolio items) ────────────────────────────────────────────
async function seedProjects() {
  console.log("\n[R2-Projects] Seeding 6 portfolio projects...");

  const projects = [
    { slug: "vnretail-platform",  title: "VNRetail Platform",    tagline: "E-commerce SaaS Platform",   category: "SaaS",        client: "VNRetail JSC",        year: 2025, status: "completed", isActive: true,  sortOrder: 1, description: "Nền tảng SaaS multi-tenant với kiến trúc microservices trên AWS." },
    { slug: "medapp-vietnam",     title: "MedApp Vietnam",       tagline: "Mobile Health App",       category: "App",         client: "HealthTech Vietnam",    year: 2025, status: "completed", isActive: true,  sortOrder: 2, description: "Ứng dụng y tế kết nối bệnh nhân với bác sĩ." },
    { slug: "analyticspro-dash",  title: "AnalyticsPro Dashboard",tagline: "Data Analytics SaaS",     category: "SaaS",        client: "DataViet Corp",       year: 2024, status: "completed", isActive: true,  sortOrder: 3, description: "Dashboard analytics real-time xử lý 100M+ data points." },
    { slug: "eduviet-portal",     title: "EduViet Portal",       tagline: "EdTech Platform",       category: "Website",     client: "EduViet Foundation",   year: 2024, status: "completed", isActive: true,  sortOrder: 4, description: "Nền tảng học trực tuyến với video streaming và quiz." },
    { slug: "startuphub-landing",  title: "StartupHub Landing",    tagline: "Corporate Website",       category: "Website",     client: "StartupHub Vietnam",   year: 2025, status: "completed", isActive: true,  sortOrder: 5, description: "Landing page cần chuyển đổi cao, tốc độ cực nhanh." },
    { slug: "findash-enterprise",  title: "FinDash Enterprise",   tagline: "FinTech Dashboard",      category: "SaaS",        client: "FinCorp Vietnam",      year: 2025, status: "completed", isActive: true,  sortOrder: 6, description: "Nền tảng fintech enterprise với bảo mật banking-grade." },
  ];

  for (const p of projects) {
    await prisma.project.upsert({
      where: { slug: p.slug },
      update: { title: p.title, category: p.category, client: p.client, year: String(p.year), description: p.description, isPublished: true, sortOrder: p.sortOrder },
      create: { slug: p.slug, title: p.title, category: p.category, client: p.client, year: String(p.year), image: "", description: p.description, results: "" },
    });
  }
  console.log(`  ✓ ${projects.length} portfolio projects`);
}

// ── Seed Orders (5 demo orders) ─────────────────────────────────────────────────
async function seedOrders(memberCUIDs: Record<string, string>) {
  console.log("\n[R2-Orders] Seeding 5 demo orders...");

  // Map PM names → member CUIDs
  const pmMap: Record<string, string | undefined> = {
    "Yuna Park":     memberCUIDs["yuna-park"],
    "Mei Lin":       memberCUIDs["mei-lin"],
    "Akira Sato":    memberCUIDs["akira-sato"],
    "Shin Watanabe": memberCUIDs["shin-watanabe"],
    "Haru Tanaka":   memberCUIDs["haru-tanaka"],
  };

  const orders = [
    {
      orderNumber: "ORD-2601", orderType: "package", packageSlug: "phat-trien-app",
      customerName: "Nguyễn Minh Tuấn", customerEmail: "minhtuan@vnretail.vn",
      status: "in_progress", paymentStatus: "paid",
      totalAmount: 175000000, totalXp: 8750, totalProjectLp: 8750,
      startedAt: new Date("2026-03-10T08:00:00Z"),
      completedAt: null, isActiveProject: true, projectStatus: "in_progress",
      pmName: "Yuna Park",  // links to Yuna Park in projectMember
      tag: "phat-trien-app", serviceTitle: "Phát triển App & SaaS Platform",
    },
    {
      orderNumber: "ORD-2602", orderType: "package", packageSlug: "thiet-ke-web",
      customerName: "Dr. Trần Thị Mai", customerEmail: "mai@healthtech.vn",
      status: "demo_ready", paymentStatus: "paid",
      totalAmount: 45000000, totalXp: 2250, totalProjectLp: 2250,
      startedAt: new Date("2026-02-15T08:00:00Z"),
      completedAt: null, isActiveProject: true, projectStatus: "demo_ready",
      pmName: "Mei Lin",
      tag: "thiet-ke-web", serviceTitle: "Thiết kế & Phát triển Website",
    },
    {
      orderNumber: "ORD-2603", orderType: "package", packageSlug: "dashboard-analytics",
      customerName: "Lê Quang Đức", customerEmail: "leduc@findcorp.vn",
      status: "paid", paymentStatus: "paid",
      totalAmount: 280000000, totalXp: 14000, totalProjectLp: 14000,
      startedAt: new Date("2026-03-23T08:00:00Z"),
      completedAt: null, isActiveProject: false, projectStatus: null,
      pmName: undefined,
      tag: "dashboard-analytics", serviceTitle: "Dashboard & Data Analytics",
    },
    {
      orderNumber: "ORD-2604", orderType: "package", packageSlug: "thiet-ke-web",
      customerName: "Vũ Hoàng Minh", customerEmail: "minh@retailmax.vn",
      status: "pending_payment", paymentStatus: "unpaid",
      totalAmount: 80000000, totalXp: 4000, totalProjectLp: 4000,
      startedAt: new Date("2026-03-24T08:00:00Z"),
      completedAt: null, isActiveProject: false, projectStatus: null,
      pmName: undefined,
      tag: "thiet-ke-web", serviceTitle: "Thiết kế & Phát triển Website",
    },
    {
      orderNumber: "ORD-2505", orderType: "package", packageSlug: "seo-marketing",
      customerName: "Ngô Thị Lan", customerEmail: "lan@eduviet.edu.vn",
      status: "done", paymentStatus: "paid",
      totalAmount: 96000000, totalXp: 4800, totalProjectLp: 4800,
      startedAt: new Date("2026-01-01T08:00:00Z"),
      completedAt: new Date("2026-03-20T08:00:00Z"), isActiveProject: false, projectStatus: null,
      pmName: "Yuna Park",
      tag: "seo-marketing", serviceTitle: "SEO & Digital Marketing",
    },
  ];

  const pmMembers = await prisma.teamMember.findMany({ where: { slug: { in: ["yuna-park", "mei-lin", "akira-sato"] } } });
  const pmMemberMap: Record<string, string> = {};
  for (const m of pmMembers) pmMemberMap[m.slug] = m.id;

  let orderCount = 0;
  for (const o of orders) {
    const existing = await prisma.order.findUnique({ where: { orderNumber: o.orderNumber } });
    if (existing) {
      await prisma.order.update({
        where: { id: existing.id },
        data: {
          status: o.status, paymentStatus: o.paymentStatus,
          totalAmount: o.totalAmount, totalXp: o.totalXp, totalProjectLp: o.totalProjectLp,
          startedAt: o.startedAt, completedAt: o.completedAt,
          isActiveProject: o.isActiveProject, projectStatus: o.projectStatus,
        },
      });
      orderCount++;
      console.log(`  ↻ ${o.orderNumber} (${o.status}) updated`);
    } else {
      await prisma.order.create({
        data: {
          orderNumber: o.orderNumber, orderType: o.orderType,
          customerName: o.customerName, customerEmail: o.customerEmail,
          status: o.status, paymentStatus: o.paymentStatus,
          totalAmount: o.totalAmount, totalXp: o.totalXp, totalProjectLp: o.totalProjectLp,
          startedAt: o.startedAt, completedAt: o.completedAt,
          isActiveProject: o.isActiveProject, projectStatus: o.projectStatus,
        },
      });
      orderCount++;
      console.log(`  ✓ ${o.orderNumber} (${o.status}) created`);
    }

    // Seed OrderStatusHistory for each order
    const order = await prisma.order.findUnique({ where: { orderNumber: o.orderNumber } });
    if (!order) continue;

    const statusFlow = ["pending", "paid", "in_progress", "demo_ready", "client_review", "done"];
    const doneIdx = o.status === "done" ? 5
                   : o.status === "client_review" ? 4
                   : o.status === "demo_ready" ? 3
                   : o.status === "in_progress" ? 2
                   : o.status === "paid" ? 1 : 0;

    let prevStatus = "pending";
    for (let i = 0; i <= doneIdx; i++) {
      const newStatus = statusFlow[i];
      const createdAt = new Date(order.startedAt!.getTime() + i * 3 * 24 * 3600 * 1000);
      await prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: i === 0 ? "pending" : prevStatus,
          toStatus: newStatus,
          changedBy: o.pmName ?? undefined,
          note: i === 0 ? "Order created from booking wizard" : `Status updated to ${newStatus}`,
          createdAt,
        },
      });
      prevStatus = newStatus;
    }
  }
  console.log(`  ✓ ${orderCount} orders + status histories`);
}

// ── Seed ProjectMembers (PM assignments) ────────────────────────────────────────
async function seedProjectMembers(memberCUIDs: Record<string, string>) {
  console.log("\n[R2-ProjectMembers] Seeding project member assignments...");

  const orders = await prisma.order.findMany({ where: { orderNumber: { in: ["ORD-2601", "ORD-2602", "ORD-2505"] } } });
  const orderMap: Record<string, string> = {};
  for (const o of orders) orderMap[o.orderNumber] = o.id;

  // VNRetail (ORD-2601): Yuna (PM), Ryo (dev), Akira (consultant)
  const vnRetail = [
    { slug: "yuna-park",        projectRole: "PM",       assignedLp: 3000 },
    { slug: "ryo-hashimoto",    projectRole: "DEVELOPER", assignedLp: 2500 },
    { slug: "akira-sato",       projectRole: "CONSULTANT", assignedLp: 1500 },
  ];
  // MedApp (ORD-2602): Mei Lin (PM), Haru (media)
  const medApp = [
    { slug: "mei-lin",         projectRole: "PM",       assignedLp: 2000 },
    { slug: "haru-tanaka",     projectRole: "DESIGNER",  assignedLp: 1500 },
  ];
  // EduViet SEO (ORD-2505): Yuna (PM)
  const eduViet = [
    { slug: "yuna-park",       projectRole: "PM",       assignedLp: 4000 },
  ];

  const allLinks = [
    { orderNumber: "ORD-2601", links: vnRetail },
    { orderNumber: "ORD-2602", links: medApp },
    { orderNumber: "ORD-2505", links: eduViet },
  ];

  let linkCount = 0;
  for (const group of allLinks) {
    const projectId = orderMap[group.orderNumber];
    if (!projectId) continue;
    for (const link of group.links) {
      const memberId = memberCUIDs[link.slug];
      if (!memberId) continue;
      await prisma.projectMember.upsert({
        where: { projectId_memberId: { projectId, memberId } },
        create: {
          memberId, projectId, projectRole: link.projectRole,
          assignedLp: link.assignedLp, joinedAt: new Date("2026-03-10T08:00:00Z"),
        },
        update: { projectRole: link.projectRole, assignedLp: link.assignedLp },
      });
      linkCount++;
    }
  }
  console.log(`  ✓ ${linkCount} project member links`);
}

// ── Seed LP economy: CustomerPoints + LpTransactions ─────────────────────────
async function seedLPEconomy(memberCUIDs: Record<string, string>, _teamUserIds: Record<string, string>) {
  console.log("\n[R2-LPEconomy] Seeding LP economy...");

  // Clean slate: delete existing LP data before re-seeding (prevents accumulation on re-run)
  await prisma.lpTransaction.deleteMany({});
  await prisma.customerPoint.deleteMany({});

  // CustomerPoints for all 27 members
  const pointIdMap: Record<string, string> = {};
  for (const [slug, memberId] of Object.entries(memberCUIDs)) {
    const email = `${slug}@loop.vn`;
    const id = `loop-pt-${slug}`;
    pointIdMap[slug] = id;
    await prisma.customerPoint.create({
      data: {
        id,
        userId: memberId,
        userEmail: email,
        userName: slug,
        balance: 0,
        totalEarned: 0,
        totalSpent: 0,
      },
    });
  }
  console.log(`  ✓ ${Object.keys(pointIdMap).length} customer points (LP balance = 0 — updated via LP transactions)`);

  // LpTransactions: synthetic history per member
  // Realistic LP earning pattern: task completion + quest rewards + order LP
  const lpHistory: Array<{ memberSlug: string, amount: number, type: string, description: string, source: string, daysAgo: number }> = [];

  // Add some history entries per active member
  const activeMembers = ["kai-tanaka", "mei-lin", "ryo-hashimoto", "yuna-park", "shin-watanabe",
    "akira-sato", "tran-huu-phuc", "vu-dinh-trong", "haru-tanaka", "pham-hoang-long", "dang-my-linh"];

  for (const slug of activeMembers) {
    // Monthly task awards
    for (let m = 3; m >= 0; m--) {
      lpHistory.push({
        memberSlug: slug,
        amount: Math.floor(Math.random() * 3000) + 500,
        type: "award",
        description: "Monthly task completion reward",
        source: "task_award",
        daysAgo: m * 30 + Math.floor(Math.random() * 10),
      });
    }
    // Quest completions
    for (let q = 0; q < 5; q++) {
      lpHistory.push({
        memberSlug: slug,
        amount: Math.floor(Math.random() * 200) + 50,
        type: "award",
        description: "Daily quest completed",
        source: "quest_reward",
        daysAgo: Math.floor(Math.random() * 60),
      });
    }
    // Order LP rewards (for PMs)
    if (["yuna-park", "akira-sato"].includes(slug)) {
      for (let o = 0; o < 3; o++) {
        lpHistory.push({
          memberSlug: slug,
          amount: Math.floor(Math.random() * 5000) + 2000,
          type: "award",
          description: "Order milestone LP reward",
          source: "order_lp",
          daysAgo: Math.floor(Math.random() * 120) + 30,
        });
      }
    }
    // LP spending/redemption (for members with earned LP)
    if (["akira-sato", "yuna-park", "ryo-hashimoto"].includes(slug)) {
      for (let s = 0; s < 2; s++) {
        lpHistory.push({
          memberSlug: slug,
          amount: -(Math.floor(Math.random() * 5000) + 1000),
          type: "spend",
          description: "LP redeemed for Academy course upgrade",
          source: "redemption",
          daysAgo: Math.floor(Math.random() * 45) + 5,
        });
      }
    }
  }

  let txCount = 0;
  for (const entry of lpHistory) {
    const memberId = memberCUIDs[entry.memberSlug];
    if (!memberId) continue;
    const createdAt = new Date(Date.now() - entry.daysAgo * 86400 * 1000);
    await prisma.lpTransaction.create({
      data: {
        memberId,
        amount: entry.amount,
        type: entry.type as "award" | "spend",
        status: "completed",
        description: entry.description,
        source: entry.source,
        balanceAfter: 0,
        createdBy: undefined,
      },
    });
    txCount++;
  }
  console.log(`  ✓ ${txCount} LP transactions (awards + redemptions)`);
}

// ── Seed PM Kanban: Epics → Backlogs → Tasks ──────────────────────────────────
async function seedPMData(memberCUIDs: Record<string, string>) {
  console.log("\n[R2-PM] Seeding epics, backlogs, tasks...");

  // Find active orders with PM assigned
  const activeProjects = await prisma.order.findMany({
    where: { isActiveProject: true },
  });
  const pmOrderMap: Record<string, string> = {};
  for (const o of activeProjects) pmOrderMap[o.orderNumber] = o.id;

  if (Object.keys(pmOrderMap).length === 0) {
    console.log("  ⚠ No active projects found — skipping PM seed");
    return;
  }

  // Seed one Epic + Backlog + Tasks for each active project
  const epicsData = [
    { slug: "vnretail-sprint1", title: "Sprint 1 — Core Features",    color: "#3B82F6", orderNumber: "ORD-2601" },
    { slug: "medapp-phase1",   title: "Phase 1 — MVP Launch",         color: "#8B5CF6", orderNumber: "ORD-2602" },
  ];

  let epicCount = 0, taskCount = 0;
  for (const epic of epicsData) {
    const projectId = pmOrderMap[epic.orderNumber];
    if (!projectId) continue;

    const createdEpic = await prisma.epic.upsert({
      where: { id: epic.slug },
      update: { title: epic.title, color: epic.color, isActive: true },
      create: { id: epic.slug, title: epic.title, color: epic.color, isActive: true, projectId },
    });
    epicCount++;

    // Default backlog
    const backlog = await prisma.backlog.upsert({
      where: { id: `${epic.slug}-default` },
      update: { title: "Sprint Backlog", isDefault: true, isActive: true },
      create: { id: `${epic.slug}-default`, title: "Sprint Backlog", name: "Sprint Backlog", isDefault: true, isActive: true, epicId: createdEpic.id, projectId },
    });

    // Seed tasks assigned to members
    const taskDefs = [
      { title: "Setup project structure & CI/CD pipeline",        status: "done",       priority: "high",    slugRef: "ryo-hashimoto" },
      { title: "Design database schema & migrations",            status: "done",       priority: "high",    slugRef: "ryo-hashimoto" },
      { title: "Implement authentication & authorization",         status: "done",       priority: "high",    slugRef: "ryo-hashimoto" },
      { title: "Build API endpoints for core modules",             status: "in_progress", priority: "high",    slugRef: "ryo-hashimoto" },
      { title: "Frontend dashboard layout & navigation",          status: "in_progress", priority: "high",    slugRef: "tran-huu-phuc" },
      { title: "Responsive design system implementation",         status: "todo",        priority: "medium",  slugRef: "mei-lin" },
      { title: "Payment integration & webhook handlers",         status: "todo",        priority: "high",    slugRef: "ryo-hashimoto" },
      { title: "Real-time notifications with SSE",               status: "todo",        priority: "medium",  slugRef: "akira-sato" },
      { title: "Performance optimization & caching",             status: "todo",        priority: "low",     slugRef: "shin-watanabe" },
      { title: "Security audit & penetration testing",           status: "todo",        priority: "medium",  slugRef: "vu-dinh-trong" },
    ];

    for (let i = 0; i < taskDefs.length; i++) {
      const t = taskDefs[i];
      const assigneeId = memberCUIDs[t.slugRef] ?? null;
      await prisma.task.upsert({
        where: { id: `${epic.slug}-task-${i + 1}` },
        create: {
          id: `${epic.slug}-task-${i + 1}`,
          backlogId: backlog.id,
          title: t.title,
          lp: Math.floor(Math.random() * 500) + 100,
          status: t.status,
          priority: t.priority as "low" | "medium" | "high",
          assigneeId,
        },
        update: {
          status: t.status,
          priority: t.priority as "low" | "medium" | "high",
          assigneeId,
        },
      });
      taskCount++;
    }
  }
  console.log(`  ✓ ${epicCount} epics + ${taskCount} tasks`);
}

// ── Seed QuestParticipants (link members → quests + events) ──────────────────
async function seedQuestParticipants(memberCUIDs: Record<string, string>, teamUserIds: Record<string, string>) {
  console.log("\n[R2-QuestParticipants] Seeding quest participants...");

  // Get quests and events from DB
  const quests = await prisma.quest.findMany({ take: 5 });
  const events = await prisma.companyEvent.findMany();
  const springEvent = events.find((e) => e.id.includes("spring"));

  // Build batch data — use createMany for efficiency
  // Note: spring event participation has questId=null; quest participation has eventId=null
  // This avoids unique constraint issues between the two groups
  const batchData: Array<{
    userId: string;
    questId: string | null;
    eventId: string | null;
    progress: number;
    completed: boolean;
    joinedAt: Date;
  }> = [];

  for (const [, userId] of Object.entries(teamUserIds)) {
    // Join spring event
    if (springEvent) {
      batchData.push({
        userId,
        questId: null,
        eventId: springEvent.id,
        progress: Math.floor(Math.random() * 3),
        completed: false,
        joinedAt: new Date("2026-03-20T08:00:00Z"),
      });
    }

    // Join some quests (first 3 quests = daily/weekly)
    for (const quest of quests.slice(0, 3)) {
      batchData.push({
        userId,
        questId: quest.id,
        eventId: null,
        progress: Math.floor(Math.random() * 3),
        completed: Math.random() > 0.7,
        joinedAt: new Date("2026-03-01T08:00:00Z"),
      });
    }
  }

  // Use upsert per participant to handle existing records gracefully
  let participantCount = 0;
  for (const p of batchData) {
    try {
      if (p.questId) {
        await prisma.questParticipant.upsert({
          where: { userId_questId: { userId: p.userId, questId: p.questId } },
          update: { progress: p.progress, completed: p.completed },
          create: p,
        });
        participantCount++;
      } else if (p.eventId) {
        await prisma.questParticipant.upsert({
          where: { userId_eventId: { userId: p.userId, eventId: p.eventId } },
          update: { progress: p.progress },
          create: p,
        });
        participantCount++;
      }
    } catch {
      // Skip on constraint error — already exists
    }
  }
  console.log(`  ✓ ${participantCount} quest/event participations`);
}

// ── MAIN R2 DISPATCHER ────────────────────────────────────────────────────────
async function seedR2() {
  console.log("\n" + "═".repeat(50));
  console.log("🌱 R2 — Unified Demo Data Seed (2026-03-30)");
  console.log("═".repeat(50));

  const memberCUIDs = await seedAllTeamMembers();
  const teamUserIds = await seedTeamUsers(memberCUIDs);
  await seedMemberExpertise(memberCUIDs);
  // NOTE: seedRankEffects() and seedMemberOverrides() removed —
  // Effects are FIXED in code (guildMemberData.ts) per rank tier.
  // DB RankEffect + MemberEffectOverride tables are kept for future use
  // but NOT read by the UI. See docs/PROJECT-PLAN.md §5.3.
  await seedProjects();
  await seedOrders(memberCUIDs);
  await seedProjectMembers(memberCUIDs);
  await seedLPEconomy(memberCUIDs, teamUserIds);
  await seedPMData(memberCUIDs);
  await seedQuestParticipants(memberCUIDs, teamUserIds);

  console.log("\n✅ R2 seed complete — all demo data unified");
}

// ══════════════════════════════════════════════════════════════════

async function main() {
  console.log("=".repeat(50));
  console.log("🌱 LOOP — Unified Seed Script");
  console.log("=".repeat(50));

  try {
    await seedRBAC();
    await seedAdmin();
    await seedAccessTags();
    await seedMemberRequests();
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
    await seedServices(); // <-- Seed public services (used by /api/v1/services)
    await seedR2(); // <-- NEW: R2 unified demo data

    // Verify counts
    const [tm, us, pr, ord, pm, ef, ov, lp, tx, qp, ec, tsk, q, ev, exp, me, svc, at, mr] = await Promise.all([
      prisma.teamMember.count(),
      prisma.user.count(),
      prisma.project.count(),
      prisma.order.count(),
      prisma.projectMember.count(),
      // RankEffect + MemberEffectOverride — NOT seeded (effects in code)
      0 as number, // prisma.rankEffect.count(),
      0 as number, // prisma.memberEffectOverride.count(),
      prisma.customerPoint.count(),
      prisma.lpTransaction.count(),
      prisma.questParticipant.count(),
      prisma.epic.count(),
      prisma.task.count(),
      prisma.quest.count(),
      prisma.companyEvent.count(),
      prisma.expertise.count(),
      prisma.memberExpertise.count(),
      prisma.service.count(),
      prisma.accessTag.count(),
      prisma.memberRequest.count(),
    ]);
    console.log("\n[VERIFY] TM=%d US=%d PR=%d OR=%d PM=%d | LP=%d TX=%d QP=%d | EC=%d TS=%d Q=%d EV=%d | EXP=%d ME=%d | SVC=%d | AT=%d MR=%d",
      tm, us, pr, ord, pm, lp, tx, qp, ec, tsk, q, ev, exp, me, svc, at, mr);
    console.log("  (EF=%d OV=%d — effects in code, not DB)", ef, ov);

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
