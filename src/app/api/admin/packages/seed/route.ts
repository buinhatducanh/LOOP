import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";

export async function POST() {
  try {
    await requirePermission("packages", "create");

    // ── Seed data (inlined — source of truth is now the DB) ──────────────

    const webPackages = [
      {
        slug: "starter",
        name: "Starter",
        nameVi: "Khởi Đầu",
        tagline: "Perfect for landing pages & startups",
        taglineVi: "Phù hợp landing page & startup",
        price: 2980000,
        currency: "VND",
        period: "one-time",
        periodVi: "trọn gói",
        highlighted: false,
        cta: "Get Started",
        ctaVi: "Bắt Đầu",
        color: "#3B82F6",
        pages: "1–3 pages",
        pagesVi: "1–3 trang",
        sortOrder: 0,
      },
      {
        slug: "business",
        name: "Business",
        nameVi: "Doanh Nghiệp",
        tagline: "Best for growing businesses",
        taglineVi: "Tốt nhất cho doanh nghiệp đang phát triển",
        price: 4980000,
        currency: "VND",
        period: "one-time",
        periodVi: "trọn gói",
        highlighted: true,
        cta: "Get Started",
        ctaVi: "Bắt Đầu",
        color: "#6366F1",
        pages: "5–10 pages",
        pagesVi: "5–10 trang",
        sortOrder: 1,
      },
      {
        slug: "professional",
        name: "Professional",
        nameVi: "Chuyên Nghiệp",
        tagline: "Full-featured for established brands",
        taglineVi: "Đầy đủ tính năng cho thương hiệu lớn",
        price: 6980000,
        currency: "VND",
        period: "one-time",
        periodVi: "trọn gói",
        highlighted: false,
        cta: "Get Started",
        ctaVi: "Bắt Đầu",
        color: "#8B5CF6",
        pages: "15–30 pages",
        pagesVi: "15–30 trang",
        sortOrder: 2,
      },
      {
        slug: "enterprise",
        name: "Enterprise",
        nameVi: "Tập Đoàn",
        tagline: "Comprehensive solution for large organizations",
        taglineVi: "Giải pháp toàn diện cho tổ chức lớn",
        price: 8980000,
        currency: "VND",
        period: "one-time",
        periodVi: "trọn gói",
        highlighted: false,
        cta: "Contact Us",
        ctaVi: "Liên Hệ",
        color: "#EC4899",
        pages: "Unlimited",
        pagesVi: "Không giới hạn",
        sortOrder: 3,
      },
    ];

    const featureCategories = [
      {
        slug: "design",
        name: "Design",
        nameVi: "Thiết Kế",
        sortOrder: 0,
        features: [
          { name: "Responsive Design", nameVi: "Thiết kế responsive", values: { starter: true, business: true, professional: true, enterprise: true }, sortOrder: 0 },
          { name: "Custom Design", nameVi: "Thiết kế tùy chỉnh", values: { starter: "Template", business: true, professional: true, enterprise: true }, sortOrder: 1 },
          { name: "Animations & Effects", nameVi: "Hiệu ứng & animation", values: { starter: false, business: "Cơ bản", professional: true, enterprise: true }, sortOrder: 2 },
          { name: "UI/UX Design Kit", nameVi: "Bộ UI/UX Design", values: { starter: false, business: false, professional: true, enterprise: true }, sortOrder: 3 },
          { name: "Figma Source File", nameVi: "File Figma gốc", values: { starter: false, business: false, professional: true, enterprise: true }, sortOrder: 4 },
        ],
      },
      {
        slug: "development",
        name: "Development",
        nameVi: "Phát Triển",
        sortOrder: 1,
        features: [
          { name: "Number of Pages", nameVi: "Số lượng trang", values: { starter: "1–3", business: "5–10", professional: "15–30", enterprise: "Không giới hạn" }, sortOrder: 0 },
          { name: "CMS Integration", nameVi: "Tích hợp CMS", values: { starter: false, business: true, professional: true, enterprise: true }, sortOrder: 1 },
          { name: "Multi-language", nameVi: "Đa ngôn ngữ", values: { starter: false, business: false, professional: true, enterprise: true }, sortOrder: 2 },
          { name: "E-Commerce Features", nameVi: "Tính năng E-Commerce", values: { starter: false, business: false, professional: "Cơ bản", enterprise: true }, sortOrder: 3 },
          { name: "Contact Form", nameVi: "Form liên hệ", values: { starter: true, business: true, professional: true, enterprise: true }, sortOrder: 4 },
          { name: "Custom Features", nameVi: "Tính năng tùy chỉnh", values: { starter: false, business: false, professional: "Theo yêu cầu", enterprise: true }, sortOrder: 5 },
        ],
      },
      {
        slug: "seo",
        name: "SEO & Marketing",
        nameVi: "SEO & Marketing",
        sortOrder: 2,
        features: [
          { name: "Basic SEO Setup", nameVi: "SEO cơ bản", values: { starter: true, business: true, professional: true, enterprise: true }, sortOrder: 0 },
          { name: "Google Analytics", nameVi: "Google Analytics", values: { starter: false, business: true, professional: true, enterprise: true }, sortOrder: 1 },
          { name: "XML Sitemap", nameVi: "XML Sitemap", values: { starter: true, business: true, professional: true, enterprise: true }, sortOrder: 2 },
          { name: "Schema Markup", nameVi: "Schema Markup (JSON-LD)", values: { starter: false, business: true, professional: true, enterprise: true }, sortOrder: 3 },
          { name: "Google Search Console", nameVi: "Google Search Console", values: { starter: false, business: true, professional: true, enterprise: true }, sortOrder: 4 },
        ],
      },
      {
        slug: "infrastructure",
        name: "Infrastructure",
        nameVi: "Hạ Tầng",
        sortOrder: 3,
        features: [
          { name: "SSL Certificate", nameVi: "Chứng chỉ SSL", values: { starter: true, business: true, professional: true, enterprise: true }, sortOrder: 0 },
          { name: "CDN Integration", nameVi: "Tích hợp CDN", values: { starter: false, business: true, professional: true, enterprise: true }, sortOrder: 1 },
          { name: "CI/CD Pipeline", nameVi: "CI/CD Pipeline", values: { starter: false, business: false, professional: true, enterprise: true }, sortOrder: 2 },
          { name: "Performance Monitoring", nameVi: "Giám sát hiệu suất", values: { starter: false, business: false, professional: true, enterprise: true }, sortOrder: 3 },
          { name: "Lighthouse Score", nameVi: "Điểm Lighthouse", values: { starter: "85+", business: "90+", professional: "95+", enterprise: "95+" }, sortOrder: 4 },
        ],
      },
      {
        slug: "support",
        name: "Support",
        nameVi: "Hỗ Trợ",
        sortOrder: 4,
        features: [
          { name: "Free Support", nameVi: "Hỗ trợ miễn phí", values: { starter: "1 tháng", business: "3 tháng", professional: "6 tháng", enterprise: "12 tháng" }, sortOrder: 0 },
          { name: "Revision Rounds", nameVi: "Số lần chỉnh sửa", values: { starter: "2 lần", business: "5 lần", professional: "Không giới hạn", enterprise: "Không giới hạn" }, sortOrder: 1 },
          { name: "Priority Support", nameVi: "Hỗ trợ ưu tiên", values: { starter: false, business: false, professional: true, enterprise: true }, sortOrder: 2 },
          { name: "Dedicated PM", nameVi: "PM chuyên trách", values: { starter: false, business: false, professional: false, enterprise: true }, sortOrder: 3 },
          { name: "Content Training", nameVi: "Đào tạo quản trị", values: { starter: false, business: true, professional: true, enterprise: true }, sortOrder: 4 },
          { name: "Source Code Ownership", nameVi: "Sở hữu mã nguồn", values: { starter: true, business: true, professional: true, enterprise: true }, sortOrder: 5 },
        ],
      },
    ];

    const hostingPlans = [
      { slug: "hosting-basic", name: "Basic Hosting", nameVi: "Hosting Cơ Bản", price: 150000, period: "month", periodVi: "tháng", features: ["Shared hosting", "5GB SSD storage", "SSL certificate", "Daily backup", "99.5% uptime"], featuresVi: ["Shared hosting", "5GB SSD lưu trữ", "Chứng chỉ SSL", "Sao lưu hàng ngày", "99.5% uptime"], highlighted: false, color: "#3B82F6", sortOrder: 0 },
      { slug: "hosting-pro", name: "Pro Hosting", nameVi: "Hosting Nâng Cao", price: 350000, period: "month", periodVi: "tháng", features: ["VPS hosting", "20GB SSD storage", "SSL certificate", "CDN integration", "Daily backup", "99.9% uptime"], featuresVi: ["VPS hosting", "20GB SSD lưu trữ", "Chứng chỉ SSL", "Tích hợp CDN", "Sao lưu hàng ngày", "99.9% uptime"], highlighted: true, color: "#6366F1", sortOrder: 1 },
      { slug: "hosting-enterprise", name: "Enterprise Hosting", nameVi: "Hosting Doanh Nghiệp", price: 900000, period: "month", periodVi: "tháng", features: ["Dedicated server", "Unlimited storage", "SSL certificate", "CDN integration", "Real-time backup", "99.99% uptime SLA", "24/7 monitoring"], featuresVi: ["Server chuyên dụng", "Không giới hạn lưu trữ", "Chứng chỉ SSL", "Tích hợp CDN", "Sao lưu real-time", "99.99% uptime SLA", "Giám sát 24/7"], highlighted: false, color: "#8B5CF6", sortOrder: 2 },
    ];

    const domainPrices = [
      { extension: ".com", registrationPrice: 280000, renewalPrice: 280000, period: "year", periodVi: "năm", sortOrder: 0 },
      { extension: ".vn", registrationPrice: 350000, renewalPrice: 350000, period: "year", periodVi: "năm", note: "Requires Vietnamese business license (GPKD)", noteVi: "Yêu cầu GPKD", sortOrder: 1 },
      { extension: ".com.vn", registrationPrice: 450000, renewalPrice: 450000, period: "year", periodVi: "năm", note: "Requires Vietnamese business license (GPKD)", noteVi: "Yêu cầu GPKD", sortOrder: 2 },
      { extension: ".net", registrationPrice: 320000, renewalPrice: 320000, period: "year", periodVi: "năm", sortOrder: 3 },
    ];

    const deploymentItems = [
      { slug: "source-code", title: "Source Code", titleVi: "Mã Nguồn", description: "Full access to Git repository with complete source code", descriptionVi: "Toàn quyền truy cập Git repository với mã nguồn đầy đủ", handedToClient: true, icon: "GitBranch", sortOrder: 0 },
      { slug: "admin-access", title: "Admin Dashboard", titleVi: "Bảng Điều Khiển Admin", description: "Admin/CMS credentials for content management", descriptionVi: "Tài khoản admin/CMS để quản trị nội dung", handedToClient: true, icon: "LayoutDashboard", sortOrder: 1 },
      { slug: "hosting-panel", title: "Hosting Panel", titleVi: "Hosting Panel", description: "Access to Vercel dashboard or VPS control panel", descriptionVi: "Truy cập Vercel dashboard hoặc VPS panel", handedToClient: true, icon: "Server", sortOrder: 2 },
      { slug: "analytics", title: "Analytics Access", titleVi: "Truy Cập Analytics", description: "Google Analytics & Search Console ownership transfer", descriptionVi: "Chuyển quyền sở hữu Google Analytics & Search Console", handedToClient: true, icon: "BarChart3", sortOrder: 3 },
      { slug: "ssl", title: "SSL Certificate", titleVi: "Chứng Chỉ SSL", description: "Auto-renewed SSL certificate via Let's Encrypt", descriptionVi: "Chứng chỉ SSL tự động gia hạn qua Let's Encrypt", handedToClient: true, icon: "ShieldCheck", sortOrder: 4 },
      { slug: "cicd-docs", title: "CI/CD Documentation", titleVi: "Tài Liệu CI/CD", description: "Complete deployment pipeline documentation", descriptionVi: "Tài liệu đầy đủ về quy trình triển khai", handedToClient: true, icon: "FileText", sortOrder: 5 },
      { slug: "dns-guide", title: "DNS Configuration", titleVi: "Cấu Hình DNS", description: "Step-by-step DNS setup guide for your domain", descriptionVi: "Hướng dẫn cấu hình DNS chi tiết cho tên miền", handedToClient: true, icon: "Globe", sortOrder: 6 },
      { slug: "training", title: "Content Training", titleVi: "Đào Tạo Quản Trị", description: "Hands-on training session for content management", descriptionVi: "Buổi đào tạo thực hành quản trị nội dung", handedToClient: true, icon: "GraduationCap", sortOrder: 7 },
      { slug: "domain", title: "Domain Registration", titleVi: "Đăng Ký Tên Miền", description: "Domain registration requires the owner's business license", descriptionVi: "Đăng ký tên miền yêu cầu GPKD của chính chủ sở hữu", handedToClient: false, icon: "AlertTriangle", note: "Vietnamese .vn domains require GPKD. We recommend registering through PA Vietnam, Mắt Bão, or Nhân Hòa.", noteVi: "Tên miền .vn yêu cầu Giấy phép Kinh doanh (GPKD). Chúng tôi khuyến nghị đăng ký qua PA Vietnam, Mắt Bão, hoặc Nhân Hòa.", sortOrder: 8 },
    ];

    // ── Clear existing data ─────────────────────────────────────────────────
    await prisma.$transaction([
      prisma.pricingComparisonFeature.deleteMany(),
      prisma.pricingFeatureCategory.deleteMany(),
      prisma.pricingWebPackage.deleteMany(),
      prisma.pricingHostingPlan.deleteMany(),
      prisma.pricingDomainPrice.deleteMany(),
      prisma.pricingDeploymentItem.deleteMany(),
    ]);

    // ── Insert web packages ────────────────────────────────────────────────
    await prisma.pricingWebPackage.createMany({ data: webPackages });

    // ── Insert feature categories + features ───────────────────────────────
    for (const cat of featureCategories) {
      const created = await prisma.pricingFeatureCategory.create({
        data: { slug: cat.slug, name: cat.name, nameVi: cat.nameVi, sortOrder: cat.sortOrder },
      });
      if (cat.features.length > 0) {
        await prisma.pricingComparisonFeature.createMany({
          data: cat.features.map((f) => ({
            categoryId: created.id,
            name: f.name,
            nameVi: f.nameVi,
            values: f.values,
            sortOrder: f.sortOrder,
          })),
        });
      }
    }

    // ── Insert hosting plans ────────────────────────────────────────────────
    await prisma.pricingHostingPlan.createMany({ data: hostingPlans });

    // ── Insert domain prices ────────────────────────────────────────────────
    await prisma.pricingDomainPrice.createMany({ data: domainPrices });

    // ── Insert deployment items ────────────────────────────────────────────
    await prisma.pricingDeploymentItem.createMany({ data: deploymentItems });

    return NextResponse.json({ message: "Đã seed dữ liệu bảng giá thành công" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
