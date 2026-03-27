"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { DS, GRD } from "@/lib/design-tokens";
import { Check, ArrowRight, ArrowLeft, Clock, Zap, Globe } from "lucide-react";

type ServiceRecord = Record<string, unknown>;

export function ServiceDetailClient({
  locale, service, relatedServices, tNav,
}: {
  locale: string;
  service: ServiceRecord;
  relatedServices: ServiceRecord[];
  tNav: Record<string, string>;
}) {
  const title = (service.title as string) ?? "Dịch vụ";
  const category = (service.category as string) ?? "";
  const shortDesc = (service.shortDescription as string) ?? "";
  const longDesc = (service.longDescription as string) ?? "";
  const startingPrice = (service.startingPrice as string) ?? "";
  const deliveryTime = (service.deliveryTime as string) ?? "";
  const features = Array.isArray(service.features) ? (service.features as string[]) : [];
  const technologies = Array.isArray(service.technologies) ? (service.technologies as string[]) : [];

  return (
    <main style={{ background: DS.bg, minHeight: "100vh" }}>
      {/* Hero */}
      <section style={{ background: "linear-gradient(180deg, rgba(59,130,246,0.06) 0%, transparent 60%)" }}>
        <div className="max-w-6xl mx-auto px-6 py-14">
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13, color: DS.text4 }}>
            <Link href={`/${locale}`} style={{ color: DS.blue, textDecoration: "none", fontFamily: DS.mono }}>{tNav.home}</Link>
            <span style={{ opacity: 0.4 }}>›</span>
            <Link href={`/${locale}/services`} style={{ color: DS.blue, textDecoration: "none", fontFamily: DS.mono }}>{tNav.services}</Link>
            <span style={{ opacity: 0.4 }}>›</span>
            <span style={{ color: DS.text2 }}>{title}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            {category && (
              <span style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", color: DS.blue, padding: "4px 14px", borderRadius: 9999, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>
                {category.toUpperCase()}
              </span>
            )}
          </div>

          <h1 style={{ fontFamily: DS.heading, fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, color: DS.text, marginBottom: 14, letterSpacing: "0.04em" }}>
            {title}
          </h1>
          {shortDesc && (
            <p style={{ color: DS.text3, fontSize: 17, lineHeight: 1.8, maxWidth: 640, marginBottom: 24 }}>
              {shortDesc}
            </p>
          )}

          {/* Stats */}
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            {startingPrice && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Zap size={13} style={{ color: DS.amber }} />
                  <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em" }}>TỪ</span>
                </div>
                <p style={{ color: DS.amber, fontSize: 20, fontWeight: 800, fontFamily: DS.mono }}>{startingPrice}</p>
              </div>
            )}
            {deliveryTime && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Clock size={13} style={{ color: DS.cyan }} />
                  <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em" }}>THỜI GIAN</span>
                </div>
                <p style={{ color: DS.cyan, fontSize: 20, fontWeight: 800, fontFamily: DS.mono }}>{deliveryTime}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 pb-20">
        {/* Long description */}
        {longDesc && (
          <section style={{ marginBottom: 40 }}>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 20, padding: 32 }}
            >
              <h2 style={{ fontFamily: DS.heading, fontSize: 22, fontWeight: 800, color: DS.text, marginBottom: 16 }}>
                Mô tả chi tiết
              </h2>
              <div style={{ color: DS.text3, fontSize: 15, lineHeight: 1.9 }}>
                {longDesc.split("\n").map((p, i) => p.trim() ? <p key={i} style={{ marginBottom: 12 }}>{p}</p> : null)}
              </div>
            </motion.div>
          </section>
        )}

        {/* Features */}
        {features.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 20, padding: 32 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <div style={{ width: 4, height: 20, background: GRD.primary, borderRadius: 2 }} />
                <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text }}>Tính năng bao gồm</h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
                {features.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.15)", borderRadius: 10, padding: "10px 14px" }}>
                    <Check size={15} style={{ color: DS.cyan, flexShrink: 0, marginTop: 2 }} />
                    <span style={{ color: DS.text2, fontSize: 14, lineHeight: 1.6 }}>{f}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>
        )}

        {/* Technologies */}
        {technologies.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 20, padding: 32 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <Globe size={16} style={{ color: DS.purple }} />
                <h2 style={{ fontFamily: DS.heading, fontSize: 18, fontWeight: 800, color: DS.text }}>Công nghệ sử dụng</h2>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {technologies.map((tech, i) => (
                  <span key={i} style={{ background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.25)", color: DS.purple, padding: "4px 14px", borderRadius: 9999, fontSize: 12, fontFamily: DS.mono, fontWeight: 600 }}>
                    {tech}
                  </span>
                ))}
              </div>
            </motion.div>
          </section>
        )}

        {/* CTA */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{ background: GRD.primary, borderRadius: 20, padding: "40px 32px", textAlign: "center", marginBottom: 40 }}
        >
          <h2 style={{ fontFamily: DS.heading, fontSize: 24, fontWeight: 900, color: "#fff", marginBottom: 10 }}>
            Bắt đầu dự án ngay hôm nay
          </h2>
          <p style={{ color: "rgba(255,255,255,0.75)", marginBottom: 24, fontSize: 15 }}>
            Đội ngũ LOOP tư vấn miễn phí và báo giá trong 24h
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href={`/${locale}/contact`}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", background: "#fff", color: DS.blue, borderRadius: 12, textDecoration: "none", fontWeight: 800, fontSize: 14 }}
            >
              Liên hệ tư vấn <ArrowRight size={16} />
            </Link>
            <Link
              href={`/${locale}/pricing`}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 12, textDecoration: "none", fontWeight: 600, fontSize: 14 }}
            >
              Xem bảng giá
            </Link>
          </div>
        </motion.section>

        {/* Related */}
        {relatedServices.length > 0 && (
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <div style={{ width: 4, height: 20, background: GRD.primary, borderRadius: 2 }} />
              <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text }}>Dịch vụ liên quan</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {relatedServices.map((s) => (
                <Link
                  key={s.id as string}
                  href={`/${locale}/services/${s.slug}`}
                  style={{ display: "block", padding: "16px 20px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 14, textDecoration: "none", color: "inherit", transition: "border-color 0.2s" }}
                >
                  <p style={{ fontWeight: 700, color: DS.text, fontSize: 15, marginBottom: 4 }}>{s.title as string}</p>
                  {(s.shortDescription as string) && (
                    <p style={{ fontSize: 13, color: DS.text4, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {(s.shortDescription as string).slice(0, 100)}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Back */}
        <div style={{ marginTop: 32 }}>
          <Link href={`/${locale}/services`} style={{ display: "inline-flex", alignItems: "center", gap: 8, color: DS.blue, textDecoration: "none", fontFamily: DS.mono, fontSize: 13, fontWeight: 600 }}>
            <ArrowLeft size={14} /> Quay lại danh sách
          </Link>
        </div>
      </div>
    </main>
  );
}
