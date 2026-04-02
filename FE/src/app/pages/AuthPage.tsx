import { useState } from 'react';
import { Link } from 'react-router';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, ArrowRight, Check, ChevronRight, Shield, Users, Zap } from 'lucide-react';
import { DS, GRD } from '../components/layout/ds';
import { useAuthStore } from '../store/authStore';
import { useI18n } from '../hooks/useI18n';

type AuthMode = 'login' | 'register' | 'otp' | 'onboarding';

// ── Input component ──────────────────────────────────────────────────────
function Input({ label, type = 'text', placeholder, value, onChange }: {
  label: string; type?: string; placeholder: string; value: string; onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="mb-4">
      <label style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono, letterSpacing: '0.12em', display: 'block', marginBottom: 6 }}>{label}</label>
      <div
        className="flex items-center gap-2 px-4 rounded-xl transition-all"
        style={{
          background: DS.bgCard2,
          border: `1px solid ${focused ? DS.blue : DS.border}`,
          boxShadow: focused ? `0 0 0 3px rgba(59,130,246,0.12)` : 'none',
          height: 44,
        }}
      >
        <input
          type={isPassword ? (show ? 'text' : 'password') : type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: DS.text, fontSize: 14, fontFamily: DS.body }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            style={{ color: DS.text4, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Background ────────────────────────────────────────────────────────────
function AuthBg() {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 30%, rgba(29,78,216,0.15) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(129,140,248,0.1) 0%, transparent 55%)' }} />
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.02 }}>
        <defs>
          <pattern id="hex-auth" width="40" height="46" patternUnits="userSpaceOnUse">
            <path d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z" fill="none" stroke="#3B82F6" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hex-auth)" />
      </svg>
    </div>
  );
}

// ── Login form ────────────────────────────────────────────────────────────
function LoginFormWithNav({ onSwitch, onSuccess }: { onSwitch: (m: AuthMode) => void; onSuccess: () => void }) {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
      <div className="text-center mb-8">
        <h1 style={{ fontFamily: DS.heading, fontSize: 26, fontWeight: 900, letterSpacing: '0.06em', background: GRD.primary, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 6 }}>
          {t('auth.login').toUpperCase()}
        </h1>
        <p style={{ color: DS.text3, fontSize: 13 }}>{t('auth.loginSubtitle')}</p>
      </div>
      <Input label={t('auth.email').toUpperCase()} type="email" placeholder="email@company.vn" value={email} onChange={setEmail} />
      <Input label={t('auth.password').toUpperCase()} type="password" placeholder="••••••••" value={pass} onChange={setPass} />
      <div className="flex justify-end mb-5">
        <button style={{ color: DS.blue, background: 'none', border: 'none', fontSize: 12, cursor: 'pointer' }}>{t('auth.forgotPassword')}</button>
      </div>
      <button
        onClick={onSuccess}
        style={{ width: '100%', background: GRD.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 20px rgba(129,140,248,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        {t('auth.login')} <ArrowRight size={16} />
      </button>
      <div className="flex items-center gap-3 my-5">
        <div style={{ flex: 1, height: 1, background: DS.border }} />
        <span style={{ color: DS.text5, fontSize: 12 }}>{t('common.or')}</span>
        <div style={{ flex: 1, height: 1, background: DS.border }} />
      </div>
      {/* Google */}
      <button style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 12, padding: '12px', fontSize: 13, color: DS.text2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>🔵</span> {t('auth.continueWithGoogle')}
      </button>
      <p className="text-center mt-6" style={{ color: DS.text4, fontSize: 13 }}>
        {t('auth.noAccount')}{' '}
        <button onClick={() => onSwitch('register')} style={{ color: DS.blue, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          {t('auth.registerCta')}
        </button>
      </p>
    </motion.div>
  );
}

// ── Register form ─────────────────────────────────────────────────────────
function RegisterForm({ onSwitch }: { onSwitch: (m: AuthMode) => void }) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [company, setCompany] = useState('');

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
      <div className="text-center mb-7">
        <h1 style={{ fontFamily: DS.heading, fontSize: 24, fontWeight: 900, letterSpacing: '0.06em', background: GRD.primary, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 6 }}>
          {t('auth.register').toUpperCase()}
        </h1>
        <p style={{ color: DS.text3, fontSize: 13 }}>
          {t('auth.registerSubtitle')}
        </p>
      </div>
      <Input label={t('auth.name').toUpperCase()} placeholder="Nguyễn Văn A" value={name} onChange={setName} />
      <Input label={t('auth.email').toUpperCase()} type="email" placeholder="email@company.vn" value={email} onChange={setEmail} />
      <Input label={t('auth.companyOptional').toUpperCase()} placeholder="Công ty TNHH..." value={company} onChange={setCompany} />
      <Input label={t('auth.password').toUpperCase()} type="password" placeholder="Tối thiểu 8 ký tự" value={pass} onChange={setPass} />
      {/* Password strength */}
      <div className="flex gap-1 mb-4">
        {[0,1,2,3].map(i => (
          <div key={i} className="flex-1 h-1 rounded-full" style={{ background: pass.length > i * 2 ? (i < 2 ? DS.amber : DS.green) : DS.border }} />
        ))}
      </div>
      <button
        onClick={() => onSwitch('otp')}
        style={{ width: '100%', background: GRD.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 20px rgba(129,140,248,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        {t('auth.submitRegister')} <ArrowRight size={16} />
      </button>
      <p style={{ color: DS.text5, fontSize: 11, textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
        {t('auth.termsAgree')}
      </p>
      <p className="text-center mt-4" style={{ color: DS.text4, fontSize: 13 }}>
        {t('auth.hasAccount')}{' '}
        <button onClick={() => onSwitch('login')} style={{ color: DS.blue, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          {t('auth.login')}
        </button>
      </p>
    </motion.div>
  );
}

// ── OTPForm with verify callback ──────────────────────────────────────────
function OTPFormWithNav({ onSwitch, onVerify }: { onSwitch: (m: AuthMode) => void; onVerify: () => void }) {
  const { t } = useI18n();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <div className="text-center mb-8">
        <div style={{ fontSize: 40, marginBottom: 12 }}>📱</div>
        <h2 style={{ fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: '0.06em', color: DS.text, marginBottom: 6 }}>{t('auth.otp.title').toUpperCase()}</h2>
        <p style={{ color: DS.text3, fontSize: 13 }}>{t('auth.otp.desc')}<br /><span style={{ color: DS.text2, fontWeight: 700 }}>user@example.com</span></p>
      </div>
      <div className="flex gap-3 justify-center mb-8">
        {otp.map((digit, i) => (
          <input
            key={i}
            type="text"
            maxLength={1}
            value={digit}
            onChange={e => {
              const v = e.target.value.slice(-1);
              const next = [...otp];
              next[i] = v;
              setOtp(next);
            }}
            style={{
              width: 44, height: 52, textAlign: 'center', fontSize: 20, fontFamily: DS.mono, fontWeight: 700,
              background: DS.bgCard2, border: `1.5px solid ${digit ? DS.blue : DS.border}`,
              borderRadius: 10, color: DS.blue, outline: 'none',
              boxShadow: digit ? `0 0 10px rgba(59,130,246,0.2)` : 'none',
              transition: 'all 0.2s',
            }}
          />
        ))}
      </div>
      <button
        onClick={onVerify}
        style={{ width: '100%', background: GRD.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 20px rgba(129,140,248,0.35)', marginBottom: 16 }}
      >
        {t('auth.otp.verify')}
      </button>
      <div className="text-center">
        <button style={{ color: DS.text4, background: 'none', border: 'none', fontSize: 13, cursor: 'pointer' }}>
          {t('auth.otp.resendHint')} <span style={{ color: DS.blue }}>{t('auth.otp.resend')}</span>
        </button>
      </div>
    </motion.div>
  );
}

// ── Onboarding ────────────────────────────────────────────────────────────
function OnboardingFlow({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const steps = [
    {
      title: t('auth.onboarding.step1Title'),
      desc: t('auth.onboarding.step1Desc'),
      fields: [t('auth.onboarding.field1'), t('auth.onboarding.field2'), t('auth.onboarding.field3')],
    },
    {
      title: t('auth.onboarding.step2Title'),
      desc: t('auth.onboarding.step2Desc'),
      options: ['Website', 'Mobile App', 'SaaS Platform', 'SEO & Marketing', 'Data Analytics'],
    },
    {
      title: t('auth.onboarding.step3Title'),
      desc: t('auth.onboarding.step3Desc'),
    },
    {
      title: t('auth.onboarding.step4Title'),
      desc: t('auth.onboarding.step4Desc'),
    },
  ];

  const current = steps[step];

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
      {/* Step indicator */}
      <div className="flex gap-2 mb-8 justify-center">
        {steps.map((_, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{ width: i === step ? 32 : 10, background: i <= step ? DS.blue : DS.border }}
          />
        ))}
      </div>

      <div className="text-center mb-7">
        {step === 3 && <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>}
        <h2 style={{ fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: '0.04em', color: DS.text, marginBottom: 6 }}>{current.title}</h2>
        <p style={{ color: DS.text3, fontSize: 13 }}>{current.desc}</p>
      </div>

      {step === 0 && (
        <div className="space-y-3 mb-6">
          {current.fields!.map(f => (
            <div key={f} className="px-4 py-3 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
              <select style={{ background: 'none', border: 'none', outline: 'none', color: DS.text3, fontSize: 13, width: '100%', fontFamily: DS.body, cursor: 'pointer' }}>
                <option>{f}</option>
              </select>
            </div>
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="grid grid-cols-2 gap-2 mb-6">
          {current.options!.map((opt, i) => (
            <button
              key={opt}
              className="py-3 px-4 rounded-xl text-left transition-all"
              style={{ background: i === 0 ? 'rgba(59,130,246,0.12)' : DS.bgCard2, border: i === 0 ? '1px solid rgba(59,130,246,0.4)' : `1px solid ${DS.border}`, color: i === 0 ? DS.blue : DS.text3, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {i === 0 && <Check size={12} style={{ color: DS.blue }} />}
              {opt}
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="mb-6 p-5 rounded-2xl text-center" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
          <div style={{ color: DS.blue, fontFamily: DS.heading, fontSize: 32, fontWeight: 900, textShadow: '0 0 16px rgba(59,130,246,0.5)', marginBottom: 4 }}>500 LP</div>
          <div style={{ color: DS.text3, fontSize: 13 }}>{t('auth.onboarding.lpRewardReady')}</div>
          <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginTop: 8 }}>IRON Rank · Level 1 · 0 XP</div>
        </div>
      )}

      {step === 3 && (
        <div className="mb-6 space-y-3">
          {[t('auth.onboarding.done1'), t('auth.onboarding.done2'), t('auth.onboarding.done3')].map(item => (
            <div key={item} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: DS.bgCard2, border: '1px solid rgba(34,197,94,0.2)' }}>
              <Check size={14} style={{ color: DS.green, flexShrink: 0 }} />
              <span style={{ color: DS.text2, fontSize: 13 }}>{item}</span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => step < steps.length - 1 ? setStep(step + 1) : onDone()}
        style={{ width: '100%', background: GRD.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 0 20px rgba(129,140,248,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        {step < steps.length - 1 ? t('common.next') : t('auth.onboarding.goDashboard')} <ArrowRight size={16} />
      </button>

      {step < steps.length - 1 && (
        <button
          onClick={() => setStep(step + 1)}
          style={{ width: '100%', background: 'none', border: 'none', color: DS.text4, fontSize: 13, cursor: 'pointer', marginTop: 10 }}
        >
          {t('common.skip')}
        </button>
      )}
    </motion.div>
  );
}

// ── Side panel info ───────────────────────────────────────────────────────
function SidePanel() {
  const { t } = useI18n();
  const ranks = [
    { label: 'IRON', color: '#9CA3AF', symbol: '⬡' },
    { label: 'GOLD', color: '#FFD700', symbol: '★' },
    { label: 'DIAMOND', color: '#818CF8', symbol: '✦' },
  ];
  return (
    <div className="hidden lg:flex flex-col justify-between h-full p-10" style={{ background: 'linear-gradient(135deg, rgba(29,78,216,0.2) 0%, rgba(129,140,248,0.12) 100%)', borderRight: `1px solid rgba(59,130,246,0.15)` }}>
      {/* Logo */}
      <div>
        <Link to="/" className="flex items-center gap-2.5 no-underline mb-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: GRD.primary }}>
            <span style={{ color: '#fff', fontSize: 18, fontWeight: 900 }}>∞</span>
          </div>
          <div>
            <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: 15, fontWeight: 900, letterSpacing: '0.1em' }}>LOOP SOLUTIONS</div>
            <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.2em' }}>DIGITAL AGENCY OS</div>
          </div>
        </Link>
        <h2 style={{ fontFamily: DS.heading, fontSize: 28, fontWeight: 900, color: DS.text, lineHeight: 1.3, marginBottom: 16, letterSpacing: '0.04em' }}>
          {t('auth.sidePanel.title').split('\n').map((line, i) => (
            <span key={i}>{line}<br /></span>
          ))}
        </h2>
        <p style={{ color: DS.text3, fontSize: 14, lineHeight: 1.8, marginBottom: 28 }}>
          {t('auth.sidePanel.desc')}
        </p>
        {/* Rank badges */}
        <div className="flex flex-col gap-3">
          {ranks.map((r) => (
            <div key={r.label} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(15,23,42,0.5)', border: `1px solid ${r.color}30` }}>
              <span style={{ color: r.color, fontSize: 18, textShadow: `0 0 10px ${r.color}60` }}>{r.symbol}</span>
              <div>
                <div style={{ color: r.color, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>{r.label}</div>
                <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{t('auth.sidePanel.rankTier')}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LP info */}
      <div className="px-4 py-4 rounded-2xl" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(59,130,246,0.2)' }}>
        <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 6 }}>{t('auth.sidePanel.welcomeNewMember').toUpperCase()}</div>
        <div style={{ color: DS.blue, fontFamily: DS.heading, fontSize: 24, fontWeight: 900, textShadow: '0 0 12px rgba(59,130,246,0.5)' }}>500 LP</div>
        <div style={{ color: DS.text3, fontSize: 12 }}>{t('auth.sidePanel.welcomeReward')}</div>
      </div>
    </div>
  );
}

// ── Main Auth Page ────────────────────────────────────────────────────────
export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [selectedRole, setSelectedRole] = useState<string>('client');
  const { login, isLoading } = useAuthStore();
  const nav = useNavigate();
  const { t } = useI18n();

  const handleLoginSuccess = (role: string) => {
    login(role);
    setTimeout(() => {
      if (role === 'admin') nav('/admin');
      else if (role === 'client') nav('/khach-hang');
      else nav('/nhan-vien');
    }, 900);
  };

  // ── Demo role shortcuts ──
  const DEMO_ROLES = [
    { key: 'admin', label: 'Admin', desc: 'Full access', color: '#818CF8', icon: '✦' },
    { key: 'manager_media', label: 'Manager', desc: 'Media dept', color: '#EF4444', icon: '◈' },
    { key: 'staff', label: 'Staff', desc: 'Engineer', color: '#94A3B8', icon: '▲' },
    { key: 'client', label: 'Client', desc: 'Portal KH', color: '#F59E0B', icon: '★' },
  ];

  return (
    <div style={{ background: DS.bg, minHeight: '100vh', display: 'flex', position: 'relative', fontFamily: DS.body }}>
      <AuthBg />
      <div className="flex w-full" style={{ position: 'relative', zIndex: 1 }}>
        {/* Left panel */}
        <div className="hidden lg:flex lg:w-1/2 flex-col">
          <SidePanel />
        </div>

        {/* Right: form */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            {/* Demo role switcher */}
            {mode === 'login' && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 rounded-2xl"
                style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(129,140,248,0.2)', backdropFilter: 'blur(12px)' }}>
                <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.2em', marginBottom: 10 }}>
                  ⚡ {t('auth.demoRole.header')}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {DEMO_ROLES.map(r => (
                    <button key={r.key} onClick={() => setSelectedRole(r.key)}
                      style={{
                        padding: '8px 6px', borderRadius: 10,
                        border: `1px solid ${selectedRole === r.key ? r.color : DS.border}`,
                        background: selectedRole === r.key ? `${r.color}15` : 'rgba(0,0,0,0)',
                        cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                      }}>
                      <div style={{ color: r.color, fontSize: 14, marginBottom: 2 }}>{r.icon}</div>
                      <div style={{ color: selectedRole === r.key ? r.color : DS.text4, fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>{r.label}</div>
                      <div style={{ color: DS.text5, fontSize: 9 }}>{r.desc}</div>
                    </button>
                  ))}
                </div>
                <motion.button onClick={() => handleLoginSuccess(selectedRole)}
                  className="w-full mt-3 py-2.5 rounded-xl flex items-center justify-center gap-2"
                  style={{ background: GRD.primary, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, boxShadow: '0 0 16px rgba(129,140,248,0.35)' }}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  {isLoading ? `⏳ ${t('auth.demoRole.loggingIn')}` : <><Zap size={13} /> {t('auth.demoRole.loginNow')}</>}
                </motion.button>
              </motion.div>
            )}

            <div className="rounded-3xl p-8"
              style={{
                background: 'rgba(15,23,42,0.8)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(59,130,246,0.15)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
              }}>
              <AnimatePresence mode="wait">
                {mode === 'login' && (
                  <LoginFormWithNav key="login" onSwitch={setMode} onSuccess={() => setMode('otp')} />
                )}
                {mode === 'register' && <RegisterForm key="register" onSwitch={setMode} />}
                {mode === 'otp' && (
                  <OTPFormWithNav key="otp" onSwitch={setMode} onVerify={() => handleLoginSuccess(selectedRole)} />
                )}
                {mode === 'onboarding' && <OnboardingFlow key="onboarding" onDone={() => handleLoginSuccess('client')} />}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}