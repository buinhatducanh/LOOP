"use client";

/**
 * CareersClient — LOOP Solutions Careers Page
 * Lists open job postings with filter, expandable application form.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin, DollarSign, Briefcase, ChevronDown, ChevronUp,
  Send, CheckCircle2, Clock, Users, X, ExternalLink,
} from "lucide-react";
import { DS, GRD } from "@/lib/design-tokens";

interface JobPosting {
  id: string;
  title: string;
  department: string;
  role: string;
  employmentType: string;
  location: string;
  salaryLabel: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  description: string | null;
  descEn: string | null;
  requirements: string | null;
  reqEn: string | null;
  benefits: string | null;
  benEn: string | null;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  _count?: { applications: number };
}

const DEPT_COLORS: Record<string, string> = {
  engineering: "#3B82F6",
  design: "#A78BFA",
  media: "#EC4899",
  marketing: "#F59E0B",
  sales: "#22C55E",
  finance: "#14B8A6",
  hr: "#6366F1",
  management: "#EAB308",
};

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: "Toàn thời gian",
  part_time: "Bán thời gian",
  contract: "Hợp đồng",
  internship: "Thực tập",
};

const EMPLOYMENT_TYPE_LABELS_EN: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
};

const ROLE_LABELS: Record<string, string> = {
  junior: "Junior",
  mid: "Mid-level",
  senior: "Senior",
  lead: "Lead",
  manager: "Manager",
};

function SalaryDisplay({ posting }: { posting: JobPosting }) {
  if (!posting.salaryMin && !posting.salaryMax) return null;
  const fmt = (n: number) => `${(n / 1_000_000).toFixed(0)}M`;
  const label = posting.salaryMin && posting.salaryMax
    ? `${fmt(posting.salaryMin)} – ${fmt(posting.salaryMax)}M`
    : posting.salaryMin
    ? `Từ ${fmt(posting.salaryMin)}M`
    : `Đến ${fmt(posting.salaryMax!)}M`;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: DS.gold, fontSize: "0.8125rem", fontWeight: 600 }}>
      <span style={{ fontSize: "0.75rem" }}>💰</span>
      {label}
    </div>
  );
}

// ── Application form ──────────────────────────────────────────────────────────

function ApplicationForm({
  posting,
  locale,
  onClose,
}: {
  posting: JobPosting;
  locale: string;
  onClose: () => void;
}) {
  const t = (key: string) => key; // Use inline since this is not a hook usage
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    linkedinUrl: "",
    portfolioUrl: "",
    coverLetter: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/job-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobPostingId: posting.id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "submit failed");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: DS.bgCard2,
    border: `1px solid ${DS.border}`,
    borderRadius: 10,
    padding: "0.75rem 1rem",
    color: DS.text,
    fontSize: "0.875rem",
    outline: "none",
    fontFamily: "'Inter', sans-serif",
    boxSizing: "border-box",
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          padding: "2rem",
          textAlign: "center",
          borderTop: `1px solid ${DS.border}`,
          marginTop: "1rem",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
        <h3 style={{ color: DS.green, fontFamily: DS.heading, fontSize: "1.125rem", marginBottom: "0.5rem" }}>
          Đơn ứng tuyển đã được gửi!
        </h3>
        <p style={{ color: DS.text3, fontSize: "0.875rem" }}>
          Chúng tôi sẽ liên hệ trong 5-7 ngày làm việc.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      style={{ overflow: "hidden" }}
    >
      <div
        style={{
          padding: "1rem 1.5rem 1.5rem",
          borderTop: `1px solid ${DS.border}`,
          marginTop: "1rem",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.75rem",
        }}
      >
        {/* Name */}
        <div>
          <label style={{ color: DS.text3, fontSize: "0.75rem", display: "block", marginBottom: "0.25rem" }}>Họ và tên *</label>
          <input
            style={inputStyle}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            placeholder="Nguyễn Văn A"
          />
        </div>
        {/* Email */}
        <div>
          <label style={{ color: DS.text3, fontSize: "0.75rem", display: "block", marginBottom: "0.25rem" }}>Email *</label>
          <input
            style={inputStyle}
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            placeholder="email@example.com"
          />
        </div>
        {/* Phone */}
        <div>
          <label style={{ color: DS.text3, fontSize: "0.75rem", display: "block", marginBottom: "0.25rem" }}>Số điện thoại</label>
          <input
            style={inputStyle}
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="0912 345 678"
          />
        </div>
        {/* LinkedIn */}
        <div>
          <label style={{ color: DS.text3, fontSize: "0.75rem", display: "block", marginBottom: "0.25rem" }}>LinkedIn URL</label>
          <input
            style={inputStyle}
            value={form.linkedinUrl}
            onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
            placeholder="https://linkedin.com/in/..."
          />
        </div>
        {/* Portfolio */}
        <div style={{ gridColumn: "1/-1" }}>
          <label style={{ color: DS.text3, fontSize: "0.75rem", display: "block", marginBottom: "0.25rem" }}>Portfolio URL</label>
          <input
            style={inputStyle}
            value={form.portfolioUrl}
            onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })}
            placeholder="https://yourportfolio.com"
          />
        </div>
        {/* Cover letter */}
        <div style={{ gridColumn: "1/-1" }}>
          <label style={{ color: DS.text3, fontSize: "0.75rem", display: "block", marginBottom: "0.25rem" }}>Thư giới thiệu</label>
          <textarea
            style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
            value={form.coverLetter}
            onChange={(e) => setForm({ ...form, coverLetter: e.target.value })}
            placeholder="Giới thiệu ngắn về bản thân và tại sao bạn muốn gia nhập LOOP..."
          />
        </div>
        {error && (
          <div style={{ gridColumn: "1/-1", color: DS.red, fontSize: "0.8125rem", padding: "0.5rem", background: `${DS.red}10`, borderRadius: 8, border: `1px solid ${DS.red}20` }}>
            {error}
          </div>
        )}
        <div style={{ gridColumn: "1/-1", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "0.625rem 1.25rem",
              borderRadius: 10,
              background: "rgba(30,40,60,0.6)",
              border: `1px solid ${DS.border}`,
              color: DS.text3,
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: "0.625rem 1.5rem",
              borderRadius: 10,
              background: submitting ? `${DS.pink}60` : GRD.primary,
              border: "none",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.875rem",
              cursor: submitting ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            {submitting ? (
              <>Đang gửi...</>
            ) : (
              <>
                <Send size={14} />
                Gửi đơn ứng tuyển
              </>
            )}
          </button>
        </div>
      </div>
    </motion.form>
  );
}

// ── Job card ──────────────────────────────────────────────────────────────────

function JobCard({ posting, locale }: { posting: JobPosting; locale: string }) {
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const deptColor = DEPT_COLORS[posting.department] ?? DS.pink;
  const typeLabel = EMPLOYMENT_TYPE_LABELS[posting.employmentType] ?? posting.employmentType;
  const roleLabel = ROLE_LABELS[posting.role] ?? posting.role;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        borderRadius: "1.25rem",
        background: "rgba(15,23,42,0.65)",
        border: `1px solid ${DS.border}`,
        overflow: "hidden",
        transition: "border-color 0.2s",
      }}
    >
      {/* Card header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%",
          padding: "1.25rem 1.5rem",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        {/* Dept badge */}
        <div
          style={{
            padding: "4px 10px",
            borderRadius: 20,
            background: `${deptColor}15`,
            border: `1px solid ${deptColor}30`,
            color: deptColor,
            fontSize: "0.625rem",
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            flexShrink: 0,
          }}
        >
          {posting.department}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              color: DS.text,
              fontWeight: 700,
              fontSize: "0.9375rem",
              fontFamily: DS.heading,
              marginBottom: "0.25rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {posting.title}
          </div>
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
              color: DS.text4,
              fontSize: "0.6875rem",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <Briefcase size={10} /> {roleLabel}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <MapPin size={10} /> {posting.location}
            </span>
            {posting._count?.applications !== undefined && (
              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <Users size={10} /> {posting._count.applications} ứng viên
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
          <SalaryDisplay posting={posting} />
          <div
            style={{
              padding: "3px 10px",
              borderRadius: 20,
              background: `${DS.pink}15`,
              color: DS.pink,
              fontSize: "0.625rem",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 600,
            }}
          >
            {typeLabel}
          </div>
          {expanded ? (
            <ChevronUp size={16} style={{ color: DS.text4 }} />
          ) : (
            <ChevronDown size={16} style={{ color: DS.text4 }} />
          )}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 1.5rem 1.5rem", borderTop: `1px solid ${DS.border}`, paddingTop: "1rem" }}>
              {posting.description && (
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ color: DS.text4, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", marginBottom: "0.375rem" }}>MÔ TẢ</div>
                  <div style={{ color: DS.text2, fontSize: "0.875rem", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {posting.description}
                  </div>
                </div>
              )}
              {posting.requirements && (
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ color: DS.text4, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", marginBottom: "0.375rem" }}>YÊU CẦU</div>
                  <div style={{ color: DS.text2, fontSize: "0.875rem", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {posting.requirements}
                  </div>
                </div>
              )}
              {posting.benefits && (
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ color: DS.text4, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", marginBottom: "0.375rem" }}>PHÚC LỢI</div>
                  <div style={{ color: DS.text2, fontSize: "0.875rem", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {posting.benefits}
                  </div>
                </div>
              )}
              <button
                onClick={() => setShowForm(!showForm)}
                style={{
                  padding: "0.625rem 1.5rem",
                  borderRadius: 10,
                  background: showForm ? "rgba(30,40,60,0.6)" : GRD.primary,
                  border: showForm ? `1px solid ${DS.border}` : "none",
                  color: showForm ? DS.text3 : "#fff",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <Send size={14} />
                {showForm ? "Đóng form" : "Ứng tuyển ngay"}
              </button>
            </div>
            <AnimatePresence>
              {showForm && (
                <ApplicationForm posting={posting} locale={locale} onClose={() => setShowForm(false)} />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────────

export function CareersClient({ locale }: { locale: string }) {
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDept, setFilterDept] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");
  const departments = ["all", ...Array.from(new Set(postings.map((p) => p.department)))];
  const roles = ["all", ...Array.from(new Set(postings.map((p) => p.role)))];

  useEffect(() => {
    fetch(`/api/job-postings?lang=${locale}`)
      .then((r) => r.json())
      .then((d) => {
        setPostings(d.data ?? []);
      })
      .finally(() => setLoading(false));
  }, [locale]);

  const filtered = postings.filter(
    (p) => (filterDept === "all" || p.department === filterDept) &&
            (filterRole === "all" || p.role === filterRole)
  );

  const roleLabel = (r: string) => ROLE_LABELS[r] ?? r;

  return (
    <div style={{ minHeight: "100vh", background: DS.bg }}>
      {/* Hero */}
      <div
        style={{
          padding: "5rem 1.5rem 4rem",
          textAlign: "center",
          background: GRD.cosmicBg2,
          borderBottom: `1px solid ${DS.border}`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(107,61,245,0.2) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", maxWidth: 720, margin: "0 auto" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "6px 14px",
              borderRadius: 20,
              background: `${DS.pink}15`,
              border: `1px solid ${DS.pink}30`,
              color: DS.pinkLight,
              fontSize: "0.6875rem",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.1em",
              marginBottom: "1.5rem",
            }}
          >
            <Users size={11} />
            TUYỂN DỤNG
          </div>
          <h1
            style={{
              color: DS.text,
              fontFamily: DS.heading,
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: "1rem",
              background: `linear-gradient(135deg, #fff 0%, ${DS.cosmicPurple} 50%, ${DS.pink} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Gia nhập LOOP Solutions
          </h1>
          <p
            style={{
              color: DS.text3,
              fontSize: "1.0625rem",
              lineHeight: 1.6,
              maxWidth: 560,
              margin: "0 auto",
            }}
          >
            Chúng tôi đang tìm kiếm những người đam mê công nghệ, muốn phát triển cùng một công ty tăng trưởng 200% mỗi năm.
          </p>
          {/* Stats row */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "2rem",
              marginTop: "2rem",
              flexWrap: "wrap",
            }}
          >
            {[
              { value: "27+", label: "Thành viên" },
              { value: "5", label: "Phòng ban" },
              { value: "200%", label: "Tăng trưởng/năm" },
            ].map((stat) => (
              <div key={stat.label} style={{ textAlign: "center" }}>
                <div style={{ color: DS.pink, fontSize: "1.5rem", fontWeight: 900, fontFamily: DS.heading }}>{stat.value}</div>
                <div style={{ color: DS.text4, fontSize: "0.6875rem", fontFamily: "'JetBrains Mono', monospace" }}>{stat.label.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            marginBottom: "2rem",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setFilterDept(dept)}
                style={{
                  padding: "0.375rem 0.875rem",
                  borderRadius: 20,
                  background: filterDept === dept ? (dept === "all" ? GRD.primary : `${DEPT_COLORS[dept] ?? DS.pink}20`) : "rgba(30,40,60,0.6)",
                  border: `1px solid ${filterDept === dept ? (dept === "all" ? "transparent" : DEPT_COLORS[dept] ?? DS.pink) : DS.border}`,
                  color: filterDept === dept ? "#fff" : DS.text3,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {dept === "all" ? "Tất cả" : dept}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {roles.map((r) => (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                style={{
                  padding: "0.375rem 0.875rem",
                  borderRadius: 20,
                  background: filterRole === r ? DS.cosmicPurple + "20" : "rgba(30,40,60,0.6)",
                  border: `1px solid ${filterRole === r ? DS.cosmicPurple : DS.border}`,
                  color: filterRole === r ? DS.cosmicPurple : DS.text3,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {r === "all" ? "Tất cả cấp bậc" : roleLabel(r)}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        <div style={{ color: DS.text4, fontSize: "0.75rem", fontFamily: "'JetBrains Mono', monospace", marginBottom: "1rem" }}>
          {filtered.length} vị trí đang tuyển
        </div>

        {/* Cards */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem", color: DS.text4 }}>Đang tải...</div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: "center", padding: "4rem 2rem" }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>💼</div>
            <h3 style={{ color: DS.text, fontFamily: DS.heading, marginBottom: "0.5rem" }}>Hiện tại chưa có vị trí mở</h3>
            <p style={{ color: DS.text3, fontSize: "0.875rem" }}>Hãy gửi CV của bạn — chúng tôi sẽ liên hệ khi có vị trí phù hợp!</p>
          </motion.div>
        ) : (
          <motion.div layout style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {filtered.map((posting) => (
              <JobCard key={posting.id} posting={posting} locale={locale} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
