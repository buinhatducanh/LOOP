"use client";
import { useState, useEffect } from "react";
import { motion } from "motion/react";

export function LP2FloatingContact({ settings }: { settings: Record<string, string> }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  const containerVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
  };

  const buttonVariants = {
    hover: { scale: 1.1, y: -4 },
    tap: { scale: 0.95 },
  };

  const itemStyle = {
    width: "60px",
    height: "60px",
    borderRadius: "18px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
    border: "1px solid rgba(255,255,255,0.1)",
    textDecoration: "none",
    position: "relative" as const,
    transition: "box-shadow 0.3s ease",
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      transition={{ delay: 1, duration: 0.5 }}
      style={{
        position: "fixed",
        bottom: "2rem",
        right: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        zIndex: 999,
        backgroundColor: "var(--lp2-floating-bg, rgba(255, 255, 255, 0.9))",
        backdropFilter: "blur(28px) saturate(180%)",
        padding: "0.875rem",
        borderRadius: "32px",
        border: "1px solid var(--lp2-floating-border, rgba(0, 0, 0, 0.08))",
        boxShadow: "var(--lp2-floating-shadow, 0 24px 64px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(255,255,255,0.5))",
      }}
    >
      {/* Zalo Button */}
      <motion.a
        href={settings.contact_zalo}
        target="_blank"
        rel="noreferrer"
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
        style={{
          ...itemStyle,
          backgroundColor: "#0068FF",
        }}
      >
        <span style={{ color: "white", fontSize: "12px", fontWeight: "900", letterSpacing: "-0.02em" }}>Zalo</span>
      </motion.a>

      {/* Phone Button */}
      <motion.a
        href={`tel:${settings.contact_hotline.replace(/\s+/g, '')}`}
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
        style={{
          ...itemStyle,
          background: "linear-gradient(135deg, #FF50B0 0%, #7033FF 100%)",
          overflow: "visible",
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
        {/* Glowing dot */}
        <span style={{
          position: "absolute",
          top: "6px",
          right: "6px",
          width: "10px",
          height: "10px",
          backgroundColor: "white",
          borderRadius: "50%",
          boxShadow: "0 0 12px rgba(255,255,255,1)",
          border: "2px solid rgba(0,0,0,0.1)",
        }} />
      </motion.a>

      {/* Facebook Button */}
      <motion.a
        href={settings.contact_facebook}
        target="_blank"
        rel="noreferrer"
        variants={buttonVariants}
        whileHover="hover"
        whileTap="tap"
        style={{
          ...itemStyle,
          backgroundColor: "#1877F2",
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
        </svg>
      </motion.a>

    </motion.div>
  );
}
