import { useState } from "react";
import { Send, CheckCircle, AlertCircle } from "lucide-react";
import { services } from "../data/mockData";

interface ContactFormProps {
  preselectedService?: string;
  compact?: boolean;
}

export function ContactForm({ preselectedService = "", compact = false }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service: preselectedService,
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email address";
    if (!formData.message.trim()) newErrors.message = "Message is required";
    else if (formData.message.trim().length < 20) newErrors.message = "Message must be at least 20 characters";
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
    setStatus("loading");
    // Simulate API call
    setTimeout(() => {
      setStatus("success");
      setFormData({ name: "", email: "", phone: "", service: "", message: "" });
    }, 1800);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: "100%",
    background: "#020617",
    border: `1px solid ${hasError ? "#EF4444" : "#1F2937"}`,
    borderRadius: "10px",
    padding: "13px 16px",
    color: "#FFFFFF",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  });

  const labelStyle: React.CSSProperties = {
    display: "block",
    color: "#94A3B8",
    fontSize: "13px",
    fontWeight: 600,
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  if (status === "success") {
    return (
      <div style={{
        background: "#0F172A",
        border: "1px solid #1F2937",
        borderRadius: "16px",
        padding: "48px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
      }}>
        <div style={{ width: "72px", height: "72px", background: "rgba(34,197,94,0.1)", border: "2px solid rgba(34,197,94,0.3)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CheckCircle size={36} color="#22C55E" />
        </div>
        <h3 style={{ color: "#FFFFFF", fontSize: "22px", fontWeight: 700 }}>Message Sent Successfully!</h3>
        <p style={{ color: "#94A3B8", maxWidth: "380px", lineHeight: "1.6" }}>
          Thank you for reaching out! Our team will review your inquiry and get back to you within 24 hours.
        </p>
        <button
          onClick={() => setStatus("idle")}
          style={{
            background: "linear-gradient(135deg, #3B82F6, #6366F1)",
            color: "#fff",
            border: "none",
            padding: "12px 28px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            marginTop: "8px",
          }}
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: compact ? "16px" : "20px" }}>
      {/* Name & Email Row */}
      <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "1fr 1fr", gap: "16px" }}>
        <div>
          <label style={labelStyle}>Full Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Mitchell"
            style={inputStyle(!!errors.name)}
            onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#3B82F6"; }}
            onBlur={(e) => { (e.target as HTMLElement).style.borderColor = errors.name ? "#EF4444" : "#1F2937"; }}
          />
          {errors.name && <p style={{ color: "#EF4444", fontSize: "12px", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}><AlertCircle size={11} /> {errors.name}</p>}
        </div>
        <div>
          <label style={labelStyle}>Email Address *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john@company.com"
            style={inputStyle(!!errors.email)}
            onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#3B82F6"; }}
            onBlur={(e) => { (e.target as HTMLElement).style.borderColor = errors.email ? "#EF4444" : "#1F2937"; }}
          />
          {errors.email && <p style={{ color: "#EF4444", fontSize: "12px", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}><AlertCircle size={11} /> {errors.email}</p>}
        </div>
      </div>

      {/* Phone & Service Row */}
      <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "1fr 1fr", gap: "16px" }}>
        <div>
          <label style={labelStyle}>Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+1 (555) 000-0000"
            style={inputStyle(false)}
            onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#3B82F6"; }}
            onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "#1F2937"; }}
          />
        </div>
        <div>
          <label style={labelStyle}>Service Interested In</label>
          <select
            name="service"
            value={formData.service}
            onChange={handleChange}
            style={{ ...inputStyle(false), cursor: "pointer" }}
            onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#3B82F6"; }}
            onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "#1F2937"; }}
          >
            <option value="" style={{ background: "#0F172A" }}>Select a service...</option>
            {services.map((s) => (
              <option key={s.id} value={s.id} style={{ background: "#0F172A" }}>{s.title}</option>
            ))}
            <option value="other" style={{ background: "#0F172A" }}>Other / Not Sure Yet</option>
          </select>
        </div>
      </div>

      {/* Message */}
      <div>
        <label style={labelStyle}>Your Message *</label>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Tell us about your project, goals, timeline, and budget..."
          rows={compact ? 4 : 6}
          style={{ ...inputStyle(!!errors.message), resize: "vertical", fontFamily: "inherit" }}
          onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#3B82F6"; }}
          onBlur={(e) => { (e.target as HTMLElement).style.borderColor = errors.message ? "#EF4444" : "#1F2937"; }}
        />
        {errors.message && <p style={{ color: "#EF4444", fontSize: "12px", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}><AlertCircle size={11} /> {errors.message}</p>}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={status === "loading"}
        style={{
          background: status === "loading" ? "#1F2937" : "linear-gradient(135deg, #3B82F6, #6366F1)",
          color: "#FFFFFF",
          border: "none",
          padding: "15px 32px",
          borderRadius: "10px",
          fontSize: "15px",
          fontWeight: 700,
          cursor: status === "loading" ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          transition: "all 0.2s",
          boxShadow: status === "loading" ? "none" : "0 0 30px rgba(99, 102, 241, 0.4)",
        }}
        onMouseEnter={(e) => {
          if (status !== "loading") {
            (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px rgba(99, 102, 241, 0.6)";
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 0 30px rgba(99, 102, 241, 0.4)";
        }}
      >
        {status === "loading" ? (
          <>
            <div style={{ width: "18px", height: "18px", border: "2px solid #94A3B8", borderTop: "2px solid #FFFFFF", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            Sending...
          </>
        ) : (
          <>
            <Send size={16} />
            Send Message
          </>
        )}
      </button>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  );
}
