"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { DS, GRD } from "@/lib/design-tokens";
import { ArrowRight } from "lucide-react";

type ProjectRecord = Record<string, unknown>;

export function PortfolioClient({ locale, projects }: { locale: string; projects: ProjectRecord[] }) {
  const categories = useMemo(() => {
    const set = new Set<string>(["Tất cả"]);
    for (const p of projects) {
      const c = typeof p.category === "string" ? p.category : "Khác";
      set.add(c);
    }
    return Array.from(set);
  }, [projects]);

  const [active, setActive] = useState("Tất cả");

  const filtered = useMemo(() => {
    if (active === "Tất cả") return projects;
    return projects.filter((p) => (p.category as string) === active);
  }, [projects, active]);

  return (
    <main style={{ background: DS.bg, minHeight: "100vh" }}>
      <section className="py-20 px-6 text-center" style={{ background: "linear-gradient(180deg, rgba(129,140,248,0.07) 0%, transparent 100%)" }}>
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full" style={{ background: "rgba(129,140,248,0.08)", border: "1px solid rgba(129,140,248,0.2)" }}>
            <span style={{ color: DS.purple, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.22em" }}>PORTFOLIO & DỰ ÁN</span>
          </div>
          <h1 style={{ fontFamily: DS.heading, fontSize: 40, fontWeight: 900, letterSpacing: "0.06em", background: "linear-gradient(135deg, #FFFFFF, #94A3B8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 14 }}>
            DỰ ÁN ĐÃ THỰC HIỆN
          </h1>
          <p style={{ color: DS.text3, fontSize: 15, lineHeight: 1.8 }}>
            120+ dự án thành công. Từ startup nhỏ đến enterprise lớn — mỗi dự án đều là một câu chuyện tăng trưởng.
          </p>
        </div>
      </section>

      <div className="flex justify-center gap-3 pb-10 flex-wrap px-6">
        {categories.map((cat) => {
          const isActive = active === cat;
          return (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              style={{
                padding: "8px 20px",
                borderRadius: 30,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                background: isActive ? GRD.primary : "transparent",
                border: isActive ? "none" : `1px solid ${DS.border}`,
                color: isActive ? "#fff" : DS.text3,
                boxShadow: isActive ? "0 0 16px rgba(129,140,248,0.35)" : "none",
                transition: "all 0.2s",
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p, i) => {
            const title = (p.title as string) ?? "Untitled";
            const slug = (p.slug as string) ?? String(p.id ?? i);
            const category = (p.category as string) ?? "Dự án";
            const description = (p.description as string) ?? "";
            const results = (p.results as string) ?? "";
            const techStack = (Array.isArray(p.techStack) ? p.techStack : []) as string[];
            const image = (p.image as string) || "";
            const year = (p.year as string) ?? "";
            const client = (p.client as string) ?? "";

            return (
              <motion.div
                key={slug}
                className="rounded-2xl overflow-hidden cursor-pointer group"
                style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.35 }}
                whileHover={{ scale: 1.015, borderColor: `${DS.blue}40`, boxShadow: `0 8px 32px ${DS.blue}20` }}
              >
                <Link href={`/${locale}/portfolio/${slug}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                  <div style={{ position: "relative", overflow: "hidden", height: 200 }}>
                    {image ? (
                      <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", background: "linear-gradient(160deg,#0F172A,#111827)", color: DS.text5 }}>No Image</div>
                    )}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300" style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.75), rgba(2,6,23,0.85))", display: "grid", placeItems: "center" }}>
                      <span style={{ color: "#fff", fontFamily: DS.mono, fontSize: 11, letterSpacing: "0.12em" }}>XEM CHI TIẾT →</span>
                    </div>
                  </div>

                  <div className="p-4">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <div style={{ color: DS.blue, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.12em" }}>{category}</div>
                      <div style={{ color: DS.text5, fontSize: 10 }}>{year}</div>
                    </div>
                    <div style={{ color: DS.text, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{title}</div>
                    {!!results && (
                      <div style={{ color: DS.green, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{results}</div>
                    )}
                    {!!description && (
                      <div style={{ color: DS.text4, fontSize: 12, lineHeight: 1.7, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: 8 }}>
                        {description}
                      </div>
                    )}
                    {techStack.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                        {techStack.slice(0, 4).map((t) => (
                          <span key={t} style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontFamily: DS.mono, background: "rgba(59,130,246,0.08)", color: DS.blue, border: "1px solid rgba(59,130,246,0.2)" }}>{t}</span>
                        ))}
                      </div>
                    )}
                    <div style={{ color: DS.text5, fontSize: 11 }}>
                      <span>{client || "LOOP Client"}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", color: DS.text4, padding: "3rem" }}>Chưa có dự án phù hợp danh mục này.</div>
        )}
      </section>

      <section className="py-14 px-6" style={{ borderTop: `1px solid ${DS.border}` }}>
        <div className="max-w-4xl mx-auto text-center">
          <p style={{ color: DS.text3, marginBottom: 16 }}>Bạn muốn website có hiệu quả tương tự?</p>
          <Link href={`/${locale}/contact`} style={{ display: "inline-flex", gap: 8, alignItems: "center", background: GRD.primary, color: "#fff", textDecoration: "none", padding: "11px 20px", borderRadius: 10, boxShadow: "0 0 20px rgba(129,140,248,0.35)" }}>
            Tư vấn miễn phí
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </main>
  );
}
