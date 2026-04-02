"use client";

/**
 * Public Login Page — LOOP Solutions
 * Route: /vi/dang-nhap, /en/login, /ja/login, /ko/login, /zh/login
 *
 * Design adapted from FE/AuthPage.tsx.
 * Wires to real POST /api/admin/auth/login → JWT → role-based redirect:
 *   client  → /{locale}/khach-hang
 *   staff   → /admin/overview
 */
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "motion/react";
import {
  Eye, EyeOff, ArrowRight, Check, Shield,
  Zap, Loader2,
} from "lucide-react";
import { signIn } from "next-auth/react";
import { DS, GRD } from "@/lib/design-tokens";
import { useAuthStore } from "@/app/store/authStore";

type AuthMode = "login" | "register" | "otp" | "onboarding";

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
      {/* Logo */}
      <div>
        <Link href={`/${locale}`} style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none", marginBottom: "2.5rem" }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: GRD.primary, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#fff", fontSize: 18, fontWeight: 900, fontFamily: "serif" }}>∞</span>
          </div>
          <div>
            <div style={{ color: DS.text, fontFamily: "'Cinzel', serif", fontSize: 15, fontWeight: 900, letterSpacing: "0.1em" }}>LOOP SOLUTIONS</div>
            <div style={{ color: DS.text5, fontSize: 9, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.2em" }}>DIGITAL AGENCY OS</div>
          </div>
        </Link>

        <h2 style={{
          fontFamily: "'Cinzel', serif", fontSize: "1.75rem", fontWeight: 900,
          color: DS.text, lineHeight: 1.3, marginBottom: "1rem", letterSpacing: "0.04em",
        }}>
          Xây dựng<br />Tương lai số
        </h2>
        <p style={{ color: DS.text3, fontSize: "0.875rem", lineHeight: 1.8, marginBottom: "1.75rem" }}>
          {t("sidePanel.desc")}
        </p>

        {/* Rank badges */}
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

      {/* LP welcome card */}
      <div style={{
        padding: "1rem 1rem", borderRadius: "1rem",
        background: "rgba(15,23,42,0.6)",
        border: "1px solid rgba(59,130,246,0.2)",
      }}>
        <div style={{
          color: DS.text4, fontSize: "0.625rem",
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "0.15em", marginBottom: "0.375rem",
        }}>
          {t("sidePanel.welcomeNewMember").toUpperCase()}
        </div>
        <div style={{
          color: DS.blue, fontFamily: "'Cinzel', serif",
          fontSize: "1.5rem", fontWeight: 900,
          textShadow: "0 0 12px rgba(59,130,246,0.5)",
        }}>
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
function LoginForm({
  locale,
  onSwitch,
}: {
  locale: string;
  onSwitch: (m: AuthMode) => void;
}) {
  const t = useTranslations("auth");
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const { user, isAuthenticated } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const dest = user.role === "client"
        ? `/${locale}/khach-hang`
        : "/admin/overview";
      router.push(dest);
    }
  }, [isAuthenticated, user, locale, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    clearError();

    const ok = await login(email, password);
    if (ok) {
      // login() already called fetchSession() → store updated
      // Small delay to let store settle, then redirect
      setTimeout(() => {
        const state = useAuthStore.getState();
        const dest = state.user?.role === "client"
          ? `/${locale}/khach-hang`
          : "/admin/overview";
        router.push(dest);
      }, 100);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    clearError();
    // NextAuth v5 — redirect through Google OAuth
    // callbackUrl = our bridge route → creates JWT cookie → redirects to destination
    await signIn("google", {
      callbackUrl: `/api/auth/google-callback?locale=${locale}`,
      redirect: true,
    }).catch(() => {
      setGoogleLoading(false);
      clearError();
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 style={{
          fontFamily: "'Cinzel', serif", fontSize: "1.625rem",
          fontWeight: 900, letterSpacing: "0.06em",
          background: GRD.primary, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          marginBottom: "0.375rem",
        }}>
          {t("login").toUpperCase()}
        </h1>
        <p style={{ color: DS.text3, fontSize: "0.8125rem" }}>{t("loginSubtitle")}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <FormInput
          label={t("email")}
          type="email"
          placeholder="email@company.vn"
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
            style={{ color: DS.blue, background: "none", border: "none", fontSize: "0.75rem", cursor: "pointer" }}
          >
            {t("forgotPassword")}
          </button>
        </div>

        {error && (
          <div style={{
            padding: "0.625rem 0.875rem", borderRadius: "0.5rem",
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
            color: "#FCA5A5", fontSize: "0.8125rem", marginBottom: "1rem",
          }}>
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
          {isLoading ? (
            <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> {t("login")}...</>
          ) : (
            <>{t("login")} <ArrowRight size={16} /></>
          )}
        </button>
      </form>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "1.25rem 0" }}>
        <div style={{ flex: 1, height: 1, background: DS.border }} />
        <span style={{ color: DS.text5, fontSize: "0.75rem" }}>{t("or")}</span>
        <div style={{ flex: 1, height: 1, background: DS.border }} />
      </div>

      {/* Google */}
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
        <button
          onClick={() => onSwitch("register")}
          style={{ color: DS.blue, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
        >
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
        <h1 style={{
          fontFamily: "'Cinzel', serif", fontSize: "1.5rem",
          fontWeight: 900, letterSpacing: "0.06em",
          background: GRD.primary, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          marginBottom: "0.375rem",
        }}>
          {t("register").toUpperCase()}
        </h1>
        <p style={{ color: DS.text3, fontSize: "0.8125rem" }}>{t("registerSubtitle")}</p>
      </div>

      <FormInput label={t("name")} placeholder="Nguyễn Văn A" value={name} onChange={setName} />
      <FormInput label={t("email")} type="email" placeholder="email@company.vn" value={email} onChange={setEmail} />
      <FormInput label={t("companyOptional")} placeholder="Công ty TNHH..." value={company} onChange={setCompany} />
      <FormInput label={t("password")} type="password" placeholder="Tối thiểu 8 ký tự" value={pass} onChange={setPass} />

      {/* Password strength */}
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

      <p style={{
        color: DS.text5, fontSize: "0.6875rem",
        textAlign: "center", marginTop: "0.875rem", lineHeight: 1.6,
      }}>
        {t("termsAgree")}
      </p>

      <p style={{ color: DS.text4, fontSize: "0.8125rem", textAlign: "center", marginTop: "1rem" }}>
        {t("hasAccount")}{" "}
        <button
          onClick={() => onSwitch("login")}
          style={{ color: DS.blue, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
        >
          {t("login")}
        </button>
      </p>
    </motion.div>
  );
}

// ── OTP form ────────────────────────────────────────────────────────────────
function OTPForm({ onSwitch }: { onSwitch: (m: AuthMode) => void }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📱</div>
        <h2 style={{
          fontFamily: "'Cinzel', serif", fontSize: "1.375rem",
          fontWeight: 900, letterSpacing: "0.06em", color: DS.text, marginBottom: "0.375rem",
        }}>
          {t("otp.title").toUpperCase()}
        </h2>
        <p style={{ color: DS.text3, fontSize: "0.8125rem" }}>
          {t("otp.desc")}<br />
          <span style={{ color: DS.text2, fontWeight: 700 }}>user@example.com</span>
        </p>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginBottom: "2rem" }}>
        {otp.map((digit, i) => (
          <input
            key={i}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => {
              const v = e.target.value.slice(-1);
              const next = [...otp];
              next[i] = v;
              setOtp(next);
            }}
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

      <button
        onClick={() => router.push("/admin/overview")}
        style={{
          width: "100%", background: GRD.primary, color: "#fff",
          border: "none", borderRadius: "0.75rem",
          padding: "0.8125rem", fontSize: "0.875rem", fontWeight: 700,
          cursor: "pointer", boxShadow: "0 0 20px rgba(129,140,248,0.35)",
        }}
      >
        {t("otp.verify")}
      </button>

      <div style={{ textAlign: "center", marginTop: "1rem" }}>
        <button style={{ color: DS.text4, background: "none", border: "none", fontSize: "0.8125rem", cursor: "pointer" }}>
          {t("otp.resendHint")}{" "}
          <span style={{ color: DS.blue }}>{t("otp.resend")}</span>
        </button>
      </div>
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [locale, setLocale] = useState("vi");

  useEffect(() => {
    params.then((p) => setLocale(p.locale));
  }, [params]);

  return (
    <div style={{
      background: DS.bg, minHeight: "100vh",
      display: "flex", position: "relative", fontFamily: "'Inter', sans-serif",
    }}>
      <AuthBg />

      <div style={{ display: "flex", width: "100%", position: "relative", zIndex: 1 }}>
        {/* Left panel — hidden on mobile */}
        <div style={{
          display: "none",
        }} className="lg:flex lg:flex-col lg:w-1/2">
          <SidePanel locale={locale} />
        </div>

        {/* Right: form */}
        <div style={{
          flex: 1, display: "flex", alignItems: "center",
          justifyContent: "center", padding: "1.5rem",
        }}>
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
                {mode === "otp" && (
                  <OTPForm key="otp" onSwitch={setMode} />
                )}
              </AnimatePresence>
            </div>

            {/* Back to home */}
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
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
