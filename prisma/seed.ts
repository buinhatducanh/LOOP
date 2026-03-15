import { config } from "dotenv";
// Load .env.local first (has real Neon URL), then .env as fallback
config({ path: ".env.local" });
config({ path: ".env" });

import { PrismaClient } from "../src/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL || "";
if (!connectionString) {
  throw new Error("DATABASE_URL is missing!");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Seeding database...");

    const servicesData = [
        { slug: "business-website", icon: "Building2", title: "Website Doanh Nghiệp", shortDescription: "Website chuyên nghiệp, tối ưu chuyển đổi — xây dựng thương hiệu và mang lại kết quả kinh doanh thực sự.", longDescription: "Website doanh nghiệp mạnh mẽ là nền tảng cho sự hiện diện số của bạn. Chúng tôi thiết kế và phát triển website tùy chỉnh, hiệu suất cao phù hợp với ngành nghề, đối tượng và mục tiêu của bạn.", features: ["Thiết kế responsive tùy chỉnh", "Kiến trúc chuẩn SEO", "Tích hợp CMS (WordPress / Strapi)", "Form liên hệ & yêu cầu báo giá", "Google Analytics & Tag Manager", "Tối ưu hiệu suất (95+ Lighthouse)", "SSL & bảo mật nâng cao", "Hỗ trợ 12 tháng sau ra mắt"], technologies: ["React", "Next.js", "TypeScript", "Tailwind CSS", "WordPress", "Node.js"], startingPrice: 4980000, deliveryTime: "2–3 tuần", category: "Phát triển Web", sortOrder: 1 },
        { slug: "branch-website-system", icon: "GitBranch", title: "Hệ Thống Web Chi Nhánh", shortDescription: "Hệ thống website đa chi nhánh tập trung, quản trị thống nhất và đồng bộ thương hiệu.", longDescription: "Mở rộng doanh nghiệp trên nhiều địa điểm với Hệ thống Web Chi Nhánh — nền tảng thống nhất kết nối website trụ sở chính với từng trang chi nhánh riêng biệt.", features: ["Bảng điều khiển admin tập trung", "Không giới hạn trang chi nhánh", "Quản lý nội dung theo chi nhánh", "SEO theo địa phương", "Hệ thống thiết kế thống nhất", "Form liên hệ riêng từng chi nhánh", "Danh bạ nhân sự theo chi nhánh", "Hỗ trợ đa ngôn ngữ"], technologies: ["Next.js", "React", "PostgreSQL", "Prisma", "Vercel", "Cloudflare"], startingPrice: 6980000, deliveryTime: "4–6 tuần", category: "Doanh Nghiệp", sortOrder: 2 },
        { slug: "ecommerce-website", icon: "ShoppingCart", title: "Website Thương Mại Điện Tử", shortDescription: "Cửa hàng trực tuyến đầy đủ tính năng với tích hợp thanh toán, quản lý kho hàng và trải nghiệm mua sắm mượt mà.", longDescription: "Ra mắt cửa hàng thương mại điện tử chuyển đổi cao, hoạt động 24/7. Chúng tôi xây dựng cửa hàng trực tuyến an toàn, có khả năng mở rộng với quản lý sản phẩm mạnh mẽ.", features: ["Thiết kế giao diện cửa hàng tùy chỉnh", "Danh mục sản phẩm với bộ lọc", "Tích hợp Stripe / PayPal", "Tối ưu giỏ hàng & thanh toán", "Hệ thống quản lý kho", "Theo dõi đơn hàng & thông báo", "Hệ thống giảm giá & mã coupon", "Tài khoản khách hàng & danh sách yêu thích"], technologies: ["Next.js", "Shopify", "Stripe", "PostgreSQL", "Redis", "Cloudinary"], startingPrice: 8980000, deliveryTime: "5–8 tuần", category: "Thương Mại", sortOrder: 3 },
        { slug: "landing-page", icon: "Rocket", title: "Landing Page", shortDescription: "Landing page chuyển đổi cao, thiết kế ấn tượng — tối ưu ROI quảng cáo và thu hút khách hàng tiềm năng.", longDescription: "Landing page xuất sắc có thể quyết định thành bại chiến dịch marketing. Chúng tôi tạo ra landing page hoàn hảo, tốc độ nhanh với CTA rõ ràng và kiến trúc sẵn sàng A/B testing.", features: ["Bố cục tối ưu chuyển đổi", "Tốc độ tải siêu nhanh (< 1s)", "Thiết kế mobile-first", "Form thu thập khách hàng tiềm năng", "Tích hợp A/B testing", "Kết nối HubSpot / Mailchimp", "Sẵn sàng heatmap & analytics", "Hỗ trợ nhiều biến thể"], technologies: ["React", "Vite", "Tailwind CSS", "Framer Motion", "HubSpot"], startingPrice: 2980000, deliveryTime: "1–2 tuần", category: "Marketing", sortOrder: 4 },
        { slug: "custom-web-application", icon: "Code2", title: "Ứng Dụng Web Tùy Chỉnh", shortDescription: "Ứng dụng web được xây dựng riêng để tự động hóa quy trình, phục vụ người dùng và mở rộng cùng doanh nghiệp.", longDescription: "Khi giải pháp có sẵn không đáp ứng được, chúng tôi phát triển ứng dụng web tùy chỉnh từ đầu. Từ nền tảng SaaS, công cụ nội bộ đến cổng khách hàng và hệ thống đặt lịch.", features: ["Kiến trúc full-stack", "Thiết kế database tùy chỉnh", "REST & GraphQL APIs", "Xác thực & phân quyền", "Tính năng real-time (WebSockets)", "Bảng điều khiển admin", "Tích hợp API bên thứ ba", "CI/CD pipeline & DevOps"], technologies: ["React", "Node.js", "PostgreSQL", "Redis", "Docker", "AWS", "TypeScript"], startingPrice: 12980000, deliveryTime: "8–16 tuần", category: "Ứng Dụng", sortOrder: 5 },
    ];

    const services: Record<string, { id: string }> = {};
    for (const data of servicesData) {
        const service = await prisma.service.upsert({ where: { slug: data.slug }, update: data, create: data });
        services[data.slug] = service;
        console.log("  Service:", service.title);
    }

    const projectsData = [
        { slug: "luxeshop-ecommerce", title: "LuxeShop E-Commerce", category: "E-Commerce", client: "LuxeShop Inc.", year: "2024", image: "https://images.unsplash.com/photo-1705234384435-e06172b6d2f9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80", description: "A premium e-commerce platform for a luxury fashion brand.", techStack: ["Next.js", "Shopify", "Stripe", "TypeScript", "Tailwind CSS"], features: ["3D product visualization", "AI-powered recommendations", "One-click checkout", "Real-time inventory tracking", "Multi-currency support", "Customer loyalty program"], results: "320% increase in online revenue within 3 months", screenshots: [], serviceSlug: "ecommerce-website", sortOrder: 1 },
        { slug: "corptech-business-site", title: "CorpTech Solutions", category: "Business Website", client: "CorpTech Group", year: "2024", image: "https://images.unsplash.com/photo-1583824159840-b85725a711b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80", description: "A comprehensive corporate website for a global IT consultancy with 20+ branch offices.", techStack: ["React", "Next.js", "PostgreSQL", "Node.js", "Prisma"], features: ["Interactive branch locator", "Service portfolio", "HR portal with job listings", "Multi-language", "Executive team profiles", "Press & media center"], results: "180% increase in organic lead generation", screenshots: [], serviceSlug: "business-website", sortOrder: 2 },
        { slug: "dataflow-analytics", title: "DataFlow Analytics Platform", category: "Web Application", client: "DataFlow Technologies", year: "2023", image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80", description: "A real-time business intelligence SaaS platform.", techStack: ["React", "Node.js", "PostgreSQL", "Redis", "Docker", "AWS"], features: ["Real-time dashboards", "Custom report builder", "Role-based access", "API connectors (50+)", "Scheduled reports", "White-label support"], results: "Scaled to 5,000+ enterprise users in first year", screenshots: [], serviceSlug: "custom-web-application", sortOrder: 3 },
        { slug: "tastybite-food", title: "TastyBite Food Delivery", category: "E-Commerce", client: "TastyBite Restaurants", year: "2024", image: "https://images.unsplash.com/photo-1760888549280-4aef010720bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80", description: "A multi-restaurant food ordering and delivery platform.", techStack: ["React", "Node.js", "Socket.io", "MongoDB", "Stripe", "Google Maps API"], features: ["Real-time order tracking", "Multi-branch menu management", "Driver dispatch system", "Loyalty points", "Push notifications", "Revenue analytics dashboard"], results: "2,500+ daily orders processed across 15 branches", screenshots: [], serviceSlug: "branch-website-system", sortOrder: 4 },
        { slug: "medicare-health", title: "MediCare Plus Portal", category: "Web Application", client: "MediCare Health Group", year: "2023", image: "https://images.unsplash.com/photo-1659353888906-adb3e0041693?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80", description: "A HIPAA-compliant patient management and telemedicine portal.", techStack: ["React", "Node.js", "PostgreSQL", "WebRTC", "Twilio", "AWS HIPAA"], features: ["Online appointment booking", "Secure video consultations", "Electronic health records", "Prescription & lab results", "Insurance billing", "Patient mobile portal"], results: "40% reduction in no-show appointments, 60% faster patient onboarding", screenshots: [], serviceSlug: "custom-web-application", sortOrder: 5 },
    ];

    for (const { serviceSlug, ...data } of projectsData) {
        const project = await prisma.project.upsert({
            where: { slug: data.slug },
            update: { ...data, serviceId: services[serviceSlug]?.id ?? null },
            create: { ...data, serviceId: services[serviceSlug]?.id ?? null },
        });
        console.log("  Project:", project.title);
    }

    const plansData = [
        { slug: "starter", name: "Khởi Đầu", price: 2980000, period: "trọn gói", tagline: "Phù hợp landing page & startup", features: ["1–3 trang", "Thiết kế responsive", "SEO cơ bản", "Form liên hệ", "Chứng chỉ SSL", "Hỗ trợ 1 tháng", "2 vòng chỉnh sửa"], notIncluded: ["Tích hợp CMS", "Animation tùy chỉnh", "Thương mại điện tử", "Dashboard analytics"], highlighted: false, cta: "Bắt Đầu", color: "#3B82F6", sortOrder: 1 },
        { slug: "business", name: "Doanh Nghiệp", price: 4980000, period: "trọn gói", tagline: "Tốt nhất cho doanh nghiệp đang phát triển", features: ["5–10 trang", "Thiết kế tùy chỉnh", "Tích hợp CMS", "SEO nâng cao", "Google Analytics", "Hỗ trợ 3 tháng", "5 vòng chỉnh sửa", "Tối ưu hiệu suất"], notIncluded: ["Thương mại điện tử", "Ứng dụng web tùy chỉnh"], highlighted: true, cta: "Bắt Đầu", color: "#6366F1", sortOrder: 2 },
        { slug: "professional", name: "Chuyên Nghiệp", price: 6980000, period: "trọn gói", tagline: "Đầy đủ tính năng cho thương hiệu lớn", features: ["15–30 trang", "Thương mại điện tử", "Animation tùy chỉnh", "Hỗ trợ đa ngôn ngữ", "Dashboard analytics nâng cao", "Hỗ trợ 6 tháng", "Chỉnh sửa không giới hạn", "Hỗ trợ ưu tiên", "Cam kết hiệu suất (95+ điểm)"], notIncluded: [], highlighted: false, cta: "Bắt Đầu", color: "#8B5CF6", sortOrder: 3 },
        { slug: "enterprise", name: "Tập Đoàn", price: null, period: "tùy chỉnh", tagline: "Giải pháp toàn diện cho tổ chức lớn", features: ["Ứng dụng web tùy chỉnh", "Hệ thống đa chi nhánh", "Quản lý dự án chuyên trách", "Tích hợp tùy chỉnh", "Hợp đồng SLA", "Hỗ trợ 12 tháng", "Đào tạo đội ngũ", "Sở hữu mã nguồn", "White-label"], notIncluded: [], highlighted: false, cta: "Liên Hệ", color: "#3B82F6", sortOrder: 4 },
    ];

    for (const data of plansData) {
        const plan = await prisma.pricingPlan.upsert({ where: { slug: data.slug }, update: data, create: data });
        console.log("  Plan:", plan.name);
    }

    const testimonialsData = [
        { name: "James Mitchell", role: "CEO", company: "CorpTech Group", avatar: "JM", rating: 5, text: "LOOP transformed our digital presence completely. Lead generation is up 180% — truly exceptional work.", sortOrder: 1 },
        { name: "Sarah Al-Rashid", role: "Founder", company: "LuxeShop Inc.", avatar: "SR", rating: 5, text: "Our e-commerce revenue tripled in 3 months after the website launch. Worth every penny.", sortOrder: 2 },
        { name: "Dr. Ahmed Hassan", role: "Managing Director", company: "MediCare Health Group", avatar: "AH", rating: 5, text: "LOOP handled every HIPAA compliance requirement flawlessly. Admin workload dropped by 40%.", sortOrder: 3 },
        { name: "Emily Chen", role: "VP of Product", company: "DataFlow Technologies", avatar: "EC", rating: 5, text: "LOOP delivered a scalable analytics platform in just 12 weeks. The code quality is outstanding.", sortOrder: 4 },
    ];

    for (const data of testimonialsData) {
        await prisma.testimonial.create({ data });
        console.log("  Testimonial:", data.name);
    }

    const admin = await prisma.user.upsert({
        where: { email: "admin@loop.vn" },
        update: {},
        create: { email: "admin@loop.vn", name: "Admin LOOP", role: "admin", avatar: "AL" },
    });
    console.log("  Admin:", admin.email);

    const pricingData = [
  {
    "groupName": "Giao diện & Trải nghiệm",
    "slug": "giao-dien-trai-nghiem",
    "sortOrder": 1,
    "isActive": true,
    "features": [
      {
        "featureName": "Loại giao diện & Phản hồi",
        "description": "Phong cách thiết kế và khả năng tương thích thiết bị",
        "logicLevel": "Low",
        "isRequired": true,
        "sortOrder": 1,
        "isActive": true,
        "variants": [
          {
            "variantName": "Mẫu tiêu chuẩn, chuẩn Responsive",
            "description": "Giao diện theo mẫu có sẵn, hiển thị tốt trên mọi thiết bị",
            "price": 2890000,
            "sortOrder": 1
          },
          {
            "variantName": "Tùy chỉnh màu sắc, bộ lọc cơ bản",
            "description": "Thay đổi màu thương hiệu, tích hợp bộ lọc sản phẩm đơn giản",
            "price": 4890000,
            "sortOrder": 2
          },
          {
            "variantName": "Tối ưu UX các bước Checkout, Animation mượt mà, Mega Menu",
            "description": "Trải nghiệm mua hàng tối ưu, hiệu ứng chuyển động, menu lớn",
            "price": 6890000,
            "sortOrder": 3
          },
          {
            "variantName": "Giao diện độc quyền, Tối ưu tốc độ tải trang bằng NextJS (SSR/SSG)",
            "description": "Thiết kế riêng biệt, công nghệ NextJS siêu nhanh",
            "price": 10890000,
            "sortOrder": 4
          }
        ]
      }
    ]
  },
  {
    "groupName": "Sản phẩm & Khuyến mãi",
    "slug": "san-pham-khuyen-mai",
    "sortOrder": 2,
    "isActive": true,
    "features": [
      {
        "featureName": "Hiển thị Sản phẩm & Giỏ hàng",
        "description": "Cách thức trình bày sản phẩm và chức năng mua hàng",
        "logicLevel": "Medium",
        "isRequired": true,
        "sortOrder": 1,
        "isActive": true,
        "variants": [
          {
            "variantName": "Giỏ hàng cơ bản, hiển thị sản phẩm cơ bản",
            "price": 0,
            "sortOrder": 1
          }
        ]
      },
      {
        "featureName": "Chức năng Khuyến mãi & Phí ship",
        "description": "Các công cụ tăng doanh số và tính phí vận chuyển",
        "logicLevel": "Medium",
        "isRequired": false,
        "sortOrder": 2,
        "isActive": true,
        "variants": [
          {
            "variantName": "Mã giảm giá chung, tính phí ship đồng giá",
            "price": 2000000,
            "sortOrder": 1
          },
          {
            "variantName": "Flash Sale có đồng hồ đếm ngược, Mua combo (Combo discount)",
            "price": 4000000,
            "sortOrder": 2
          },
          {
            "variantName": "Hệ thống Tích điểm đổi quà, Ví tiền ảo nội bộ (Credit system)",
            "price": 8000000,
            "sortOrder": 3
          }
        ]
      }
    ]
  },
  {
    "groupName": "Hình ảnh & Video",
    "slug": "hinh-anh-video",
    "sortOrder": 3,
    "isActive": true,
    "features": [
      {
        "featureName": "Dung lượng & Chất lượng lưu trữ",
        "description": "Khả năng lưu trữ và hiển thị media",
        "logicLevel": "Low",
        "isRequired": true,
        "sortOrder": 1,
        "isActive": true,
        "variants": [
          {
            "variantName": "Kho lưu trữ hình ảnh cơ bản",
            "price": 0,
            "sortOrder": 1
          },
          {
            "variantName": "Kho lưu trữ hình ảnh + video",
            "price": 2000000,
            "sortOrder": 2
          },
          {
            "variantName": "Hình ảnh video Full HD, banner động",
            "price": 4000000,
            "sortOrder": 3
          },
          {
            "variantName": "Hình ảnh video Full HD, banner động, tối ưu tự động (WebP)",
            "price": 8000000,
            "sortOrder": 4
          }
        ]
      }
    ]
  },
  {
    "groupName": "Quản trị Đội nhóm",
    "slug": "quan-tri-doi-nhom",
    "sortOrder": 4,
    "isActive": true,
    "features": [
      {
        "featureName": "Phân quyền Tài khoản",
        "description": "Số lượng và cấp độ quyền quản trị",
        "logicLevel": "High",
        "isRequired": true,
        "sortOrder": 1,
        "isActive": true,
        "variants": [
          {
            "variantName": "1 tài khoản Admin toàn quyền",
            "price": 0,
            "sortOrder": 1
          },
          {
            "variantName": "Phân quyền cơ bản (Admin, Editor)",
            "price": 2000000,
            "sortOrder": 2
          },
          {
            "variantName": "Role-Based Access Control: Cấp quyền chi tiết (chỉ xem, được sửa) cho Sale, Kho",
            "price": 4000000,
            "sortOrder": 3
          },
          {
            "variantName": "Workflow: Nhân viên đăng sản phẩm -> Quản lý duyệt -> Xuất bản",
            "price": 8000000,
            "sortOrder": 4
          }
        ]
      }
    ]
  },
  {
    "groupName": "Báo cáo & Dữ liệu",
    "slug": "bao-cao-du-lieu",
    "sortOrder": 5,
    "isActive": true,
    "features": [
      {
        "featureName": "Hệ thống Báo cáo",
        "description": "Mức độ chi tiết của dữ liệu thống kê",
        "logicLevel": "High",
        "isRequired": true,
        "sortOrder": 1,
        "isActive": true,
        "variants": [
          {
            "variantName": "Danh sách đơn hàng",
            "price": 0,
            "sortOrder": 1
          },
          {
            "variantName": "Thống kê tổng doanh thu đơn giản",
            "price": 2000000,
            "sortOrder": 2
          },
          {
            "variantName": "Biểu đồ doanh thu trực quan, thống kê sản phẩm bán chạy",
            "price": 4000000,
            "sortOrder": 3
          },
          {
            "variantName": "Lịch sử thao tác của nhân viên (Log hệ thống), Báo cáo chiết khấu",
            "price": 8000000,
            "sortOrder": 4
          }
        ]
      }
    ]
  },
  {
    "groupName": "Dịch vụ Bổ sung (Nasani VN)",
    "slug": "dich-vu-bo-sung",
    "sortOrder": 6,
    "isActive": true,
    "features": [
      {
        "featureName": "Tên miền Quốc tế (.com)",
        "description": "Đã bao gồm phí năm 1",
        "logicLevel": "Low",
        "isRequired": false,
        "sortOrder": 1,
        "isActive": true,
        "variants": [
          {
            "variantName": "Đăng ký mới",
            "price": 350000,
            "sortOrder": 1
          }
        ]
      },
      {
        "featureName": "Tên miền Việt Nam (.vn)",
        "description": "Đã bao gồm phí năm 1",
        "logicLevel": "Low",
        "isRequired": false,
        "sortOrder": 2,
        "isActive": true,
        "variants": [
          {
            "variantName": "Đăng ký mới",
            "price": 850000,
            "sortOrder": 1
          }
        ]
      },
      {
        "featureName": "SSD Cloud Hosting (Việt Nam)",
        "description": "Dung lượng lưu trữ hosting năm 1",
        "logicLevel": "Medium",
        "isRequired": false,
        "sortOrder": 3,
        "isActive": true,
        "variants": [
          {
            "variantName": "Cơ bản (2GB - 3GB)",
            "price": 800000,
            "sortOrder": 1
          },
          {
            "variantName": "Nâng cao (5GB - 10GB)",
            "price": 1800000,
            "sortOrder": 2
          }
        ]
      }
    ]
  }
    ];

    console.log("Seeding pricing data...");
    await prisma.featureVariant.deleteMany();
    await prisma.feature.deleteMany();
    await prisma.featureGroup.deleteMany();

    for (const group of pricingData) {
      await prisma.featureGroup.create({
        data: {
          groupName: group.groupName,
          slug: group.slug,
          sortOrder: group.sortOrder,
          isActive: group.isActive,
          features: {
            create: group.features.map((f: any) => ({
              featureName: f.featureName,
              description: f.description || null,
              logicLevel: f.logicLevel,
              isRequired: f.isRequired,
              sortOrder: f.sortOrder,
              isActive: f.isActive,
              variants: {
                create: f.variants.map((v: any) => ({
                  variantName: v.variantName,
                  description: v.description || null,
                  price: v.price,
                  sortOrder: v.sortOrder
                }))
              }
            }))
          }
        }
      });
    }

    console.log("\nSeed completed!");
}

main()
    .then(async () => { await prisma.$disconnect(); })
    .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
