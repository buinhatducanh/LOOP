import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard, FolderKanban, Settings, Users, MessageSquare,
  Zap, ChevronRight, Bell, Search, LogOut, Menu, X, Wrench, UserCog, Globe
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const navItems = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { label: "Projects", path: "/admin/projects", icon: FolderKanban },
  { label: "Services", path: "/admin/services", icon: Wrench },
  { label: "Customers", path: "/admin/customers", icon: Users },
  { label: "Messages", path: "/admin/messages", icon: MessageSquare },
  { label: "Accounts", path: "/admin/accounts", icon: UserCog },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{ padding: "20px 16px", borderBottom: "1px solid #1F2937", flexShrink: 0 }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #3B82F6, #6366F1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 12px rgba(99,102,241,0.4)" }}>
            <Zap size={16} color="#fff" />
          </div>
          {sidebarOpen && (
            <span style={{ color: "#FFFFFF", fontSize: "18px", fontWeight: 700, whiteSpace: "nowrap" }}>
              Nexa<span style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Admin</span>
            </span>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ padding: "12px 10px", flex: 1, overflowY: "auto" }}>
        {sidebarOpen && (
          <p style={{ color: "#4B5563", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", padding: "8px 8px 10px" }}>
            Navigation
          </p>
        )}
        {navItems.map(({ label, path, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            onClick={() => setMobileSidebarOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 12px",
              borderRadius: "10px",
              textDecoration: "none",
              marginBottom: "3px",
              background: isActive(path) ? "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.2))" : "transparent",
              color: isActive(path) ? "#FFFFFF" : "#94A3B8",
              border: isActive(path) ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
              transition: "all 0.2s",
              position: "relative",
              overflow: "hidden",
              justifyContent: sidebarOpen ? "flex-start" : "center",
            }}
            onMouseEnter={(e) => {
              if (!isActive(path)) {
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                (e.currentTarget as HTMLElement).style.color = "#FFFFFF";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive(path)) {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = "#94A3B8";
              }
            }}
          >
            {isActive(path) && (
              <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: "3px", height: "60%", background: "linear-gradient(#3B82F6, #6366F1)", borderRadius: "0 4px 4px 0" }} />
            )}
            <Icon size={17} style={{ flexShrink: 0 }} />
            {sidebarOpen && <span style={{ fontSize: "14px", fontWeight: 500 }}>{label}</span>}
            {sidebarOpen && isActive(path) && <ChevronRight size={13} style={{ marginLeft: "auto", flexShrink: 0 }} />}
          </Link>
        ))}
      </nav>

      {/* User + Footer */}
      <div style={{ padding: "12px 10px", borderTop: "1px solid #1F2937", flexShrink: 0 }}>
        {sidebarOpen && user && (
          <div style={{ background: "#020617", borderRadius: "10px", padding: "12px", marginBottom: "8px", border: "1px solid #1F2937" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "32px", height: "32px", background: "linear-gradient(135deg, #3B82F6, #6366F1)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: "#fff", fontSize: "11px", fontWeight: 700 }}>{user.avatar}</span>
              </div>
              <div style={{ overflow: "hidden" }}>
                <p style={{ color: "#FFFFFF", fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</p>
                <p style={{ color: "#94A3B8", fontSize: "11px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.role}</p>
              </div>
            </div>
          </div>
        )}

        <Link
          to="/"
          style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "10px", textDecoration: "none", color: "#94A3B8", transition: "all 0.2s", marginBottom: "4px", justifyContent: sidebarOpen ? "flex-start" : "center" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#FFFFFF"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#94A3B8"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <Globe size={17} />
          {sidebarOpen && <span style={{ fontSize: "14px", fontWeight: 500 }}>View Website</span>}
        </Link>

        <button
          onClick={handleLogout}
          style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "10px", background: "none", border: "none", color: "#EF4444", cursor: "pointer", width: "100%", fontSize: "14px", fontWeight: 500, transition: "all 0.2s", justifyContent: sidebarOpen ? "flex-start" : "center" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
        >
          <LogOut size={17} style={{ flexShrink: 0 }} />
          {sidebarOpen && <span>Sign Out</span>}
        </button>
      </div>
    </>
  );

  return (
    <div style={{ display: "flex", background: "#020617", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
      {/* Desktop Sidebar */}
      <motion.div
        animate={{ width: sidebarOpen ? 240 : 68 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        style={{ background: "#0F172A", borderRight: "1px solid #1F2937", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}
        className="hidden lg:flex"
      >
        <SidebarContent />
      </motion.div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 40 }}
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <motion.div
        animate={{ x: mobileSidebarOpen ? 0 : -240 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: "240px", background: "#0F172A", borderRight: "1px solid #1F2937", display: "flex", flexDirection: "column", zIndex: 50 }}
        className="lg:hidden"
      >
        <SidebarContent />
      </motion.div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top Bar */}
        <div style={{ background: "#0F172A", borderBottom: "1px solid #1F2937", padding: "0 20px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 30 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Mobile Menu Button */}
            <button
              className="lg:hidden"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", display: "flex", padding: "4px" }}
            >
              {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            {/* Desktop Collapse Button */}
            <button
              className="hidden lg:flex"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: "4px" }}
            >
              <Menu size={20} />
            </button>

            {/* Search */}
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#4B5563" }} />
              <input
                type="text"
                placeholder="Search..."
                style={{ background: "#020617", border: "1px solid #1F2937", borderRadius: "8px", padding: "7px 12px 7px 32px", color: "#94A3B8", fontSize: "13px", outline: "none", width: "180px" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button style={{ background: "#1F2937", border: "none", borderRadius: "8px", padding: "7px", cursor: "pointer", color: "#94A3B8", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <Bell size={16} />
              <span style={{ position: "absolute", top: "5px", right: "5px", width: "7px", height: "7px", background: "#3B82F6", borderRadius: "50%" }} />
            </button>
            <button
              onClick={() => navigate("/admin/settings")}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "5px 12px 5px 5px", background: "#1F2937", borderRadius: "10px", cursor: "pointer", border: "none" }}
            >
              <div style={{ width: "30px", height: "30px", background: "linear-gradient(135deg, #3B82F6, #6366F1)", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#fff", fontSize: "11px", fontWeight: 700 }}>{user?.avatar || "AD"}</span>
              </div>
              <div className="hidden sm:block">
                <p style={{ color: "#FFFFFF", fontSize: "12px", fontWeight: 600 }}>{user?.name || "Admin"}</p>
                <p style={{ color: "#94A3B8", fontSize: "10px" }}>{user?.role || "admin"}</p>
              </div>
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div style={{ padding: "28px", flex: 1, overflowY: "auto" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
