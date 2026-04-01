import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { preloadMessages, useLocaleStore } from '@/i18n';
import { loadLocaleFont, injectFontClasses } from '@/i18n/fonts';
import { useAuthStore } from '@/store/authStore';
import { LandingPage } from '@/pages/LandingPage';

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/dich-vu', element: <div className="p-20 text-center"><h1 className="text-3xl font-bold">Dịch vụ</h1></div> },
      { path: '/du-an', element: <div className="p-20 text-center"><h1 className="text-3xl font-bold">Dự án</h1></div> },
      { path: '/doi-ngu', element: <div className="p-20 text-center"><h1 className="text-3xl font-bold">Đội ngũ</h1></div> },
      { path: '/hoc-vien', element: <div className="p-20 text-center"><h1 className="text-3xl font-bold">Học viện</h1></div> },
      { path: '/blog', element: <div className="p-20 text-center"><h1 className="text-3xl font-bold">Blog</h1></div> },
      { path: '/lien-he', element: <div className="p-20 text-center"><h1 className="text-3xl font-bold">Liên hệ</h1></div> },
      { path: '/dang-nhap', element: <div className="p-20 text-center"><h1 className="text-3xl font-bold">Đăng nhập</h1></div> },
    ],
  },
]);

export default function App() {
  const [ready, setReady] = useState(false);
  const locale = useLocaleStore((s) => s.locale);

  useEffect(() => {
    async function init() {
      await preloadMessages(['vi', 'en']);
      await loadLocaleFont(locale);
      injectFontClasses(locale);
      await useAuthStore.getState().checkAuth();
      setReady(true);
    }
    init();
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <RouterProvider router={router} />;
}
