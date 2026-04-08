"use client";

/**
 * Register-with-token Page — LOOP Solutions
 * Route: /vi/dang-nhap/register-with-token?token=xxx
 *
 * Enhanced onboarding flow (2026-04-08):
 *   Step 1: Activate account — validate token, set password
 *   Step 2: Complete profile — avatar, bio, phone, social links (optional)
 *   Step 3: Redirect to admin dashboard
 *
 * Auth: invite-accept API sets password, returns JWT. Profile API uses that JWT.
 */
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Eye, EyeOff, ArrowRight, Loader2, Check,
  UserCheck, ShieldCheck, AlertTriangle, Mail,
  Camera, Globe,
} from "lucide-react";
import { DS, GRD } from "@/lib/design-tokens";

type Step = "validating" | "activate" | "profile" | "success" | "error";
type Locale = "vi" | "en" | "ja" | "ko" | "zh";

interface TokenInfo {
  email: string;
  name: string;
  department: string;
  proposedRole: string;
  expiresAt: string | null;
}

function FormInput({
  label, type = "text", placeholder, value, onChange, prefix,
}: {
  label: string; type?: string; placeholder: string; value: string;
  onChange: (v: string) => void; prefix?: React.ReactNode;
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
        {prefix && <span style={{ color: DS.text4, flexShrink: 0 }}>{prefix}</span>}
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

function PasswordStrength({ score }: { score: number }) {
  const labels = ["Yếu", "Trung bình", "Khá mạnh", "Mạnh"];
  const colors = [DS.red, DS.amber, DS.blue, DS.green];
  return (
    <div style={{ marginTop: "-0.5rem", marginBottom: "1rem" }}>
      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "0.25rem" }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: score > i ? colors[score - 1] ?? DS.border : DS.border,
            transition: "background 0.3s",
          }} />
        ))}
      </div>
      <div style={{ fontSize: "0.6875rem", color: DS.text5, fontFamily: "'JetBrains Mono', monospace" }}>
        {score > 0 ? labels[score - 1] : "Nhập mật khẩu"}
      </div>
    </div>
  );
}

function AvatarUpload({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "loop-avatars");
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) onChange(data.url);
    } catch { /* ignore */ } finally {
      setUploading(false);
    }
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
      style={{
        width: 96, height: 96, borderRadius: "50%",
        border: `2px dashed ${dragOver ? DS.blue : DS.border}`,
        background: DS.bgCard2,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", overflow: "hidden",
        transition: "border-color 0.2s",
        position: "relative",
      }}
      onClick={() => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (e) => {
          const f = (e.target as HTMLInputElement).files?.[0];
          if (f) handleFile(f);
        };
        input.click();
      }}
    >
      {uploading ? (
        <Loader2 size={24} color={DS.text4} style={{ animation: "spin 1s linear infinite" }} />
      ) : value ? (
        <img src={value} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div style={{ textAlign: "center" }}>
          <Camera size={20} color={DS.text4} />
          <div style={{ fontSize: 9, color: DS.text4, marginTop: 2 }}>Upload</div>
        </div>
      )}
    </div>
  );
}

export default function RegisterWithTokenPage({ params }: { params: Promise<{ locale: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [locale, setLocale] = useState<Locale>("vi");
  const [step, setStep] = useState<Step>("validating");
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);

  // Activation form state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState("");

  // Profile form state
  const [avatar, setAvatar] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [twitter, setTwitter] = useState("");
  const [github, setGithub] = useState("");
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState("");

  // Global error
  const [globalError, setGlobalError] = useState("");

  // Password strength
  const [pwScore, setPwScore] = useState(0);

  useEffect(() => { params.then((p) => setLocale(p.locale as Locale)); }, [params]);

  // Password strength meter
  useEffect(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    setPwScore(Math.min(4, score));
  }, [password]);

  // ── Validate token on mount ─────────────────────────────────────────────────
  useEffect(() => {
    if (!token) { setGlobalError("Link không hợp lệ — thiếu mã tham chiếu"); setStep("error"); return; }

    const validate = async () => {
      try {
        const res = await fetch(`/api/admin/team/members/invite-accept/validate?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (res.status === 404) { setGlobalError("Link mời không hợp lệ hoặc đã hết hạn"); setStep("error"); return; }
        if (res.status === 409) { setGlobalError("Tài khoản đã được kích hoạt. Vui lòng đăng nhập."); setStep("error"); return; }
        if (res.status === 403) { setGlobalError("Yêu cầu đã bị từ chối. Liên hệ HR để biết thêm chi tiết."); setStep("error"); return; }
        if (!res.ok) { setGlobalError(data.error ?? "Link không hợp lệ"); setStep("error"); return; }

        setTokenInfo({
          email: data.email ?? "",
          name: data.name ?? "",
          department: data.department ?? "",
          proposedRole: data.proposedRole ?? "",
          expiresAt: data.expiresAt ?? null,
        });

        if (data.isExpired) {
          setGlobalError("Link mời đã hết hạn (48 giờ). Liên hệ HR để nhận link mới.");
          setStep("error");
        } else {
          setStep("activate");
        }
      } catch {
        setGlobalError("Không thể xác minh link mời. Vui lòng thử lại.");
        setStep("error");
      }
    };

    validate();
  }, [token]);

  // ── Activate account ──────────────────────────────────────────────────────
  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setActivateError("Mật khẩu phải có ít nhất 8 ký tự"); return; }
    if (password !== confirmPassword) { setActivateError("Mật khẩu xác nhận không khớp"); return; }

    setActivating(true);
    setActivateError("");

    try {
      const res = await fetch("/api/admin/team/members/invite-accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setActivateError(data.error ?? "Đã có lỗi xảy ra");
        setActivating(false);
        return;
      }

      if (data.token) {
        localStorage.setItem("auth-token", data.token);
        setStep("profile");
      } else {
        setStep("success");
        setTimeout(() => { router.push(`/${locale}/dang-nhap`); }, 2000);
      }
    } catch {
      setActivateError("Không thể kích hoạt tài khoản. Vui lòng thử lại.");
    } finally {
      setActivating(false);
    }
  };

  // ── Complete profile ──────────────────────────────────────────────────────
  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompleting(true);
    setCompleteError("");

    try {
      const authToken = localStorage.getItem("auth-token");
      const res = await fetch("/api/admin/team/members/invite-accept/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          avatar: avatar || undefined,
          bio: bio || undefined,
          phone: phone || undefined,
          linkedin: linkedin || undefined,
          twitter: twitter || undefined,
          github: github || undefined,
        }),
      });

      // Even if profile API fails (e.g. 401), redirect to dashboard
      // Profile is optional
      setStep("success");
      setTimeout(() => { window.location.href = "/admin/overview"; }, 1500);
    } catch {
      // On error, still redirect — profile is optional
      setStep("success");
      setTimeout(() => { window.location.href = "/admin/overview"; }, 1500);
    } finally {
      setCompleting(false);
    }
  };

  // ── Skip profile ─────────────────────────────────────────────────────────
  const skipProfile = () => {
    setStep("success");
    setTimeout(() => { window.location.href = "/admin/overview"; }, 500);
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div style={{
      background: DS.bg, minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1.5rem", fontFamily: "'Inter', sans-serif", position: "relative",
    }}>
      {/* Background */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 30% 30%, rgba(29,78,216,0.15) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(129,140,248,0.1) 0%, transparent 55%)",
        }} />
      </div>

      <div style={{ width: "100%", maxWidth: "36rem", position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <Link href={`/${locale}`} style={{
          display: "flex", alignItems: "center", gap: "0.625rem",
          textDecoration: "none", marginBottom: "2rem", justifyContent: "center",
        }}>
          <img src="/logo.png" alt="LOOP" style={{ width: 40, height: 40, objectFit: "contain", borderRadius: 10 }} />
          <div>
            <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: 15, fontWeight: 900, letterSpacing: "0.1em" }}>LOOP SOLUTIONS</div>
          </div>
        </Link>

        {/* Step indicator */}
        {step !== "error" && step !== "validating" && (
          <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem", justifyContent: "center" }}>
            {["activate", "profile"].map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", fontSize: 11,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: DS.mono, fontWeight: 700,
                  background: step === s ? DS.blue : (step === "success" ? DS.green : DS.bgCard),
                  color: step === s || step === "success" ? "#fff" : DS.text4,
                  border: `1px solid ${step === s ? DS.blue : DS.border}`,
                }}>
                  {step === "success" ? <Check size={12} /> : i + 1}
                </div>
                <span style={{ fontSize: 11, color: step === s ? DS.text : DS.text4, fontFamily: DS.mono }}>
                  {s === "activate" ? "Kích hoạt" : "Hồ sơ"}
                </span>
                {i < 1 && <div style={{ width: 32, height: 1, background: DS.border }} />}
              </div>
            ))}
          </div>
        )}

        <div style={{
          borderRadius: "1.5rem", padding: "2rem",
          background: "rgba(15,23,42,0.8)", backdropFilter: "blur(20px)",
          border: "1px solid rgba(59,130,246,0.15)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        }}>
          {/* ── Validating ── */}
          <AnimatePresence>
            {step === "validating" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: "center", padding: "2rem 0" }}>
                <div style={{
                  width: 48, height: 48, border: `2px solid ${DS.border}`,
                  borderTop: `2px solid ${DS.blue}`, borderRadius: "50%",
                  animation: "spin 0.8s linear infinite", margin: "0 auto 1rem",
                }} />
                <div style={{ color: DS.text3, fontSize: "0.875rem" }}>Đang xác minh link mời...</div>
              </motion.div>
            )}

            {/* ── Activate Account ── */}
            {step === "activate" && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: "50%",
                    background: "rgba(59,130,246,0.15)",
                    border: `1px solid rgba(59,130,246,0.3)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 1rem",
                  }}>
                    <UserCheck size={28} color={DS.blue} />
                  </div>
                  <h1 style={{ fontFamily: DS.heading, fontSize: "1.375rem", fontWeight: 900, letterSpacing: "0.06em", marginBottom: "0.375rem" }}>
                    <span style={{ background: GRD.primary, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>CHÀO MỪNG ĐẾN LOOP</span>
                  </h1>
                  <p style={{ color: DS.text3, fontSize: "0.8125rem", lineHeight: 1.6 }}>
                    {tokenInfo?.name ? `${tokenInfo.name} — ` : ""}Đặt mật khẩu để kích hoạt tài khoản.
                  </p>
                  {tokenInfo && (
                    <div style={{
                      marginTop: "0.75rem", padding: "0.625rem 0.875rem",
                      borderRadius: "0.5rem", background: DS.bgCard2,
                      border: `1px solid ${DS.border}`, display: "inline-block",
                    }}>
                      <div style={{ fontSize: 11, color: DS.text4, fontFamily: DS.mono, marginBottom: 2 }}>THÔNG TIN TÀI KHOẢN</div>
                      <div style={{ fontSize: 12, color: DS.text2, fontFamily: DS.mono }}>
                        {tokenInfo.email}
                      </div>
                      <div style={{ fontSize: 11, color: DS.blue, fontFamily: DS.mono }}>
                        {capitalize(tokenInfo.department)} · {capitalize(tokenInfo.proposedRole)}
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleActivate}>
                  <FormInput
                    label="Mật khẩu mới"
                    type="password"
                    placeholder="Tối thiểu 8 ký tự"
                    value={password}
                    onChange={setPassword}
                  />
                  <PasswordStrength score={pwScore} />
                  <FormInput
                    label="Xác nhận mật khẩu"
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                  />
                  {confirmPassword && (
                    <div style={{
                      display: "flex", alignItems: "center", gap: "0.375rem",
                      marginBottom: "1rem", marginTop: "-0.5rem",
                      fontSize: "0.75rem",
                      color: password === confirmPassword ? DS.green : DS.red,
                    }}>
                      {password === confirmPassword
                        ? <><Check size={12} /> Khớp mật khẩu</>
                        : <><AlertTriangle size={12} /> Không khớp</>}
                    </div>
                  )}

                  {activateError && (
                    <div style={{
                      padding: "0.625rem 0.875rem", borderRadius: "0.5rem",
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      color: "#FCA5A5", fontSize: "0.8125rem", marginBottom: "1rem",
                    }}>
                      {activateError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={activating || password.length < 8 || password !== confirmPassword}
                    style={{
                      width: "100%", padding: "0.8125rem",
                      background: activating || password.length < 8 ? "rgba(59,130,246,0.6)" : GRD.primary,
                      color: "#fff", border: "none", borderRadius: "0.75rem",
                      fontSize: "0.875rem", fontWeight: 700, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                      boxShadow: "0 0 20px rgba(129,140,248,0.35)",
                    }}
                  >
                    {activating
                      ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Đang kích hoạt...</>
                      : <><ShieldCheck size={16} /> Kích hoạt tài khoản</>}
                  </button>
                </form>

                <div style={{
                  marginTop: "1.25rem", padding: "0.875rem", borderRadius: "0.75rem",
                  background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                    <Mail size={14} color={DS.green} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ color: DS.green, fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.25rem" }}>Sau khi kích hoạt</div>
                      <div style={{ color: DS.text3, fontSize: "0.75rem", lineHeight: 1.6 }}>
                        Bạn sẽ được hướng dẫn cập nhật hồ sơ cá nhân trước khi vào hệ thống.
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Complete Profile ── */}
            {step === "profile" && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: "50%",
                    background: "rgba(236,72,153,0.15)",
                    border: `1px solid rgba(236,72,153,0.3)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 1rem",
                  }}>
                    <Camera size={28} color={DS.pink} />
                  </div>
                  <h1 style={{ fontFamily: DS.heading, fontSize: "1.375rem", fontWeight: 900, letterSpacing: "0.06em", marginBottom: "0.375rem" }}>
                    <span style={{ background: GRD.pink, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>HOÀN TẤT HỒ SƠ</span>
                  </h1>
                  <p style={{ color: DS.text3, fontSize: "0.8125rem" }}>
                    Cập nhật thông tin cá nhân để hoàn thiện hồ sơ trên LOOP.<br />
                    Bạn có thể bỏ qua bước này và cập nhật sau.
                  </p>
                </div>

                <form onSubmit={handleCompleteProfile}>
                  {/* Avatar */}
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
                    <div style={{ textAlign: "center" }}>
                      <AvatarUpload value={avatar} onChange={setAvatar} />
                      <div style={{ fontSize: 10, color: DS.text4, marginTop: 6, fontFamily: DS.mono }}>Ảnh đại diện (tùy chọn)</div>
                    </div>
                  </div>

                  {/* Bio */}
                  <FormInput
                    label="Giới thiệu bản thân"
                    placeholder="VD: Frontend developer với 3 năm kinh nghiệm..."
                    value={bio}
                    onChange={setBio}
                  />

                  {/* Phone */}
                  <FormInput
                    label="Số điện thoại"
                    type="tel"
                    placeholder="VD: 0901234567"
                    value={phone}
                    onChange={setPhone}
                  />

                  {/* Social links */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: "1.5rem" }}>
                    <div>
                      <label style={{ color: DS.text3, fontSize: "0.6875rem", fontFamily: DS.mono, letterSpacing: "0.12em", display: "block", marginBottom: "0.375rem" }}>
                        LINKEDIN
                      </label>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0 0.875rem", background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: "0.75rem", height: 44 }}>
                        <span style={{ fontSize: 12, color: DS.text4, fontFamily: DS.mono, flexShrink: 0 }}>in</span>
                        <input
                          value={linkedin}
                          onChange={(e) => setLinkedin(e.target.value)}
                          placeholder="linkedin.com/in/..."
                          style={{ flex: 1, background: "none", border: "none", outline: "none", color: DS.text, fontSize: "0.8125rem" }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ color: DS.text3, fontSize: "0.6875rem", fontFamily: DS.mono, letterSpacing: "0.12em", display: "block", marginBottom: "0.375rem" }}>
                        GITHUB
                      </label>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0 0.875rem", background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: "0.75rem", height: 44 }}>
                        <span style={{ fontSize: 12, color: DS.text4, fontFamily: DS.mono, flexShrink: 0 }}>gh</span>
                        <input
                          value={github}
                          onChange={(e) => setGithub(e.target.value)}
                          placeholder="github.com/..."
                          style={{ flex: 1, background: "none", border: "none", outline: "none", color: DS.text, fontSize: "0.8125rem" }}
                        />
                      </div>
                    </div>
                  </div>

                  {completeError && (
                    <div style={{
                      padding: "0.625rem 0.875rem", borderRadius: "0.5rem",
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      color: "#FCA5A5", fontSize: "0.8125rem", marginBottom: "1rem",
                    }}>
                      {completeError}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 12 }}>
                    <button
                      type="button"
                      onClick={skipProfile}
                      style={{
                        flex: 1, padding: "0.8125rem",
                        background: DS.bgCard2, color: DS.text3,
                        border: `1px solid ${DS.border}`, borderRadius: "0.75rem",
                        fontSize: "0.875rem", fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      Bỏ qua
                    </button>
                    <button
                      type="submit"
                      disabled={completing}
                      style={{
                        flex: 2, padding: "0.8125rem",
                        background: completing ? "rgba(236,72,153,0.6)" : GRD.pink,
                        color: "#fff", border: "none", borderRadius: "0.75rem",
                        fontSize: "0.875rem", fontWeight: 700, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                        boxShadow: "0 0 20px rgba(236,72,153,0.35)",
                      }}
                    >
                      {completing
                        ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Đang lưu...</>
                        : <><Check size={16} /> Lưu & vào Dashboard</>}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ── Success ── */}
            {step === "success" && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "rgba(34,197,94,0.15)",
                  border: `1px solid rgba(34,197,94,0.4)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 1rem",
                }}>
                  <Check size={28} color={DS.green} />
                </div>
                <h2 style={{ fontFamily: DS.heading, fontSize: "1.25rem", fontWeight: 900, color: DS.green, marginBottom: "0.75rem" }}>
                  Chào mừng đến LOOP!
                </h2>
                <p style={{ color: DS.text3, fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                  Tài khoản đã được kích hoạt. Đang chuyển hướng đến Dashboard...
                </p>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.625rem 1.25rem",
                  background: "rgba(59,130,246,0.1)",
                  border: `1px solid rgba(59,130,246,0.3)`,
                  borderRadius: "0.75rem", fontSize: "0.8125rem", color: DS.blue,
                }}>
                  <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                  Redirecting to /admin/overview...
                </div>
              </motion.div>
            )}

            {/* ── Error ── */}
            {step === "error" && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "rgba(239,68,68,0.1)",
                  border: `1px solid rgba(239,68,68,0.3)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 1rem",
                }}>
                  <AlertTriangle size={28} color={DS.red} />
                </div>
                <h2 style={{ fontFamily: DS.heading, fontSize: "1.25rem", fontWeight: 900, color: DS.red, marginBottom: "0.75rem" }}>
                  Không thể kích hoạt
                </h2>
                <p style={{ color: DS.text3, fontSize: "0.875rem", marginBottom: "1.5rem", lineHeight: 1.6 }}>
                  {globalError || "Link mời không hợp lệ hoặc đã hết hạn."}
                </p>
                <Link href={`/${locale}/dang-nhap`} style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.625rem 1.25rem", background: GRD.primary,
                  color: "#fff", borderRadius: "0.75rem", fontSize: "0.875rem",
                  fontWeight: 700, textDecoration: "none",
                  boxShadow: "0 0 20px rgba(129,140,248,0.35)",
                }}>
                  <ArrowRight size={16} /> Đăng nhập
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
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
