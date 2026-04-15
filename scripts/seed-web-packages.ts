/**
 * Seed script — Web Packages Pricing (theo tai lieu noi bo cua PO)
 * Run: npx ts-node scripts/seed-web-packages.ts
 *
 * Seed 4 goi web + hosting plans + domain prices + freebies config
 */
import { config } from "dotenv";
import { resolve } from "path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

config({ path: resolve(process.cwd(), ".env.local") });

const prisma = new PrismaClient({
 adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

// ── 4 Web Packages (ServicePackage) ─────────────────────────────────────────────
// Note: ServicePackage chi co title/titleEn/titleJa/titleKo/titleZh
// va shortDesc/shortDescEn — KHONG co shortDescJa/Ko/Zh

const WEB_PACKAGES = [
 {
 slug: "landing",
 title: "Landing Page",
 titleEn: "Landing Page",
 titleJa: "Landing Page",
 titleKo: "Landing Page",
 titleZh: "",
 shortDesc: "Chien dich Marketing, gioi thieu ca nhan, offline. Phu hop landing page, trang gioi thieu ca nhan, san pham don le.",
 shortDescEn: "Marketing campaign, personal introduction, offline. Ideal for landing pages, personal intro, single product pages.",
 features: [
 "Giao dien hien dai, chuan Responsive",
 "Toi uu trai nghiem UI/UX",
 "Ho tro chinh sua sau ban giao",
 "Trang gioi thieu SP/Dich vu",
 "Admin quan ly bai viet",
 "Form thu thap du lieu KH",
 "Quan ly tep KH co ban",
 "Toi uu SEO On-page",
 ],
 price: 1_890_000,
 priceText: "1.89 trieu",
 type: "web",
 isSubscription: false,
 billingPeriod: null,
 sortOrder: 1,
 serviceKey: "web",
 tierLevel: 1,
 },
 {
 slug: "ban-hang",
 title: "Ban Hang Co Ban",
 titleEn: "Basic E-commerce",
 titleJa: "Basics E-comasu",
 titleKo: "Gibon Ikeomseo",
 titleZh: "",
 shortDesc: "Shop online nho & vua, bat dau chuyen doi so. Phu hop cua hang online, boutique, dich vu nho.",
 shortDescEn: "Small & medium online shop, start digital transformation. Ideal for small online stores, boutiques, small services.",
 features: [
 "Bao gom moi tinh nang Landing Page",
 "Danh muc & Chi tiet san pham",
 "Chuc nang Gio hang thong minh",
 "Thong ke don hang & Doanh thu",
 "Tai khoan Admin & Khach hang",
 "Tang 5 trang noi dung mien phi",
 ],
 price: 3_890_000,
 priceText: "3.89 trieu",
 type: "web",
 isSubscription: false,
 billingPeriod: null,
 sortOrder: 2,
 serviceKey: "web",
 tierLevel: 2,
 },
 {
 slug: "doanh-nghiep",
 title: "Quan Tri Doanh Nghiep",
 titleEn: "Enterprise Management",
 titleJa: "Entapuraizu Kanri",
 titleKo: "Enteo Pulaibu Gwanli",
 titleZh: "",
 shortDesc: "Doanh nghiep, he thong ban hang quy mo lon. Phu hop doanh nghiep vua va lon, can quan ly phuc tap.",
 shortDescEn: "Enterprise, large-scale sales system. Ideal for medium and large businesses with complex management needs.",
 features: [
 "Bao gom moi tinh nang Ban Hang",
 "Gio hang da dich vu/san pham",
 "SP nang cao (size, mau, thuoc tinh)",
 "He thong Ma giam gia/Flash sale",
 "Tich diem & Doi qua thanh vien",
 "Bo loc & Tim kiem AI thong minh",
 "Quan ly Kho hang & Nha cung cap",
 ],
 price: 5_890_000,
 priceText: "5.89 trieu",
 type: "web",
 isSubscription: false,
 billingPeriod: null,
 sortOrder: 3,
 serviceKey: "web",
 tierLevel: 3,
 },
 {
 slug: "yeu-cau",
 title: "Thiet Ke Theo Yeu Cau",
 titleEn: "Custom Design",
 titleJa: "Kasutamu Dezain",
 titleKo: "Machum Dezain",
 titleZh: "",
 shortDesc: "Startups, nen tang App-web co logic phuc tap. Phu hop startup, platform, web app co yeu cau dac thu rieng.",
 shortDescEn: "Startups, app-web platforms with complex logic. Ideal for startups, platforms, web apps with unique requirements.",
 features: [
 "Bao gom moi tinh nang Doanh Nghiep",
 "UI/UX Doc quyen (Khong mau)",
 "Tuy chinh chuc nang Core System",
 "Tich hop Cong thanh toan/Van chuyen",
 "API ket noi ben thu 3 (Zalo, App...)",
 "Bao mat da lop & Toi uu Speed cuc han",
 ],
 price: 7_890_000,
 priceText: "7.89 trieu+",
 type: "web",
 isSubscription: false,
 billingPeriod: null,
 sortOrder: 4,
 serviceKey: "web",
 tierLevel: 4,
 },
];

// ── Hosting Plans ───────────────────────────────────────────────────────────────

const HOSTING_PLANS = [
 {
 slug: "co-ban",
 name: "Co Ban",
 nameVi: "Co Ban",
 monthlyPrice: 49_000,
 period: "1 nam",
 periodVi: "1 nam",
 months: 12,
 discountPct: 0,
 features: ["1,000 truy cap/ngay", "Luu tru 500MB", "SSL mien phi", "Email 2 hop thu"],
 featuresVi: ["1,000 truy cap/ngay", "Luu tru 500MB", "SSL mien phi", "Email 2 hop thu"],
 highlighted: false,
 color: "#6EB1A8",
 sortOrder: 1,
 },
 {
 slug: "pho-thong",
 name: "Pho Thong",
 nameVi: "Pho Thong",
 monthlyPrice: 99_000,
 period: "1 nam",
 periodVi: "1 nam",
 months: 12,
 discountPct: 0,
 features: ["10,000 truy cap/ngay", "Luu tru 2GB", "SSL mien phi", "Email 5 hop thu", "Backup hang ngay"],
 featuresVi: ["10,000 truy cap/ngay", "Luu tru 2GB", "SSL mien phi", "Email 5 hop thu", "Backup hang ngay"],
 highlighted: true,
 color: "#3B82F6",
 sortOrder: 2,
 },
 {
 slug: "vip",
 name: "VIP",
 nameVi: "VIP",
 monthlyPrice: 249_000,
 period: "1 nam",
 periodVi: "1 nam",
 months: 12,
 discountPct: 0,
 features: ["100,000 truy cap/ngay", "Luu tru 5GB", "SSL mien phi", "Email khong gioi han", "Backup hang ngay", "Ho tro uu tien"],
 featuresVi: ["100,000 truy cap/ngay", "Luu tru 5GB", "SSL mien phi", "Email khong gioi han", "Backup hang ngay", "Ho tro uu tien"],
 highlighted: false,
 color: "#EC4899",
 sortOrder: 3,
 },
];

// ── Domain Prices ──────────────────────────────────────────────────────────────

const DOMAIN_PRICES = [
 { extension: ".vn", registrationPrice: 600_000, renewalPrice: 600_000, period: "1 nam", periodVi: "1 nam", note: null, noteVi: null, sortOrder: 1 },
 { extension: ".com.vn", registrationPrice: 500_000, renewalPrice: 500_000, period: "1 nam", periodVi: "1 nam", note: null, noteVi: null, sortOrder: 2 },
 { extension: ".com", registrationPrice: 400_000, renewalPrice: 400_000, period: "1 nam", periodVi: "1 nam", note: "Tiết kiem", noteVi: "Tiết kiem", sortOrder: 3 },
 { extension: ".io.vn", registrationPrice: 200_000, renewalPrice: 200_000, period: "1 nam", periodVi: "1 nam", note: "Tiết kiem", noteVi: "Tiết kiem", sortOrder: 4 },
 { extension: ".online", registrationPrice: 200_000, renewalPrice: 200_000, period: "1 nam", periodVi: "1 nam", note: "Tiết kiem", noteVi: "Tiết kiem", sortOrder: 5 },
 { extension: ".store", registrationPrice: 200_000, renewalPrice: 200_000, period: "1 nam", periodVi: "1 nam", note: "Tiết kiem", noteVi: "Tiết kiem", sortOrder: 6 },
];

// ── PricingWebPackage (admin web_packages tab) ─────────────────────────────────

const PRICING_WEB_PACKAGES = [
 {
 slug: "landing",
 name: "Landing Page",
 nameVi: "Landing Page",
 tagline: "Chien dich Marketing, gioi thieu ca nhan, offline",
 taglineVi: "Chien dich Marketing, gioi thieu ca nhan, offline",
 price: 1_890_000,
 period: "tron goi",
 periodVi: "tron goi",
 highlighted: false,
 cta: "Chon Landing Page",
 ctaVi: "Chon Landing Page",
 color: "#6EB1A8",
 pages: "5 trang",
 pagesVi: "5 trang",
 sortOrder: 1,
 },
 {
 slug: "ban-hang",
 name: "Ban Hang Co Ban",
 nameVi: "Ban Hang Co Ban",
 tagline: "Shop online nho & vua, bat dau chuyen doi so",
 taglineVi: "Shop online nho & vua, bat dau chuyen doi so",
 price: 3_890_000,
 period: "tron goi",
 periodVi: "tron goi",
 highlighted: true,
 cta: "Chon Ban Hang",
 ctaVi: "Chon Ban Hang",
 color: "#3B82F6",
 pages: "10 trang + 5 trang bonus",
 pagesVi: "10 trang + 5 trang bonus",
 sortOrder: 2,
 },
 {
 slug: "doanh-nghiep",
 name: "Quan Tri Doanh Nghiep",
 nameVi: "Quan Tri Doanh Nghiep",
 tagline: "Doanh nghiep, he thong ban hang quy mo lon",
 taglineVi: "Doanh nghiep, he thong ban hang quy mo lon",
 price: 5_890_000,
 period: "tron goi",
 periodVi: "tron goi",
 highlighted: false,
 cta: "Chon Doanh Nghiep",
 ctaVi: "Chon Doanh Nghiep",
 color: "#8B5CF6",
 pages: "20 trang + tuy chinh",
 pagesVi: "20 trang + tuy chinh",
 sortOrder: 3,
 },
 {
 slug: "yeu-cau",
 name: "Thiet Ke Theo Yeu Cau",
 nameVi: "Thiet Ke Theo Yeu Cau",
 tagline: "Startups, nen tang App-web co logic phuc tap",
 taglineVi: "Startups, nen tang App-web co logic phuc tap",
 price: 7_890_000,
 period: "tron goi+",
 periodVi: "tron goi+",
 highlighted: false,
 cta: "Lien he bao gia",
 ctaVi: "Lien he bao gia",
 color: "#EC4899",
 pages: "Khong gioi han",
 pagesVi: "Khong gioi han",
 sortOrder: 4,
 },
];

// ── Website Pricing Config (SiteSetting) ─────────────────────────────────────────
// Market prices for strikethrough anchor display

const WEBSITE_PRICING_CONFIG = {
 marketPrices: {
 landing: 2_500_000,
 "ban-hang": 5_500_000,
 "doanh-nghiep": 8_900_000,
 "yeu-cau": 12_000_000,
 },
 promotion: { active: false, label: "Giam gia mua", expiresAt: null },
 slotsLeft: null,
};

// ── Freebies Config (SiteSetting) ────────────────────────────────────────────────
// Free gifts included with each package

const PACKAGE_FREEBBIES: Record<string, { hosting?: string; domain?: string[]; note: string }> = {
 landing: {
 hosting: "co-ban:6",
 domain: [".io.vn"],
 note: "Hosting Co Ban (6 thang) + Ten mien .io.vn (1 nam)",
 },
 "ban-hang": {
 hosting: "co-ban:6",
 domain: [".com", ".io.vn"],
 note: "Hosting Co Ban (6 thang) + Domain .com & .io.vn (1 nam)",
 },
 "doanh-nghiep": {
 hosting: "pho-thong:6",
 domain: [".vn", ".io.vn"],
 note: "Hosting 3GB (6 thang) + Domain .vn & .io.vn (1 nam)",
 },
 "yeu-cau": {
 note: "Thiet lap uu dai rieng biet tuy quy mo du an",
 },
};

// ── Main ────────────────────────────────────────────────────────────────────────

async function main() {
 console.log("Seeding web packages pricing...\n");

 // ── ServicePackage (4 web packages) ───────────────────────────────────────
 console.log("== ServicePackages ==");
 for (const pkg of WEB_PACKAGES) {
 const existing = await prisma.servicePackage.findUnique({ where: { slug: pkg.slug } });
 if (existing) {
 await prisma.servicePackage.update({
 where: { slug: pkg.slug },
 data: {
 title: pkg.title,
 titleEn: pkg.titleEn,
 titleJa: pkg.titleJa,
 titleKo: pkg.titleKo,
 titleZh: pkg.titleZh,
 shortDesc: pkg.shortDesc,
 shortDescEn: pkg.shortDescEn,
 features: pkg.features,
 price: pkg.price,
 priceText: pkg.priceText,
 type: pkg.type,
 isSubscription: pkg.isSubscription,
 billingPeriod: pkg.billingPeriod,
 sortOrder: pkg.sortOrder,
 isActive: true,
 serviceKey: pkg.serviceKey,
 tierLevel: pkg.tierLevel,
 },
 });
 console.log(" Updated: " + pkg.title + " - " + pkg.priceText);
 } else {
 await prisma.servicePackage.create({ data: { ...pkg, isActive: true } });
 console.log(" Created: " + pkg.title + " - " + pkg.priceText);
 }
 }

 // ── PricingHostingPlan ─────────────────────────────────────────────────────
 console.log("\n== Hosting Plans ==");
 for (const plan of HOSTING_PLANS) {
 const existing = await prisma.pricingHostingPlan.findUnique({ where: { slug: plan.slug } });
 if (existing) {
 await prisma.pricingHostingPlan.update({
 where: { slug: plan.slug },
 data: {
 name: plan.name,
 nameVi: plan.nameVi,
 monthlyPrice: plan.monthlyPrice,
 period: plan.period,
 periodVi: plan.periodVi,
 months: plan.months,
 discountPct: plan.discountPct,
 features: plan.features,
 featuresVi: plan.featuresVi,
 highlighted: plan.highlighted,
 color: plan.color,
 sortOrder: plan.sortOrder,
 isActive: true,
 },
 });
 console.log(" Updated: " + plan.name + " - " + plan.monthlyPrice.toLocaleString() + "d/thang");
 } else {
 await prisma.pricingHostingPlan.create({ data: { ...plan, isActive: true } });
 console.log(" Created: " + plan.name + " - " + plan.monthlyPrice.toLocaleString() + "d/thang");
 }
 }

 // ── PricingDomainPrice ──────────────────────────────────────────────────────
 console.log("\n== Domain Prices ==");
 for (const dom of DOMAIN_PRICES) {
 const existing = await prisma.pricingDomainPrice.findUnique({ where: { extension: dom.extension } });
 if (existing) {
 await prisma.pricingDomainPrice.update({
 where: { extension: dom.extension },
 data: {
 registrationPrice: dom.registrationPrice,
 renewalPrice: dom.renewalPrice,
 period: dom.period,
 periodVi: dom.periodVi,
 note: dom.note,
 noteVi: dom.noteVi,
 sortOrder: dom.sortOrder,
 isActive: true,
 },
 });
 console.log(" Updated: " + dom.extension + " - " + dom.registrationPrice.toLocaleString() + "d/nam");
 } else {
 await prisma.pricingDomainPrice.create({ data: { ...dom, isActive: true, isAvailable: true } });
 console.log(" Created: " + dom.extension + " - " + dom.registrationPrice.toLocaleString() + "d/nam");
 }
 }

 // ── PricingWebPackage (admin tab) ───────────────────────────────────────────
 console.log("\n== PricingWebPackages (admin) ==");
 for (const pkg of PRICING_WEB_PACKAGES) {
 const existing = await prisma.pricingWebPackage.findUnique({ where: { slug: pkg.slug } });
 if (existing) {
 await prisma.pricingWebPackage.update({
 where: { slug: pkg.slug },
 data: {
 name: pkg.name,
 nameVi: pkg.nameVi,
 tagline: pkg.tagline,
 taglineVi: pkg.taglineVi,
 price: pkg.price,
 period: pkg.period,
 periodVi: pkg.periodVi,
 highlighted: pkg.highlighted,
 cta: pkg.cta,
 ctaVi: pkg.ctaVi,
 color: pkg.color,
 pages: pkg.pages,
 pagesVi: pkg.pagesVi,
 sortOrder: pkg.sortOrder,
 isActive: true,
 },
 });
 console.log(" Updated: " + pkg.name + " - " + pkg.price.toLocaleString() + "d");
 } else {
 await prisma.pricingWebPackage.create({ data: { ...pkg, isActive: true } });
 console.log(" Created: " + pkg.name + " - " + pkg.price.toLocaleString() + "d");
 }
 }

 // ── SiteSetting: website_pricing_config ─────────────────────────────────────
 console.log("\n== SiteSetting: website_pricing_config ==");
 const existingConfig = await prisma.siteSetting.findUnique({
 where: { key: "website_pricing_config" },
 });
 if (existingConfig) {
 await prisma.siteSetting.update({
 where: { key: "website_pricing_config" },
 data: { value: JSON.stringify(WEBSITE_PRICING_CONFIG) },
 });
 console.log(" Updated: website_pricing_config");
 } else {
 await prisma.siteSetting.create({
 data: { key: "website_pricing_config", group: "pricing", value: JSON.stringify(WEBSITE_PRICING_CONFIG) },
 });
 console.log(" Created: website_pricing_config");
 }

 // ── SiteSetting: package_freebies ───────────────────────────────────────────
 console.log("\n== SiteSetting: package_freebies ==");
 const existingFreebies = await prisma.siteSetting.findUnique({
 where: { key: "package_freebies" },
 });
 if (existingFreebies) {
 await prisma.siteSetting.update({
 where: { key: "package_freebies" },
 data: { value: JSON.stringify(PACKAGE_FREEBBIES) },
 });
 console.log(" Updated: package_freebies");
 } else {
 await prisma.siteSetting.create({
 data: { key: "package_freebies", group: "pricing", value: JSON.stringify(PACKAGE_FREEBBIES) },
 });
 console.log(" Created: package_freebies");
 }

 console.log("\n=== Seed hoan tat! ===");
 console.log("\nTiep theo:");
 console.log(" 1. Cap nhat BookingWizardClient.tsx voi packages moi");
 console.log(" 2. Chay: npm run dev -> kiem tra /booking");
}

main()
 .catch((e: unknown) => {
 console.error("Seed that bai:", e);
 process.exit(1);
 })
 .finally(async () => {
 await prisma.$disconnect();
 });
