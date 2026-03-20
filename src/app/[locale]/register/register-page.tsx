"use client";

import React, { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { signIn } from "next-auth/react";
import { Zap, User, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";

export function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    setTimeout(() => {
      router.push("/login");
    }, 1200);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
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
      <div
        className="animate-fade-in"
        style={{ width: "100%", maxWidth: "420px" }}
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
            Create an account
          </h1>
          <p style={{ color: "#94A3B8", fontSize: "14px", textAlign: "center", marginBottom: "32px" }}>
            Join LOOP to start building amazing projects
          </p>

          {/* Google Sign Up */}
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: `${window.location.origin}/admin` })}
            style={{
              width: "100%",
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: "10px",
              padding: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              cursor: "pointer",
              marginBottom: "24px",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) => { (e.target as HTMLElement).style.background = "#F3F4F6"; }}
            onMouseOut={(e) => { (e.target as HTMLElement).style.background = "#FFFFFF"; }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span style={{ color: "#374151", fontSize: "14px", fontWeight: 600 }}>Sign up with Google</span>
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
            <div style={{ flex: 1, height: "1px", background: "#1F2937" }} />
            <span style={{ color: "#6B7280", fontSize: "12px" }}>or</span>
            <div style={{ flex: 1, height: "1px", background: "#1F2937" }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Name */}
            <div>
              <label style={{ display: "block", color: "#94A3B8", fontSize: "13px", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Full Name
              </label>
              <div style={{ position: "relative" }}>
                <User size={16} color="#94A3B8" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nguyen Van A"
                  style={inputStyle(!!errors.name)}
                  onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#3B82F6"; }}
                  onBlur={(e) => { (e.target as HTMLElement).style.borderColor = errors.name ? "#EF4444" : "#1F2937"; }}
                />
              </div>
              {errors.name && <p style={{ color: "#EF4444", fontSize: "12px", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}><AlertCircle size={11} /> {errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label style={{ display: "block", color: "#94A3B8", fontSize: "13px", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Email
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={16} color="#94A3B8" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@company.com"
                  style={inputStyle(!!errors.email)}
                  onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#3B82F6"; }}
                  onBlur={(e) => { (e.target as HTMLElement).style.borderColor = errors.email ? "#EF4444" : "#1F2937"; }}
                />
              </div>
              {errors.email && <p style={{ color: "#EF4444", fontSize: "12px", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}><AlertCircle size={11} /> {errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label style={{ display: "block", color: "#94A3B8", fontSize: "13px", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={16} color="#94A3B8" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  style={{ ...inputStyle(!!errors.password), paddingRight: "44px" }}
                  onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#3B82F6"; }}
                  onBlur={(e) => { (e.target as HTMLElement).style.borderColor = errors.password ? "#EF4444" : "#1F2937"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: "4px" }}
                >
                  {showPassword ? <EyeOff size={16} color="#94A3B8" /> : <Eye size={16} color="#94A3B8" />}
                </button>
              </div>
              {errors.password && <p style={{ color: "#EF4444", fontSize: "12px", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}><AlertCircle size={11} /> {errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{ display: "block", color: "#94A3B8", fontSize: "13px", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Confirm Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={16} color="#94A3B8" style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  style={inputStyle(!!errors.confirmPassword)}
                  onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#3B82F6"; }}
                  onBlur={(e) => { (e.target as HTMLElement).style.borderColor = errors.confirmPassword ? "#EF4444" : "#1F2937"; }}
                />
              </div>
              {errors.confirmPassword && <p style={{ color: "#EF4444", fontSize: "12px", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}><AlertCircle size={11} /> {errors.confirmPassword}</p>}
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
                marginTop: "4px",
              }}
            >
              {loading ? "Creating account..." : <>Create Account <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", color: "#94A3B8", fontSize: "14px", marginTop: "24px" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#3B82F6", textDecoration: "none", fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
