import { createBrowserRouter, Navigate, useLocation } from "react-router";
import { PublicLayout } from "./layouts/PublicLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { Home } from "./pages/Home";
import { Services } from "./pages/Services";
import { ServiceDetail } from "./pages/ServiceDetail";
import { Portfolio } from "./pages/Portfolio";
import { ProjectDetail } from "./pages/ProjectDetail";
import { Pricing } from "./pages/Pricing";
import { About } from "./pages/About";
import { Contact } from "./pages/Contact";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/admin/Dashboard";
import { Projects } from "./pages/admin/Projects";
import { AdminServices } from "./pages/admin/AdminServices";
import { Customers } from "./pages/admin/Customers";
import { Messages } from "./pages/admin/Messages";
import { Settings } from "./pages/admin/Settings";
import { Accounts } from "./pages/admin/Accounts";
import { useAuth } from "./contexts/AuthContext";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}

function ProtectedAdminLayout() {
  return (
    <RequireAuth>
      <AdminLayout />
    </RequireAuth>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: PublicLayout,
    children: [
      { index: true, Component: Home },
      { path: "services", Component: Services },
      { path: "services/:id", Component: ServiceDetail },
      { path: "portfolio", Component: Portfolio },
      { path: "portfolio/:id", Component: ProjectDetail },
      { path: "pricing", Component: Pricing },
      { path: "about", Component: About },
      { path: "contact", Component: Contact },
    ],
  },
  { path: "/login", Component: Login },
  { path: "/register", Component: Register },
  {
    path: "/admin",
    Component: ProtectedAdminLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "projects", Component: Projects },
      { path: "services", Component: AdminServices },
      { path: "customers", Component: Customers },
      { path: "messages", Component: Messages },
      { path: "settings", Component: Settings },
      { path: "accounts", Component: Accounts },
    ],
  },
]);
