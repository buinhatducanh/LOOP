"use client";

import { useTranslations } from "next-intl";
import {
  Zap, Globe, Shield, Award, Star, Mail, Phone, MapPin,
  ArrowRight, CheckCircle, ChevronRight, Quote,
  Layers, Cog, BarChart2, Code, Palette, Rocket, Users,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// ─── Section Props ──────────────────────────────────────────────────────────────

interface SectionProps {
  content: any;
  styles?: any;
}

// ─── Icon Map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  Zap, Globe, Shield, Award, Star, Mail, Phone, MapPin,
  Layers, Cog, BarChart2, Code, Palette, Rocket, Users,
};

// ─── Hero Section ─────────────────────────────────────────────────────────────

export function HeroSection({ content }: SectionProps) {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-[#030712]">
      {content.backgroundImage && (
        <div className="absolute inset-0 z-0">
          <Image
            src={content.backgroundImage}
            alt="Hero background"
            fill
            priority
            className="object-cover opacity-20"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/70 via-[#030712]/80 to-[#030712]" />
        </div>
      )}

      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 text-center">
        {content.badge && (
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-300 mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
            {content.badge}
          </div>
        )}

        <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6" style={{ letterSpacing: "-0.03em" }}>
          {content.title?.split("\n").map((line: string, i: number) => (
            <span key={i} className={i > 0 ? "block mt-2 bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent" : ""}>
              {line}
            </span>
          ))}
        </h1>

        {content.subtitle && (
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            {content.subtitle}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {content.ctaPrimaryLink && (
            <Link
              href={content.ctaPrimaryLink}
              className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-base shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {content.ctaPrimaryText || "Bắt đầu ngay"}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
          {content.ctaSecondaryLink && (
            <Link
              href={content.ctaSecondaryLink}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-white rounded-xl font-semibold hover:bg-white/10 hover:border-white/20 transition-all"
            >
              {content.ctaSecondaryText || "Tìm hiểu thêm"}
            </Link>
          )}
        </div>

        {content.trustBar && Array.isArray(content.trustBar) && (
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-slate-500 text-sm">
            {content.trustBar.map((item: string, i: number) => (
              <span key={i} className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-500" />
                {item}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Stats Section ─────────────────────────────────────────────────────────────

export function StatsSection({ content }: SectionProps) {
  const stats = content.stats || [];

  return (
    <section className="relative bg-[#030712] border-y border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5">
          {stats.map((stat: any, index: number) => (
            <div
              key={index}
              className="bg-[#030712] px-8 py-10 text-center hover:bg-white/[0.02] transition-colors"
            >
              <div className="text-4xl md:text-5xl font-black text-white mb-2" style={{ letterSpacing: "-0.04em" }}>
                {stat.value}
              </div>
              <div className="text-sm text-slate-400 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features Section ─────────────────────────────────────────────────────────

export function FeaturesSection({ content }: SectionProps) {
  const features = content.features || [];

  return (
    <section className="relative bg-[#030712] py-28">
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 to-transparent" />
      <div className="relative max-w-7xl mx-auto px-6">
        {(content.title || content.subtitle) && (
          <div className="text-center mb-20">
            {content.subtitle && (
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">
                {content.subtitle}
              </span>
            )}
            <h2 className="text-4xl md:text-5xl font-black text-white" style={{ letterSpacing: "-0.03em" }}>
              {content.title}
            </h2>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature: any, index: number) => {
            const IconComponent = feature.icon ? ICON_MAP[feature.icon] : Zap;
            return (
              <div
                key={index}
                className="group relative p-7 rounded-2xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.07] hover:border-indigo-500/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/20 flex items-center justify-center mb-5">
                  {IconComponent && <IconComponent className="w-6 h-6 text-indigo-400" size={24} />}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Services Section ─────────────────────────────────────────────────────────

export function ServicesSection({ content }: SectionProps) {
  const t = useTranslations("Navigation");
  const services: any[] = content.services || [];

  return (
    <section className="relative bg-[#030712] py-28 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">
            {content.subtitle || t("services")}
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white" style={{ letterSpacing: "-0.03em" }}>
            {content.title}
          </h2>
          {content.description && (
            <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">{content.description}</p>
          )}
        </div>

        {services.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service: any) => (
              <div
                key={service.id}
                className="group relative p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-indigo-500/30 transition-all duration-300"
              >
                {service.icon && (
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                    style={{ background: `${service.color || "#6366F1"}20` }}
                  >
                    <span className="text-2xl">{service.icon}</span>
                  </div>
                )}
                <h3 className="text-xl font-bold text-white mb-3">{service.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">{service.shortDescription}</p>
                <div className="flex items-center justify-between">
                  {service.startingPrice ? (
                    <span className="text-sm text-slate-500">
                      Từ <span className="text-emerald-400 font-bold">
                        {new Intl.NumberFormat("vi-VN").format(service.startingPrice)}₫
                      </span>
                    </span>
                  ) : <span />}
                  <Link
                    href={`/services/${service.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Xem chi tiết <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-slate-500">Chưa có dịch vụ nào được chọn.</div>
        )}

        {content.showViewAll && (
          <div className="text-center mt-12">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 px-8 py-4 border border-indigo-500/30 text-indigo-400 rounded-xl font-semibold hover:bg-indigo-500/10 transition-all"
            >
              Xem tất cả dịch vụ <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Portfolio Section ────────────────────────────────────────────────────────

export function PortfolioSection({ content }: SectionProps) {
  const t = useTranslations("Navigation");
  const projects: any[] = content.projects || [];

  return (
    <section className="relative bg-[#030712] py-28 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">
            {content.subtitle || t("portfolio")}
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white" style={{ letterSpacing: "-0.03em" }}>
            {content.title}
          </h2>
          {content.description && (
            <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">{content.description}</p>
          )}
        </div>

        {projects.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project: any) => (
              <div
                key={project.id}
                className="group relative rounded-2xl overflow-hidden border border-white/5 hover:border-indigo-500/30 transition-all duration-300"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={project.image || `https://picsum.photos/800/600?random=${project.id}`}
                    alt={project.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent opacity-80" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  {project.category && (
                    <span className="text-xs font-medium text-indigo-300 uppercase tracking-wider">{project.category}</span>
                  )}
                  <h3 className="text-lg font-bold text-white mt-1">{project.title}</h3>
                  {project.client && <p className="text-sm text-slate-400 mt-1">{project.client}</p>}
                </div>
                <Link href={`/portfolio/${project.slug}`} className="absolute inset-0 z-10" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-slate-500">Chưa có dự án nào được chọn.</div>
        )}

        {content.showViewAll && (
          <div className="text-center mt-12">
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-2 px-8 py-4 border border-indigo-500/30 text-indigo-400 rounded-xl font-semibold hover:bg-indigo-500/10 transition-all"
            >
              Xem tất cả dự án <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Testimonials Section ─────────────────────────────────────────────────────

export function TestimonialsSection({ content }: SectionProps) {
  const testimonials: any[] = content.testimonials || [];

  return (
    <section className="relative bg-[#030712] py-28 border-t border-white/5">
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 via-transparent to-indigo-950/20" />
      <div className="relative max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">
            {content.subtitle || "Khách hàng nói gì"}
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white" style={{ letterSpacing: "-0.03em" }}>
            {content.title}
          </h2>
        </div>

        {testimonials.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((item: any) => (
              <div
                key={item.id}
                className="relative p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all"
              >
                <Quote size={24} className="text-indigo-500/30 mb-4" />
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: item.rating || 5 }).map((_: any, si: number) => (
                    <Star key={si} size={14} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 leading-relaxed mb-6 italic">
                  &ldquo;{item.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  {item.avatar ? (
                    <img src={item.avatar} alt={item.name} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white">
                      {(item.name || "A").charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-white">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.role}{item.company ? ` · ${item.company}` : ""}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-slate-500">Chưa có đánh giá nào được chọn.</div>
        )}
      </div>
    </section>
  );
}

// ─── CTA Section ──────────────────────────────────────────────────────────────

export function CtaSection({ content }: SectionProps) {
  return (
    <section className="relative overflow-hidden bg-[#030712] py-28 border-t border-white/5">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/60 via-[#030712] to-cyan-950/40" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl" />
      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-6xl font-black text-white mb-6" style={{ letterSpacing: "-0.04em" }}>
          {content.title}
        </h2>
        {content.description && (
          <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto">{content.description}</p>
        )}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {content.buttonLink && (
            <Link
              href={content.buttonLink}
              className="group inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-base shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] transition-all"
            >
              {content.buttonText || "Liên hệ ngay"}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
          {content.secondaryLink && (
            <Link
              href={content.secondaryLink}
              className="inline-flex items-center gap-2 px-8 py-4 text-slate-400 hover:text-white transition-colors"
            >
              {content.secondaryText || "Tìm hiểu thêm"}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Contact Section ───────────────────────────────────────────────────────────

export function ContactSection({ content }: SectionProps) {
  const contacts: any[] = content.contacts || [];

  return (
    <section className="relative bg-[#030712] py-28 border-t border-white/5">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">
            {content.subtitle || "Liên hệ"}
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white" style={{ letterSpacing: "-0.03em" }}>
            {content.title}
          </h2>
          {content.description && (
            <p className="mt-4 text-lg text-slate-400">{content.description}</p>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {contacts.length > 0 ? contacts.map((contact: any, i: number) => (
            <div key={i} className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] text-center hover:bg-white/[0.04] transition-all">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 flex items-center justify-center mx-auto mb-5">
                {contact.icon === "mail" && <Mail size={24} className="text-indigo-400" />}
                {contact.icon === "phone" && <Phone size={24} className="text-indigo-400" />}
                {contact.icon === "map" && <MapPin size={24} className="text-indigo-400" />}
                {!contact.icon && <MapPin size={24} className="text-indigo-400" />}
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">{contact.label}</h3>
              <p className="text-lg font-semibold text-white">{contact.value}</p>
              {contact.note && <p className="text-xs text-slate-500 mt-1">{contact.note}</p>}
            </div>
          )) : (
            <>
              {[
                { icon: "mail", label: "Email", value: "hello@loop.vn" },
                { icon: "phone", label: "Điện thoại", value: "+84 888 123 456" },
                { icon: "map", label: "Địa chỉ", value: "TP. Hồ Chí Minh" },
              ].map((c, i) => (
                <div key={i} className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] text-center hover:bg-white/[0.04] transition-all">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 flex items-center justify-center mx-auto mb-5">
                    {c.icon === "mail" && <Mail size={24} className="text-indigo-400" />}
                    {c.icon === "phone" && <Phone size={24} className="text-indigo-400" />}
                    {c.icon === "map" && <MapPin size={24} className="text-indigo-400" />}
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">{c.label}</h3>
                  <p className="text-lg font-semibold text-white">{c.value}</p>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Custom HTML Section ─────────────────────────────────────────────────────

export function CustomSection({ content }: SectionProps) {
  return (
    <section className="bg-[#030712] py-12 border-t border-white/5">
      <div
        className="max-w-5xl mx-auto px-6"
        dangerouslySetInnerHTML={{ __html: content.htmlContent || "" }}
      />
    </section>
  );
}

// ─── Section Renderer ────────────────────────────────────────────────────────

export function SectionRenderer({ type, content, styles }: { type: string; content: any; styles?: any }) {
  switch (type) {
    case "hero":          return <HeroSection content={content} styles={styles} />;
    case "stats":         return <StatsSection content={content} styles={styles} />;
    case "features":      return <FeaturesSection content={content} styles={styles} />;
    case "services":      return <ServicesSection content={content} styles={styles} />;
    case "portfolio":     return <PortfolioSection content={content} styles={styles} />;
    case "testimonials":  return <TestimonialsSection content={content} styles={styles} />;
    case "cta":           return <CtaSection content={content} styles={styles} />;
    case "contact":       return <ContactSection content={content} styles={styles} />;
    case "custom":        return <CustomSection content={content} styles={styles} />;
    default:
      return (
        <div className="py-20 bg-[#030712]">
          <div className="max-w-7xl mx-auto px-6 text-center text-slate-500 text-sm">
            Unknown section: <code>{type}</code>
          </div>
        </div>
      );
  }
}
