"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { DS, GRD } from "@/lib/design-tokens";
import { ArrowLeft, Play, Clock, Users, Star, BookOpen, Check } from "lucide-react";

type Course = {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  description?: string;
  instructor?: string;
  instructorRole?: string;
  instructorImage?: string;
  duration?: string;
  students?: number;
  rating?: number;
  reviews?: number;
  price?: number;
  image?: string;
  lectureCount?: number;
  hasCertificate?: boolean;
  level?: string;
  category?: string;
  tags?: string[];
  objectives?: string[];
  requirements?: string[];
};

const fmtVND = (n?: number) =>
  n == null ? "Liên hệ" : new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

export function CourseDetailClient({ locale, course }: { locale: string; course: Course }) {
  return (
    <main style={{ background: DS.bg, minHeight: "100vh" }}>
      {/* Hero */}
      <section style={{ background: "linear-gradient(180deg, rgba(129,140,248,0.06) 0%, transparent 60%)" }}>
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 13, color: DS.text4 }}>
            <Link href={`/${locale}/academy`} style={{ color: DS.blue, textDecoration: "none", fontFamily: DS.mono }}>Academy</Link>
            <span style={{ opacity: 0.4 }}>›</span>
            <span style={{ color: DS.text2 }}>{course.title}</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24 }}>
            <div>
              {course.category && (
                <span style={{ background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.3)", color: DS.purple, padding: "4px 14px", borderRadius: 9999, fontSize: 11, fontFamily: DS.mono, fontWeight: 700, display: "inline-block", marginBottom: 12 }}>
                  {course.category.toUpperCase()}
                </span>
              )}
              <h1 style={{ fontFamily: DS.heading, fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, color: DS.text, marginBottom: 12, letterSpacing: "0.04em" }}>
                {course.title}
              </h1>
              <p style={{ color: DS.text3, fontSize: 15, lineHeight: 1.8, marginBottom: 18 }}>
                {course.shortDescription ?? course.description}
              </p>

              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {course.rating && (
                  <span style={{ display: "flex", alignItems: "center", gap: 4, color: DS.amber, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>
                    <Star size={12} fill={DS.amber} /> {course.rating} ({course.reviews ?? 0})
                  </span>
                )}
                {course.students !== undefined && (
                  <span style={{ display: "flex", alignItems: "center", gap: 4, color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>
                    <Users size={12} /> {course.students.toLocaleString()} học viên
                  </span>
                )}
                {course.duration && (
                  <span style={{ display: "flex", alignItems: "center", gap: 4, color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>
                    <Clock size={12} /> {course.duration}
                  </span>
                )}
              </div>
            </div>

            {/* Sidebar price card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 22, height: "fit-content" }}
            >
              {course.image && (
                <div style={{ height: 170, borderRadius: 10, overflow: "hidden", marginBottom: 12, background: "#111827" }}>
                  <img src={course.image} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}
              <div style={{ color: DS.text, fontFamily: DS.mono, fontSize: 22, fontWeight: 800, marginBottom: 12 }}>
                {fmtVND(course.price)}
              </div>
              <button style={{ width: "100%", background: GRD.primary, color: "#fff", border: "none", borderRadius: 10, padding: "11px 14px", fontWeight: 700, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 10 }}>
                <Play size={14} /> Bắt đầu học
              </button>
              <button style={{ width: "100%", background: "transparent", border: `1px solid ${DS.border}`, color: DS.text3, borderRadius: 10, padding: "10px 14px", cursor: "pointer", fontSize: 13 }}>
                Học thử miễn phí
              </button>

              <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
                {[
                  { icon: <BookOpen size={13} />, label: `${course.lectureCount ?? 0} bài học` },
                  { icon: <Clock size={13} />, label: `Thời lượng ${course.duration ?? "--"}` },
                  { icon: <Users size={13} />, label: `${course.students?.toLocaleString() ?? 0} học viên` },
                  { icon: <Check size={13} />, label: course.hasCertificate ? "Có chứng chỉ" : "Không chứng chỉ" },
                ].map((it, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, color: DS.text4, fontSize: 12 }}>
                    <span style={{ color: DS.cyan }}>{it.icon}</span>
                    {it.label}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24 }}>
          <div>
            {/* Description */}
            <section style={{ marginBottom: 24 }}>
              <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 24 }}>
                <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, marginBottom: 14 }}>Mô tả khóa học</h2>
                <div style={{ color: DS.text3, fontSize: 15, lineHeight: 1.9 }}>
                  {(course.description ?? course.shortDescription ?? "").split("\n").map((p, i) => p.trim() ? <p key={i} style={{ marginBottom: 12 }}>{p}</p> : null)}
                </div>
              </div>
            </section>

            {/* Objectives */}
            {course.objectives && course.objectives.length > 0 && (
              <section style={{ marginBottom: 24 }}>
                <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 24 }}>
                  <h2 style={{ fontFamily: DS.heading, fontSize: 18, fontWeight: 800, color: DS.text, marginBottom: 14 }}>Bạn sẽ học được gì</h2>
                  <div style={{ display: "grid", gap: 8 }}>
                    {course.objectives.map((o, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <Check size={14} style={{ color: DS.green, flexShrink: 0, marginTop: 3 }} />
                        <span style={{ color: DS.text2, fontSize: 14, lineHeight: 1.7 }}>{o}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Requirements */}
            {course.requirements && course.requirements.length > 0 && (
              <section style={{ marginBottom: 24 }}>
                <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 24 }}>
                  <h2 style={{ fontFamily: DS.heading, fontSize: 18, fontWeight: 800, color: DS.text, marginBottom: 14 }}>Yêu cầu đầu vào</h2>
                  <ul style={{ margin: 0, paddingLeft: 18, color: DS.text3, fontSize: 14, lineHeight: 1.8 }}>
                    {course.requirements.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              </section>
            )}
          </div>

          <div>
            {/* Instructor card */}
            <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 18, marginBottom: 14 }}>
              <h3 style={{ color: DS.text2, fontSize: 13, fontFamily: DS.mono, letterSpacing: "0.12em", marginBottom: 12 }}>GIẢNG VIÊN</h3>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {course.instructorImage && <img src={course.instructorImage} alt={course.instructor} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover" }} />}
                <div>
                  <p style={{ color: DS.text, fontWeight: 700, marginBottom: 2 }}>{course.instructor}</p>
                  <p style={{ color: DS.text4, fontSize: 12 }}>{course.instructorRole}</p>
                </div>
              </div>
            </div>

            {/* Tags */}
            {course.tags && course.tags.length > 0 && (
              <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16, padding: 18 }}>
                <h3 style={{ color: DS.text2, fontSize: 13, fontFamily: DS.mono, letterSpacing: "0.12em", marginBottom: 12 }}>CÔNG NGHỆ</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {course.tags.map((tag, i) => (
                    <span key={i} style={{ background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.25)", color: DS.purple, padding: "4px 12px", borderRadius: 9999, fontSize: 11, fontFamily: DS.mono }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <Link href={`/${locale}/academy`} style={{ display: "inline-flex", alignItems: "center", gap: 8, color: DS.blue, textDecoration: "none", fontFamily: DS.mono, fontSize: 13, fontWeight: 600 }}>
            <ArrowLeft size={14} /> Quay lại Academy
          </Link>
        </div>
      </div>
    </main>
  );
}
