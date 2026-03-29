import { createBrowserRouter, redirect, type LoaderFunctionArgs } from "react-router";
import { lazy, useEffect, type ReactNode } from "react";
import PublicLayout from "./components/layout/PublicLayout";
import LocaleGuard from "./components/layout/LocaleGuard";
import { useAuthStore } from "./store/authStore";
import { DS } from "./components/layout/ds";

const Home = lazy(() => import("./Home"));
const MemberDetailPage = lazy(() => import("./MemberDetailPage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const PortfolioPage = lazy(() => import("./pages/PortfolioPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const AcademyPage = lazy(() => import("./pages/AcademyPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const CustomerDashboard = lazy(() => import("./pages/CustomerDashboard"));
const StaffPortal = lazy(() => import("./pages/StaffPortal"));
const BookingWizardPage = lazy(() => import("./pages/BookingWizardPage"));
const MediaBookingPage = lazy(() => import("./pages/MediaBookingPage"));
const ServiceDetailPage = lazy(() => import("./pages/ServiceDetailPage"));
const ProjectDetailPage = lazy(() => import("./pages/ProjectDetailPage"));
const CourseDetailPage = lazy(() => import("./pages/CourseDetailPage"));
const BlogDetailPage = lazy(() => import("./pages/BlogDetailPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const CompanyProcessPage = lazy(() => import("./pages/CompanyProcessPage"));

// ── Loading UI for auth guards ─────────────────────────────────────────
function AuthLoader() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: DS.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily: DS.heading,
          fontSize: 24,
          color: DS.purple,
          letterSpacing: "0.1em",
        }}
      >
        LOOP
      </div>
    </div>
  );
}

// ── Legacy path redirect helpers ────────────────────────────────────────
const SUPPORTED_LOCALES = ['vi', 'en', 'ja', 'ko', 'zh'];

function normalizeLocale(locale: string | null | undefined): string {
  if (locale && SUPPORTED_LOCALES.includes(locale)) return locale;
  return 'vi';
}

// Catch-all for any unmapped legacy paths
// Preserves query string from the incoming request
function legacyCatchAll({ params, request }: LoaderFunctionArgs) {
  const stored =
    typeof window !== 'undefined' ? localStorage.getItem('loop_locale') : null;
  const locale = normalizeLocale(stored);
  const rest = params['*'] ?? '';
  const url = new URL(request.url);
  const qs = url.search; // e.g. "?utm_source=foo"
  return Response.redirect(
    `/${locale}${rest ? '/' + rest : ''}${qs}`,
    302
  );
}

// ── Auth guards ─────────────────────────────────────────────────────────
function ProtectedRoute({
  children,
  fallbackRedirect,
}: {
  children: ReactNode;
  fallbackRedirect?: string;
}) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const role = useAuthStore((s) => s.user?.role);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      window.location.href = "/dang-nhap";
    }
    if (isInitialized && isAuthenticated && fallbackRedirect && role === "client") {
      window.location.href = fallbackRedirect;
    }
  }, [isInitialized, isAuthenticated, role, fallbackRedirect]);

  if (!isInitialized) return <AuthLoader />;
  if (!isAuthenticated) return null;

  return <>{children}</>;
}

function GuestRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      window.location.href = "/admin";
    }
  }, [isInitialized, isAuthenticated]);

  if (!isInitialized) return <AuthLoader />;
  return <>{children}</>;
}

// ── Router ──────────────────────────────────────────────────────────────
export const router = createBrowserRouter([
  // root: fallback redirect to vi
  {
    path: "/",
    loader: () => redirect("/vi"),
  },

  // auth routes (no locale prefix)
  {
    path: "/dang-nhap",
    Component: () => (
      <GuestRoute>
        <AuthPage />
      </GuestRoute>
    ),
  },
  { path: "/dang-ky", Component: AuthPage },

  // protected dashboard routes (no locale prefix)
  {
    path: "/admin",
    Component: () => (
      <ProtectedRoute fallbackRedirect="/khach-hang">
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
      <ProtectedRoute fallbackRedirect="/khach-hang">
        <StaffPortal />
      </ProtectedRoute>
    ),
  },

  // legacy redirect routes — catches all non-locale-prefixed public paths
  // placed here so /:locale catches locale-prefixed paths; protected routes above
  // this block are matched first (admin, dang-nhap, khach-hang, nhan-vien).
  // Any legacy path: /dich-vu → /{locale}/dich-vu, /du-an/foo → /{locale}/du-an/foo
  { path: "*", loader: legacyCatchAll },

  // locale-prefixed public routes
  {
    path: "/:locale",
    Component: LocaleGuard,
    children: [
      {
        Component: PublicLayout,
        children: [
          { path: "", Component: LandingPage },
          { path: "dich-vu", Component: ServicesPage },
          { path: "dich-vu/:id", Component: ServiceDetailPage },
          { path: "du-an", Component: PortfolioPage },
          { path: "du-an/:id", Component: ProjectDetailPage },
          { path: "lien-he", Component: ContactPage },
          { path: "blog", Component: BlogPage },
          { path: "blog/:id", Component: BlogDetailPage },
          { path: "hoc-vien", Component: AcademyPage },
          { path: "hoc-vien/:id", Component: CourseDetailPage },
          { path: "bao-gia", Component: ServicesPage },
          { path: "dat-lich", Component: BookingWizardPage },
          { path: "media", Component: MediaBookingPage },
          { path: "doi-ngu", Component: Home },
          { path: "bang-xep-hang", Component: LeaderboardPage },
          { path: "quy-trinh", Component: CompanyProcessPage },
        ],
      },
      { path: "member/:id", Component: MemberDetailPage },
    ],
  },
]);
