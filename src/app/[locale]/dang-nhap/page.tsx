"use client";

/**
 * Auth Page — /vi/dang-nhap  +  /vi/dang-ky
 *
 * Shared layout: LEFT brand panel (cosmic LOOP) + RIGHT auth card (Login ↔ Register tabs).
 * Uses shared /api/auth/register endpoint.
 */
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, Shield, Users, Zap, Star, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { DS, GRD, GLOW } from "@/lib/design-tokens";
import { useAuthStore } from "@/app/store/authStore";

function hexRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Shared Input ──────────────────────────────────────────────────────────────
function AuthInput({
  label, type = "text", placeholder, value, onChange, autoComplete, error,
}: {
  label: string; type?: string; placeholder: string; value: string;
  onChange: (v: string) => void; autoComplete?: string; error?: string;
}) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPassword = type === "password";
  const borderColor = error
    ? hexRgba(DS.red ?? "#EF4444", 0.7)
    : focused
    ? hexRgba(DS.pink, 0.8)
    : "rgba(107,61,245,0.25)";

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
        border: `1.5px solid ${borderColor}`,
        borderRadius: "0.875rem",
        boxShadow: focused && !error ? `0 0 0 3px ${hexRgba(DS.pink, 0.12)}` : "none",
        transition: "all 0.2s ease",
        height: 52,
      }}>
        <input
          type={isPassword ? (show ? "text" : "password") : type}
          placeholder={placeholder}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1, background: "none", border: "none", outline: "none",
            color: DS.text, fontSize: "0.9375rem", fontFamily: DS.body,
          }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(!show)}
            style={{ color: DS.text4, background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}>
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && (
        <div style={{
          color: DS.red ?? "#EF4444", fontSize: "0.75rem",
          fontFamily: DS.mono, marginTop: "0.375rem", display: "flex", alignItems: "center", gap: "0.25rem",
        }}>
          <AlertCircle size={11} />
          {error}
        </div>
      )}
    </div>
  );
}

// ── Feature highlight (left panel) ──────────────────────────────────────────────
function FeatureRow({ icon, label, desc }: { icon: React.ReactNode; label: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: hexRgba(DS.pink, 0.12),
        border: `1px solid ${hexRgba(DS.pink, 0.25)}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ color: DS.text, fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.125rem" }}>{label}</div>
        <div style={{ color: DS.text4, fontSize: "0.75rem", lineHeight: 1.5 }}>{desc}</div>
      </div>
    </div>
  );
}

// ── Stats row (left panel) ────────────────────────────────────────────────────
function StatBadge({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div style={{ fontFamily: DS.heading, fontSize: "1.5rem", fontWeight: 900, background: GRD.primary, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        {value}
      </div>
      <div style={{ color: DS.text5, fontSize: "0.6875rem", fontFamily: DS.mono, letterSpacing: "0.08em" }}>{label}</div>
    </div>
  );
}

// ── Register Form ─────────────────────────────────────────────────────────────
function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) ?? "vi";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Họ tên là bắt buộc";
    if (!email.trim()) errs.email = "Email là bắt buộc";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Email không hợp lệ";
    if (!password) errs.password = "Mật khẩu là bắt buộc";
    else if (password.length < 8) errs.password = "Tối thiểu 8 ký tự";
    if (confirmPwd !== password) errs.confirmPwd = "Mật khẩu xác nhận không khớp";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError("");
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone }),
      });
      const data = await res.json();
      if (res.status === 201 || res.ok) {
        toast.success("Đăng ký thành công!", { description: "Vui lòng đăng nhập để tiếp tục." });
        router.push(`/${locale}/dang-nhap?registered=1`);
        return;
      }
      if (res.status === 409) {
        setGlobalError(data.error ?? "Email đã được sử dụng");
        setFieldErrors((p) => ({ ...p, email: data.error ?? "Email đã được sử dụng" }));
        return;
      }
      setGlobalError(data.error ?? "Đăng ký thất bại. Vui lòng thử lại.");
    } catch {
      setGlobalError("Không thể kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  const isValid = name.trim() && email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length >= 8 && confirmPwd === password;

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
        <div style={{
          width: 48, height: 3, borderRadius: 2,
          background: `linear-gradient(90deg, ${DS.purple}, ${DS.pink})`,
          margin: "0 auto 1rem",
          boxShadow: `0 0 16px ${hexRgba(DS.pink, 0.5)}`,
        }} />
        <h2 style={{
          fontFamily: DS.heading, fontSize: "1.375rem", fontWeight: 900,
          background: `linear-gradient(135deg, #FFFFFF 0%, ${DS.pink} 100%)`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          marginBottom: "0.375rem",
        }}>
          TẠO TÀI KHOẢN MỚI
        </h2>
        <p style={{ color: DS.text4, fontSize: "0.8125rem" }}>
          Đăng ký miễn phí để trải nghiệm dịch vụ
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <AuthInput
          label="Họ và tên"
          placeholder="Nguyễn Văn A"
          value={name}
          onChange={(v) => { setName(v); setFieldErrors((p) => ({ ...p, name: "" })); }}
          autoComplete="name"
          error={fieldErrors.name}
        />
        <AuthInput
          label="Email"
          placeholder="email@company.vn"
          type="email"
          value={email}
          onChange={(v) => { setEmail(v); setFieldErrors((p) => ({ ...p, email: "" })); }}
          autoComplete="email"
          error={fieldErrors.email}
        />
        <AuthInput
          label="Số điện thoại (tùy chọn)"
          placeholder="0xxx xxx xxx"
          type="tel"
          value={phone}
          onChange={setPhone}
          autoComplete="tel"
        />
        <AuthInput
          label="Mật khẩu"
          placeholder="Ít nhất 8 ký tự"
          type="password"
          value={password}
          onChange={(v) => { setPassword(v); setFieldErrors((p) => ({ ...p, password: "" })); }}
          autoComplete="new-password"
          error={fieldErrors.password}
        />
        <AuthInput
          label="Xác nhận mật khẩu"
          placeholder="Nhập lại mật khẩu"
          type="password"
          value={confirmPwd}
          onChange={(v) => { setConfirmPwd(v); setFieldErrors((p) => ({ ...p, confirmPwd: "" })); }}
          autoComplete="new-password"
          error={fieldErrors.confirmPwd}
        />

        {globalError && (
          <div style={{
            padding: "0.625rem 0.875rem", borderRadius: "0.625rem",
            background: `${hexRgba(DS.red ?? "#EF4444", 0.1)}`,
            border: `1px solid ${hexRgba(DS.red ?? "#EF4444", 0.3)}`,
            color: DS.red ?? "#EF4444", fontSize: "0.8125rem",
            marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem",
          }}>
            <AlertCircle size={14} />
            {globalError}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !isValid}
          style={{
            width: "100%",
            background: loading || !isValid ? hexRgba(DS.pink, 0.4) : GRD.primary,
            color: "#fff", border: "none", borderRadius: "0.875rem",
            padding: "0.875rem",
            fontSize: "0.9375rem", fontWeight: 700,
            fontFamily: DS.heading, letterSpacing: "0.04em",
            cursor: loading || !isValid ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            boxShadow: `0 0 30px ${hexRgba(DS.pink, 0.4)}`,
            transition: "all 0.2s ease",
          }}
        >
          {loading ? (
            <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Đang xử lý...</>
          ) : (
            <><CheckCircle2 size={16} /> Tạo tài khoản</>
          )}
        </button>
      </form>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "1.5rem 0" }}>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${hexRgba(DS.purple, 0.4)}, transparent)` }} />
        <span style={{ color: DS.text5, fontSize: "0.75rem", fontFamily: DS.mono }}>HOẶC</span>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${hexRgba(DS.purple, 0.4)}, transparent)` }} />
      </div>

      <button
        onClick={() => window.location.href = "/api/admin/auth/google-signin"}
        style={{
          width: "100%", background: "rgba(17,24,39,0.6)",
          border: `1px solid ${hexRgba(DS.purple, 0.3)}`,
          borderRadius: "0.875rem", padding: "0.75rem",
          fontSize: "0.875rem", color: DS.text3,
          cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", gap: "0.5rem", transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = hexRgba(DS.pink, 0.5);
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
        Đăng ký với Google
      </button>

      <p style={{ color: DS.text5, fontSize: "0.6875rem", textAlign: "center", marginTop: "1.25rem", lineHeight: 1.6 }}>
        Bằng việc đăng ký, bạn đồng ý với{" "}
        <span style={{ color: DS.pink, cursor: "pointer" }}>Điều khoản</span>{" "}
        và{" "}
        <span style={{ color: DS.pink, cursor: "pointer" }}>Chính sách bảo mật</span>.
      </p>

      <div style={{ textAlign: "center", marginTop: "1rem", paddingTop: "1rem", borderTop: `1px solid ${DS.border}` }}>
        <span style={{ color: DS.text5, fontSize: "0.8125rem" }}>
          Đã có tài khoản?{" "}
        </span>
        <button
          onClick={onSwitch}
          style={{
            color: DS.pink, fontSize: "0.8125rem", fontWeight: 600,
            background: "none", border: "none", cursor: "pointer", padding: 0,
          }}
        >
          Đăng nhập ngay
        </button>
      </div>
    </div>
  );
}

// ── Login Form ────────────────────────────────────────────────────────────────
function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) ?? "vi";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<{ name: string; role: string } | null>(null);
  const login = useAuthStore((s) => s.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError("");
    try {
      const ok = await login(email, password);
      const state = useAuthStore.getState();
      if (ok) {
        setSuccessData({
          name: state.user?.name ?? email,
          role: state.role ?? "client",
        });
        toast.success("Đăng nhập thành công!", { description: `Chào mừng ${state.user?.name ?? "bạn"}` });
      } else {
        setError(state.error ?? "Email hoặc mật khẩu không đúng");
      }
    } catch {
      setError("Không thể kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <motion.div
        key="success"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{ textAlign: "center" }}
      >
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: `${hexRgba(DS.green ?? "#22C55E", 0.15)}`,
          border: `2px solid ${hexRgba(DS.green ?? "#22C55E", 0.35)}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 1.5rem",
        }}>
          <CheckCircle2 size={32} color={DS.green ?? "#22C55E"} />
        </div>
        <h2 style={{ fontFamily: DS.heading, fontSize: "1.375rem", fontWeight: 900, color: DS.text, marginBottom: "0.5rem" }}>
          Chào mừng trở lại!
        </h2>
        <p style={{ color: DS.text3, fontSize: "0.875rem", marginBottom: "2rem" }}>
          Đăng nhập thành công với tài khoản<br />
          <strong style={{ color: DS.text }}>{successData.name}</strong>
        </p>
        <button
          onClick={() => router.push(successData.role === "client" ? `/${locale}/khach-hang` : "/admin/overview")}
          style={{
            width: "100%",
            background: GRD.primary,
            color: "#fff", border: "none", borderRadius: "0.875rem",
            padding: "0.875rem", fontSize: "0.9375rem", fontWeight: 700,
            fontFamily: DS.heading, letterSpacing: "0.04em",
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: "center", gap: "0.5rem",
            boxShadow: `0 0 30px ${hexRgba(DS.pink, 0.4)}`,
            transition: "all 0.2s ease",
          }}
        >
          {successData.role === "client" ? (
            <><Users size={16} /> Vào trang khách hàng <ArrowRight size={16} /></>
          ) : (
            <><Shield size={16} /> Vào Quản trị <ArrowRight size={16} /></>
          )}
        </button>
        <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: `1px solid ${DS.border}` }}>
          <button
            onClick={() => { setSuccessData(null); setEmail(""); setPassword(""); }}
            style={{ background: "none", border: "none", color: DS.text4, fontSize: "0.8125rem", cursor: "pointer" }}
          >
            Đăng nhập tài khoản khác
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
        <div style={{
          width: 48, height: 3, borderRadius: 2,
          background: `linear-gradient(90deg, ${DS.purple}, ${DS.pink})`,
          margin: "0 auto 1rem",
          boxShadow: `0 0 16px ${hexRgba(DS.pink, 0.5)}`,
        }} />
        <h2 style={{
          fontFamily: DS.heading, fontSize: "1.375rem", fontWeight: 900,
          background: `linear-gradient(135deg, #FFFFFF 0%, ${DS.pink} 100%)`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          marginBottom: "0.375rem",
        }}>
          CHÀO MỪNG TRỞ LẠI
        </h2>
        <p style={{ color: DS.text4, fontSize: "0.8125rem" }}>
          Đăng nhập để tiếp tục với tài khoản của bạn
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <AuthInput
          label={t("email") ?? "Email"}
          type="email"
          placeholder="email@company.vn"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        <AuthInput
          label={t("password") ?? "Mật khẩu"}
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />

        <div style={{ textAlign: "right", marginBottom: "1rem" }}>
          <button
            type="button"
            style={{
              color: DS.pink, background: "none", border: "none",
              fontSize: "0.8125rem", cursor: "pointer", padding: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
          >
            Quên mật khẩu?
          </button>
        </div>

        {error && (
          <div style={{
            padding: "0.625rem 0.875rem", borderRadius: "0.625rem",
            background: `${hexRgba(DS.red ?? "#EF4444", 0.1)}`,
            border: `1px solid ${hexRgba(DS.red ?? "#EF4444", 0.3)}`,
            color: DS.red ?? "#EF4444", fontSize: "0.8125rem",
            marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem",
          }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email || !password}
          style={{
            width: "100%",
            background: loading || !email || !password ? hexRgba(DS.pink, 0.4) : GRD.primary,
            color: "#fff", border: "none", borderRadius: "0.875rem",
            padding: "0.875rem",
            fontSize: "0.9375rem", fontWeight: 700,
            fontFamily: DS.heading, letterSpacing: "0.04em",
            cursor: loading || !email || !password ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            boxShadow: `0 0 30px ${hexRgba(DS.pink, 0.4)}`,
            transition: "all 0.2s ease",
          }}
        >
          {loading ? (
            <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Đang đăng nhập...</>
          ) : (
            <>{t("login") ?? "Đăng nhập"} <ArrowRight size={16} /></>
          )}
        </button>
      </form>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "1.5rem 0" }}>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${hexRgba(DS.purple, 0.4)}, transparent)` }} />
        <span style={{ color: DS.text5, fontSize: "0.75rem", fontFamily: DS.mono }}>HOẶC</span>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${hexRgba(DS.purple, 0.4)}, transparent)` }} />
      </div>

      <button
        onClick={() => window.location.href = "/api/admin/auth/google-signin"}
        style={{
          width: "100%", background: "rgba(17,24,39,0.6)",
          border: `1px solid ${hexRgba(DS.purple, 0.3)}`,
          borderRadius: "0.875rem", padding: "0.75rem",
          fontSize: "0.875rem", color: DS.text3,
          cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", gap: "0.5rem", transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = hexRgba(DS.pink, 0.5);
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

      <div style={{ textAlign: "center", marginTop: "1.5rem", paddingTop: "1rem", borderTop: `1px solid ${DS.border}` }}>
        <span style={{ color: DS.text5, fontSize: "0.8125rem" }}>
          Chưa có tài khoản?{" "}
        </span>
        <button
          onClick={onSwitch}
          style={{
            color: DS.pink, fontSize: "0.8125rem", fontWeight: 600,
            background: "none", border: "none", cursor: "pointer", padding: 0,
          }}
        >
          Đăng ký miễn phí
        </button>
      </div>
    </div>
  );
}

// ── Left Brand Panel ──────────────────────────────────────────────────────────
function BrandPanel() {
  return (
    <div
      style={{
        position: "relative", flex: "1 1 0", minWidth: 0,
        background: `linear-gradient(160deg, #0C0C1E 0%, #0D1030 40%, #0A0A1E 100%)`,
        padding: "3rem 2.5rem",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Cosmic orb bg */}
      <div style={{
        position: "absolute", top: "-20%", left: "-10%",
        width: "80%", height: "80%",
        background: `radial-gradient(circle at 30% 30%, ${hexRgba(DS.pink, 0.18)} 0%, transparent 55%)`,
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-10%", right: "-10%",
        width: "70%", height: "70%",
        background: `radial-gradient(circle, ${hexRgba(DS.purple, 0.2)} 0%, transparent 60%)`,
        pointerEvents: "none",
      }} />
      {/* Grid overlay */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `linear-gradient(${hexRgba(DS.purple, 0.06)} 1px, transparent 1px), linear-gradient(90deg, ${hexRgba(DS.purple, 0.06)} 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "3rem" }}>
          <img
            src="/assets/design-company/logo-cosmic-infinity.png"
            alt="LOOP"
            style={{ width: 40, height: 40, objectFit: "contain" }}
          />
          <div>
            <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: 18, fontWeight: 900, letterSpacing: "0.12em" }}>LOOP</div>
            <div style={{ color: DS.text5, fontSize: "0.625rem", fontFamily: DS.mono, letterSpacing: "0.2em" }}>SOLUTIONS</div>
          </div>
        </div>

        {/* Headline */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            padding: "0.375rem 0.875rem", borderRadius: 999,
            background: `${hexRgba(DS.pink, 0.1)}`,
            border: `1px solid ${hexRgba(DS.pink, 0.25)}`,
            fontFamily: DS.mono, fontSize: "0.6875rem", color: DS.pink,
            letterSpacing: "0.15em", marginBottom: "1rem",
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: DS.pink, boxShadow: `0 0 8px ${DS.pink}` }} />
            SEASON III · Q1/2026 · ĐANG HOẠT ĐỘNG
          </div>
          <h1 style={{
            fontFamily: DS.heading, fontSize: "clamp(2rem, 3vw, 2.75rem)",
            fontWeight: 900, lineHeight: 1.1,
            background: `linear-gradient(135deg, #FFFFFF 0%, ${DS.pink} 55%, ${DS.purple} 100%)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            marginBottom: "1rem",
          }}>
            Xây dựng tương lai<br />số cùng LOOP
          </h1>
          <p style={{ color: DS.text3, fontSize: "0.9375rem", lineHeight: 1.7, maxWidth: 380 }}>
            Nền tảng Agency toàn diện — từ thiết kế, phát triển đến vận hành. Cùng đội ngũ tinh nhuệ.
          </p>
        </div>

        {/* Stats */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1rem", marginBottom: "2.5rem",
        }}>
          <StatBadge value="27+" label="Thành viên" />
          <StatBadge value="150+" label="Dự án hoàn thành" />
          <StatBadge value="98%" label="Khách hàng hài lòng" />
        </div>

        {/* Features */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <FeatureRow
            icon={<Zap size={16} style={{ color: DS.pink }} />}
            label="Tốc độ vượt trội"
            desc="Website, app, dashboard — giao trong thời gian ngắn nhất thị trường"
          />
          <FeatureRow
            icon={<Shield size={16} style={{ color: DS.purple }} />}
            label="Bảo mật tuyệt đối"
            desc="SSL, mã hóa, backup tự động — yên tâm tuyệt đối với dữ liệu"
          />
          <FeatureRow
            icon={<Star size={16} style={{ color: DS.amber }} />}
            label="Hỗ trợ 24/7"
            desc="Đội ngũ kỹ thuật luôn sẵn sàng hỗ trợ mọi lúc"
          />
        </div>
      </div>

      {/* Bottom quote */}
      <div style={{ position: "absolute", bottom: "2rem", left: "2.5rem", right: "2.5rem", zIndex: 1 }}>
        <div style={{
          padding: "1rem 1.25rem",
          background: `${hexRgba(DS.purple, 0.1)}`,
          border: `1px solid ${hexRgba(DS.purple, 0.2)}`,
          borderRadius: "0.875rem",
          backdropFilter: "blur(8px)",
        }}>
          <p style={{
            color: DS.text3, fontSize: "0.8125rem", fontStyle: "italic", lineHeight: 1.6,
          }}>
            "Mỗi thành viên là một mảnh ghép — cùng nhau chúng tôi xây dựng những sản phẩm kỹ thuật số đỉnh cao."
          </p>
          <div style={{ marginTop: "0.625rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              background: GRD.primary,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.625rem", fontWeight: 900, color: "#fff",
            }}>AT</div>
            <div>
              <div style={{ color: DS.text, fontSize: "0.75rem", fontWeight: 600 }}>Akira Sato</div>
              <div style={{ color: DS.text5, fontSize: "0.6875rem", fontFamily: DS.mono }}>Diamond · Guild Master</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
type AuthMode = "login" | "register";

export default function AuthPage() {
  const params = useParams();
  const locale = (params.locale as string) ?? "vi";
  const [mode, setMode] = useState<AuthMode>("login");

  // Show success toast if user just registered
  useEffect(() => {
    const url = new URLSearchParams(window.location.search);
    if (url.get("registered") === "1") {
      toast.success("Đăng ký thành công! 🎉", {
        description: "Vui lòng đăng nhập để tiếp tục.",
      });
      // Clean up URL param without page reload
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // If route is /dang-ky → start on register
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  useEffect(() => {
    if (pathname.endsWith("/dang-ky")) setMode("register");
  }, [pathname]);

  return (
    <div style={{
      background: DS.bg, minHeight: "100vh",
      display: "flex", fontFamily: DS.body,
    }}>
      {/* ── LEFT: Brand panel ── */}
      <BrandPanel />

      {/* ── RIGHT: Auth card ── */}
      <div style={{
        flex: "1 1 0", minWidth: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "2rem 1.5rem",
        background: DS.bg,
        position: "relative", overflow: "hidden",
      }}>
        {/* Subtle radial glow */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "120%", height: "120%",
          background: `radial-gradient(ellipse at center, ${hexRgba(DS.purple, 0.05)} 0%, transparent 60%)`,
          pointerEvents: "none",
        }} />

        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: "100%", maxWidth: 460,
            background: "rgba(17,24,39,0.7)",
            backdropFilter: "blur(24px)",
            borderRadius: "1.5rem",
            padding: "2.5rem",
            border: `1px solid ${hexRgba(DS.purple, 0.2)}`,
            boxShadow: `0 0 0 1px ${hexRgba(DS.purple, 0.06)} inset, 0 32px 80px rgba(0,0,0,0.4), 0 0 80px ${hexRgba(DS.purple, 0.06)}`,
            position: "relative", zIndex: 1,
          }}
        >
          {/* Tab switcher */}
          <div style={{
            display: "flex", marginBottom: "1.75rem",
            background: `${hexRgba(DS.purple, 0.08)}`,
            borderRadius: "0.875rem", padding: "0.25rem",
          }}>
            {(["login", "register"] as AuthMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex: 1, padding: "0.625rem",
                  borderRadius: "0.625rem",
                  border: "none", cursor: "pointer",
                  fontSize: "0.875rem", fontWeight: 700,
                  fontFamily: DS.heading, letterSpacing: "0.04em",
                  background: mode === m ? GRD.primary : "transparent",
                  color: mode === m ? "#fff" : DS.text4,
                  boxShadow: mode === m ? `0 0 20px ${hexRgba(DS.pink, 0.3)}` : "none",
                  transition: "all 0.2s ease",
                }}
              >
                {m === "login" ? "ĐĂNG NHẬP" : "ĐĂNG KÝ"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === "register" ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === "register" ? -20 : 20 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {mode === "login" ? (
                <LoginForm onSwitch={() => setMode("register")} />
              ) : (
                <RegisterForm onSwitch={() => setMode("login")} />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Back to home */}
        <Link
          href={`/${locale}`}
          style={{
            position: "absolute", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)",
            display: "flex", alignItems: "center", gap: "0.375rem",
            color: DS.text5, fontSize: "0.8125rem", textDecoration: "none",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = DS.text)}
          onMouseLeave={(e) => (e.currentTarget.style.color = DS.text5)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Quay về trang chủ
        </Link>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
