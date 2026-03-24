"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Users,
  Star,
  ArrowRight,
} from "lucide-react";

const VI_DATE = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit", month: "2-digit", year: "numeric",
});

const formatPrice = (n: number) =>
  new Intl.NumberFormat("vi-VN").format(n ?? 0) + " ₫";

interface EduStats {
  instructors: number;
  courses: number;
  publishedCourses: number;
  enrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  attendanceRate: number;
  avgRating: number;
  totalRevenue: number;
}

interface TopInstructor {
  id: string;
  name: string;
  totalStudents: number;
  rating: number;
}

interface RecentEnrollment {
  id: string;
  studentName: string;
  courseTitle: string;
  status: string;
  enrolledAt: string;
}

type NavItem = {
  href: string;
  label: string;
  color: string;
};

type StatCard = {
  label: string;
  value: string;
  sub?: string;
  href?: string;
  color: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/edu/instructors", label: "Giảng viên", color: "#a78bfa" },
  { href: "/admin/edu/courses", label: "Khóa học", color: "#34d399" },
  { href: "/admin/edu/enrollments", label: "Ghi danh", color: "#60a5fa" },
  { href: "/admin/edu/attendance", label: "Điểm danh", color: "#f59e0b" },
  { href: "/admin/edu/feedback", label: "Phản hồi", color: "#f472b6" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  enrolled:    { bg: "rgba(59,130,246,0.2)",   text: "#60a5fa" },
  in_progress: { bg: "rgba(168,85,247,0.2)",    text: "#a855f7" },
  completed:   { bg: "rgba(34,197,94,0.2)",   text: "#22c55e" },
  cancelled:   { bg: "rgba(239,68,68,0.2)",   text: "#ef4444" },
};

export default function AdminEduDashboard() {
  const [stats, setStats] = useState<EduStats | null>(null);
  const [topInstructors, setTopInstructors] = useState<TopInstructor[]>([]);
  const [recentEnrollments, setRecentEnrollments] = useState<RecentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/edu/instructors?limit=3").then((r) => r.json()),
      fetch("/api/admin/edu/courses?limit=100").then((r) => r.json()),
      fetch("/api/admin/edu/enrollments?limit=100").then((r) => r.json()),
      fetch("/api/admin/edu/feedback?limit=100").then((r) => r.json()),
      fetch("/api/admin/edu/attendance?limit=200").then((r) => r.json()),
    ])
      .then(([instrRes, coursesRes, enrollRes, feedbackRes, attendanceRes]) => {
        const instructors: any[] = (instrRes as any).data ?? [];
        const courses: any[] = (coursesRes as any).data ?? [];
        const enrollments: any[] = (enrollRes as any).data ?? [];
        const feedbacks: any[] = (feedbackRes as any).data ?? [];
        const attendances: any[] = (attendanceRes as any).data ?? [];

        const published = courses.filter(
          (c) => c.isPublished || c.status === "published"
        ).length;
        const active = enrollments.filter(
          (e) => e.status === "enrolled" || e.status === "in_progress"
        ).length;
        const completed = enrollments.filter((e) => e.status === "completed").length;

        const totalPresent = attendances.filter(
          (a) => a.status === "present" || a.status === "late"
        ).length;
        const attendanceRate =
          attendances.length > 0
            ? Math.round((totalPresent / attendances.length) * 100)
            : 0;

        const avgRating =
          feedbacks.length > 0
            ? Math.round(
                feedbacks.reduce((s: number, f: any) => s + (f.rating ?? 0), 0) /
                  feedbacks.length *
                  10
              ) / 10
            : 0;

        const totalRevenue = enrollments.reduce(
          (s: number, e: any) => s + (e.paidAmount ?? 0),
          0
        );

        setStats({
          instructors: instructors.length,
          courses: courses.length,
          publishedCourses: published,
          enrollments: enrollments.length,
          activeEnrollments: active,
          completedEnrollments: completed,
          attendanceRate,
          avgRating,
          totalRevenue,
        });

        const ranked = [...instructors]
          .sort((a, b) => (b.totalStudents ?? 0) - (a.totalStudents ?? 0))
          .slice(0, 5)
          .map((i: any) => ({
            id: i.id,
            name: i.name,
            totalStudents: i.totalStudents ?? 0,
            rating: i.rating ?? 0,
          }));
        setTopInstructors(ranked);

        const recent: RecentEnrollment[] = [...enrollments]
          .sort(
            (a, b) =>
              new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime()
          )
          .slice(0, 6)
          .map((e: any) => ({
            id: e.id,
            studentName: e.user?.name ?? e.member?.name ?? "—",
            courseTitle: e.course?.titleVi ?? "—",
            status: e.status ?? "enrolled",
            enrolledAt: e.enrolledAt,
          }));
        setRecentEnrollments(recent);
      })
      .catch(() => { /* silent */ })
      .finally(() => setLoading(false));
  }, []);

  const statCards: StatCard[] = stats
    ? [
        { label: "Giảng viên", value: String(stats.instructors), color: "#a78bfa" },
        {
          label: "Khóa học",
          value: String(stats.courses),
          sub: `${stats.publishedCourses} đã xuất bản`,
          color: "#34d399",
        },
        {
          label: "Học viên",
          value: String(stats.enrollments),
          sub: `${stats.activeEnrollments} đang học`,
          color: "#60a5fa",
        },
        {
          label: "Hoàn thành",
          value: String(stats.completedEnrollments),
          color: "#22c55e",
        },
        {
          label: "Điểm danh",
          value: `${stats.attendanceRate}%`,
          sub: "tỷ lệ có mặt",
          color: "#f59e0b",
        },
        {
          label: "Đánh giá TB",
          value: stats.avgRating > 0 ? `${stats.avgRating} ★` : "—",
          color: "#f472b6",
        },
        {
          label: "Doanh thu",
          value: formatPrice(stats.totalRevenue),
          color: "#fbbf24",
        },
        { label: "Phản hồi", value: "Chi tiết →", href: "/admin/edu/feedback", color: "#60a5fa" },
      ]
    : [];

  const navStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#94a3b8",
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "Cinzel, serif", color: "#FFFFFF" }}
          >
            Học vấn
          </h1>
          <p style={{ color: "#64748B", fontSize: 13, marginTop: 4 }}>
            Tổng quan hệ thống giáo dục
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
              style={navStyle}
            >
              {item.label}
              <ArrowRight size={12} />
            </Link>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl animate-pulse"
              style={{ background: "rgba(255,255,255,0.04)" }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((card, i) => (
            <div
              key={i}
              className="p-4 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${card.color}20`,
                boxShadow: `0 0 20px ${card.color}08`,
              }}
            >
              <p
                className="mb-2"
                style={{
                  color: "#475569",
                  fontSize: 11,
                  fontFamily: "JetBrains Mono, monospace",
                  letterSpacing: "0.08em",
                }}
              >
                {card.label.toUpperCase()}
              </p>
              <p
                style={{
                  color: card.color,
                  fontSize: 22,
                  fontFamily: "Cinzel, serif",
                  fontWeight: 700,
                }}
              >
                {card.value}
              </p>
              {card.sub && (
                <p style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>
                  {card.sub}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Bottom: Top Instructors + Recent Enrollments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Instructors */}
        <div
          className="rounded-xl p-5"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GraduationCap size={16} style={{ color: "#a78bfa" }} />
              <h2
                style={{
                  fontFamily: "Cinzel, serif",
                  fontSize: 15,
                  color: "#FFFFFF",
                  fontWeight: 600,
                }}
              >
                Giảng viên hàng đầu
              </h2>
            </div>
            <Link
              href="/admin/edu/instructors"
              style={{ color: "#64748B", fontSize: 12, fontFamily: "JetBrains Mono, monospace" }}
            >
              Xem tất cả →
            </Link>
          </div>

          {topInstructors.length === 0 ? (
            <p style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
              Chưa có giảng viên nào
            </p>
          ) : (
            <div className="space-y-2">
              {topInstructors.map((instructor, idx) => {
                const rankColors = ["#FFD700", "#CBD5E1", "#CD7F32", "#64748B"];
                const rc = rankColors[idx] ?? "#64748B";
                return (
                  <div
                    key={instructor.id}
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `${rc}20`,
                        color: rc,
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#FFFFFF" }}>
                        {instructor.name}
                      </p>
                      <p style={{ color: "#475569", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}>
                        {instructor.totalStudents} học viên
                      </p>
                    </div>
                    {instructor.rating > 0 && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Star size={12} style={{ color: "#f59e0b" }} />
                        <span style={{ color: "#f59e0b", fontSize: 12, fontFamily: "JetBrains Mono, monospace" }}>
                          {instructor.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Enrollments */}
        <div
          className="rounded-xl p-5"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={16} style={{ color: "#60a5fa" }} />
              <h2
                style={{
                  fontFamily: "Cinzel, serif",
                  fontSize: 15,
                  color: "#FFFFFF",
                  fontWeight: 600,
                }}
              >
                Ghi danh gần đây
              </h2>
            </div>
            <Link
              href="/admin/edu/enrollments"
              style={{ color: "#64748B", fontSize: 12, fontFamily: "JetBrains Mono, monospace" }}
            >
              Xem tất cả →
            </Link>
          </div>

          {recentEnrollments.length === 0 ? (
            <p style={{ color: "#475569", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
              Chưa có học viên nào
            </p>
          ) : (
            <div className="space-y-2">
              {recentEnrollments.map((e) => {
                const sc = STATUS_COLORS[e.status] ?? { bg: "rgba(255,255,255,0.05)", text: "#64748B" };
                return (
                  <div
                    key={e.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#FFFFFF" }}>
                        {e.studentName}
                      </p>
                      <p style={{ color: "#475569", fontSize: 11, marginTop: 1 }}>
                        {e.courseTitle}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: sc.bg, color: sc.text }}
                      >
                        {e.status}
                      </span>
                      <span style={{ color: "#334155", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}>
                        {VI_DATE.format(new Date(e.enrolledAt))}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
