/**
 * Search Service — Business logic for global site search.
 *
 * Searches across 14 entity types:
 * Service, TeamMember, Project, BlogPost, Course, Faq,
 * Testimonial, Instructor, Expertise, WebTemplate,
 * LandingPage, PricingWebPackage, AddonService, SocialPost
 *
 * Supports i18n (vi/en) and scored ranking.
 */

import { prisma } from "@/lib/prisma";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SearchResult {
  services: ServiceResult[];
  team: TeamResult[];
  projects: ProjectResult[];
  blog: BlogResult[];
  courses: CourseResult[];
  faqs: FaqResult[];
  testimonials: TestimonialResult[];
  instructors: InstructorResult[];
  expertises: ExpertiseResult[];
  webTemplates: WebTemplateResult[];
  landingPages: LandingPageResult[];
  pricingPackages: PricingPackageResult[];
  addonServices: AddonServiceResult[];
  total: number;
  totalHits: number;
}

export interface ServiceResult {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon?: string | null;
  category: string;
  price?: string | null;
  deliveryTime?: string | null;
  href: string;
  score?: number;
}

export interface TeamResult {
  id: string;
  slug: string;
  name: string;
  role: string;
  image?: string | null;
  description?: string | null;
  href: string;
  score?: number;
}

export interface ProjectResult {
  id: string;
  slug: string;
  title: string;
  client?: string | null;
  image?: string | null;
  category: string;
  href: string;
  score?: number;
}

export interface BlogResult {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  author?: string | null;
  category?: string | null;
  publishedAt?: string | null;
  href: string;
  score?: number;
}

export interface CourseResult {
  id: string;
  title: string;
  description?: string | null;
  instructor?: string | null;
  price?: string | null;
  image?: string | null;
  href: string;
  score?: number;
}

export interface FaqResult {
  id: string;
  question: string;
  answer: string;
  category: string;
  href: string;
  score?: number;
}

export interface TestimonialResult {
  id: string;
  name: string;
  company: string;
  role: string;
  text: string;
  rating: number;
  href: string;
  score?: number;
}

export interface InstructorResult {
  id: string;
  name: string;
  bio?: string | null;
  specialties?: string[];
  avatar?: string | null;
  href: string;
  score?: number;
}

export interface ExpertiseResult {
  id: string;
  name: string;
  category: string;
  icon?: string | null;
  href: string;
  score?: number;
}

export interface WebTemplateResult {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  category: string;
  thumbnail?: string | null;
  href: string;
  score?: number;
}

export interface LandingPageResult {
  id: string;
  slug: string;
  name: string;
  seoTitle?: string | null;
  seoDesc?: string | null;
  href: string;
  score?: number;
}

export interface PricingPackageResult {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  price: number;
  period: string;
  href: string;
  score?: number;
}

export interface AddonServiceResult {
  id: string;
  slug: string;
  name: string;
  nameVi?: string | null;
  nameEn?: string | null;
  description?: string | null;
  href: string;
  score?: number;
}

// ─── Search Scoring ─────────────────────────────────────────────────────────────

const ENTITY_PRIORITY: Record<string, number> = {
  services: 10,      // Core offering — highest
  projects: 8,
  courses: 7,
  blog: 6,
  team: 5,
  faqs: 4,
  testimonials: 3,
  instructors: 3,
  expertises: 3,
  webTemplates: 2,
  pricingPackages: 2,
  addonServices: 2,
  landingPages: 1,
};

/**
 * Score a result based on keyword match quality.
 * Higher score = more relevant.
 */
function scoreItem(
  query: string,
  titleField: string | null | undefined,
  descField: string | null | undefined,
  entityType: string,
  createdAt?: Date | null,
): number {
  if (!query) return 0;
  const q = query.toLowerCase();
  const title = (titleField ?? "").toLowerCase();
  const desc = (descField ?? "").toLowerCase();

  let score = 0;

  // Title exact match (query is substring of title)
  if (title.includes(q)) {
    score += 40;
    // Bonus for prefix match (starts with query)
    if (title.startsWith(q)) score += 20;
    // Bonus for whole-word match
    const wordBoundary = new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (wordBoundary.test(title)) score += 15;
  }

  // Description match
  if (desc.includes(q)) {
    score += 20;
    if (desc.includes(q + " ")) score += 10; // bonus for word followed by space
  }

  // Recency bonus — newer = slightly higher rank (max 10 points)
  if (createdAt) {
    const ageDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays < 7) score += 10;
    else if (ageDays < 30) score += 8;
    else if (ageDays < 90) score += 5;
    else if (ageDays < 365) score += 2;
  }

  // Entity priority bonus
  score += ENTITY_PRIORITY[entityType] ?? 1;

  return score;
}

// ─── Category label maps ───────────────────────────────────────────────────────

const SERVICE_CATEGORIES_VI: Record<string, string> = {
  website: "Website",
  app: "Ứng dụng",
  marketing: "Marketing",
  branding: "Thương hiệu",
};

const SERVICE_CATEGORIES_EN: Record<string, string> = {
  website: "Website",
  app: "App",
  marketing: "Marketing",
  branding: "Branding",
};

const FAQ_CATEGORIES_VI: Record<string, string> = {
  general: "Chung",
  services: "Dịch vụ",
  technical: "Kỹ thuật",
  payment: "Thanh toán",
  lp: "LP",
  academy: "Học viên",
};

const FAQ_CATEGORIES_EN: Record<string, string> = {
  general: "General",
  services: "Services",
  technical: "Technical",
  payment: "Payment",
  lp: "LP",
  academy: "Academy",
};

// ─── Main search function ─────────────────────────────────────────────────────

export async function globalSearch(
  query: string,
  locale: string = "vi",
  options: { maxPerCategory?: number } = {}
): Promise<SearchResult> {
  const { maxPerCategory = 5 } = options;

  if (!query || query.trim().length < 2) {
    return {
      services: [], team: [], projects: [], blog: [],
      courses: [], faqs: [], testimonials: [], instructors: [],
      expertises: [], webTemplates: [], landingPages: [],
      pricingPackages: [], addonServices: [],
      total: 0, totalHits: 0,
    };
  }

  const svcCategoryMap = locale === "vi" ? SERVICE_CATEGORIES_VI : SERVICE_CATEGORIES_EN;
  const faqCategoryMap = locale === "vi" ? FAQ_CATEGORIES_VI : FAQ_CATEGORIES_EN;

  const [
    services, teamMembers, projects,
    blogPosts, courses, faqs,
    testimonials, instructors, expertises,
    webTemplates, landingPages, pricingPackages, addonServices,
  ] = await Promise.all([
    // ── Services ──────────────────────────────────────────────────────
    prisma.service.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { shortDescription: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
        ],
        isActive: true,
      },
      select: {
        id: true, slug: true, title: true, shortDescription: true,
        icon: true, category: true, startingPrice: true, deliveryTime: true,
      },
      take: maxPerCategory,
      orderBy: { sortOrder: "asc" },
    }),

    // ── Team Members ────────────────────────────────────────────────
    prisma.teamMember.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { role: { contains: query, mode: "insensitive" } },
          { bio: { contains: query, mode: "insensitive" } },
          { shortBio: { contains: query, mode: "insensitive" } },
        ],
        isActive: true,
      },
      select: {
        id: true, slug: true, name: true, role: true, image: true,
        shortBio: true, bio: true, isFeatured: true,
      },
      take: maxPerCategory,
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
    }),

    // ── Projects ────────────────────────────────────────────────────
    prisma.project.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { client: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
        ],
        isPublished: true,
      },
      select: {
        id: true, slug: true, title: true, client: true,
        image: true, category: true, description: true,
      },
      take: maxPerCategory,
      orderBy: { sortOrder: "asc" },
    }),

    // ── Blog Posts ───────────────────────────────────────────────────
    prisma.blogPost.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { seoTitle: { contains: query, mode: "insensitive" } },
          { seoDesc: { contains: query, mode: "insensitive" } },
          { slug: { contains: query, mode: "insensitive" } },
        ],
        status: "published",
        publishedAt: { not: null },
      },
      select: {
        id: true, slug: true, title: true, seoTitle: true, seoDesc: true,
        publishedAt: true, authorId: true,
      },
      take: maxPerCategory,
      orderBy: { publishedAt: "desc" },
    }),

    // ── Courses ──────────────────────────────────────────────────────
    prisma.course.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { titleVi: { contains: query, mode: "insensitive" } },
          { titleEn: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { descriptionVi: { contains: query, mode: "insensitive" } },
        ],
        status: "published",
      },
      select: {
        id: true, title: true, titleVi: true, titleEn: true,
        description: true, descriptionVi: true,
        price: true, thumbnail: true,
      },
      take: maxPerCategory,
      orderBy: { createdAt: "desc" },
    }),

    // ── FAQs ─────────────────────────────────────────────────────────
    prisma.faq.findMany({
      where: {
        OR: [
          { question: { contains: query, mode: "insensitive" } },
          { answer: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
        ],
        isActive: true,
      },
      select: {
        id: true, question: true, answer: true, category: true,
      },
      take: maxPerCategory,
      orderBy: { sortOrder: "asc" },
    }),

    // ── Testimonials ─────────────────────────────────────────────────
    prisma.testimonial.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { company: { contains: query, mode: "insensitive" } },
          { text: { contains: query, mode: "insensitive" } },
          { role: { contains: query, mode: "insensitive" } },
        ],
        isActive: true,
      },
      select: {
        id: true, name: true, company: true, role: true, text: true, rating: true,
      },
      take: maxPerCategory,
      orderBy: { sortOrder: "asc" },
    }),

    // ── Instructors ─────────────────────────────────────────────────
    prisma.instructor.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { bio: { contains: query, mode: "insensitive" } },
          { bioEn: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true, name: true, bio: true, bioEn: true,
        specialties: true, avatar: true,
      },
      take: maxPerCategory,
      orderBy: { createdAt: "desc" },
    }),

    // ── Expertises ──────────────────────────────────────────────────
    prisma.expertise.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
          { categoryEn: { contains: query, mode: "insensitive" } },
        ],
        isActive: true,
      },
      select: {
        id: true, name: true, category: true, categoryEn: true, icon: true,
      },
      take: maxPerCategory,
      orderBy: { sortOrder: "asc" },
    }),

    // ── Web Templates ────────────────────────────────────────────────
    prisma.webTemplate.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { nameVi: { contains: query, mode: "insensitive" } },
          { descriptionVi: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
          { categoryVi: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true, slug: true, name: true, nameVi: true,
        descriptionVi: true, category: true, categoryVi: true, thumbnail: true,
      },
      take: maxPerCategory,
      orderBy: { sortOrder: "asc" },
    }),

    // ── Landing Pages ───────────────────────────────────────────────
    prisma.landingPage.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { slug: { contains: query, mode: "insensitive" } },
          { seoTitle: { contains: query, mode: "insensitive" } },
          { seoKeywords: { contains: query, mode: "insensitive" } },
        ],
        isPublished: true,
      },
      select: {
        id: true, slug: true, name: true, seoTitle: true, seoDesc: true,
      },
      take: maxPerCategory,
    }),

    // ── Pricing Packages ────────────────────────────────────────────
    prisma.pricingWebPackage.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { nameVi: { contains: query, mode: "insensitive" } },
          { tagline: { contains: query, mode: "insensitive" } },
          { taglineVi: { contains: query, mode: "insensitive" } },
        ],
        isActive: true,
      },
      select: {
        id: true, slug: true, name: true, nameVi: true,
        tagline: true, taglineVi: true, price: true, period: true,
      },
      take: maxPerCategory,
      orderBy: { sortOrder: "asc" },
    }),

    // ── Addon Services ──────────────────────────────────────────────
    prisma.addonService.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { nameVi: { contains: query, mode: "insensitive" } },
          { nameEn: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { descriptionVi: { contains: query, mode: "insensitive" } },
        ],
        isActive: true,
      },
      select: {
        id: true, slug: true, name: true, nameVi: true, nameEn: true,
        description: true, descriptionVi: true,
      },
      take: maxPerCategory,
      orderBy: { sortOrder: "asc" },
    }),

    // ── Social Posts (published) ─────────────────────────────────────
    prisma.socialPost.findMany({
      where: {
        OR: [
          { content: { contains: query, mode: "insensitive" } },
        ],
        status: "published",
      },
      select: {
        id: true, platform: true, content: true, publishedAt: true, postUrl: true,
      },
      take: maxPerCategory,
      orderBy: { publishedAt: "desc" },
    }),
  ]);

  // Map author names for blog posts
  const authorIds = blogPosts.map(p => p.authorId).filter(Boolean);
  const authors = await prisma.teamMember.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, name: true },
  });
  const authorMap: Record<string, string> = {};
  for (const a of authors) { authorMap[a.id] = a.name; }

  return {
    services: services
      .map((s) => ({
        id: s.id, slug: s.slug, title: s.title,
        description: s.shortDescription ?? "",
        icon: s.icon,
        category: svcCategoryMap[s.category] ?? s.category,
        price: s.startingPrice ? String(s.startingPrice) : null,
        deliveryTime: s.deliveryTime,
        href: `/${locale}/services/${s.slug}`,
        score: scoreItem(query, s.title, s.shortDescription, "services"),
      }))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),

    team: teamMembers
      .map((m) => ({
        id: m.id, slug: m.slug, name: m.name, role: m.role,
        image: m.image,
        description: m.shortBio || m.bio,
        href: `/${locale}/team/${m.slug}`,
        score: scoreItem(query, m.name, m.bio ?? m.shortBio, "team"),
      }))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),

    projects: projects
      .map((p) => ({
        id: p.id, slug: p.slug, title: p.title,
        client: p.client, image: p.image,
        category: svcCategoryMap[p.category] ?? p.category,
        href: `/${locale}/portfolio/${p.slug}`,
        score: scoreItem(query, p.title, p.description, "projects"),
      }))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),

    blog: blogPosts
      .map((p) => ({
        id: p.id, slug: p.slug, title: p.title,
        excerpt: p.seoDesc ?? null,
        author: authorMap[p.authorId] ?? null,
        category: "blog",
        publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
        href: `/${locale}/blog/${p.slug}`,
        score: scoreItem(query, p.title, p.seoDesc, "blog", p.publishedAt),
      }))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),

    courses: courses
      .map((c) => {
        const title = locale === "vi" ? (c.titleVi ?? c.title) : (c.titleEn ?? c.title);
        const desc = locale === "vi" ? (c.descriptionVi ?? c.description) : c.description;
        return {
          id: c.id, title,
          description: desc ?? null,
          instructor: null,
          price: c.price ? String(c.price) : null,
          image: c.thumbnail ?? null,
          href: `/${locale}/academy`,
          score: scoreItem(query, title, desc, "courses"),
        };
      })
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),

    faqs: faqs
      .map((f) => ({
        id: f.id,
        question: f.question,
        answer: f.answer.length > 120 ? f.answer.substring(0, 120) + "..." : f.answer,
        category: faqCategoryMap[f.category] ?? f.category,
        href: `/${locale}/faq`,
        score: scoreItem(query, f.question, f.answer, "faqs"),
      }))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),

    testimonials: testimonials
      .map((t) => ({
        id: t.id, name: t.name, company: t.company, role: t.role,
        text: t.text.length > 100 ? t.text.substring(0, 100) + "..." : t.text,
        rating: t.rating,
        href: `/${locale}/#testimonials`,
        score: scoreItem(query, t.name, t.text, "testimonials"),
      }))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),

    instructors: instructors
      .map((i) => ({
        id: i.id, name: i.name,
        bio: i.bio ?? i.bioEn ?? null,
        specialties: i.specialties ?? [],
        avatar: i.avatar ?? null,
        href: `/${locale}/academy`,
        score: scoreItem(query, i.name, i.bio ?? null, "instructors"),
      }))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),

    expertises: expertises
      .map((e) => {
        const cat = locale === "vi" ? e.category : (e.categoryEn ?? e.category);
        return {
          id: e.id, name: e.name, category: cat,
          icon: e.icon ?? null,
          href: `/${locale}/team`,
          score: scoreItem(query, e.name, null, "expertises"),
        };
      })
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),

    webTemplates: webTemplates
      .map((t) => {
        const name = locale === "vi" ? (t.nameVi ?? t.name) : t.name;
        const desc = locale === "vi" ? t.descriptionVi : null;
        return {
          id: t.id, slug: t.slug, name,
          description: desc ?? null,
          category: locale === "vi" ? (t.categoryVi ?? t.category) : t.category,
          thumbnail: t.thumbnail ?? null,
          href: `/${locale}/booking`,
          score: scoreItem(query, name, desc, "webTemplates"),
        };
      })
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),

    landingPages: landingPages
      .map((l) => ({
        id: l.id, slug: l.slug, name: l.name,
        seoTitle: l.seoTitle ?? null, seoDesc: l.seoDesc ?? null,
        href: `/${locale}/${l.slug}`,
        score: scoreItem(query, l.name, l.seoTitle ?? l.seoDesc, "landingPages"),
      }))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),

    pricingPackages: pricingPackages
      .map((p) => {
        const name = locale === "vi" ? (p.nameVi ?? p.name) : p.name;
        const tagline = locale === "vi" ? (p.taglineVi ?? p.tagline) : p.tagline;
        return {
          id: p.id, slug: p.slug, name, tagline,
          price: p.price,
          period: p.period,
          href: `/${locale}/booking`,
          score: scoreItem(query, name, tagline, "pricingPackages"),
        };
      })
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),

    addonServices: addonServices
      .map((a) => ({
        id: a.id, slug: a.slug,
        name: a.name,
        nameVi: a.nameVi ?? null,
        nameEn: a.nameEn ?? null,
        description: locale === "vi" ? (a.descriptionVi ?? a.description) : a.description,
        href: `/${locale}/booking`,
        score: scoreItem(query, a.name, a.description, "addonServices"),
      }))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),

    total: services.length + teamMembers.length + projects.length +
           blogPosts.length + courses.length + faqs.length +
           testimonials.length + instructors.length + expertises.length +
           webTemplates.length + landingPages.length + pricingPackages.length +
           addonServices.length,
    totalHits: services.length + teamMembers.length + projects.length +
               blogPosts.length + courses.length + faqs.length +
               testimonials.length + instructors.length + expertises.length +
               webTemplates.length + landingPages.length + pricingPackages.length +
               addonServices.length,
  };
}