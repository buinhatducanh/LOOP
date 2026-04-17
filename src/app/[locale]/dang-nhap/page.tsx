"use client";

/**
 * Auth Page — /vi/dang-nhap + /vi/dang-ky
 *
 * Redesigned: Full-screen immersive cosmic background with floating glassmorphism card.
 * Layers: particle field → rotating rings → grid → glass card → form
 *
 * Features:
 * - 60-particle CSS field with drift animation
 * - 3 concentric rotating geometric rings (parallax depth)
 * - Mouse parallax on background layers
 * - Glass card entrance (scale + opacity + translateY)
 * - 3D tilt on mouse move
 * - Tab switch with morphing transition + sliding pill
 * - Form fields staggered entrance (80ms per field)
 * - Typing effect on tagline
 * - Password strength indicator (4 levels)
 * - Submit button glow pulse
 * - Input focus glow expansion
 */
import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "motion/react";
import {
    Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, Shield,
    ArrowRight, Sparkles, Lock, Mail, User, Phone, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { DS, GRD } from "@/lib/design-tokens";
import { useAuthStore } from "@/app/store/authStore";
import { isTokenValid } from "@/lib/utils/token-utils";

// ── Helpers ────────────────────────────────────────────────────────────────────
function hexRgba(hex: string, alpha: number): string {
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

// ── Particle ──────────────────────────────────────────────────────────────────
type ParticleData = {
    id: number;
    x: number; y: number; size: number; delay: number;
    duration: number; opacity: number; colorType: 0 | 1;
};

function Particle({ x, y, size, delay, duration, opacity, colorType }: ParticleData) {
    const bg = colorType === 0
        ? `radial-gradient(circle, ${DS.pink}, transparent)`
        : `radial-gradient(circle, ${DS.cosmicPurple}, transparent)`;
    const shadow = colorType === 0
        ? `0 0 ${size * 2}px ${hexRgba(DS.pink, 0.4)}`
        : `0 0 ${size * 2}px ${hexRgba(DS.cosmicPurple, 0.4)}`;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0, y: 0 }}
            animate={{ opacity: [0, opacity, opacity * 0.6, opacity], scale: [0, 1, 0.8, 1], y: [-20, -60, -20] }}
            transition={{ opacity: { delay, duration, times: [0, 0.3, 0.7, 1], repeat: Infinity, repeatDelay: delay * 0.7 }, scale: { delay, duration, repeat: Infinity }, y: { delay, duration, repeat: Infinity } }}
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

// ── Animated Background ────────────────────────────────────────────────────────
function AnimatedBackground() {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springX = useSpring(mouseX, { stiffness: 30, damping: 20 });
    const springY = useSpring(mouseY, { stiffness: 30, damping: 20 });

    const ring1X = useTransform(springX, [-1, 1], [-30, 30]);
    const ring1Y = useTransform(springY, [-1, 1], [-20, 20]);
    const ring2X = useTransform(springX, [-1, 1], [-18, 18]);
    const ring2Y = useTransform(springY, [-1, 1], [-12, 12]);
    const ring3X = useTransform(springX, [-1, 1], [-8, 8]);
    const ring3Y = useTransform(springY, [-1, 1], [-5, 5]);
    const gridX = useTransform(springX, [-1, 1], [-15, 15]);
    const gridY = useTransform(springY, [-1, 1], [-10, 10]);

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            mouseX.set((e.clientX / window.innerWidth - 0.5) * 2);
            mouseY.set((e.clientY / window.innerHeight - 0.5) * 2);
        };
        window.addEventListener("mousemove", onMove);
        return () => window.removeEventListener("mousemove", onMove);
    }, []);

    const particles = useMemo<ParticleData[]>(() => Array.from({ length: 55 }, (_, i) => ({
        id: i,
        x: ((i * 23 + 11) % 96) + ((i * 7) % 4),
        y: ((i * 31 + 13) % 93) + ((i * 5) % 7),
        size: 2 + ((i * 7) % 5),
        delay: ((i * 3) % 8) * 0.5,
        duration: 6 + ((i * 5) % 8),
        opacity: 0.2 + (((i * 3) % 10) / 20),
        colorType: (i % 2) as 0 | 1,
    })), []);

    return (
        <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
            {/* Deep space gradient base */}
            <div style={{
                position: "absolute", inset: 0,
                background: `radial-gradient(ellipse 80% 60% at 50% 40%, ${hexRgba(DS.cosmicPurple, 0.08)} 0%, transparent 60%),
 radial-gradient(ellipse 60% 50% at 70% 70%, ${hexRgba(DS.pink, 0.05)} 0%, transparent 50%),
 ${DS.bg}`,
            }} />

            {/* Grid parallax */}
            <motion.div
                style={{
                    position: "absolute", inset: "-20%",
                    backgroundImage: `linear-gradient(${hexRgba(DS.cosmicPurple, 0.04)} 1px, transparent 1px), linear-gradient(90deg, ${hexRgba(DS.cosmicPurple, 0.04)} 1px, transparent 1px)`,
                    backgroundSize: "80px 80px",
                    x: gridX, y: gridY,
                }}
            />

            {/* Particle field */}
            {particles.map((p) => <Particle key={p.id} {...p} />)}

            {/* Ring 1 — largest, slowest */}
            <motion.div
                style={{
                    position: "absolute",
                    top: "50%", left: "50%",
                    x: ring1X, y: ring1Y,
                    translateX: "-50%", translateY: "-50%",
                    width: 700, height: 700, borderRadius: "50%",
                    border: `1px solid ${hexRgba(DS.cosmicPurple, 0.12)}`,
                    boxShadow: `0 0 40px ${hexRgba(DS.cosmicPurple, 0.06)} inset`,
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
            />

            {/* Ring 1 inner detail */}
            <motion.div
                style={{
                    position: "absolute",
                    top: "50%", left: "50%",
                    x: ring1X, y: ring1Y,
                    translateX: "-50%", translateY: "-50%",
                    width: 500, height: 500, borderRadius: "50%",
                    border: `1px dashed ${hexRgba(DS.pink, 0.08)}`,
                }}
                animate={{ rotate: -360 }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            />

            {/* Ring 2 — medium */}
            <motion.div
                style={{
                    position: "absolute",
                    top: "50%", left: "50%",
                    x: ring2X, y: ring2Y,
                    translateX: "-50%", translateY: "-50%",
                    width: 420, height: 420, borderRadius: "40%",
                    border: `1px solid ${hexRgba(DS.pink, 0.1)}`,
                    boxShadow: `0 0 30px ${hexRgba(DS.pink, 0.05)}`,
                }}
                animate={{ rotate: -360 }}
                transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            />

            {/* Ring 2 inner */}
            <motion.div
                style={{
                    position: "absolute",
                    top: "50%", left: "50%",
                    x: ring2X, y: ring2Y,
                    translateX: "-50%", translateY: "-50%",
                    width: 300, height: 300, borderRadius: "50%",
                    border: `1px solid ${hexRgba(DS.cosmicCyan, 0.08)}`,
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            />

            {/* Ring 3 — smallest, fastest */}
            <motion.div
                style={{
                    position: "absolute",
                    top: "50%", left: "50%",
                    x: ring3X, y: ring3Y,
                    translateX: "-50%", translateY: "-50%",
                    width: 180, height: 180, borderRadius: "30%",
                    border: `1px solid ${hexRgba(DS.cosmicCyan, 0.15)}`,
                    boxShadow: `0 0 20px ${hexRgba(DS.cosmicCyan, 0.08)}`,
                }}
                animate={{ rotate: -360 }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            />

            {/* Central glow */}
            <div style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                width: 4, height: 4, borderRadius: "50%",
                background: DS.pink,
                boxShadow: `0 0 40px ${DS.pink}, 0 0 80px ${hexRgba(DS.pink, 0.4)}, 0 0 120px ${hexRgba(DS.pink, 0.2)}`,
            }} />

            {/* Edge vignette */}
            <div style={{
                position: "absolute", inset: 0,
                background: `radial-gradient(ellipse at center, transparent 40%, ${hexRgba(DS.bg, 0.6)} 100%)`,
            }} />
        </div>
    );
}

// ── Typing Text ────────────────────────────────────────────────────────────────
function TypingText({ text, delay = 0 }: { text: string; delay?: number }) {
    const [displayed, setDisplayed] = useState("");
    useEffect(() => {
        const t = setTimeout(() => {
            let i = 0;
            const interval = setInterval(() => {
                setDisplayed(text.slice(0, i + 1));
                i++;
                if (i >= text.length) clearInterval(interval);
            }, 55);
            return () => clearInterval(interval);
        }, delay);
        return () => clearTimeout(t);
    }, [text, delay]);
    return (
        <span style={{ display: "inline" }}>
            {displayed}
            <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.7, repeat: Infinity }}
                style={{ display: "inline-block", marginLeft: 1, color: DS.pink }}
            >|</motion.span>
        </span>
    );
}

// ── Password Strength ──────────────────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
    const getStrength = () => {
        if (!password) return 0;
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        return Math.min(4, score);
    };
    const level = getStrength();
    const labels = ["", "Yếu", "Trung bình", "Mạnh", "Rất mạnh"];
    const colors = ["", "#EF4444", "#F59E0B", "#22C55E", "#10B981"];
    if (!password) return null;
    return (
        <div style={{ marginTop: "0.5rem" }}>
            <div style={{ display: "flex", gap: "0.25rem", marginBottom: "0.25rem" }}>
                {[1, 2, 3, 4].map((i) => (
                    <motion.div
                        key={i}
                        animate={{ backgroundColor: i <= level ? colors[level] : "rgba(107,61,245,0.15)" }}
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

// ── Form Input ────────────────────────────────────────────────────────────────
const motionProps = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
};

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
            : focused === false && value
                ? hexRgba(DS.cosmicPurple, 0.4)
                : `rgba(107,61,245,0.18)`;

    return (
        <motion.div {...motionProps}>
            <label style={{
                color: DS.text3, fontSize: "0.6875rem",
                fontFamily: DS.mono, letterSpacing: "0.12em", display: "block", marginBottom: "0.5rem",
            }}>
                {label.toUpperCase()}
            </label>
            <motion.div
                animate={{
                    borderColor,
                    boxShadow: focused && !error ? `0 0 0 3px ${hexRgba(DS.pink, 0.12)}, 0 0 20px ${hexRgba(DS.pink, 0.08)}` : "none",
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
                        type="button" onClick={() => setShow(!show)}
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
        </motion.div>
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
                <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    style={{ display: "flex" }}
                >
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

// ── Google Button ──────────────────────────────────────────────────────────────
function GoogleButton({ label }: { label: string }) {
    const [hovered, setHovered] = useState(false);
    return (
        <motion.button
            type="button"
            onClick={() => window.location.href = "/api/admin/auth/google-signin"}
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
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {label}
        </motion.button>
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

    const fieldStagger = {
        hidden: { opacity: 0, y: -12 },
        show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
    };

    return (
        <motion.div
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
            initial="hidden" animate="show"
        >
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
                    TẠO TÀI KHOẢN MỚI
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    style={{ color: DS.text4, fontSize: "0.8125rem" }}
                >
                    Đăng ký miễn phí để trải nghiệm dịch vụ
                </motion.p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <motion.div variants={fieldStagger}>
                    <AuthInput
                        label="Họ và tên"
                        placeholder="Nguyễn Văn A"
                        value={name}
                        onChange={(v) => { setName(v); setFieldErrors((p) => ({ ...p, name: "" })); }}
                        autoComplete="name"
                        error={fieldErrors.name}
                        icon={<User size={16} />}
                    />
                </motion.div>
                <motion.div variants={fieldStagger}>
                    <AuthInput
                        label="Email"
                        placeholder="email@company.vn"
                        type="email"
                        value={email}
                        onChange={(v) => { setEmail(v); setFieldErrors((p) => ({ ...p, email: "" })); }}
                        autoComplete="email"
                        error={fieldErrors.email}
                        icon={<Mail size={16} />}
                    />
                </motion.div>
                <motion.div variants={fieldStagger}>
                    <AuthInput
                        label="Số điện thoại (tùy chọn)"
                        placeholder="0xxx xxx xxx"
                        type="tel"
                        value={phone}
                        onChange={setPhone}
                        autoComplete="tel"
                        icon={<Phone size={16} />}
                    />
                </motion.div>
                <motion.div variants={fieldStagger}>
                    <AuthInput
                        label="Mật khẩu"
                        placeholder="Ít nhất 8 ký tự"
                        type="password"
                        value={password}
                        onChange={(v) => { setPassword(v); setFieldErrors((p) => ({ ...p, password: "" })); }}
                        autoComplete="new-password"
                        error={fieldErrors.password}
                        icon={<Lock size={16} />}
                    />
                    <PasswordStrength password={password} />
                </motion.div>
                <motion.div variants={fieldStagger}>
                    <AuthInput
                        label="Xác nhận mật khẩu"
                        placeholder="Nhập lại mật khẩu"
                        type="password"
                        value={confirmPwd}
                        onChange={(v) => { setConfirmPwd(v); setFieldErrors((p) => ({ ...p, confirmPwd: "" })); }}
                        autoComplete="new-password"
                        error={fieldErrors.confirmPwd}
                        icon={<Lock size={16} />}
                    />
                </motion.div>

                {globalError && (
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
                        {globalError}
                    </motion.div>
                )}

                <motion.div variants={fieldStagger} style={{ marginTop: "0.5rem" }}>
                    <PrimaryButton loading={loading} disabled={loading || !isValid}>
                        <CheckCircle2 size={16} /> Tạo tài khoản
                    </PrimaryButton>
                </motion.div>
            </form>

            <motion.div variants={fieldStagger} style={{
                display: "flex", alignItems: "center", gap: "0.75rem", margin: "1.5rem 0",
            }}>
                <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${hexRgba(DS.cosmicPurple, 0.3)}, transparent)` }} />
                <span style={{ color: DS.text5, fontSize: "0.75rem", fontFamily: DS.mono }}>HOẶC</span>
                <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${hexRgba(DS.cosmicPurple, 0.3)}, transparent)` }} />
            </motion.div>

            <motion.div variants={fieldStagger}>
                <GoogleButton label="Đăng ký với Google" />
            </motion.div>

            <motion.p variants={fieldStagger} style={{
                color: DS.text5, fontSize: "0.6875rem", textAlign: "center", marginTop: "1.25rem", lineHeight: 1.6,
            }}>
                Bằng việc đăng ký, bạn đồng ý với{" "}
                <span style={{ color: DS.pink, cursor: "pointer" }}>Điều khoản</span>{" "}
                và{" "}
                <span style={{ color: DS.pink, cursor: "pointer" }}>Chính sách bảo mật</span>.
            </motion.p>

            <motion.div variants={fieldStagger} style={{
                textAlign: "center", marginTop: "1rem", paddingTop: "1rem",
                borderTop: `1px solid ${hexRgba(DS.cosmicPurple, 0.12)}`,
            }}>
                <span style={{ color: DS.text5, fontSize: "0.8125rem" }}>
                    Đã có tài khoản?{" "}
                </span>
                <button onClick={onSwitch} style={{
                    color: DS.pink, fontSize: "0.8125rem", fontWeight: 600,
                    background: "none", border: "none", cursor: "pointer", padding: 0,
                }}>
                    Đăng nhập ngay
                </button>
            </motion.div>
        </motion.div>
    );
}

// ── Login Form ────────────────────────────────────────────────────────────────
function LoginForm({ onSwitch }: { onSwitch: () => void }) {
    const t = useTranslations("auth");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successData, setSuccessData] = useState<{ name: string; role: string } | null>(null);
    const login = useAuthStore((s) => s.login);
    const [countdown, setCountdown] = useState(0);

    // Auto-redirect staff accounts to admin after login succeeds
    useEffect(() => {
        if (!successData) return;
        if (successData.role === "client") return; // customer stays on success view
        setCountdown(1);
        const timer = setTimeout(() => {
            window.location.href = "/admin/overview";
        }, 1500);
        return () => clearTimeout(timer);
    }, [successData]);

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
                toast.success("�ăng nhập thành công!", { description: `Chào mừng ${state.user?.name ?? "bạn"}` });
            } else {
                setError(state.error ?? "Email hoặc mật khẩu không đúng");
            }
        } catch {
            setError("Không thể kết nối máy chủ.");
        } finally {
            setLoading(false);
        }
    };

    const fieldStagger = {
        hidden: { opacity: 0, y: -12 },
        show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
    };

    if (successData) {
        return (
            <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{ textAlign: "center" }}
            >
                {/* Success burst */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
                    style={{
                        width: 72, height: 72, borderRadius: "50%",
                        background: `${hexRgba(DS.green ?? "#22C55E", 0.15)}`,
                        border: `2px solid ${hexRgba(DS.green ?? "#22C55E", 0.3)}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 1.5rem",
                        boxShadow: `0 0 40px ${hexRgba(DS.green ?? "#22C55E", 0.2)}`,
                    }}
                >
                    <CheckCircle2 size={36} color={DS.green ?? "#22C55E"} />
                </motion.div>
                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{
                        fontFamily: DS.heading, fontSize: "1.5rem", fontWeight: 900,
                        background: `linear-gradient(135deg, #FFFFFF, ${DS.green ?? "#22C55E"})`,
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
                    style={{ color: DS.text3, fontSize: "0.9375rem", marginBottom: "2rem" }}
                >
                    Đăng nhập thành công,{" "}
                    <strong style={{ color: DS.text }}>{successData.name}</strong>
                </motion.p>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <motion.button
                        type="button"
                        onClick={() => {
                            if (successData.role === "client") {
                                window.location.href = "/khach-hang";
                            } else {
                                window.location.href = "/admin/overview";
                            }
                        }}
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
                        {successData.role === "client" ? (
                            <><Sparkles size={16} /> Vào trang khách hàng <ChevronRight size={16} /></>
                        ) : (
                            <>
                                <Shield size={16} />
                                {countdown > 0 ? (
                                    <>Đang chuyển đến Quản trị...</>
                                ) : (
                                    <>Vào Quản trị <ChevronRight size={16} /></>
                                )}
                            </>
                        )}
                    </motion.button>
                    <div
                        onClick={() => { setSuccessData(null); setEmail(""); setPassword(""); }}
                        style={{ textAlign: "center", marginTop: "1.5rem" }}
                    >
                        <button style={{
                            background: "none", border: "none", color: DS.text4,
                            fontSize: "0.8125rem", cursor: "pointer",
                        }}>
                            Đăng nhập tài khoản khác
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        );
    }

    return (
        <motion.div
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
            initial="hidden" animate="show"
        >
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
                    CHÀO MỪNG TRỞ LẠI
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    style={{ color: DS.text4, fontSize: "0.8125rem" }}
                >
                    <TypingText text="Đăng nhập để tiếp tục hành trình của bạn" delay={400} />
                </motion.p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <motion.div variants={fieldStagger}>
                    <AuthInput
                        label={t("email") ?? "Email"}
                        type="email"
                        placeholder="email@company.vn"
                        value={email}
                        onChange={setEmail}
                        autoComplete="email"
                        icon={<Mail size={16} />}
                    />
                </motion.div>
                <motion.div variants={fieldStagger}>
                    <AuthInput
                        label={t("password") ?? "Mật khẩu"}
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={setPassword}
                        autoComplete="current-password"
                        icon={<Lock size={16} />}
                    />
                </motion.div>

                <motion.div variants={fieldStagger} style={{ textAlign: "right", marginBottom: "0.25rem" }}>
                    <button type="button" style={{
                        color: DS.pink, background: "none", border: "none",
                        fontSize: "0.8125rem", cursor: "pointer", padding: 0,
                    }}>
                        Quên mật khẩu?
                    </button>
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
                        {t("login") ?? "Đăng nhập"} <ArrowRight size={16} />
                    </PrimaryButton>
                </motion.div>
            </form>

            <motion.div variants={fieldStagger} style={{
                display: "flex", alignItems: "center", gap: "0.75rem", margin: "1.5rem 0",
            }}>
                <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${hexRgba(DS.cosmicPurple, 0.3)}, transparent)` }} />
                <span style={{ color: DS.text5, fontSize: "0.75rem", fontFamily: DS.mono }}>HOẶC</span>
                <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${hexRgba(DS.cosmicPurple, 0.3)}, transparent)` }} />
            </motion.div>

            <motion.div variants={fieldStagger}>
                <GoogleButton label="Tiếp tục với Google" />
            </motion.div>

            <motion.div variants={fieldStagger} style={{
                textAlign: "center", marginTop: "1.5rem", paddingTop: "1rem",
                borderTop: `1px solid ${hexRgba(DS.cosmicPurple, 0.12)}`,
            }}>
                <span style={{ color: DS.text5, fontSize: "0.8125rem" }}>
                    Chưa có tài khoản?{" "}
                </span>
                <button onClick={onSwitch} style={{
                    color: DS.pink, fontSize: "0.8125rem", fontWeight: 600,
                    background: "none", border: "none", cursor: "pointer", padding: 0,
                }}>
                    Đăng ký miễn phí
                </button>
            </motion.div>
        </motion.div>
    );
}

// ── Main Page ────────────────────────────────────────────────────────────────
type AuthMode = "login" | "register";

export default function AuthPage() {
    const router = useRouter();
    const params = useParams();
    const locale = (params.locale as string) ?? "vi";
    const [mode, setMode] = useState<AuthMode>("login");
    const { isAuthenticated, accountType } = useAuthStore();

    // Skip to dashboard if already logged in
    useEffect(() => {
        if (!isAuthenticated || !accountType) return;
        // Guard: only redirect if the stored JWT is not expired.
        // Prevents redirect loop when localStorage has stale token but session expired.
        const storedToken = localStorage.getItem("auth-token");
        if (!isTokenValid(storedToken)) return;
        const dest = accountType === "staff" ? "/admin/overview" : `/${locale}/khach-hang`;
        router.replace(dest);
    }, [isAuthenticated, accountType, locale, router]);

    // Show success toast if user just registered
    useEffect(() => {
        const url = new URLSearchParams(window.location.search);
        if (url.get("registered") === "1") {
            toast.success("Đăng ký thành công! 🎉", {
                description: "Vui lòng đăng nhập để tiếp tục.",
            });
            window.history.replaceState({}, "", window.location.pathname);
        }

        // Show error alert when Google OAuth member is pending approval
        const error = url.get("error");
        if (error === "member_pending") {
            toast.error("Tài khoản đang chờ duyệt! ⏳", {
                description: "Tài khoản nhân viên của bạn chưa được phê duyệt. Vui lòng liên hệ quản trị viên để được kích hoạt.",
                duration: 6000,
            });
            window.history.replaceState({}, "", window.location.pathname);
        }
    }, []);

    // If route is /dang-ky → start on register
    const pathname = typeof window !== "undefined" ? window.location.pathname : "";
    useEffect(() => {
        if (pathname.endsWith("/dang-ky")) setMode("register");
    }, [pathname]);

    const tabs = [
        { key: "login" as AuthMode, label: "ĐĂNG NHẬP" },
        { key: "register" as AuthMode, label: "ĐĂNG KÝ" },
    ];

    return (
        <div style={{
            background: DS.bg, minHeight: "100vh",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: DS.body, position: "relative", overflow: "hidden",
        }}>
            {/* ── Animated background ── */}
            <AnimatedBackground />

            {/* ── Floating glass card ── */}
            <motion.div
                initial={{ opacity: 0, scale: 0.93, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    width: "100%", maxWidth: 480,
                    margin: "1rem",
                    position: "relative", zIndex: 10,
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
                    padding: "2.5rem",
                    border: `1px solid ${hexRgba(DS.cosmicPurple, 0.2)}`,
                    boxShadow: `0 0 0 1px ${hexRgba(DS.cosmicPurple, 0.06)} inset, 0 40px 80px rgba(0,0,0,0.5), 0 0 100px ${hexRgba(DS.cosmicPurple, 0.05)}`,
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

                    {/* Tab switcher with sliding pill */}
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                        style={{
                            display: "flex", marginBottom: "1.75rem",
                            background: `${hexRgba(DS.cosmicPurple, 0.08)}`,
                            borderRadius: "0.875rem", padding: "0.25rem",
                            position: "relative",
                        }}
                    >
                        {/* Sliding pill */}
                        <motion.div
                            layoutId="tab-pill"
                            style={{
                                position: "absolute", top: "0.25rem", bottom: "0.25rem",
                                width: "calc(50% - 0.25rem)",
                                background: GRD.primary,
                                borderRadius: "0.625rem",
                                boxShadow: `0 0 20px ${hexRgba(DS.pink, 0.35)}`,
                            }}
                        />
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setMode(tab.key)}
                                style={{
                                    flex: 1, padding: "0.625rem",
                                    borderRadius: "0.625rem",
                                    border: "none", cursor: "pointer",
                                    fontSize: "0.875rem", fontWeight: 700,
                                    fontFamily: DS.heading, letterSpacing: "0.04em",
                                    background: "none",
                                    color: mode === tab.key ? "#fff" : DS.text4,
                                    position: "relative", zIndex: 1,
                                    transition: "color 0.15s",
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </motion.div>

                    {/* Form content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={mode}
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        >
                            {mode === "login" ? (
                                <LoginForm onSwitch={() => setMode("register")} />
                            ) : (
                                <RegisterForm onSwitch={() => setMode("login")} />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </motion.div>

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
                    href={`/${locale}`}
                    style={{
                        display: "flex", alignItems: "center", gap: "0.375rem",
                        color: DS.text5, fontSize: "0.8125rem", textDecoration: "none",
                        transition: "color 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = DS.text)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = DS.text5)}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    Quay về trang chủ
                </Link>
            </motion.div>

            <style>{`
 @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
 @media (max-width: 640px) {
 .auth-card { padding: 1.75rem !important; }
 }
 `}</style>
        </div>
    );
}
