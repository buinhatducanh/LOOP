"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { DS, GRD } from "@/lib/design-tokens";
import {
  Search, Star, Users, Play, BookOpen, Check, ChevronDown, Award, Zap,
  Clock, Code2, Palette, Server, GraduationCap,
  CheckCircle2, X, ArrowRight,
} from "lucide-react";
import { useTranslations } from "next-intl";

// ─── i18n Context ─────────────────────────────────────────────────────────────

import { createContext, useContext } from "react";

type AcademyI18n = {
  t: ReturnType<typeof useTranslations<"Academy">>;
};

const AcademyI18nContext = createContext<AcademyI18n | null>(null);

function AcademyI18nProvider({
  children,
  t,
}: {
  children: React.ReactNode;
  t: AcademyI18n["t"];
}) {
  return (
    <AcademyI18nContext.Provider value={{ t }}>
      {children}
    </AcademyI18nContext.Provider>
  );
}

function useAcademyT(): AcademyI18n["t"] {
  const ctx = useContext(AcademyI18nContext);
  if (!ctx) {
    // Fallback: use identity function if context not available
    return ((key: string) => key) as AcademyI18n["t"];
  }
  return ctx.t;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const USER_LP = 15200;

const PATHS = [
  {
    slug: "fullstack",
    title: "Fullstack Web Developer",
    description: "Từ React cơ bản đến deploy production-ready apps",
    color: DS.blue,
    icon: Code2,
    courses: ["react-nextjs-zero-hero", "nodejs-postgres", "kubernetes-devops"],
    gradient: "linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.02) 100%)",
    border: `${DS.blue}40`,
  },
  {
    slug: "design",
    title: "UI/UX Design",
    description: "Thiết kế giao diện chuyên nghiệp với Figma và Tailwind",
    color: DS.cosmicPurple,
    icon: Palette,
    courses: ["figma-tailwind-design-system", "seo-marketing"],
    gradient: `linear-gradient(135deg, ${DS.cosmicPurple}1A 0%, ${DS.cosmicPurple}05 100%)`,
    border: `${DS.cosmicPurple}40`,
  },
  {
    slug: "devops",
    title: "DevOps & Backend",
    description: "Xây dựng hạ tầng và API backend với Node.js, PostgreSQL, Kubernetes",
    color: DS.cyan,
    icon: Server,
    courses: ["nodejs-postgres", "kubernetes-devops", "react-nextjs-zero-hero"],
    gradient: "linear-gradient(135deg, rgba(20,184,166,0.1) 0%, rgba(20,184,166,0.02) 100%)",
    border: `${DS.cyan}40`,
  },
];

const INSTRUCTORS = [
  {
    id: "ins-1",
    name: "Akira Sato",
    title: "Senior Frontend Engineer",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7268e1d?w=80&h=80&fit=crop&crop=face",
    specialty: "React, Next.js, TypeScript",
    students: 2400,
    courses: 2,
    rank: "diamond",
  },
  {
    id: "ins-2",
    name: "Mei Lin",
    title: "Design Lead",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
    specialty: "Figma, UI/UX, Design Systems",
    students: 1800,
    courses: 1,
    rank: "platinum",
  },
  {
    id: "ins-3",
    name: "Ryo Hashimoto",
    title: "Backend Architect",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face",
    specialty: "Node.js, PostgreSQL, Docker",
    students: 1200,
    courses: 2,
    rank: "platinum",
  },
  {
    id: "ins-4",
    name: "Shin Watanabe",
    title: "DevOps Engineer",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",
    specialty: "Kubernetes, CI/CD, AWS",
    students: 950,
    courses: 1,
    rank: "gold",
  },
];

const FAQS = [
  {
    q: "Học xong có chứng chỉ không?",
    a: "Có. Bạn nhận chứng chỉ khi hoàn thành 100% bài học trong khóa học. Chứng chỉ có thể tải PDF hoặc chia sẻ trực tiếp lên LinkedIn.",
  },
  {
    q: "Tôi có thể học miễn phí không?",
    a: "Bạn có thể xem trước 2 bài học đầu tiên miễn phí của mỗi khóa. Để truy cập toàn bộ nội dung, cần đăng ký gói có phí.",
  },
  {
    q: "Thanh toán bằng LP được không?",
    a: "Có. Bạn có thể dùng 100% LP, hoặc kết hợp LP + VNĐ. Tỷ lệ: 1,000 LP = 500,000 VNĐ.",
  },
  {
    q: "Khóa học có cập nhật không?",
    a: "Có. Chúng tôi cập nhật nội dung theo xu hướng công nghệ mới nhất. Bạn được học miễn phí các bản cập nhật trong suốt thời gian sở hữu khóa học.",
  },
  {
    q: "Video Gate là gì?",
    a: "Để đảm bảo chất lượng học tập, bạn cần xem ít nhất 35% nội dung video của một bài học trước khi có thể mở bài tiếp theo.",
  },
];

type Course = {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  instructor?: string;
  instructorId?: string;
  instructorImage?: string;
  students?: number;
  rating?: number;
  reviews?: number;
  price?: number;
  lpPrice?: number;
  lpFullPrice?: number;
  level?: string;
  category?: string;
  image?: string;
  isFeatured?: boolean;
  hasCertificate?: boolean;
  lectureCount?: number;
  duration?: string;
  tags?: string[];
  totalStudents?: number;
  lpReward?: number;
};

const MOCK_COURSES: Course[] = [
  {
    id: "1",
    slug: "react-nextjs-zero-hero",
    title: "React & Next.js 14 Từ Zero Đến Hero",
    shortDescription: "Học React từ cơ bản đến chuyên sâu với Next.js 14 App Router, TypeScript, Tailwind CSS. Xây dựng 5 dự án thực tế.",
    instructor: "Akira Sato",
    instructorId: "ins-1",
    instructorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7268e1d?w=80&h=80&fit=crop&crop=face",
    students: 2400,
    rating: 4.9,
    reviews: 312,
    price: 2000000,
    lpPrice: 4000,
    lpFullPrice: 8000,
    level: "Intermediate",
    category: "Frontend",
    image: "https://images.unsplash.com/photo-1634836023845-eddbfe9937da?auto=format&fit=crop&w=500&q=80",
    isFeatured: true,
    hasCertificate: true,
    lectureCount: 48,
    duration: "32 giờ",
    totalStudents: 2400,
    lpReward: 200,
    tags: ["React", "Next.js", "TypeScript", "Tailwind"],
  },
  {
    id: "2",
    slug: "figma-tailwind-design-system",
    title: "UI/UX Design System với Figma & Tailwind",
    shortDescription: "Thiết kế design system chuyên nghiệp từ Figma đến Tailwind CSS thực tế. Học cách tạo component library nhất quán.",
    instructor: "Mei Lin",
    instructorId: "ins-2",
    instructorImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
    students: 1800,
    rating: 4.8,
    reviews: 245,
    price: 1500000,
    lpPrice: 3000,
    lpFullPrice: 6000,
    level: "Beginner",
    category: "Design",
    image: "https://images.unsplash.com/photo-1590965918603-0dce981d13b8?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    hasCertificate: true,
    lectureCount: 32,
    duration: "20 giờ",
    totalStudents: 1800,
    lpReward: 150,
    tags: ["Figma", "UI/UX", "Tailwind", "Design System"],
  },
  {
    id: "3",
    slug: "nodejs-postgres",
    title: "Node.js API & PostgreSQL: Production-Ready",
    shortDescription: "Xây dựng REST/GraphQL API production-ready với Node.js, PostgreSQL, Docker và deployment lên cloud. Bảo mật, testing, logging.",
    instructor: "Ryo Hashimoto",
    instructorId: "ins-3",
    instructorImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face",
    students: 1650,
    rating: 4.9,
    reviews: 198,
    price: 2500000,
    lpPrice: 5000,
    lpFullPrice: 10000,
    level: "Advanced",
    category: "Backend",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    hasCertificate: true,
    lectureCount: 56,
    duration: "40 giờ",
    totalStudents: 1650,
    lpReward: 250,
    tags: ["Node.js", "PostgreSQL", "Docker", "REST API"],
  },
  {
    id: "4",
    slug: "kubernetes-devops",
    title: "Kubernetes & DevOps cho Startup VN",
    shortDescription: "Từ Docker cơ bản đến Kubernetes, CI/CD pipeline, monitoring và autoscaling. Dành cho startup Việt Nam với hạ tầng tối ưu chi phí.",
    instructor: "Shin Watanabe",
    instructorId: "ins-4",
    instructorImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",
    students: 980,
    rating: 4.7,
    reviews: 156,
    price: 3000000,
    lpPrice: 6000,
    lpFullPrice: 12000,
    level: "Advanced",
    category: "DevOps",
    image: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    hasCertificate: true,
    lectureCount: 44,
    duration: "28 giờ",
    totalStudents: 980,
    lpReward: 300,
    tags: ["Kubernetes", "Docker", "CI/CD", "AWS"],
  },
  {
    id: "5",
    slug: "seo-marketing",
    title: "SEO & Content Marketing cho SaaS B2B",
    shortDescription: "Chiến lược SEO technical, content marketing, link building cho SaaS B2B. Case study thực tế từ LOOP Solutions.",
    instructor: "Akira Sato",
    instructorId: "ins-1",
    instructorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7268e1d?w=80&h=80&fit=crop&crop=face",
    students: 720,
    rating: 4.6,
    reviews: 98,
    price: 1200000,
    lpPrice: 2400,
    lpFullPrice: 4800,
    level: "Beginner",
    category: "Marketing",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    hasCertificate: true,
    lectureCount: 24,
    duration: "16 giờ",
    totalStudents: 720,
    lpReward: 120,
    tags: ["SEO", "Marketing", "SaaS", "Content"],
  },
  {
    id: "6",
    slug: "rust-go",
    title: "High-Performance Rust & Go cho Backend",
    shortDescription: "Viết backend siêu nhanh với Rust và Go. Tối ưu hiệu năng, concurrency patterns, microservices architecture.",
    instructor: "Ryo Hashimoto",
    instructorId: "ins-3",
    instructorImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face",
    students: 540,
    rating: 4.8,
    reviews: 87,
    price: 4500000,
    lpPrice: 9000,
    lpFullPrice: 18000,
    level: "Expert",
    category: "Backend",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=500&q=80",
    isFeatured: false,
    hasCertificate: true,
    lectureCount: 60,
    duration: "45 giờ",
    totalStudents: 540,
    lpReward: 450,
    tags: ["Rust", "Go", "Performance", "Microservices"],
  },
];

const LEVEL_VN: Record<string, string> = {
  Beginner: "Cơ bản",
  Intermediate: "Trung cấp",
  Advanced: "Nâng cao",
  Expert: "Chuyên gia",
};

const LEVEL_COLORS: Record<string, string> = {
  Beginner: DS.green,
  Intermediate: DS.blue,
  Advanced: DS.amber,
  Expert: DS.red,
};

// Empty string = "All" filter option (locale-agnostic identifier)
const CATS = ["", "Frontend", "Backend", "Design", "DevOps", "Marketing"];
const LEVELS = ["", "Beginner", "Intermediate", "Advanced", "Expert"];

// ─── PaymentModal ──────────────────────────────────────────────────────────────

function PaymentModal({
  course,
  onClose,
}: {
  course: Course;
  onClose: () => void;
}) {
  const t = useAcademyT();
  const [mode, setMode] = useState<"vnd" | "lp-partial" | "lp-full">("vnd");
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const lpPartialPay = course.lpPrice ?? 0;
  const lpFullPay = course.lpFullPrice ?? 0;
  const vndPartial = ((course.price ?? 0) * 0.5).toFixed(0);

  const canPayLpFull = USER_LP >= lpFullPay;
  const canPayLpPartial = USER_LP >= lpPartialPay;

  const handleEnroll = async () => {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1500));
    setProcessing(false);
    setDone(true);
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          background: DS.bgCard, border: `1px solid ${DS.border}`,
          borderRadius: 20, maxWidth: 480, width: "100%",
          overflow: "hidden",
        }}
      >
        {done ? (
          <div style={{ padding: "40px 32px", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: `${DS.green}20`, display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
              <CheckCircle2 size={32} style={{ color: DS.green }} />
            </div>
            <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 20, marginBottom: 8 }}>{t("enrollSuccess")}</h3>
            <p style={{ color: DS.text3, fontSize: 14, marginBottom: 24 }}>{t("enrollSuccessDesc")}</p>
            <button onClick={onClose} style={{ background: DS.blue, color: "#fff", border: "none", borderRadius: 12, padding: "12px 24px", fontFamily: DS.mono, fontWeight: 700, cursor: "pointer", width: "100%" }}>
              {t("startLearning")}
            </button>
          </div>
        ) : (
          <>
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${DS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: 16, fontWeight: 800 }}>{t("enrollCourse")}</h3>
              <button onClick={onClose} style={{ background: "none", border: "none", color: DS.text4, cursor: "pointer", display: "flex", alignItems: "center" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "16px 24px" }}>
              <div style={{ background: "rgba(59,130,246,0.05)", border: `1px solid rgba(59,130,246,0.2)`, borderRadius: 12, padding: 12, marginBottom: 16, display: "flex", gap: 12, alignItems: "center" }}>
                {course.instructorImage && (
                  <img src={course.instructorImage} alt={course.instructor} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
                )}
                <div>
                  <p style={{ color: DS.text, fontWeight: 700, fontSize: 14 }}>{course.title}</p>
                  <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>{course.instructor}</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                <label
                  onClick={() => setMode("vnd")}
                  style={{ cursor: "pointer", padding: 12, borderRadius: 10, border: `2px solid ${mode === "vnd" ? DS.blue : DS.border}`, background: mode === "vnd" ? `${DS.blue}10` : "transparent" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: DS.text, fontWeight: 600, fontSize: 13 }}>{t("payVND")}</span>
                    <span style={{ color: DS.text, fontFamily: DS.mono, fontWeight: 800, fontSize: 14 }}>
                      {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(course.price ?? 0)}
                    </span>
                  </div>
                </label>

                <label
                  onClick={() => canPayLpPartial && setMode("lp-partial")}
                  style={{ cursor: canPayLpPartial ? "pointer" : "not-allowed", padding: 12, borderRadius: 10, border: `2px solid ${mode === "lp-partial" ? DS.cyan : DS.border}`, background: mode === "lp-partial" ? `${DS.cyan}10` : "transparent", opacity: canPayLpPartial ? 1 : 0.5 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: DS.text, fontWeight: 600, fontSize: 13 }}>{t("payLPVND")}</span>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ color: DS.cyan, fontFamily: DS.mono, fontWeight: 800, fontSize: 14 }}>{lpPartialPay.toLocaleString()} LP</span>
                      <span style={{ color: DS.text4, fontFamily: DS.mono, fontSize: 11 }}> + {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(vndPartial))}</span>
                    </div>
                  </div>
                </label>

                <label
                  onClick={() => canPayLpFull && setMode("lp-full")}
                  style={{ cursor: canPayLpFull ? "pointer" : "not-allowed", padding: 12, borderRadius: 10, border: `2px solid ${mode === "lp-full" ? DS.purple : DS.border}`, background: mode === "lp-full" ? `${DS.purple}10` : "transparent", opacity: canPayLpFull ? 1 : 0.5 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ color: DS.text, fontWeight: 600, fontSize: 13 }}>{t("payFullLP")}</span>
                      <span style={{ marginLeft: 8, background: `${DS.purple}20`, color: DS.purple, padding: "1px 6px", borderRadius: 4, fontSize: 10, fontFamily: DS.mono }}>{t("savings")}</span>
                    </div>
                    <span style={{ color: DS.purple, fontFamily: DS.mono, fontWeight: 800, fontSize: 14 }}>{lpFullPay.toLocaleString()} LP</span>
                  </div>
                  <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ color: DS.cyan, fontSize: 11, fontFamily: DS.mono }}>{USER_LP.toLocaleString()} LP</span>
                    <div style={{ flex: 1, height: 4, background: DS.border, borderRadius: 2 }}>
                      <div style={{ width: `${Math.min((USER_LP / lpFullPay) * 100, 100)}%`, height: "100%", background: DS.cyan, borderRadius: 2 }} />
                    </div>
                  </div>
                </label>
              </div>

              <button
                onClick={handleEnroll}
                disabled={processing}
                style={{
                  width: "100%", padding: "14px",
                  background: processing ? `${DS.blue}60` : DS.blue,
                  color: "#fff", border: "none", borderRadius: 12,
                  fontFamily: DS.mono, fontWeight: 700, fontSize: 14,
                  cursor: processing ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {processing ? (
                  <>
                    <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    {t("processing")}
                  </>
                ) : (
                  <>
                    <GraduationCap size={16} />
                    {t("enrollNow")}
                  </>
                )}
              </button>

              <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @media (max-width: 767px) {
                  .featured-img-wrap { width: 100% !important; flex: none !important; }
                }
              `}</style>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

// ─── CourseCard ──────────────────────────────────────────────────────────────

function CourseCard({
  course,
  locale,
  index,
  onEnroll,
}: {
  course: Course;
  locale: string;
  index: number;
  onEnroll: (course: Course) => void;
}) {
  const t = useAcademyT();
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
        <div style={{ position: "relative", height: 160, overflow: "hidden", background: DS.bgCard2 }}>
          {course.image ? (
            <img src={course.image} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: DS.text5, fontSize: "2.5rem", fontWeight: 800 }}>
              {course.title.charAt(0)}
            </div>
          )}
          {course.isFeatured && (
            <div style={{ position: "absolute", top: 10, left: 10, background: GRD.primary, color: "#fff", borderRadius: 9999, padding: "3px 10px", fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>
              {t("featured")}
            </div>
          )}
          {course.lpReward && (
            <div style={{ position: "absolute", top: 10, right: 10, background: `${DS.cyan}20`, border: `1px solid ${DS.cyan}60`, color: DS.cyan, borderRadius: 8, padding: "3px 8px", fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>
              +{course.lpReward} LP
            </div>
          )}
          <div style={{ position: "absolute", bottom: 10, right: 10 }}>
            <div style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", borderRadius: 8, padding: "4px 10px", display: "flex", alignItems: "center", gap: 4 }}>
              <Play size={12} style={{ color: "#fff" }} />
              <span style={{ color: "#fff", fontSize: 11, fontFamily: DS.mono }}>{t("preview")}</span>
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
            {course.totalStudents !== undefined && (
              <span style={{ display: "flex", alignItems: "center", gap: 3, color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>
                <Users size={11} /> {course.totalStudents.toLocaleString()}
              </span>
            )}
            {course.lectureCount && (
              <span style={{ display: "flex", alignItems: "center", gap: 3, color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>
                <BookOpen size={11} /> {course.lectureCount} {t("lecture")}
              </span>
            )}
            {course.duration && (
              <span style={{ display: "flex", alignItems: "center", gap: 3, color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>
                <Clock size={11} /> {course.duration}
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: `1px solid ${DS.border}` }}>
            <div>
              {course.price !== undefined && (
                <span style={{ color: DS.text, fontWeight: 800, fontSize: 16, fontFamily: DS.mono }}>{fmt(course.price)}</span>
              )}
              {course.lpPrice && (
                <span style={{ color: DS.cyan, fontSize: 11, fontFamily: DS.mono, marginLeft: 8 }}>+{course.lpPrice.toLocaleString()} LP</span>
              )}
            </div>
            {course.hasCertificate && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: DS.green, fontSize: 11, fontFamily: DS.mono, fontWeight: 600 }}>
                <Check size={12} /> {t("certificate")}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div style={{ padding: "0 16px 16px" }}>
        <button
          onClick={(e) => { e.preventDefault(); onEnroll(course); }}
          style={{
            width: "100%", padding: "10px",
            background: GRD.primary, color: "#fff", border: "none", borderRadius: 10,
            fontFamily: DS.mono, fontWeight: 700, fontSize: 13, cursor: "pointer",
          }}
        >
          {t("enrollNow")}
        </button>
      </div>
    </motion.article>
  );
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      style={{ background: DS.bgCard, border: `1px solid ${open ? DS.blue : DS.border}`, borderRadius: 12, overflow: "hidden" }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", padding: "16px 20px", background: "none", border: "none",
          display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left",
        }}
      >
        <span style={{ color: DS.text, fontWeight: 600, fontSize: 14, fontFamily: DS.body }}>{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} style={{ color: DS.text4, flexShrink: 0 }} />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <p style={{ padding: "0 20px 16px", color: DS.text3, fontSize: 13, lineHeight: 1.7 }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Instructor Card ──────────────────────────────────────────────────────────

const RANK_COLOR_MAP: Record<string, string> = {
  iron: "#9CA3AF", bronze: "#CD7F32", silver: "#C0C0C0",
  gold: "#FFD700", platinum: "#E5E4E2", ruby: "#E0115F", diamond: "#7DD3FC",
};

function InstructorCard({ ins }: { ins: typeof INSTRUCTORS[0] }) {
  const rankColor = RANK_COLOR_MAP[ins.rank] ?? DS.text4;
  return (
    <motion.div
      whileHover={{ y: -4 }}
      style={{
        background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 16,
        padding: 20, textAlign: "center",
      }}
    >
      <div style={{ position: "relative", width: 72, height: 72, margin: "0 auto 12px" }}>
        <img src={ins.avatar} alt={ins.name} style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: `3px solid ${rankColor}` }} />
        <div style={{ position: "absolute", bottom: -4, right: -4, width: 24, height: 24, borderRadius: "50%", background: rankColor, display: "grid", placeItems: "center", fontSize: 9, fontFamily: DS.mono, fontWeight: 900, color: "#000" }}>
          {ins.rank.charAt(0).toUpperCase()}
        </div>
      </div>
      <h4 style={{ color: DS.text, fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{ins.name}</h4>
      <p style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 8 }}>{ins.title}</p>
      <p style={{ color: DS.cyan, fontSize: 11, fontFamily: DS.mono, marginBottom: 12 }}>{ins.specialty}</p>
      <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
        <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>
          <Users size={11} style={{ display: "inline", marginRight: 4 }} />{ins.students.toLocaleString()}
        </span>
        <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>
          <BookOpen size={11} style={{ display: "inline", marginRight: 4 }} />{ins.courses} khóa
        </span>
      </div>
    </motion.div>
  );
}

// ─── Main AcademyClient ───────────────────────────────────────────────────────

export function AcademyClient({ locale }: { locale: string }) {
  const t = useTranslations("Academy");
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("");
  const [level, setLevel] = useState("");
  const [enrolling, setEnrolling] = useState<Course | null>(null);

  const filtered = useMemo(() => {
    return MOCK_COURSES.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        (c.shortDescription ?? "").toLowerCase().includes(q) ||
        (c.tags ?? []).some((t) => t.toLowerCase().includes(q));
      const matchCat = cat === "" || c.category === cat;
      const matchLevel = level === "" || c.level === level;
      return matchSearch && matchCat && matchLevel;
    });
  }, [search, cat, level]);

  const featured = MOCK_COURSES.find((c) => c.isFeatured);

  return (
    <AcademyI18nProvider t={t}>
    <main style={{ background: DS.bg, minHeight: "100vh" }}>
      {/* Hero */}
      <section style={{ background: "linear-gradient(180deg, rgba(20,184,166,0.05) 0%, transparent 100%)", padding: "64px 24px 48px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full"
            style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.25)" }}>
            <GraduationCap size={12} style={{ color: DS.cyan }} />
            <span style={{ color: DS.cyan, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.22em" }}>ACADEMY & LEARNING</span>
          </div>

          <h1 style={{
            fontFamily: DS.heading, fontSize: 48, fontWeight: 900,
            letterSpacing: "0.06em",
            background: "linear-gradient(135deg, #FFFFFF 0%, #94A3B8 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            marginBottom: 16,
          }}>
            {t("heroTitle")}
          </h1>
          <p style={{ color: DS.text3, fontSize: 16, lineHeight: 1.8, maxWidth: 640, margin: "0 auto 24px" }}>
            {t("heroDesc")}
          </p>

          {/* LP Banner */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 12,
            background: `${DS.cyan}10`, border: `1px solid ${DS.cyan}40`,
            borderRadius: 12, padding: "10px 20px",
          }}>
            <Zap size={16} style={{ color: DS.cyan }} />
            <span style={{ color: DS.text, fontSize: 13, fontFamily: DS.mono }}>
              {t("lpBalance")}
            </span>
            <span style={{ color: DS.cyan, fontFamily: DS.mono, fontWeight: 800, fontSize: 16 }}>
              {USER_LP.toLocaleString()} LP
            </span>
            <Link href={`/${locale}`} style={{ color: DS.blue, fontSize: 12, fontFamily: DS.mono, display: "flex", alignItems: "center", gap: 4 }}>
              {t("recharge")} <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured */}
      {featured && (
        <section style={{ padding: "0 24px 32px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <Link href={`/${locale}/academy/${featured.slug}`} style={{ textDecoration: "none" }}>
              <motion.div
                whileHover={{ scale: 1.005 }}
                style={{ background: GRD.primary, borderRadius: 20, overflow: "hidden", display: "flex", minHeight: 220 }}
              >
                {featured.image && (
                  <div className="featured-img-wrap" style={{ width: 360, flexShrink: 0, overflow: "hidden", background: DS.bgCard2 }}>
                    <img src={featured.image} alt={featured.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}
                <div style={{ flex: 1, padding: "32px 40px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <span style={{ background: "rgba(255,255,255,0.2)", color: "#fff", padding: "3px 12px", borderRadius: 9999, fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>{t("featuredBadge")}</span>
                    {featured.lpReward && (
                      <span style={{ background: `${DS.cyan}30`, color: DS.cyan, padding: "3px 12px", borderRadius: 9999, fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>
                        +{featured.lpReward} LP
                      </span>
                    )}
                  </div>
                  <h2 style={{ fontFamily: DS.heading, fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 8 }}>{featured.title}</h2>
                  <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, marginBottom: 16, lineHeight: 1.7 }}>{featured.shortDescription}</p>
                  <div style={{ display: "flex", gap: 20 }}>
                    <span style={{ color: DS.amber, fontFamily: DS.mono, fontSize: 13, fontWeight: 800 }}>★ {featured.rating} ({featured.reviews} {t("reviews")})</span>
                    <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: DS.mono }}>{featured.totalStudents?.toLocaleString()} {t("students")}</span>
                    <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: DS.mono }}>{featured.lectureCount} {t("lessons")}</span>
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>
        </section>
      )}

      {/* Learning Paths */}
      <section style={{ padding: "0 24px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontFamily: DS.heading, fontSize: 22, fontWeight: 800, color: DS.text, letterSpacing: "0.04em", marginBottom: 4 }}>{t("learningPaths")}</h2>
            <p style={{ color: DS.text4, fontSize: 13 }}>{t("learningPathsDesc")}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {PATHS.map((path, i) => {
              const Icon = path.icon;
              return (
                <motion.div
                  key={path.slug}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -4 }}
                  style={{
                    background: path.gradient, border: `1px solid ${path.border}`,
                    borderRadius: 16, padding: 20,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${path.color}20`, display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <Icon size={20} style={{ color: path.color }} />
                    </div>
                    <div>
                      <h3 style={{ color: DS.text, fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{path.title}</h3>
                      <p style={{ color: DS.text4, fontSize: 12 }}>{path.description}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {path.courses.map((slug) => {
                      const c = MOCK_COURSES.find((mc) => mc.slug === slug);
                      return c ? (
                        <span key={slug} style={{ background: `${path.color}15`, border: `1px solid ${path.color}40`, color: path.color, padding: "2px 8px", borderRadius: 6, fontSize: 10, fontFamily: DS.mono }}>
                          {c.title.split(" ")[0]}
                        </span>
                      ) : null;
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section style={{ padding: "0 24px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ position: "relative", flex: "1 1 200px" }}>
              <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: DS.text4 }} />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12,
                  padding: "10px 12px 10px 38px", color: DS.text, fontSize: 14, outline: "none",
                  fontFamily: DS.body, boxSizing: "border-box",
                }}
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
                    background: cat === c ? `${DS.blue}15` : "transparent",
                    color: cat === c ? DS.blue : DS.text4,
                    fontSize: 12, fontFamily: DS.mono, fontWeight: cat === c ? 700 : 400,
                    cursor: "pointer",
                  }}
                >
                  {c === "" ? t("filterAll") : c}
                </button>
              ))}
            </div>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              style={{
                background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10,
                padding: "8px 12px", color: DS.text3, fontSize: 13, cursor: "pointer", fontFamily: DS.mono,
              }}
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>{l === "" ? t("filterAllLevel") : LEVEL_VN[l] ?? l}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Course Grid */}
      <section style={{ padding: "0 24px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "5rem", color: DS.text4 }}>
              <BookOpen size={36} style={{ marginBottom: 16, opacity: 0.4 }} />
              <p style={{ fontSize: 16, fontFamily: DS.mono }}>{t("emptyState")}</p>
              <p style={{ fontSize: 13, color: DS.text5, marginTop: 8 }}>{t("emptyStateHint")}</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 16 }}>
              {filtered.map((course, i) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  locale={locale}
                  index={i}
                  onEnroll={setEnrolling}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Instructors */}
      <section style={{ padding: "48px 24px", background: `${DS.bgCard}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h2 style={{ fontFamily: DS.heading, fontSize: 26, fontWeight: 800, color: DS.text, letterSpacing: "0.04em", marginBottom: 8 }}>{t("instructors")}</h2>
            <p style={{ color: DS.text4, fontSize: 14 }}>{t("instructorsDesc")}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {INSTRUCTORS.map((ins) => (
              <InstructorCard key={ins.id} ins={ins} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "48px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <h2 style={{ fontFamily: DS.heading, fontSize: 26, fontWeight: 800, color: DS.text, letterSpacing: "0.04em", marginBottom: 8 }}>{t("faqTitle")}</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FAQS.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{
        padding: "64px 24px",
        background: `linear-gradient(180deg, transparent 0%, rgba(59,130,246,0.04) 100%)`,
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <Award size={40} style={{ color: DS.blue, margin: "0 auto 16px" }} />
          <h2 style={{ fontFamily: DS.heading, fontSize: 28, fontWeight: 800, color: DS.text, marginBottom: 12 }}>
            {t("ctaReady")}
          </h2>
          <p style={{ color: DS.text3, fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
            {t("ctaDesc")}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href={`/${locale}`} style={{ textDecoration: "none" }}>
              <button style={{
                padding: "12px 28px", background: GRD.primary, color: "#fff",
                border: "none", borderRadius: 12, fontFamily: DS.mono, fontWeight: 700, fontSize: 14,
                cursor: "pointer",
              }}>
                {t("exploreCourses")}
              </button>
            </Link>
            <Link href={`/${locale}/khach-hang`} style={{ textDecoration: "none" }}>
              <button style={{
                padding: "12px 28px", background: "transparent", color: DS.text,
                border: `1px solid ${DS.border}`, borderRadius: 12,
                fontFamily: DS.mono, fontWeight: 700, fontSize: 14, cursor: "pointer",
              }}>
                {t("myDashboard")}
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Payment Modal */}
      <AnimatePresence>
        {enrolling && (
          <PaymentModal course={enrolling} onClose={() => setEnrolling(null)} />
        )}
      </AnimatePresence>
    </main>
    </AcademyI18nProvider>
  );
}
