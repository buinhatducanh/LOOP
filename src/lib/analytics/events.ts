/**
 * Analytics event helpers for client-side tracking.
 *
 * Usage:
 *   import { trackPageView, trackServiceViewed, trackCtaClick } from "@/lib/analytics/events";
 *
 *   // Page view
 *   trackPageView("/services/seo", "SEO Optimization", { locale: "vi" });
 *
 *   // CTA click
 *   trackCtaClick("hero-cta", "/contact?service=seo");
 *
 *   // Pricing view
 *   trackPricingViewed("web-package-pro", 2990000, { locale: "vi" });
 *
 * These helpers send to both GA4 (window.gtag) and the server-side /api/analytics/track pipeline.
 */

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface TrackOptions {
  /** Locale for context (used in server event) */
  locale?: string;
  /** Anonymous session ID (stored in localStorage) */
  sessionId?: string;
}

/* ─── Core send helper ─────────────────────────────────────────────── */

function sendToServer(event: string, properties?: Record<string, string | number | boolean | null>, options?: TrackOptions) {
  if (typeof window === "undefined") return; // server-side guard

  const body: Record<string, unknown> = { event, properties: properties ?? {} };
  if (options?.sessionId) body.sessionId = options.sessionId;

  fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    // fire-and-forget — don't await
  }).catch(() => {
    // silently swallow — analytics must never break user experience
  });
}

function sendToGA4(event: string, params?: Record<string, string | number>) {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== "function") return;
  gtag("event", event, params);
}

/* ─── Page Views ─────────────────────────────────────────────────────── */

export function trackPageView(
  path: string,
  title: string,
  options?: TrackOptions
) {
  sendToGA4("page_view", { page_path: path, page_title: title });
  sendToServer("page_view", { path, title }, options);
}

export function trackServiceViewed(
  serviceSlug: string,
  serviceTitle: string,
  options?: TrackOptions
) {
  sendToGA4("service_viewed", { service_slug: serviceSlug, service_title: serviceTitle });
  sendToServer("service_viewed", { serviceSlug, serviceTitle }, options);
}

export function trackPricingViewed(
  planSlug: string,
  price: number,
  options?: TrackOptions
) {
  sendToGA4("pricing_viewed", { plan_slug: planSlug, price });
  sendToServer("pricing_viewed", { planSlug, price }, options);
}

export function trackBlogPostViewed(
  slug: string,
  title: string,
  authorName: string,
  options?: TrackOptions
) {
  sendToGA4("blog_post_viewed", { slug, title, author_name: authorName });
  sendToServer("blog_post_viewed", { slug, title, authorName }, options);
}

/* ─── CTAs & Links ──────────────────────────────────────────────────── */

export function trackCtaClick(
  ctaName: string,
  destination: string,
  options?: TrackOptions
) {
  sendToGA4("cta_click", { cta_name: ctaName, destination });
  sendToServer("cta_click", { ctaName, destination }, options);
}

export function trackDemoClicked(
  serviceSlug: string,
  options?: TrackOptions
) {
  sendToGA4("demo_clicked", { service_slug: serviceSlug });
  sendToServer("demo_clicked", { serviceSlug }, options);
}

export function trackOutboundLink(
  url: string,
  linkText: string,
  options?: TrackOptions
) {
  sendToGA4("outbound_link_click", { url, link_text: linkText });
  sendToServer("outbound_link_click", { url, linkText }, options);
}

/* ─── Forms ────────────────────────────────────────────────────────── */

export function trackFormSubmission(
  formName: string,
  service?: string,
  options?: TrackOptions
) {
  sendToGA4("form_submission", { form_name: formName, service_interested: service ?? "" });
  sendToServer("form_submission", { formName, service: service ?? null }, options);
}

export function trackQuoteRequest(
  planSlug: string,
  selectedFeatures: number,
  totalPrice: number,
  options?: TrackOptions
) {
  sendToGA4("quote_request", {
    plan_slug: planSlug,
    selected_features: selectedFeatures,
    total_price: totalPrice,
  });
  sendToServer("quote_request", { planSlug, selectedFeatures, totalPrice }, options);
}

/* ─── Navigation ──────────────────────────────────────────────────── */

export function trackLanguageSwitch(
  fromLang: string,
  toLang: string,
  options?: TrackOptions
) {
  sendToGA4("language_switch", { from_language: fromLang, to_language: toLang });
  sendToServer("language_switch", { fromLang, toLang }, options);
}

export function trackSearchQuery(
  query: string,
  resultCount: number,
  options?: TrackOptions
) {
  sendToGA4("search_query", { query, result_count: resultCount });
  sendToServer("search_query", { query, resultCount }, options);
}

/* ─── Session ID helper ────────────────────────────────────────────── */

const SESSION_KEY = "loop_analytics_sid";

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  const stored = localStorage.getItem(SESSION_KEY);
  if (stored) return stored;
  const id = crypto.randomUUID();
  localStorage.setItem(SESSION_KEY, id);
  return id;
}
