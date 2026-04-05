"use client";

/**
 * Public Login Page — LOOP Solutions
 * Route: /vi/dang-nhap, /en/login, /ja/login, /ko/login, /zh/login
 *
 * Auth flows:
 *   1. Login credentials → POST /api/admin/auth/login
 *   2. Google OAuth → signIn("google")
 *   3. Forgot password → /api/auth/forgot-password → /api/auth/verify-otp → /api/auth/reset-password
 */
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "motion/react";
import {
  Eye, EyeOff, ArrowRight, Check,
  Loader2, ArrowLeft, ShieldCheck, Mail,
} from "lucide-react";
import { signIn } from "next-auth/react";
import { DS, GRD } from "@/lib/design-tokens";
import { useAuthStore } from "@/app/store/authStore";

type AuthMode = "login" | "register" | "otp" | "reset-password" | "onboarding";

// ── API helpers ───────────────────────────────────────────────────────────────

const API = {
  async forgotPassword(email: string) {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return res.json() as Promise<{ error?: string; _dev_code?: string; message?: string }>;
  },
  async verifyOtp(email: string, code: string) {
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    return res.json() as Promise<{ error?: string; resetToken?: string; message?: string }>;
  },
  async resetPassword(resetToken: string, newPassword: string) {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetToken, newPassword }),
    });
    return res.json() as Promise<{ error?: string; message?: string }>;
  },
};

// ── Input component ────────────────────────────────────────────────────────────
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

// ── Background ────────────────────────────────────────────────────────────────
function AuthBg() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 30% 30%, rgba(29,78,216,0.15) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(129,140,248,0.1) 0%, transparent 55%)",
      }} />
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.02 }}>
        <defs>
          <pattern id="hex-auth" width="40" height="46" patternUnits="userSpaceOnUse">
            <path d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z" fill="none" stroke="#3B82F6" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex-auth)" />
      </svg>
    </div>
  );
}

// ── Side panel info ───────────────────────────────────────────────────────────
function SidePanel({ locale }: { locale: string }) {
  const t = useTranslations("auth");
  const ranks = [
    { label: "IRON", color: "#9CA3AF", symbol: "⬡" },
    { label: "GOLD", color: "#FFD700", symbol: "★" },
    { label: "DIAMOND", color: "#818CF8", symbol: "✦" },
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

        <h2 style={{ fontFamily: DS.heading, fontSize: "1.75rem", fontWeight: 900, color: DS.text, lineHeight: 1.3, marginBottom: "1rem", letterSpacing: "0.04em" }}>
          Xây dựng<br />Tương lai số
        </h2>
        <p style={{ color: DS.text3, fontSize: "0.875rem", lineHeight: 1.8, marginBottom: "1.75rem" }}>
          {t("sidePanel.desc")}
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
                <div style={{ color: DS.text5, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace" }}>{t("sidePanel.rankTier")}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        padding: "1rem", borderRadius: "1rem",
        background: "rgba(15,23,42,0.6)",
        border: "1px solid rgba(59,130,246,0.2)",
      }}>
        <div style={{ color: DS.text4, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.15em", marginBottom: "0.375rem" }}>
          {t("sidePanel.welcomeNewMember").toUpperCase()}
        </div>
        <div style={{ color: DS.blue, fontFamily: DS.heading, fontSize: "1.5rem", fontWeight: 900, textShadow: "0 0 12px rgba(59,130,246,0.5)" }}>
          500 LP
        </div>
        <div style={{ color: DS.text3, fontSize: "0.75rem" }}>
          {t("sidePanel.welcomeReward")}
        </div>
      </div>
    </div>
  );
}

// ── Login form ────────────────────────────────────────────────────────────────
function LoginForm({ locale, onSwitch }: { locale: string; onSwitch: (m: AuthMode) => void }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const { login, isLoading, error, clearError, user } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    clearError();

    const ok = await login(email, password);
    if (ok) {
      const dest = user?.role === "client" ? `/${locale}/khach-hang` : "/admin/overview";
      router.push(dest);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    clearError();
    await signIn("google", {
      callbackUrl: `/api/auth/google-callback?locale=${locale}`,
      redirect: true,
    }).catch(() => {
      setGoogleLoading(false);
      clearError();
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: DS.heading, fontSize: "1.625rem", fontWeight: 900, letterSpacing: "0.06em", background: GRD.primary, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "0.375rem" }}>
          {t("login").toUpperCase()}
        </h1>
        <p style={{ color: DS.text3, fontSize: "0.8125rem" }}>{t("loginSubtitle")}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <FormInput label={t("email")} type="email" placeholder="email@company.vn" value={email} onChange={setEmail} />
        <FormInput label={t("password")} type="password" placeholder="••••••••" value={password} onChange={setPassword} />

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.25rem" }}>
          <button
            type="button"
            onClick={() => onSwitch("otp")}
            style={{ color: DS.blue, background: "none", border: "none", fontSize: "0.75rem", cursor: "pointer" }}
          >
            {t("forgotPassword")}
          </button>
        </div>

        {error && (
          <div style={{ padding: "0.625rem 0.875rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5", fontSize: "0.8125rem", marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: "100%", background: isLoading ? "rgba(59,130,246,0.6)" : GRD.primary,
            color: "#fff", border: "none", borderRadius: "0.75rem",
            padding: "0.8125rem", fontSize: "0.875rem",
            fontWeight: 700, cursor: isLoading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            boxShadow: "0 0 20px rgba(129,140,248,0.35)",
          }}
        >
          {isLoading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> {t("login")}...</> : <>{t("login")} <ArrowRight size={16} /></>}
        </button>
      </form>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "1.25rem 0" }}>
        <div style={{ flex: 1, height: 1, background: DS.border }} />
        <span style={{ color: DS.text5, fontSize: "0.75rem" }}>{t("or")}</span>
        <div style={{ flex: 1, height: 1, background: DS.border }} />
      </div>

      <button
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
        style={{
          width: "100%",
          background: googleLoading ? "rgba(15,23,42,0.6)" : DS.bgCard2,
          border: `1px solid ${DS.border}`,
          borderRadius: "0.75rem",
          padding: "0.75rem",
          fontSize: "0.8125rem",
          color: DS.text2,
          cursor: googleLoading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          transition: "all 0.15s",
        }}
      >
        {googleLoading ? (
          <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        {googleLoading ? `${t("continueWithGoogle")}...` : t("continueWithGoogle")}
      </button>

      <p style={{ color: DS.text4, fontSize: "0.8125rem", textAlign: "center", marginTop: "1.5rem" }}>
        {t("noAccount")}{" "}
        <button onClick={() => onSwitch("register")} style={{ color: DS.blue, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
          {t("registerCta")}
        </button>
      </p>
    </motion.div>
  );
}

// ── Register form ────────────────────────────────────────────────────────────
function RegisterForm({ onSwitch }: { onSwitch: (m: AuthMode) => void }) {
  const t = useTranslations("auth");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [company, setCompany] = useState("");

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
      <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
        <h1 style={{ fontFamily: DS.heading, fontSize: "1.5rem", fontWeight: 900, letterSpacing: "0.06em", background: GRD.primary, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "0.375rem" }}>
          {t("register").toUpperCase()}
        </h1>
        <p style={{ color: DS.text3, fontSize: "0.8125rem" }}>{t("registerSubtitle")}</p>
      </div>

      <FormInput label={t("name")} placeholder="Nguyễn Văn A" value={name} onChange={setName} />
      <FormInput label={t("email")} type="email" placeholder="email@company.vn" value={email} onChange={setEmail} />
      <FormInput label={t("companyOptional")} placeholder="Công ty TNHH..." value={company} onChange={setCompany} />
      <FormInput label={t("password")} type="password" placeholder="Tối thiểu 8 ký tự" value={pass} onChange={setPass} />

      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1rem" }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: pass.length > i * 2
              ? (i < 2 ? DS.amber : DS.green)
              : DS.border,
          }} />
        ))}
      </div>

      <button
        onClick={() => onSwitch("otp")}
        style={{
          width: "100%", background: GRD.primary, color: "#fff",
          border: "none", borderRadius: "0.75rem",
          padding: "0.8125rem", fontSize: "0.875rem", fontWeight: 700,
          cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", gap: "0.5rem",
          boxShadow: "0 0 20px rgba(129,140,248,0.35)",
        }}
      >
        {t("submitRegister")} <ArrowRight size={16} />
      </button>

      <p style={{ color: DS.text5, fontSize: "0.6875rem", textAlign: "center", marginTop: "0.875rem", lineHeight: 1.6 }}>
        {t("termsAgree")}
      </p>

      <p style={{ color: DS.text4, fontSize: "0.8125rem", textAlign: "center", marginTop: "1rem" }}>
        {t("hasAccount")}{" "}
        <button onClick={() => onSwitch("login")} style={{ color: DS.blue, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
          {t("login")}
        </button>
      </p>
    </motion.div>
  );
}

// ── Forgot Password flow (OTP) form ──────────────────────────────────────────
function OTPForm({ onSwitch, onBack }: { onSwitch: (m: AuthMode) => void; onBack: () => void }) {
  const t = useTranslations("auth");
  const router = useRouter();

  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState(""); // DEV only: show code
  const [resetToken, setResetToken] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resendRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(countdownRef.current!);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [countdown > 0]);

  // Resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      resendRef.current = setInterval(() => {
        setResendCooldown((c) => {
          if (c <= 1) { clearInterval(resendRef.current!); return 0; }
          return c - 1;
        });
      }, 1000);
    }
    return () => { if (resendRef.current) clearInterval(resendRef.current); };
  }, [resendCooldown > 0]);

  // ── Step 1: request OTP ────────────────────────────────────────────────
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Vui lòng nhập email hợp lệ"); return;
    }
    setLoading(true);
    setError("");

    const res = await API.forgotPassword(email.trim());
    setLoading(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    // DEV: show OTP in console (or in devCode state)
    if (res._dev_code) {
      setDevCode(`Mã DEV: ${res._dev_code}`);
    }

    setStep("otp");
    setCountdown(5 * 60); // 5 minutes
    setResendCooldown(60); // 1 min resend cooldown
  };

  // ── Step 2: verify OTP ──────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("").trim();
    if (code.length !== 6) { setError("Vui lòng nhập đủ 6 chữ số"); return; }

    setLoading(true);
    setError("");
    const res = await API.verifyOtp(email, code);
    setLoading(false);

    if (res.error) { setError(res.error); return; }

    if (res.resetToken) {
      setResetToken(res.resetToken);
      setStep("reset");
      setCountdown(10 * 60); // 10 min to reset
    }
  };

  // ── Step 3: reset password ───────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) { setError("Mật khẩu phải có ít nhất 8 ký tự"); return; }
    if (newPassword !== confirmPassword) { setError("Mật khẩu xác nhận không khớp"); return; }

    setLoading(true);
    setError("");
    const res = await API.resetPassword(resetToken, newPassword);
    setLoading(false);

    if (res.error) { setError(res.error); return; }

    // Success → go back to login
    onSwitch("login");
  };

  // ── Resend ─────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError("");
    const res = await API.forgotPassword(email.trim());
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    if (res._dev_code) setDevCode(`Mã DEV: ${res._dev_code}`);
    setOtp(["", "", "", "", "", ""]);
    setCountdown(5 * 60);
    setResendCooldown(60);
  };

  // ── OTP input change ────────────────────────────────────────────────
  const handleOtpChange = (i: number, v: string) => {
    const val = v.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const fmtCountdown = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: "1.5rem", gap: "0.75rem" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: DS.text3, padding: 0 }}>
          <ArrowLeft size={18} />
        </button>
        <h2 style={{ fontFamily: DS.heading, fontSize: "1.25rem", fontWeight: 900, color: DS.text, margin: 0 }}>
          Quên mật khẩu
        </h2>
      </div>

      {/* ── Step: Email input ── */}
      {step === "email" && (
        <form onSubmit={handleRequestOtp}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.875rem", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "0.75rem", marginBottom: "1.25rem" }}>
            <Mail size={16} color={DS.blue} />
            <span style={{ color: DS.text3, fontSize: "0.8125rem", lineHeight: 1.5 }}>
              Nhập email đã đăng ký. Chúng tôi sẽ gửi mã OTP 6 chữ số.
            </span>
          </div>

          <FormInput label="EMAIL" type="email" placeholder="email@company.vn" value={email} onChange={setEmail} />

          {error && (
            <div style={{ padding: "0.5rem 0.75rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5", fontSize: "0.8125rem", marginBottom: "1rem" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", background: loading ? "rgba(59,130,246,0.6)" : GRD.primary,
              color: "#fff", border: "none", borderRadius: "0.75rem",
              padding: "0.8125rem", fontSize: "0.875rem", fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              boxShadow: "0 0 20px rgba(129,140,248,0.35)",
            }}
          >
            {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Đang gửi...</> : <><Mail size={16} /> Gửi mã OTP</>}
          </button>
        </form>
      )}

      {/* ── Step: OTP verify ── */}
      {step === "otp" && (
        <form onSubmit={handleVerifyOtp}>
          {/* Email recap + countdown */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Mail size={14} color={DS.blue} />
              <span style={{ color: DS.text3, fontSize: "0.8125rem" }}>{email}</span>
            </div>
            {countdown > 0 && (
              <span style={{ color: countdown < 60 ? DS.red : DS.amber, fontSize: "0.75rem", fontFamily: "'JetBrains Mono', monospace" }}>
                ⏱ {fmtCountdown(countdown)}
              </span>
            )}
          </div>

          {/* DEV code banner */}
          {devCode && (
            <div style={{ padding: "0.5rem 0.875rem", borderRadius: "0.5rem", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", color: DS.green, fontSize: "0.75rem", fontFamily: "'JetBrains Mono', monospace", marginBottom: "1rem", textAlign: "center" }}>
              ✅ {devCode}
            </div>
          )}

          <p style={{ color: DS.text3, fontSize: "0.8125rem", marginBottom: "1rem" }}>
            Nhập mã 6 chữ số đã gửi đến email của bạn.
          </p>

          {/* OTP inputs */}
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginBottom: "1.25rem" }}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { otpRefs.current[i] = el; }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKey(i, e)}
                style={{
                  width: 44, height: 52, textAlign: "center",
                  fontSize: "1.25rem", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                  background: DS.bgCard2,
                  border: `1.5px solid ${digit ? DS.blue : DS.border}`,
                  borderRadius: 10, color: DS.blue, outline: "none",
                  boxShadow: digit ? "0 0 10px rgba(59,130,246,0.2)" : "none",
                  transition: "all 0.2s",
                }}
              />
            ))}
          </div>

          {error && (
            <div style={{ padding: "0.5rem 0.75rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5", fontSize: "0.8125rem", marginBottom: "1rem" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || otp.join("").length < 6}
            style={{
              width: "100%", background: loading || otp.join("").length < 6 ? "rgba(59,130,246,0.6)" : GRD.primary,
              color: "#fff", border: "none", borderRadius: "0.75rem",
              padding: "0.8125rem", fontSize: "0.875rem", fontWeight: 700,
              cursor: loading || otp.join("").length < 6 ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              boxShadow: "0 0 20px rgba(129,140,248,0.35)",
            }}
          >
            {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Đang xác minh...</> : <><ShieldCheck size={16} /> Xác minh OTP</>}
          </button>

          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              style={{
                color: resendCooldown > 0 ? DS.text4 : DS.blue,
                background: "none", border: "none",
                fontSize: "0.8125rem", cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
              }}
            >
              {resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : "Gửi lại mã OTP"}
            </button>
          </div>
        </form>
      )}

      {/* ── Step: Set new password ── */}
      {step === "reset" && (
        <form onSubmit={handleResetPassword}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.875rem", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "0.75rem", marginBottom: "1.25rem" }}>
            <ShieldCheck size={16} color={DS.green} />
            <span style={{ color: DS.text3, fontSize: "0.8125rem" }}>
              ✅ Mã OTP đã xác minh. Đặt mật khẩu mới.
            </span>
          </div>

          {countdown > 0 && (
            <div style={{ color: countdown < 60 ? DS.red : DS.amber, fontSize: "0.75rem", fontFamily: "'JetBrains Mono', monospace", marginBottom: "1rem", textAlign: "center" }}>
              ⏱ Hết hạn sau {fmtCountdown(countdown)}
            </div>
          )}

          {/* New password */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ color: DS.text3, fontSize: "0.6875rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.12em", display: "block", marginBottom: "0.375rem" }}>
              MẬT KHẨU MỚI
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0 0.875rem", background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: "0.75rem", height: 44 }}>
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 8 ký tự"
                style={{ flex: 1, background: "none", border: "none", outline: "none", color: DS.text, fontSize: "0.875rem", fontFamily: "'Inter', sans-serif" }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: "none", border: "none", cursor: "pointer", color: DS.text4, padding: 0 }}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ color: DS.text3, fontSize: "0.6875rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.12em", display: "block", marginBottom: "0.375rem" }}>
              XÁC NHẬN MẬT KHẨU
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0 0.875rem", background: DS.bgCard2, border: `1px solid ${confirmPassword && newPassword !== confirmPassword ? DS.red : DS.border}`, borderRadius: "0.75rem", height: 44 }}>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                style={{ flex: 1, background: "none", border: "none", outline: "none", color: DS.text, fontSize: "0.875rem", fontFamily: "'Inter', sans-serif" }}
              />
              {confirmPassword && (
                newPassword === confirmPassword
                  ? <Check size={15} color={DS.green} />
                  : <span style={{ color: DS.red, fontSize: "0.75rem" }}>✗</span>
              )}
            </div>
          </div>

          {error && (
            <div style={{ padding: "0.5rem 0.75rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5", fontSize: "0.8125rem", marginBottom: "1rem" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword}
            style={{
              width: "100%", background: loading || newPassword.length < 8 || newPassword !== confirmPassword ? "rgba(59,130,246,0.6)" : GRD.primary,
              color: "#fff", border: "none", borderRadius: "0.75rem",
              padding: "0.8125rem", fontSize: "0.875rem", fontWeight: 700,
              cursor: loading || newPassword.length < 8 || newPassword !== confirmPassword ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              boxShadow: "0 0 20px rgba(129,140,248,0.35)",
            }}
          >
            {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Đang đặt lại...</> : <><ShieldCheck size={16} /> Đặt lại mật khẩu</>}
          </button>

          <p style={{ color: DS.text4, fontSize: "0.8125rem", textAlign: "center", marginTop: "1rem" }}>
            Nhớ mật khẩu rồi?{" "}
            <button onClick={onBack} style={{ color: DS.blue, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
              Đăng nhập
            </button>
          </p>
        </form>
      )}
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [locale, setLocale] = useState("vi");

  useEffect(() => {
    params.then((p) => setLocale(p.locale));
  }, [params]);

  return (
    <div style={{ background: DS.bg, minHeight: "100vh", display: "flex", position: "relative", fontFamily: "'Inter', sans-serif" }}>
      <AuthBg />

      <div style={{ display: "flex", width: "100%", position: "relative", zIndex: 1 }}>
        <div style={{ display: "none" }} className="lg:flex lg:flex-col lg:w-1/2">
          <SidePanel locale={locale} />
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
          <div style={{ width: "100%", maxWidth: "28rem" }}>
            <div style={{
              borderRadius: "1.5rem", padding: "2rem",
              background: "rgba(15,23,42,0.8)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(59,130,246,0.15)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
            }}>
              <AnimatePresence mode="wait">
                {mode === "login" && (
                  <LoginForm key="login" locale={locale} onSwitch={setMode} />
                )}
                {mode === "register" && (
                  <RegisterForm key="register" onSwitch={setMode} />
                )}
                {(mode === "otp" || mode === "reset-password") && (
                  <OTPForm
                    key="otp"
                    onSwitch={setMode}
                    onBack={() => setMode("login")}
                  />
                )}
              </AnimatePresence>
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
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
