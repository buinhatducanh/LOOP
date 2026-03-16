import { config } from "dotenv";
config({ path: ".env.local", override: true });

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is missing");

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Seeding database...\n");

    // ─── SERVICES ───────────────────────────────────────────────
    const servicesData = [
        { slug: "business-website", icon: "Building2", title: "Business Website", shortDescription: "Professional, conversion-optimized websites that establish your brand identity and drive real business results.", longDescription: "A powerful business website is the cornerstone of your digital presence. We design and develop custom, high-performance websites tailored to your industry, audience, and goals.", features: ["Custom responsive design", "SEO-optimized architecture", "CMS integration (WordPress / Strapi)", "Contact & inquiry forms", "Google Analytics & Tag Manager", "Performance optimization (95+ Lighthouse score)", "SSL & security hardening", "12-month post-launch support"], technologies: ["React", "Next.js", "TypeScript", "Tailwind CSS", "WordPress", "Node.js"], startingPrice: 999, deliveryTime: "2–3 weeks", category: "Web Development", sortOrder: 1 },
        { slug: "branch-website-system", icon: "GitBranch", title: "Branch Website System", shortDescription: "Centralized multi-branch website system with individual branch pages, unified admin control, and brand consistency.", longDescription: "Scale your business across multiple locations with our Branch Website System — a unified platform where your main headquarters site connects seamlessly to individual branch pages.", features: ["Central admin dashboard", "Unlimited branch subpages", "Per-branch content management", "Location-based SEO", "Unified design system", "Branch-specific contact forms", "Staff directory per branch", "Multi-language support"], technologies: ["Next.js", "React", "PostgreSQL", "Prisma", "Vercel", "Cloudflare"], startingPrice: 1999, deliveryTime: "4–6 weeks", category: "Enterprise", sortOrder: 2 },
        { slug: "ecommerce-website", icon: "ShoppingCart", title: "E-Commerce Website", shortDescription: "Full-featured online store with payment integration, inventory management, and a seamless shopping experience.", longDescription: "Launch a high-converting e-commerce store that works 24/7 for your business. We build scalable, secure online stores with powerful product management.", features: ["Custom storefront design", "Product catalog with filters", "Stripe / PayPal integration", "Cart & checkout optimization", "Inventory management system", "Order tracking & notifications", "Discount & coupon engine", "Customer accounts & wishlist"], technologies: ["Next.js", "Shopify", "Stripe", "PostgreSQL", "Redis", "Cloudinary"], startingPrice: 2499, deliveryTime: "5–8 weeks", category: "E-Commerce", sortOrder: 3 },
        { slug: "landing-page", icon: "Rocket", title: "Landing Page Website", shortDescription: "High-converting, visually striking landing pages built to capture leads and maximize your ad spend ROI.", longDescription: "A great landing page can make or break your marketing campaigns. We craft pixel-perfect, blazing-fast landing pages with compelling copy structure and clear CTAs.", features: ["Conversion-optimized layout", "Lightning fast load (< 1s)", "Mobile-first design", "Lead capture forms", "A/B testing integration", "HubSpot / Mailchimp connection", "Heatmap & analytics ready", "Multi-variant support"], technologies: ["React", "Vite", "Tailwind CSS", "Framer Motion", "HubSpot"], startingPrice: 499, deliveryTime: "1–2 weeks", category: "Marketing", sortOrder: 4 },
        { slug: "custom-web-application", icon: "Code2", title: "Custom Web Application", shortDescription: "Bespoke web apps built to automate your workflows, serve your users, and scale with your business.", longDescription: "When off-the-shelf solutions don't cut it, we engineer custom web applications from scratch. From SaaS platforms and internal tools to client portals.", features: ["Full-stack architecture", "Custom database design", "REST & GraphQL APIs", "Authentication & authorization", "Real-time features (WebSockets)", "Admin dashboard", "Third-party API integrations", "CI/CD pipeline & DevOps"], technologies: ["React", "Node.js", "PostgreSQL", "Redis", "Docker", "AWS", "TypeScript"], startingPrice: 4999, deliveryTime: "8–16 weeks", category: "Application", sortOrder: 5 },
    ];

    const services: Record<string, { id: string }> = {};
    for (const data of servicesData) {
        const service = await prisma.service.upsert({ where: { slug: data.slug }, update: data, create: data });
        services[data.slug] = service;
        console.log("  ✅ Service:", service.title);
    }

    // ─── PROJECTS ───────────────────────────────────────────────
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
        console.log("  ✅ Project:", project.title);
    }

    // ─── PRICING PLANS ──────────────────────────────────────────
    const plansData = [
        { slug: "basic", name: "Basic", price: 499, period: "one-time", tagline: "Perfect for landing pages & startups", features: ["Up to 5 pages", "Mobile responsive design", "Basic SEO setup", "Contact form", "SSL certificate", "1 month free support", "2 revision rounds"], notIncluded: ["CMS integration", "Custom animations", "E-commerce", "Analytics dashboard"], highlighted: false, cta: "Get Started", color: "#3B82F6", sortOrder: 1 },
        { slug: "standard", name: "Standard", price: 999, period: "one-time", tagline: "Most popular for growing businesses", features: ["Up to 15 pages", "Custom design system", "CMS integration", "Advanced SEO", "Google Analytics", "3 months support", "5 revision rounds", "Performance optimization"], notIncluded: ["E-commerce", "Custom web app features"], highlighted: true, cta: "Get Started", color: "#6366F1", sortOrder: 2 },
        { slug: "premium", name: "Premium", price: 1999, period: "one-time", tagline: "Full-featured solution for established brands", features: ["Unlimited pages", "E-commerce ready", "Custom animations", "Multi-language support", "Advanced analytics dashboard", "6 months support", "Unlimited revisions", "Priority support", "Performance guarantee (95+ score)"], notIncluded: [], highlighted: false, cta: "Get Started", color: "#8B5CF6", sortOrder: 3 },
        { slug: "enterprise", name: "Enterprise", price: null, period: "custom", tagline: "Tailored solutions for large organizations", features: ["Custom web application", "Multi-branch system", "Dedicated project manager", "Custom integrations", "SLA agreement", "12 months support", "Team training", "Source code ownership", "White-label option"], notIncluded: [], highlighted: false, cta: "Contact Us", color: "#3B82F6", sortOrder: 4 },
    ];

    for (const data of plansData) {
        const plan = await prisma.pricingPlan.upsert({ where: { slug: data.slug }, update: data, create: data });
        console.log("  ✅ Plan:", plan.name);
    }

    // ─── TESTIMONIALS ───────────────────────────────────────────
    const testimonialsData = [
        { name: "James Mitchell", role: "CEO", company: "CorpTech Group", avatar: "JM", rating: 5, text: "LOOP transformed our digital presence completely. Lead generation is up 180% — truly exceptional work.", sortOrder: 1 },
        { name: "Sarah Al-Rashid", role: "Founder", company: "LuxeShop Inc.", avatar: "SR", rating: 5, text: "Our e-commerce revenue tripled in 3 months after the website launch. Worth every penny.", sortOrder: 2 },
        { name: "Dr. Ahmed Hassan", role: "Managing Director", company: "MediCare Health Group", avatar: "AH", rating: 5, text: "LOOP handled every HIPAA compliance requirement flawlessly. Admin workload dropped by 40%.", sortOrder: 3 },
        { name: "Emily Chen", role: "VP of Product", company: "DataFlow Technologies", avatar: "EC", rating: 5, text: "LOOP delivered a scalable analytics platform in just 12 weeks. The code quality is outstanding.", sortOrder: 4 },
    ];

    for (const data of testimonialsData) {
        await prisma.testimonial.create({ data });
        console.log("  ✅ Testimonial:", data.name);
    }

    // ─── ADMIN USER ─────────────────────────────────────────────
    const admin = await prisma.user.upsert({
        where: { email: "admin@loop.vn" },
        update: {},
        create: { email: "admin@loop.vn", name: "Admin LOOP", role: "admin", avatar: "AL" },
    });
    console.log("  ✅ Admin:", admin.email);

    // ─── SERVICE ATTRIBUTES (Feature Catalog) ──────────────────
    const attributesData = [
        // ── Nhóm Thiết kế ──
        { slug: "responsive-design", name: "Responsive Design", nameVi: "Thiết kế responsive", category: "design", categoryVi: "Thiết kế & UX", tier: "basic", price: 0, xpPoints: 0, sortOrder: 1 },
        { slug: "custom-ui-design", name: "Custom UI Design", nameVi: "Thiết kế UI tùy chỉnh", category: "design", categoryVi: "Thiết kế & UX", tier: "advanced", price: 2000000, xpPoints: 50, sortOrder: 2 },
        { slug: "animation-effects", name: "Animation & Motion Effects", nameVi: "Hiệu ứng chuyển động", category: "design", categoryVi: "Thiết kế & UX", tier: "advanced", price: 1500000, xpPoints: 30, sortOrder: 3 },
        // ── Nhóm Thương mại điện tử ──
        { slug: "basic-cart", name: "Basic Shopping Cart", nameVi: "Giỏ hàng cơ bản", category: "ecommerce", categoryVi: "Thương mại điện tử", tier: "basic", price: 0, xpPoints: 0, sortOrder: 10 },
        { slug: "advanced-cart", name: "Advanced Shopping Cart", nameVi: "Giỏ hàng nâng cao", category: "ecommerce", categoryVi: "Thương mại điện tử", tier: "advanced", price: 1000000, xpPoints: 40, sortOrder: 11 },
        { slug: "payment-gateway", name: "Payment Gateway Integration", nameVi: "Tích hợp cổng thanh toán", category: "ecommerce", categoryVi: "Thương mại điện tử", tier: "advanced", price: 1500000, xpPoints: 35, sortOrder: 12 },
        // ── Nhóm Bảo mật ──
        { slug: "ssl-certificate", name: "SSL Certificate", nameVi: "Chứng chỉ SSL", category: "security", categoryVi: "Bảo mật", tier: "basic", price: 0, xpPoints: 0, sortOrder: 20 },
        { slug: "advanced-auth", name: "Advanced Authentication", nameVi: "Phân quyền nâng cao", category: "security", categoryVi: "Bảo mật", tier: "advanced", price: 2000000, xpPoints: 70, sortOrder: 21 },
        // ── Nhóm SEO ──
        { slug: "basic-seo", name: "Basic SEO Setup", nameVi: "SEO cơ bản", category: "seo", categoryVi: "SEO & Marketing", tier: "basic", price: 0, xpPoints: 0, sortOrder: 30 },
        { slug: "advanced-seo", name: "Advanced SEO & Analytics", nameVi: "SEO nâng cao & Analytics", category: "seo", categoryVi: "SEO & Marketing", tier: "advanced", price: 1000000, xpPoints: 30, sortOrder: 31 },
        // ── Nhóm Tích hợp ──
        { slug: "live-chat", name: "Live Chat Integration", nameVi: "Chat trực tuyến", category: "integration", categoryVi: "Tích hợp", tier: "advanced", price: 500000, xpPoints: 20, sortOrder: 40 },
        { slug: "crm-integration", name: "CRM Integration", nameVi: "Tích hợp CRM", category: "integration", categoryVi: "Tích hợp", tier: "advanced", price: 2000000, xpPoints: 60, sortOrder: 41 },
        // ── Nhóm Hiệu năng ──
        { slug: "basic-hosting", name: "Standard Hosting", nameVi: "Hosting tiêu chuẩn", category: "performance", categoryVi: "Hiệu năng", tier: "basic", price: 0, xpPoints: 0, sortOrder: 50 },
        { slug: "premium-hosting", name: "Premium Hosting & CDN", nameVi: "Hosting cao cấp & CDN", category: "performance", categoryVi: "Hiệu năng", tier: "advanced", price: 1000000, xpPoints: 25, sortOrder: 51 },
    ];

    const savedAttributes: Record<string, { id: string }> = {};
    for (const data of attributesData) {
        const attr = await prisma.serviceAttribute.upsert({
            where: { slug: data.slug },
            update: data,
            create: { ...data, isActive: true, isRequired: data.tier === "basic" },
        });
        savedAttributes[data.slug] = attr;
        console.log("  ✅ Attribute:", data.nameVi);
    }

    // Set parent-child relationships (mutual exclusion)
    const parentChildPairs = [
        { child: "advanced-cart", parent: "basic-cart" },
        { child: "advanced-seo", parent: "basic-seo" },
        { child: "premium-hosting", parent: "basic-hosting" },
    ];
    for (const { child, parent } of parentChildPairs) {
        if (savedAttributes[child] && savedAttributes[parent]) {
            await prisma.serviceAttribute.update({
                where: { id: savedAttributes[child].id },
                data: { parentId: savedAttributes[parent].id },
            });
            console.log(`  🔗 Parent-child: ${parent} → ${child}`);
        }
    }

    // ─── ADDON SERVICES (Dịch vụ rời) ──────────────────────────
    const addonsData = [
        { slug: "seo-writing-30", name: "SEO Article Writing (30/month)", nameVi: "Viết bài SEO (30 bài/tháng)", description: "Monthly SEO content writing service", descriptionVi: "Dịch vụ viết bài chuẩn SEO hàng tháng, 30 bài/tháng", icon: "pen-line", type: "recurring", price: 2000000, billingPeriod: "monthly", metadata: { articlesPerMonth: 30 }, sortOrder: 1 },
        { slug: "google-maps-setup", name: "Google Maps Setup", nameVi: "Định vị Google Maps", description: "Set up and optimize Google Business Profile", descriptionVi: "Thiết lập và tối ưu hồ sơ Google Business trên Maps", icon: "map-pin", type: "one_time", price: 500000, billingPeriod: null, metadata: Prisma.JsonNull, sortOrder: 2 },
        { slug: "data-entry-support", name: "Data Entry Support", nameVi: "Hỗ trợ nhập liệu", description: "Product data entry and content upload", descriptionVi: "Nhập liệu sản phẩm, hình ảnh và nội dung lên website", icon: "database", type: "one_time", price: 1000000, billingPeriod: null, metadata: Prisma.JsonNull, sortOrder: 3 },
        { slug: "monthly-maintenance", name: "Monthly Maintenance", nameVi: "Bảo trì hàng tháng", description: "Ongoing website maintenance and updates", descriptionVi: "Bảo trì website định kỳ: cập nhật, backup, monitoring", icon: "wrench", type: "recurring", price: 500000, billingPeriod: "monthly", metadata: Prisma.JsonNull, sortOrder: 4 },
        { slug: "marketing-consultation", name: "Marketing Consultation", nameVi: "Tư vấn marketing", description: "One-on-one marketing strategy session", descriptionVi: "Buổi tư vấn chiến lược marketing 1-1 với chuyên gia", icon: "megaphone", type: "one_time", price: 1500000, billingPeriod: null, metadata: Prisma.JsonNull, sortOrder: 5 },
        { slug: "social-media-setup", name: "Social Media Setup", nameVi: "Thiết lập mạng xã hội", description: "Set up and brand social media profiles", descriptionVi: "Thiết lập và đồng bộ thương hiệu trên mạng xã hội", icon: "share-2", type: "one_time", price: 800000, billingPeriod: null, metadata: Prisma.JsonNull, sortOrder: 6 },
    ];

    const savedAddons: Record<string, { id: string }> = {};
    for (const data of addonsData) {
        const addon = await prisma.addonService.upsert({
            where: { slug: data.slug },
            update: data,
            create: { ...data, isActive: true },
        });
        savedAddons[data.slug] = addon;
        console.log("  ✅ Addon:", data.nameVi);
    }

    // ─── REWARD TIERS (Mức thưởng theo level) ──────────────────
    const tiersData = [
        { level: 2, name: "Advanced Project", nameVi: "Dự án Nâng cao", description: "Rewards for reaching Level 2 (100+ XP)", minXp: 100 },
        { level: 3, name: "Premium Project", nameVi: "Dự án Premium", description: "Rewards for reaching Level 3 (200+ XP)", minXp: 200 },
        { level: 4, name: "Enterprise Project", nameVi: "Dự án Doanh nghiệp", description: "Rewards for reaching Level 4 (300+ XP)", minXp: 300 },
    ];

    const savedTiers: Record<number, { id: string }> = {};
    for (const data of tiersData) {
        const tier = await prisma.rewardTier.upsert({
            where: { level: data.level },
            update: data,
            create: { ...data, isActive: true },
        });
        savedTiers[data.level] = tier;
        console.log("  ✅ Tier:", data.nameVi);
    }

    // ─── REWARD TIER ITEMS (Ưu đãi từng level) ─────────────────
    const tierItemsData = [
        // Level 2 rewards
        { tierLevel: 2, addonSlug: "data-entry-support", quantity: 1, durationMonths: null, description: "Nhập liệu sản phẩm miễn phí", sortOrder: 1 },
        { tierLevel: 2, addonSlug: "seo-writing-30", quantity: 1, durationMonths: 3, description: "Gói viết bài SEO 30 bài/tháng × 3 tháng", sortOrder: 2 },
        // Level 3 rewards
        { tierLevel: 3, addonSlug: "google-maps-setup", quantity: 1, durationMonths: null, description: "Định vị Google Maps miễn phí", sortOrder: 1 },
        { tierLevel: 3, addonSlug: "monthly-maintenance", quantity: 1, durationMonths: 3, description: "Bảo trì 3 tháng miễn phí", sortOrder: 2 },
        // Level 4 rewards
        { tierLevel: 4, addonSlug: "marketing-consultation", quantity: 1, durationMonths: null, description: "Tư vấn marketing 1 buổi miễn phí", sortOrder: 1 },
        { tierLevel: 4, addonSlug: "seo-writing-30", quantity: 1, durationMonths: 6, description: "Gói viết bài SEO 30 bài/tháng × 6 tháng", sortOrder: 2 },
        { tierLevel: 4, addonSlug: "social-media-setup", quantity: 1, durationMonths: null, description: "Thiết lập mạng xã hội miễn phí", sortOrder: 3 },
    ];

    for (const { tierLevel, addonSlug, ...itemData } of tierItemsData) {
        const tier = savedTiers[tierLevel];
        const addon = savedAddons[addonSlug];
        if (tier && addon) {
            await prisma.rewardTierItem.upsert({
                where: { rewardTierId_addonServiceId: { rewardTierId: tier.id, addonServiceId: addon.id } },
                update: { ...itemData },
                create: { ...itemData, rewardTierId: tier.id, addonServiceId: addon.id },
            });
            console.log(`  ✅ Tier ${tierLevel} item: ${addonSlug}`);
        }
    }

    // ─── SITE SETTINGS (Platform config) ────────────────────────
    const settingsData = [
        { key: "custom_web_base_price", value: "3000000" },
        { key: "xp_per_level", value: "100" },
    ];
    for (const data of settingsData) {
        await prisma.siteSetting.upsert({
            where: { key: data.key },
            update: { value: data.value },
            create: data,
        });
        console.log("  ✅ Setting:", data.key, "=", data.value);
    }

    console.log("\n🎉 Seed completed!");
}

main()
    .then(async () => { await prisma.$disconnect(); await pool.end(); })
    .catch(async (e) => { console.error(e); await prisma.$disconnect(); await pool.end(); process.exit(1); });
