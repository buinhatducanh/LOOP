import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Phone, MapPin, Send, Check, ChevronDown, Clock } from 'lucide-react';
import { DS, GRD } from '../components/layout/ds';
import { useI18n } from '../hooks/useI18n';

export default function ContactPage() {
  const { t } = useI18n();
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState('');
  const [budget, setBudget] = useState('');
  const [msg, setMsg] = useState('');

  const inputStyle = {
    width: '100%',
    background: DS.bgCard2,
    border: `1px solid ${DS.border}`,
    borderRadius: 10,
    padding: '11px 14px',
    color: DS.text,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
    fontFamily: DS.body,
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    color: DS.text3,
    fontSize: 11,
    fontFamily: DS.mono,
    letterSpacing: '0.12em',
    display: 'block' as const,
    marginBottom: 6,
  };

  return (
    <div style={{ background: DS.bg, fontFamily: DS.body, paddingTop: 64 }}>
      {/* Header */}
      <section className="py-16 px-6 text-center" style={{ background: 'linear-gradient(180deg, rgba(20,184,166,0.06) 0%, transparent 100%)' }}>
        <div className="max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full" style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.25)' }}>
            <span style={{ color: DS.cyan, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.22em' }}>LIÊN HỆ & TƯ VẤN</span>
          </div>
          <h1 style={{ fontFamily: DS.heading, fontSize: 38, fontWeight: 900, letterSpacing: '0.06em', background: 'linear-gradient(135deg, #FFFFFF, #94A3B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 12 }}>
            {t('contact.title')}
          </h1>
          <p style={{ color: DS.text3, fontSize: 15, lineHeight: 1.8 }}>{t('contact.subtitle')}</p>
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Form */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.div
                  key="form"
                  className="rounded-3xl p-8"
                  style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em', marginBottom: 24 }}>── FORM LIÊN HỆ</div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label style={labelStyle}>{t('contact.name')} *</label>
                      <input style={inputStyle} placeholder="Nguyễn Văn A" value={name} onChange={e => setName(e.target.value)}
                        onFocus={e => { e.target.style.borderColor = DS.cyan; }}
                        onBlur={e => { e.target.style.borderColor = DS.border; }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>{t('contact.email')}</label>
                      <input style={inputStyle} type="email" placeholder="email@company.vn" value={email} onChange={e => setEmail(e.target.value)}
                        onFocus={e => { e.target.style.borderColor = DS.cyan; }}
                        onBlur={e => { e.target.style.borderColor = DS.border; }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label style={labelStyle}>{t('contact.phone')}</label>
                      <input style={inputStyle} placeholder="+84 901 234 567" value={phone} onChange={e => setPhone(e.target.value)}
                        onFocus={e => { e.target.style.borderColor = DS.cyan; }}
                        onBlur={e => { e.target.style.borderColor = DS.border; }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>{t('contact.service')}</label>
                      <select
                        value={service}
                        onChange={e => setService(e.target.value)}
                        style={{ ...inputStyle, cursor: 'pointer' }}
                        onFocus={e => { e.target.style.borderColor = DS.cyan; }}
                        onBlur={e => { e.target.style.borderColor = DS.border; }}
                      >
                        <option value="">-- Chọn dịch vụ --</option>
                        <option>{t('contact.serviceOptions.webDesign')}</option>
                        <option>{t('contact.serviceOptions.appDev')}</option>
                        <option>SaaS Platform</option>
                        <option>SEO & Marketing</option>
                        <option>{t('contact.serviceOptions.other')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label style={labelStyle}>{t('contact.budget')}</label>
                    <select
                      value={budget}
                      onChange={e => setBudget(e.target.value)}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                      onFocus={e => { e.target.style.borderColor = DS.cyan; }}
                      onBlur={e => { e.target.style.borderColor = DS.border; }}
                    >
                      <option value="">-- Chọn ngân sách --</option>
                      <option>{t('contact.budgetOptions.under50')}</option>
                      <option>{t('contact.budgetOptions.50to100')}</option>
                      <option>{t('contact.budgetOptions.100to500')}</option>
                      <option>{t('contact.budgetOptions.over500')}</option>
                      <option>{t('contact.budgetOptions.discuss')}</option>
                    </select>
                  </div>

                  <div className="mb-6">
                    <label style={labelStyle}>{t('contact.message')} *</label>
                    <textarea
                      rows={4}
                      placeholder={t('contact.messagePlaceholder')}
                      value={msg}
                      onChange={e => setMsg(e.target.value)}
                      style={{ ...inputStyle, resize: 'vertical', fontFamily: DS.body }}
                      onFocus={e => { e.target.style.borderColor = DS.cyan; }}
                      onBlur={e => { e.target.style.borderColor = DS.border; }}
                    />
                  </div>

                  {/* Upload (visual only) */}
                  <div
                    className="mb-6 p-4 rounded-xl text-center"
                    style={{ background: DS.bgCard2, border: `2px dashed ${DS.border}`, cursor: 'pointer' }}
                  >
                    <div style={{ color: DS.text4, fontSize: 13 }}>📎 {t('contact.fileUpload')}</div>
                    <div style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, marginTop: 4 }}>PDF, PNG, DOC · Max 10MB</div>
                  </div>

                  <button
                    onClick={() => setSubmitted(true)}
                    style={{ width: '100%', background: GRD.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 24px rgba(20,184,166,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    <Send size={16} /> {t('contact.sendMessage')}
                  </button>
                  <div style={{ color: DS.text5, fontSize: 11, textAlign: 'center', marginTop: 12, fontFamily: DS.mono }}>
                    Phản hồi trong vòng 2 giờ làm việc · Miễn phí hoàn toàn
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  className="rounded-3xl p-12 text-center"
                  style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(20,184,166,0.08))', border: '1.5px solid rgba(34,197,94,0.3)' }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <motion.div
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ background: 'rgba(34,197,94,0.15)', border: `2px solid ${DS.green}` }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                  >
                    <Check size={36} style={{ color: DS.green }} />
                  </motion.div>
                  <h2 style={{ fontFamily: DS.heading, fontSize: 24, fontWeight: 900, color: DS.text, letterSpacing: '0.06em', marginBottom: 10 }}>{t('contact.successTitle')}</h2>
                  <p style={{ color: DS.text3, fontSize: 14, lineHeight: 1.8, marginBottom: 20 }}>
                    {t('contact.successDesc')}
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)' }}>
                    <span style={{ color: DS.blue, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>{t('contact.lpBonus')}</span>
                    <span style={{ color: DS.text3, fontSize: 13 }}>{t('contact.lpBonusDesc')}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Info card */}
          <div className="lg:col-span-2 space-y-5">
            {/* Company info */}
            <div className="rounded-3xl p-6" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
              <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em', marginBottom: 20 }}>── THÔNG TIN LIÊN HỆ</div>
              <div className="space-y-5">
                {[
                  { icon: <Mail size={18} />, label: t('contact.info.email'), val: 'hello@loopsolutions.vn', sub: 'Phản hồi trong 2h' },
                  { icon: <Phone size={18} />, label: t('contact.info.phone'), val: '+84 (0) 901 234 567', sub: 'T2–T6 · 8:00–18:00' },
                  { icon: <MapPin size={18} />, label: t('contact.info.address'), val: 'Tầng 12, Tòa nhà Landmark 81', sub: 'TP. Hồ Chí Minh, VN' },
                  { icon: <Clock size={18} />, label: t('contact.info.hours'), val: 'Thứ 2 – Thứ 6', sub: '08:00 – 18:00 ICT' },
                ].map(item => (
                  <div key={item.label} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)' }}>
                      <span style={{ color: DS.cyan }}>{item.icon}</span>
                    </div>
                    <div>
                      <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.1em' }}>{item.label.toUpperCase()}</div>
                      <div style={{ color: DS.text, fontSize: 13, fontWeight: 600, marginTop: 2 }}>{item.val}</div>
                      <div style={{ color: DS.text4, fontSize: 11, marginTop: 1 }}>{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Map placeholder */}
            <div className="rounded-3xl overflow-hidden relative" style={{ height: 220, background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(20,184,166,0.05), rgba(59,130,246,0.05))' }}>
                <div className="text-center">
                  <MapPin size={32} style={{ color: DS.cyan, margin: '0 auto 8px' }} />
                  <div style={{ color: DS.text3, fontSize: 13 }}>Landmark 81, Q.Bình Thạnh</div>
                  <div style={{ color: DS.text4, fontSize: 11 }}>TP. Hồ Chí Minh</div>
                  <button style={{ marginTop: 12, color: DS.cyan, background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.3)', borderRadius: 8, padding: '6px 14px', fontSize: 11, fontFamily: DS.mono, cursor: 'pointer' }}>
                    XEM TRÊN GOOGLE MAPS →
                  </button>
                </div>
              </div>
            </div>

            {/* LP bonus card */}
            <div className="rounded-3xl p-5" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(129,140,248,0.08))', border: '1px solid rgba(59,130,246,0.25)' }}>
              <div style={{ color: DS.blue, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.2em', marginBottom: 8 }}>◈ ƯU ĐÃI LIÊN HỆ HÔM NAY</div>
              <div className="flex items-center gap-3">
                <div style={{ color: DS.blue, fontFamily: DS.heading, fontSize: 28, fontWeight: 900, textShadow: '0 0 12px rgba(59,130,246,0.5)' }}>+500 LP</div>
                <div style={{ color: DS.text3, fontSize: 12, lineHeight: 1.6 }}>{t('contact.lpBonusDesc')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
