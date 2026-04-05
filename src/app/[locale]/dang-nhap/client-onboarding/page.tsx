"use client";

/**
 * Client Onboarding Page — LOOP Solutions
 * Route: /vi/dang-nhap/client-onboarding?token=xxx
 *
 * Multi-step onboarding for new customers:
 *   Step 1: Thông tin doanh nghiệp  (company, businessType, taxCode)
 *   Step 2: Thông tin cá nhân         (phone, dateOfBirth, address)
 *   Step 3: Xác nhận → hoàn tất
 *
 * Auth: JWT token passed via URL query param (set by RegisterForm after registration).
 */
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Building2, User, CheckCircle2, ArrowRight, ArrowLeft,
  Loader2, Check, AlertTriangle, Phone,
} from "lucide-react";
import { DS, GRD } from "@/lib/design-tokens";

const STEPS = [
  { key: "business",  label: "Doanh nghiệp", icon: <Building2 size={16} /> },
  { key: "personal",  label: "Cá nhân",      icon: <User size={16} /> },
  { key: "confirm",    label: "Xác nhận",     icon: <CheckCircle2 size={16} /> },
];

const BUSINESS_TYPES = [
  { value: "technology",    label: "Công nghệ / IT" },
  { value: "retail",        label: "Bán lẻ / Thương mại" },
  { value: "finance",       label: "Tài chính / Ngân hàng" },
  { value: "healthcare",    label: "Y tế / Sức khoẻ" },
  { value: "education",      label: "Giáo dục / Đào tạo" },
  { value: "food",          label: "F&B / Thực phẩm" },
  { value: "real_estate",   label: "Bất động sản" },
  { value: "manufacturing",  label: "Sản xuất / Công nghiệp" },
  { value: "services",      label: "Dịch vụ" },
  { value: "marketing",      label: "Marketing / Truyền thông" },
  { value: "other",         label: "Khác" },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "2rem" }}>
      {STEPS.map((s, i) => (
        <div key={s.key} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 14px", borderRadius: 20,
            background: i === current
              ? "rgba(59,130,246,0.15)"
              : i < current
              ? "rgba(34,197,94,0.12)"
              : "rgba(255,255,255,0.04)",
            border: i === current
              ? "1px solid rgba(59,130,246,0.4)"
              : i < current
              ? "1px solid rgba(34,197,94,0.3)"
              : "1px solid rgba(255,255,255,0.08)",
            color: i <= current ? DS.blue : DS.text4,
            fontSize: 12, fontFamily: DS.mono, fontWeight: i === current ? 600 : 400,
          }}>
            <span style={{ opacity: i < current ? 1 : 0.7 }}>{s.icon}</span>
            {s.label}
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ width: 24, height: 1, background: i < current ? DS.green : DS.border }} />
          )}
        </div>
      ))}
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text", required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{
        color: DS.text3, fontSize: "0.6875rem",
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: "0.12em", display: "block", marginBottom: "0.375rem",
      }}>
        {label.toUpperCase()}{required && <span style={{ color: DS.red, marginLeft: 4 }}>*</span>}
      </label>
      <div style={{
        display: "flex", alignItems: "center", gap: "0.5rem",
        padding: "0 0.875rem",
        background: DS.bgCard2,
        border: `1px solid ${focused ? DS.blue : DS.border}`,
        borderRadius: "0.75rem",
        boxShadow: focused ? "0 0 0 3px rgba(59,130,246,0.12)" : "none",
        height: 44,
      }}>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1, background: "none", border: "none", outline: "none",
            color: DS.text, fontSize: "0.875rem", fontFamily: "'Inter', sans-serif",
          }}
        />
      </div>
    </div>
  );
}

export default function ClientOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form data
  const [companyName, setCompanyName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [taxCode, setTaxCode] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");

  // Validate step before advancing
  const canAdvance = () => {
    if (step === 0) return companyName.trim().length > 0 && businessType.length > 0;
    if (step === 1) return phone.trim().length > 0;
    return true;
  };

  const handleAdvance = () => {
    if (!canAdvance()) {
      if (step === 0) setError("Vui lòng nhập tên công ty và chọn ngành nghề");
      if (step === 1) setError("Vui lòng nhập số điện thoại");
      return;
    }
    setError("");
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/auth/client-onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyName: companyName.trim() || null,
          businessType: businessType || null,
          taxCode: taxCode.trim() || null,
          phone: phone.trim() || null,
          dateOfBirth: dateOfBirth || null,
          address: address.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Đã có lỗi xảy ra");
        return;
      }

      // Store new JWT (with isOnboarded=true)
      if (data.token) {
        localStorage.setItem("loop-auth-token", data.token);
      }

      router.push("/khach-hang");
    } catch {
      setError("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const businessTypeLabel = BUSINESS_TYPES.find((b) => b.value === businessType)?.label ?? "—";

  return (
    <div style={{
      background: DS.bg, minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center", padding: "2rem 1.5rem",
      fontFamily: "'Inter', sans-serif", position: "relative",
    }}>
      {/* Background */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 30%, rgba(29,78,216,0.15) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(129,140,248,0.1) 0%, transparent 55%)" }} />
      </div>

      <div style={{ width: "100%", maxWidth: "32rem", position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <Link href="/vi" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none", marginBottom: "1.5rem", justifyContent: "center" }}>
          <img src="/logo.png" alt="LOOP" style={{ width: 40, height: 40, objectFit: "contain", borderRadius: 10 }} />
          <div>
            <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: 15, fontWeight: 900, letterSpacing: "0.1em" }}>LOOP SOLUTIONS</div>
          </div>
        </Link>

        <div style={{
          borderRadius: "1.5rem", padding: "2rem",
          background: "rgba(15,23,42,0.8)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(59,130,246,0.15)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
            <h1 style={{ fontFamily: DS.heading, fontSize: "1.375rem", fontWeight: 900, letterSpacing: "0.06em", background: GRD.primary, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "0.25rem" }}>
              HOÀN TẤT HỒ SƠ
            </h1>
            <p style={{ color: DS.text3, fontSize: "0.8125rem" }}>
              Cung cấp thông tin để chúng tôi phục vụ bạn tốt hơn
            </p>
          </div>

          <StepIndicator current={step} />

          {/* ── Step 1: Business Info ── */}
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <div style={{ padding: "0.5rem 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.25rem" }}>
                    <Building2 size={16} color={DS.blue} />
                    <span style={{ color: DS.text2, fontSize: 13, fontWeight: 600 }}>Thông tin doanh nghiệp</span>
                  </div>

                  <Field
                    label="Tên công ty / Tổ chức" value={companyName}
                    onChange={setCompanyName} placeholder="Công ty TNHH ABC"
                    required
                  />

                  {/* Business Type */}
                  <div style={{ marginBottom: "1rem" }}>
                    <label style={{ color: DS.text3, fontSize: "0.6875rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.12em", display: "block", marginBottom: "0.375rem" }}>
                      LOẠI HÌNH KINH DOANH<span style={{ color: DS.red, marginLeft: 4 }}>*</span>
                    </label>
                    <select
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      style={{
                        width: "100%", background: DS.bgCard2, border: `1px solid ${DS.border}`,
                        borderRadius: "0.75rem", padding: "0 0.875rem",
                        height: 44, color: businessType ? DS.text : DS.text5,
                        fontSize: "0.875rem", outline: "none", appearance: "none",
                      }}
                    >
                      <option value="">— Chọn ngành nghề —</option>
                      {BUSINESS_TYPES.map((bt) => (
                        <option key={bt.value} value={bt.value}>{bt.label}</option>
                      ))}
                    </select>
                  </div>

                  <Field
                    label="Mã số thuế (tuỳ chọn)" value={taxCode}
                    onChange={setTaxCode} placeholder="0123456789"
                  />
                </div>

                {error && (
                  <div style={{ padding: "0.625rem 0.875rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5", fontSize: "0.8125rem", marginBottom: "1rem" }}>
                    {error}
                  </div>
                )}

                <button
                  onClick={handleAdvance}
                  style={{
                    width: "100%", background: GRD.primary, color: "#fff",
                    border: "none", borderRadius: "0.75rem",
                    padding: "0.8125rem", fontSize: "0.875rem", fontWeight: 700,
                    cursor: "pointer", display: "flex", alignItems: "center",
                    justifyContent: "center", gap: "0.5rem",
                    boxShadow: "0 0 20px rgba(129,140,248,0.35)",
                  }}
                >
                  Tiếp tục <ArrowRight size={16} />
                </button>
              </motion.div>
            )}

            {/* ── Step 2: Personal Info ── */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <div style={{ padding: "0.5rem 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.25rem" }}>
                    <User size={16} color={DS.blue} />
                    <span style={{ color: DS.text2, fontSize: 13, fontWeight: 600 }}>Thông tin cá nhân</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.75rem", borderRadius: "0.75rem", background: "rgba(59,130,246,0.06)", border: `1px solid rgba(59,130,246,0.15)`, marginBottom: "1rem" }}>
                    <Phone size={14} color={DS.blue} />
                    <span style={{ color: DS.text3, fontSize: "0.75rem" }}>Số điện thoại giúp chúng tôi liên hệ nhanh chóng</span>
                  </div>

                  <Field
                    label="Số điện thoại" value={phone}
                    onChange={setPhone} placeholder="0909 xxx xxx"
                    type="tel" required
                  />

                  <Field
                    label="Ngày sinh (tuỳ chọn)" value={dateOfBirth}
                    onChange={setDateOfBirth} placeholder="dd/mm/yyyy" type="date"
                  />

                  <Field
                    label="Địa chỉ (tuỳ chọn)" value={address}
                    onChange={setAddress} placeholder="123 Nguyễn Huệ, Quận 1, TP.HCM"
                  />
                </div>

                {error && (
                  <div style={{ padding: "0.625rem 0.875rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5", fontSize: "0.8125rem", marginBottom: "1rem" }}>
                    {error}
                  </div>
                )}

                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    onClick={() => { setStep(0); setError(""); }}
                    style={{
                      flex: 1, background: "transparent", border: `1px solid ${DS.border}`,
                      color: DS.text3, borderRadius: "0.75rem",
                      padding: "0.8125rem", fontSize: "0.875rem", fontWeight: 600,
                      cursor: "pointer", display: "flex", alignItems: "center",
                      justifyContent: "center", gap: "0.5rem",
                    }}
                  >
                    <ArrowLeft size={16} /> Quay lại
                  </button>
                  <button
                    onClick={handleAdvance}
                    style={{
                      flex: 2, background: GRD.primary, color: "#fff",
                      border: "none", borderRadius: "0.75rem",
                      padding: "0.8125rem", fontSize: "0.875rem", fontWeight: 700,
                      cursor: "pointer", display: "flex", alignItems: "center",
                      justifyContent: "center", gap: "0.5rem",
                      boxShadow: "0 0 20px rgba(129,140,248,0.35)",
                    }}
                  >
                    Tiếp tục <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Confirm ── */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <div style={{ padding: "0.5rem 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.25rem" }}>
                    <CheckCircle2 size={16} color={DS.green} />
                    <span style={{ color: DS.text2, fontSize: 13, fontWeight: 600 }}>Xác nhận thông tin</span>
                  </div>

                  <div style={{ borderRadius: "0.75rem", border: `1px solid ${DS.border}`, overflow: "hidden", marginBottom: "1.25rem" }}>
                    {[
                      ["Công ty", companyName],
                      ["Ngành nghề", businessTypeLabel],
                      ["Mã số thuế", taxCode || "—"],
                      ["Số điện thoại", phone],
                      ["Ngày sinh", dateOfBirth || "—"],
                      ["Địa chỉ", address || "—"],
                    ].map(([label, val], i) => (
                      <div key={label} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "0.625rem 1rem",
                        borderBottom: i < 5 ? `1px solid ${DS.border}` : "none",
                        background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
                      }}>
                        <span style={{ color: DS.text4, fontSize: "0.8125rem", fontFamily: DS.mono }}>{label}</span>
                        <span style={{ color: val && val !== "—" ? DS.text : DS.text4, fontSize: "0.8125rem", fontWeight: val && val !== "—" ? 500 : 400 }}>{val}</span>
                      </div>
                    ))}
                  </div>

                  {error && (
                    <div style={{ padding: "0.625rem 0.875rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5", fontSize: "0.8125rem", marginBottom: "1rem" }}>
                      <AlertTriangle size={12} style={{ display: "inline", marginRight: 6 }} />
                      {error}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button
                      onClick={() => { setStep(1); setError(""); }}
                      disabled={loading}
                      style={{
                        flex: 1, background: "transparent", border: `1px solid ${DS.border}`,
                        color: DS.text3, borderRadius: "0.75rem",
                        padding: "0.8125rem", fontSize: "0.875rem", fontWeight: 600,
                        cursor: "pointer", display: "flex", alignItems: "center",
                        justifyContent: "center", gap: "0.5rem",
                      }}
                    >
                      <ArrowLeft size={16} /> Quay lại
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      style={{
                        flex: 2, background: loading ? "rgba(34,197,94,0.5)" : DS.green,
                        border: "none", borderRadius: "0.75rem",
                        padding: "0.8125rem", fontSize: "0.875rem", fontWeight: 700,
                        cursor: loading ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center",
                        justifyContent: "center", gap: "0.5rem",
                        boxShadow: "0 0 20px rgba(34,197,94,0.3)",
                      }}
                    >
                      {loading ? (
                        <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Đang hoàn tất...</>
                      ) : (
                        <><Check size={16} /> Hoàn tất đăng ký</>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <Link href="/vi/khach-hang" style={{ color: DS.text4, fontSize: "0.75rem", textDecoration: "none" }}>
            Bỏ qua — vào Dashboard ngay
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
