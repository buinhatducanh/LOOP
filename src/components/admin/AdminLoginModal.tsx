"use client";

/**
 * AdminLoginModal — Form đăng nhập quản trị cho nhân viên LOOP.
 *
 * Features:
 *  - Email/password với remember me (localStorage)
 *  - Google OAuth
 *  - Quên mật khẩu: gửi OTP → xác minh → đặt lại mật khẩu mới
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Settings, LogIn, Mail, ShieldCheck, ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/app/store/authStore";
import { DS, GRD } from "@/lib/design-tokens";
import { toast } from "sonner";

interface AdminLoginModalProps {
  children: React.ReactNode;
  autoOpen?: boolean; // if true, modal opens immediately on mount (for /admin/login page)
}

type Step = "login" | "forgot-email" | "otp" | "new-password";

function hexRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function AdminLoginModal({ children, autoOpen = false }: AdminLoginModalProps) {
  const [open, setOpen] = useState(autoOpen);
  const [step, setStep] = useState<Step>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Forgot password steps
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");

  const router = useRouter();
  const login = useAuthStore(s => s.login);

  // ── Restore remembered email ─────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    // Only restore if email field is still empty (don't overwrite a partially typed value)
    if (!email) {
      try {
        const saved = localStorage.getItem("loop-staff-email");
        if (saved) { setEmail(saved); setRememberMe(true); }
      } catch { /* noop */ }
    }
  }, [open]);

  // ── Close → reset state ──────────────────────────────────────────────────────
  const close = () => {
    setOpen(false);
    setStep("login");
    setError("");
    setEmail(""); setPassword(""); setOtpCode(""); setNewPassword(""); setConfirmPassword("");
    setResetToken(""); setForgotEmail("");
  };

  // ── Login ────────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError("");
    setIsLoading(true);

    const ok = await login(email, password);
    setIsLoading(false);

    if (ok) {
      const user = useAuthStore.getState().user;
      // Remember me
      if (rememberMe) {
        try { localStorage.setItem("loop-staff-email", email); } catch { /* noop */ }
      } else {
        try { localStorage.removeItem("loop-staff-email"); } catch { /* noop */ }
      }
      toast.success("Đăng nhập thành công!", {
        description: user ? `Chào mừng ${user.name}` : undefined,
      });
      close();
      // Use replace instead of push so browser back doesn't return to the login page
      router.replace("/admin/overview");
    } else {
      setError(useAuthStore.getState().error ?? "Đăng nhập thất bại");
    }
  };

  // ── Forgot password: send OTP ───────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error ?? "Gửi mã thất bại. Vui lòng thử lại.");
        return;
      }
      setStep("otp");
      toast.success("Mã OTP đã được gửi đến email của bạn");
    } catch {
      setError("Không thể kết nối máy chủ.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Forgot password: verify OTP ─────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) return;
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, code: otpCode }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error ?? "Mã OTP không hợp lệ");
        return;
      }
      setResetToken(data.resetToken);
      setStep("new-password");
    } catch {
      setError("Không thể kết nối máy chủ.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Forgot password: set new password ───────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) return;
    if (newPassword.length < 8) { setError("Mật khẩu phải có ít nhất 8 ký tự"); return; }
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, newPassword }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error ?? "Đặt lại mật khẩu thất bại");
        return;
      }
      toast.success("Đặt lại mật khẩu thành công! Hãy đăng nhập với mật khẩu mới.");
      close();
    } catch {
      setError("Không thể kết nối máy chủ.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Google login ───────────────────────────────────────────────────────────────
  const handleGoogleLogin = () => {
    window.location.href = "/api/admin/auth/google-signin?callbackUrl=/admin/overview";
  };

  // ── Shared input style ──────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(15,23,42,0.8)",
    border: `1px solid ${DS.border}`,
    borderRadius: 8,
    padding: "10px 14px",
    color: DS.text,
    fontSize: "0.875rem",
    outline: "none",
    fontFamily: "Inter, sans-serif",
    transition: "border-color 0.15s ease",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    color: DS.text3,
    fontSize: "0.6875rem",
    fontFamily: "'JetBrains Mono', monospace",
    letterSpacing: "0.1em",
    marginBottom: "0.375rem",
  };

  const disabledBtn = (cond: boolean) => ({
    background: cond ? "rgba(107,61,245,0.3)" : GRD.primary,
    cursor: cond ? "not-allowed" : "pointer",
  });

  const btnText = isLoading ? "Đang xử lý..." : "";

  // ── Render step ───────────────────────────────────────────────────────────────
  const renderContent = () => {
    if (step === "forgot-email") {
      return (
        <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <div style={{ color: DS.text3, fontSize: "0.8125rem", lineHeight: 1.6, marginBottom: "1rem" }}>
              Nhập email đã đăng ký. Hệ thống sẽ gửi mã xác minh 6 chữ số.
            </div>
            <label style={labelStyle}>EMAIL</label>
            <input
              type="email"
              placeholder="admin@loop.vn"
              value={forgotEmail}
              onChange={e => setForgotEmail(e.target.value)}
              required
              style={inputStyle}
              onFocus={e => { (e.target as HTMLElement).style.borderColor = DS.purple; }}
              onBlur={e => { (e.target as HTMLElement).style.borderColor = DS.border; }}
            />
          </div>
          {error && <ErrorMsg msg={error} />}
          <button type="submit" disabled={isLoading || !forgotEmail}
            style={{ ...disabledBtn(isLoading || !forgotEmail), ...btnBase }}>
            {isLoading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Mail size={14} />}
            {isLoading ? "Đang gửi..." : "Gửi mã xác minh"}
          </button>
        </form>
      );
    }

    if (step === "otp") {
      return (
        <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <div style={{ color: DS.text3, fontSize: "0.8125rem", lineHeight: 1.6 }}>
              Mã xác minh đã được gửi đến <strong style={{ color: DS.text }}>{forgotEmail}</strong>.
              <br />Mã có hiệu lực trong 5 phút.
            </div>
            <label style={{ ...labelStyle, marginTop: "1rem" }}>MÃ OTP</label>
            <input
              type="text"
              placeholder="000000"
              value={otpCode}
              onChange={e => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              maxLength={6}
              style={{ ...inputStyle, textAlign: "center", fontSize: "1.25rem", letterSpacing: "0.5em", fontFamily: DS.mono }}
              onFocus={e => { (e.target as HTMLElement).style.borderColor = DS.purple; }}
              onBlur={e => { (e.target as HTMLElement).style.borderColor = DS.border; }}
            />
          </div>
          {error && <ErrorMsg msg={error} />}
          <button type="submit" disabled={isLoading || otpCode.length < 6}
            style={{ ...disabledBtn(isLoading || otpCode.length < 6), ...btnBase }}>
            {isLoading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <ShieldCheck size={14} />}
            {isLoading ? "Đang xác minh..." : "Xác minh"}
          </button>
        </form>
      );
    }

    if (step === "new-password") {
      return (
        <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <label style={labelStyle}>MẬT KHẨU MỚI</label>
          <div style={{ position: "relative" }}>
            <input
              type={showNewPw ? "text" : "password"}
              placeholder="Ít nhất 8 ký tự"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              style={{ ...inputStyle, paddingRight: "44px" }}
              onFocus={e => { (e.target as HTMLElement).style.borderColor = DS.purple; }}
              onBlur={e => { (e.target as HTMLElement).style.borderColor = DS.border; }}
            />
            <button type="button" onClick={() => { void setShowNewPw(v => !v); }}
              style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", display: "flex",
                alignItems: "center", color: DS.text4, padding: "4px",
              }}>
              {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          <label style={labelStyle}>XÁC NHẬN MẬT KHẨU</label>
          <input
            type="password"
            placeholder="Nhập lại mật khẩu mới"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            style={inputStyle}
            onFocus={e => { (e.target as HTMLElement).style.borderColor = DS.purple; }}
            onBlur={e => { (e.target as HTMLElement).style.borderColor = DS.border; }}
          />

          {error && <ErrorMsg msg={error} />}
          <button type="submit" disabled={isLoading || !newPassword || !confirmPassword}
            style={{ ...disabledBtn(isLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword), ...btnBase }}>
            {isLoading ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : null}
            {isLoading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
          </button>
        </form>
      );
    }

    // ── Default: login ────────────────────────────────────────────────────────
    return (
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label style={labelStyle}>EMAIL</label>
          <input
            type="email"
            placeholder="admin@loop.vn"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={inputStyle}
            onFocus={e => { (e.target as HTMLElement).style.borderColor = DS.purple; }}
            onBlur={e => { (e.target as HTMLElement).style.borderColor = DS.border; }}
          />
        </div>

        <div>
          <label style={labelStyle}>MẬT KHẨU</label>
          <div style={{ position: "relative" }}>
            <input
              type={showPw ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ ...inputStyle, paddingRight: "44px" }}
              onFocus={e => { (e.target as HTMLElement).style.borderColor = DS.purple; }}
              onBlur={e => { (e.target as HTMLElement).style.borderColor = DS.border; }}
            />
            <button type="button" onClick={() => { void setShowPw(v => !v); }}
              style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", display: "flex",
                alignItems: "center", color: DS.text4, padding: "4px",
              }}>
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {/* Remember me */}
        <label style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          cursor: "pointer", userSelect: "none",
        }}>
          <div
            onClick={() => setRememberMe(v => !v)}
            style={{
              width: 16, height: 16, borderRadius: 4,
              background: rememberMe ? GRD.primary : "transparent",
              border: `1.5px solid ${rememberMe ? "transparent" : DS.text4}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "all 0.15s",
            }}
          >
            {rememberMe && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <span style={{ color: DS.text4, fontSize: "0.8125rem" }}>Ghi nhớ đăng nhập</span>
        </label>

        {error && <ErrorMsg msg={error} />}

        <button type="submit" disabled={isLoading || !email || !password}
          style={{ ...disabledBtn(isLoading || !email || !password), ...btnBase }}>
          {isLoading
            ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
            : <LogIn size={14} />
          }
          {btnText || "Đăng nhập"}
        </button>

        {/* Forgot password */}
        <button type="button" onClick={() => { setStep("forgot-email"); setError(""); setForgotEmail(email); }}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: DS.text4, fontSize: "0.8125rem", textAlign: "center",
            transition: "color 0.15s", padding: "2px 0",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = DS.pink; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = DS.text4; }}>
          Quên mật khẩu?
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: "0.25rem 0" }}>
          <div style={{ flex: 1, height: 1, background: DS.border }} />
          <span style={{ color: DS.text5, fontSize: "0.6875rem", fontFamily: DS.mono }}>HOẶC</span>
          <div style={{ flex: 1, height: 1, background: DS.border }} />
        </div>

        {/* Google */}
        <button type="button" onClick={handleGoogleLogin}
          style={{
            width: "100%",
            background: "rgba(17,24,39,0.6)",
            border: `1px solid ${hexRgba(DS.purple, 0.3)}`,
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: "0.875rem",
            color: DS.text3,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: "0.625rem",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = hexRgba(DS.pink, 0.4);
            el.style.background = hexRgba(DS.pink, 0.05);
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = hexRgba(DS.purple, 0.3);
            el.style.background = "rgba(17,24,39,0.6)";
          }}>
          <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Đăng nhập với Google
        </button>
      </form>
    );
  };

  const btnBase: React.CSSProperties = {
    width: "100%",
    border: "none",
    borderRadius: 10,
    padding: "12px",
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: "0.5rem",
    color: "#fff",
    fontFamily: "Inter, sans-serif",
    fontWeight: 700,
    fontSize: "0.875rem",
    transition: "all 0.15s ease",
  };

  const titleMap: Record<Step, { title: string; sub: string }> = {
    login: { title: "ĐĂNG NHẬP QUẢN TRỊ", sub: "Nhân viên LOOP Solutions" },
    "forgot-email": { title: "QUÊN MẬT KHẨU", sub: "Nhập email đã đăng ký" },
    otp: { title: "XÁC MINH OTP", sub: "Nhập mã 6 chữ số" },
    "new-password": { title: "ĐẶT MẬT KHẨU MỚI", sub: "Mật khẩu phải có ít nhất 8 ký tự" },
  };

  const { title, sub } = titleMap[step];
  const isForgot = step !== "login";

  return (
    <>
      {/* Trigger */}
      <div onClick={() => setOpen(true)} style={{ cursor: "pointer", display: "inline-flex" }}>
        {children}
      </div>

      {/* Modal */}
      {open && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
            animation: "fadeIn 0.15s ease-out",
          }}
          onClick={e => { if (e.target === e.currentTarget) close(); }}
        >
          <div
            style={{
              background: DS.bgCard,
              border: `1px solid ${DS.border}`,
              borderRadius: 16,
              padding: "2rem",
              width: "100%",
              maxWidth: 400,
              boxShadow: "0 0 60px rgba(107,61,245,0.2), 0 24px 80px rgba(0,0,0,0.6)",
              animation: "slideUp 0.2s ease-out",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
              {isForgot && (
                <button
                  onClick={() => { setStep("login"); setError(""); }}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${DS.border}`,
                    borderRadius: 8, padding: "6px",
                    cursor: "pointer", display: "flex", alignItems: "center",
                    color: DS.text4, transition: "color 0.15s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = DS.text; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = DS.text4; }}
                >
                  <ArrowLeft size={14} />
                </button>
              )}
              <div
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: GRD.primary, flexShrink: 0,
                }}
              >
                <Settings size={16} color="#fff" />
              </div>
              <div>
                <div style={{
                  color: DS.text, fontFamily: DS.heading, fontSize: "1rem",
                  fontWeight: 900, letterSpacing: "0.06em",
                }}>
                  {title}
                </div>
                <div style={{
                  color: DS.text4, fontSize: "0.625rem",
                  fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.15em",
                }}>
                  {sub}
                </div>
              </div>
              <button
                onClick={close}
                style={{
                  marginLeft: "auto",
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${DS.border}`,
                  borderRadius: 8, padding: "6px",
                  cursor: "pointer", display: "flex", alignItems: "center",
                  color: DS.text4, transition: "color 0.15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = DS.text; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = DS.text4; }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Step content */}
            {renderContent()}

            {/* Footer */}
            {step === "login" && (
              <div style={{
                textAlign: "center", marginTop: "1rem",
                color: DS.text5, fontSize: "0.6875rem",
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                Chỉ dành cho nhân viên LOOP Solutions
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <div style={{
      fontSize: "0.75rem", color: "#FCA5A5",
      fontFamily: "'JetBrains Mono', monospace",
      background: "rgba(252,165,165,0.08)",
      border: "1px solid rgba(252,165,165,0.2)",
      borderRadius: 6, padding: "8px 12px",
    }}>
      {msg}
    </div>
  );
}
