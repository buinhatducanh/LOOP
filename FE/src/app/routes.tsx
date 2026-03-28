import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { useEffect, type ReactNode } from "react";
import PublicLayout from "./components/layout/PublicLayout";
import Home from "./Home";
import MemberDetailPage from "./MemberDetailPage";
import LandingPage from "./pages/LandingPage";
import ServicesPage from "./pages/ServicesPage";
import PortfolioPage from "./pages/PortfolioPage";
import ContactPage from "./pages/ContactPage";
import BlogPage from "./pages/BlogPage";
import AcademyPage from "./pages/AcademyPage";
import AuthPage from "./pages/AuthPage";
import AdminDashboard from "./pages/AdminDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import StaffPortal from "./pages/StaffPortal";
import BookingWizardPage from "./pages/BookingWizardPage";
import MediaBookingPage from "./pages/MediaBookingPage";
import ServiceDetailPage from "./pages/ServiceDetailPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import BlogDetailPage from "./pages/BlogDetailPage";
import OnboardingPage from "./pages/OnboardingPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import CompanyProcessPage from "./pages/CompanyProcessPage";
import { useAuthStore } from "./store/authStore";
import { DS } from "./components/layout/ds";

// ── Auth guard: wraps protected routes, redirects to /dang-nhap if not authed ──
function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const isInitialized = useAuthStore(s => s.isInitialized);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      window.location.href = '/dang-nhap';
    }
  }, [isInitialized, isAuthenticated]);

  if (!isInitialized) return <AuthLoader />;
  if (!isAuthenticated) return null; // will redirect

  return <>{children}</>;
}

// ── Loading screen for auth check ─────────────────────────────────────────────
function AuthLoader() {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: DS.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16, zIndex: 99999,
    }}>
      <div style={{ fontFamily: 'Cinzel, serif', fontSize: 24, color: '#818CF8', letterSpacing: '0.1em' }}>
        LOOP
      </div>
      <div style={{
        width: 120, height: 2, borderRadius: 1,
        background: 'linear-gradient(90deg, transparent, #818CF8, transparent)',
        animation: 'authLoaderSlide 1.2s ease-in-out infinite',
      }} />
      <style>{`
        @keyframes authLoaderSlide {
          0% { transform: translateX(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ── Redirect authed users away from login ────────────────────────────────────
function GuestRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const isInitialized = useAuthStore(s => s.isInitialized);

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      // Already logged in — go to admin by default
      window.location.href = '/admin';
    }
  }, [isInitialized, isAuthenticated]);

  if (!isInitialized) return <AuthLoader />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  // ── Auth routes (guest only — redirect if already logged in) ────────────
  {
    path: "/dang-nhap",
    Component: () => (
      <GuestRoute>
        <AuthPage />
      </GuestRoute>
    ),
  },
  { path: "/dang-ky", Component: AuthPage },
  { path: "/onboarding", Component: OnboardingPage },

  // ── Public pages with Navbar + Footer ─────────────────────────────────
  {
    Component: PublicLayout,
    children: [
      { path: "/",                    Component: LandingPage },
      { path: "/dich-vu",             Component: ServicesPage },
      { path: "/dich-vu/:id",         Component: ServiceDetailPage },
      { path: "/du-an",               Component: PortfolioPage },
      { path: "/du-an/:id",           Component: ProjectDetailPage },
      { path: "/lien-he",             Component: ContactPage },
      { path: "/blog",                Component: BlogPage },
      { path: "/blog/:id",            Component: BlogDetailPage },
      { path: "/hoc-vien",            Component: AcademyPage },
      { path: "/hoc-vien/:id",        Component: CourseDetailPage },
      { path: "/bao-gia",             Component: ServicesPage },
      { path: "/dat-lich",            Component: BookingWizardPage },
      { path: "/media",               Component: MediaBookingPage },
      { path: "/doi-ngu",             Component: Home },
      { path: "/bang-xep-hang",       Component: LeaderboardPage },
      { path: "/quy-trinh",           Component: CompanyProcessPage },
    ],
  },

  // ── Protected dashboard routes ──────────────────────────────────────────
  {
    path: "/admin",
    Component: () => (
      <ProtectedRoute>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/khach-hang",
    Component: () => (
      <ProtectedRoute>
        <CustomerDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/nhan-vien",
    Component: () => (
      <ProtectedRoute>
        <StaffPortal />
      </ProtectedRoute>
    ),
  },

  // ── Team / Member pages ───────────────────────────────────────────────
  { path: "/member/:id",   Component: MemberDetailPage },
]);