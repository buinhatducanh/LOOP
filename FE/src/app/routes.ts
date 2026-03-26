import { createBrowserRouter } from "react-router";
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

export const router = createBrowserRouter([
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

  // ── Auth (no Navbar/Footer) ────────────────────────────────────────────
  { path: "/dang-nhap",    Component: AuthPage },
  { path: "/dang-ky",      Component: AuthPage },
  { path: "/onboarding",   Component: OnboardingPage },

  // ── Dashboards (their own layout) ─────────────────────────────────────
  { path: "/admin",        Component: AdminDashboard },
  { path: "/khach-hang",   Component: CustomerDashboard },
  { path: "/nhan-vien",    Component: StaffPortal },

  // ── Team / Member pages ───────────────────────────────────────────────
  { path: "/member/:id",   Component: MemberDetailPage },
]);