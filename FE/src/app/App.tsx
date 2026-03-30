import { useState, useEffect, Suspense, lazy } from 'react';
import { RouterProvider } from 'react-router';
import { DS } from './components/layout/ds';
import { router } from './routes.tsx';
import { useAuthStore } from './store/authStore';
import { useLocaleStore } from './store/localeStore';
import { I18nProvider } from '../i18n/sync';

const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));

const ONBOARDING_KEY = 'loop_onboarding_completed';

// ── App loading screen ─────────────────────────────────────────────────────────
function AppLoader() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#020617',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16, zIndex: 99999,
    }}>
      <div style={{ fontFamily: 'Cinzel, serif', fontSize: 24, color: '#818CF8', letterSpacing: '0.1em' }}>
        LOOP
      </div>
      <div style={{
        width: 120, height: 2, borderRadius: 1,
        background: 'linear-gradient(90deg, transparent, #818CF8, transparent)',
        animation: 'loaderSlide 1.2s ease-in-out infinite',
      }} />
      <style>{`
        @keyframes loaderSlide {
          0% { transform: translateX(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function RouteChunkLoader() {
  return (
    <div style={{
      minHeight: '100vh',
      background: DS.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ fontFamily: 'Cinzel, serif', fontSize: 22, color: DS.purple, letterSpacing: '0.08em' }}>
        LOOP
      </div>
      <div style={{ color: DS.text4, fontSize: 12 }}>Đang tải trang...</div>
    </div>
  );
}

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [ready, setReady] = useState(false);
  const initAuth = useAuthStore(s => s.initAuth);

  useEffect(() => {
    // Init auth session + onboarding check in parallel
    Promise.all([
      initAuth(),
      new Promise<void>(resolve => {
        const done = localStorage.getItem(ONBOARDING_KEY);
        if (!done) setShowOnboarding(true);
        resolve();
      }),
    ]).finally(() => setReady(true));
  }, [initAuth]);

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  if (!ready) return <AppLoader />;

  const { locale } = useLocaleStore();

  return (
    <I18nProvider locale={locale}>
      <Suspense fallback={<RouteChunkLoader />}>
        <RouterProvider router={router} />
      </Suspense>
      {showOnboarding && (
        <Suspense fallback={<RouteChunkLoader />}>
          <OnboardingPage onComplete={completeOnboarding} />
        </Suspense>
      )}
    </I18nProvider>
  );
}
