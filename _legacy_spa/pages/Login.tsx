import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { Eye, EyeOff, Zap, LogIn, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const from = (location.state as { from?: string })?.from || "/admin";

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(form.email, form.password);
    setLoading(false);
    if (!result.success) {
      setError(result.message);
    } else {
      setSuccess(result.message);
      setTimeout(() => navigate(from), 800);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glows */}
      <div style={{ position: "absolute", top: "20%", left: "10%", width: "400px", height: "400px", background: "radial-gradient(ellipse, rgba(59,130,246,0.1) 0%, transparent 70%)", borderRadius: "50%" }} />
      <div style={{ position: "absolute", bottom: "20%", right: "10%", width: "400px", height: "400px", background: "radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 70%)", borderRadius: "50%" }} />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          background: "#0F172A",
          border: "1px solid #1F2937",
          borderRadius: "24px",
          padding: "48px 40px",
          width: "100%",
          maxWidth: "440px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px", justifyContent: "center" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "linear-gradient(135deg, #3B82F6, #6366F1)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(99,102,241,0.4)" }}>
            <Zap size={20} color="#fff" />
          </div>
          <span style={{ color: "#FFFFFF", fontSize: "22px", fontWeight: 700 }}>
            Nexa<span style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Web</span>
          </span>
        </div>

        <h1 style={{ color: "#FFFFFF", fontSize: "26px", fontWeight: 800, textAlign: "center", marginBottom: "8px", letterSpacing: "-0.5px" }}>
          Welcome Back
        </h1>
        <p style={{ color: "#94A3B8", fontSize: "14px", textAlign: "center", marginBottom: "32px" }}>
          Sign in to access your dashboard
        </p>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}
          >
            <AlertCircle size={16} color="#EF4444" />
            <span style={{ color: "#EF4444", fontSize: "13px" }}>{error}</span>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "10px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}
          >
            <CheckCircle size={16} color="#22C55E" />
            <span style={{ color: "#22C55E", fontSize: "13px" }}>{success}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ color: "#94A3B8", fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "8px" }}>Email Address</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="admin@nexaweb.io"
              style={{
                width: "100%",
                background: "#020617",
                border: "1px solid #1F2937",
                borderRadius: "10px",
                padding: "12px 16px",
                color: "#FFFFFF",
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#3B82F6"; }}
              onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "#1F2937"; }}
            />
          </div>

          <div style={{ marginBottom: "28px" }}>
            <label style={{ color: "#94A3B8", fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "8px" }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  background: "#020617",
                  border: "1px solid #1F2937",
                  borderRadius: "10px",
                  padding: "12px 48px 12px 16px",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  outline: "none",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#3B82F6"; }}
                onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "#1F2937"; }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", display: "flex", padding: 0 }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
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
              transition: "all 0.2s",
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "16px", height: "16px", border: "2px solid #4B5563", borderTopColor: "#3B82F6", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                Signing in...
              </span>
            ) : (
              <>
                <LogIn size={16} /> Sign In
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: "24px", textAlign: "center" }}>
          <p style={{ color: "#94A3B8", fontSize: "13px" }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color: "#3B82F6", fontWeight: 600, textDecoration: "none" }}>
              Create one
            </Link>
          </p>
        </div>

        <div style={{ marginTop: "16px", borderTop: "1px solid #1F2937", paddingTop: "16px" }}>
          <p style={{ color: "#4B5563", fontSize: "12px", textAlign: "center" }}>Demo credentials:</p>
          <p style={{ color: "#6B7280", fontSize: "12px", textAlign: "center" }}>admin@nexaweb.io / admin123</p>
        </div>

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <Link to="/" style={{ color: "#4B5563", fontSize: "13px", textDecoration: "none" }}>
            ← Back to Website
          </Link>
        </div>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
