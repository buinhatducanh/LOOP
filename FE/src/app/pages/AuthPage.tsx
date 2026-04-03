import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, ArrowRight, Check, Shield, Users, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DS, GRD } from '../components/layout/ds';
import { useAuthStore, DEMO_USERS } from '../store/authStore';
import { useI18n } from '../hooks/useI18n';

type AuthMode = 'login' | 'register' | 'otp' | 'onboarding';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

// ── Shared error / success banner ─────────────────────────────────────────
function FormAlert({ message, type }: { message: string; type: 'error' | 'success' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
        border: `1px solid ${type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
        borderRadius: 10, padding: '10px 14px', marginBottom: 16,
      }}
    >
      {type === 'error' ? <AlertCircle size={15} style={{ color: '#EF4444', flexShrink: 0 }} /> : <CheckCircle2 size={15} style={{ color: '#22C55E', flexShrink: 0 }} />}
      <span style={{ color: type === 'error' ? '#FCA5A5' : '#86EFAC', fontSize: 13 }}>{message}</span>
    </motion.div>
  );
}

// ── Input component ─────────────────────────────────────────────────────────
function Input({ label, type = 'text', placeholder, value, onChange, autoComplete }: {
  label: string; type?: string; placeholder: string; value: string; onChange: (v: string) => void; autoComplete?: string;
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
          autoComplete={autoComplete}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: DS.text, fontSize: 14, fontFamily: DS.body }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(!show)} style={{ color: DS.text4, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Background ──────────────────────────────────────────────────────────────
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

// ── Login form ──────────────────────────────────────────────────────────────
function LoginFormWithNav({ onSwitch }: { onSwitch: (m: AuthMode) => void }) {
  const { t } = useI18n();
  const { login, loginWithGoogle, isLoading } = useAuthStore();
  const nav = useNavigate();

  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [rememberMe, setRememberMe] = useState(
    typeof localStorage !== 'undefined' && !!localStorage.getItem('loop_auth_remember')
  );
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email.trim() || !pass) { setError(t('auth.errorRequired')); return; }
    setError('');
    try {
      await login(email, pass, rememberMe);
      nav(getRedirectPath(useAuthStore.getState().user?.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.errorGeneric'));
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
      <div className="text-center mb-8">
        <h1 style={{ fontFamily: DS.heading, fontSize: 26, fontWeight: 900, letterSpacing: '0.06em', background: GRD.primary, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 6 }}>
          {t('auth.login').toUpperCase()}
        </h1>
        <p style={{ color: DS.text3, fontSize: 13 }}>{t('auth.loginSubtitle')}</p>
      </div>

      {error && <FormAlert message={error} type="error" />}

      <Input label={t('auth.email').toUpperCase()} type="email" placeholder="email@company.vn" value={email} onChange={setEmail} autoComplete="email" />
      <Input label={t('auth.password').toUpperCase()} type="password" placeholder="••••••••" value={pass} onChange={setPass} autoComplete="current-password" />

      <div className="flex items-center justify-between mb-5">
        <label className="flex items-center gap-2 cursor-pointer" style={{ userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={e => setRememberMe(e.target.checked)}
            style={{ width: 15, height: 15, accentColor: DS.blue, cursor: 'pointer' }}
          />
          <span style={{ color: DS.text4, fontSize: 12 }}>{t('auth.rememberMe')}</span>
        </label>
        <button style={{ color: DS.blue, background: 'none', border: 'none', fontSize: 12, cursor: 'pointer' }}>{t('auth.forgotPassword')}</button>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading}
        style={{ width: '100%', background: GRD.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 0 20px rgba(129,140,248,0.35)' }}
      >
        {isLoading
          ? t('auth.loggingIn')
          : <>{t('auth.login')} <ArrowRight size={16} /></>
        }
      </button>

      <div className="flex items-center gap-3 my-5">
        <div style={{ flex: 1, height: 1, background: DS.border }} />
        <span style={{ color: DS.text5, fontSize: 12 }}>{t('common.or')}</span>
        <div style={{ flex: 1, height: 1, background: DS.border }} />
      </div>

      {/* Google sign-in */}
      <button
        onClick={loginWithGoogle}
        style={{ width: '100%', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '12px', fontSize: 14, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontWeight: 600 }}
      >
        <GoogleIcon />
        {t('auth.continueWithGoogle')}
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

// ── Register form ──────────────────────────────────────────────────────────
function RegisterForm({ onSwitch }: { onSwitch: (m: AuthMode) => void }) {
  const { t } = useI18n();
  const { register, isLoading } = useAuthStore();
  const nav = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !pass) { setError(t('auth.errorRequired')); return; }
    if (pass.length < 8) { setError(t('auth.errorPasswordLength')); return; }
    setError(''); setSuccess('');
    try {
      await register({ name, email, password: pass, company });
      setSuccess(t('auth.registerSuccess'));
      setTimeout(() => {
        nav('/khach-hang');
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.errorGeneric'));
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
      <div className="text-center mb-7">
        <h1 style={{ fontFamily: DS.heading, fontSize: 24, fontWeight: 900, letterSpacing: '0.06em', background: GRD.primary, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 6 }}>
          {t('auth.register').toUpperCase()}
        </h1>
        <p style={{ color: DS.text3, fontSize: 13 }}>{t('auth.registerSubtitle')}</p>
      </div>

      {error && <FormAlert message={error} type="error" />}
      {success && <FormAlert message={success} type="success" />}

      <Input label={t('auth.name').toUpperCase()} placeholder="Nguyễn Văn A" value={name} onChange={setName} autoComplete="name" />
      <Input label={t('auth.email').toUpperCase()} type="email" placeholder="email@company.vn" value={email} onChange={setEmail} autoComplete="email" />
      <Input label={t('auth.companyOptional').toUpperCase()} placeholder="Công ty TNHH..." value={company} onChange={setCompany} autoComplete="organization" />
      <Input label={t('auth.password').toUpperCase()} type="password" placeholder="Tối thiểu 8 ký tự" value={pass} onChange={setPass} autoComplete="new-password" />

      {/* Password strength */}
      <div className="flex gap-1 mb-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="flex-1 h-1 rounded-full"
            style={{ background: pass.length > i * 2 ? (i < 2 ? DS.amber : DS.green) : DS.border, transition: 'background 0.3s' }}
          />
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading}
        style={{ width: '100%', background: GRD.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 0 20px rgba(129,140,248,0.35)' }}
      >
        {isLoading ? t('auth.registering') : <>{t('auth.submitRegister')} <ArrowRight size={16} /></>}
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

// ── OTP form ───────────────────────────────────────────────────────────────
function OTPFormWithNav({ onSwitch }: { onSwitch: (m: AuthMode) => void }) {
  const { t } = useI18n();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');

  // Auto-advance focus
  const handleChange = (i: number, v: string) => {
    const next = [...otp];
    next[i] = v.slice(-1);
    setOtp(next);
    if (v && i < 5) {
      const nextInput = document.getElementById(`otp-${i + 1}`);
      nextInput?.focus();
    }
    if (next.every(d => d !== '')) {
      // All filled — auto-submit (OTP verification not yet implemented on BE)
      setError(t('auth.otpNotImplemented'));
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <div className="text-center mb-8">
        <div style={{ fontSize: 40, marginBottom: 12 }}>📱</div>
        <h2 style={{ fontFamily: DS.heading, fontSize: 22, fontWeight: 900, letterSpacing: '0.06em', color: DS.text, marginBottom: 6 }}>{t('auth.otp.title').toUpperCase()}</h2>
        <p style={{ color: DS.text3, fontSize: 13 }}>{t('auth.otp.desc')}<br /><span style={{ color: DS.text2, fontWeight: 700 }}>user@example.com</span></p>
      </div>

      {error && <FormAlert message={error} type="error" />}

      <div className="flex gap-3 justify-center mb-8">
        {otp.map((digit, i) => (
          <input
            key={i}
            id={`otp-${i}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(i, e.target.value)}
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
        onClick={() => setError(t('auth.otpNotImplemented'))}
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

// ── Onboarding ──────────────────────────────────────────────────────────────
function OnboardingFlow({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const steps = [
    { title: t('auth.onboarding.step1Title'), desc: t('auth.onboarding.step1Desc'), fields: [t('auth.onboarding.field1'), t('auth.onboarding.field2'), t('auth.onboarding.field3')] },
    { title: t('auth.onboarding.step2Title'), desc: t('auth.onboarding.step2Desc'), options: ['Website', 'Mobile App', 'SaaS Platform', 'SEO & Marketing', 'Data Analytics'] },
    { title: t('auth.onboarding.step3Title'), desc: t('auth.onboarding.step3Desc') },
    { title: t('auth.onboarding.step4Title'), desc: t('auth.onboarding.step4Desc') },
  ];
  const current = steps[step];

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
      <div className="flex gap-2 mb-8 justify-center">
        {steps.map((_, i) => (
          <div key={i} className="h-1.5 rounded-full transition-all duration-300"
            style={{ width: i === step ? 32 : 10, background: i <= step ? DS.blue : DS.border }} />
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
            <button key={opt} className="py-3 px-4 rounded-xl text-left transition-all"
              style={{ background: i === 0 ? 'rgba(59,130,246,0.12)' : DS.bgCard2, border: i === 0 ? '1px solid rgba(59,130,246,0.4)' : `1px solid ${DS.border}`, color: i === 0 ? DS.blue : DS.text3, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
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
        <button onClick={() => setStep(step + 1)} style={{ width: '100%', background: 'none', border: 'none', color: DS.text4, fontSize: 13, cursor: 'pointer', marginTop: 10 }}>
          {t('common.skip')}
        </button>
      )}
    </motion.div>
  );
}

// ── Side panel ───────────────────────────────────────────────────────────────
function SidePanel() {
  const { t } = useI18n();
  const ranks = [
    { label: 'IRON', color: '#9CA3AF', symbol: '⬡' },
    { label: 'GOLD', color: '#FFD700', symbol: '★' },
    { label: 'DIAMOND', color: '#818CF8', symbol: '✦' },
  ];
  return (
    <div className="hidden lg:flex flex-col justify-between h-full p-10" style={{ background: 'linear-gradient(135deg, rgba(29,78,216,0.2) 0%, rgba(129,140,248,0.12) 100%)', borderRight: `1px solid rgba(59,130,246,0.15)` }}>
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
          {t('auth.sidePanel.title').split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}
        </h2>
        <p style={{ color: DS.text3, fontSize: 14, lineHeight: 1.8, marginBottom: 28 }}>{t('auth.sidePanel.desc')}</p>
        <div className="flex flex-col gap-3">
          {ranks.map(r => (
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
      <div className="px-4 py-4 rounded-2xl" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(59,130,246,0.2)' }}>
        <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 6 }}>{t('auth.sidePanel.welcomeNewMember').toUpperCase()}</div>
        <div style={{ color: DS.blue, fontFamily: DS.heading, fontSize: 24, fontWeight: 900, textShadow: '0 0 12px rgba(59,130,246,0.5)' }}>500 LP</div>
        <div style={{ color: DS.text3, fontSize: 12 }}>{t('auth.sidePanel.welcomeReward')}</div>
      </div>
    </div>
  );
}

function getRedirectPath(role?: string): string {
  if (role === 'admin') return '/admin';
  if (role === 'client') return '/khach-hang';
  return '/nhan-vien';
}

// ── Main Auth Page ──────────────────────────────────────────────────────────
export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [selectedRole, setSelectedRole] = useState('client');
  const { loginAs, isLoading } = useAuthStore();
  const nav = useNavigate();
  const { t } = useI18n();

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
        <div className="hidden lg:flex lg:w-1/2 flex-col">
          <SidePanel />
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            {/* Demo role switcher — dev only */}
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
                <button onClick={() => { loginAs(DEMO_USERS[selectedRole]); setTimeout(() => nav(getRedirectPath(DEMO_USERS[selectedRole].role)), 900); }}
                  className="w-full mt-3 py-2.5 rounded-xl flex items-center justify-center gap-2"
                  style={{ background: GRD.primary, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, boxShadow: '0 0 16px rgba(129,140,248,0.35)' }}>
                  {isLoading ? `⏳ ${t('auth.demoRole.loggingIn')}` : <><Zap size={13} /> {t('auth.demoRole.loginNow')}</>}
                </button>
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
                  <LoginFormWithNav key="login" onSwitch={setMode} />
                )}
                {mode === 'register' && <RegisterForm key="register" onSwitch={setMode} />}
                {mode === 'otp' && (
                  <OTPFormWithNav key="otp" onSwitch={setMode} />
                )}
                {mode === 'onboarding' && <OnboardingFlow key="onboarding" onDone={() => { loginAs(DEMO_USERS.client); nav('/khach-hang'); }} />}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
