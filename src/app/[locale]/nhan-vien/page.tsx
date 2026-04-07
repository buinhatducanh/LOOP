"use client";

/**
 * Staff Login Page — /vi/nhan-vien, /en/staff, etc.
 *
 * Standalone login page for LOOP employees.
 * Separate from the customer portal at /dang-nhap.
 *
 * Flow:
 *   POST /api/admin/auth/login → loop-staff-token cookie → /admin/overview
 *   Onboarded check → /dang-nhap/client-onboarding if needed.
 */
import { useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import {
  Eye, EyeOff, ArrowRight, Loader2, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { DS, GRD } from "@/lib/design-tokens";
import { useAuthStore } from "@/app/store/authStore";

// ── Form input ─────────────────────────────────────────────────────────────────
function FormInput({
  label, type = "text", placeholder, value, onChange,
}: {
  label: string; type?: string; placeholder: string; value: string; onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPassword = type === "password";

  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{
        color: DS.text3, fontSize: "0.6875rem",
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: "0.12em", display: "block", marginBottom: "0.375rem",
      }}>
        {label.toUpperCase()}
      </label>
      <div
        style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          padding: "0 0.875rem",
          background: DS.bgCard2,
          border: `1px solid ${focused ? DS.blue : DS.border}`,
          borderRadius: "0.75rem",
          boxShadow: focused ? `0 0 0 3px rgba(59,130,246,0.12)` : "none",
          height: 44,
        }}
      >
        <input
          type={isPassword ? (show ? "text" : "password") : type}
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
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            style={{ color: DS.text4, background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Background ─────────────────────────────────────────────────────────────────
function AuthBg() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      <div style={{
        position: "absolute", top: "-20%", right: "-10%", width: 600, height: 600,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)",
      }} />
      <div style={{
        position: "absolute", bottom: "-20%", left: "-10%", width: 500, height: 500,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />
    </div>
  );
}

// ── Side panel — staff theme ────────────────────────────────────────────────────
function SidePanel({ locale }: { locale: string }) {
  const ranks = [
    { label: "IRON",    color: "#9CA3AF", symbol: "⬡", desc: "Cấp độ 1–14" },
    { label: "GOLD",    color: "#FFD700", symbol: "★", desc: "Cấp độ 55–74" },
    { label: "DIAMOND", color: "#818CF8", symbol: "✦", desc: "Cấp độ 115+" },
  ];

  return (
    <div style={{
      display: "flex", flexDirection: "column", justifyContent: "space-between",
      height: "100%", padding: "2.5rem",
      background: "linear-gradient(135deg, rgba(29,78,216,0.2) 0%, rgba(129,140,248,0.12) 100%)",
      borderRight: "1px solid rgba(59,130,246,0.15)",
    }}>
      <div>
        <Link href={`/${locale}`} style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none", marginBottom: "2.5rem" }}>
          <img src="/logo.png" alt="LOOP" style={{ width: 40, height: 40, objectFit: "contain", borderRadius: 10 }} />
          <div>
            <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: 15, fontWeight: 900, letterSpacing: "0.1em" }}>LOOP SOLUTIONS</div>
            <div style={{ color: DS.text5, fontSize: 9, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.2em" }}>DIGITAL AGENCY OS</div>
          </div>
        </Link>

        <div style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          marginBottom: "1.25rem", padding: "0.375rem 0.875rem",
          borderRadius: "9999px",
          background: "rgba(139,92,246,0.1)",
          border: "1px solid rgba(139,92,246,0.25)",
        }}>
          <ShieldCheck size={12} color={DS.purple} />
          <span style={{ color: DS.purple, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.15em" }}>
            KHU VỰC NHÂN VIÊN
          </span>
        </div>

        <h2 style={{ fontFamily: DS.heading, fontSize: "1.75rem", fontWeight: 900, color: DS.text, lineHeight: 1.3, marginBottom: "1rem", letterSpacing: "0.04em" }}>
          Chào mừng<br />đồng nghiệp
        </h2>
        <p style={{ color: DS.text3, fontSize: "0.875rem", lineHeight: 1.8, marginBottom: "1.75rem" }}>
          Đăng nhập để truy cập dashboard quản lý dự án, kanban, LP rewards và hệ thống nội bộ.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {ranks.map((r) => (
            <div key={r.label} style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.75rem 1rem", borderRadius: "0.75rem",
              background: "rgba(15,23,42,0.5)",
              border: `1px solid ${r.color}30`,
            }}>
              <span style={{ color: r.color, fontSize: 18, textShadow: `0 0 10px ${r.color}60` }}>{r.symbol}</span>
              <div>
                <div style={{ color: r.color, fontSize: "0.6875rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{r.label}</div>
                <div style={{ color: DS.text5, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace" }}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        padding: "1rem", borderRadius: "1rem",
        background: "rgba(15,23,42,0.6)",
        border: "1px solid rgba(139,92,246,0.2)",
      }}>
        <div style={{ color: DS.text4, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.15em", marginBottom: "0.375rem" }}>
          KHÔNG PHẢI NHÂN VIÊN?
        </div>
        <Link href={`/${locale}/dang-nhap`} style={{ color: DS.blue, fontSize: "0.8125rem", fontWeight: 600, textDecoration: "none" }}>
          Đăng nhập khách hàng →
        </Link>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────────
export default function NhanVienPage() {
  const params = useParams();
  const locale = (params.locale as string) ?? "vi";
  const router = useRouter();
  const t = useTranslations("auth");

  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    clearError();

    const ok = await login(email, password);
    if (ok) {
      const currentUser = useAuthStore.getState().user;
      if (!currentUser) return;

      if (!currentUser.isOnboarded) {
        toast.success("Đăng nhập thành công!", {
          description: "Vui lòng hoàn tất hồ sơ trước khi sử dụng.",
        });
        router.push(`/${locale}/dang-nhap/client-onboarding`);
      } else {
        toast.success("Đăng nhập thành công!", {
          description: `Chào mừng ${currentUser.name}`,
        });
        router.push("/admin/overview");
      }
    }
  };

  return (
    <div style={{ background: DS.bg, minHeight: "100vh", display: "flex", position: "relative", fontFamily: "'Inter', sans-serif" }}>
      <AuthBg />

      <div style={{ display: "flex", width: "100%", position: "relative", zIndex: 1 }}>
        {/* Side panel */}
        <div className="hide-mobile" style={{ flex: "0 0 45%", maxWidth: "45%" }}>
          <SidePanel locale={locale} />
        </div>

        {/* Login form */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
          <div style={{ width: "100%", maxWidth: "28rem" }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div style={{
                borderRadius: "1.5rem", padding: "2rem",
                background: "rgba(15,23,42,0.8)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(59,130,246,0.15)",
                boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
              }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: "0.5rem",
                    marginBottom: "0.875rem", padding: "0.375rem 0.875rem",
                    borderRadius: "9999px",
                    background: "rgba(139,92,246,0.1)",
                    border: "1px solid rgba(139,92,246,0.25)",
                  }}>
                    <ShieldCheck size={12} color={DS.purple} />
                    <span style={{ color: DS.purple, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.15em" }}>
                      NHÂN VIÊN LOOP
                    </span>
                  </div>
                  <h1 style={{
                    fontFamily: DS.heading, fontSize: "1.625rem", fontWeight: 900,
                    letterSpacing: "0.06em",
                    background: GRD.primary, WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    marginBottom: "0.375rem",
                  }}>
                    {t("login").toUpperCase()}
                  </h1>
                  <p style={{ color: DS.text3, fontSize: "0.8125rem" }}>
                    Truy cập dashboard nội bộ
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <FormInput
                    label={t("email")}
                    type="email"
                    placeholder="email@loop.vn"
                    value={email}
                    onChange={setEmail}
                  />
                  <FormInput
                    label={t("password")}
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={setPassword}
                  />

                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.25rem" }}>
                    <button
                      type="button"
                      onClick={() => router.push(`/${locale}/dang-nhap`)}
                      style={{ color: DS.blue, background: "none", border: "none", fontSize: "0.75rem", cursor: "pointer" }}
                    >
                      Quên mật khẩu?
                    </button>
                  </div>

                  {error && (
                    <div style={{
                      padding: "0.625rem 0.875rem", borderRadius: "0.5rem",
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      color: "#FCA5A5", fontSize: "0.8125rem", marginBottom: "1rem",
                    }}>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      width: "100%",
                      background: isLoading ? "rgba(59,130,246,0.6)" : GRD.primary,
                      color: "#fff", border: "none", borderRadius: "0.75rem",
                      padding: "0.8125rem", fontSize: "0.875rem",
                      fontWeight: 700, cursor: isLoading ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                      boxShadow: "0 0 20px rgba(129,140,248,0.35)",
                    }}
                  >
                    {isLoading ? (
                      <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> {t("login")}...</>
                    ) : (
                      <>{t("login")} <ArrowRight size={16} /></>
                    )}
                  </button>
                </form>

                <p style={{ color: DS.text4, fontSize: "0.8125rem", textAlign: "center", marginTop: "1.5rem" }}>
                  Không phải nhân viên?{" "}
                  <Link href={`/${locale}/dang-nhap`} style={{ color: DS.blue, textDecoration: "none", fontWeight: 600 }}>
                    Đăng nhập khách hàng
                  </Link>
                </p>
              </div>

              <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
                <Link
                  href={`/${locale}`}
                  style={{
                    color: DS.text4, fontSize: "0.8125rem",
                    textDecoration: "none", display: "inline-flex",
                    alignItems: "center", gap: "0.375rem",
                  }}
                >
                  <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} />
                  Quay lại trang chủ
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
