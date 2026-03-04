import { config } from "dotenv";
config();

import { PrismaClient } from "../src/generated/prisma/client.js";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaNeon(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Seeding database...");

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
        { slug: "basic", name: "Basic", price: 499, period: "one-time", tagline: "Perfect for landing pages & startups", features: ["Up to 5 pages", "Mobile responsive design", "Basic SEO setup", "Contact form", "SSL certificate", "1 month free support", "2 revision rounds"], notIncluded: ["CMS integration", "Custom animations", "E-commerce", "Analytics dashboard"], highlighted: false, cta: "Get Started", color: "#3B82F6", sortOrder: 1 },
        { slug: "standard", name: "Standard", price: 999, period: "one-time", tagline: "Most popular for growing businesses", features: ["Up to 15 pages", "Custom design system", "CMS integration", "Advanced SEO", "Google Analytics", "3 months support", "5 revision rounds", "Performance optimization"], notIncluded: ["E-commerce", "Custom web app features"], highlighted: true, cta: "Get Started", color: "#6366F1", sortOrder: 2 },
        { slug: "premium", name: "Premium", price: 1999, period: "one-time", tagline: "Full-featured solution for established brands", features: ["Unlimited pages", "E-commerce ready", "Custom animations", "Multi-language support", "Advanced analytics dashboard", "6 months support", "Unlimited revisions", "Priority support", "Performance guarantee (95+ score)"], notIncluded: [], highlighted: false, cta: "Get Started", color: "#8B5CF6", sortOrder: 3 },
        { slug: "enterprise", name: "Enterprise", price: null, period: "custom", tagline: "Tailored solutions for large organizations", features: ["Custom web application", "Multi-branch system", "Dedicated project manager", "Custom integrations", "SLA agreement", "12 months support", "Team training", "Source code ownership", "White-label option"], notIncluded: [], highlighted: false, cta: "Contact Us", color: "#3B82F6", sortOrder: 4 },
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

    console.log("\nSeed completed!");
}

main()
    .then(async () => { await prisma.$disconnect(); })
    .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
