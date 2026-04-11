"use client";

/**
 * FloatingSocialButtons — Fixed bottom-right social contact buttons.
 * Zalo / Call / Facebook with animated tooltip labels.
 * Hidden when onboarding is active.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Phone } from "lucide-react";
import { CEO_CONTACT } from "@/lib/constants";

/* ── Design tokens ── */
const T = {
  bgCard: "rgba(10,10,20,0.82)",
  pink: "#EC4899",
  pinkLight: "#F472B6",
  purple: "#6B3DF5",
  blue: "#1877F2",
  white: "#FFFFFF",
  text3: "#94A3B8",
  text4: "#64748B",
  border: "rgba(255,255,255,0.07)",
} as const;

/* ── Keyframe styles (injected once) ── */
function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("fsb-css")) return;
  const s = document.createElement("style");
  s.id = "fsb-css";
  s.textContent = `
    @keyframes fsb-glow-pink {
      0%,100% { box-shadow: 0 0 0 0 rgba(236,72,153,0),0 4px 16px rgba(236,72,153,0.3); }
      50% { box-shadow: 0 0 0 8px rgba(236,72,153,0.12),0 4px 20px rgba(236,72,153,0.5); }
    }
    @keyframes fsb-glow-blue {
      0%,100% { box-shadow: 0 0 0 0 rgba(24,119,242,0),0 4px 16px rgba(24,119,242,0.3); }
      50% { box-shadow: 0 0 0 8px rgba(24,119,242,0.12),0 4px 20px rgba(24,119,242,0.5); }
    }
    @keyframes fsb-glow-zalo {
      0%,100% { box-shadow: 0 0 0 0 rgba(0,104,255,0),0 4px 16px rgba(0,104,255,0.3); }
      50% { box-shadow: 0 0 0 8px rgba(0,104,255,0.12),0 4px 20px rgba(0,104,255,0.5); }
    }
    @keyframes fsb-ring {
      0% { transform: scale(1); opacity: 0.6; }
      100% { transform: scale(2.5); opacity: 0; }
    }
    @keyframes fsb-shimmer {
      0% { transform: translateX(-100%) skewX(-15deg); }
      100% { transform: translateX(250%) skewX(-15deg); }
    }
    @keyframes fsb-dot-blink {
      0%,100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.7); }
    }
    @keyframes fsb-float {
      0%,100% { transform: translateY(0); }
      50% { transform: translateY(-3px); }
    }
  `;
  document.head.appendChild(s);
}

/* ── Button definitions ── */
type MicroAnim = "glow-pink" | "glow-blue" | "glow-zalo";

interface Btn {
  key: string;
  label: string;
  sub: string;
  href: string;
  target?: string;
  rel?: string;
  ariaLabel: string;
  gradient: string;
  glowFn: string;      // keyframe name
  borderColor: string;
  icon: React.ReactNode;
  showDot?: boolean;   // blinking dot indicator
}

const BTNS: Btn[] = [
  {
    key: "zalo",
    label: "Zalo",
    sub: "Nhắn tin nhanh",
    href: CEO_CONTACT.zaloUrl,
    target: "_blank",
    rel: "noopener noreferrer",
    ariaLabel: "Liên hệ qua Zalo",
    gradient: "linear-gradient(135deg, #0068FF 0%, #0048CC 100%)",
    glowFn: "fsb-glow-zalo",
    borderColor: "rgba(0,104,255,0.35)",
    icon: (
      <span style={{ color: "#fff", fontSize: 11, fontWeight: 800, letterSpacing: "0.02em", lineHeight: 1 }}>
        Zalo
      </span>
    ),
  },
  {
    key: "phone",
    label: "Gọi ngay",
    sub: CEO_CONTACT.phoneDisplay,
    href: `tel:${CEO_CONTACT.phone}`,
    ariaLabel: `Gọi ngay ${CEO_CONTACT.phoneDisplay}`,
    gradient: "linear-gradient(135deg, #EC4899 0%, #6B3DF5 100%)",
    glowFn: "fsb-glow-pink",
    borderColor: "rgba(236,72,153,0.35)",
    icon: <Phone size={20} />,
    showDot: true,
  },
  {
    key: "facebook",
    label: "Facebook",
    sub: "Kết nối ngay",
    href: CEO_CONTACT.facebookUrl,
    target: "_blank",
    rel: "noopener noreferrer",
    ariaLabel: "Kết nối qua Facebook",
    gradient: "linear-gradient(135deg, #1877F2 0%, #0D5FC4 100%)",
    glowFn: "fsb-glow-blue",
    borderColor: "rgba(24,119,242,0.35)",
    icon: (
      <svg width={17} height={17} viewBox="0 0 24 24" fill={T.white} aria-hidden="true">
        <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
      </svg>
    ),
  },
];

/* ── Single button with tooltip ── */
function ContactBtn({ btn, index }: { btn: Btn; index: number }) {
  const [hovered, setHovered] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShown(true), 150 + index * 90);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 28, scale: 0.7, rotateY: -15 }}
      animate={shown ? { opacity: 1, x: 0, scale: 1, rotateY: 0 } : {}}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      style={{ position: "relative", display: "flex", alignItems: "center" }}
    >
      {/* Tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            key="tooltip"
            initial={{ opacity: 0, x: -10, scale: 0.88 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.88 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            style={{
              position: "absolute",
              right: "100%",
              marginRight: 14,
              whiteSpace: "nowrap",
              background: T.bgCard,
              border: `1px solid ${btn.borderColor}`,
              borderRadius: 12,
              padding: "9px 14px",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.55), 0 0 20px rgba(0,0,0,0.2)",
              pointerEvents: "none",
              zIndex: 20,
            }}
          >
            {/* Arrow */}
            <div style={{
              position: "absolute",
              right: -5,
              top: "50%",
              transform: "translateY(-50%) rotate(45deg)",
              width: 8,
              height: 8,
              background: T.bgCard,
              borderTop: `1px solid ${btn.borderColor}`,
              borderRight: `1px solid ${btn.borderColor}`,
            }} />
            <div style={{ color: T.white, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{btn.label}</div>
            <div style={{ color: T.text3, fontSize: 11 }}>{btn.sub}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ring ripple on hover */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            key="ring"
            initial={{ scale: 1, opacity: 0.7 }}
            animate={{ scale: 2.8, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 15,
              background: btn.key === "phone"
                ? "rgba(236,72,153,0.35)"
                : btn.key === "facebook"
                ? "rgba(24,119,242,0.35)"
                : "rgba(0,104,255,0.35)",
              zIndex: -1,
            }}
          />
        )}
      </AnimatePresence>

      {/* Main button */}
      <motion.a
        href={btn.href}
        target={btn.target}
        rel={btn.rel}
        aria-label={btn.ariaLabel}
        title={btn.ariaLabel}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        animate={{
          scale: hovered ? 1.12 : 1,
          y: hovered ? -2 : 0,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 22 }}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 54,
          height: 54,
          borderRadius: 15,
          background: btn.gradient,
          border: `1px solid ${btn.borderColor}`,
          boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
          color: T.white,
          textDecoration: "none",
          cursor: "pointer",
          animation: `${btn.glowFn} 2.8s ease-in-out infinite`,
          animationDelay: `${index * 0.4}s`,
          zIndex: 1,
          overflow: "hidden",
        }}
      >
        {/* Shimmer strip on hover */}
        <motion.div
          animate={{ x: hovered ? ["-100%", "200%"] : "-100%" }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.22) 40%, rgba(255,255,255,0.05) 60%, transparent 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Blinking live dot for phone */}
        {btn.showDot && (
          <motion.div
            animate={{ scale: [1, 1.6, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute",
              top: 5,
              right: 5,
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#FFFFFF",
              boxShadow: "0 0 6px 2px rgba(255,255,255,0.7)",
              zIndex: 2,
            }}
          />
        )}

        {btn.icon}
      </motion.a>
    </motion.div>
  );
}

/* ── Root component ── */
export function FloatingSocialButtons() {
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    injectStyles();
    setMounted(true);
    const done = localStorage.getItem("loop_onboarding_done");
    setIsOnboarding(!done);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "loop_onboarding_done") setIsOnboarding(false);
    };
    const onDone = () => setIsOnboarding(false);
    window.addEventListener("storage", onStorage);
    window.addEventListener("loop_onboarding_done", onDone);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("loop_onboarding_done", onDone);
    };
  }, []);

  if (!mounted || isOnboarding) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 240, damping: 22, delay: 0.2 }}
      style={{
        position: "fixed",
        bottom: "1.75rem",
        right: "1.75rem",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
      }}
    >
      {/* Pill container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.6rem",
          padding: "10px",
          borderRadius: 22,
          background: T.bgCard,
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          border: `1px solid ${T.border}`,
          boxShadow: "0 12px 48px rgba(0,0,0,0.65), 0 0 80px rgba(107,61,245,0.06)",
        }}
      >
        {BTNS.map((btn, i) => (
          <ContactBtn key={btn.key} btn={btn} index={i} />
        ))}
      </div>

      {/* Top accent line — pink → purple → blue gradient */}
      <div
        style={{
          position: "absolute",
          top: -1,
          left: "50%",
          transform: "translateX(-50%)",
          width: "50%",
          height: 2,
          borderRadius: 2,
          background: "linear-gradient(90deg, transparent, #EC4899 30%, #6B3DF5 65%, #1877F2 transparent)",
          filter: "blur(0.5px)",
          opacity: 0.7,
        }}
      />
    </motion.div>
  );
}
