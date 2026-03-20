/**
 * Structured Data (JSON-LD) builders for SEO.
 *
 * Each function returns a typed JSON-LD object matching Google's
 * reference schemas: https://developers.google.com/search/docs/appearance/structured-data
 *
 * Usage: <JsonLd data={buildServiceJsonLd(props)} />
 *
 * Bilingual note:
 *   Description fields use the site default locale (vi).
 *   For truly bilingual sites, consider passing a `locale` param
 *   and returning locale-specific descriptions from SiteSettings.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn";

// ─── Base Types ────────────────────────────────────────────────────────────────

type JsonLdContext = "https://schema.org";
type JsonLdType =
  | "Organization"
  | "WebSite"
  | "Service"
  | "CreativeWork"
  | "Article"
  | "Person"
  | "BreadcrumbList"
  | "Product"
  | "Offer"
  | "FAQPage"
  | "LocalBusiness";

interface BaseJsonLd {
  "@context": JsonLdContext;
  "@type": JsonLdType;
}

// ─── Organization (root) ─────────────────────────────────────────────────────

export interface OrganizationJsonLd extends BaseJsonLd {
  "@type": "Organization";
  name: string;
  url: string;
  logo: string;
  description?: string;
  foundingDate?: string;
  numberOfEmployees?: { "@type": "QuantitativeValue"; value: number };
  sameAs?: string[];
  contactPoint?: {
    "@type": "ContactPoint";
    telephone?: string;
    email?: string;
    contactType?: string;
  };
}

export function buildOrganizationJsonLd(): OrganizationJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LOOP",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    // Description should come from SiteSettings in a fully i18n setup.
    // Until that is wired, keep a concise default — crawlers will use it
    // as a fallback when no page-specific description is available.
    description: "LOOP — Professional website and web application design agency based in Vietnam.",
    foundingDate: "2016",
    numberOfEmployees: { "@type": "QuantitativeValue", value: 50 },
    sameAs: [
      "https://facebook.com/loop.vn",
      "https://www.facebook.com/loopcompany",
      "https://www.linkedin.com/company/loop-vn",
      "https://www.youtube.com/@loopvietnam",
    ],
  };
}

// ─── WebSite (root) ───────────────────────────────────────────────────────────

export interface WebSiteJsonLd extends BaseJsonLd {
  "@type": "WebSite";
  name: string;
  url: string;
  potentialAction: {
    "@type": "SearchAction";
    target: { "@type": "EntryPoint"; urlTemplate: string };
    "query-input": string;
  };
}

export function buildWebSiteJsonLd(): WebSiteJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "LOOP",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

export interface ServiceJsonLd extends BaseJsonLd {
  "@type": "Service";
  name: string;
  description: string;
  provider: OrganizationJsonLd;
  areaServed?: string;
  url?: string;
  image?: string;
  offers?: {
    "@type": "Offer";
    price?: string;
    priceCurrency?: string;
    availability?: string;
  };
}

export function buildServiceJsonLd(opts: {
  name: string;
  description: string;
  image?: string;
  price?: string;
  areaServed?: string;
}): ServiceJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    description: opts.description,
    provider: buildOrganizationJsonLd(),
    areaServed: opts.areaServed ?? "Vietnam",
    url: `${SITE_URL}/services`,
    image: opts.image ? `${SITE_URL}${opts.image}` : undefined,
    offers: opts.price
      ? {
          "@type": "Offer",
          price: opts.price,
          priceCurrency: "VND",
          availability: "https://schema.org/InStock",
        }
      : undefined,
  };
}

// ─── CreativeWork (Portfolio) ─────────────────────────────────────────────────

export interface PortfolioJsonLd extends BaseJsonLd {
  "@type": "CreativeWork";
  name: string;
  description: string;
  author: OrganizationJsonLd;
  dateCreated?: string;
  image?: string;
  url?: string;
  genre?: string;
}

export function buildPortfolioJsonLd(opts: {
  name: string;
  description: string;
  image?: string;
  dateCreated?: string;
  genre?: string;
}): PortfolioJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: opts.name,
    description: opts.description,
    author: buildOrganizationJsonLd(),
    dateCreated: opts.dateCreated,
    image: opts.image ? `${SITE_URL}${opts.image}` : undefined,
    url: `${SITE_URL}/portfolio`,
    genre: opts.genre,
  };
}

// ─── Person (Team Member) ─────────────────────────────────────────────────────

export interface TeamMemberJsonLd extends BaseJsonLd {
  "@type": "Person";
  name: string;
  description?: string;
  image?: string;
  url?: string;
  jobTitle?: string;
  worksFor?: OrganizationJsonLd;
  sameAs?: string[];
  alumniOf?: string;
}

export function buildTeamMemberJsonLd(opts: {
  name: string;
  role: string;
  shortBio?: string;
  image?: string;
  slug: string;
  socialLinks?: string[];
}): TeamMemberJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: opts.name,
    description: opts.shortBio,
    jobTitle: opts.role,
    worksFor: buildOrganizationJsonLd(),
    url: `${SITE_URL}/team/${opts.slug}`,
    image: opts.image ? `${SITE_URL}${opts.image}` : undefined,
    sameAs: opts.socialLinks ?? [],
  };
}

// ─── Article (Blog) ───────────────────────────────────────────────────────────

export interface BlogPostJsonLd extends BaseJsonLd {
  "@type": "Article";
  headline: string;
  description?: string;
  image?: string;
  author: { "@type": "Person"; name: string };
  datePublished?: string;
  dateModified?: string;
  publisher: OrganizationJsonLd;
  mainEntityOfPage?: { "@type": "WebPage"; "@id": string };
}

export function buildBlogPostJsonLd(opts: {
  title: string;
  description?: string;
  image?: string;
  authorName: string;
  publishedAt?: string;
  slug: string;
}): BlogPostJsonLd {
  const publishedAt = opts.publishedAt ? new Date(opts.publishedAt).toISOString() : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.title,
    description: opts.description,
    image: opts.image ? `${SITE_URL}${opts.image}` : undefined,
    author: { "@type": "Person", name: opts.authorName },
    datePublished: publishedAt,
    dateModified: publishedAt,
    publisher: buildOrganizationJsonLd(),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${opts.slug}`,
    },
  };
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

export interface FaqJsonLd extends BaseJsonLd {
  "@type": "FAQPage";
  mainEntity: Array<{
    "@type": "Question";
    name: string;
    acceptedAnswer: { "@type": "Answer"; text: string };
  }>;
}

export function buildFaqJsonLd(
  faqs: Array<{ question: string; answer: string }>
): FaqJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

// ─── BreadcrumbList ───────────────────────────────────────────────────────────

export interface BreadcrumbJsonLd extends BaseJsonLd {
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item?: string;
  }>;
}

export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; url?: string }>
): BreadcrumbJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: `${SITE_URL}${item.url}` } : {}),
    })),
  };
}

// ─── Product / Offer (Pricing) ───────────────────────────────────────────────

export interface ProductJsonLd extends BaseJsonLd {
  "@type": "Product";
  name: string;
  description?: string;
  offers: { "@type": "Offer"; price: string; priceCurrency: string; availability: string };
}

export function buildProductJsonLd(opts: {
  name: string;
  description?: string;
  price: string;
  priceCurrency?: string;
}): ProductJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: opts.name,
    description: opts.description,
    offers: {
      "@type": "Offer",
      price: opts.price,
      priceCurrency: opts.priceCurrency ?? "VND",
      availability: "https://schema.org/InStock",
    },
  };
}
