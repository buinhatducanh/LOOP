"use client";

/**
 * Admin Login Page — /admin/login
 *
 * Cosmic full-page design with animated background.
 * Public: shows login form for unauthenticated users.
 * Already-authenticated users with valid token are auto-redirected to /admin/overview.
 */
import { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { DS } from "@/lib/design-tokens";
import { isTokenValid } from "@/lib/utils/token-utils";
import { useAuthStore } from "@/app/store/authStore";

function hexRgba(hex: string, alpha: number): string {
 const h = hex.replace("#", "");
 const r = parseInt(h.substring(0, 2), 16);
 const g = parseInt(h.substring(2, 4), 16);
 const b = parseInt(h.substring(4, 6), 16);
 return `rgba(${r},${g},${b},${alpha})`;
}

type ParticleData = {
 id: number;
 x: number; y: number; size: number; delay: number;
 duration: number; opacity: number;
 colorType: 0 | 1; // 0 = pink, 1 = purple — deterministic
};

function Particle({ x, y, size, delay, duration, opacity, colorType }: ParticleData) {
 const bg = colorType === 0
 ? `radial-gradient(circle, ${DS.pink}, transparent)`
 : `radial-gradient(circle, ${DS.cosmicPurple}, transparent)`;
 const shadow = colorType === 0
 ? `0 0 ${size * 2}px ${hexRgba(DS.pink, 0.3)}`
 : `0 0 ${size * 2}px ${hexRgba(DS.cosmicPurple, 0.3)}`;

 return (
 <motion.div
 initial={{ opacity: 0, scale: 0 }}
 animate={{ opacity: [0, opacity, opacity * 0.5, opacity], scale: [0, 1, 0.7, 1], y: [-15, -50, -15] }}
 transition={{ opacity: { delay, duration, times: [0, 0.3, 0.7, 1], repeat: Infinity, repeatDelay: delay * 0.8 }, scale: { delay, duration, repeat: Infinity }, y: { delay, duration, repeat: Infinity } }}
 style={{
 position: "absolute", left: `${x}%`, top: `${y}%`,
 width: size, height: size, borderRadius: "50%",
 background: bg,
 boxShadow: shadow,
 pointerEvents: "none",
 }}
 />
 );
}

function AdminAnimatedBg() {
 // Deterministic particle positions — avoids SSR/hydration mismatch.
 // Uses index-based pseudo-random so server and client render identically.
 const particles = useMemo<ParticleData[]>(() => Array.from({ length: 40 }, (_, i) => ({
 id: i,
 x: ((i * 17 + 7) % 97) + ((i * 3) % 3),
 y: ((i * 23 + 11) % 94) + ((i * 7) % 6),
 size: 2 + ((i * 5) % 4),
 delay: 0.5 + ((i * 3) % 8) * 0.5,
 duration: 6 + ((i * 7) % 10),
 opacity: 0.15 + (((i * 3) % 8) / 20),
 colorType: (i % 2) as 0 | 1,
 })), []);

 return (
 <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
 <div style={{
 position: "absolute", inset: 0,
 background: `radial-gradient(ellipse 70% 50% at 50% 40%, ${hexRgba(DS.cosmicPurple, 0.07)} 0%, transparent 60%),
 radial-gradient(ellipse 50% 40% at 70% 70%, ${hexRgba(DS.pink, 0.04)} 0%, transparent 50%),
 ${DS.bg}`,
 }} />

 {/* Grid */}
 <div style={{
 position: "absolute", inset: "-20%",
 backgroundImage: `linear-gradient(${hexRgba(DS.cosmicPurple, 0.04)} 1px, transparent 1px), linear-gradient(90deg, ${hexRgba(DS.cosmicPurple, 0.04)} 1px, transparent 1px)`,
 backgroundSize: "80px 80px",
 }} />

 {particles.map((p) => <Particle key={p.id} {...p} />)}

 {/* Ring 1 */}
 <motion.div
 style={{
 position: "absolute", top: "50%", left: "50%",
 translateX: "-50%", translateY: "-50%",
 width: 600, height: 600, borderRadius: "50%",
 border: `1px solid ${hexRgba(DS.cosmicPurple, 0.1)}`,
 }}
 animate={{ rotate: 360 }}
 transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
 />
 {/* Ring 2 */}
 <motion.div
 style={{
 position: "absolute", top: "50%", left: "50%",
 translateX: "-50%", translateY: "-50%",
 width: 380, height: 380, borderRadius: "40%",
 border: `1px solid ${hexRgba(DS.pink, 0.08)}`,
 }}
 animate={{ rotate: -360 }}
 transition={{ duration: 55, repeat: Infinity, ease: "linear" }}
 />

 {/* Central glow */}
 <div style={{
 position: "absolute", top: "50%", left: "50%",
 transform: "translate(-50%, -50%)",
 width: 3, height: 3, borderRadius: "50%",
 background: DS.pink,
 boxShadow: `0 0 30px ${DS.pink}, 0 0 60px ${hexRgba(DS.pink, 0.4)}`,
 }} />

 {/* Edge vignette */}
 <div style={{
 position: "absolute", inset: 0,
 background: `radial-gradient(ellipse at center, transparent 40%, ${hexRgba(DS.bg, 0.7)} 100%)`,
 }} />
 </div>
 );
}

function hasStoredToken(): boolean {
 if (typeof window === "undefined") return false;
 const token = localStorage.getItem("loop-staff-token");
 return isTokenValid(token);
}

function AdminLoginContent() {
 const [mounted, setMounted] = useState(false);
 const [expired, setExpired] = useState(false);
 const router = useRouter();
 const searchParams = useSearchParams();

 useEffect(() => {
 const isExpired = searchParams.get("reason") === "expired";

 // If redirected here due to expired session — clear stale client state and show clean UI.
 // MUST check this BEFORE hasStoredToken() to prevent race condition.
 if (isExpired) {
  localStorage.removeItem("loop-staff-token");
  useAuthStore.getState().logout();
  // Show "session expired" UI (no cosmic animation)
  setExpired(true);
  setMounted(true);
  // Strip the query param so refresh doesn't retrigger
  router.replace("/admin/login", { scroll: false });
  return;
 }

 // Normal flow: if a valid token exists in localStorage, redirect to admin
 if (hasStoredToken()) {
  router.replace("/admin/overview");
  return;
 }

 setMounted(true);
 }, [searchParams, router]);

 return (
 <div
 style={{
 background: DS.bg,
 minHeight: "100vh",
 display: "flex",
 alignItems: "center",
 justifyContent: "center",
 fontFamily: DS.body,
 position: "relative",
 overflow: "hidden",
 }}
 >
 {!expired && <AdminAnimatedBg />}

 {mounted && (
 <motion.div
 initial={{ opacity: 0, scale: 0.93, y: 24 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
 style={{
 width: "100%",
 maxWidth: 480,
 margin: "1rem",
 position: "relative",
 zIndex: 10,
 }}
 >
 {/* Outer glow */}
 <div style={{
 position: "absolute", inset: -1,
 background: `linear-gradient(135deg, ${hexRgba(DS.cosmicPurple, 0.3)}, ${hexRgba(DS.pink, 0.2)}, ${hexRgba(DS.cosmicCyan, 0.15)})`,
 borderRadius: "1.625rem",
 opacity: 0.6,
 filter: "blur(1px)",
 }} />

 {/* Card */}
 <div style={{
 background: "rgba(13,21,38,0.88)",
 backdropFilter: "blur(32px)",
 WebkitBackdropFilter: "blur(32px)",
 borderRadius: "1.5rem",
 border: `1px solid ${hexRgba(DS.cosmicPurple, 0.2)}`,
 boxShadow: `0 0 0 1px ${hexRgba(DS.cosmicPurple, 0.06)} inset, 0 40px 80px rgba(0,0,0,0.5), 0 0 100px ${hexRgba(DS.cosmicPurple, 0.05)}`,
 padding: "2.5rem",
 position: "relative",
 }}>
 {/* Logo */}
 <motion.div
 initial={{ opacity: 0, y: -12 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.15, duration: 0.4 }}
 style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginBottom: "1.75rem" }}
 >
 <img
 src="/assets/design-company/logo-cosmic-infinity.png"
 alt="LOOP"
 style={{ width: 40, height: 40, objectFit: "contain" }}
 />
 <div>
 <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: 20, fontWeight: 900, letterSpacing: "0.12em" }}>LOOP</div>
 <div style={{ color: DS.text5, fontSize: "0.625rem", fontFamily: DS.mono, letterSpacing: "0.2em" }}>SOLUTIONS</div>
 </div>
 <div style={{
 marginLeft: "0.5rem", padding: "0.25rem 0.625rem", borderRadius: 999,
 background: `${hexRgba(DS.pink, 0.1)}`, border: `1px solid ${hexRgba(DS.pink, 0.25)}`,
 fontFamily: DS.mono, fontSize: "0.5625rem", color: DS.pink,
 letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: "0.25rem",
 }}>
 <div style={{ width: 5, height: 5, borderRadius: "50%", background: DS.pink, boxShadow: `0 0 6px ${DS.pink}` }} />
 SEASON III
 </div>
 </motion.div>

 {/* Form */}
 <AdminLoginForm />
 </div>
 </motion.div>
 )}

 {/* Session expired — clean UI, no cosmic animation */}
 {expired && (
 <motion.div
 initial={{ opacity: 0, scale: 0.93, y: 24 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
 style={{
 width: "100%",
 maxWidth: 480,
 margin: "1rem",
 position: "relative",
 zIndex: 10,
 }}
 >
 <div style={{
 background: "rgba(13,21,38,0.88)",
 backdropFilter: "blur(32px)",
 WebkitBackdropFilter: "blur(32px)",
 borderRadius: "1.5rem",
 border: "1px solid rgba(239,68,68,0.2)",
 boxShadow: "0 40px 80px rgba(0,0,0,0.5)",
 padding: "2.5rem",
 position: "relative",
 textAlign: "center",
 }}>
 {/* Logo */}
 <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginBottom: "1.75rem" }}>
 <img
 src="/assets/design-company/logo-cosmic-infinity.png"
 alt="LOOP"
 style={{ width: 40, height: 40, objectFit: "contain" }}
 />
 <div>
 <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: 20, fontWeight: 900, letterSpacing: "0.12em" }}>LOOP</div>
 <div style={{ color: DS.text5, fontSize: "0.625rem", fontFamily: DS.mono, letterSpacing: "0.2em" }}>SOLUTIONS</div>
 </div>
 </div>

 {/* Warning icon */}
 <div style={{
 display: "flex",
 alignItems: "center",
 justifyContent: "center",
 width: 56,
 height: 56,
 borderRadius: "50%",
 background: "rgba(239,68,68,0.1)",
 border: "1px solid rgba(239,68,68,0.25)",
 margin: "0 auto 1.25rem",
 }}>
 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(239,68,68,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
 <circle cx="12" cy="12" r="10"/>
 <line x1="12" y1="8" x2="12" y2="12"/>
 <line x1="12" y1="16" x2="12.01" y2="16"/>
 </svg>
 </div>

 <h2 style={{ color: DS.text, fontSize: "1.125rem", fontWeight: 700, marginBottom: "0.5rem", fontFamily: DS.body }}>
 Phiên đăng nhập đã hết hạn
 </h2>
 <p style={{ color: DS.text5, fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "1.75rem" }}>
 Vui lòng đăng nhập lại để tiếp tục sử dụng hệ thống quản trị.
 </p>

 {/* Login form — same form shown below */}
 <AdminLoginForm />
 </div>
 </motion.div>
 )}

 {/* Back to home */}
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 transition={{ delay: 0.8 }}
 style={{
 position: "fixed", bottom: "1.5rem", left: "50%", transform: "translateX(-50%)",
 zIndex: 20, display: "flex", alignItems: "center", gap: "0.375rem",
 }}
 >
 <Link
 href="/"
 style={{
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
 </motion.div>

 </div>
 );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginContent />
    </Suspense>
  );
}
