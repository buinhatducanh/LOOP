import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { Eye, EyeOff, Zap, UserPlus, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const result = await register(form.name, form.email, form.password);
    setLoading(false);
    if (!result.success) {
      setError(result.message);
    } else {
      setSuccess("Account created! Redirecting...");
      setTimeout(() => navigate("/admin"), 800);
    }
  };

  const inputStyle: React.CSSProperties = {
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
      <div style={{ position: "absolute", top: "15%", right: "10%", width: "400px", height: "400px", background: "radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 70%)", borderRadius: "50%" }} />
      <div style={{ position: "absolute", bottom: "15%", left: "10%", width: "400px", height: "400px", background: "radial-gradient(ellipse, rgba(59,130,246,0.1) 0%, transparent 70%)", borderRadius: "50%" }} />

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
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px", justifyContent: "center" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "linear-gradient(135deg, #3B82F6, #6366F1)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(99,102,241,0.4)" }}>
            <Zap size={20} color="#fff" />
          </div>
          <span style={{ color: "#FFFFFF", fontSize: "22px", fontWeight: 700 }}>
            Nexa<span style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Web</span>
          </span>
        </div>

        <h1 style={{ color: "#FFFFFF", fontSize: "26px", fontWeight: 800, textAlign: "center", marginBottom: "8px", letterSpacing: "-0.5px" }}>
          Create Account
        </h1>
        <p style={{ color: "#94A3B8", fontSize: "14px", textAlign: "center", marginBottom: "32px" }}>
          Join NexaWeb and start managing your projects
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
          {[
            { key: "name", label: "Full Name", type: "text", placeholder: "John Doe" },
            { key: "email", label: "Email Address", type: "email", placeholder: "you@example.com" },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key} style={{ marginBottom: "20px" }}>
              <label style={{ color: "#94A3B8", fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "8px" }}>{label}</label>
              <input
                type={type}
                required
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                style={inputStyle}
                onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#3B82F6"; }}
                onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "#1F2937"; }}
              />
            </div>
          ))}

          <div style={{ marginBottom: "20px" }}>
            <label style={{ color: "#94A3B8", fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "8px" }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="At least 6 characters"
                style={{ ...inputStyle, paddingRight: "48px" }}
                onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#3B82F6"; }}
                onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "#1F2937"; }}
              />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94A3B8", display: "flex", padding: 0 }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: "28px" }}>
            <label style={{ color: "#94A3B8", fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "8px" }}>Confirm Password</label>
            <input
              type={showPw ? "text" : "password"}
              required
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              placeholder="Repeat your password"
              style={inputStyle}
              onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#3B82F6"; }}
              onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "#1F2937"; }}
            />
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
                Creating account...
              </span>
            ) : (
              <><UserPlus size={16} /> Create Account</>
            )}
          </button>
        </form>

        <div style={{ marginTop: "24px", textAlign: "center" }}>
          <p style={{ color: "#94A3B8", fontSize: "13px" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#3B82F6", fontWeight: 600, textDecoration: "none" }}>
              Sign in
            </Link>
          </p>
        </div>
        <div style={{ marginTop: "16px", textAlign: "center" }}>
          <Link to="/" style={{ color: "#4B5563", fontSize: "13px", textDecoration: "none" }}>
            ← Back to Website
          </Link>
        </div>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
