import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, Zap, LogIn, LogOut, User, ChevronDown } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Services", path: "/services" },
  { label: "Portfolio", path: "/portfolio" },
  { label: "Pricing", path: "/pricing" },
  { label: "About", path: "/about" },
  { label: "Contact", path: "/contact" },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setUserDropdown(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/");
    setUserDropdown(false);
  };

  return (
    <>
      <nav
        style={{
          background: scrolled ? "rgba(2, 6, 23, 0.97)" : "rgba(2, 6, 23, 0.7)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: scrolled ? "1px solid #1F2937" : "1px solid transparent",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          transition: "all 0.3s ease",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "68px" }}>
            {/* Logo */}
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", flexShrink: 0 }}>
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                style={{ width: "36px", height: "36px", borderRadius: "8px", background: "linear-gradient(135deg, #3B82F6, #6366F1)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)" }}
              >
                <Zap size={18} color="#fff" />
              </motion.div>
              <span style={{ color: "#FFFFFF", fontSize: "20px", fontWeight: 700, letterSpacing: "-0.3px" }}>
                Nexa<span style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Web</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex" style={{ alignItems: "center", gap: "4px" }}>
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  style={{
                    color: location.pathname === link.path ? "#3B82F6" : "#94A3B8",
                    textDecoration: "none",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 500,
                    transition: "all 0.2s",
                    background: location.pathname === link.path ? "rgba(59, 130, 246, 0.1)" : "transparent",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    if (location.pathname !== link.path) {
                      (e.currentTarget as HTMLElement).style.color = "#FFFFFF";
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (location.pathname !== link.path) {
                      (e.currentTarget as HTMLElement).style.color = "#94A3B8";
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop Right Actions */}
            <div className="hidden md:flex" style={{ alignItems: "center", gap: "12px" }}>
              {isAuthenticated && user ? (
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setUserDropdown(!userDropdown)}
                    style={{ display: "flex", alignItems: "center", gap: "8px", background: "#1F2937", border: "1px solid #374151", borderRadius: "10px", padding: "6px 12px 6px 6px", cursor: "pointer", color: "#FFFFFF" }}
                  >
                    <div style={{ width: "28px", height: "28px", background: "linear-gradient(135deg, #3B82F6, #6366F1)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ color: "#fff", fontSize: "11px", fontWeight: 700 }}>{user.avatar}</span>
                    </div>
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>{user.name.split(" ")[0]}</span>
                    <ChevronDown size={12} color="#94A3B8" style={{ transition: "transform 0.2s", transform: userDropdown ? "rotate(180deg)" : "rotate(0deg)" }} />
                  </button>
                  <AnimatePresence>
                    {userDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#0F172A", border: "1px solid #1F2937", borderRadius: "12px", minWidth: "180px", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.4)", zIndex: 100 }}
                      >
                        <div style={{ padding: "12px 16px", borderBottom: "1px solid #1F2937" }}>
                          <p style={{ color: "#FFFFFF", fontSize: "13px", fontWeight: 600 }}>{user.name}</p>
                          <p style={{ color: "#94A3B8", fontSize: "11px" }}>{user.email}</p>
                        </div>
                        <button onClick={() => navigate("/admin")} style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "11px 16px", background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: "13px", fontWeight: 500, textAlign: "left", transition: "all 0.2s" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#fff"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#94A3B8"; (e.currentTarget as HTMLElement).style.background = "none"; }}
                        >
                          <User size={14} /> Admin Panel
                        </button>
                        <button onClick={handleLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "11px 16px", background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: "13px", fontWeight: 500, textAlign: "left", transition: "all 0.2s" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
                        >
                          <LogOut size={14} /> Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  style={{ background: "none", color: "#94A3B8", border: "1px solid #374151", padding: "8px 16px", borderRadius: "8px", fontSize: "14px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#fff"; (e.currentTarget as HTMLElement).style.borderColor = "#94A3B8"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#94A3B8"; (e.currentTarget as HTMLElement).style.borderColor = "#374151"; }}
                >
                  <LogIn size={14} /> Sign In
                </button>
              )}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/contact")}
                style={{ background: "linear-gradient(135deg, #3B82F6, #6366F1)", color: "#FFFFFF", border: "none", padding: "9px 20px", borderRadius: "8px", fontSize: "14px", fontWeight: 600, cursor: "pointer", boxShadow: "0 0 20px rgba(99, 102, 241, 0.3)" }}
              >
                Get Quote
              </motion.button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: "8px", display: "flex" }}
            >
              <AnimatePresence mode="wait">
                {menuOpen ? (
                  <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <X size={24} />
                  </motion.div>
                ) : (
                  <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <Menu size={24} />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="md:hidden"
              style={{ background: "#0F172A", borderTop: "1px solid #1F2937", overflow: "hidden" }}
            >
              <div style={{ padding: "16px 20px 24px" }}>
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      to={link.path}
                      style={{
                        display: "block",
                        color: location.pathname === link.path ? "#3B82F6" : "#94A3B8",
                        textDecoration: "none",
                        padding: "13px 0",
                        fontSize: "15px",
                        fontWeight: 500,
                        borderBottom: "1px solid #1F2937",
                      }}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  {isAuthenticated ? (
                    <>
                      <button
                        onClick={() => navigate("/admin")}
                        style={{ width: "100%", background: "#1F2937", color: "#FFFFFF", border: "none", padding: "13px", borderRadius: "10px", fontSize: "15px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                      >
                        <User size={16} /> Admin Panel
                      </button>
                      <button
                        onClick={handleLogout}
                        style={{ width: "100%", background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)", padding: "13px", borderRadius: "10px", fontSize: "15px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                      >
                        <LogOut size={16} /> Sign Out
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => navigate("/login")}
                      style={{ width: "100%", background: "#1F2937", color: "#FFFFFF", border: "none", padding: "13px", borderRadius: "10px", fontSize: "15px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                    >
                      <LogIn size={16} /> Sign In
                    </button>
                  )}
                  <button
                    onClick={() => navigate("/contact")}
                    style={{ width: "100%", background: "linear-gradient(135deg, #3B82F6, #6366F1)", color: "#FFFFFF", border: "none", padding: "13px", borderRadius: "10px", fontSize: "15px", fontWeight: 600, cursor: "pointer" }}
                  >
                    Get a Quote
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Backdrop for user dropdown */}
      {userDropdown && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999 }} onClick={() => setUserDropdown(false)} />
      )}
    </>
  );
}
