"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { DS, GRD } from "@/lib/design-tokens";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

type ProjectRecord = Record<string, unknown>;

export function ProjectDetailClient({
  locale, project, tNav, tCta: _tCta,
}: {
  locale: string;
  project: ProjectRecord;
  tNav: Record<string, string>;
  tCta: Record<string, string>;
}) {
  const title = (project.title as string) ?? "Dự án";
  const category = (project.category as string) ?? "";
  const description = (project.description as string) ?? "";
  const client = (project.client as string) ?? "";
  const year = (project.year as string | number) ? String(project.year) : "";
  const techStack = Array.isArray(project.techStack) ? (project.techStack as string[]) : [];
  const features = Array.isArray(project.features) ? (project.features as string[]) : [];
  const results = (project.results as string) ?? "";
  const screenshots = Array.isArray(project.screenshots) ? (project.screenshots as string[]) : [];
  const challenge = (project.challenge as string) ?? "";
  const solution = (project.solution as string) ?? "";

  return (
    <main style={{ background: DS.bg, minHeight: "100vh" }}>
      {/* Hero */}
      <section style={{ background: "linear-gradient(180deg, rgba(129,140,248,0.06) 0%, transparent 60%)" }}>
        <div className="max-w-6xl mx-auto px-6 py-14">
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13, color: DS.text4 }}>
            <Link href={`/${locale}`} style={{ color: DS.blue, textDecoration: "none", fontFamily: DS.mono }}>{tNav.home}</Link>
            <span style={{ opacity: 0.4 }}>›</span>
            <Link href={`/${locale}/portfolio`} style={{ color: DS.blue, textDecoration: "none", fontFamily: DS.mono }}>{tNav.portfolio}</Link>
            <span style={{ opacity: 0.4 }}>›</span>
            <span style={{ color: DS.text2 }}>{title}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            {category && (
              <span style={{ background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.3)", color: DS.purple, padding: "4px 14px", borderRadius: 9999, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>
                {category.toUpperCase()}
              </span>
            )}
          </div>

          <h1 style={{ fontFamily: DS.heading, fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, color: DS.text, marginBottom: 16, letterSpacing: "0.04em" }}>
            {title}
          </h1>

          <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
            {client && (
              <div>
                <p style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", marginBottom: 3 }}>KHÁCH HÀNG</p>
                <p style={{ color: DS.text2, fontWeight: 700, fontSize: 15 }}>{client}</p>
              </div>
            )}
            {year && (
              <div>
                <p style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", marginBottom: 3 }}>NĂM</p>
                <p style={{ color: DS.text2, fontWeight: 700, fontSize: 15 }}>{year}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Screenshots */}
      {screenshots.length > 0 && (
        <section className="px-6 pb-12">
          <div className="max-w-6xl mx-auto">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: 12 }}>
              {screenshots.map((shot, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{ borderRadius: 14, overflow: "hidden", background: "#111827", minHeight: 240, border: `1px solid ${DS.border}` }}
                >
                  <img src={shot} alt={`Screenshot ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", minHeight: 240 }} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="max-w-6xl mx-auto px-6 pb-20">
        {/* Challenge / Solution / Results */}
        {(challenge || solution || results) && (
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 36 }}>
            {challenge && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                style={{ background: DS.bgCard, border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16, padding: 24 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 4, height: 16, background: "#EF4444", borderRadius: 2 }} />
                  <span style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em" }}>THÁCH THỨC</span>
                </div>
                <p style={{ color: DS.text2, fontSize: 14, lineHeight: 1.7 }}>{challenge}</p>
              </motion.div>
            )}
            {solution && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{ background: DS.bgCard, border: "1px solid rgba(59,130,246,0.2)", borderRadius: 16, padding: 24 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 4, height: 16, background: DS.blue, borderRadius: 2 }} />
                  <span style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em" }}>GIẢI PHÁP</span>
                </div>
                <p style={{ color: DS.text2, fontSize: 14, lineHeight: 1.7 }}>{solution}</p>
              </motion.div>
            )}
            {results && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                style={{ background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.2)", borderRadius: 16, padding: 24 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 4, height: 16, background: DS.cyan, borderRadius: 2 }} />
                  <span style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.15em" }}>KẾT QUẢ</span>
                </div>
                <p style={{ color: DS.cyan, fontSize: 14, lineHeight: 1.7 }}>{results}</p>
              </motion.div>
            )}
          </section>
        )}

        {/* Description */}
        {description && (
          <section style={{ marginBottom: 36 }}>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 28 }}
            >
              <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, marginBottom: 14 }}>
                Tổng quan dự án
              </h2>
              <p style={{ color: DS.text3, fontSize: 15, lineHeight: 1.9 }}>{description}</p>
            </motion.div>
          </section>
        )}

        {/* Features */}
        {features.length > 0 && (
          <section style={{ marginBottom: 36 }}>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 28 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <div style={{ width: 4, height: 20, background: GRD.primary, borderRadius: 2 }} />
                <h2 style={{ fontFamily: DS.heading, fontSize: 18, fontWeight: 800, color: DS.text }}>Tính năng nổi bật</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {features.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <Check size={15} style={{ color: DS.cyan, flexShrink: 0 }} />
                    <span style={{ color: DS.text2, fontSize: 14 }}>{f}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </section>
        )}

        {/* Tech Stack */}
        {techStack.length > 0 && (
          <section style={{ marginBottom: 36 }}>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 28 }}
            >
              <h2 style={{ fontFamily: DS.heading, fontSize: 18, fontWeight: 800, color: DS.text, marginBottom: 14 }}>Công nghệ sử dụng</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {techStack.map((tech, i) => (
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
          style={{ background: GRD.primary, borderRadius: 20, padding: "36px 32px", marginBottom: 36 }}
        >
          <h2 style={{ fontFamily: DS.heading, fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 8, textAlign: "center" }}>
            Bạn có dự án tương tự?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.7)", textAlign: "center", marginBottom: 24, fontSize: 14 }}>
            LOOP Solutions sẵn sàng đồng hành cùng bạn
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href={`/${locale}/contact`} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 24px", background: "#fff", color: DS.blue, borderRadius: 12, textDecoration: "none", fontWeight: 800, fontSize: 14 }}>
              Báo giá dự án <ArrowRight size={15} />
            </Link>
            <Link href={`/${locale}/services`} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 24px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 12, textDecoration: "none", fontWeight: 600, fontSize: 14 }}>
              Xem dịch vụ
            </Link>
          </div>
        </motion.section>

        {/* Back */}
        <Link href={`/${locale}/portfolio`} style={{ display: "inline-flex", alignItems: "center", gap: 8, color: DS.blue, textDecoration: "none", fontFamily: DS.mono, fontSize: 13, fontWeight: 600 }}>
          <ArrowLeft size={14} /> {tNav.portfolio}
        </Link>
      </div>
    </main>
  );
}
