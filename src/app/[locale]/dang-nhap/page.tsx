"use client";

/**
 * Customer Login Page — /vi/dang-nhap
 * Simplified: clean centered form, no distractions.
 * Staff login is at /nhan-vien.
 */
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { Eye, EyeOff, ArrowRight, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { DS, GRD } from "@/lib/design-tokens";
import { useAuthStore } from "@/app/store/authStore";

// ── Ambient background orbs ───────────────────────────────────────────────────
function AuthBg() {
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {/* Top-right orb */}
      <div style={{
        position: "absolute", top: "-15%", right: "-5%",
        width: 500, height: 500, borderRadius: "50%",
        background: `radial-gradient(circle, ${hexRgba(DS.pink, 0.08)} 0%, transparent 70%)`,
      }} />
      {/* Bottom-left orb */}
      <div style={{
        position: "absolute", bottom: "-10%", left: "-10%",
        width: 400, height: 400, borderRadius: "50%",
        background: `radial-gradient(circle, ${hexRgba(DS.purple, 0.1)} 0%, transparent 70%)`,
      }} />
      {/* Dot grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `radial-gradient(${hexRgba(DS.purple, 0.15)} 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
      }} />
    </div>
  );
}

function hexRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Form input ────────────────────────────────────────────────────────────────
function InputField({ label, type = "text", placeholder, value, onChange }: {
  label: string; type?: string; placeholder: string; value: string; onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPassword = type === "password";

  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{
        color: DS.text3, fontSize: "0.6875rem",
        fontFamily: DS.mono, letterSpacing: "0.12em", display: "block", marginBottom: "0.5rem",
      }}>
        {label.toUpperCase()}
      </label>
      <div style={{
        display: "flex", alignItems: "center", gap: "0.5rem",
        padding: "0 1rem",
        background: "rgba(17,24,39,0.9)",
        border: `1.5px solid ${focused ? DS.pink : "rgba(107,61,245,0.25)"}`,
        borderRadius: "0.875rem",
        boxShadow: focused ? `0 0 0 3px ${hexRgba(DS.pink, 0.15)}` : "none",
        transition: "all 0.2s ease",
        height: 48,
      }}>
        <input
          type={isPassword ? (show ? "text" : "password") : type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1, background: "none", border: "none", outline: "none",
            color: DS.text, fontSize: "0.9375rem",
            fontFamily: DS.body,
          }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(!show)}
            style={{ color: DS.text4, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) ?? "vi";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error ?? "Email hoặc mật khẩu không đúng");
        return;
      }

      if (data.token && typeof window !== "undefined") {
        try { localStorage.setItem("loop-customer-token", data.token); } catch { /* noop */ }
      }

      const { loginAs } = useAuthStore.getState();
      loginAs({
        id: data.user?.userId ?? "",
        name: data.user?.name ?? email,
        shortName: (data.user?.name ?? email).slice(0, 2).toUpperCase(),
        email: data.user?.email ?? email,
        avatar: data.user?.avatar ?? "",
        role: "client",
        accountType: "customer",
        lpBalance: 0,
        level: 1,
      });

      toast.success("Đăng nhập thành công!", {
        description: `Chào mừng ${data.user?.name ?? "bạn"}`,
      });
      router.push(`/${locale}/khach-hang`);
    } catch {
      setError("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: DS.bg, minHeight: "100vh", display: "flex", position: "relative", fontFamily: DS.body }}>
      <AuthBg />

      {/* Logo top-left */}
      <div style={{ position: "fixed", top: "1.5rem", left: "2rem", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <img
            src="/assets/design-company/logo-cosmic-infinity.png"
            alt="LOOP"
            style={{ width: 32, height: 32, objectFit: "contain" }}
          />
          <div>
            <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: 13, fontWeight: 900, letterSpacing: "0.12em" }}>LOOP</div>
            <div style={{ color: DS.text5, fontSize: 8, fontFamily: DS.mono, letterSpacing: "0.15em" }}>SOLUTIONS</div>
          </div>
        </div>
      </div>

      {/* Centered card */}
      <div style={{
        position: "relative", zIndex: 1,
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "2rem 1.5rem",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: "100%", maxWidth: 420,
            borderRadius: "1.5rem",
            padding: "2.5rem",
            background: "rgba(17,24,39,0.85)",
            backdropFilter: "blur(24px)",
            border: `1px solid ${hexRgba(DS.pink, 0.15)}`,
            boxShadow: `0 0 0 1px ${hexRgba(DS.purple, 0.08)} inset, 0 32px 80px rgba(0,0,0,0.5)`,
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            {/* Glow top bar */}
            <div style={{
              width: 48, height: 3, borderRadius: 2,
              background: `linear-gradient(90deg, ${DS.purple}, ${DS.pink})`,
              margin: "0 auto 1.5rem",
              boxShadow: `0 0 16px ${hexRgba(DS.pink, 0.5)}`,
            }} />
            <h1 style={{
              fontFamily: DS.heading, fontSize: "1.5rem", fontWeight: 900,
              letterSpacing: "0.05em",
              background: `linear-gradient(135deg, #FFFFFF 0%, ${DS.pink} 100%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              marginBottom: "0.375rem",
            }}>
              ĐĂNG NHẬP
            </h1>
            <p style={{ color: DS.text4, fontSize: "0.8125rem" }}>
              Đăng nhập để truy cập tài khoản của bạn
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <InputField
              label={t("email") ?? "Email"}
              type="email"
              placeholder="email@company.vn"
              value={email}
              onChange={setEmail}
            />
            <InputField
              label={t("password") ?? "Mật khẩu"}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={setPassword}
            />

            {/* Error */}
            {error && (
              <div style={{
                padding: "0.625rem 0.875rem", borderRadius: "0.625rem",
                background: `${hexRgba(DS.red, 0.1)}`,
                border: `1px solid ${hexRgba(DS.red, 0.3)}`,
                color: DS.red, fontSize: "0.8125rem", marginBottom: "1rem",
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                background: loading ? hexRgba(DS.pink, 0.5) : GRD.primary,
                color: "#fff", border: "none", borderRadius: "0.875rem",
                padding: "0.875rem",
                fontSize: "0.9375rem", fontWeight: 700,
                fontFamily: DS.heading, letterSpacing: "0.04em",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                boxShadow: `0 0 30px ${hexRgba(DS.pink, 0.4)}`,
                transition: "all 0.2s ease",
              }}
            >
              {loading
                ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Đang đăng nhập...</>
                : <>{t("login") ?? "Đăng nhập"} <ArrowRight size={16} /></>
              }
            </button>
          </form>

          {/* Forgot password */}
          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <button
              type="button"
              style={{
                color: DS.text4, background: "none", border: "none",
                fontSize: "0.8125rem", cursor: "pointer",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = DS.pink)}
              onMouseLeave={(e) => (e.currentTarget.style.color = DS.text4)}
            >
              Quên mật khẩu?
            </button>
          </div>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "1.5rem 0" }}>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${hexRgba(DS.purple, 0.4)}, transparent)` }} />
            <span style={{ color: DS.text5, fontSize: "0.75rem", fontFamily: DS.mono }}>HOẶC</span>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${hexRgba(DS.purple, 0.4)}, transparent)` }} />
          </div>

          {/* Google login — minimal */}
          <button
            style={{
              width: "100%",
              background: "rgba(17,24,39,0.6)",
              border: `1px solid ${hexRgba(DS.purple, 0.3)}`,
              borderRadius: "0.875rem",
              padding: "0.75rem",
              fontSize: "0.875rem", color: DS.text3,
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", gap: "0.5rem",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = hexRgba(DS.pink, 0.4);
              e.currentTarget.style.background = hexRgba(DS.pink, 0.05);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = hexRgba(DS.purple, 0.3);
              e.currentTarget.style.background = "rgba(17,24,39,0.6)";
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Tiếp tục với Google
          </button>

          {/* Footer note */}
          <p style={{ color: DS.text5, fontSize: "0.75rem", textAlign: "center", marginTop: "1.5rem", lineHeight: 1.6 }}>
            Chưa có tài khoản?{" "}
            <span style={{ color: DS.text4, cursor: "pointer" }}>
              Liên hệ để được hỗ trợ
            </span>
          </p>
        </motion.div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
