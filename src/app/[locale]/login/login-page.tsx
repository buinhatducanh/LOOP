"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/routing";
import { Zap, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    const { success, message } = await login(email, password);
    if (success) {
      router.push("/admin");
    } else {
      setError(message || "Email hoặc mật khẩu không đúng");
      setLoading(false);
    }
  };

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: "100%",
    background: "#020617",
    border: `1px solid ${hasError ? "#EF4444" : "#1F2937"}`,
    borderRadius: "10px",
    padding: "13px 16px 13px 44px",
    color: "#FFFFFF",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        color: "#FFFFFF",
      }}
    >
      <div className="animate-fade-in" style={{
          width: "100%",
          maxWidth: "420px",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            textDecoration: "none",
            justifyContent: "center",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #8B5CF6, #06B6D4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Zap size={22} color="#FFFFFF" />
          </div>
          <span
            style={{
              fontSize: "24px",
              fontWeight: 800,
              background: "linear-gradient(135deg, #8B5CF6, #06B6D4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            LOOP
          </span>
        </Link>

        {/* Card */}
        <div
          style={{
            background: "#0F172A",
            border: "1px solid #1F2937",
            borderRadius: "20px",
            padding: "40px",
          }}
        >
          <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px", textAlign: "center" }}>
            Welcome back
          </h1>
          <p style={{ color: "#94A3B8", fontSize: "14px", textAlign: "center", marginBottom: "32px" }}>
            Sign in to your account to continue
          </p>

          {error && (
            <div
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: "10px",
                padding: "12px 16px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <AlertCircle size={16} color="#EF4444" />
              <span style={{ color: "#EF4444", fontSize: "13px" }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Email */}
            <div>
              <label
                style={{
                  display: "block",
                  color: "#94A3B8",
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Email
              </label>
              <div style={{ position: "relative" }}>
                <Mail
                  size={16}
                  color="#94A3B8"
                  style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@loop.vn"
                  style={inputStyle(!!error)}
                  onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#3B82F6"; }}
                  onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "#1F2937"; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                style={{
                  display: "block",
                  color: "#94A3B8",
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={16}
                  color="#94A3B8"
                  style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{ ...inputStyle(!!error), paddingRight: "44px" }}
                  onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#3B82F6"; }}
                  onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "#1F2937"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                >
                  {showPassword ? (
                    <EyeOff size={16} color="#94A3B8" />
                  ) : (
                    <Eye size={16} color="#94A3B8" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? "#1F2937" : "linear-gradient(135deg, #3B82F6, #6366F1)",
                color: "#FFFFFF",
                border: "none",
                padding: "14px",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: loading ? "none" : "0 0 30px rgba(99,102,241,0.3)",
              }}
            >
              {loading ? "Signing in..." : <>Sign In <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", color: "#94A3B8", fontSize: "14px", marginTop: "24px" }}>
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            style={{
              color: "#3B82F6",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
