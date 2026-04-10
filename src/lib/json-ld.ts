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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.loops.vn";

// ─── Base Types ────────────────────────────────────────────────────────────────

type JsonLdContext = "https://schema.org";

interface BaseJsonLd {
  "@context": JsonLdContext;
  "@type": string;
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

// ─── HowTo (Blog posts with step-by-step guides) ────────────────────────────

export interface HowToJsonLd extends BaseJsonLd {
  "@type": "HowTo";
  name: string;
  description?: string;
  image?: string;
  step: Array<{
    "@type": "HowToStep";
    name: string;
    text: string;
    image?: string;
  }>;
  totalTime?: string; // ISO 8601 duration e.g. "PT30M"
}

export function buildHowToJsonLd(opts: {
  title: string;
  description?: string;
  image?: string;
  steps: Array<{ name: string; description: string; image?: string }>;
  totalTime?: string;
}): HowToJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: opts.title,
    description: opts.description,
    image: opts.image ? `${SITE_URL}${opts.image}` : undefined,
    totalTime: opts.totalTime,
    step: opts.steps.map((s) => ({
      "@type": "HowToStep",
      name: s.name,
      text: s.description,
      ...(s.image ? { image: `${SITE_URL}${s.image}` } : {}),
    })),
  };
}

// ─── VideoObject (Tutorial/demo videos on blog) ─────────────────────────────

export interface VideoJsonLd extends BaseJsonLd {
  "@type": "VideoObject";
  name: string;
  description?: string;
  thumbnailUrl?: string;
  uploadDate?: string;
  duration?: string; // ISO 8601 duration e.g. "PT5M30S"
  contentUrl?: string;
  embedUrl?: string;
  author?: { "@type": "Person"; name: string };
}

export function buildVideoJsonLd(opts: {
  title: string;
  description?: string;
  thumbnailUrl?: string;
  uploadDate?: string;
  duration?: string;
  contentUrl?: string;
  embedUrl?: string;
  authorName?: string;
}): VideoJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: opts.title,
    description: opts.description,
    thumbnailUrl: opts.thumbnailUrl,
    uploadDate: opts.uploadDate ? new Date(opts.uploadDate).toISOString() : undefined,
    duration: opts.duration,
    contentUrl: opts.contentUrl ? `${SITE_URL}${opts.contentUrl}` : undefined,
    embedUrl: opts.embedUrl ? `${SITE_URL}${opts.embedUrl}` : undefined,
    ...(opts.authorName ? { author: { "@type": "Person", name: opts.authorName } } : {}),
  };
}

// ─── Review / AggregateRating (Service + Product reviews) ──────────────────

export interface ReviewJsonLd extends BaseJsonLd {
  "@type": "Review";
  reviewRating: {
    "@type": "Rating";
    ratingValue: string;
    bestRating?: string;
    worstRating?: string;
  };
  author: { "@type": "Person" | "Organization"; name: string };
  reviewBody?: string;
  itemReviewed?: { "@type": string; name: string };
}

export interface AggregateRatingJsonLd extends BaseJsonLd {
  "@type": "AggregateRating";
  ratingValue: string;
  reviewCount: string;
  bestRating?: string;
  worstRating?: string;
  itemReviewed?: { "@type": string; name: string };
}

export function buildReviewJsonLd(opts: {
  reviewerName: string;
  rating: number;
  bestRating?: number;
  reviewBody?: string;
  itemName?: string;
  itemType?: string;
}): ReviewJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    reviewRating: {
      "@type": "Rating",
      ratingValue: String(opts.rating),
      bestRating: opts.bestRating ? String(opts.bestRating) : "5",
      worstRating: "1",
    },
    author: { "@type": "Person", name: opts.reviewerName },
    reviewBody: opts.reviewBody,
    ...(opts.itemName
      ? { itemReviewed: { "@type": opts.itemType ?? "Service", name: opts.itemName } }
      : {}),
  };
}

export function buildAggregateRatingJsonLd(opts: {
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  itemName?: string;
  itemType?: string;
}): AggregateRatingJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    ratingValue: String(opts.ratingValue),
    reviewCount: String(opts.reviewCount),
    bestRating: opts.bestRating ? String(opts.bestRating) : "5",
    worstRating: "1",
    ...(opts.itemName
      ? { itemReviewed: { "@type": opts.itemType ?? "Service", name: opts.itemName } }
      : {}),
  };
}

// ─── QAPage (Forum / Discussion style Q&A) ──────────────────────────────────

export interface QaPageJsonLd extends BaseJsonLd {
  "@type": "QAPage";
  mainEntity: {
    "@type": "Question";
    name: string;
    text: string;
    author: { "@type": "Person"; name: string };
    dateCreated?: string;
    answerCount?: number;
    acceptedAnswer?: {
      "@type": "Answer";
      text: string;
      author: { "@type": "Person"; name: string };
      dateCreated?: string;
    };
  };
}

export function buildQaPageJsonLd(opts: {
  questionName: string;
  questionText: string;
  authorName: string;
  dateCreated?: string;
  answerCount?: number;
  acceptedAnswer?: {
    answerText: string;
    authorName: string;
    dateCreated?: string;
  };
}): QaPageJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: opts.questionName,
      text: opts.questionText,
      author: { "@type": "Person", name: opts.authorName },
      dateCreated: opts.dateCreated ? new Date(opts.dateCreated).toISOString() : undefined,
      answerCount: opts.answerCount,
      ...(opts.acceptedAnswer
        ? {
            acceptedAnswer: {
              "@type": "Answer",
              text: opts.acceptedAnswer.answerText,
              author: { "@type": "Person", name: opts.acceptedAnswer.authorName },
              dateCreated: opts.acceptedAnswer.dateCreated
                ? new Date(opts.acceptedAnswer.dateCreated).toISOString()
                : undefined,
            },
          }
        : {}),
    },
  };
}

// ─── Event (Webinar/workshop announcements) ─────────────────────────────────

export interface EventJsonLd extends BaseJsonLd {
  "@type": "Event";
  name: string;
  description?: string;
  startDate: string; // ISO 8601
  endDate?: string;
  eventStatus: string; // https://schema.org/EventStatusType
  eventAttendanceMode: string; // https://schema.org/EventAttendanceModeEnumeration
  location?: {
    "@type": "Place";
    name?: string;
    address?: string;
  };
  organizer?: {
    "@type": "Organization";
    name: string;
    url?: string;
  };
  image?: string;
  url?: string;
  offers?: {
    "@type": "Offer";
    price?: string;
    priceCurrency?: string;
    availability?: string;
    url?: string;
  };
}

export function buildEventJsonLd(opts: {
  name: string;
  description?: string;
  startDate: string; // ISO string or parseable date
  endDate?: string;
  isOnline?: boolean;
  locationName?: string;
  locationAddress?: string;
  organizerName?: string;
  organizerUrl?: string;
  image?: string;
  url?: string;
  price?: number;
  currency?: string;
  registrationUrl?: string;
}): EventJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: opts.name,
    description: opts.description,
    startDate: new Date(opts.startDate).toISOString(),
    endDate: opts.endDate ? new Date(opts.endDate).toISOString() : undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: opts.isOnline
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    ...(opts.locationName || opts.locationAddress
      ? {
          location: {
            "@type": "Place",
            name: opts.locationName,
            address: opts.locationAddress,
          },
        }
      : {}),
    ...(opts.organizerName
      ? {
          organizer: {
            "@type": "Organization",
            name: opts.organizerName,
            url: opts.organizerUrl ? `${SITE_URL}${opts.organizerUrl}` : SITE_URL,
          },
        }
      : {}),
    image: opts.image ? `${SITE_URL}${opts.image}` : undefined,
    url: opts.url ? `${SITE_URL}${opts.url}` : undefined,
    ...(opts.price !== undefined
      ? {
          offers: {
            "@type": "Offer",
            price: String(opts.price),
            priceCurrency: opts.currency ?? "VND",
            availability: "https://schema.org/InStock",
            url: opts.registrationUrl ? `${SITE_URL}${opts.registrationUrl}` : undefined,
          },
        }
      : {}),
  };
}

// ─── LocalBusiness (Office location) ───────────────────────────────────────

export interface LocalBusinessJsonLd extends BaseJsonLd {
  "@type": string; // e.g. "ProfessionalService"
  name: string;
  description?: string;
  url?: string;
  logo?: string;
  image?: string;
  telephone?: string;
  email?: string;
  address?: {
    "@type": "PostalAddress";
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  geo?: {
    "@type": "GeoCoordinates";
    latitude: number;
    longitude: number;
  };
  openingHoursSpecification?: Array<{
    "@type": "OpeningHoursSpecification";
    dayOfWeek: string | string[];
    opens: string;
    closes: string;
  }>;
  priceRange?: string;
  aggregateRating?: {
    "@type": "AggregateRating";
    ratingValue: string;
    reviewCount: string;
  };
}

export function buildLocalBusinessJsonLd(opts: {
  name?: string;
  description?: string;
  streetAddress?: string;
  locality?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  openingHours?: Array<{ day: string; open: string; close: string }>;
  priceRange?: string;
  ratingValue?: number;
  reviewCount?: number;
}): LocalBusinessJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: opts.name ?? "LOOP",
    description: opts.description,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    image: `${SITE_URL}/og-image.svg`,
    telephone: opts.phone,
    email: opts.email,
    ...(opts.streetAddress || opts.locality
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: opts.streetAddress,
            addressLocality: opts.locality,
            addressRegion: opts.region,
            postalCode: opts.postalCode,
            addressCountry: opts.country ?? "VN",
          },
        }
      : {}),
    ...(opts.latitude !== undefined && opts.longitude !== undefined
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: opts.latitude,
            longitude: opts.longitude,
          },
        }
      : {}),
    ...(opts.openingHours
      ? {
          openingHoursSpecification: opts.openingHours.map((h) => ({
            "@type": "OpeningHoursSpecification",
            dayOfWeek: h.day,
            opens: h.open,
            closes: h.close,
          })),
        }
      : {}),
    priceRange: opts.priceRange,
    ...(opts.ratingValue !== undefined
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: String(opts.ratingValue),
            reviewCount: String(opts.reviewCount ?? 0),
          },
        }
      : {}),
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
