"use client";

/**
 * Completed Projects Admin Page — LOOP Solutions
 * Route: /admin/projects_completed
 *
 * Full CRUD for completed portfolio projects.
 * Detail modal with 5 tabs: Info / Content / Demo / Metrics / Testimonial
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import {
  Plus, Edit3, Trash2, X, Save, Star,
  Users, Clock, DollarSign, Check,
  ToggleLeft, ToggleRight, RefreshCw, Search,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────

type PortfolioProject = {
  id: string;
  title: string;
  tag: string;
  cat: string;
  client: string;
  color: string;
  img: string;
  year: string;
  duration: string;
  budget: string;
  budgetNum: number;
  team: string;
  status: string;
  metric1: string;
  m1label: string;
  metric2: string;
  m2label: string;
  metric3: string;
  m3label: string;
  challenge: string;
  solution: string;
  result: string;
  tags: string[];
  features: string[];
  lp: number;
  hasDemo: boolean;
  demoUrl: string;
  maskedUrl: string;
  demoTitle: string;
  featured: boolean;
  publishedAt: string;
  testimonialName?: string;
  testimonialText?: string;
  testimonialStars?: number;
  testimonialRole?: string;
};

// ── Formatters ────────────────────────────────────────────────────────

const _fmtVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(n);

const _fmtB = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(0)}M` :
  n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : String(n);

const _fmtDate = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("vi-VN"); }
  catch { return String(d); }
};

// ── Mock data ──────────────────────────────────────────────────────

const MOCK_PROJECTS: PortfolioProject[] = [
  { id: "p1", title: "VNRetail Platform v3", tag: "SaaS", cat: "SaaS", client: "VNRetail JSC", color: DS.blue, img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80", year: "2026", duration: "4 tháng", budget: "175M VNĐ", budgetNum: 175_000_000, team: "Akira, Ryo, Mei", status: "completed", metric1: "180%", m1label: "Tăng trưởng", metric2: "3 ngày", m2label: "Deploy nhanh", metric3: "99.9%", m3label: "Uptime", challenge: "Hệ thống cũ chậm, không scale được. Tech debt lớn.", solution: "Refactor to microservices + Kubernetes auto-scaling.", result: "Tăng 180% conversion, giảm 60% load time.", tags: ["React", "Node.js", "PostgreSQL"], features: ["Dashboard analytics", "Quản lý kho", "POS integration", "Báo cáo real-time", "Multi-tenant"], lp: 4500, hasDemo: true, demoUrl: "https://demo.loop-solutions.vn/vnretail", maskedUrl: "demo.loop.vn/vnretail-v3", demoTitle: "VNRetail Platform v3 — Live Demo", featured: true, publishedAt: "2026-02-15" },
  { id: "p2", title: "MedApp Vietnam", tag: "App", cat: "App", client: "HealthTech VN", color: DS.purple, img: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80", year: "2026", duration: "6 tháng", budget: "220M VNĐ", budgetNum: 220_000_000, team: "Yuna, Kai, Shin", status: "completed", metric1: "50K+", m1label: "Downloads", metric2: "4.8★", m2label: "App Store", metric3: "35%", m3label: "Retention", challenge: "Ứng dụng telemedicine mới, cần tuân thủ HIPAA-equivalent regulations.", solution: "React Native + Node.js backend + encrypted patient data storage.", result: "Launch thành công, 50K+ downloads trong tháng đầu.", tags: ["React Native", "Node.js", "Encryption"], features: ["Telemedicine", "E-prescription", "Lịch hẹn", "HMS integration", "Analytics"], lp: 6200, hasDemo: true, demoUrl: "https://demo.loop-solutions.vn/medapp", maskedUrl: "demo.loop.vn/medapp-health", demoTitle: "MedApp Vietnam — Live Demo", featured: true, publishedAt: "2026-01-20" },
  { id: "p3", title: "FinDash Enterprise", tag: "Dashboard", cat: "SaaS", client: "FinCorp Vietnam", color: DS.green, img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80", year: "2025", duration: "3 tháng", budget: "300M VNĐ", budgetNum: 300_000_000, team: "Rin, Hana, Kenji", status: "completed", metric1: "500M+", m1label: "Data points", metric2: "2s", m2label: "Report gen", metric3: "15 người", m3label: "Concurrent users", challenge: "Dashboard tài chính phức tạp, cần real-time data từ nhiều nguồn.", solution: "WebSocket + aggregation pipeline + Redis caching layer.", result: "Giảm 80% thời gian báo cáo, tăng 3x năng suất phân tích.", tags: ["Next.js", "D3.js", "Redis"], features: ["Real-time charts", "Multi-source data", "Alerting", "Export PDF/Excel", "Role-based access"], lp: 3800, hasDemo: false, demoUrl: "", maskedUrl: "", demoTitle: "", featured: false, publishedAt: "2025-11-10" },
  { id: "p4", title: "EduViet Portal", tag: "Website", cat: "Website", client: "EduViet Foundation", color: DS.amber, img: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80", year: "2025", duration: "2 tháng", budget: "75M VNĐ", budgetNum: 75_000_000, team: "Mei, Sakura", status: "completed", metric1: "3,200", m1label: "Học viên", metric2: "92%", m2label: "Satisfaction", metric3: "15", m3label: "Courses", challenge: "Portal học online cần LMS tích hợp với payment gateway.", solution: "Next.js + Prisma + Stripe integration + Zoom SDK.", result: "3,200 học viên đăng ký trong 2 tuần đầu.", tags: ["Next.js", "LMS", "Stripe"], features: ["Course player", "Payment gateway", "Certificates", "Progress tracking"], lp: 2200, hasDemo: true, demoUrl: "https://demo.loop-solutions.vn/edu", maskedUrl: "demo.loop.vn/edu-portal", demoTitle: "EduViet Portal — Live Demo", featured: false, publishedAt: "2025-09-05" },
];

const CAT_COLORS: Record<string, string> = {
  SaaS: DS.blue, App: DS.purple, Website: DS.green,
};

// ── Project Detail Modal ────────────────────────────────────────────

function ProjectDetailModal({ project, onClose, onSave }: {
  project: PortfolioProject;
  onClose: () => void;
  onSave: (data: Partial<PortfolioProject>) => void;
}) {
  const [draft, setDraft] = useState({ ...project });
  const [activeTab, setActiveTab] = useState<"info" | "content" | "demo" | "metrics" | "testimonial">("info");

  const tabs = [
    { id: "info" as const, label: "Thông tin" },
    { id: "content" as const, label: "Nội dung" },
    { id: "demo" as const, label: "Demo" },
    { id: "metrics" as const, label: "Metrics" },
    { id: "testimonial" as const, label: "Testimonial" },
  ];

  const field = (label: string, value: string, key: string, type = "text", multi = false) => (
    <div>
      <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: 5, letterSpacing: "0.1em" }}>{label}</label>
      {multi ? (
        <textarea value={value} onChange={e => setDraft({ ...draft, [key]: e.target.value })} rows={3}
          style={{ width: "100%", background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "8px 12px", color: DS.text, fontSize: 12, outline: "none", resize: "vertical", boxSizing: "border-box" as const, fontFamily: DS.body }} />
      ) : (
        <input type={type === "number" ? "number" : "text"} value={value} onChange={e => setDraft({ ...draft, [key]: type === "number" ? Number(e.target.value) : e.target.value })}
          style={{ width: "100%", background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "8px 12px", color: DS.text, fontSize: 13, outline: "none", boxSizing: "border-box" as const }} />
      )}
    </div>
  );

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1rem", background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)",
    }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        style={{
          width: "100%", maxWidth: "48rem", borderRadius: "1rem", overflow: "hidden",
          background: DS.bgCard, border: `1px solid ${DS.border}`,
          maxHeight: "90vh", display: "flex", flexDirection: "column",
        }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem", flexShrink: 0, borderBottom: `1px solid ${DS.border}` }}>
          <div>
            <div style={{ color: DS.text, fontSize: 15, fontWeight: 700 }}>{draft.id === "new" ? "Thêm dự án mới" : "Chi tiết dự án"}</div>
            <div style={{ color: DS.text4, fontSize: 12, marginTop: 2 }}>{draft.title} · {draft.client}</div>
          </div>
          <button onClick={onClose} style={{ color: DS.text4, background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.25rem", padding: "0.75rem 1.25rem 0", flexShrink: 0 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{
                padding: "6px 14px", borderRadius: "8px 8px 0 0", border: "none",
                background: activeTab === t.id ? DS.bgCard2 : "transparent",
                color: activeTab === t.id ? DS.text : DS.text4, fontSize: 12, cursor: "pointer",
                fontWeight: activeTab === t.id ? 700 : 400,
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {activeTab === "info" && (
            <>
              {field("TIÊU ĐỀ DỰ ÁN", draft.title, "title")}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                {field("KHÁCH HÀNG", draft.client, "client")}
                {field("TAG", draft.tag, "tag")}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: 5 }}>DANH MỤC</label>
                  <select value={draft.cat} onChange={e => setDraft({ ...draft, cat: e.target.value })}
                    style={{ width: "100%", background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "8px 12px", color: DS.text, fontSize: 13, outline: "none", cursor: "pointer" }}>
                    {["SaaS", "App", "Website"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {field("NĂM", draft.year, "year")}
                {field("THỜI GIAN", draft.duration, "duration")}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                {field("NGÂN SÁCH", String(draft.budgetNum), "budgetNum", "number")}
                {field("TEAM", draft.team, "team")}
                {field("MÀU SẮC", draft.color, "color")}
              </div>
              {field("URL ẢNH", draft.img, "img")}
              {draft.img && (
                <div style={{ borderRadius: 10, overflow: "hidden", height: 120 }}>
                  <img src={draft.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}
              <div>
                <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: 5 }}>TAGS (phẩy phân cách)</label>
                <input value={draft.tags.join(", ")} onChange={e => setDraft({ ...draft, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
                  style={{ width: "100%", background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "8px 12px", color: DS.text, fontSize: 13, outline: "none", boxSizing: "border-box" as const }} />
              </div>
              <div>
                <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: 5 }}>FEATURED (hiển thị nổi bật)</label>
                <button onClick={() => setDraft({ ...draft, featured: !draft.featured })}
                  style={{ color: draft.featured ? DS.green : DS.text5, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                  {draft.featured ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  {draft.featured ? "Đang bật" : "Tắt"}
                </button>
              </div>
            </>
          )}

          {activeTab === "content" && (
            <>
              {field("THÁCH THỨC (Challenge)", draft.challenge, "challenge", "text", true)}
              {field("GIẢI PHÁP (Solution)", draft.solution, "solution", "text", true)}
              {field("KẾT QUẢ (Result)", draft.result, "result", "text", true)}
              {field("LP THƯỞNG", String(draft.lp), "lp", "number")}
              {field("NGÀY XUẤT BẢN", draft.publishedAt, "publishedAt")}
            </>
          )}

          {activeTab === "demo" && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem", background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10 }}>
                <span style={{ color: DS.text3, fontSize: 12 }}>Có Demo</span>
                <button onClick={() => setDraft({ ...draft, hasDemo: !draft.hasDemo })}
                  style={{ color: draft.hasDemo ? DS.green : DS.text5, background: "none", border: "none", cursor: "pointer" }}>
                  {draft.hasDemo ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                </button>
              </div>
              {draft.hasDemo && (
                <>
                  {field("DEMO URL (gốc)", draft.demoUrl, "demoUrl")}
                  {field("MASKED URL (hiển thị)", draft.maskedUrl, "maskedUrl")}
                  {field("TIÊU ĐỀ DEMO", draft.demoTitle, "demoTitle")}
                </>
              )}
            </>
          )}

          {activeTab === "metrics" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                {field("METRIC 1 (giá trị)", draft.metric1, "metric1")}
                {field("METRIC 1 (label)", draft.m1label, "m1label")}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                {field("METRIC 2 (giá trị)", draft.metric2, "metric2")}
                {field("METRIC 2 (label)", draft.m2label, "m2label")}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                {field("METRIC 3 (giá trị)", draft.metric3, "metric3")}
                {field("METRIC 3 (label)", draft.m3label, "m3label")}
              </div>
            </>
          )}

          {activeTab === "testimonial" && (
            <div style={{ padding: "0.75rem", background: "rgba(245,158,11,0.06)", border: `1px solid rgba(245,158,11,0.15)`, borderRadius: 10 }}>
              <div style={{ color: DS.amber, fontSize: 11, fontFamily: DS.mono, marginBottom: 12 }}>TESTIMONIAL KHÁCH HÀNG</div>

              {/* Author name */}
              <div style={{ marginBottom: 10 }}>
                <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>TÊN KHÁCH HÀNG</label>
                <input value={draft.testimonialName ?? ""} onChange={e => setDraft({ ...draft, testimonialName: e.target.value })}
                  placeholder="VD: Nguyễn Văn A"
                  style={{ width: "100%", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "8px 10px", color: DS.text, fontSize: 12, outline: "none", boxSizing: "border-box" as const }} />
              </div>

              {/* Stars */}
              <div style={{ marginBottom: 10 }}>
                <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>SỐ SAO ({draft.testimonialStars ?? 5})</label>
                <div style={{ display: "flex", gap: 4 }}>
                  {[5, 4, 3, 2, 1].map(s => (
                    <button key={s} onClick={() => setDraft({ ...draft, testimonialStars: s })}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18,
                        color: s <= (draft.testimonialStars ?? 5) ? "#F59E0B" : DS.text5, padding: 0 }}>
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Role */}
              <div style={{ marginBottom: 10 }}>
                <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>CHỨC VỤ / CÔNG TY</label>
                <input value={draft.testimonialRole ?? ""} onChange={e => setDraft({ ...draft, testimonialRole: e.target.value })}
                  placeholder="VD: CEO, VNRetail JSC"
                  style={{ width: "100%", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "8px 10px", color: DS.text, fontSize: 12, outline: "none", boxSizing: "border-box" as const }} />
              </div>

              {/* Testimonial text */}
              <div style={{ marginBottom: 10 }}>
                <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: "block", marginBottom: 4 }}>NỘI DUNG TESTIMONIAL</label>
                <textarea value={draft.testimonialText ?? ""} onChange={e => setDraft({ ...draft, testimonialText: e.target.value })}
                  placeholder="Nhập lời testimonials của khách hàng..."
                  rows={4}
                  style={{ width: "100%", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "8px 10px", color: DS.text, fontSize: 12, outline: "none", resize: "vertical", boxSizing: "border-box" as const }} />
              </div>

              {draft.testimonialText && (
                <div style={{ background: "rgba(245,158,11,0.08)", border: `1px solid rgba(245,158,11,0.2)`, borderRadius: 10, padding: "0.75rem", marginTop: 4 }}>
                  <div style={{ color: "#F59E0B", fontSize: 14, marginBottom: 6 }}>
                    {"★".repeat(draft.testimonialStars ?? 5)}
                  </div>
                  <p style={{ color: DS.text3, fontSize: 12, fontStyle: "italic", lineHeight: 1.6, margin: 0 }}>
                    "{draft.testimonialText}"
                  </p>
                  {draft.testimonialName && (
                    <p style={{ color: DS.text4, fontSize: 11, marginTop: 8, fontWeight: 600 }}>
                      — {draft.testimonialName}{draft.testimonialRole ? ", " + draft.testimonialRole : ""}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: "0.75rem", padding: "1.25rem", flexShrink: 0, borderTop: `1px solid ${DS.border}` }}>
          <button onClick={onClose} style={{ flex: 1, background: "none", border: `1px solid ${DS.border}`, borderRadius: 10, padding: "10px", color: DS.text3, cursor: "pointer", fontSize: 13 }}>Hủy</button>
          <button onClick={() => onSave(draft)}
            style={{ flex: 2, background: GRD.primary, color: "#fff", border: "none", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Save size={12} />Lưu thay đổi
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────

export default function ProjectsCompletedPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Tất cả");
  const [detailProject, setDetailProject] = useState<PortfolioProject | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [projects, setProjects] = useState<PortfolioProject[]>(MOCK_PROJECTS);

  const cats = ["Tất cả", "SaaS", "App", "Website"];

  // Fetch from API
  const { data, isFetching } = useQuery({
    queryKey: ["admin", "projects", "completed"],
    queryFn: () => adminApi.get<{ data: PortfolioProject[] }>("/api/admin/projects", { params: { limit: 100, status: "done" } }),
  });

  const apiProjects = data?.data ?? [];
  const allProjects = apiProjects.length > 0 ? apiProjects : projects;

  const completed = allProjects.filter(p => p.status === "completed");
  const filtered = completed.filter(p =>
    (filterCat === "Tất cả" || p.cat === filterCat) &&
    (p.title.toLowerCase().includes(search.toLowerCase()) || p.client.toLowerCase().includes(search.toLowerCase()))
  );

  const totalBudget = completed.reduce((s, p) => s + p.budgetNum, 0);
  const totalLP = completed.reduce((s, p) => s + p.lp, 0);
  const featured = completed.filter(p => p.featured).length;

  const stats = [
    { label: "Dự án hoàn thành", value: String(completed.length), color: DS.green, icon: <Check size={16} /> },
    { label: "Tổng ngân sách", value: `${(totalBudget / 1e9).toFixed(1)}B₫`, color: DS.blue, icon: <DollarSign size={16} /> },
    { label: "LP đã thưởng", value: totalLP.toLocaleString(), color: DS.purple, icon: <Star size={16} /> },
    { label: "Dự án nổi bật", value: String(featured), color: DS.amber, icon: <Star size={16} /> },
  ];

  const handleSave = async (data: Partial<PortfolioProject>) => {
    if (detailProject?.id === "new") {
      const newProj = { ...detailProject, ...data, id: `p${Date.now()}` } as PortfolioProject;
      setProjects(prev => [...prev, newProj]);
    } else if (detailProject) {
      // Call API to persist testimonial fields
      try {
        await adminApi.patch(`/api/admin/projects/${detailProject.id}`, {
          testimonialName: data.testimonialName,
          testimonialText: data.testimonialText,
          testimonialStars: data.testimonialStars,
          testimonialRole: data.testimonialRole,
        });
      } catch (e) {
        // continue with local update
      }
      setProjects(prev => prev.map(p => p.id === detailProject.id ? { ...p, ...data } : p));
    }
    setDetailProject(null);
  };

  const handleDelete = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setDeleteId(null);
  };

  const newProject: PortfolioProject = {
    id: "new", title: "", tag: "", cat: "Website", client: "", color: DS.blue,
    img: "", year: "2026", duration: "", budget: "", budgetNum: 0, team: "",
    status: "completed", metric1: "", m1label: "", metric2: "", m2label: "",
    metric3: "", m3label: "", challenge: "", solution: "", result: "",
    tags: [], features: [], lp: 0, hasDemo: false, demoUrl: "", maskedUrl: "",
    demoTitle: "", featured: false, publishedAt: new Date().toISOString().split("T")[0],
  };

  return (
    <div style={{ padding: "2rem", minHeight: "100vh", background: DS.bgCosmic ?? "var(--figma-bg-cosmic, #09090b)", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.75rem" }}>
        {stats.map(s => (
          <motion.div key={s.label}
            style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1rem" }}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
              <span style={{ color: s.color, background: `${s.color}15`, borderRadius: 8, padding: "4px", display: "flex" }}>{s.icon}</span>
            </div>
            <div style={{ color: s.color, fontFamily: DS.heading, fontSize: 22, fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: DS.text3, fontSize: 12, marginTop: 4 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, flex: 1, minWidth: 200, background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <Search size={14} style={{ color: DS.text4, flexShrink: 0 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm dự án, khách hàng..."
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: DS.text, fontSize: 13, fontFamily: DS.body }} />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "8px 12px", color: DS.text3, fontSize: 12, outline: "none", cursor: "pointer" }}>
          {cats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={() => qc.invalidateQueries({ queryKey: ["admin", "projects", "completed"] })}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}>
          <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} /> Làm mới
        </button>
        <button onClick={() => setDetailProject(newProject)}
          style={{ background: GRD.primary, color: "#fff", border: "none", borderRadius: 10, padding: "8px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
          <Plus size={14} /> Thêm dự án
        </button>
      </div>

      {/* Project cards */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", color: DS.text4, background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>◎</div>
          <div style={{ fontSize: 13 }}>Không tìm thấy dự án phù hợp</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1rem" }}>
          {filtered.map((p, i) => {
            const cc = CAT_COLORS[p.cat] ?? DS.blue;
            return (
              <motion.div key={p.id}
                style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, overflow: "hidden" }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ borderColor: `${cc}40` }}>
                {/* Image */}
                <div style={{ position: "relative", height: 140 }}>
                  <img src={p.img} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent 40%, rgba(0,0,0,0.8))" }} />
                  {p.featured && (
                    <div style={{
                      position: "absolute", top: 8, right: 8, display: "flex", alignItems: "center", gap: 4, padding: "2px 8px",
                      background: "rgba(245,158,11,0.9)", borderRadius: 9999, fontSize: 9, color: "#000", fontWeight: 700,
                    }}>
                      <Star size={9} fill="#000" /> FEATURED
                    </div>
                  )}
                  <div style={{ position: "absolute", bottom: 12, left: 12, right: 12 }}>
                    <div style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>{p.title}</div>
                    <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>{p.client} · {p.year}</div>
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                    <span style={{ color: cc, fontSize: 10, fontFamily: DS.mono, background: `${cc}15`, border: `1px solid ${cc}30`, padding: "1px 6px", borderRadius: 4 }}>{p.cat}</span>
                    {p.tags.slice(0, 3).map(t => (
                      <span key={t} style={{ color: DS.text5, fontSize: 9, background: "rgba(255,255,255,0.04)", border: `1px solid ${DS.border}`, padding: "1px 5px", borderRadius: 3 }}>{t}</span>
                    ))}
                    {p.hasDemo && <span style={{ color: DS.green, fontSize: 9, fontFamily: DS.mono }}>● DEMO</span>}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem", color: DS.text4, fontSize: 11 }}>
                    <span><DollarSign size={10} style={{ display: "inline" }} /> {p.budget}</span>
                    <span><Clock size={10} style={{ display: "inline" }} /> {p.duration}</span>
                    <span><Users size={10} style={{ display: "inline" }} /> {p.team}</span>
                  </div>

                  {/* Metrics mini */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    {[
                      { v: p.metric1, l: p.m1label },
                      { v: p.metric2, l: p.m2label },
                      { v: p.metric3, l: p.m3label },
                    ].map((m, idx) => (
                      <div key={idx} style={{ padding: "0.5rem", background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 8, textAlign: "center" }}>
                        <div style={{ color: cc, fontSize: 13, fontWeight: 700, fontFamily: DS.mono }}>{m.v}</div>
                        <div style={{ color: DS.text5, fontSize: 8, marginTop: 2 }}>{m.l}</div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={() => setDetailProject(p)}
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", background: `${DS.blue}12`, border: `1px solid ${DS.blue}25`, color: DS.blue, fontSize: 11, borderRadius: 10, cursor: "pointer" }}>
                      <Edit3 size={11} /> Chi tiết & Sửa
                    </button>
                    <button onClick={() => setDeleteId(p.id)}
                      style={{ color: DS.red, background: `${DS.red}10`, border: `1px solid ${DS.red}20`, borderRadius: 10, padding: "8px 12px", cursor: "pointer" }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {detailProject && (
          <ProjectDetailModal
            project={detailProject}
            onClose={() => setDetailProject(null)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteId && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
          }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              style={{ padding: "1.5rem", borderRadius: "1rem", width: "100%", maxWidth: 320, background: DS.bgCard, border: `1px solid ${DS.red}40` }}>
              <div style={{ color: DS.text, fontSize: 15, fontWeight: 700, marginBottom: "0.5rem" }}>Xác nhận xóa dự án?</div>
              <div style={{ color: DS.text4, fontSize: 13, marginBottom: "1.25rem" }}>Dự án sẽ bị xóa khỏi portfolio. Thao tác không thể hoàn tác.</div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={() => setDeleteId(null)} style={{ flex: 1, background: "none", border: `1px solid ${DS.border}`, borderRadius: 10, padding: "10px", color: DS.text3, cursor: "pointer", fontSize: 13 }}>Hủy</button>
                <button onClick={() => handleDelete(deleteId)} style={{ flex: 1, background: DS.red, border: "none", borderRadius: 10, padding: "10px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Xóa</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
