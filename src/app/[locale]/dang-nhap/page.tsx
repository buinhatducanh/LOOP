"use client";

/**
 * Customer Login Page — /vi/dang-nhap, /en/login, /ja/login, /ko/login, /zh/login
 *
 * For customers / clients of LOOP Solutions.
 * Staff login is at /nhan-vien.
 *
 * Split Auth Architecture (Option C):
 *   Customer: → POST /api/auth/login → loop-customer-token cookie → /khach-hang
 *   Google OAuth: signIn("google") → handled by /api/auth/google-callback
 *   Forgot password: /api/auth/forgot-password → /api/auth/verify-otp → /api/auth/reset-password
 */
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "motion/react";
import {
  Eye, EyeOff, ArrowRight, Check,
  Loader2, ArrowLeft, ShieldCheck, Mail,
} from "lucide-react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { DS, GRD } from "@/lib/design-tokens";
import { useAuthStore } from "@/app/store/authStore";

type AuthMode = "login" | "register" | "otp" | "reset-password";

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

// ── Input component ───────────────────────────────────────────────────────────
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
          boxShadow: focused ? `0 0 0 3px ${DS.blue}1f` : "none",
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

// ── Background ───────────────────────────────────────────────────────────────
function AuthBg() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      <div style={{
        position: "absolute", top: "-20%", right: "-10%", width: 600, height: 600,
        borderRadius: "50%",
        background: "radial-gradient(circle, ${DS.blue}14 0%, transparent 70%)",
      }} />
      <div style={{
        position: "absolute", bottom: "-20%", left: "-10%", width: 500, height: 500,
        borderRadius: "50%",
        background: "radial-gradient(circle, ${DS.purple}0f 0%, transparent 70%)",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />
    </div>
  );
}

// ── Side panel info — customer theme ─────────────────────────────────────────
function SidePanel({ locale }: { locale: string }) {
  const t = useTranslations("auth");
  const benefits = [
    { label: "500 LP tích lũy", color: DS.blue, icon: "✦" },
    { label: "Giảm giá 20%", color: DS.green, icon: "★" },
    { label: "Học viên ưu tiên", color: DS.amber, icon: "◈" },
  ];

  return (
    <div style={{
      display: "flex", flexDirection: "column", justifyContent: "space-between",
      height: "100%", padding: "2.5rem",
      background: "linear-gradient(135deg, rgba(29,78,216,0.2) 0%, rgba(129,140,248,0.12) 100%)",
      borderRight: "1px solid ${DS.blue}26",
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
          background: "${DS.green}1a",
          border: "1px solid ${DS.green}40",
        }}>
          <span style={{ color: DS.green, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.15em" }}>
            KHÁCH HÀNG
          </span>
        </div>

        <h2 style={{ fontFamily: DS.heading, fontSize: "1.75rem", fontWeight: 900, color: DS.text, lineHeight: 1.3, marginBottom: "1rem", letterSpacing: "0.04em" }}>
          Xây dựng<br />Tương lai số
        </h2>
        <p style={{ color: DS.text3, fontSize: "0.875rem", lineHeight: 1.8, marginBottom: "1.75rem" }}>
          {t("sidePanel.desc")}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {benefits.map((b) => (
            <div key={b.label} style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.75rem 1rem", borderRadius: "0.75rem",
              background: "rgba(15,23,42,0.5)",
              border: `1px solid ${b.color}30`,
            }}>
              <span style={{ color: b.color, fontSize: 18 }}>{b.icon}</span>
              <span style={{ color: DS.text3, fontSize: "0.8125rem" }}>{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        padding: "1rem", borderRadius: "1rem",
        background: "rgba(15,23,42,0.6)",
        border: "1px solid ${DS.blue}33",
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

// ── Login form ───────────────────────────────────────────────────────────────
function LoginForm({ locale, onSwitch }: { locale: string; onSwitch: (m: AuthMode) => void }) {
  const t = useTranslations("auth");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

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
        try { localStorage.setItem("loop-customer-token", data.token); } catch { /* storage unavailable */ }
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

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");
    await signIn("google", {
      callbackUrl: `/api/auth/google-callback?locale=${locale}`,
      redirect: true,
    }).catch(() => {
      setGoogleLoading(false);
      setError("");
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          marginBottom: "0.875rem", padding: "0.375rem 0.875rem",
          borderRadius: "9999px",
          background: "${DS.green}1a",
          border: "1px solid ${DS.green}40",
        }}>
          <span style={{ color: DS.green, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.15em" }}>
            KHÁCH HÀNG LOOP
          </span>
        </div>
        <h1 style={{ fontFamily: DS.heading, fontSize: "1.625rem", fontWeight: 900, letterSpacing: "0.06em", background: GRD.primary, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "0.375rem" }}>
          {t("login").toUpperCase()}
        </h1>
        <p style={{ color: DS.text3, fontSize: "0.8125rem" }}>{t("loginSubtitle")}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <FormInput label={t("email")} type="email" placeholder="email@example.com" value={email} onChange={setEmail} />
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
          <div style={{ padding: "0.625rem 0.875rem", borderRadius: "0.5rem", background: "${DS.red}14", border: "1px solid ${DS.red}40", color: "#FCA5A5", fontSize: "0.8125rem", marginBottom: "1rem" }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%", background: loading ? "${DS.blue}99" : GRD.primary,
            color: "#fff", border: "none", borderRadius: "0.75rem",
            padding: "0.8125rem", fontSize: "0.875rem",
            fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            boxShadow: "0 0 20px rgba(129,140,248,0.35)",
          }}
        >
          {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> {t("login")}...</> : <>{t("login")} <ArrowRight size={16} /></>}
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
          <img src="/assets/design-company/logo-cosmic-infinity.png" alt="LOOP" style={{ width: 18, height: 18, objectFit: "contain" }} />
        )}
        {googleLoading ? `${t("continueWithGoogle")}...` : t("continueWithGoogle")}
      </button>

      <p style={{ color: DS.text4, fontSize: "0.8125rem", textAlign: "center", marginTop: "1.5rem" }}>
        {t("noAccount")}{" "}
        <button onClick={() => onSwitch("register")} style={{ color: DS.blue, background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
          {t("registerCta")}
        </button>
      </p>

      <p style={{ color: DS.text3, fontSize: "0.75rem", textAlign: "center", marginTop: "1rem" }}>
        Nhân viên LOOP?{" "}
        <Link href={`/${locale}/nhan-vien`} style={{ color: DS.purple, textDecoration: "none", fontWeight: 600 }}>
          Đăng nhập tại đây
        </Link>
      </p>
    </motion.div>
  );
}

// ── Register form ───────────────────────────────────────────────────────────
function RegisterForm({ onSwitch }: { onSwitch: (m: AuthMode) => void }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const { login } = useAuthStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [company, setCompany] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const BUSINESS_TYPES = [
    { value: "technology", label: "Công nghệ / IT" },
    { value: "retail", label: "Bán lẻ / Thương mại" },
    { value: "finance", label: "Tài chính / Ngân hàng" },
    { value: "healthcare", label: "Y tế / Sức khoẻ" },
    { value: "education", label: "Giáo dục / Đào tạo" },
    { value: "food", label: "F&B / Thực phẩm" },
    { value: "real_estate", label: "Bất động sản" },
    { value: "manufacturing", label: "Sản xuất / Công nghiệp" },
    { value: "services", label: "Dịch vụ" },
    { value: "marketing", label: "Marketing / Truyền thông" },
    { value: "other", label: "Khác" },
  ];

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !pass) { setError("Vui lòng điền đầy đủ thông tin"); return; }
    if (pass.length < 8) { setError("Mật khẩu phải có ít nhất 8 ký tự"); return; }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password: pass, company, businessType }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Đăng ký thất bại");
        return;
      }

      if (data.token) {
        localStorage.setItem("loop-customer-token", data.token);
        await login(data.user?.email ?? email, "");
        router.push(`/dang-nhap/client-onboarding?token=${encodeURIComponent(data.token)}`);
      }
    } catch {
      setError("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

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

      <div style={{ marginBottom: "1rem" }}>
        <label style={{ color: DS.text3, fontSize: "0.6875rem", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.12em", display: "block", marginBottom: "0.375rem" }}>
          LOẠI HÌNH KINH DOANH
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

      {error && (
        <div style={{ padding: "0.625rem 0.875rem", borderRadius: "0.5rem", background: "${DS.red}14", border: "1px solid ${DS.red}40", color: "#FCA5A5", fontSize: "0.8125rem", marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{
          width: "100%", background: loading ? "${DS.blue}99" : GRD.primary, color: "#fff",
          border: "none", borderRadius: "0.75rem",
          padding: "0.8125rem", fontSize: "0.875rem", fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", gap: "0.5rem",
          boxShadow: "0 0 20px rgba(129,140,248,0.35)",
        }}
      >
        {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Đang đăng ký...</> : <>{t("submitRegister")} <ArrowRight size={16} /></>}
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

// ── OTP form ─────────────────────────────────────────────────────────────────
function OTPForm({ onSwitch, onBack }: { onSwitch: (m: AuthMode) => void; onBack: () => void }) {
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resendRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) { clearInterval(countdownRef.current!); return 0; }
          return c - 1;
        });
      }, 1000);
    }
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [countdown > 0]);

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

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) { setError("Vui lòng nhập email hợp lệ"); return; }
    setLoading(true);
    setError("");
    const res = await API.forgotPassword(email.trim());
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    if (res._dev_code) setDevCode(`Mã DEV: ${res._dev_code}`);
    setStep("otp");
    setCountdown(5 * 60);
    setResendCooldown(60);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("").trim();
    if (code.length !== 6) { setError("Vui lòng nhập đủ 6 chữ số"); return; }
    setLoading(true);
    setError("");
    const res = await API.verifyOtp(email, code);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    if (res.resetToken) { setResetToken(res.resetToken); setStep("reset"); setCountdown(10 * 60); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) { setError("Mật khẩu phải có ít nhất 8 ký tự"); return; }
    if (newPassword !== confirmPassword) { setError("Mật khẩu xác nhận không khớp"); return; }
    setLoading(true);
    setError("");
    const res = await API.resetPassword(resetToken, newPassword);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    onSwitch("login");
  };

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

  const handleOtpChange = (i: number, v: string) => {
    const val = v.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const fmtCountdown = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>

      <div style={{ display: "flex", alignItems: "center", marginBottom: "1.5rem", gap: "0.75rem" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: DS.text3, padding: 0 }}>
          <ArrowLeft size={18} />
        </button>
        <h2 style={{ fontFamily: DS.heading, fontSize: "1.25rem", fontWeight: 900, color: DS.text, margin: 0 }}>
          Quên mật khẩu
        </h2>
      </div>

      {/* Step: Email */}
      {step === "email" && (
        <form onSubmit={handleRequestOtp}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.875rem", background: "${DS.blue}14", border: "1px solid ${DS.blue}33", borderRadius: "0.75rem", marginBottom: "1.25rem" }}>
            <Mail size={16} color={DS.blue} />
            <span style={{ color: DS.text3, fontSize: "0.8125rem", lineHeight: 1.5 }}>
              Nhập email đã đăng ký. Chúng tôi sẽ gửi mã OTP 6 chữ số.
            </span>
          </div>
          <FormInput label="EMAIL" type="email" placeholder="email@company.vn" value={email} onChange={setEmail} />
          {error && (
            <div style={{ padding: "0.5rem 0.75rem", borderRadius: "0.5rem", background: "${DS.red}14", border: "1px solid ${DS.red}40", color: "#FCA5A5", fontSize: "0.8125rem", marginBottom: "1rem" }}>
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} style={{
            width: "100%", background: loading ? "${DS.blue}99" : GRD.primary,
            color: "#fff", border: "none", borderRadius: "0.75rem",
            padding: "0.8125rem", fontSize: "0.875rem", fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            boxShadow: "0 0 20px rgba(129,140,248,0.35)",
          }}>
            {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Đang gửi...</> : <><Mail size={16} /> Gửi mã OTP</>}
          </button>
        </form>
      )}

      {/* Step: OTP verify */}
      {step === "otp" && (
        <form onSubmit={handleVerifyOtp}>
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

          {devCode && (
            <div style={{ padding: "0.5rem 0.875rem", borderRadius: "0.5rem", background: "${DS.green}14", border: "1px solid ${DS.green}4d", color: DS.green, fontSize: "0.75rem", fontFamily: "'JetBrains Mono', monospace", marginBottom: "1rem", textAlign: "center" }}>
              ✅ {devCode}
            </div>
          )}

          <p style={{ color: DS.text3, fontSize: "0.8125rem", marginBottom: "1rem" }}>
            Nhập mã 6 chữ số đã gửi đến email của bạn.
          </p>

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
                  boxShadow: digit ? "0 0 10px ${DS.blue}33" : "none",
                  transition: "all 0.2s",
                }}
              />
            ))}
          </div>

          {error && (
            <div style={{ padding: "0.5rem 0.75rem", borderRadius: "0.5rem", background: "${DS.red}14", border: "1px solid ${DS.red}40", color: "#FCA5A5", fontSize: "0.8125rem", marginBottom: "1rem" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading || otp.join("").length < 6} style={{
            width: "100%", background: loading || otp.join("").length < 6 ? "${DS.blue}99" : GRD.primary,
            color: "#fff", border: "none", borderRadius: "0.75rem",
            padding: "0.8125rem", fontSize: "0.875rem", fontWeight: 700,
            cursor: loading || otp.join("").length < 6 ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            boxShadow: "0 0 20px rgba(129,140,248,0.35)",
          }}>
            {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Đang xác minh...</> : <><ShieldCheck size={16} /> Xác minh OTP</>}
          </button>

          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <button type="button" onClick={handleResend} disabled={resendCooldown > 0} style={{
              color: resendCooldown > 0 ? DS.text4 : DS.blue,
              background: "none", border: "none",
              fontSize: "0.8125rem", cursor: resendCooldown > 0 ? "not-allowed" : "pointer",
            }}>
              {resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : "Gửi lại mã OTP"}
            </button>
          </div>
        </form>
      )}

      {/* Step: Reset password */}
      {step === "reset" && (
        <form onSubmit={handleResetPassword}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.875rem", background: "${DS.green}14", border: "1px solid ${DS.green}33", borderRadius: "0.75rem", marginBottom: "1.25rem" }}>
            <ShieldCheck size={16} color={DS.green} />
            <span style={{ color: DS.text3, fontSize: "0.8125rem" }}>✅ Mã OTP đã xác minh. Đặt mật khẩu mới.</span>
          </div>

          {countdown > 0 && (
            <div style={{ color: countdown < 60 ? DS.red : DS.amber, fontSize: "0.75rem", fontFamily: "'JetBrains Mono', monospace", marginBottom: "1rem", textAlign: "center" }}>
              ⏱ Hết hạn sau {fmtCountdown(countdown)}
            </div>
          )}

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
            <div style={{ padding: "0.5rem 0.75rem", borderRadius: "0.5rem", background: "${DS.red}14", border: "1px solid ${DS.red}40", color: "#FCA5A5", fontSize: "0.8125rem", marginBottom: "1rem" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading || newPassword.length < 8 || newPassword !== confirmPassword} style={{
            width: "100%", background: loading || newPassword.length < 8 || newPassword !== confirmPassword ? "${DS.blue}99" : GRD.primary,
            color: "#fff", border: "none", borderRadius: "0.75rem",
            padding: "0.8125rem", fontSize: "0.875rem", fontWeight: 700,
            cursor: loading || newPassword.length < 8 || newPassword !== confirmPassword ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            boxShadow: "0 0 20px rgba(129,140,248,0.35)",
          }}>
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

// ── Main Page ───────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const params = useParams();
  const locale = (params.locale as string) ?? "vi";

  return (
    <div style={{ background: DS.bg, minHeight: "100vh", display: "flex", position: "relative", fontFamily: "'Inter', sans-serif" }}>
      <AuthBg />

      <div style={{ display: "flex", width: "100%", position: "relative", zIndex: 1 }}>
        {/* Side panel — customer theme */}
        <div suppressHydrationWarning style={{ display: "none" }} className="lg:flex lg:flex-col lg:w-1/2">
          <SidePanel locale={locale} />
        </div>

        {/* Form area */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
          <div style={{ width: "100%", maxWidth: "28rem" }}>
            <div style={{
              borderRadius: "1.5rem", padding: "2rem",
              background: "rgba(15,23,42,0.8)",
              backdropFilter: "blur(20px)",
              border: "1px solid ${DS.blue}26",
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
                  <OTPForm key="otp" onSwitch={setMode} onBack={() => setMode("login")} />
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
