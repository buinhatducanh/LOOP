"use client";

/**
 * ConsultationClient — LOOP Solutions Consultation Booking Page
 */
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, Phone, Mail, CheckCircle2, Send, MessageSquare, MapPin } from "lucide-react";
import { DS, GRD } from "@/lib/design-tokens";
import { CEO_CONTACT } from "@/lib/constants";

const SERVICES = [
  { value: "web", label: "Website & Web App" },
  { value: "mobile", label: "Mobile App / SaaS" },
  { value: "dashboard", label: "Dashboard & Analytics" },
  { value: "seo", label: "SEO & Content Marketing" },
  { value: "media", label: "Media Production" },
  { value: "academy", label: "Đào tạo nội bộ" },
  { value: "other", label: "Khác" },
];

const COMPANY_SIZES = [
  { value: "1-10", label: "1–10 nhân viên" },
  { value: "11-50", label: "11–50 nhân viên" },
  { value: "51-200", label: "51–200 nhân viên" },
  { value: "201+", label: "200+ nhân viên" },
];

const BENEFITS = [
  {
    icon: <Calendar size={22} />,
    color: DS.pink,
    title: "30 phút miễn phí",
    desc: "Gặp chuyên gia LOOP — không cam kết, không phí dịch vụ.",
  },
  {
    icon: <MessageSquare size={22} />,
    color: DS.cosmicPurple,
    title: "Giải đáp mọi thắc mắc",
    desc: "Từ chi phí, timeline, công nghệ đến chiến lược chuyển đổi số.",
  },
  {
    icon: <CheckCircle2 size={22} />,
    color: DS.green,
    title: "Báo giá chi tiết",
    desc: "Sau buổi tư vấn, bạn sẽ nhận được báo giá cụ thể cho dự án.",
  },
];

export function ConsultationClient({ locale }: { locale: string }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    companySize: "",
    service: "",
    message: "",
    preferredTime: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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

  return (
    <div style={{ minHeight: "100vh", background: DS.bg }}>
      {/* Hero */}
      <div
        style={{
          padding: "4rem 1.5rem 3rem",
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
            background: "radial-gradient(ellipse 50% 50% at 50% -10%, rgba(230,199,95,0.1) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", maxWidth: 700, margin: "0 auto" }}>
          <div
            style={{
              display: "inline-flex",
              padding: "6px 14px",
              borderRadius: 20,
              background: `${DS.gold}15`,
              border: `1px solid ${DS.gold}30`,
              color: DS.gold,
              fontSize: "0.6875rem",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.1em",
              marginBottom: "1.5rem",
            }}
          >
            TƯ VẤN MIỄN PHÍ
          </div>
          <h1
            style={{
              color: DS.text,
              fontFamily: DS.heading,
              fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: "0.875rem",
              background: `linear-gradient(135deg, #fff 0%, ${DS.gold} 60%, ${DS.pink} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Tư vấn miễn phí
          </h1>
          <p style={{ color: DS.text3, fontSize: "1rem", lineHeight: 1.6 }}>
            Gặp gỡ chuyên gia LOOP trong 30 phút — không cam kết, giải đáp mọi thắc mắc về chuyển đổi số.
          </p>
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "2.5rem 1.5rem",
          display: "grid",
          gridTemplateColumns: "1fr 360px",
          gap: "2.5rem",
          alignItems: "start",
        }}
      >
        {/* Form */}
        <div>
          <div
            style={{
              padding: "2rem",
              borderRadius: "1.5rem",
              background: "rgba(15,23,42,0.65)",
              border: `1px solid ${DS.border}`,
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            }}
          >
            <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: "1.125rem", marginBottom: "0.25rem" }}>
              Đặt lịch tư vấn
            </h2>
            <p style={{ color: DS.text4, fontSize: "0.8125rem", marginBottom: "1.5rem" }}>
              Chọn thông tin và chúng tôi sẽ liên hệ trong 24 giờ
            </p>

            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: "center", padding: "2rem" }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: `${DS.green}15`,
                    border: `2px solid ${DS.green}40`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1rem",
                    color: DS.green,
                  }}
                >
                  <CheckCircle2 size={28} />
                </div>
                <h3 style={{ color: DS.green, fontFamily: DS.heading, fontSize: "1.125rem", marginBottom: "0.5rem" }}>
                  Yêu cầu đã được gửi!
                </h3>
                <p style={{ color: DS.text3, fontSize: "0.875rem" }}>
                  Chuyên gia LOOP sẽ liên hệ trong 24 giờ để xác nhận lịch hẹn.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  {/* Name */}
                  <div>
                    <label style={{ color: DS.text3, fontSize: "0.75rem", display: "block", marginBottom: "0.25rem" }}>
                      Họ và tên *
                    </label>
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
                    <label style={{ color: DS.text3, fontSize: "0.75rem", display: "block", marginBottom: "0.25rem" }}>
                      Email *
                    </label>
                    <input
                      style={inputStyle}
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                      placeholder="email@company.com"
                    />
                  </div>
                  {/* Phone */}
                  <div>
                    <label style={{ color: DS.text3, fontSize: "0.75rem", display: "block", marginBottom: "0.25rem" }}>
                      Số điện thoại *
                    </label>
                    <input
                      style={inputStyle}
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      required
                      placeholder="0912 345 678"
                    />
                  </div>
                  {/* Company */}
                  <div>
                    <label style={{ color: DS.text3, fontSize: "0.75rem", display: "block", marginBottom: "0.25rem" }}>
                      Tên công ty
                    </label>
                    <input
                      style={inputStyle}
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      placeholder="Công ty ABC"
                    />
                  </div>
                </div>
                {/* Service */}
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ color: DS.text3, fontSize: "0.75rem", display: "block", marginBottom: "0.25rem" }}>
                    Dịch vụ quan tâm *
                  </label>
                  <select
                    style={{ ...inputStyle, cursor: "pointer" }}
                    value={form.service}
                    onChange={(e) => setForm({ ...form, service: e.target.value })}
                    required
                  >
                    <option value="">Chọn dịch vụ...</option>
                    {SERVICES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Company size */}
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ color: DS.text3, fontSize: "0.75rem", display: "block", marginBottom: "0.25rem" }}>
                    Quy mô công ty
                  </label>
                  <select
                    style={{ ...inputStyle, cursor: "pointer" }}
                    value={form.companySize}
                    onChange={(e) => setForm({ ...form, companySize: e.target.value })}
                  >
                    <option value="">Chọn quy mô...</option>
                    {COMPANY_SIZES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Message */}
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ color: DS.text3, fontSize: "0.75rem", display: "block", marginBottom: "0.25rem" }}>
                    Bạn muốn tư vấn về điều gì?
                  </label>
                  <textarea
                    style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Mô tả ngắn về nhu cầu của bạn..."
                  />
                </div>
                {/* Preferred time */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ color: DS.text3, fontSize: "0.75rem", display: "block", marginBottom: "0.25rem" }}>
                    Thời gian ưu tiên
                  </label>
                  <input
                    style={inputStyle}
                    value={form.preferredTime}
                    onChange={(e) => setForm({ ...form, preferredTime: e.target.value })}
                    placeholder="VD: Sáng thứ 2-4, Chiều thứ 6..."
                  />
                </div>
                {error && (
                  <div
                    style={{
                      color: DS.red,
                      fontSize: "0.8125rem",
                      padding: "0.625rem",
                      background: `${DS.red}10`,
                      borderRadius: 8,
                      border: `1px solid ${DS.red}20`,
                      marginBottom: "1rem",
                    }}
                  >
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: "100%",
                    padding: "0.875rem",
                    borderRadius: "1rem",
                    background: submitting ? `${DS.pink}60` : GRD.primary,
                    border: "none",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "1rem",
                    cursor: submitting ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.625rem",
                  }}
                >
                  {submitting ? (
                    "Đang xử lý..."
                  ) : (
                    <>
                      <Calendar size={18} />
                      Đặt lịch tư vấn
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Benefits sidebar */}
        <div style={{ position: "sticky", top: 80 }}>
          <h3
            style={{
              color: DS.text,
              fontFamily: DS.heading,
              fontSize: "1rem",
              marginBottom: "1rem",
            }}
          >
            Tại sao đặt lịch tư vấn?
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {BENEFITS.map((benefit, i) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                style={{
                  padding: "1rem",
                  borderRadius: "1rem",
                  background: `${benefit.color}08`,
                  border: `1px solid ${benefit.color}20`,
                  display: "flex",
                  gap: "0.875rem",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: `${benefit.color}15`,
                    border: `1px solid ${benefit.color}25`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: benefit.color,
                    flexShrink: 0,
                  }}
                >
                  {benefit.icon}
                </div>
                <div>
                  <div
                    style={{
                      color: DS.text,
                      fontWeight: 700,
                      fontSize: "0.875rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {benefit.title}
                  </div>
                  <div style={{ color: DS.text3, fontSize: "0.8125rem", lineHeight: 1.4 }}>
                    {benefit.desc}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Contact info + quick-action buttons */}
          <div
            style={{
              marginTop: "1.5rem",
              padding: "1.25rem",
              borderRadius: "1rem",
              background: "rgba(15,23,42,0.65)",
              border: `1px solid ${DS.border}`,
            }}
          >
            <div style={{ color: DS.text4, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em", marginBottom: "0.875rem" }}>
              HOẶC LIÊN HỆ TRỰC TIẾP
            </div>

            {/* Quick-action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              {/* Call */}
              <motion.a
                href={`tel:${CEO_CONTACT.phone}`}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 24 }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 10,
                  background: "linear-gradient(135deg, #EC4899 0%, #6B3DF5 100%)",
                  textDecoration: "none",
                  boxShadow: "0 4px 16px rgba(236,72,153,0.4), 0 0 0 1px rgba(255,255,255,0.1)",
                  position: "relative", overflow: "hidden",
                }}
              >
                <motion.div
                  animate={{ x: ["-120%", "200%"] }}
                  transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 6, ease: "easeInOut" }}
                  style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
                    pointerEvents: "none",
                  }}
                />
                <Phone size={15} style={{ color: "#fff", flexShrink: 0 }} />
                <div>
                  <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.12em" }}>HOTLINE</div>
                  <div style={{ color: "#fff", fontSize: 14, fontWeight: 800 }}>{CEO_CONTACT.phoneDisplay}</div>
                </div>
                {/* Live dot */}
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    position: "absolute", right: 12,
                    width: 7, height: 7, borderRadius: "50%",
                    background: "#fff",
                    boxShadow: "0 0 8px rgba(255,255,255,0.9)",
                  }}
                />
              </motion.a>

              {/* Zalo + Email row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <motion.a
                  href={CEO_CONTACT.zaloUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Liên hệ Zalo"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 24 }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "9px 8px", borderRadius: 9,
                    background: "linear-gradient(135deg, #0068FF 0%, #0047CC 100%)",
                    textDecoration: "none",
                    boxShadow: "0 3px 12px rgba(0,104,255,0.35)",
                  }}
                >
                  <svg width={13} height={13} viewBox="0 0 80 80" fill="none" aria-hidden="true">
                    <path d="M70.58 55.27C71.36 51.84 72 48.49 72 44.52C72 31.12 63.45 20.5 50.06 20.5C46.35 20.5 42.76 21.32 39.59 22.84L28 14.5 37.19 24.88C33.24 26.72 30.16 29.73 28.11 33.63L19.38 27.19 26.88 41.21C26.88 41.21 22.81 55.27 10.12 55.27C5.46 55.27 1 59.11 1 64.08C1 69.05 5.46 73.58 10.12 73.58C16.15 73.58 25.27 70.66 27.58 65.08C31.04 74.38 40.65 79.58 50.65 79.58C63.45 79.58 72 67.89 72 55.27H70.58Z" fill="white"/>
                  </svg>
                  <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>Zalo</span>
                </motion.a>

                <motion.a
                  href={`mailto:${CEO_CONTACT.email}`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 24 }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "9px 8px", borderRadius: 9,
                    background: "rgba(107,61,245,0.12)",
                    border: "1px solid rgba(107,61,245,0.25)",
                    textDecoration: "none",
                  }}
                >
                  <Mail size={13} style={{ color: DS.cosmicPurple }} />
                  <span style={{ color: DS.cosmicPurple, fontSize: 12, fontWeight: 700 }}>Email</span>
                </motion.a>
              </div>
            </div>

            {/* Info items */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { icon: <Mail size={12} />, value: CEO_CONTACT.email },
                { icon: <MapPin size={12} />, value: "Cái Răng, Cần Thơ" },
              ].map((item) => (
                <div
                  key={item.value}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    color: DS.text3, fontSize: "0.8125rem",
                  }}
                >
                  <span style={{ color: DS.text4, flexShrink: 0 }}>{item.icon}</span>
                  {item.value}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
