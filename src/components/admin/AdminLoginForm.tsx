"use client";

/**
 * AdminLoginForm — Cosmic login form for /admin/login
 *
 * Full-page form (not a modal) with cosmic design language.
 * Features:
 * - Cosmic animated rings + particle field background (provided by parent page)
 * - Email + password with DS.pink focus glow
 * - Password strength indicator
 * - Remember me
 * - Google OAuth
 * - Role-aware redirect on success (staff → /admin/overview)
 * - Forgot password (OTP flow)
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import {
 Eye, EyeOff, Loader2, CheckCircle2, AlertCircle,
 ArrowRight, Shield, Mail, Lock, UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { DS, GRD } from "@/lib/design-tokens";
import { useAuthStore } from "@/app/store/authStore";

function hexRgba(hex: string, alpha: number): string {
 const h = hex.replace("#", "");
 const r = parseInt(h.substring(0, 2), 16);
 const g = parseInt(h.substring(2, 4), 16);
 const b = parseInt(h.substring(4, 6), 16);
 return `rgba(${r},${g},${b},${alpha})`;
}

// ── Password Strength ────────────────────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
 const getLevel = () => {
 if (!password) return 0;
 let score = 0;
 if (password.length >= 8) score++;
 if (password.length >= 12) score++;
 if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
 if (/[0-9]/.test(password)) score++;
 if (/[^A-Za-z0-9]/.test(password)) score++;
 return Math.min(4, score);
 };
 const level = getLevel();
 const labels = ["", "Yếu", "Trung bình", "Mạnh", "Rất mạnh"];
 const colors = ["", "#EF4444", "#F59E0B", "#22C55E", "#10B981"];
 if (!password) return null;
 return (
 <div style={{ marginTop: "0.5rem" }}>
 <div style={{ display: "flex", gap: "0.25rem", marginBottom: "0.25rem" }}>
 {[1, 2, 3, 4].map((i) => (
 <motion.div
 key={i}
 animate={{ backgroundColor: i <= level ? colors[level] : hexRgba(DS.cosmicPurple, 0.15) }}
 style={{ flex: 1, height: 3, borderRadius: 2 }}
 transition={{ duration: 0.3 }}
 />
 ))}
 </div>
 <div style={{ fontSize: "0.6875rem", color: colors[level] ?? DS.text5, fontFamily: DS.mono }}>
 {labels[level]}
 </div>
 </div>
 );
}

// ── Auth Input ─────────────────────────────────────────────────────────────────
function AuthInput({
 label, type = "text", placeholder, value, onChange, autoComplete, error, icon,
}: {
 label: string; type?: string; placeholder: string; value: string;
 onChange: (v: string) => void; autoComplete?: string; error?: string;
 icon?: React.ReactNode;
}) {
 const [show, setShow] = useState(false);
 const [focused, setFocused] = useState(false);
 const isPassword = type === "password";
 const borderColor = error
 ? hexRgba("#EF4444", 0.7)
 : focused
 ? hexRgba(DS.pink, 0.9)
 : value && !focused
 ? hexRgba(DS.cosmicPurple, 0.4)
 : hexRgba(DS.cosmicPurple, 0.18);

 return (
 <div style={{ marginBottom: "1rem" }}>
 <label style={{
 color: DS.text3, fontSize: "0.6875rem",
 fontFamily: DS.mono, letterSpacing: "0.12em", display: "block", marginBottom: "0.5rem",
 }}>
 {label.toUpperCase()}
 </label>
 <motion.div
 animate={{
 borderColor,
 boxShadow: focused && !error
 ? `0 0 0 3px ${hexRgba(DS.pink, 0.12)}, 0 0 20px ${hexRgba(DS.pink, 0.08)}`
 : "none",
 }}
 style={{
 display: "flex", alignItems: "center", gap: "0.5rem",
 padding: "0 1rem",
 background: "rgba(13,21,38,0.85)",
 border: `1.5px solid ${borderColor}`,
 borderRadius: "0.875rem",
 height: 52,
 transition: "box-shadow 0.2s ease",
 }}
 >
 {icon && <span style={{ color: hexRgba(DS.pink, 0.7), display: "flex" }}>{icon}</span>}
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
 <motion.button
 type="button"
 onClick={() => setShow(!show)}
 whileTap={{ scale: 0.85 }}
 style={{ color: DS.text4, background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}>
 {show ? <EyeOff size={16} /> : <Eye size={16} />}
 </motion.button>
 )}
 </motion.div>
 {error && (
 <div style={{
 color: "#EF4444", fontSize: "0.75rem",
 fontFamily: DS.mono, marginTop: "0.375rem", display: "flex", alignItems: "center", gap: "0.25rem",
 }}>
 <AlertCircle size={11} />
 {error}
 </div>
 )}
 </div>
 );
}

// ── Primary Button ─────────────────────────────────────────────────────────────
function PrimaryButton({ children, loading, disabled }: {
 children: React.ReactNode; loading: boolean; disabled: boolean;
}) {
 const [hovered, setHovered] = useState(false);
 return (
 <motion.button
 type="submit"
 disabled={disabled}
 onHoverStart={() => setHovered(true)}
 onHoverEnd={() => setHovered(false)}
 whileTap={{ scale: disabled ? 1 : 0.97 }}
 animate={{
 background: disabled
 ? `linear-gradient(135deg, ${hexRgba(DS.pink, 0.3)}, ${hexRgba(DS.cosmicPurple, 0.3)})`
 : GRD.primary,
 boxShadow: disabled
 ? "none"
 : hovered
 ? `0 0 40px ${hexRgba(DS.pink, 0.5)}, 0 0 80px ${hexRgba(DS.pink, 0.2)}`
 : `0 0 25px ${hexRgba(DS.pink, 0.35)}, 0 0 50px ${hexRgba(DS.pink, 0.12)}`,
 }}
 style={{
 width: "100%",
 color: "#fff", border: "none", borderRadius: "0.875rem",
 padding: "0.875rem",
 fontSize: "0.9375rem", fontWeight: 700,
 fontFamily: DS.heading, letterSpacing: "0.04em",
 cursor: disabled ? "not-allowed" : "pointer",
 display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
 transition: "background 0.3s ease, box-shadow 0.3s ease",
 }}
 >
 {loading ? (
 <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ display: "flex" }}>
 <Loader2 size={16} />
 </motion.span>
 ) : (
 <motion.span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
 {children}
 </motion.span>
 )}
 </motion.button>
 );
}

// ── Google Button ─────────────────────────────────────────────────────────────
function GoogleButton() {
 const [hovered, setHovered] = useState(false);
 return (
 <motion.button
 type="button"
 onClick={() => { window.location.href = "/api/admin/auth/google-signin?callbackUrl=/admin/overview"; }}
 onHoverStart={() => setHovered(true)}
 onHoverEnd={() => setHovered(false)}
 whileTap={{ scale: 0.98 }}
 animate={{
 borderColor: hovered ? hexRgba(DS.pink, 0.6) : hexRgba(DS.cosmicPurple, 0.3),
 background: hovered ? hexRgba(DS.pink, 0.06) : "rgba(13,21,38,0.6)",
 }}
 style={{
 width: "100%", border: "1px solid", borderRadius: "0.875rem", padding: "0.75rem",
 fontSize: "0.875rem", color: DS.text3,
 display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
 transition: "border-color 0.15s, background 0.15s",
 cursor: "pointer",
 }}
 >
 <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
 <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
 <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
 <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
 <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
 </svg>
 Đăng nhập với Google
 </motion.button>
 );
}

// ── Main Form ─────────────────────────────────────────────────────────────────
export function AdminLoginForm() {
 const router = useRouter();
 const login = useAuthStore((s) => s.login);

 const [email, setEmail] = useState(() => {
 if (typeof window === "undefined") return "";
 try { return localStorage.getItem("loop-staff-email") ?? ""; } catch { return ""; }
 });
 const [password, setPassword] = useState("");
 const [showPw, setShowPw] = useState(false);
 const [rememberMe, setRememberMe] = useState(() => {
 if (typeof window === "undefined") return false;
 try { return !!localStorage.getItem("loop-staff-email"); } catch { return false; }
 });
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");
 const [successData, setSuccessData] = useState<{ name: string } | null>(null);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!email || !password) return;
 setLoading(true);
 setError("");

 const ok = await login(email, password);

 if (ok) {
 const user = useAuthStore.getState().user;
 if (rememberMe) {
 try { localStorage.setItem("loop-staff-email", email); } catch { /* noop */ }
 } else {
 try { localStorage.removeItem("loop-staff-email"); } catch { /* noop */ }
 }
 toast.success("Đăng nhập thành công!", { description: user ? `Chào mừng ${user.name}` : undefined });
 setSuccessData({ name: user?.name ?? email });
 } else {
 setError(useAuthStore.getState().error ?? "Email hoặc mật khẩu không đúng");
 setLoading(false);
 }
 };

 // Redirect after success
 if (successData) {
 return (
 <motion.div
 initial={{ opacity: 0, scale: 0.94 }}
 animate={{ opacity: 1, scale: 1 }}
 transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
 style={{ textAlign: "center" }}
 >
 <motion.div
 initial={{ scale: 0 }}
 animate={{ scale: 1 }}
 transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
 style={{
 width: 72, height: 72, borderRadius: "50%",
 background: `${hexRgba(DS.green, 0.15)}`,
 border: `2px solid ${hexRgba(DS.green, 0.3)}`,
 display: "flex", alignItems: "center", justifyContent: "center",
 margin: "0 auto 1.5rem",
 boxShadow: `0 0 40px ${hexRgba(DS.green, 0.2)}`,
 }}
 >
 <CheckCircle2 size={36} color={DS.green} />
 </motion.div>
 <motion.h2
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2 }}
 style={{
 fontFamily: DS.heading, fontSize: "1.5rem", fontWeight: 900,
 background: `linear-gradient(135deg, #FFFFFF, ${DS.green})`,
 WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
 marginBottom: "0.5rem",
 }}
 >
 Chào mừng trở lại!
 </motion.h2>
 <motion.p
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ delay: 0.3 }}
 style={{ color: DS.text3, fontSize: "0.9375rem", marginBottom: "1.5rem" }}
 >
 {successData.name}
 </motion.p>
 <motion.button
 type="button"
 onClick={() => { window.location.href = "/admin/overview"; }}
 whileTap={{ scale: 0.97 }}
 animate={{
 background: GRD.primary,
 boxShadow: `0 0 25px ${hexRgba(DS.pink, 0.35)}, 0 0 50px ${hexRgba(DS.pink, 0.12)}`,
 }}
 style={{
 width: "100%",
 color: "#fff", border: "none", borderRadius: "0.875rem",
 padding: "0.875rem",
 fontSize: "0.9375rem", fontWeight: 700,
 fontFamily: DS.heading, letterSpacing: "0.04em",
 cursor: "pointer",
 display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
 }}
 >
 <Shield size={16} /> Vào Quản trị <ArrowRight size={16} />
 </motion.button>
 <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
 <button
 onClick={() => { setSuccessData(null); setEmail(""); setPassword(""); setLoading(false); }}
 style={{ background: "none", border: "none", color: DS.text4, fontSize: "0.8125rem", cursor: "pointer" }}>
 Đăng nhập tài khoản khác
 </button>
 </div>
 </motion.div>
 );
 }

 const fieldStagger = {
 hidden: { opacity: 0, y: -12 },
 show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
 };

 return (
 <motion.div
 variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
 initial="hidden"
 animate="show"
 >
 {/* Header */}
 <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
 <motion.div
 initial={{ scaleX: 0 }}
 animate={{ scaleX: 1 }}
 transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
 style={{
 width: 48, height: 3, borderRadius: 2,
 background: `linear-gradient(90deg, ${DS.cosmicPurple}, ${DS.pink})`,
 margin: "0 auto 1rem",
 boxShadow: `0 0 16px ${hexRgba(DS.pink, 0.5)}`,
 transformOrigin: "center",
 }}
 />
 <motion.h2
 initial={{ opacity: 0, y: 8 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2, duration: 0.3 }}
 style={{
 fontFamily: DS.heading, fontSize: "1.375rem", fontWeight: 900,
 background: `linear-gradient(135deg, #FFFFFF 0%, ${DS.pink} 100%)`,
 WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
 marginBottom: "0.375rem",
 }}
 >
 QUẢN TRỊ HỆ THỐNG
 </motion.h2>
 <motion.p
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ delay: 0.3 }}
 style={{ color: DS.text4, fontSize: "0.8125rem" }}
 >
 Nhân viên LOOP Solutions
 </motion.p>
 </div>

 {/* Form */}
 <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
 <motion.div variants={fieldStagger}>
 <AuthInput
 label="Email"
 type="email"
 placeholder="admin@loop.vn"
 value={email}
 onChange={setEmail}
 autoComplete="email"
 icon={<Mail size={16} />}
 />
 </motion.div>
 <motion.div variants={fieldStagger}>
 <AuthInput
 label="Mật khẩu"
 type="password"
 placeholder="••••••••"
 value={password}
 onChange={setPassword}
 autoComplete="current-password"
 icon={<Lock size={16} />}
 />
 <PasswordStrength password={password} />
 </motion.div>

 {/* Remember me */}
 <motion.div variants={fieldStagger}>
 <label style={{
 display: "flex", alignItems: "center", gap: "0.5rem",
 cursor: "pointer", userSelect: "none",
 }}>
 <div
 onClick={() => setRememberMe(!rememberMe)}
 style={{
 width: 18, height: 18, borderRadius: 5,
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
 </motion.div>

 {error && (
 <motion.div
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: "auto" }}
 style={{
 padding: "0.625rem 0.875rem", borderRadius: "0.625rem",
 background: `${hexRgba("#EF4444", 0.1)}`,
 border: `1px solid ${hexRgba("#EF4444", 0.3)}`,
 color: "#EF4444", fontSize: "0.8125rem",
 display: "flex", alignItems: "center", gap: "0.5rem",
 }}
 >
 <AlertCircle size={14} />
 {error}
 </motion.div>
 )}

 <motion.div variants={fieldStagger} style={{ marginTop: "0.5rem" }}>
 <PrimaryButton loading={loading} disabled={loading || !email || !password}>
 <Shield size={16} /> Đăng nhập
 </PrimaryButton>
 </motion.div>
 </form>

 {/* Forgot password */}
 <motion.div variants={fieldStagger} style={{ textAlign: "right", marginTop: "-0.25rem", marginBottom: "0.25rem" }}>
 <Link
 href="/api/auth/forgot-password"
 style={{ color: DS.pink, fontSize: "0.8125rem", textDecoration: "none" }}>
 Quên mật khẩu?
 </Link>
 </motion.div>

 {/* Divider */}
 <motion.div variants={fieldStagger} style={{
 display: "flex", alignItems: "center", gap: "0.75rem", margin: "0.5rem 0",
 }}>
 <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${hexRgba(DS.cosmicPurple, 0.3)}, transparent)` }} />
 <span style={{ color: DS.text5, fontSize: "0.75rem", fontFamily: DS.mono }}>HOẶC</span>
 <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${hexRgba(DS.cosmicPurple, 0.3)}, transparent)` }} />
 </motion.div>

 {/* Google */}
 <motion.div variants={fieldStagger}>
 <GoogleButton />
 </motion.div>

 {/* Staff badge */}
 <motion.div variants={fieldStagger} style={{
 textAlign: "center", marginTop: "1rem",
 paddingTop: "1rem",
 borderTop: `1px solid ${hexRgba(DS.cosmicPurple, 0.12)}`,
 }}>
 <div style={{
 display: "inline-flex", alignItems: "center", gap: "0.375rem",
 padding: "0.375rem 0.875rem",
 background: `${hexRgba(DS.cosmicPurple, 0.08)}`,
 border: `1px solid ${hexRgba(DS.cosmicPurple, 0.2)}`,
 borderRadius: 999,
 fontFamily: DS.mono, fontSize: "0.625rem",
 color: DS.text5, letterSpacing: "0.08em",
 }}>
 <UserCheck size={10} color={DS.cosmicPurple} />
 CHỈ DÀNH CHO NHÂN VIÊN LOOP
 </div>
 </motion.div>
 </motion.div>
 );
}
