"use client";

import { useState } from "react";

type TFunc = () => Promise<string>;

interface ContactFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  company: string;
  service: string;
  message: string;
}

type SubmitStatus = "idle" | "loading" | "success" | "error";

const SERVICE_OPTIONS = [
  "Web Application",
  "Mobile App",
  "AI / Machine Learning",
  "Branding & Design",
  "E-commerce",
  "Other",
];

export function ContactForm({ t }: ContactFormProps) {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    company: "",
    service: "",
    message: "",
  });
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          service: form.service || undefined,
          message: form.message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || t("formError"));
        setStatus("error");
        return;
      }

      setStatus("success");
      setForm({ name: "", email: "", phone: "", company: "", service: "", message: "" });
    } catch {
      setErrorMessage(t("formError"));
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div style={{
        background: "white",
        borderRadius: "1rem",
        padding: "3rem 2rem",
        textAlign: "center",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}>
        <div style={{
          width: "4rem",
          height: "4rem",
          background: "#d1fae5",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.25rem",
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#111827", marginBottom: "0.5rem" }}>
          {t("formSuccess")}
        </h2>
        <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
          {t("heroDesc")}
        </p>
        <button
          onClick={() => setStatus("idle")}
          style={{
            background: "#6366f1",
            color: "white",
            padding: "0.625rem 1.5rem",
            borderRadius: "0.5rem",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          Gửi thêm tin nhắn
        </button>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.625rem 0.875rem",
    border: "1px solid #d1d5db",
    borderRadius: "0.5rem",
    fontSize: "0.9375rem",
    outline: "none",
    transition: "border-color 0.15s",
    backgroundColor: "white",
    color: "#111827",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "0.375rem",
  };

  const requiredMark = <span style={{ color: "#ef4444", marginLeft: "2px" }}>*</span>;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      style={{
        background: "white",
        borderRadius: "1rem",
        padding: "2rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
        {/* Name */}
        <div>
          <label htmlFor="name" style={labelStyle}>
            {t("formName")}{requiredMark}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Nguyễn Văn A"
            value={form.name}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" style={labelStyle}>
            {t("formEmail")}{requiredMark}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="email@example.com"
            value={form.email}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
        {/* Phone */}
        <div>
          <label htmlFor="phone" style={labelStyle}>{t("formPhone")}</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+84..."
            value={form.phone}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        {/* Company */}
        <div>
          <label htmlFor="company" style={labelStyle}>{t("formCompany")}</label>
          <input
            id="company"
            name="company"
            type="text"
            autoComplete="organization"
            placeholder="Công ty ABC"
            value={form.company}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Service */}
      <div style={{ marginBottom: "1.25rem" }}>
        <label htmlFor="service" style={labelStyle}>Dịch vụ quan tâm</label>
        <select
          id="service"
          name="service"
          value={form.service}
          onChange={handleChange}
          style={{ ...inputStyle, cursor: "pointer" }}
        >
          <option value="">— Chọn dịch vụ —</option>
          {SERVICE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* Message */}
      <div style={{ marginBottom: "1.5rem" }}>
        <label htmlFor="message" style={labelStyle}>
          {t("formMessage")}{requiredMark}
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="Mô tả dự án của bạn..."
          value={form.message}
          onChange={handleChange}
          style={{ ...inputStyle, resize: "vertical", minHeight: "120px" }}
        />
      </div>

      {/* Error */}
      {status === "error" && (
        <div style={{
          background: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: "0.5rem",
          padding: "0.75rem 1rem",
          color: "#dc2626",
          fontSize: "0.875rem",
          marginBottom: "1rem",
        }}>
          {errorMessage}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={status === "loading"}
        style={{
          width: "100%",
          background: status === "loading" ? "#a5b4fc" : "#6366f1",
          color: "white",
          padding: "0.875rem 1.5rem",
          borderRadius: "0.5rem",
          fontWeight: 700,
          fontSize: "1rem",
          border: "none",
          cursor: status === "loading" ? "not-allowed" : "pointer",
          transition: "background 0.15s",
        }}
      >
        {status === "loading" ? t("formSending") : t("formSubmit")}
      </button>

      <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.75rem", textAlign: "center" }}>
        {t("required")}
      </p>
    </form>
  );
}
