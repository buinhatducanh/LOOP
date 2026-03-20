"use client";

import Link from "@/i18n/routing/Link";
import Image from "next/image";

// ─── Types ──────────────────────────────────────────────────────

interface Service {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  icon?: string;
  category?: string;
  startingPrice?: number;
  deliveryTime?: string;
}

interface RelatedServicesWidgetProps {
  services?: Service[];
  /** "vi" | "en" */
  locale?: "vi" | "en";
  /** Override title text */
  title?: string;
  /** Max cards to show */
  max?: number;
  className?: string;
}

// ─── Default related services fallback (server-safe, no DB needed) ───────
const DEFAULT_SERVICES: Service[] = [
  { id: "1", slug: "web-design", title: "Web Design", shortDescription: "Professional website design & development", category: "website" },
  { id: "2", slug: "mobile-app", title: "Mobile App", shortDescription: "Native & cross-platform mobile applications", category: "app" },
  { id: "3", slug: "seo-optimization", title: "SEO Optimization", shortDescription: "Search engine optimization & content strategy", category: "marketing" },
  { id: "4", slug: "branding", title: "Branding", shortDescription: "Brand identity & visual design", category: "branding" },
];

// ─── Icon helper (server-safe string icon names) ─────────────────────────
const SERVICE_ICONS: Record<string, string> = {
  website: "🌐",
  app: "📱",
  marketing: "📊",
  branding: "🎨",
  default: "✨",
};

function getServiceEmoji(category?: string) {
  return category ? SERVICE_ICONS[category.toLowerCase()] ?? SERVICE_ICONS.default : SERVICE_ICONS.default;
}

// ─── Component ────────────────────────────────────────────────
export function RelatedServicesWidget({
  services,
  locale = "vi",
  title,
  max = 4,
  className = "",
}: RelatedServicesWidgetProps) {
  const displayServices = (services ?? DEFAULT_SERVICES).slice(0, max);
  const t = locale === "en" ? {
    title: "Services",
    viewAll: "View all services",
    starting: "From",
    delivery: "Delivery",
  } : {
    title: "Dịch vụ liên quan",
    viewAll: "Xem tất cả dịch vụ",
    starting: "Từ",
    delivery: "Bàn giao",
  };

  return (
    <section className={`py-16 ${className}`}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">
            {title ?? t.title}
          </h2>
          <Link
            href="/services"
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {t.viewAll} →
          </Link>
        </div>

        {/* Service Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayServices.map((service) => (
            <Link
              key={service.id}
              href={`/services/${service.slug}`}
              className="group block rounded-xl border border-slate-800 bg-slate-900 p-6 hover:border-indigo-500/50 hover:bg-slate-800/50 transition-all duration-200"
            >
              {/* Icon */}
              <div className="text-3xl mb-4">
                {getServiceEmoji(service.category)}
              </div>

              <h3 className="font-semibold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                {service.title}
              </h3>

              {service.shortDescription && (
                <p className="text-sm text-slate-400 line-clamp-2 mb-3">
                  {service.shortDescription}
                </p>
              )}

              <div className="flex items-center gap-3 text-xs text-slate-500 mt-4 pt-4 border-t border-slate-800">
                {service.startingPrice && (
                  <span>
                    <span className="text-slate-400">{t.starting}: {service.startingPrice.toLocaleString("VND")}
                  </span>
                )}
                {service.deliveryTime && (
                  <span>{t.delivery}: {service.deliveryTime}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Server Component wrapper ─────────────────────────────────────
export async function RelatedServicesServer({
  services,
  ...props
}: Omit<RelatedServicesWidgetProps, "services"> & { services?: Service[] }) {
  // In Server Component, fetch if not provided
  // Falls back to cached services from parent if not passed
  return <RelatedServicesWidget services={services} {...props} />;
}
