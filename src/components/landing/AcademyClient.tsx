"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { DS, GRD } from "@/lib/design-tokens";
import { Search, Star, Users, Play, BookOpen, Check } from "lucide-react";

type Course = {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  instructor?: string;
  instructorImage?: string;
  students?: number;
  rating?: number;
  reviews?: number;
  price?: number;
  lpPrice?: number;
  level?: string;
  category?: string;
  image?: string;
  isFeatured?: boolean;
  hasCertificate?: boolean;
  lectureCount?: number;
};

const MOCK_COURSES: Course[] = [
  {
    id: "1", slug: "react-nextjs-zero-hero", title: "React & Next.js từ Zero Đến Hero",
    shortDescription: "Học React từ cơ bản đến chuyên sâu với Next.js 14 App Router, TypeScript, Tailwind CSS",
    instructor: "Akira Sato",
    instructorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7268e1d?w=80&h=80&fit=crop&crop=face",
    students: 2400, rating: 4.9, reviews: 312,
    price: 2000000, lpPrice: 4000,
    level: "Intermediate", category: "Frontend",
    image: "https://images.unsplash.com/photo-1634836023845-eddbfe9937da?auto=format&fit=crop&w=500&q=80",
    isFeatured: true, hasCertificate: true, lectureCount: 48,
  },
  {
    id: "2", slug: "figma-tailwind-design-system", title: "UI/UX Design System với Figma & Tailwind",
    shortDescription: "Thiết kế design system chuyên nghiệp từ Figma đến Tailwind CSS thực tế",
    instructor: "Mei Lin",
    instructorImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
    students: 1800, rating: 4.8, reviews: 245,
    price: 1500000, lpPrice: 3000,
    level: "Beginner", category: "Design",
    image: "https://images.unsplash.com/photo-1590965918603-0dce981d13b8?auto=format&fit=crop&w=500&q=80",
    isFeatured: false, hasCertificate: true, lectureCount: 32,
  },
];

const LEVEL_VN: Record<string, string> = {
  Beginner: "Cơ bản", Intermediate: "Trung cấp", Advanced: "Nâng cao", Expert: "Chuyên gia",
};

const LEVEL_COLORS: Record<string, string> = {
  Beginner: DS.green, Intermediate: DS.blue, Advanced: DS.amber, Expert: DS.red,
};

const CATS = ["Tất cả", "Frontend", "Backend", "Design", "DevOps", "Marketing"];
const LEVELS = ["Tất cả", "Beginner", "Intermediate", "Advanced"];

function CourseCard({ course, locale, index }: { course: Course; locale: string; index: number }) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(59,130,246,0.15)" }}
      style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, overflow: "hidden" }}
    >
      <Link href={`/${locale}/academy/${course.slug}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
        <div style={{ position: "relative", height: 160, overflow: "hidden", background: "#111827" }}>
          {course.image ? (
            <img src={course.image} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: DS.text5, fontSize: "2.5rem", fontWeight: 800 }}>
              {course.title.charAt(0)}
            </div>
          )}
          {course.isFeatured && (
            <div style={{ position: "absolute", top: 10, left: 10, background: GRD.primary, color: "#fff", borderRadius: 9999, padding: "3px 10px", fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>
              NỔI BẬT
            </div>
          )}
          <div style={{ position: "absolute", bottom: 10, right: 10 }}>
            <div style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", borderRadius: 8, padding: "4px 10px", display: "flex", alignItems: "center", gap: 4 }}>
              <Play size={12} style={{ color: "#fff" }} />
              <span style={{ color: "#fff", fontSize: 11, fontFamily: DS.mono }}>Xem thử</span>
            </div>
          </div>
        </div>

        <div style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
            {course.level && LEVEL_COLORS[course.level] && (
              <span style={{ background: `${LEVEL_COLORS[course.level]}18`, border: `1px solid ${LEVEL_COLORS[course.level]}40`, color: LEVEL_COLORS[course.level], padding: "2px 8px", borderRadius: 9999, fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>
                {LEVEL_VN[course.level] ?? course.level}
              </span>
            )}
            {course.category && (
              <span style={{ background: "rgba(129,140,248,0.08)", border: "1px solid rgba(129,140,248,0.2)", color: DS.purple, padding: "2px 8px", borderRadius: 9999, fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>
                {course.category.toUpperCase()}
              </span>
            )}
          </div>

          <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 15, marginBottom: 4, lineHeight: 1.4 }}>{course.title}</h3>

          {course.shortDescription && (
            <p style={{ color: DS.text4, fontSize: 12, lineHeight: 1.6, marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {course.shortDescription}
            </p>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            {course.instructorImage && (
              <img src={course.instructorImage} alt={course.instructor} style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover" }} />
            )}
            <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{course.instructor}</span>
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            {course.rating && (
              <span style={{ display: "flex", alignItems: "center", gap: 3, color: DS.amber, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>
                <Star size={11} fill={DS.amber} /> {course.rating} ({course.reviews})
              </span>
            )}
            {course.students !== undefined && (
              <span style={{ display: "flex", alignItems: "center", gap: 3, color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>
                <Users size={11} /> {course.students.toLocaleString()}
              </span>
            )}
            {course.lectureCount && (
              <span style={{ display: "flex", alignItems: "center", gap: 3, color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>
                <BookOpen size={11} /> {course.lectureCount} bài
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: `1px solid ${DS.border}` }}>
            <div>
              {course.price !== undefined && <span style={{ color: DS.text, fontWeight: 800, fontSize: 16, fontFamily: DS.mono }}>{fmt(course.price)}</span>}
              {course.lpPrice && <span style={{ color: DS.cyan, fontSize: 11, fontFamily: DS.mono, marginLeft: 8 }}>+{course.lpPrice} LP</span>}
            </div>
            {course.hasCertificate && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: DS.green, fontSize: 11, fontFamily: DS.mono, fontWeight: 600 }}>
                <Check size={12} /> Chứng chỉ
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export function AcademyClient({ locale }: { locale: string }) {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("Tất cả");
  const [level, setLevel] = useState("Tất cả");

  const filtered = useMemo(() => {
    return MOCK_COURSES.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch = !q || c.title.toLowerCase().includes(q) || (c.shortDescription ?? "").toLowerCase().includes(q);
      const matchCat = cat === "Tất cả" || c.category === cat;
      const matchLevel = level === "Tất cả" || c.level === level;
      return matchSearch && matchCat && matchLevel;
    });
  }, [search, cat, level]);

  const featured = MOCK_COURSES.find((c) => c.isFeatured);

  return (
    <main style={{ background: DS.bg, minHeight: "100vh" }}>
      <section className="py-16 px-6 text-center" style={{ background: "linear-gradient(180deg, rgba(20,184,166,0.05) 0%, transparent 100%)" }}>
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full" style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.25)" }}>
            <BookOpen size={12} style={{ color: DS.cyan }} />
            <span style={{ color: DS.cyan, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.22em" }}>ACADEMY & LEARNING</span>
          </div>
          <h1 style={{ fontFamily: DS.heading, fontSize: 38, fontWeight: 900, letterSpacing: "0.06em", background: "linear-gradient(135deg, #FFFFFF, #94A3B8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 12 }}>
            HỌC TẬP THEO CÁCH CỦA BẠN
          </h1>
          <p style={{ color: DS.text3, fontSize: 15, lineHeight: 1.8 }}>
            Khóa học chuyên sâu từ chuyên gia Diamond. Học theo tốc độ riêng, nhận chứng chỉ khi hoàn thành.
          </p>
        </div>
      </section>

      {featured && (
        <section className="px-6 pb-10">
          <div className="max-w-6xl mx-auto">
            <Link href={`/${locale}/academy/${featured.slug}`} style={{ textDecoration: "none" }}>
              <motion.div whileHover={{ scale: 1.01 }} style={{ background: GRD.primary, borderRadius: 20, overflow: "hidden", display: "flex", minHeight: 200 }}>
                {featured.image && (
                  <div style={{ width: 320, flexShrink: 0, overflow: "hidden", background: "#111827" }}>
                    <img src={featured.image} alt={featured.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}
                <div style={{ flex: 1, padding: "28px 32px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <span style={{ background: "rgba(255,255,255,0.15)", color: "#fff", padding: "3px 12px", borderRadius: 9999, fontSize: 10, fontFamily: DS.mono, fontWeight: 700, letterSpacing: "0.1em", width: "fit-content", marginBottom: 12 }}>★ KHÓA NỔI BẬT</span>
                  <h2 style={{ fontFamily: DS.heading, fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 8 }}>{featured.title}</h2>
                  <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, marginBottom: 16, lineHeight: 1.7 }}>{featured.shortDescription}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ color: DS.amber, fontFamily: DS.mono, fontSize: 13, fontWeight: 800 }}>★ {featured.rating} ({featured.reviews})</span>
                    <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: DS.mono }}>{featured.students?.toLocaleString()} học viên</span>
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>
        </section>
      )}

      <section className="px-6 pb-8">
        <div className="max-w-6xl mx-auto">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: DS.text4 }} />
              <input
                type="text"
                placeholder="Tìm khóa học..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: "100%", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "10px 12px 10px 38px", color: DS.text, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: DS.body }}
              />
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {CATS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  style={{
                    padding: "8px 16px", borderRadius: 9999,
                    border: `1px solid ${cat === c ? DS.blue : DS.border}`,
                    background: cat === c ? "rgba(59,130,246,0.1)" : "transparent",
                    color: cat === c ? DS.blue : DS.text4,
                    fontSize: 12, fontFamily: DS.mono, fontWeight: cat === c ? 700 : 400,
                    cursor: "pointer",
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
            <select value={level} onChange={(e) => setLevel(e.target.value)} style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "8px 12px", color: DS.text3, fontSize: 13, cursor: "pointer", fontFamily: DS.mono }}>
              {LEVELS.map((l) => <option key={l} value={l}>{l === "Tất cả" ? "Tất cả trình độ" : LEVEL_VN[l] ?? l}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem", color: DS.text4 }}>
              <BookOpen size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
              <p>Chưa có khóa học phù hợp</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {filtered.map((course, i) => (
                <CourseCard key={course.id} course={course} locale={locale} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
