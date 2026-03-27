import { useState, useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import OnboardingPage from './pages/OnboardingPage';

const ONBOARDING_KEY = 'loop_onboarding_completed';

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) setShowOnboarding(true);
    setReady(true);
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  if (!ready) return null;

  return (
    <>
      <RouterProvider router={router} />
      {showOnboarding && <OnboardingPage onComplete={completeOnboarding} />}
    </>
  );
}
