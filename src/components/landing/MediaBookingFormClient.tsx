/**
 * MediaBookingFormClient — Public booking form for media production services.
 * Dark cosmic theme, matches LOOP design system.
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DS, GRD } from "@/lib/design-tokens";
import {
  Camera, CheckCircle2, ArrowRight, Calendar, AlertCircle,
} from "lucide-react";

const BOOKING_TYPES = [
  {
    value: "event",
    labelKey: "bookingTypeEvent",
    icon: "🎥",
    desc: "Chụp ảnh, quay video sự kiện, hội thảo, workshop",
  },
  {
    value: "product",
    labelKey: "bookingTypeProduct",
    icon: "📷",
    desc: "Chụp ảnh sản phẩm cho e-commerce, catalogue",
  },
  {
    value: "corporate",
    labelKey: "bookingTypeCorporate",
    icon: "🏢",
    desc: "Video branding, corporate, profile công ty, HR video",
  },
  {
    value: "social",
    labelKey: "bookingTypeSocial",
    icon: "📱",
    desc: "Nội dung social media: clip ngắn, Reels, TikTok, banner",
  },
  {
    value: "custom",
    labelKey: "bookingTypeCustom",
    icon: "✨",
    desc: "Yêu cầu đặc biệt — chúng tôi sẽ liên hệ tư vấn",
  },
] as const;

type BookingType = (typeof BOOKING_TYPES)[number]["value"];

interface FormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName: string;
  bookingType: BookingType;
  title: string;
  requirements: string;
  deadline: string;
  budget: string;
}

interface FieldErrors {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  bookingType?: string;
  title?: string;
}

const LABELS: Record<string, string> = {
  customerName: "Họ và tên",
  customerEmail: "Email",
  customerPhone: "Số điện thoại",
  companyName: "Tên công ty",
  bookingType: "Loại dịch vụ",
  projectTitle: "Tên dự án / Sự kiện",
  requirements: "Mô tả yêu cầu",
  requirementsPlaceholder: "Mô tả chi tiết yêu cầu của bạn: số lượng ảnh/video, thời gian, địa điểm, deadline...",
  deadline: "Deadline mong muốn",
  budget: "Ngân sách dự kiến (VNĐ)",
  submit: "Gửi yêu cầu",
  submitting: "Đang gửi...",
  successTitle: "Yêu cầu đã được gửi!",
  successMessage: "Chúng tôi sẽ liên hệ trong 24 giờ để xác nhận và báo giá chi tiết.",
  required: "Trường bắt buộc",
  invalidEmail: "Email không hợp lệ",
  formTitle: "Đặt dịch vụ Media",
  formSubtitle: "Điền thông tin để nhận báo giá trong 24 giờ",
};

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function hexRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const fieldStyle = {
  width: "100%",
  background: DS.bg,
  border: `1px solid ${DS.border}`,
  borderRadius: 10,
  padding: "12px 14px",
  color: DS.text,
  fontSize: 14,
  outline: "none",
  fontFamily: DS.body,
  boxSizing: "border-box" as const,
  transition: "border-color 0.2s",
} as const;

const labelStyle = {
  display: "block",
  color: DS.text3,
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 6,
};

const groupStyle = { marginBottom: 18 };

function SuccessScreen({ locale }: { locale: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        textAlign: "center",
        padding: "40px 20px",
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      {/* Animated check */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: hexRgba(DS.green, 0.15),
          border: `2px solid ${DS.green}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
          boxShadow: `0 0 30px ${hexRgba(DS.green, 0.3)}`,
        }}
      >
        <CheckCircle2 size={40} style={{ color: DS.green }} />
      </motion.div>

      <h2
        style={{
          fontFamily: DS.heading,
          fontSize: 28,
          fontWeight: 800,
          color: DS.text,
          marginBottom: 12,
        }}
      >
        {LABELS.successTitle}
      </h2>
      <p style={{ color: DS.text3, fontSize: 15, lineHeight: 1.7, marginBottom: 28 }}>
        {LABELS.successMessage}
      </p>

      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <Link
          href={`/${locale}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "11px 22px",
            background: DS.bgCard,
            border: `1px solid ${DS.border}`,
            borderRadius: 10,
            color: DS.text3,
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          ← Về trang chủ
        </Link>
        <Link
          href={`/${locale}/media`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "11px 22px",
            background: GRD.primary,
            border: "none",
            borderRadius: 10,
            color: "#fff",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 700,
            boxShadow: `0 0 20px ${hexRgba(DS.pink, 0.4)}`,
          }}
        >
          Xem Portfolio <ArrowRight size={14} />
        </Link>
      </div>
    </motion.div>
  );
}

export function MediaBookingFormClient({ locale }: { locale: string }) {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    companyName: "",
    bookingType: "event",
    title: "",
    requirements: "",
    deadline: "",
    budget: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const set = (field: keyof FormData, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field as keyof FieldErrors]) {
      setErrors((e) => ({ ...e, [field]: undefined }));
    }
    if (serverError) setServerError("");
  };

  const validate = (): boolean => {
    const newErrors: FieldErrors = {};
    if (!form.customerName.trim()) newErrors.customerName = LABELS.required;
    if (!form.customerEmail.trim()) {
      newErrors.customerEmail = LABELS.required;
    } else if (!validateEmail(form.customerEmail)) {
      newErrors.customerEmail = LABELS.invalidEmail;
    }
    if (!form.title.trim()) newErrors.title = LABELS.required;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError("");

    try {
      const payload = {
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim(),
        customerPhone: form.customerPhone.trim() || undefined,
        companyName: form.companyName.trim() || undefined,
        bookingType: form.bookingType,
        title: form.title.trim(),
        requirements: form.requirements.trim() || undefined,
        deadline: form.deadline || undefined,
        budget: form.budget ? parseFloat(form.budget.replace(/[^\d]/g, "")) : undefined,
      };

      const res = await fetch("/api/media-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Có lỗi xảy ra" }));
        throw new Error(data.error ?? `Request failed: ${res.status}`);
      }

      setSubmitted(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main
        style={{
          background: DS.bg,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 600 }}>
          <SuccessScreen locale={locale} />
        </div>
      </main>
    );
  }

  return (
    <main style={{ background: DS.bg, minHeight: "100vh" }}>
      {/* Hero */}
      <section
        style={{
          padding: "64px 20px 48px",
          textAlign: "center",
          background: "linear-gradient(180deg, rgba(107,61,245,0.08) 0%, transparent 100%)",
          borderBottom: `1px solid ${DS.border}`,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 14px",
              borderRadius: 99,
              background: hexRgba(DS.pink, 0.1),
              border: `1px solid ${hexRgba(DS.pink, 0.3)}`,
              marginBottom: 16,
            }}
          >
            <Camera size={12} style={{ color: DS.pink }} />
            <span
              style={{
                color: DS.pink,
                fontSize: 10,
                fontFamily: DS.mono,
                letterSpacing: "0.2em",
                fontWeight: 700,
              }}
            >
              MEDIA PRODUCTION
            </span>
          </div>

          <h1
            style={{
              fontFamily: DS.heading,
              fontSize: 36,
              fontWeight: 900,
              letterSpacing: "0.04em",
              background: "linear-gradient(135deg, #FFFFFF, #94A3B8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: 12,
            }}
          >
            {LABELS.formTitle}
          </h1>
          <p style={{ color: DS.text3, fontSize: 15, maxWidth: 420, margin: "0 auto", lineHeight: 1.7 }}>
            {LABELS.formSubtitle}
          </p>
        </motion.div>
      </section>

      {/* Form */}
      <section style={{ padding: "40px 20px 80px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <form onSubmit={handleSubmit} noValidate>
            {/* ── Section 1: Thông tin liên hệ ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.35 }}
              style={{
                background: DS.bgCard,
                border: `1px solid ${DS.border}`,
                borderRadius: 16,
                padding: "24px 28px",
                marginBottom: 16,
              }}
            >
              <h2
                style={{
                  fontFamily: DS.heading,
                  fontSize: 15,
                  fontWeight: 700,
                  color: DS.text,
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: GRD.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#fff",
                    flexShrink: 0,
                  }}
                >
                  1
                </span>
                Thông tin liên hệ
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {/* customerName */}
                <div style={{ gridColumn: "1 / -1", ...groupStyle }}>
                  <label style={labelStyle}>
                    {LABELS.customerName} <span style={{ color: DS.pink }}>*</span>
                  </label>
                  <input
                    type="text"
                    style={{
                      ...fieldStyle,
                      borderColor: errors.customerName
                        ? `${DS.red}60`
                        : focusedField === "customerName"
                        ? hexRgba(DS.blue, 0.5)
                        : DS.border,
                    }}
                    value={form.customerName}
                    placeholder="Nguyễn Văn A"
                    onChange={(e) => set("customerName", e.target.value)}
                    onFocus={() => setFocusedField("customerName")}
                    onBlur={() => setFocusedField(null)}
                  />
                  {errors.customerName && (
                    <p style={{ color: DS.red, fontSize: 12, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                      <AlertCircle size={12} /> {errors.customerName}
                    </p>
                  )}
                </div>

                {/* customerEmail */}
                <div style={groupStyle}>
                  <label style={labelStyle}>
                    {LABELS.customerEmail} <span style={{ color: DS.pink }}>*</span>
                  </label>
                  <input
                    type="email"
                    style={{
                      ...fieldStyle,
                      borderColor: errors.customerEmail
                        ? `${DS.red}60`
                        : focusedField === "customerEmail"
                        ? hexRgba(DS.blue, 0.5)
                        : DS.border,
                    }}
                    value={form.customerEmail}
                    placeholder="contact@company.vn"
                    onChange={(e) => set("customerEmail", e.target.value)}
                    onFocus={() => setFocusedField("customerEmail")}
                    onBlur={() => setFocusedField(null)}
                  />
                  {errors.customerEmail && (
                    <p style={{ color: DS.red, fontSize: 12, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                      <AlertCircle size={12} /> {errors.customerEmail}
                    </p>
                  )}
                </div>

                {/* customerPhone */}
                <div style={groupStyle}>
                  <label style={labelStyle}>{LABELS.customerPhone}</label>
                  <input
                    type="tel"
                    style={{
                      ...fieldStyle,
                      borderColor: focusedField === "customerPhone" ? hexRgba(DS.blue, 0.5) : DS.border,
                    }}
                    value={form.customerPhone}
                    placeholder="0901 234 567"
                    onChange={(e) => set("customerPhone", e.target.value)}
                    onFocus={() => setFocusedField("customerPhone")}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>

                {/* companyName */}
                <div style={{ gridColumn: "1 / -1", ...groupStyle }}>
                  <label style={labelStyle}>{LABELS.companyName}</label>
                  <input
                    type="text"
                    style={{
                      ...fieldStyle,
                      borderColor: focusedField === "companyName" ? hexRgba(DS.blue, 0.5) : DS.border,
                    }}
                    value={form.companyName}
                    placeholder="Công ty ABC"
                    onChange={(e) => set("companyName", e.target.value)}
                    onFocus={() => setFocusedField("companyName")}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
              </div>
            </motion.div>

            {/* ── Section 2: Dự án ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.35 }}
              style={{
                background: DS.bgCard,
                border: `1px solid ${DS.border}`,
                borderRadius: 16,
                padding: "24px 28px",
                marginBottom: 16,
              }}
            >
              <h2
                style={{
                  fontFamily: DS.heading,
                  fontSize: 15,
                  fontWeight: 700,
                  color: DS.text,
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: GRD.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#fff",
                    flexShrink: 0,
                  }}
                >
                  2
                </span>
                Dự án
              </h2>

              {/* Booking type radio */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ ...labelStyle, marginBottom: 10 }}>
                  {LABELS.bookingType} <span style={{ color: DS.pink }}>*</span>
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {BOOKING_TYPES.map((type) => {
                    const isActive = form.bookingType === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => set("bookingType", type.value)}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 10,
                          border: isActive
                            ? `2px solid ${DS.pink}`
                            : `1px solid ${DS.border}`,
                          background: isActive ? hexRgba(DS.pink, 0.08) : DS.bg,
                          color: isActive ? DS.pink : DS.text3,
                          cursor: "pointer",
                          textAlign: "left" as const,
                          transition: "all 0.15s",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                        }}
                      >
                        <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>
                          {type.icon}
                        </span>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, lineHeight: 1.3 }}>
                            {type.labelKey === "bookingTypeEvent" ? "Chụp sự kiện" : type.labelKey === "bookingTypeProduct" ? "Chụp sản phẩm" : type.labelKey === "bookingTypeCorporate" ? "Corporate/Branding" : type.labelKey === "bookingTypeSocial" ? "Social Media" : "Tùy chỉnh"}
                          </p>
                          <p style={{ fontSize: 11, color: isActive ? hexRgba(DS.pink, 0.8) : DS.text4, lineHeight: 1.4 }}>
                            {type.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* title */}
              <div style={{ ...groupStyle }}>
                <label style={labelStyle}>
                  {LABELS.projectTitle} <span style={{ color: DS.pink }}>*</span>
                </label>
                <input
                  type="text"
                  style={{
                    ...fieldStyle,
                    borderColor: errors.title
                      ? `${DS.red}60`
                      : focusedField === "title"
                      ? hexRgba(DS.blue, 0.5)
                      : DS.border,
                  }}
                  value={form.title}
                  placeholder="VD: Chụp ảnh sản phẩm tháng 4 cho XYZ"
                  onChange={(e) => set("title", e.target.value)}
                  onFocus={() => setFocusedField("title")}
                  onBlur={() => setFocusedField(null)}
                />
                {errors.title && (
                  <p style={{ color: DS.red, fontSize: 12, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                    <AlertCircle size={12} /> {errors.title}
                  </p>
                )}
              </div>

              {/* requirements */}
              <div style={{ ...groupStyle }}>
                <label style={labelStyle}>{LABELS.requirements}</label>
                <textarea
                  style={{
                    ...fieldStyle,
                    minHeight: 100,
                    resize: "vertical",
                    borderColor: focusedField === "requirements" ? hexRgba(DS.blue, 0.5) : DS.border,
                  }}
                  value={form.requirements}
                  placeholder={LABELS.requirementsPlaceholder}
                  onChange={(e) => set("requirements", e.target.value)}
                  onFocus={() => setFocusedField("requirements")}
                  onBlur={() => setFocusedField(null)}
                />
              </div>

              {/* deadline + budget */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={groupStyle}>
                  <label style={labelStyle}>
                    <Calendar size={12} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
                    {LABELS.deadline}
                  </label>
                  <input
                    type="date"
                    style={{
                      ...fieldStyle,
                      borderColor: focusedField === "deadline" ? hexRgba(DS.blue, 0.5) : DS.border,
                    }}
                    value={form.deadline}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => set("deadline", e.target.value)}
                    onFocus={() => setFocusedField("deadline")}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
                <div style={groupStyle}>
                  <label style={labelStyle}>{LABELS.budget}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    style={{
                      ...fieldStyle,
                      borderColor: focusedField === "budget" ? hexRgba(DS.blue, 0.5) : DS.border,
                    }}
                    value={form.budget}
                    placeholder="VD: 5,000,000"
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^\d]/g, "");
                      const formatted = raw ? parseInt(raw).toLocaleString("vi-VN") : "";
                      set("budget", formatted);
                    }}
                    onFocus={() => setFocusedField("budget")}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
              </div>
            </motion.div>

            {/* ── Submit ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.35 }}
            >
              {/* Server error */}
              <AnimatePresence>
                {serverError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{
                      padding: "12px 16px",
                      background: hexRgba(DS.red, 0.1),
                      border: `1px solid ${hexRgba(DS.red, 0.3)}`,
                      borderRadius: 10,
                      marginBottom: 16,
                      color: DS.red,
                      fontSize: 14,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <AlertCircle size={15} />
                    {serverError}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: submitting ? hexRgba(DS.pink, 0.5) : GRD.primary,
                  border: "none",
                  borderRadius: 12,
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 700,
                  fontFamily: DS.heading,
                  cursor: submitting ? "not-allowed" : "pointer",
                  letterSpacing: "0.04em",
                  boxShadow: submitting ? "none" : `0 0 24px ${hexRgba(DS.pink, 0.45)}`,
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {submitting ? (
                  <>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{ animation: "spin 0.8s linear infinite" }}
                    >
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
                    </svg>
                    {LABELS.submitting}
                  </>
                ) : (
                  <>
                    {LABELS.submit}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <p
                style={{
                  textAlign: "center",
                  color: DS.text4,
                  fontSize: 12,
                  marginTop: 12,
                }}
              >
                Chúng tôi sẽ liên hệ trong{" "}
                <span style={{ color: DS.pink, fontWeight: 600 }}>24 giờ</span> để xác nhận và báo giá chi tiết.
              </p>
            </motion.div>
          </form>
        </div>
      </section>

      {/* Spinning animation keyframe */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}
