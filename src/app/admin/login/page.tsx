"use client";

/**
 * Admin Login Page — LOOP Solutions
 *
 * Dark-themed Figma login page.
 * Adapted from Figma OLD FE AuthPage.tsx.
 * Wires to real POST /api/admin/auth/login → JWT cookie → /admin/overview.
 *
 * Key features:
 *  - Email/password form
 *  - Real API login
 *  - Error display
 *  - Loading state with animation
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { useAuthStore } from "@/app/store/authStore";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    const ok = await login(email, password);
    if (ok) {
      router.push("/admin/overview");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--figma-bg, #020617)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(var(--figma-border, #1F2937) 1px, transparent 1px), " +
            "linear-gradient(90deg, var(--figma-border, #1F2937) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          opacity: 0.2,
          pointerEvents: "none",
        }}
      />

      {/* Background orbs */}
      <motion.div
        style={{
          position: "absolute",
          top: "-20%",
          left: "-10%",
          width: "50%",
          height: "50%",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(29,78,216,0.15) 0%, transparent 70%)",
        }}
        animate={{ x: [0, 30, 0], y: [0, -15, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        style={{
          position: "absolute",
          bottom: "-10%",
          right: "-10%",
          width: "50%",
          height: "50%",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(129,140,248,0.1) 0%, transparent 70%)",
        }}
        animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 420,
          margin: "1rem",
          padding: "2.5rem",
          background: "var(--figma-bg-card, #0F172A)",
          border: "1px solid var(--figma-border, #1F2937)",
          borderRadius: 16,
          boxShadow: "0 8px 48px rgba(0,0,0,0.5)",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "2rem" }}>
          <motion.div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--figma-grd-primary)",
              marginBottom: "1rem",
            }}
            animate={{
              boxShadow: [
                "0 0 20px rgba(59,130,246,0.4)",
                "0 0 40px rgba(129,140,248,0.6)",
                "0 0 20px rgba(59,130,246,0.4)",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
              <path
                d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z"
                stroke="rgba(255,255,255,0.8)"
                strokeWidth="1.5"
                fill="none"
              />
              <path d="M20 8 L30 13.5 L30 25 L20 30.5 L10 25 L10 13.5 Z" fill="rgba(255,255,255,0.12)" />
              <text x="20" y="25" textAnchor="middle" fontSize="14" fontWeight="900" fill="white" fontFamily="serif">
                ∞
              </text>
            </svg>
          </motion.div>
          <h1
            style={{
              color: "var(--figma-text, #fff)",
              fontFamily: "'Cinzel', serif",
              fontSize: "1.25rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              margin: "0 0 0.25rem",
            }}
          >
            LOOP OS
          </h1>
          <p
            style={{
              color: "var(--figma-text3, #94A3B8)",
              fontSize: "0.8125rem",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.15em",
              margin: 0,
            }}
          >
            ADMIN PANEL
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              style={{
                display: "block",
                color: "var(--figma-text3, #94A3B8)",
                fontSize: "0.8125rem",
                fontWeight: 500,
                marginBottom: "0.5rem",
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) clearError();
              }}
              className="figma-input"
              placeholder="admin@loop.vn"
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              style={{
                display: "block",
                color: "var(--figma-text3, #94A3B8)",
                fontSize: "0.8125rem",
                fontWeight: 500,
                marginBottom: "0.5rem",
              }}
            >
              Mật khẩu
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) clearError();
                }}
                className="figma-input"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={{ paddingRight: "2.5rem" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--figma-text4, #64748B)",
                  display: "flex",
                  alignItems: "center",
                  padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              style={{
                padding: "0.625rem 0.875rem",
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 8,
                color: "var(--figma-red, #EF4444)",
                fontSize: "0.8125rem",
              }}
            >
              {error}
            </motion.div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="figma-btn-primary"
            disabled={isLoading}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              height: 42,
              fontSize: "0.9375rem",
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                Đang đăng nhập...
              </>
            ) : (
              <>
                Đăng nhập
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer note */}
        <p
          style={{
            color: "var(--figma-text4, #64748B)",
            fontSize: "0.75rem",
            textAlign: "center",
            marginTop: "1.5rem",
          }}
        >
          Chỉ dành cho nhân viên LOOP Solutions
        </p>
      </motion.div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
