import { useState, useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes.tsx';
import OnboardingPage from './pages/OnboardingPage';
import { useAuthStore } from './store/authStore';

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

  return (
    <>
      <RouterProvider router={router} />
      {showOnboarding && <OnboardingPage onComplete={completeOnboarding} />}
    </>
  );
}
