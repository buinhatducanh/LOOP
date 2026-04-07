"use client";

/**
 * Register-with-token Page — LOOP Solutions
 * Route: /vi/dang-nhap/register-with-token?token=xxx
 *
 * Flow: Member clicks email invite link → lands here → sets password → auto-login
 *
 * Auth flow:
 *   1. Validate token → show member info
 *   2. Set password → POST /api/admin/team/members/invite-accept
 *   3. Success → auto-login with returned JWT → redirect
 */
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Eye, EyeOff, ArrowRight, Loader2, Check,
  UserCheck, ShieldCheck, AlertTriangle, Mail,
} from "lucide-react";
import { DS, GRD } from "@/lib/design-tokens";

type Step = "validating" | "ready" | "setting-password" | "success" | "error";

interface TokenInfo {
  email: string;
  name: string;
  department: string;
  proposedRole: string;
  status: string;
}

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

export default function RegisterWithTokenPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [locale, setLocale] = useState("vi");
  const [step, setStep] = useState<Step>("validating");
  const [_tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordScore, setPasswordScore] = useState(0);

  useEffect(() => {
    params.then((p) => setLocale(p.locale));
  }, [params]);

  // ── Validate token on mount ─────────────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      setError("Link không hợp lệ — thiếu mã tham chiếu");
      setStep("error");
      return;
    }

    const validate = async () => {
      try {
        const res = await fetch(`/api/admin/team/members/invite-accept/validate?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (res.status === 404) {
          setError("Link mời không hợp lệ hoặc đã hết hạn");
          setStep("error");
          return;
        }
        if (res.status === 409) {
          setError("Tài khoản đã được kích hoạt. Vui lòng đăng nhập.");
          setStep("error");
          return;
        }
        if (res.status === 403) {
          setError("Yêu cầu đã bị từ chối. Liên hệ HR để biết thêm chi tiết.");
          setStep("error");
          return;
        }
        if (!res.ok) {
          setError(data.error ?? "Link không hợp lệ");
          setStep("error");
          return;
        }

        setTokenInfo({
          email: data.email ?? "",
          name: data.name ?? "",
          department: data.department ?? "",
          proposedRole: data.proposedRole ?? "",
          status: data.isExpired ? "expired" : "ready",
        });

        if (data.isExpired) {
          setError("Link mời đã hết hạn (48 giờ). Liên hệ HR để nhận link mới.");
          setStep("error");
        } else {
          setStep("ready");
        }
      } catch {
        setError("Không thể xác minh link mời. Vui lòng thử lại.");
        setStep("error");
      }
    };

    validate();
  }, [token]);

  // ── Password strength ──────────────────────────────────────────────────────
  useEffect(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    setPasswordScore(Math.min(4, score));
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError("Mật khẩu phải có ít nhất 8 ký tự"); return; }
    if (password !== confirmPassword) { setError("Mật khẩu xác nhận không khớp"); return; }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/team/members/invite-accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Đã có lỗi xảy ra");
        setLoading(false);
        return;
      }

      // Auto-login with the returned JWT token directly
      if (data.token) {
        localStorage.setItem("auth-token", data.token);
        // Reload so authStore re-hydrates session from the new token
        window.location.href = "/admin/overview";
        return;
      }

      setStep("success");
      setTimeout(() => { router.push(`/${locale}/dang-nhap`); }, 2000);
    } catch {
      setError("Không thể kích hoạt tài khoản. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: DS.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", fontFamily: "'Inter', sans-serif", position: "relative" }}>
      {/* Background */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 30%, rgba(29,78,216,0.15) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(129,140,248,0.1) 0%, transparent 55%)" }} />
      </div>

      <div style={{ width: "100%", maxWidth: "28rem", position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <Link href={`/${locale}`} style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none", marginBottom: "2rem", justifyContent: "center" }}>
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
          {/* ── Validating ── */}
          {step === "validating" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", padding: "2rem 0" }}>
              <div style={{ width: 48, height: 48, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 1rem" }} />
              <div style={{ color: DS.text3, fontSize: "0.875rem" }}>Đang xác minh link mời...</div>
            </motion.div>
          )}

          {/* ── Ready (show form) ── */}
          {(step === "ready" || step === "validating") && step !== "ready" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(59,130,246,0.15)", border: `1px solid rgba(59,130,246,0.3)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                  <UserCheck size={28} color={DS.blue} />
                </div>
                <h1 style={{ fontFamily: DS.heading, fontSize: "1.5rem", fontWeight: 900, letterSpacing: "0.06em", background: GRD.primary, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "0.375rem" }}>
                  CHÀO MỪNG ĐẾN LOOP
                </h1>
                <p style={{ color: DS.text3, fontSize: "0.8125rem" }}>
                  Bạn được mời tham gia hệ thống LOOP Solutions.<br />
                  Đặt mật khẩu để kích hoạt tài khoản.
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <FormInput label="Mật khẩu mới" type="password" placeholder="Tối thiểu 8 ký tự" value={password} onChange={setPassword} />

                {/* Password strength bar */}
                <div style={{ display: "flex", gap: "0.25rem", marginBottom: "0.75rem" }}>
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} style={{
                      flex: 1, height: 4, borderRadius: 2,
                      background: passwordScore > i
                        ? (i < 1 ? DS.red : i < 2 ? DS.amber : i < 3 ? DS.blue : DS.green)
                        : DS.border,
                      transition: "background 0.3s",
                    }} />
                  ))}
                </div>
                <div style={{ fontSize: "0.6875rem", color: DS.text5, marginBottom: "1rem", fontFamily: "'JetBrains Mono', monospace" }}>
                  {passwordScore < 2 ? "Yếu" : passwordScore < 3 ? "Trung bình" : passwordScore < 4 ? "Khá mạnh" : "Mạnh"}
                </div>

                <FormInput label="Xác nhận mật khẩu" type="password" placeholder="Nhập lại mật khẩu" value={confirmPassword} onChange={setConfirmPassword} />

                {confirmPassword && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "1rem", marginTop: "-0.5rem", fontSize: "0.75rem", color: password === confirmPassword ? DS.green : DS.red }}>
                    {password === confirmPassword ? <><Check size={12} /> Khớp mật khẩu</> : <><AlertTriangle size={12} /> Không khớp</>}
                  </div>
                )}

                {error && (
                  <div style={{ padding: "0.625rem 0.875rem", borderRadius: "0.5rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5", fontSize: "0.8125rem", marginBottom: "1rem" }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || password.length < 8 || password !== confirmPassword}
                  style={{
                    width: "100%",
                    background: loading || password.length < 8 ? "rgba(59,130,246,0.6)" : GRD.primary,
                    color: "#fff", border: "none", borderRadius: "0.75rem",
                    padding: "0.8125rem", fontSize: "0.875rem", fontWeight: 700,
                    cursor: loading || password.length < 8 ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                    boxShadow: "0 0 20px rgba(129,140,248,0.35)",
                  }}
                >
                  {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Đang kích hoạt...</> : <><ShieldCheck size={16} /> Kích hoạt tài khoản</>}
                </button>
              </form>

              {/* Info box */}
              <div style={{ marginTop: "1.25rem", padding: "0.875rem", borderRadius: "0.75rem", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                  <Mail size={14} color={DS.green} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ color: DS.green, fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.25rem" }}>Thông tin tài khoản</div>
                    <div style={{ color: DS.text3, fontSize: "0.75rem", lineHeight: 1.6 }}>
                      Tài khoản được tạo bởi HR/CEO của LOOP. Sau khi kích hoạt, bạn sẽ có quyền truy cập Kanban Board và các tính năng cơ bản.
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Error ── */}
          {step === "error" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(239,68,68,0.1)", border: `1px solid rgba(239,68,68,0.3)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                <AlertTriangle size={28} color={DS.red} />
              </div>
              <h2 style={{ fontFamily: DS.heading, fontSize: "1.25rem", fontWeight: 900, color: DS.red, marginBottom: "0.75rem" }}>
                Không thể kích hoạt
              </h2>
              <p style={{ color: DS.text3, fontSize: "0.875rem", marginBottom: "1.5rem", lineHeight: 1.6 }}>
                {error || "Link mời không hợp lệ hoặc đã hết hạn."}
              </p>
              <Link
                href={`/${locale}/dang-nhap`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.625rem 1.25rem", background: GRD.primary,
                  color: "#fff", borderRadius: "0.75rem", fontSize: "0.875rem",
                  fontWeight: 700, textDecoration: "none",
                  boxShadow: "0 0 20px rgba(129,140,248,0.35)",
                }}
              >
                <ArrowRight size={16} /> Đăng nhập
              </Link>
            </motion.div>
          )}

          {/* ── Success ── */}
          {step === "success" && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(34,197,94,0.15)", border: `1px solid rgba(34,197,94,0.4)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
                <Check size={28} color={DS.green} />
              </div>
              <h2 style={{ fontFamily: DS.heading, fontSize: "1.25rem", fontWeight: 900, color: DS.green, marginBottom: "0.75rem" }}>
                Tài khoản đã kích hoạt!
              </h2>
              <p style={{ color: DS.text3, fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                Chào mừng bạn đến với LOOP Solutions.<br />Đang chuyển hướng...
              </p>
              <Link
                href="/admin/overview"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.625rem 1.25rem", background: GRD.primary,
                  color: "#fff", borderRadius: "0.75rem", fontSize: "0.875rem",
                  fontWeight: 700, textDecoration: "none",
                }}
              >
                Vào Dashboard <ArrowRight size={16} />
              </Link>
            </motion.div>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <Link href="/vi" style={{ color: DS.text4, fontSize: "0.8125rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
            <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} />
            Quay lại trang chủ
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
