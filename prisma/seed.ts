/**
 * Unified Seed Script
 * Run: npx tsx prisma/seed.ts
 */
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local explicitly (next.js style)
config({ path: resolve(process.cwd(), ".env.local") });

import { PrismaClient } from "@/generated/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "@/lib/auth/password";

const rawUrl = process.env.DATABASE_URL ?? "";
if (!rawUrl) {
  console.error("❌ DATABASE_URL not found in .env.local");
  process.exit(1);
}

// Use PrismaPg with a Pool config object — supports transactions unlike PrismaNeonHttp (direct HTTP).
// Pass PoolConfig directly instead of a Pool instance to avoid @types/pg version mismatch.
const adapter = new PrismaPg({ connectionString: rawUrl });
const prisma = new PrismaClient({ adapter });

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

  // Grant wildcard permission to super_admin (bypass everything)
  // NOTE: upsert is idempotent — safe for re-runs without deleteMany
  await prisma.permission.upsert({
    where: { roleId_resource_action: { roleId: superAdminRole.id, resource: "*", action: "*" } },
    update: {},
    create: { roleId: superAdminRole.id, resource: "*", action: "*", scope: "all" },
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

  // hr (level 2): can only create/add members — cannot delete/approve/lp-award
  const hrRole = await prisma.role.upsert({
    where: { name: "hr" },
    update: { level: 2, description: "HR — add members only, no delete/approve/lp-award" },
    create: {
      name: "hr",
      displayName: "Nhân sự (HR)",
      description: "HR — add members only, no delete/approve/lp-award",
      color: "purple",
      level: 2,
      isSystem: true,
    },
  });

  // Grant team read+create+update to hr role (no delete/approve)
  const hrResources = ["team", "member-requests"] as const;
  const hrActions = ["create", "read", "update"] as const;
  for (const resource of hrResources) {
    for (const action of hrActions) {
      await prisma.permission.upsert({
        where: { roleId_resource_action: { roleId: hrRole.id, resource, action } },
        update: { scope: "all" },
        create: { roleId: hrRole.id, resource, action, scope: "all" },
      });
    }
  }
  console.log(`  ✓ HR role: ${hrRole.name} (level ${hrRole.level}) — team: create/read/update only`);

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
    "task-kanban", "project-members", "handover", "customer-websites", "events-stream",
  ];
  const allActions = ["create", "read", "update", "delete", "export", "approve"] as const;

  // Idempotent: upsert each permission (handles re-runs + partial seed state)
  // NOTE: Sequential for-loops — Neon HTTP adapter does NOT support transactions.
  // NOTE: No deleteMany (uses implicit transaction) — upsert is atomic at DB level.
  for (const resource of allResources) {
    for (const action of allActions) {
      await prisma.permission.upsert({
        where: { roleId_resource_action: { roleId: adminRole.id, resource, action } },
        update: { scope: "all" },
        create: { roleId: adminRole.id, resource, action, scope: "all" },
      });
    }
  }
  console.log(`  ✓ Admin permissions: ${allResources.length} resources × ${allActions.length} actions`);
}

// ══════════════════════════════════════════════════════════════════
// 2. Departments
// ══════════════════════════════════════════════════════════════════

async function seedDepartments(): Promise<Record<string, string>> {
  console.log("\n[Departments] Seeding 6 departments...");

  const departments = [
    {
      key: "engineering",
      name: "Phòng Kỹ thuật",
      shortName: "IT",
      color: "#3B82F6",
      description: "Phòng Kỹ thuật — Dev, IT Support, xây dựng và duy trì hạ tầng công nghệ.",
      mission: "Xây dựng sản phẩm chất lượng cao, tối ưu hiệu suất và đảm bảo hệ thống ổn định 24/7.",
    },
    {
      key: "qc",
      name: "Phòng Kiểm soát chất lượng dự án",
      shortName: "QC",
      color: "#22C55E",
      description: "Phòng Kiểm soát chất lượng dự án — QA, Testing, Bug Tracking, đảm bảo chất lượng sản phẩm.",
      mission: "Đảm bảo chất lượng sản phẩm trước khi bàn giao, phát hiện và ngăn ngừa lỗi.",
    },
    {
      key: "pm",
      name: "Phòng Quản lý Dự án",
      shortName: "PM",
      color: "#EC4899",
      description: "Phòng Quản lý Dự án — Project Manager, Product Owner, điều phối và giám sát tiến độ dự án.",
      mission: "Điều phối dự án hiệu quả, đảm bảo tiến độ, chất lượng và sự hài lòng của khách hàng.",
    },
    {
      key: "seo",
      name: "Phòng SEO",
      shortName: "SEO",
      color: "#F59E0B",
      description: "Phòng SEO — Tối ưu công cụ tìm kiếm, Google Analytics, Content SEO, SEM.",
      mission: "Tăng thứ hạng website trên công cụ tìm kiếm, thu hút traffic organics và chuyển đổi khách hàng.",
    },
    {
      key: "media",
      name: "Phòng Media",
      shortName: "MED",
      color: "#8B5CF6",
      description: "Phòng Media — Content, Video, Social Media, Photography, xây dựng thương hiệu.",
      mission: "Sáng tạo nội dung số thu hút, xây dựng và truyền thông thương hiệu LOOP trên mọi nền tảng.",
    },
    {
      key: "ceo_office",
      name: "Ban Giám đốc",
      shortName: "CEO",
      color: "#EAB308",
      description: "Ban Giám đốc — CEO điều hành, định hướng chiến lược và giám sát toàn công ty.",
      mission: "Định hướng chiến lược phát triển, đảm bảo LOOP phát triển bền vững và đạt mục tiêu kinh doanh.",
    },
  ];

  const deptIds: Record<string, string> = {};
  for (const dept of departments) {
    const created = await prisma.department.upsert({
      where: { key: dept.key },
      update: {
        name: dept.name,
        shortName: dept.shortName,
        color: dept.color,
        description: dept.description,
        mission: dept.mission,
      },
      create: dept,
    });
    deptIds[dept.key] = created.id;
  }

  console.log(`  ✓ ${departments.length} departments seeded`);
  return deptIds;
}

// ══════════════════════════════════════════════════════════════════
// 3. Admin User
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
  // NOTE: upsert replaces deleteMany+create (which uses implicit transactions)
  const superAdminRole = await prisma.role.findUnique({ where: { name: "super_admin" } });
  const adminRole = await prisma.role.findUnique({ where: { name: "admin" } });

  if (superAdminRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: admin.id, roleId: superAdminRole.id } },
      update: { isActive: true },
      create: { userId: admin.id, roleId: superAdminRole.id, isActive: true },
    });
    console.log("  ✓ super_admin role assigned (level 0 — bypasses everything)");
  } else if (adminRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
      update: { isActive: true },
      create: { userId: admin.id, roleId: adminRole.id, isActive: true },
    });
    console.log("  ✓ admin role assigned (fallback — level 1)");
  }

  return admin;
}

// ══════════════════════════════════════════════════════════════════
// 2b. HR User (quynh@loop.vn)
// ══════════════════════════════════════════════════════════════════

async function seedHR() {
  // REMOVED: Quynh HR = Lê Ngọc Xuân Quỳnh (already seeded in seedAllTeamMembers)
  console.log("[HR] Skipped — Quynh HR removed (duplicate of Lê Ngọc Xuân Quỳnh)");
  return null;
}

// ══════════════════════════════════════════════════════════════════
// 2b. (continued) Access Tags (Member Onboarding v3)
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

async function seedCEO(deptIds: Record<string, string>) {
  console.log("\n[Team] Seeding CEO...");

  const data = {
    slug: "bui-nhat-duc-anh",
    name: "Bùi Nhật Đức Anh",
    role: "Founder & CEO",
 level: 200,
 rank: "diamond",
 availableLp: 999999,
 currentXp: 0,
 maxXp: 100,
 shortBio: "Một Gen Z đam mê công nghệ và nghệ thuật, người sáng lập LOOP với khát vọng xây dựng một môi trường lập trình tự do, sáng tạo và trân trọng tư duy thực tế.",
    bio: `"Xuất phát điểm là một Gen Z với tình yêu lớn dành cho việc giải quyết vấn đề, sáng tác âm nhạc và giáo dục, tôi luôn ấp ủ mang đến một làn gió mới cho ngành IT: trẻ trung, tự do và đậm chất nghệ thuật. Bước ra từ giai đoạn thị trường công nghệ đang có dấu hiệu bão hòa, tôi nhận thấy nhiều bạn trẻ đầy năng lượng lại dễ bị cản bước bởi những định kiến về "bằng cấp" hay "điểm số".

Chính vì vậy, tôi quyết định thành lập LOOP. Đây không chỉ là một tổ chức mà còn là một "sân chơi" công bằng, nơi tư duy logic và khả năng xử lý vấn đề thực tế được đặt lên hàng đầu. Tại LOOP, chúng tôi cùng nhau phá vỡ những giới hạn cũ để hết mình theo đuổi đam mê kiến tạo công nghệ trong kỷ nguyên số."`,
    image: "https://res.cloudinary.com/dhlmvawmi/image/upload/v1776433148/loop_avatars/rhcs4gl3rp51qszisxir.jpg",
    coverImage: "/images/team/ceo-cover-placeholder.jpg",
    quote: "Tư duy xử lý vấn đề quan trọng hơn bất kỳ điểm số hay nhãn mác nào.",
    email: "ducanhnhatbui@gmail.com",
    phone: "0378443602",
    linkedin: "https://linkedin.com/in/bui-nhat-duc-anh",
    achievements: [],
    skills: ["Leadership", "Product Strategy", "Enterprise Architecture", "Cloud Native"],
    roleLevel: -1,
    isFeatured: true,
    isActive: true,
    sortOrder: 0,
    departmentId: deptIds["ceo_office"],
  };

  await prisma.teamMember.upsert({
    where: { email: data.email },
    update: data,
    create: data,
  });
  console.log("  ✓ CEO upserted");
}

// ══════════════════════════════════════════════════════════════════
// 4. Service Attributes (Feature Catalog)
// ══════════════════════════════════════════════════════════════════

async function seedServiceAttributes() {
  console.log("\n[ServiceAttributes] Seeding...");

  // NOTE: No deleteMany (uses implicit transaction) — upsert is idempotent.
  // NOTE: ServiceAttribute.slug is @unique — upsert is safe.

  // Helper: upsert a service attribute by slug (ServiceAttribute.slug is @unique)
  // Accepts parentId as scalar FK — converts to nested relation connect internally.
  const upsertAttr = async (data: {
    slug: string;
    name: string; nameVi: string;
    nameEn?: string | null; nameJa?: string | null; nameKo?: string | null; nameZh?: string | null;
    description?: string | null; descriptionVi?: string | null;
    category: string; categoryVi: string;
    categoryEn?: string | null; categoryJa?: string | null; categoryKo?: string | null; categoryZh?: string | null;
    icon?: string | null; price?: number; isRequired?: boolean; sortOrder?: number;
    isActive?: boolean; tier?: string; xpPoints?: number;
    parentId?: string | null;
    includedInBase?: boolean;
  }) => {
    const { parentId, ...rest } = data;
    await prisma.serviceAttribute.upsert({
      where: { slug: data.slug },
      update: rest,
      create: {
        ...rest,
        ...(parentId ? { parent: { connect: { id: parentId } } } : {}),
      },
    });
  };

  // Parent groups — includedInBase for each group header
  // The base price (3,890,000₫) includes: responsive, SSL cơ bản, giỏ hàng cơ bản, SEO cơ bản, trang chủ
  const ecommerce = { slug: "shopping-cart", name: "Shopping Cart", nameVi: "Giỏ hàng", category: "Ecommerce", categoryVi: "Thương mại điện tử", price: 0, isRequired: false, tier: "basic", sortOrder: 1, includedInBase: false };
  const seo = { slug: "seo", name: "SEO", nameVi: "SEO", category: "Marketing", categoryVi: "Marketing", price: 0, isRequired: false, tier: "basic", sortOrder: 10, includedInBase: false };
  const security = { slug: "security", name: "Security", nameVi: "Bảo mật", category: "Security", categoryVi: "Bảo mật", price: 0, isRequired: false, tier: "basic", sortOrder: 20, includedInBase: false };

  await upsertAttr(ecommerce);
  await upsertAttr(seo);
  await upsertAttr(security);

  // Fetch actual parent IDs for children
  const parentMap: Record<string, string> = {};
  for (const s of [ecommerce, seo, security]) {
    const found = await prisma.serviceAttribute.findUnique({ where: { slug: s.slug }, select: { id: true } });
    parentMap[s.slug] = found!.id;
  }

  // Children — Ecommerce
  // includedInBase=true → đã bao gồm trong base price 3,890,000₫ → giá 0đ
  // advanced → tích thêm → giá extra
  await upsertAttr({
    slug: "basic-cart", name: "Basic Cart", nameVi: "Giỏ hàng cơ bản",
    description: "Chức năng giỏ hàng cơ bản — thêm/sửa/xóa sản phẩm, tổng cộng giỏ hàng, cập nhật số lượng.",
    descriptionVi: "Chức năng giỏ hàng cơ bản — thêm/sửa/xóa sản phẩm, tổng cộng giỏ hàng, cập nhật số lượng.",
    category: "Ecommerce", categoryVi: "Thương mại điện tử",
    price: 0, isRequired: false, tier: "basic", sortOrder: 2,
    parentId: parentMap["shopping-cart"], includedInBase: true,
  });
  // Upgrade: basic-cart (0đ) → advanced-cart: delta 500,000₫ (2,000,000 - 0)
  await upsertAttr({
    slug: "advanced-cart", name: "Advanced Cart", nameVi: "Giỏ hàng nâng cao",
    description: "Giỏ hàng nâng cao: so sánh sản phẩm, wishlist, thông báo giá giảm, đơn hàng theo dõi, coupon system.",
    descriptionVi: "Giỏ hàng nâng cao: so sánh sản phẩm, wishlist, thông báo giá giảm, đơn hàng theo dõi, coupon system.",
    category: "Ecommerce", categoryVi: "Thương mại điện tử",
    price: 500000, isRequired: false, tier: "advanced", sortOrder: 3,
    parentId: parentMap["shopping-cart"], includedInBase: false,
  });

  // Children — SEO
  await upsertAttr({
    slug: "basic-seo", name: "Basic SEO", nameVi: "SEO cơ bản",
    description: "Meta tags, sitemap.xml, schema markup cơ bản — giúp Google index website nhanh hơn.",
    descriptionVi: "Meta tags, sitemap.xml, schema markup cơ bản — giúp Google index website nhanh hơn.",
    category: "Marketing", categoryVi: "Marketing",
    price: 0, isRequired: false, tier: "basic", sortOrder: 11,
    parentId: parentMap["seo"], includedInBase: true,
  });
  await upsertAttr({
    slug: "advanced-seo", name: "Advanced SEO", nameVi: "SEO nâng cao",
    description: "Audit SEO toàn diện, tối ưu Core Web Vitals, backlink strategy, Google Search Console setup.",
    descriptionVi: "Audit SEO toàn diện, tối ưu Core Web Vitals, backlink strategy, Google Search Console setup.",
    category: "Marketing", categoryVi: "Marketing",
    price: 1500000, isRequired: false, tier: "advanced", sortOrder: 12,
    parentId: parentMap["seo"], includedInBase: false,
  });

  // Children — Security
  await upsertAttr({
    slug: "basic-ssl", name: "Basic SSL", nameVi: "SSL cơ bản",
    description: "Chứng chỉ SSL miễn phí Let's Encrypt — mã hóa dữ liệu, tăng trust trên trình duyệt.",
    descriptionVi: "Chứng chỉ SSL miễn phí Let's Encrypt — mã hóa dữ liệu, tăng trust trên trình duyệt.",
    category: "Security", categoryVi: "Bảo mật",
    price: 0, isRequired: false, tier: "basic", sortOrder: 21,
    parentId: parentMap["security"], includedInBase: true,
  });
  await upsertAttr({
    slug: "advanced-ssl", name: "Advanced SSL", nameVi: "SSL nâng cao",
    description: "Chứng chỉ SSL cao cấp (DigiCert/Comodo) kèm bảo hiểm bảo mật $10K+.",
    descriptionVi: "Chứng chỉ SSL cao cấp (DigiCert/Comodo) kèm bảo hiểm bảo mật $10K+.",
    category: "Security", categoryVi: "Bảo mật",
    price: 800000, isRequired: false, tier: "advanced", sortOrder: 22,
    parentId: parentMap["security"], includedInBase: false,
  });

  // Standalone features — Core (all includedInBase)
  // Tất cả features dưới đây đã bao gồm trong base price 3,890,000₫
  for (const s of [
    { slug: "menu", name: "Navigation Menu", nameVi: "Menu điều hướng", description: "Menu điều hướng responsive — mega menu, mobile hamburger, sticky header", descriptionVi: "Menu điều hướng responsive — mega menu, mobile hamburger, sticky header", category: "Core", categoryVi: "Cốt lõi", price: 0, isRequired: true, tier: "basic", sortOrder: 30, includedInBase: true },
    { slug: "responsive", name: "Responsive Design", nameVi: "Thiết kế responsive", description: "Thiết kế responsive — tương thích desktop, tablet, mobile", descriptionVi: "Thiết kế responsive — tương thích desktop, tablet, mobile", category: "Core", categoryVi: "Cốt lõi", price: 0, isRequired: true, tier: "basic", sortOrder: 31, includedInBase: true },
    { slug: "home-page", name: "Home Page", nameVi: "Trang chủ", description: "Trang chủ với hero banner, giới thiệu dịch vụ, portfolio, testimonial, footer liên hệ", descriptionVi: "Trang chủ với hero banner, giới thiệu dịch vụ, portfolio, testimonial, footer liên hệ", category: "Core", categoryVi: "Cốt lõi", price: 0, isRequired: true, tier: "basic", sortOrder: 32, includedInBase: true },
  ]) {
    await upsertAttr(s);
  }

  // Standalone advanced features — NOT included in base (tính phí thêm)
  for (const s of [
    { slug: "multilang", name: "Multi-language", nameVi: "Đa ngôn ngữ", description: "Hỗ trợ tối thiểu 2 ngôn ngữ — VN + EN + thêm 3 ngôn ngữ JA/KO/ZH", descriptionVi: "Hỗ trợ tối thiểu 2 ngôn ngữ — VN + EN + thêm 3 ngôn ngữ JA/KO/ZH", category: "Core", categoryVi: "Cốt lõi", price: 800000, isRequired: false, tier: "basic", sortOrder: 33, includedInBase: false },
    { slug: "blog-module", name: "Blog Module", nameVi: "Module Blog", description: "Quản lý bài viết — CMS, phân loại, bình luận, chia sẻ social", descriptionVi: "Quản lý bài viết — CMS, phân loại, bình luận, chia sẻ social", category: "Core", categoryVi: "Cốt lõi", price: 2000000, isRequired: false, tier: "basic", sortOrder: 34, includedInBase: false },
    { slug: "cms", name: "CMS Integration", nameVi: "Tích hợp CMS", description: "Kết nối Sanity/Contentful — quản lý nội dung động, multi-site", descriptionVi: "Kết nối Sanity/Contentful — quản lý nội dung động, multi-site", category: "Development", categoryVi: "Phát triển", price: 3000000, isRequired: false, tier: "basic", sortOrder: 40, includedInBase: false },
    { slug: "payment-gateway", name: "Payment Gateway", nameVi: "Cổng thanh toán", description: "Tích hợp VNPAY / MoMo / Zalopay — thanh toán QR, thẻ ATM, ví điện tử", descriptionVi: "Tích hợp VNPAY / MoMo / Zalopay — thanh toán QR, thẻ ATM, ví điện tử", category: "Ecommerce", categoryVi: "Thương mại điện tử", price: 4000000, isRequired: false, tier: "basic", sortOrder: 3, includedInBase: false },
    { slug: "analytics", name: "Analytics Dashboard", nameVi: "Dashboard Analytics", description: "Bảng điều khiển analytics riêng — theo dõi traffic, conversions, user behavior", descriptionVi: "Bảng điều khiển analytics riêng — theo dõi traffic, conversions, user behavior", category: "Development", categoryVi: "Phát triển", price: 2500000, isRequired: false, tier: "basic", sortOrder: 41, includedInBase: false },
  ]) {
    await upsertAttr(s);
  }

  console.log("  ✓ Service attributes seeded");
}

// ══════════════════════════════════════════════════════════════════
// 5. Pricing — Web Packages, Categories, Features, Hosting, Domain, Deployment
// ══════════════════════════════════════════════════════════════════

async function seedPricing() {
  console.log("\n[Pricing] Seeding...");

  // NOTE: No deleteMany (uses implicit transaction) — upsert is idempotent.
  // NOTE: All createMany replaced with upsert — Neon HTTP adapter doesn't support batch writes.

  // ── Web Packages ───────────────────────────────────────────────────────────────
  const webPackages = [
    { slug: "starter", name: "Starter", nameVi: "Khởi Đầu", tagline: "Perfect for landing pages & startups", taglineVi: "Phù hợp landing page & startup", price: 2980000, currency: "VND", period: "one-time", periodVi: "trọn gói", highlighted: false, cta: "Get Started", ctaVi: "Bắt Đầu", color: "#3B82F6", pages: "1-3 pages", pagesVi: "1-3 trang", sortOrder: 1 },
    { slug: "business", name: "Business", nameVi: "Doanh Nghiệp", tagline: "Best for growing businesses", taglineVi: "Tốt nhất cho doanh nghiệp đang phát triển", price: 4980000, currency: "VND", period: "one-time", periodVi: "trọn gói", highlighted: true, cta: "Get Started", ctaVi: "Bắt Đầu", color: "#6366F1", pages: "5-10 pages", pagesVi: "5-10 trang", sortOrder: 2 },
    { slug: "professional", name: "Professional", nameVi: "Chuyên Nghiệp", tagline: "Full-featured for established brands", taglineVi: "Đầy đủ tính năng cho thương hiệu lớn", price: 6980000, currency: "VND", period: "one-time", periodVi: "trọn gói", highlighted: false, cta: "Get Started", ctaVi: "Bắt Đầu", color: "#8B5CF6", pages: "15-30 pages", pagesVi: "15-30 trang", sortOrder: 3 },
    { slug: "enterprise", name: "Enterprise", nameVi: "Tập Đoàn", tagline: "Comprehensive solution for large organizations", taglineVi: "Giải pháp toàn diện cho tổ chức lớn", price: 8980000, currency: "VND", period: "one-time", periodVi: "trọn gói", highlighted: false, cta: "Contact Us", ctaVi: "Liên Hệ", color: "#EC4899", pages: "Unlimited", pagesVi: "Không giới hạn", sortOrder: 4 },
  ];
  for (const p of webPackages) {
    await prisma.pricingWebPackage.upsert({ where: { slug: p.slug }, update: p, create: p });
  }
  console.log("  ✓ Web Packages");

  // ── Feature Categories ───────────────────────────────────────────────────────
  const categoryMap: Record<string, string> = {};
  const categoryData = [
    { slug: "design", name: "Design", nameVi: "Thiết Kế", sortOrder: 1 },
    { slug: "development", name: "Development", nameVi: "Phát Triển", sortOrder: 2 },
    { slug: "seo", name: "SEO & Marketing", nameVi: "SEO & Marketing", sortOrder: 3 },
    { slug: "infrastructure", name: "Infrastructure", nameVi: "Hạ Tầng", sortOrder: 4 },
    { slug: "support", name: "Support", nameVi: "Hỗ Trợ", sortOrder: 5 },
  ];
  for (const cat of categoryData) {
    const created = await prisma.pricingFeatureCategory.upsert({ where: { slug: cat.slug }, update: cat, create: cat });
    categoryMap[cat.slug] = created.id;
  }
  console.log("  ✓ Feature Categories");

  // ── Comparison Features ────────────────────────────────────────────────────────
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
    const catId = categoryMap[f.categorySlug];
    const existing = await prisma.pricingComparisonFeature.findFirst({
      where: { name: f.name, categoryId: catId },
    });
    if (existing) {
      await prisma.pricingComparisonFeature.update({
        where: { id: existing.id },
        data: { nameVi: f.nameVi, values: f.values as object, sortOrder: f.sortOrder },
      });
    } else {
      await prisma.pricingComparisonFeature.create({
        data: { name: f.name, nameVi: f.nameVi, values: f.values as object, sortOrder: f.sortOrder, categoryId: catId },
      });
    }
  }
  console.log("  ✓ Comparison Features");

  // ── Hosting Plans ──────────────────────────────────────────────────────────────
  // monthlyPrice × months = basePrice; discountedPrice = basePrice × (1 - discountPct/100)
  // Free plan: 0đ, 12 months, no discount
  // Longer terms get progressive discounts
  const hostingPlans = [
    {
      slug: "free",
      name: "Free",
      nameVi: "Miễn Phí",
      monthlyPrice: 0,
      period: "1 năm",
      periodVi: "1 năm",
      months: 12,
      discountPct: 0,
      features: ["Tên miền sub-domain .loops.vn", "Shared hosting", "1GB SSD", "SSL miễn phí", "99% uptime", "Cơ bản support"],
      featuresVi: ["Tên miền sub-domain .loops.vn", "Shared hosting", "1GB SSD", "SSL miễn phí", "99% uptime", "Cơ bản support"],
      highlighted: false,
      color: "#6B7280",
      sortOrder: 1,
    },
    {
      slug: "starter-1yr",
      name: "Starter",
      nameVi: "Starter",
      monthlyPrice: 99000,
      period: "1 năm",
      periodVi: "1 năm",
      months: 12,
      discountPct: 0,
      features: ["Tên miền .com/.vn riêng", "Shared hosting", "5GB SSD", "SSL miễn phí", "Hỗ trợ email", "99.5% uptime", "Backup hàng tuần"],
      featuresVi: ["Tên miền .com/.vn riêng", "Shared hosting", "5GB SSD", "SSL miễn phí", "Hỗ trợ email", "99.5% uptime", "Backup hàng tuần"],
      highlighted: false,
      color: "#3B82F6",
      sortOrder: 2,
    },
    {
      slug: "starter-2yr",
      name: "Starter 2 Năm",
      nameVi: "Starter 2 Năm",
      monthlyPrice: 99000,
      period: "2 năm",
      periodVi: "2 năm",
      months: 24,
      discountPct: 15,
      features: ["Tên miền .com/.vn riêng", "Shared hosting", "5GB SSD", "SSL miễn phí", "Hỗ trợ email", "99.5% uptime", "Backup hàng tuần", "Tặng 1 tháng"],
      featuresVi: ["Tên miền .com/.vn riêng", "Shared hosting", "5GB SSD", "SSL miễn phí", "Hỗ trợ email", "99.5% uptime", "Backup hàng tuần", "Tặng 1 tháng"],
      highlighted: false,
      color: "#3B82F6",
      sortOrder: 3,
    },
    {
      slug: "pro-1yr",
      name: "Pro",
      nameVi: "Pro",
      monthlyPrice: 199000,
      period: "1 năm",
      periodVi: "1 năm",
      months: 12,
      discountPct: 0,
      features: ["Tên miền .com/.vn riêng", "VPS hosting", "20GB SSD", "SSL cao cấp", "CDN integration", "99.9% uptime", "Backup hàng ngày", "Priority support"],
      featuresVi: ["Tên miền .com/.vn riêng", "VPS hosting", "20GB SSD", "SSL cao cấp", "CDN integration", "99.9% uptime", "Backup hàng ngày", "Priority support"],
      highlighted: true,
      color: "#6366F1",
      sortOrder: 4,
    },
    {
      slug: "pro-2yr",
      name: "Pro 2 Năm",
      nameVi: "Pro 2 Năm",
      monthlyPrice: 199000,
      period: "2 năm",
      periodVi: "2 năm",
      months: 24,
      discountPct: 20,
      features: ["Tên miền .com/.vn riêng", "VPS hosting", "20GB SSD", "SSL cao cấp", "CDN integration", "99.9% uptime", "Backup hàng ngày", "Priority support", "Tặng 2 tháng"],
      featuresVi: ["Tên miền .com/.vn riêng", "VPS hosting", "20GB SSD", "SSL cao cấp", "CDN integration", "99.9% uptime", "Backup hàng ngày", "Priority support", "Tặng 2 tháng"],
      highlighted: false,
      color: "#6366F1",
      sortOrder: 5,
    },
    {
      slug: "enterprise-1yr",
      name: "Enterprise",
      nameVi: "Enterprise",
      monthlyPrice: 499000,
      period: "1 năm",
      periodVi: "1 năm",
      months: 12,
      discountPct: 0,
      features: ["Tên miền .com/.vn riêng", "Dedicated server", "Unlimited SSD", "SSL cao cấp", "CDN premium", "99.99% uptime SLA", "Backup real-time", "24/7 monitoring", "Dedicated support"],
      featuresVi: ["Tên miền .com/.vn riêng", "Server chuyên dụng", "Không giới hạn SSD", "SSL cao cấp", "CDN premium", "99.99% uptime SLA", "Backup real-time", "24/7 monitoring", "Dedicated support"],
      highlighted: false,
      color: "#8B5CF6",
      sortOrder: 6,
    },
    {
      slug: "enterprise-2yr",
      name: "Enterprise 2 Năm",
      nameVi: "Enterprise 2 Năm",
      monthlyPrice: 499000,
      period: "2 năm",
      periodVi: "2 năm",
      months: 24,
      discountPct: 25,
      features: ["Tên miền .com/.vn riêng", "Dedicated server", "Unlimited SSD", "SSL cao cấp", "CDN premium", "99.99% uptime SLA", "Backup real-time", "24/7 monitoring", "Dedicated support", "Tặng 3 tháng"],
      featuresVi: ["Tên miền .com/.vn riêng", "Server chuyên dụng", "Không giới hạn SSD", "SSL cao cấp", "CDN premium", "99.99% uptime SLA", "Backup real-time", "24/7 monitoring", "Dedicated support", "Tặng 3 tháng"],
      highlighted: false,
      color: "#8B5CF6",
      sortOrder: 7,
    },
  ];
  for (const p of hostingPlans) {
    await prisma.pricingHostingPlan.upsert({ where: { slug: p.slug }, update: p, create: p });
  }
  console.log("  ✓ Hosting Plans");

  // ── Domain Prices ────────────────────────────────────────────────────────────
  // inet.com prices × 1.25 for LOOP markup (as agreed with user)
  // Source: inet.com.vn domain registration prices (2026)
  const domainPrices = [
    { extension: ".com", registrationPrice: 350000, renewalPrice: 350000, period: "year", periodVi: "năm", note: "Phổ biến nhất — phù hợp mọi loại website", noteVi: "Phổ biến nhất — phù hợp mọi loại website", sortOrder: 1, isAvailable: true },
    { extension: ".vn", registrationPrice: 438000, renewalPrice: 438000, period: "year", periodVi: "năm", note: "Yêu cầu GPKD hoặc chứng minh thư (theo quy định .VN)", noteVi: "Yêu cầu GPKD hoặc chứng minh thư (theo quy định .VN)", sortOrder: 2, isAvailable: true },
    { extension: ".com.vn", registrationPrice: 563000, renewalPrice: 563000, period: "year", periodVi: "năm", note: "Yêu cầu GPKD", noteVi: "Yêu cầu GPKD", sortOrder: 3, isAvailable: true },
    { extension: ".net", registrationPrice: 400000, renewalPrice: 400000, period: "year", periodVi: "năm", note: "Phù hợp website công nghệ, network services", noteVi: "Phù hợp website công nghệ, network services", sortOrder: 4, isAvailable: true },
    { extension: ".org", registrationPrice: 438000, renewalPrice: 438000, period: "year", periodVi: "năm", note: "Thường dùng cho tổ chức phi lợi nhuận", noteVi: "Thường dùng cho tổ chức phi lợi nhuận", sortOrder: 5, isAvailable: true },
    { extension: ".info", registrationPrice: 313000, renewalPrice: 313000, period: "year", periodVi: "năm", note: "Phù hợp blog, trang thông tin", noteVi: "Phù hợp blog, trang thông tin", sortOrder: 6, isAvailable: true },
    { extension: ".biz", registrationPrice: 350000, renewalPrice: 350000, period: "year", periodVi: "năm", note: "Phù hợp website thương mại nhỏ", noteVi: "Phù hợp website thương mại nhỏ", sortOrder: 7, isAvailable: true },
    { extension: ".io", registrationPrice: 875000, renewalPrice: 875000, period: "year", periodVi: "năm", note: "Phổ biến trong giới startup/tech — giá cao do demand", noteVi: "Phổ biến trong giới startup/tech — giá cao do demand", sortOrder: 8, isAvailable: true },
  ];
  for (const d of domainPrices) {
    await prisma.pricingDomainPrice.upsert({ where: { extension: d.extension }, update: d, create: d });
  }
  console.log("  ✓ Domain Prices");

  // ── Deployment Items ───────────────────────────────────────────────────────────
  const deploymentItems = [
    { slug: "source-code", title: "Source Code", titleVi: "Mã Nguồn", description: "Full access to Git repository with complete source code", descriptionVi: "Toàn quyền truy cập Git repository với mã nguồn đầy đủ", handedToClient: true, icon: "GitBranch", sortOrder: 1 },
    { slug: "admin-access", title: "Admin Dashboard", titleVi: "Bảng Điều Khiển Admin", description: "Admin/CMS credentials for content management", descriptionVi: "Tài khoản admin/CMS để quản trị nội dung", handedToClient: true, icon: "LayoutDashboard", sortOrder: 2 },
    { slug: "hosting-panel", title: "Hosting Panel", titleVi: "Hosting Panel", description: "Access to Vercel dashboard or VPS control panel", descriptionVi: "Truy cập Vercel dashboard hoặc VPS panel", handedToClient: true, icon: "Server", sortOrder: 3 },
    { slug: "analytics", title: "Analytics Access", titleVi: "Truy Cập Analytics", description: "Google Analytics & Search Console ownership transfer", descriptionVi: "Chuyển quyền sở hữu Google Analytics & Search Console", handedToClient: true, icon: "BarChart3", sortOrder: 4 },
    { slug: "ssl", title: "SSL Certificate", titleVi: "Chứng Chỉ SSL", description: "Auto-renewed SSL certificate via Let's Encrypt", descriptionVi: "Chứng chỉ SSL tự động gia hạn qua Let's Encrypt", handedToClient: true, icon: "ShieldCheck", sortOrder: 5 },
    { slug: "cicd-docs", title: "CI/CD Documentation", titleVi: "Tài Liệu CI/CD", description: "Complete deployment pipeline documentation", descriptionVi: "Tài liệu đầy đủ về quy trình triển khai", handedToClient: true, icon: "FileText", sortOrder: 6 },
    { slug: "dns-guide", title: "DNS Configuration", titleVi: "Cấu Hình DNS", description: "Step-by-step DNS setup guide for your domain", descriptionVi: "Hướng dẫn cấu hình DNS chi tiết cho tên miền", handedToClient: true, icon: "Globe", sortOrder: 7 },
    { slug: "training", title: "Content Training", titleVi: "Đào Tạo Quản Trị", description: "Hands-on training session for content management", descriptionVi: "Buổi đào tạo thực hành quản trị nội dung", handedToClient: true, icon: "GraduationCap", sortOrder: 8 },
    { slug: "domain", title: "Domain Registration", titleVi: "Đăng Ký Tên Miền", description: "Domain registration requires the owner's business license", descriptionVi: "Đăng ký tên miền yêu cầu GPKD của chính chủ sở hữu", handedToClient: false, icon: "AlertTriangle", note: "Vietnamese .vn domains require GPKD. We recommend registering through PA Vietnam, Mắt Bão, or Nhân Hòa.", noteVi: "Tên miền .vn yêu cầu Giấy phép Kinh doanh (GPKD). Chúng tôi khuyến nghị đăng ký qua PA Vietnam, Mắt Bão, hoặc Nhân Hòa.", sortOrder: 9 },
  ];
  for (const d of deploymentItems) {
    await prisma.pricingDeploymentItem.upsert({ where: { slug: d.slug }, update: d, create: d });
  }
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
    { slug: "loop-intro", titleVi: "Giới thiệu về LOOP", descriptionVi: "Xem video giới thiệu về công ty LOOP", videoUrl: "/videos/loop-intro.mp4", thumbnailUrl: "/images/ads/loop-intro.jpg", duration: 30, points: 5, xpBonus: 1, dailyLimit: 10, watchCooldown: 60, minLevel: 1, requiresPurchase: false, sortOrder: 1 },
    { slug: "web-design-tips", titleVi: "Mẹo thiết kế website", descriptionVi: "Học các mẹo thiết kế web từ chuyên gia", videoUrl: "/videos/web-tips.mp4", thumbnailUrl: "/images/ads/web-tips.jpg", duration: 60, points: 10, xpBonus: 2, dailyLimit: 5, watchCooldown: 120, minLevel: 2, requiresPurchase: false, sortOrder: 2 },
    { slug: "seo-basics", titleVi: "Cơ bản về SEO", descriptionVi: "Học kiến thức cơ bản về SEO cho website của bạn", videoUrl: "/videos/seo-basics.mp4", thumbnailUrl: "/images/ads/seo-basics.jpg", duration: 45, points: 8, xpBonus: 2, dailyLimit: 5, watchCooldown: 120, minLevel: 1, requiresPurchase: false, sortOrder: 3 },
    { slug: "hosting-benefits", titleVi: "Lợi ích Hosting Premium", descriptionVi: "Khám phá các tính năng hosting cao cấp", videoUrl: "/videos/hosting-benefits.mp4", thumbnailUrl: "/images/ads/hosting-benefits.jpg", duration: 90, points: 15, xpBonus: 3, dailyLimit: 3, watchCooldown: 300, minLevel: 3, requiresPurchase: true, sortOrder: 4 },
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
    { name: "Media", category: "media", icon: "Video", sortOrder: 35 },
    { name: "Video Production", category: "media", icon: "Film", sortOrder: 36 },
    { name: "Photography", category: "media", icon: "Camera", sortOrder: 37 },
    { name: "Branding", category: "media", icon: "Sparkles", sortOrder: 38 },
    { name: "SEO", category: "seo", icon: "Search", sortOrder: 45 },
    { name: "Google Analytics", category: "seo", icon: "BarChart", sortOrder: 46 },
    { name: "Google Search Console", category: "seo", icon: "SearchCheck", sortOrder: 47 },
    { name: "Content Marketing", category: "marketing", icon: "FileText", sortOrder: 51 },
    { name: "Social Media", category: "marketing", icon: "Share2", sortOrder: 52 },
    { name: "Manual Testing", category: "qa", icon: "CheckCircle", sortOrder: 61 },
    { name: "Bug Tracking", category: "qa", icon: "Bug", sortOrder: 62 },
    { name: "API Testing", category: "qa", icon: "Plug", sortOrder: 63 },
    { name: "Test Automation", category: "qa", icon: "Zap", sortOrder: 64 },
    { name: "Performance Testing", category: "qa", icon: "Gauge", sortOrder: 65 },
    { name: "Regression Testing", category: "qa", icon: "RefreshCw", sortOrder: 66 },
    { name: "Selenium", category: "qa", icon: "Automation", sortOrder: 67 },
    { name: "Postman", category: "qa", icon: "Send", sortOrder: 68 },
    { name: "Documentation", category: "qa", icon: "FileText", sortOrder: 69 },
    { name: "Agile/Scrum", category: "management", icon: "Kanban", sortOrder: 41 },
    { name: "System Architecture", category: "architecture", icon: "Component", sortOrder: 42 },
  ];

  for (const skill of expertises) {
    const existing = await prisma.expertise.findFirst({ where: { name: skill.name } });
    if (existing) {
      await prisma.expertise.update({
        where: { id: existing.id },
        data: { category: skill.category, icon: skill.icon, isActive: true, sortOrder: skill.sortOrder },
      });
    } else {
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

// ══════════════════════════════════════════════════════════════════
// 9b. Service Tiers — 4 services × 3 tiers (Basic/Business/Experience)
// ══════════════════════════════════════════════════════════════════

async function seedServiceTiers() {
  console.log("\n[ServiceTiers] Seeding 4 services × 3 tiers...");

  const tiers = [
    // ── WEB ──────────────────────────────────────────────────────
    { serviceKey: "web", level: 1, name: "Cơ Bản", nameEn: "Basic",
      shortDesc: "Phù hợp khởi nghiệp, website giới thiệu doanh nghiệp nhỏ",
      shortDescEn: "Perfect for startups and small business websites",
      basePrice: 3_890_000, marketPrice: 5_500_000, lpReward: 50, sortOrder: 1 },
    { serviceKey: "web", level: 2, name: "Doanh Nghiệp", nameEn: "Business",
      shortDesc: "Thiết kế tùy chỉnh theo thương hiệu, doanh nghiệp vừa và lớn",
      shortDescEn: "Custom branding design for medium and large businesses",
      basePrice: 5_890_000, marketPrice: 8_900_000, lpReward: 80, sortOrder: 2 },
    { serviceKey: "web", level: 3, name: "Chuyên Nghiệp", nameEn: "Experience",
      shortDesc: "Giao diện độc quyền Next.js, giải pháp toàn diện",
      shortDescEn: "Exclusive Next.js design, comprehensive solution",
      basePrice: 9_890_000, marketPrice: 12_000_000, lpReward: 120, sortOrder: 3 },

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

  let count = 0;
  for (const t of tiers) {
    await prisma.serviceTier.upsert({
      where: { serviceKey_level: { serviceKey: t.serviceKey, level: t.level } },
      create: {
        serviceKey: t.serviceKey, level: t.level,
        name: t.name, nameEn: t.nameEn,
        shortDesc: t.shortDesc, shortDescEn: t.shortDescEn,
        basePrice: t.basePrice, marketPrice: t.marketPrice,
        lpReward: t.lpReward, sortOrder: t.sortOrder, isActive: true,
      },
      update: {
        name: t.name, nameEn: t.nameEn,
        shortDesc: t.shortDesc, shortDescEn: t.shortDescEn,
        basePrice: t.basePrice, marketPrice: t.marketPrice,
        lpReward: t.lpReward, sortOrder: t.sortOrder, isActive: true,
      },
    });
    count++;
  }
  console.log("  ✓ " + count + " service tiers (4 services × 3 tiers)");
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
    // Base price for Custom Web: includes responsive, SSL, cart, SEO, home page (3,890,000₫)
    { key: "custom_web_base_price", value: "3890000", group: "pricing" },
    // Website marketing pricing config — controls package display prices + promotions
    // Admin sửa tại: Admin → Settings → Pricing (hoặc Admin → Settings → Site Settings)
    // Shape: { marketPrices: {"basic":5500000,"business":8900000,"experience":12000000}, promotion: { active: true, label: "..." }, slotsLeft: 3 }
    {
      key: "website_pricing_config",
      value: JSON.stringify({
        marketPrices: {
          basic: 5_500_000,
          business: 8_900_000,
          experience: 12_000_000,
        },
        promotion: { active: false, label: "Giảm ngay 10%" },
        slotsLeft: 3,
      }),
      group: "marketing",
    },
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


// Member → system role mapping (used by seedAllTeamMembers + seedTeamUsers)
const MEMBER_SYSTEM_ROLE: Record<string, string> = {
 "nguyen-phuc-thuan": "project_manager",
 "tran-vu-hung": "project_manager",
 "le-ngoc-xuan-quynh": "project_manager",
 "duong-gia-lac": "member",
 "nguyen-trong-quy": "member",
 "do-tan-tai": "member",
 "nguyen-minh-tri": "member",
 "le-van-thuan": "qa",
 "tran-hoang-anh": "qa",
 "ha-the-anh": "qa",
 "luong-hoang-thong": "qa",
 "tran-vo-thuy-duong": "media",
 "nguyen-phuc-thinh": "media",
};
// ── Seed all 13 team members (CEO already seeded separately) ─────────────────
async function seedAllTeamMembers(deptIds: Record<string, string>) {
  console.log("\n[R2-TeamMembers] Seeding 13 team members with new department structure...");

 // ── RBAC constants ──────────────────────────────────────────────────────────
 const ROLE_TABS: Record<string, string[]> = {
 project_manager: ["overview","orders","clients","quotation","services","revenue","projects","members","departments","notification_center","leaderboard_admin","lp_manage","quests_events","academy","blog","lp","portfolio","projects_completed","kanban","figma_demos","analytics"],
 qa: ["overview","projects","notification_center","orders","clients","members","academy","leaderboard_admin","lp"],
 media: ["overview","media","blog","academy","members","notification_center","leaderboard_admin","quests_events","orders","projects","clients","services","portfolio","revenue"],
 member: ["overview","notification_center","leaderboard_admin","academy","quests_events"],
 };
 const ROLE_TAGS: Record<string, string[]> = {
 project_manager: ["kanban","order-basic","order-manage"],
 qa: ["kanban","order-basic"],
 media: ["kanban","order-basic","blog-post"],
 member: ["kanban","order-basic"],
 };
 const ROLE_LEVELS: Record<string, number> = {
 project_manager: 3, qa: 5, media: 4, member: 6,
 };

 const members = [
 // ── Ban Giám đốc ────────────────────────────────────────────────────────────
 // CEO already seeded in seedCEO() — no member here

 // ── Phòng Quản lý Dự án (PM) ───────────────────────────────────────────────
 { slug: "nguyen-phuc-thuan", name: "Nguyễn Phúc Thuần", title: "Project Manager", bio: "Điều phối và quản lý dự án, đảm bảo tiến độ và chất lượng.", shortBio: "PM — Quản lý dự án.", level: 1, rank: "iron", availableLp: 0, currentXp: 0, maxXp: 100, isActive: true, isFeatured: false, sortOrder: 1, deptKey: "pm" },
 { slug: "tran-vu-hung", name: "Trần Vũ Hùng", title: "Project Manager", bio: "Quản lý tiến độ và phối hợp các bên liên quan.", shortBio: "PM — Quản lý tiến độ.", level: 1, rank: "iron", availableLp: 0, currentXp: 0, maxXp: 100, isActive: true, isFeatured: false, sortOrder: 2, deptKey: "pm" },
 { slug: "le-ngoc-xuan-quynh", name: "Lê Ngọc Xuân Quỳnh", title: "PM Tập Sự", bio: "Hỗ trợ quản lý dự án, học hỏi và phát triển kỹ năng PM.", shortBio: "PM tập sự.", level: 1, rank: "iron", availableLp: 0, currentXp: 0, maxXp: 100, isActive: true, isFeatured: false, sortOrder: 3, deptKey: "pm" },

 // ── Phòng Kỹ thuật (IT) ───────────────────────────────────────────────────
 { slug: "nguyen-trong-quy", name: "Nguyễn Trọng Quý", title: "Developer", bio: "Phát triển web và ứng dụng.", shortBio: "Dev.", level: 1, rank: "iron", availableLp: 0, currentXp: 0, maxXp: 100, isActive: true, isFeatured: false, sortOrder: 4, deptKey: "engineering" },
 { slug: "do-tan-tai", name: "Đỗ Tấn Tài", title: "Developer", bio: "Phát triển phần mềm và tối ưu hiệu suất.", shortBio: "Dev.", level: 1, rank: "iron", availableLp: 0, currentXp: 0, maxXp: 100, isActive: true, isFeatured: false, sortOrder: 5, deptKey: "engineering" },
 { slug: "nguyen-minh-tri", name: "Nguyễn Minh Trí", title: "IT Support", bio: "Hỗ trợ hạ tầng kỹ thuật, quản trị hệ thống.", shortBio: "IT Support.", level: 1, rank: "iron", availableLp: 0, currentXp: 0, maxXp: 100, isActive: true, isFeatured: false, sortOrder: 6, deptKey: "engineering" },

 // ── Phòng Kiểm soát chất lượng dự án (QC) ────────────────────────────────
 { slug: "le-van-thuan", name: "Lê Văn Thuận", title: "QA Engineer", bio: "Kiểm thử chất lượng sản phẩm, phát hiện và báo cáo lỗi.", shortBio: "QA Engineer.", level: 1, rank: "iron", availableLp: 0, currentXp: 0, maxXp: 100, isActive: true, isFeatured: false, sortOrder: 7, deptKey: "qc" },
 { slug: "tran-hoang-anh", name: "Trần Hoàng Anh", title: "QA Engineer", bio: "Kiểm thử chức năng và hồ sơ lỗi.", shortBio: "QA Engineer.", level: 1, rank: "iron", availableLp: 0, currentXp: 0, maxXp: 100, isActive: true, isFeatured: false, sortOrder: 8, deptKey: "qc" },
 { slug: "ha-the-anh", name: "Hà Thế Anh", title: "QA Engineer", bio: "Kiểm thử phần mềm và đảm bảo chất lượng.", shortBio: "QA Engineer.", level: 1, rank: "iron", availableLp: 0, currentXp: 0, maxXp: 100, isActive: true, isFeatured: false, sortOrder: 9, deptKey: "qc" },
 { slug: "luong-hoang-thong", name: "Lương Hoàng Thông", title: "QA Engineer", bio: "Kiểm thử và đảm bảo chất lượng sản phẩm.", shortBio: "QA Engineer.", level: 1, rank: "iron", availableLp: 0, currentXp: 0, maxXp: 100, isActive: true, isFeatured: false, sortOrder: 10, deptKey: "qc" },

 // ── Phòng SEO ──────────────────────────────────────────────────────────────
 { slug: "duong-gia-lac", name: "Dương Gia Lạc", title: "SEO & Developer", bio: "Tối ưu SEO, phân tích Google Analytics và phát triển web.", shortBio: "SEO Specialist.", level: 1, rank: "iron", availableLp: 0, currentXp: 0, maxXp: 100, isActive: true, isFeatured: false, sortOrder: 11, deptKey: "seo" },

 // ── Phòng Media ────────────────────────────────────────────────────────────
 { slug: "nguyen-phuc-thinh", name: "Nguyễn Phúc Thịnh", title: "Trưởng phòng Media", bio: "Trưởng phòng Media — quản lý nội dung, video, social media và truyền thông.", shortBio: "Trưởng phòng Media.", level: 15, rank: "bronze", availableLp: 0, currentXp: 0, maxXp: 100, isActive: true, isFeatured: false, sortOrder: 12, deptKey: "media" },
 { slug: "tran-vo-thuy-duong", name: "Trần Võ Thuỳ Dương", title: "Đại sứ Truyền thông", bio: "Đại sứ truyền thông và marketing, xây dựng thương hiệu LOOP.", shortBio: "Đại sứ Truyền thông.", level: 1, rank: "iron", availableLp: 0, currentXp: 0, maxXp: 100, isActive: true, isFeatured: false, sortOrder: 13, deptKey: "media" },
];

  const memberCUIDs: Record<string, string> = {};
  for (const m of members) {
    const deptId = deptIds[m.deptKey];
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
          departmentId: deptId,
          roleLevel: ROLE_LEVELS[MEMBER_SYSTEM_ROLE[m.slug] ?? "member"],
          tabPermissions: ROLE_TABS[MEMBER_SYSTEM_ROLE[m.slug] ?? "member"],
          accessTags: ROLE_TAGS[MEMBER_SYSTEM_ROLE[m.slug] ?? "member"],
        },
      });
      memberCUIDs[m.slug] = existing.id;
      console.log(`  ↻ ${m.name} (${m.rank}/${m.level}) → ${m.deptKey} updated`);
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
          departmentId: deptId,
          roleLevel: ROLE_LEVELS[MEMBER_SYSTEM_ROLE[m.slug] ?? "member"],
          tabPermissions: ROLE_TABS[MEMBER_SYSTEM_ROLE[m.slug] ?? "member"],
          accessTags: ROLE_TAGS[MEMBER_SYSTEM_ROLE[m.slug] ?? "member"],
        },
      });
      memberCUIDs[m.slug] = created.id;
      console.log(`  ✓ ${m.name} (${m.rank}/${m.level}) → ${m.deptKey} created`);
    }
  }
  return memberCUIDs;
}

// ── Seed Team Users (User records for team members — needed for QuestParticipant) ─
async function seedTeamUsers(memberCUIDs: Record<string, string>): Promise<Record<string, string>> {
  console.log("\n[R2-TeamUsers] Creating User records for team members...");

  // Create User accounts for seeded members (so they can participate in quests/events)
  // NOTE: Only 10 members are seeded — matching the trimmed member list above
  const teamUsers: Array<{ slug: string; name: string; email: string }> = [
 { slug: "nguyen-phuc-thuan", name: "Nguyễn Phúc Thuần", email: "phucthuancl@loop.vn" },
 { slug: "tran-vu-hung", name: "Trần Vũ Hùng", email: "tranvuhung@loop.vn" },
 { slug: "le-ngoc-xuan-quynh", name: "Lê Ngọc Xuân Quỳnh", email: "quynhle@loop.vn" },
 { slug: "duong-gia-lac", name: "Dương Gia Lạc", email: "duonggialac@loop.vn" },
 { slug: "nguyen-trong-quy", name: "Nguyễn Trọng Quý", email: "nguyentrongquy@loop.vn" },
 { slug: "do-tan-tai", name: "Đỗ Tấn Tài", email: "dotantai@loop.vn" },
 { slug: "nguyen-minh-tri", name: "Nguyễn Minh Trí", email: "nguyenminhtri@loop.vn" },
 { slug: "le-van-thuan", name: "Lê Văn Thuận", email: "levanthuan@loop.vn" },
 { slug: "tran-hoang-anh", name: "Trần Hoàng Anh", email: "hoanganh@loop.vn" },
 { slug: "ha-the-anh", name: "Hà Thế Anh", email: "hetheanh@loop.vn" },
 { slug: "luong-hoang-thong", name: "Lương Hoàng Thông", email: "luonghoangthong@loop.vn" },
 { slug: "tran-vo-thuy-duong", name: "Trần Võ Thuỳ Dương", email: "voduong@loop.vn" },
 { slug: "nguyen-phuc-thinh", name: "Nguyễn Phúc Thịnh", email: "nguyenphucthinh@loop.vn" },
];

  const userIdMap: Record<string, string> = {};
  for (const u of teamUsers) {
    const memberId = memberCUIDs[u.slug];
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      // Update teamMemberId link if not set
      if (memberId && !existing.teamMemberId) {
        await prisma.user.update({ where: { id: existing.id }, data: { teamMemberId: memberId } });
      }
      userIdMap[u.slug] = existing.id;
    } else {
      const created = await prisma.user.create({
        data: {
          email: u.email,
          name: u.name,
          role: MEMBER_SYSTEM_ROLE[u.slug] ?? "member",
          isActive: true,
          accountType: "staff",
          teamMemberId: memberId ?? undefined,
        },
      });
      userIdMap[u.slug] = created.id;
      console.log(`  ✓ User created: ${u.email} → ${u.name} (teamMemberId=${memberId ?? "none"})`);
    }
  }
  console.log(`  ✓ ${Object.keys(userIdMap).length} team user accounts`);
  return userIdMap;
}

// ── Seed MemberExpertise ──────────────────────────────────────────────────────────
async function seedMemberExpertise(memberCUIDs: Record<string, string>) {
  console.log("\n[R2-Expertise] Seeding member-expertise links...");

  const expertiseLinks: Record<string, string[]> = {
  "nguyen-phuc-thuan": ["Project Management", "Jira", "Scrum", "Notion"],
 "tran-vu-hung": ["Project Management", "Agile", "Trello", "Slack"],
 "le-ngoc-xuan-quynh": ["Project Management", "Notion", "Communication"],
 "duong-gia-lac": ["SEO", "Google Analytics", "Google Search Console", "React", "Next.js"],
 "nguyen-trong-quy": ["Frontend", "JavaScript", "CSS", "React"],
 "do-tan-tai": ["Frontend", "React", "TypeScript", "Next.js"],
 "nguyen-minh-tri": ["IT Support", "Hardware", "Networking", "Linux", "Docker"],
 "le-van-thuan": ["QA", "Manual Testing", "Jira", "Bug Tracking", "API Testing"],
  "tran-hoang-anh": ["QA", "Test Automation", "Selenium", "Jira"],
 "ha-the-anh": ["QA", "Performance Testing", "Postman", "API Testing"],
 "luong-hoang-thong": ["QA", "Regression Testing", "Jira", "Documentation"],
 "tran-vo-thuy-duong": ["Marketing", "Content Marketing", "Social Media", "Branding"],
 "nguyen-phuc-thinh": ["Media", "Video Production", "Social Media", "Photography", "Branding"],
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

  // VNRetail (ORD-2601): Yuna (PM), Ryo (dev), Akira (seo consultant)
  const vnRetail = [
    { slug: "yuna-park",        projectRoleKey: "pm",       assignedLp: 3000 },
    { slug: "ryo-hashimoto",    projectRoleKey: "dev",      assignedLp: 2500 },
    { slug: "akira-sato",       projectRoleKey: "seo",      assignedLp: 1500 },
  ];
  // MedApp (ORD-2602): Mei Lin (PM), Haru (designer)
  const medApp = [
    { slug: "mei-lin",         projectRoleKey: "pm",       assignedLp: 2000 },
    { slug: "haru-tanaka",     projectRoleKey: "designer", assignedLp: 1500 },
  ];
  // EduViet SEO (ORD-2505): Yuna (PM)
  const eduViet = [
    { slug: "yuna-park",       projectRoleKey: "pm",       assignedLp: 4000 },
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
          memberId, projectId, projectRoleKey: link.projectRoleKey,
          assignedLp: link.assignedLp, joinedAt: new Date("2026-03-10T08:00:00Z"),
        },
        update: { projectRoleKey: link.projectRoleKey, assignedLp: link.assignedLp },
      });
      linkCount++;
    }
  }
  console.log(`  ✓ ${linkCount} project member links`);
}

// ── Seed LP economy: CustomerPoints + LpTransactions ─────────────────────────
async function seedLPEconomy(memberCUIDs: Record<string, string>, _teamUserIds: Record<string, string>) {
  console.log("\n[R2-LPEconomy] Seeding LP economy...");

  // NOTE: No deleteMany — LpTransaction uses @default(cuid()) (can't upsert).
  // On re-run, LpTransaction records accumulate (expected for audit trail).
  // CustomerPoint uses upsert by userEmail (unique constraint) so no deleteMany needed.

  // CustomerPoints for all seeded members
  const pointIdMap: Record<string, string> = {};
  for (const [slug, memberId] of Object.entries(memberCUIDs)) {
    const email = `${slug}@loop.vn`;
    const id = `loop-pt-${slug}`;
    pointIdMap[slug] = id;
    await prisma.customerPoint.upsert({
      where: { userEmail: email },
      update: { userId: memberId, userName: slug, balance: 0, totalEarned: 0, totalSpent: 0 },
      create: { id, userId: memberId, userEmail: email, userName: slug, balance: 0, totalEarned: 0, totalSpent: 0 },
    });
  }
  console.log(`  ✓ ${Object.keys(pointIdMap).length} customer points (LP balance = 0 — updated via LP transactions)`);

  // LpTransactions: synthetic history per member
  // Realistic LP earning pattern: task completion + quest rewards + order LP
  const lpHistory: Array<{ memberSlug: string, amount: number, type: string, description: string, source: string, daysAgo: number }> = [];

  // Add some history entries per seeded member
  const activeMembers = ["kai-tanaka", "mei-lin", "ryo-hashimoto", "yuna-park", "shin-watanabe",
    "akira-sato", "tran-huu-phuc", "vu-dinh-trong", "haru-tanaka"];

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

    // Use projectId as part of id to create unique epic per order
    // Epic.id = CUID — upsert with a project-scoped key
    const epicId = `epic-${epic.slug}`;
    const createdEpic = await prisma.epic.upsert({
      where: { id: epicId },
      update: { title: epic.title, color: epic.color, isActive: true, projectId },
      create: { id: epicId, title: epic.title, color: epic.color, isActive: true, projectId },
    });
    epicCount++;

    // Default backlog
    const backlog = await prisma.backlog.upsert({
      where: { id: `backlog-${epic.slug}` },
      update: { title: "Sprint Backlog", isDefault: true, isActive: true },
      create: { id: `backlog-${epic.slug}`, title: "Sprint Backlog", name: "Sprint Backlog", isDefault: true, isActive: true, epicId: createdEpic.id, projectId },
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
        where: { id: `task-${epic.slug}-${i + 1}` },
        create: {
          id: `task-${epic.slug}-${i + 1}`,
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
async function seedR2(deptIds: Record<string, string>) {
  console.log("\n" + "═".repeat(50));
  console.log("🌱 R2 — Unified Demo Data Seed (2026-03-30)");
  console.log("═".repeat(50));

  const memberCUIDs = await seedAllTeamMembers(deptIds);
  const teamUserIds = await seedTeamUsers(memberCUIDs);
  await seedMemberExpertise(memberCUIDs);

  // ── Update department heads ────────────────────────────────────────────────
  // CEO is the head of Ban Giám đốc
  const ceoId = memberCUIDs["bui-nhat-duc-anh"];
  if (ceoId) {
    await prisma.department.updateMany({
      where: { key: "ceo_office" },
      data: { headId: ceoId },
    });
  }
  // Trưởng phòng Media — Nguyễn Phúc Thịnh
  const mediaHeadId = memberCUIDs["nguyen-phuc-thinh"];
  if (mediaHeadId) {
    await prisma.department.updateMany({
      where: { key: "media" },
      data: { headId: mediaHeadId },
    });
    await prisma.teamMember.updateMany({
      where: { slug: "nguyen-phuc-thinh" },
      data: { isDeptHead: true },
    });
  }
  console.log("  ✓ Department heads updated");
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
  // Rank history: generate rank transition records from LP transactions
  await seedRankHistory(memberCUIDs);

  console.log("\n✅ R2 seed complete — all demo data unified");
}

// ── Seed Rank History ───────────────────────────────────────────────────────────
// Generates rank transition records from member level milestones.
// Rank thresholds (from guildMemberData.ts):
//   Iron → Bronze: level 15
//   Bronze → Silver: level 35
//   Silver → Gold: level 55
//   Gold → Platinum: level 75
//   Platinum → Ruby: level 95
//   Ruby → Diamond: level 115
const RANK_THRESHOLDS = [
  { minLevel: 1,  maxLevel: 14,  rank: "iron" },
  { minLevel: 15, maxLevel: 34,  rank: "bronze" },
  { minLevel: 35, maxLevel: 54,  rank: "silver" },
  { minLevel: 55, maxLevel: 74,  rank: "gold" },
  { minLevel: 75, maxLevel: 94,  rank: "platinum" },
  { minLevel: 95, maxLevel: 114, rank: "ruby" },
  { minLevel: 115, maxLevel: Infinity, rank: "diamond" },
];

function getRankFromLevel(level: number): string {
  for (const t of RANK_THRESHOLDS) {
    if (level >= t.minLevel && level <= t.maxLevel) return t.rank;
  }
  return "iron";
}

const RANK_REASONS: Record<string, string[]> = {
  iron:     ["Gia nhập LOOP", "Bắt đầu hành trình", "Sẵn sàng chiến đấu"],
  bronze:   ["Hoàn thành 5 nhiệm vụ đầu tiên", "Team vượt sprint đầu", "Không ngừng tiến lên"],
  silver:   ["Hoàn thành 10 task phức tạp", "Thành thạo tech stack", "Tốc độ tăng trưởng ấn tượng"],
  gold:     ["Dẫn dắt dự án thành công", "Đạt top 20% team", "Elite performer"],
  platinum: ["CTO đánh giá xuất sắc", "100% uptime dự án", "Lead engineer của tháng"],
  ruby:     ["Thành tựu vượt kỳ vọng", "Architect của quý", "Đỉnh cao không ngừng"],
  diamond:  ["Guild Master confirmed", "Huyền thoại sống", "Elite Tier achieved"],
};

async function seedRankHistory(memberCUIDs: Record<string, string>) {
  console.log("\n[RankHistory] Seeding rank transition history...");

  // Get all seeded members with their levels
  const members = await prisma.teamMember.findMany({
    where: { slug: { in: Object.keys(memberCUIDs) } },
    select: { id: true, slug: true, level: true, rank: true },
  });

  let transitions = 0;
  for (const m of members) {
    const currentLevel = m.level ?? 1;
    const currentRank = m.rank ?? "iron";

    // Find all rank milestones this member has passed
    const passedThresholds: string[] = [];
    for (const t of RANK_THRESHOLDS) {
      if (currentLevel > t.maxLevel && t.rank !== currentRank) {
        passedThresholds.push(t.rank);
      }
    }

    // Get LpTransactions to use as rank-up date sources
    const transactions = await prisma.lpTransaction.findMany({
      where: { memberId: m.id },
      orderBy: { createdAt: "asc" },
      take: passedThresholds.length,
    });

    for (let i = 0; i < passedThresholds.length; i++) {
      const toRank = passedThresholds[i];
      const fromRank = RANK_THRESHOLDS[RANK_THRESHOLDS.findIndex((t) => t.rank === toRank) - 1]?.rank ?? "iron";
      const reason = RANK_REASONS[toRank]?.[Math.floor(Math.random() * RANK_REASONS[toRank].length)] ?? `Thăng hạng ${toRank}`;

      // Use transaction date if available, otherwise estimate
      const txDate = transactions[i]?.createdAt;
      const rankUpDate = txDate
        ? new Date(txDate.getTime() + Math.random() * 86400 * 1000)
        : new Date(Date.now() - (currentLevel - RANK_THRESHOLDS.find((t) => t.rank === toRank)!.minLevel) * 7 * 86400 * 1000);

      // Create a synthetic "rank-up" LpTransaction record to serve as rank history
      await prisma.lpTransaction.upsert({
        where: {
          id: `rankup-${m.id}-${toRank}-${i}`,
        },
        update: {},
        create: {
          id: `rankup-${m.id}-${toRank}-${i}`,
          memberId: m.id,
          amount: 0,
          type: "award",
          status: "completed",
          description: `[RANK UP] ${fromRank.toUpperCase()} → ${toRank.toUpperCase()}: ${reason}`,
          source: "rank_up",
          balanceAfter: 0,
        },
      });
      transitions++;
    }
  }
  console.log(`  ✓ ${transitions} rank-up transaction records`);
}


// ══════════════════════════════════════════════════════════════════
// 17. About Sections
// ══════════════════════════════════════════════════════════════════

async function seedAboutSections() {
  console.log("\n[AboutSections] Seeding About page sections...");
  const sections = [
    // Hero — VI
    {
      sectionType: "hero", locale: "vi", sortOrder: 0,
      badge: "VỀ CHÚNG TÔI",
      title: "LOOP SOLUTIONS LÀ AI?",
      titleHighlight: "Chuyển đổi số",
      subtitle: "Hệ điều hành số dành cho Digital Agency hàng đầu Việt Nam",
      ctaText: "Liên hệ ngay", ctaLink: "/vi/contact",
      cta2Text: "Xem Case Studies", cta2Link: "/vi/case-studies",
      isActive: true,
    },
    // Stats — VI
    {
      sectionType: "stats", locale: "vi", sortOrder: 1, isActive: true,
      stats: [
        { value: "50+", label: "Dự án hoàn thành", icon: "TrendingUp", color: "#62C5EB" },
        { value: "200+", label: "Khách hàng", icon: "Users", color: "#6B3DF5" },
        { value: "27+", label: "Thành viên", icon: "Award", color: "#EC4899" },
        { value: "2+", label: "Năm hoạt động", icon: "Clock", color: "#E6C75F" },
      ],
    },
    // Story — VI
    {
      sectionType: "story", locale: "vi", sortOrder: 2, isActive: true,
      title: "Câu chuyện LOOP",
      titleHighlight: "Từ ý tưởng đến thực tiễn",
      story: [
        "LOOP Solutions là đối tác công nghệ tin cậy của doanh nghiệp Việt Nam. Chúng tôi thiết kế, phát triển và vận hành giải pháp số toàn diện — từ website đến hệ thống quản lý nội bộ.",
        "Với đội ngũ 27 chuyên gia trẻ, đam mê công nghệ và tinh thần khởi nghiệp, LOOP không ngừng sáng tạo để mang đến giải pháp tối ưu nhất cho từng khách hàng.",
        "Hệ điều hành số dành cho Digital Agency.",
      ],
    },
    // Timeline — VI
    {
      sectionType: "timeline", locale: "vi", sortOrder: 3, isActive: true,
      timeline: [
        { year: "2024", title: "Khởi đầu", description: "LOOP Solutions được thành lập với sứ mệnh mang chuyển đổi số đến gần hơn với doanh nghiệp Việt Nam." },
        { year: "2024", title: "10 dự án đầu tiên", description: "Hoàn thành 10 dự án đầu tiên trong năm đầu tiên, xây dựng danh tiếng trong ngành." },
        { year: "2025", title: "Mở rộng quy mô", description: "Tăng trưởng 200% — đội ngũ mở rộng lên 27 thành viên với 4 phòng ban chuyên môn." },
        { year: "2025", title: "Hệ thống LP & Rank", description: "Ra mắt hệ thống LP (Loop Points) và Rank nội bộ, tạo động lực cho nhân viên." },
        { year: "2026", title: "LOOP Academy", description: "Khởi động học viện đào tạo nội bộ với 7 khóa học chuyên sâu cho nhân viên." },
        { year: "2026", title: "Mở rộng dịch vụ", description: "Ra mắt thêm Dashboard Analytics, SEO Services và Media Production." },
      ],
    },
    // Values — VI
    {
      sectionType: "values", locale: "vi", sortOrder: 4, isActive: true,
      values: [
        { icon: "Target", title: "Sứ mệnh", description: "Mang công nghệ đến gần hơn với doanh nghiệp Việt, giúp họ cạnh tranh trên thị trường số.", color: "#62C5EB" },
        { icon: "Lightbulb", title: "Đổi mới", description: "Không ngừng tìm kiếm giải pháp sáng tạo, ứng dụng công nghệ mới nhất vào thực tiễn.", color: "#6B3DF5" },
        { icon: "Handshake", title: "Tin cậy", description: "Cam kết chất lượng, đúng deadline, hỗ trợ lâu dài sau triển khai.", color: "#EC4899" },
        { icon: "Globe2", title: "Toàn cầu", description: "Hướng đến chuẩn quốc tế, phục vụ khách hàng từ nhiều quốc gia.", color: "#E6C75F" },
      ],
    },
    // CTA — VI
    {
      sectionType: "cta", locale: "vi", sortOrder: 5, isActive: true,
      ctaSectionTitle: "SẴN SẮNG NÂNG CẤP DIGITAL?",
      ctaSectionSub: "Tư vấn miễn phí 30 phút. Bắt đầu hành trình chuyển đổi số cùng LOOP ngay hôm nay.",
    },
    // Hero — EN
    {
      sectionType: "hero", locale: "en", sortOrder: 0, isActive: true,
      badge: "ABOUT US",
      title: "WHO IS",
      titleHighlight: "LOOP Solutions?",
      subtitle: "Vietnam's leading Digital Agency operating system — from website to internal management.",
      ctaText: "Contact Us", ctaLink: "/en/contact",
      cta2Text: "View Case Studies", cta2Link: "/en/case-studies",
    },
    // Stats — EN
    {
      sectionType: "stats", locale: "en", sortOrder: 1, isActive: true,
      stats: [
        { value: "50+", label: "Projects Completed", icon: "TrendingUp", color: "#62C5EB" },
        { value: "200+", label: "Clients", icon: "Users", color: "#6B3DF5" },
        { value: "27+", label: "Team Members", icon: "Award", color: "#EC4899" },
        { value: "2+", label: "Years Operating", icon: "Clock", color: "#E6C75F" },
      ],
    },
    // Hero — JA
    {
      sectionType: "hero", locale: "ja", sortOrder: 0, isActive: true,
      badge: "会社概要",
      title: "LOOP SOLUTIONSとは",
      titleHighlight: "デジタル変革を",
      subtitle: "ベトナムトップのデジタルエージェンシー — ウェブサイトから内部管理まで。",
      ctaText: "お問い合わせ", ctaLink: "/ja/contact",
      cta2Text: "事例を見る", cta2Link: "/ja/case-studies",
    },
    // Hero — KO
    {
      sectionType: "hero", locale: "ko", sortOrder: 0, isActive: true,
      badge: "회사 소개",
      title: "LOOP SOLUTIONS는",
      titleHighlight: "디지털 전환을",
      subtitle: "베트남 최고의 디지털 에이전시 — 웹사이트부터 내부 관리까지.",
      ctaText: "문의하기", ctaLink: "/ko/contact",
      cta2Text: "사례 보기", cta2Link: "/ko/case-studies",
    },
    // Hero — ZH
    {
      sectionType: "hero", locale: "zh", sortOrder: 0, isActive: true,
      badge: "关于我们",
      title: "LOOP SOLUTIONS是",
      titleHighlight: "数字化转型",
      subtitle: "越南领先的数字代理商 — 从网站到内部管理系统。",
      ctaText: "联系我们", ctaLink: "/zh/contact",
      cta2Text: "查看案例", cta2Link: "/zh/case-studies",
    },
  ];

  for (const s of sections) {
    await prisma.aboutSection.upsert({
      where: { sectionType_locale: { sectionType: s.sectionType, locale: s.locale } },
      update: {},
      create: s,
    });
  }
  console.log(`  ✅ Seeded ${sections.length} AboutSections (vi/en/ja/ko/zh)`);
}


// ══════════════════════════════════════════════════════════════════
// 17b. FAQs
// ══════════════════════════════════════════════════════════════════

async function seedFaqs() {
  console.log("\n[FAQs] Seeding FAQ entries...");

  function faqId(q: string): string {
    return q.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
  }

  // Faq model: question/answer = VI (default), questionEn/answerEn = EN translation
  const faqData = [
    // general
    { question: "LOOP Solutions là công ty gì?", answer: "Công ty chuyên cung cấp giải pháp chuyển đổi số toàn diện — từ thiết kế website, phát triển ứng dụng web/app, hệ thống dashboard analytics đến dịch vụ SEO và media production.", questionEn: "What is LOOP Solutions?", answerEn: "A comprehensive digital transformation company providing website design, web/app development, analytics dashboards, SEO, and media production services.", category: "general", sortOrder: 1 },
    { question: "LOOP Solutions hoạt động từ khi nào?", answer: "Thành lập năm 2024. Tập trung phục vụ doanh nghiệp Việt Nam với đội ngũ 27 chuyên gia trẻ và tinh thần khởi nghiệp.", questionEn: "When was LOOP Solutions founded?", answerEn: "Founded in 2024. Focused on serving Vietnamese businesses with a team of 27 young experts and an entrepreneurial spirit.", category: "general", sortOrder: 2 },
    { question: "Liên hệ LOOP Solutions bằng cách nào?", answer: "Qua form liên hệ tại /lien-he, email contact@loops.vn, hoặc hotline trong giờ hành chính.", questionEn: "How can I contact LOOP Solutions?", answerEn: "Via the contact form at /contact, email contact@loops.vn, or hotline during business hours.", category: "general", sortOrder: 3 },
    { question: "LOOP có hỗ trợ khách hàng nước ngoài không?", answer: "Có. Đội ngũ LOOP có thể giao tiếp bằng tiếng Anh, tiếng Nhật, tiếng Hàn và tiếng Trung.", questionEn: "Does LOOP support international clients?", answerEn: "Yes. The LOOP team can communicate in English, Japanese, Korean, and Chinese.", category: "general", sortOrder: 4 },
    // services
    { question: "LOOP cung cấp dịch vụ gì?", answer: "4 nhóm chính: (1) Thiết kế & phát triển Website, (2) Phát triển App/SaaS, (3) Dashboard & Hệ thống quản lý, (4) SEO & Media Production.", questionEn: "What services does LOOP provide?", answerEn: "4 main groups: (1) Website Design & Development, (2) App/SaaS Development, (3) Dashboard & Management Systems, (4) SEO & Media Production.", category: "services", sortOrder: 1 },
    { question: "Thời gian hoàn thành dự án website?", answer: "Landing page: 5–7 ngày. Website 5–10 trang: 2–3 tuần. E-commerce hoặc phức tạp: 1–3 tháng tùy quy mô.", questionEn: "How long does it take to complete a website?", answerEn: "Landing page: 5–7 days. 5–10 page website: 2–3 weeks. E-commerce or complex: 1–3 months depending on scope.", category: "services", sortOrder: 2 },
    { question: "Giá thiết kế website bắt đầu từ bao nhiêu?", answer: "Gói Cơ bản: từ 5 triệu VNĐ (landing page). Gói Doanh nghiệp: từ 15 triệu VNĐ. Gói E-commerce: từ 30 triệu VNĐ.", questionEn: "What is the starting price for website design?", answerEn: "Basic Package: from 5 million VND (landing page). Business Package: from 15 million VND. E-commerce Package: from 30 million VND.", category: "services", sortOrder: 3 },
    { question: "LOOP có dịch vụ bảo trì sau bàn giao không?", answer: "Có. Gói bảo trì hàng tháng từ 500,000 VNĐ — bao gồm cập nhật nội dung, bảo mật, backup và hỗ trợ kỹ thuật.", questionEn: "Does LOOP provide post-delivery maintenance?", answerEn: "Yes. Monthly maintenance packages from 500,000 VND — including content updates, security, backup and technical support.", category: "services", sortOrder: 4 },
    { question: "Tôi có được cung cấp source code không?", answer: "Có. Sau khi thanh toán 100%, toàn bộ source code và tài liệu kỹ thuật sẽ được bàn giao cho khách hàng.", questionEn: "Will I receive the source code?", answerEn: "Yes. After 100% payment, all source code and technical documentation will be delivered to the client.", category: "services", sortOrder: 5 },
    // technical
    { question: "LOOP sử dụng công nghệ gì?", answer: "Frontend: Next.js, React, TailwindCSS. Backend: Node.js, PostgreSQL. Hosting: Vercel, AWS. Các công nghệ khác tùy yêu cầu dự án.", questionEn: "What technologies does LOOP use?", answerEn: "Frontend: Next.js, React, TailwindCSS. Backend: Node.js, PostgreSQL. Hosting: Vercel, AWS. Other technologies as needed per project.", category: "technical", sortOrder: 1 },
    { question: "Website có tương thích di động không?", answer: "Mobile-first responsive design là tiêu chuẩn mặc định. Mọi sản phẩm đều tương thích hoàn hảo trên smartphone và tablet.", questionEn: "Are websites mobile-friendly?", answerEn: "Mobile-first responsive design is our default standard. All products are perfectly compatible on smartphones and tablets.", category: "technical", sortOrder: 2 },
    { question: "Website có được tối ưu SEO ngay không?", answer: "Có. SEO on-page được triển khai từ đầu — meta tags, structured data, tốc độ tải trang, semantic HTML và sitemap.", questionEn: "Are websites SEO-optimized from the start?", answerEn: "Yes. SEO on-page is implemented from the start — meta tags, structured data, page load speed, semantic HTML and sitemap.", category: "technical", sortOrder: 3 },
    { question: "Hệ thống bảo mật của LOOP thế nào?", answer: "Bảo mật đa lớp: SSL/HTTPS, CSP headers, input sanitization, parameterized queries (SQL injection prevention), rate limiting và monitoring.", questionEn: "How secure are LOOP's systems?", answerEn: "Multi-layer security: SSL/HTTPS, CSP headers, input sanitization, parameterized queries (SQL injection prevention), rate limiting and monitoring.", category: "technical", sortOrder: 4 },
    // payment
    { question: "Tôi thanh toán bằng cách nào?", answer: "Chuyển khoản ngân hàng hoặc VietQR. Thanh toán 50% khi ký hợp đồng, 50% còn lại khi bàn giao.", questionEn: "What payment methods are accepted?", answerEn: "Bank transfer or VietQR. 50% payment upon contract signing, 50% upon delivery.", category: "payment", sortOrder: 1 },
    { question: "Chính sách đặt cọc và hoàn tiền?", answer: "Đặt cọc 50% trước khi bắt đầu. Hoàn tiền theo thỏa thuận trong hợp đồng — chia theo giai đoạn hoàn thành.", questionEn: "What is the deposit and refund policy?", answerEn: "50% deposit before starting. Refund according to contract terms — split by completion stages.", category: "payment", sortOrder: 2 },
    { question: "Tôi có được xuất hóa đơn GTGT không?", answer: "Có. Xuất hóa đơn GTGT 10% theo quy định pháp luật Việt Nam.", questionEn: "Can I get a VAT invoice?", answerEn: "Yes. VAT invoice at 10% issued according to Vietnamese law.", category: "payment", sortOrder: 3 },
    // lp
    { question: "Điểm LP (Loop Points) là gì?", answer: "Hệ thống tích điểm nội bộ dành cho khách hàng LOOP. Tích điểm từ mua dịch vụ, hoàn thành nhiệm vụ, giới thiệu bạn bè và nhiều hoạt động khác.", questionEn: "What are LP (Loop Points)?", answerEn: "An internal loyalty points system for LOOP clients. Earn points by purchasing services, completing quests, referring friends, and more.", category: "lp", sortOrder: 1 },
    { question: "Tỷ giá quy đổi LP?", answer: "1,000 LP = 500,000 VNĐ giảm giá. Tỷ giá có thể thay đổi theo chính sách LOOP.", questionEn: "What is the LP exchange rate?", answerEn: "1,000 LP = 500,000 VND discount. Exchange rate may change according to LOOP policy.", category: "lp", sortOrder: 2 },
    { question: "Làm sao để tích thêm LP?", answer: "4 cách: (1) Mua dịch vụ tại LOOP, (2) Hoàn thành quest nhiệm vụ trên website, (3) Giới thiệu khách hàng mới, (4) Điểm danh hàng ngày.", questionEn: "How do I earn more LP?", answerEn: "4 ways: (1) Purchase LOOP services, (2) Complete quests on the website, (3) Refer new clients, (4) Daily check-in.", category: "lp", sortOrder: 3 },
    // academy
    { question: "LOOP Academy là gì?", answer: "Nền tảng đào tạo nội bộ của LOOP Solutions — cung cấp các khóa học chuyên sâu về web development, UX design, SEO và digital marketing cho nhân viên và học viên.", questionEn: "What is LOOP Academy?", answerEn: "LOOP Solutions' internal training platform — providing in-depth courses on web development, UX design, SEO and digital marketing for staff and learners.", category: "academy", sortOrder: 1 },
    { question: "Khóa học có miễn phí không?", answer: "Tùy khóa. Một số khóa miễn phí 100%, một số có thể thanh toán bằng VNĐ hoặc LP (điểm thưởng nội bộ).", questionEn: "Are courses free?", answerEn: "Depending on the course. Some courses are 100% free, some can be paid with VND or LP (internal loyalty points).", category: "academy", sortOrder: 2 },
    { question: "Tôi nhận được chứng chỉ khi hoàn thành khóa học không?", answer: "Có. Chứng chỉ hoàn thành được cấp khi học viên đạt 100% tiến độ khóa học.", questionEn: "Will I receive a certificate upon completion?", answerEn: "Yes. A completion certificate is issued when the learner achieves 100% course progress.", category: "academy", sortOrder: 3 },
  ];

  let count = 0;
  for (const f of faqData) {
    const id = faqId(f.question);
    await prisma.faq.upsert({
      where: { id },
      update: {
        question: f.question,
        answer: f.answer,
        questionEn: f.questionEn,
        answerEn: f.answerEn,
        category: f.category,
        sortOrder: f.sortOrder,
        isActive: true,
      },
      create: {
        id,
        question: f.question,
        answer: f.answer,
        questionEn: f.questionEn,
        answerEn: f.answerEn,
        category: f.category,
        sortOrder: f.sortOrder,
        isActive: true,
      },
    });
    count++;
  }
  console.log(`  ✅ Seeded ${count} FAQ entries (VI + EN)`);
}


// 17. Blog Tags
// ══════════════════════════════════════════════════════════════════

async function seedBlogTags() {
  console.log("\n[BlogTags] Seeding blog tag taxonomy...");
  const tags = [
    { key: "web-design",     name: "Thiết kế Web",         nameEn: "Web Design",     color: "#3B82F6" },
    { key: "web-app",         name: "Ứng dụng Web",           nameEn: "Web Application", color: "#8B5CF6" },
    { key: "seo",             name: "SEO",                    nameEn: "SEO",             color: "#22C55E" },
    { key: "digital-marketing", name: "Marketing số",        nameEn: "Digital Marketing", color: "#F59E0B" },
    { key: "ux-ui",           name: "UX/UI Design",           nameEn: "UX/UI Design",   color: "#EC4899" },
    { key: "mobile",          name: "Di động",               nameEn: "Mobile",         color: "#14B8A6" },
    { key: "saas",             name: "SaaS",                  nameEn: "SaaS",           color: "#6366F1" },
    { key: "ecommerce",       name: "Thương mại điện tử",   nameEn: "E-Commerce",      color: "#F97316" },
    { key: "performance",     name: "Hiệu năng",            nameEn: "Performance",    color: "#06B6D4" },
    { key: "ai-tools",        name: "AI & Công cụ",          nameEn: "AI & Tools",     color: "#A855F7" },
  ];
  let count = 0;
  for (let i = 0; i < tags.length; i++) {
    const t = tags[i];
    await prisma.blogTag.upsert({
      where: { key: t.key },
      update: { name: t.name, nameEn: t.nameEn, color: t.color, sortOrder: i },
      create: { key: t.key, name: t.name, nameEn: t.nameEn, color: t.color, sortOrder: i },
    });
    count++;
  }
  console.log(`  ✓ ${count} blog tags`);
}


// ══════════════════════════════════════════════════════════════════

async function main() {
  console.log("=".repeat(50));
  console.log("🌱 LOOP — Unified Seed Script");
  console.log("=".repeat(50));

  try {
    await seedRBAC();
    // Seed project roles before seedR2 (which may use them)
    const projectRoleKeys = ["pm", "designer", "dev", "qa", "seo"] as const;
    for (const key of projectRoleKeys) {
      const labels: Record<string, string> = { pm: "Project Manager", designer: "Designer", dev: "Developer", qa: "QA Engineer", seo: "SEO Specialist" };
      const colors: Record<string, string> = { pm: "#EC4899", designer: "#8B5CF6", dev: "#3B82F6", qa: "#22C55E", seo: "#F59E0B" };
      await prisma.projectRole.upsert({
        where: { key },
        update: {},
        create: { key, label: labels[key], color: colors[key], sortOrder: projectRoleKeys.indexOf(key) + 1 },
      });
    }
    const deptIds = await seedDepartments();
    await seedAdmin();
    // await seedHR(); // REMOVED: Quynh HR was a duplicate of Lê Ngọc Xuân Quỳnh
    await seedAccessTags();
    await seedMemberRequests();
    await seedCEO(deptIds);
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
    await seedServiceTiers(); // <-- NEW: 4 services × 3 tiers for /dich-vu page
    await seedBlogTags();
    await seedR2(deptIds); // <-- NEW: R2 unified demo data (pass deptIds for FK)
    await seedAboutSections();
    await seedFaqs();
 // ─── P1: Web Package Pricing ────────────────────────────────────────────────
 console.log("\n[WEB PACKAGE] Hosting Plans + Domain Prices...");
 await prisma.pricingHostingPlan.upsert({ where:{slug:"professional"}, update:{}, create:{slug:"professional",name:"Professional",nameVi:"Gói Chuyên nghiệp",monthlyPrice:199000,months:12,discountPct:10,period:"1 năm",periodVi:"12 tháng",features:["SSD 30GB","SSL miễn phí","Email 5 hộp thư","Backup hàng ngày","CDN miễn phí","Hỗ trợ 24/7"],featuresVi:["SSD 30GB","SSL miễn phí","Email 5 hộp thư","Backup hàng ngày","CDN miễn phí","Hỗ trợ 24/7"],color:"#EC4899",sortOrder:2} });
 await prisma.pricingDomainPrice.upsert({ where:{extension:"com.vn"}, update:{}, create:{extension:"com.vn",registrationPrice:299000,renewalPrice:299000,period:"1 năm",periodVi:"12 tháng",note:"Phổ biến nhất",noteVi:"Phổ biến nhất",sortOrder:1} });
 console.log(" ✓ Web package pricing seeded");


    // Verify counts
    const [tm, us, pr, ord, pm, ef, ov, lp, tx, qp, ec, tsk, q, ev, exp, me, svc, at, mr, st, bt, hp, dp, faq] = await Promise.all([
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
      prisma.serviceTier.count(),
      prisma.blogTag.count(),
 prisma.pricingHostingPlan.count(),
 prisma.pricingDomainPrice.count(),
 prisma.faq.count(),
    ]);
    console.log("\n[VERIFY] TM=%d US=%d PR=%d OR=%d PM=%d | LP=%d TX=%d QP=%d | EC=%d TS=%d Q=%d EV=%d | EXP=%d ME=%d | SVC=%d | AT=%d MR=%d ST=%d | BT=%d | HP=%d DP=%d | FAQ=%d",
      tm, us, pr, ord, pm, lp, tx, qp, ec, tsk, q, ev, exp, me, svc, at, mr, st, bt, faq);
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
