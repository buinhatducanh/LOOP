"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CEO_CONTACT } from "@/lib/constants";
import { DS, GRD } from "@/lib/design-tokens";
import { Mail, Phone, MapPin, Send, Check, Clock, MessageCircle } from "lucide-react";

export function ContactClient({ locale: _locale }: { locale: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("");
  const [budget, setBudget] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, service, budget, message: msg }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "submit failed");
      setSubmitted(true);
      setName("");
      setEmail("");
      setPhone("");
      setService("");
      setBudget("");
      setMsg("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: DS.bgCard2,
    border: `1px solid ${DS.border}`,
    borderRadius: 10,
    padding: "11px 14px",
    color: DS.text,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: DS.body,
  };

  const labelStyle: React.CSSProperties = {
    color: DS.text3,
    fontSize: 11,
    fontFamily: DS.mono,
    letterSpacing: "0.12em",
    display: "block",
    marginBottom: 6,
  };

  return (
    <main style={{ background: DS.bg, minHeight: "100vh" }}>
      <section className="py-16 px-6 text-center" style={{ background: "linear-gradient(180deg, rgba(20,184,166,0.06) 0%, transparent 100%)" }}>
        <div className="max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full" style={{ background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.25)" }}>
            <span style={{ color: DS.cyan, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.22em" }}>LIÊN HỆ & TƯ VẤN</span>
          </div>
          <h1 style={{ fontFamily: DS.heading, fontSize: 38, fontWeight: 900, letterSpacing: "0.06em", background: "linear-gradient(135deg, #FFFFFF, #94A3B8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 12 }}>
            HÃY NÓI CHUYỆN
          </h1>
          <p style={{ color: DS.text3, fontSize: 15, lineHeight: 1.8 }}>Tư vấn miễn phí 30 phút. Nhận ngay 500 LP khi đặt lịch hôm nay.</p>
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.form key="form" onSubmit={submitForm} className="rounded-3xl p-4 sm:p-8" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                  <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.18em", marginBottom: 24 }}>── FORM LIÊN HỆ</div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div><label style={labelStyle}>HỌ TÊN *</label><input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required /></div>
                    <div><label style={labelStyle}>EMAIL *</label><input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div><label style={labelStyle}>ĐIỆN THOẠI</label><input style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
                    <div>
                      <label style={labelStyle}>DỊCH VỤ QUAN TÂM</label>
                      <select style={inputStyle} value={service} onChange={(e) => setService(e.target.value)}>
                        <option value="">Chọn dịch vụ</option>
                        <option value="Web Development">Web Development</option>
                        <option value="Mobile App">Mobile App</option>
                        <option value="Phần mềm hỗ trợ kỹ thuật">Phần mềm hỗ trợ kỹ thuật</option>
                        <option value="SEO / Marketing">SEO / Marketing</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label style={labelStyle}>NGÂN SÁCH</label>
                    <select style={inputStyle} value={budget} onChange={(e) => setBudget(e.target.value)}>
                      <option value="">Chọn ngân sách</option>
                      <option value="<10m">Dưới 10 triệu</option>
                      <option value="10-30m">10 - 30 triệu</option>
                      <option value="30-100m">30 - 100 triệu</option>
                      <option value=">100m">Trên 100 triệu</option>
                    </select>
                  </div>

                  <div className="mb-5">
                    <label style={labelStyle}>NỘI DUNG *</label>
                    <textarea style={{ ...inputStyle, minHeight: 130, resize: "vertical" }} value={msg} onChange={(e) => setMsg(e.target.value)} required />
                  </div>

                  {error && <div style={{ color: DS.red, fontSize: 12, marginBottom: 12 }}>{error}</div>}

                  <button type="submit" disabled={loading} style={{ width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, background: GRD.primary, color: "#fff", border: "none", borderRadius: 12, padding: "12px 16px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                    <Send size={16} />
                    {loading ? "Đang gửi..." : "GỬI THÔNG TIN"}
                  </button>
                </motion.form>
              ) : (
                <motion.div key="ok" className="rounded-3xl p-4 sm:p-8 text-center" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(34,197,94,0.15)", display: "grid", placeItems: "center", margin: "0 auto 14px", border: "1px solid rgba(34,197,94,0.3)" }}>
                    <Check size={26} style={{ color: DS.green }} />
                  </div>
                  <h3 style={{ color: DS.text, fontSize: 22, marginBottom: 8 }}>Gửi thành công!</h3>
                  <p style={{ color: DS.text3, marginBottom: 16 }}>Chúng tôi sẽ phản hồi trong vòng 24 giờ làm việc.</p>
                  <button onClick={() => setSubmitted(false)} style={{ background: "transparent", border: `1px solid ${DS.border}`, color: DS.text3, borderRadius: 10, padding: "10px 14px", cursor: "pointer" }}>Gửi thêm</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <aside className="lg:col-span-2 rounded-3xl p-4 sm:p-7" style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, height: "fit-content" }}>
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.18em", marginBottom: 20 }}>── THÔNG TIN LIÊN HỆ</div>

            {/* Quick-contact CTA buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
              {/* Primary: Call button */}
              <motion.a
                href={`tel:${CEO_CONTACT.phone}`}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 24 }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                  width: "100%", padding: "14px 16px", borderRadius: 14,
                  background: "linear-gradient(135deg, #EC4899 0%, #6B3DF5 100%)",
                  border: "none",
                  boxShadow: `0 4px 20px rgba(236,72,153,0.45), 0 0 0 1px rgba(236,72,153,0.3), inset 0 1px 0 rgba(255,255,255,0.15)`,
                  textDecoration: "none",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Shimmer overlay */}
                <motion.div
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
                  style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
                    pointerEvents: "none",
                  }}
                />
                <Phone size={20} style={{ color: "#fff", flexShrink: 0, filter: "drop-shadow(0 0 6px rgba(255,255,255,0.4))" }} />
                <div>
                  <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.14em", marginBottom: 1 }}>GỌI NGAY</div>
                  <div style={{ color: "#fff", fontSize: 17, fontWeight: 800, letterSpacing: "0.04em" }}>{CEO_CONTACT.phoneDisplay}</div>
                </div>
                {/* Animated dots */}
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    position: "absolute", right: 16, width: 8, height: 8, borderRadius: "50%",
                    background: "#fff",
                    boxShadow: "0 0 8px rgba(255,255,255,0.8)",
                  }}
                />
              </motion.a>

              {/* Secondary: Zalo + Facebook row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {/* Zalo */}
                <motion.a
                  href={CEO_CONTACT.zaloUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Liên hệ qua Zalo"
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 400, damping: 24 }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    padding: "10px 12px", borderRadius: 12,
                    background: "linear-gradient(135deg, #0068FF 0%, #0047CC 100%)",
                    boxShadow: "0 3px 14px rgba(0,104,255,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
                    textDecoration: "none",
                  }}
                >
                  <svg width={16} height={16} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M70.58 55.27C71.36 51.84 72 48.49 72 44.52C72 31.12 63.45 20.5 50.06 20.5C46.35 20.5 42.76 21.32 39.59 22.84L28 14.5 37.19 24.88C33.24 26.72 30.16 29.73 28.11 33.63L19.38 27.19 26.88 41.21C26.88 41.21 22.81 55.27 10.12 55.27C5.46 55.27 1 59.11 1 64.08C1 69.05 5.46 73.58 10.12 73.58C16.15 73.58 25.27 70.66 27.58 65.08C31.04 74.38 40.65 79.58 50.65 79.58C63.45 79.58 72 67.89 72 55.27H70.58Z" fill="white"/>
                    <path d="M50.96 50.52C52.73 50.52 54.19 49.05 54.19 47.27C54.19 45.49 52.73 44.02 50.96 44.02C49.19 44.02 47.73 45.49 47.73 47.27C47.73 49.05 49.19 50.52 50.96 50.52Z" fill="#0068FF"/>
                    <path d="M55.38 50.52C57.15 50.52 58.61 49.05 58.61 47.27C58.61 45.49 57.15 44.02 55.38 44.02C53.61 44.02 52.15 45.49 52.15 47.27C52.15 49.05 53.61 50.52 55.38 50.52Z" fill="#0068FF"/>
                    <path d="M59.8 50.52C61.57 50.52 63.03 49.05 63.03 47.27C63.03 45.49 61.57 44.02 59.8 44.02C58.03 44.02 56.57 45.49 56.57 47.27C56.57 49.05 58.03 50.52 59.8 50.52Z" fill="#0068FF"/>
                  </svg>
                  <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>Zalo</span>
                </motion.a>

                {/* Facebook */}
                <motion.a
                  href={CEO_CONTACT.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Kết nối qua Facebook"
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 400, damping: 24 }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    padding: "10px 12px", borderRadius: 12,
                    background: "linear-gradient(135deg, #1877F2 0%, #0D5FC4 100%)",
                    boxShadow: "0 3px 14px rgba(24,119,242,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
                    textDecoration: "none",
                  }}
                >
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
                  </svg>
                  <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>Facebook</span>
                </motion.a>
              </div>

              {/* Chat hint */}
              <motion.a
                href={`https://m.me/${CEO_CONTACT.facebookUrl.split("/").pop()}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Nhắn tin Messenger"
                whileHover={{ opacity: 0.85 }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "8px 12px", borderRadius: 10,
                  background: "rgba(107,61,245,0.08)",
                  border: "1px solid rgba(107,61,245,0.2)",
                  textDecoration: "none",
                }}
              >
                <MessageCircle size={14} style={{ color: DS.cosmicPurple }} />
                <span style={{ color: DS.cosmicPurple, fontSize: 12, fontWeight: 600 }}>Hoặc nhắn Messenger trực tiếp</span>
              </motion.a>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              {[{ icon: <Mail size={14} />, label: "Email", val: "ducanhnhatbui@gmail.com" }, { icon: <MapPin size={14} />, label: "Địa chỉ", val: "Cái Răng, Cần Thơ" }, { icon: <Clock size={14} />, label: "Giờ làm việc", val: "T2–T6 · 09:00–18:00" }].map((it) => (
                <div key={it.label} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)", display: "grid", placeItems: "center", color: DS.blue }}>{it.icon}</div>
                  <div>
                    <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{it.label.toUpperCase()}</div>
                    <div style={{ color: DS.text2, fontSize: 14 }}>{it.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
