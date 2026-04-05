"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DS, GRD } from "@/lib/design-tokens";
import { Mail, Phone, MapPin, Send, Check, Clock } from "lucide-react";

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
                <motion.form key="form" onSubmit={submitForm} className="rounded-3xl p-8" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
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
                        <option value="Dashboard / Analytics">Dashboard / Analytics</option>
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
                <motion.div key="ok" className="rounded-3xl p-8 text-center" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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

          <aside className="lg:col-span-2 rounded-3xl p-7" style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, height: "fit-content" }}>
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.18em", marginBottom: 20 }}>── THÔNG TIN LIÊN HỆ</div>
            <div style={{ display: "grid", gap: 14 }}>
              {[{ icon: <Mail size={14} />, label: "Email", val: "ducanhnhatbui@gmail.com" }, { icon: <Phone size={14} />, label: "Hotline", val: "+84 37 844 3602" }, { icon: <MapPin size={14} />, label: "Địa chỉ", val: "Cái Răng, Cần Thơ" }, { icon: <Clock size={14} />, label: "Giờ làm việc", val: "T2–T6 · 09:00–18:00" }].map((it) => (
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
