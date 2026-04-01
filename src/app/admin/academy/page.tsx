"use client";

/**
 * Academy Admin Page — LOOP Solutions
 * Route: /admin/academy
 * Wire: /api/admin/edu/courses, /api/admin/edu/instructors, /api/admin/edu/enrollments
 */

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS } from "@/lib/design-tokens";
import { BookOpen, Users, RefreshCw, Plus, Play, BookText, Star } from "lucide-react";

type Course = {
  id: string;
  title: string;
  titleVi?: string;
  slug: string;
  description: string;
  thumbnail?: string;
  isPublished: boolean;
  isFeatured: boolean;
  enrolledCount: number;
  lessonCount: number;
  rating?: number;
  price?: number;
  currency?: string;
};

type Instructor = {
  id: string;
  name: string;
  bio: string;
  avatar?: string;
  courseCount: number;
  studentCount: number;
};

type Enrollment = {
  id: string;
  courseId: string;
  memberId: string;
  memberName?: string;
  courseTitle?: string;
  enrolledAt: string;
  completedAt?: string;
  status: string;
};

const fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("vi-VN"); }
  catch { return String(d); }
};

const fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
        <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
        <span style={{ color, background: `${color}15`, borderRadius: 8, padding: "4px", display: "flex" }}>{icon}</span>
      </div>
      <div style={{ color, fontSize: "1.5rem", fontWeight: 700, fontFamily: DS.heading }}>{value}</div>
    </motion.div>
  );
}

export default function AcademyPage() {
  const [tab, setTab] = useState<"courses" | "instructors" | "enrollments">("courses");
  const qc = useQueryClient();

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ["admin", "academy", "courses"],
    queryFn: () => adminApi.get<{ data: Course[] }>("/api/admin/edu/courses", { params: { limit: 50 } }),
  });

  const { data: instructorsData, isLoading: instructorsLoading } = useQuery({
    queryKey: ["admin", "academy", "instructors"],
    queryFn: () => adminApi.get<{ data: Instructor[] }>("/api/admin/edu/instructors", { params: { limit: 50 } }),
  });

  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["admin", "academy", "enrollments"],
    queryFn: () => adminApi.get<{ data: Enrollment[] }>("/api/admin/edu/enrollments", { params: { limit: 50 } }),
  });

  const courses = coursesData?.data ?? [];
  const instructors = instructorsData?.data ?? [];
  const enrollments = enrollmentsData?.data ?? [];

  const totalEnrolled = enrollments.length;
  const publishedCourses = courses.filter(c => c.isPublished).length;
  const completedEnrollments = enrollments.filter(e => e.completedAt).length;
  const avgRating = courses.filter(c => c.rating).length > 0
    ? (courses.reduce((s, c) => s + (c.rating ?? 0), 0) / courses.filter(c => c.rating).length).toFixed(1)
    : "—";

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>
            Học viện
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            Quản lý khóa học, giảng viên, đăng ký
          </p>
        </div>
        <button
          onClick={() => qc.invalidateQueries({ queryKey: ["admin", "academy"] })}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
        >
          <RefreshCw size={13} /> Làm mới
        </button>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <StatCard label="Khóa học" value={courses.length} icon={<BookOpen size={16} />} color={DS.blue} />
        <StatCard label="Đã publish" value={publishedCourses} icon={<Play size={16} />} color={DS.green} />
        <StatCard label="Đăng ký" value={totalEnrolled} icon={<Users size={16} />} color={DS.purple} />
        <StatCard label="Hoàn thành" value={completedEnrollments} icon={<BookText size={16} />} color={DS.cyan} />
        <StatCard label="Đánh giá TB" value={avgRating} icon={<Star size={16} />} color={DS.amber} />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: "1rem", borderBottom: `1px solid ${DS.border}` }}>
        {(["courses", "instructors", "enrollments"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 16px",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${tab === t ? DS.blue : "transparent"}`,
              color: tab === t ? DS.blue : DS.text4,
              fontSize: 13,
              fontFamily: DS.mono,
              cursor: "pointer",
              marginBottom: -1,
              fontWeight: tab === t ? 600 : 400,
            }}
          >
            {t === "courses" ? "Khóa học" : t === "instructors" ? "Giảng viên" : "Đăng ký"}
          </button>
        ))}
      </div>

      {/* Courses */}
      {tab === "courses" && (
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: "hidden" }}>
          {coursesLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : courses.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: DS.text4 }}>Chưa có khóa học</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                    {["Khóa học", "Bài học", "Học viên", "Giá", "Trạng thái", "Nổi bật"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 16px", color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {courses.map(c => (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${DS.border}` }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ color: DS.text, fontSize: 13, fontWeight: 600 }}>{c.title}</div>
                        <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{c.slug}</div>
                      </td>
                      <td style={{ padding: "12px 16px", color: DS.text3, fontSize: 12 }}>{c.lessonCount}</td>
                      <td style={{ padding: "12px 16px", color: DS.text3, fontSize: 12 }}>{c.enrolledCount}</td>
                      <td style={{ padding: "12px 16px", color: DS.green, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>
                        {c.price ? fmtVND(c.price) : "Miễn phí"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ background: c.isPublished ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)", color: c.isPublished ? DS.green : DS.amber, padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontFamily: DS.mono, fontWeight: 600 }}>
                          {c.isPublished ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {c.isFeatured && <Star size={14} style={{ color: DS.amber }} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Instructors */}
      {tab === "instructors" && (
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: "hidden" }}>
          {instructorsLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : instructors.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: DS.text4 }}>Chưa có giảng viên</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem", padding: "1rem" }}>
              {instructors.map((inst: Instructor) => (
                <motion.div
                  key={inst.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "1rem" }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${DS.purple}20`, border: `1px solid ${DS.purple}40`, display: "grid", placeItems: "center", color: DS.purple, fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                      {inst.avatar ? <img src={inst.avatar} alt={inst.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /> : inst.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ color: DS.text, fontWeight: 600, fontSize: 13 }}>{inst.name}</div>
                      <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{inst.courseCount} khóa · {inst.studentCount} học viên</div>
                    </div>
                  </div>
                  <div style={{ color: DS.text3, fontSize: 12, lineHeight: 1.4 }}>{inst.bio || "—"}</div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Enrollments */}
      {tab === "enrollments" && (
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: "hidden" }}>
          {enrollmentsLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
              <div style={{ width: 32, height: 32, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : enrollments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: DS.text4 }}>Chưa có đăng ký</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
                    {["Học viên", "Khóa học", "Ngày đăng ký", "Hoàn thành", "Trạng thái"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 16px", color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map(e => (
                    <tr key={e.id} style={{ borderBottom: `1px solid ${DS.border}` }}>
                      <td style={{ padding: "12px 16px", color: DS.text, fontSize: 13, fontWeight: 500 }}>{e.memberName ?? e.memberId}</td>
                      <td style={{ padding: "12px 16px", color: DS.text3, fontSize: 12 }}>{e.courseTitle ?? "—"}</td>
                      <td style={{ padding: "12px 16px", color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>{fmtDate(e.enrolledAt)}</td>
                      <td style={{ padding: "12px 16px", color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>{fmtDate(e.completedAt)}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ background: e.completedAt ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)", color: e.completedAt ? DS.green : DS.amber, padding: "2px 10px", borderRadius: 9999, fontSize: 11, fontFamily: DS.mono, fontWeight: 600 }}>
                          {e.completedAt ? "Hoàn thành" : "Đang học"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
