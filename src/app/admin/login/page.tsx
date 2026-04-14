"use client";

/**
 * Admin Login Page — /admin/login
 *
 * Public: shows login form for unauthenticated users.
 * Already-authenticated users are auto-redirected to /admin/overview.
 *
 * Redesigned: shared animated background with client auth page.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminLoginModal } from "@/components/admin/AdminLoginModal";
import { DS } from "@/lib/design-tokens";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

function hexRgba(hex: string, alpha: number): string {
 const h = hex.replace("#", "");
 const r = parseInt(h.substring(0, 2), 16);
 const g = parseInt(h.substring(2, 4), 16);
 const b = parseInt(h.substring(4, 6), 16);
 return `rgba(${r},${g},${b},${alpha})`;
}

function Particle({ x, y, size, delay, duration, opacity }: {
 x: number; y: number; size: number; delay: number; duration: number; opacity: number;
}) {
 return (
 <motion.div
 initial={{ opacity: 0, scale: 0 }}
 animate={{ opacity: [0, opacity, opacity * 0.5, opacity], scale: [0, 1, 0.7, 1], y: [-15, -50, -15] }}
 transition={{ opacity: { delay, duration, times: [0, 0.3, 0.7, 1], repeat: Infinity, repeatDelay: Math.random() * 3 + 2 }, scale: { delay, duration, repeat: Infinity }, y: { delay, duration, repeat: Infinity } }}
 style={{
 position: "absolute", left: `${x}%`, top: `${y}%`,
 width: size, height: size, borderRadius: "50%",
 background: Math.random() > 0.5
 ? `radial-gradient(circle, ${DS.pink}, transparent)`
 : `radial-gradient(circle, ${DS.cosmicPurple}, transparent)`,
 boxShadow: Math.random() > 0.5
 ? `0 0 ${size * 2}px ${hexRgba(DS.pink, 0.3)}`
 : `0 0 ${size * 2}px ${hexRgba(DS.cosmicPurple, 0.3)}`,
 pointerEvents: "none",
 }}
 />
 );
}

function AdminAnimatedBg() {
 const mouseX = useMotionValue(0);
 const mouseY = useMotionValue(0);
 const springX = useSpring(mouseX, { stiffness: 25, damping: 18 });
 const springY = useSpring(mouseY, { stiffness: 25, damping: 18 });
 const ring1X = useTransform(springX, [-1, 1], [-25, 25]);
 const ring1Y = useTransform(springY, [-1, 1], [-15, 15]);
 const ring2X = useTransform(springX, [-1, 1], [-14, 14]);
 const ring2Y = useTransform(springY, [-1, 1], [-9, 9]);

 useEffect(() => {
 const onMove = (e: MouseEvent) => {
 mouseX.set((e.clientX / window.innerWidth - 0.5) * 2);
 mouseY.set((e.clientY / window.innerHeight - 0.5) * 2);
 };
 window.addEventListener("mousemove", onMove);
 return () => window.removeEventListener("mousemove", onMove);
 }, []);

 const particles = Array.from({ length: 40 }, (_, i) => ({
 id: i,
 x: Math.random() * 100,
 y: Math.random() * 100,
 size: Math.random() * 3 + 2,
 delay: Math.random() * 4,
 duration: Math.random() * 5 + 6,
 opacity: Math.random() * 0.4 + 0.15,
 }));

 return (
 <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
 <div style={{
 position: "absolute", inset: 0,
 background: `radial-gradient(ellipse 70% 50% at 50% 40%, ${hexRgba(DS.cosmicPurple, 0.07)} 0%, transparent 60%),
 radial-gradient(ellipse 50% 40% at 70% 70%, ${hexRgba(DS.pink, 0.04)} 0%, transparent 50%),
 ${DS.bg}`,
 }} />

 {/* Grid */}
 <motion.div
 style={{
 position: "absolute", inset: "-20%",
 backgroundImage: `linear-gradient(${hexRgba(DS.cosmicPurple, 0.04)} 1px, transparent 1px), linear-gradient(90deg, ${hexRgba(DS.cosmicPurple, 0.04)} 1px, transparent 1px)`,
 backgroundSize: "80px 80px",
 x: useTransform(springX, [-1, 1], [-12, 12]),
 y: useTransform(springY, [-1, 1], [-8, 8]),
 }}
 />

 {particles.map((p) => <Particle key={p.id} {...p} />)}

 {/* Rings */}
 <motion.div
 style={{
 position: "absolute", top: "50%", left: "50%",
 x: ring1X, y: ring1Y,
 translateX: "-50%", translateY: "-50%",
 width: 600, height: 600, borderRadius: "50%",
 border: `1px solid ${hexRgba(DS.cosmicPurple, 0.1)}`,
 }}
 animate={{ rotate: 360 }}
 transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
 />
 <motion.div
 style={{
 position: "absolute", top: "50%", left: "50%",
 x: ring2X, y: ring2Y,
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
 return !!localStorage.getItem("loop-staff-token");
}

export default function AdminLoginPage() {
 const [mounted, setMounted] = useState(false);
 const router = useRouter();

 useEffect(() => {
 if (hasStoredToken()) {
 router.replace("/admin/overview");
 return;
 }
 setMounted(true);
 }, []);

 return (
 <>
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
 <AdminAnimatedBg />

 {mounted && (
 <motion.div
 initial={{ opacity: 0, scale: 0.93, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
 style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 460, margin: "1rem" }}
 >
 <div style={{
 position: "absolute", inset: -1,
 background: `linear-gradient(135deg, ${hexRgba(DS.cosmicPurple, 0.25)}, ${hexRgba(DS.pink, 0.15)})`,
 borderRadius: "1.5rem",
 opacity: 0.5,
 filter: "blur(1px)",
 }} />
 <div style={{
 background: "rgba(13,21,38,0.9)",
 backdropFilter: "blur(28px)",
 WebkitBackdropFilter: "blur(28px)",
 borderRadius: "1.5rem",
 border: `1px solid ${hexRgba(DS.cosmicPurple, 0.2)}`,
 padding: "2.5rem",
 boxShadow: `0 40px 80px rgba(0,0,0,0.5), 0 0 80px ${hexRgba(DS.cosmicPurple, 0.04)}`,
 }}>
 <AdminLoginModal
 autoOpen
 children={<div style={{ display: "none" }} />}
 />
 </div>
 </motion.div>
 )}
 </div>
 </>
 );
}
