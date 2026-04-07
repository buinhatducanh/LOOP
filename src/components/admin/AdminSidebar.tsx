"use client";

/**
 * AdminSidebar — LOOP Solutions
 * Dark-themed Figma admin sidebar.
 *
 * Uses Zustand store for role/access data (read-only).
 * Session is populated by SessionHydrator after initial mount.
 *
 * Props:
 *  - userName: current user display name
 *  - userAvatar: optional avatar URL
 *  - userRole: display role (passed from layout)
 *  - userRank: team member rank
 *  - userLpBalance: LP balance
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, FolderKanban, Wallet, Settings,
  DollarSign, UserCheck, BookOpen, FileText, BarChart2,
  Briefcase, Camera, Receipt, Package, FolderCheck,
  Sparkles, Star, Bell, Zap, Calculator, Building2, ShoppingCart,
  Monitor, X, ChevronRight,
} from "lucide-react";
import { useAuthStore, canAccessTab, type AdminTab } from "@/app/store/authStore";
import { useAdminTranslations } from "@/i18n/admin/useAdminTranslations";
import { DS } from "@/lib/design-tokens";

const fmtLP = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : String(n);

type NavItem = {
  id: AdminTab;
  icon: React.ReactNode;
  labelKey: string;
};

type NavGroup = {
  labelKey: string;
  items: NavItem[];
};

const SIDEBAR_GROUPS_CONFIG: NavGroup[] = [
  {
    labelKey: "sidebar.groups.management",
    items: [
      { id: "overview", icon: <LayoutDashboard size={16} />, labelKey: "sidebar.nav.overview" },
      { id: "orders", icon: <ShoppingCart size={16} />, labelKey: "sidebar.nav.orders" },
      { id: "members", icon: <Users size={16} />, labelKey: "sidebar.nav.members" },
      { id: "departments", icon: <Building2 size={16} />, labelKey: "sidebar.nav.departments" },
      { id: "projects", icon: <FolderKanban size={16} />, labelKey: "sidebar.nav.projects" },
      { id: "leaderboard_admin", icon: <BarChart2 size={16} />, labelKey: "sidebar.nav.leaderboard_admin" },
    ],
  },
  {
    labelKey: "sidebar.groups.products",
    items: [
      { id: "services", icon: <Briefcase size={16} />, labelKey: "sidebar.nav.services" },
      { id: "media", icon: <Camera size={16} />, labelKey: "sidebar.nav.media" },
      { id: "quotation", icon: <Receipt size={16} />, labelKey: "sidebar.nav.quotation" },
      { id: "portfolio", icon: <Package size={16} />, labelKey: "sidebar.nav.portfolio" },
      { id: "projects_completed", icon: <FolderCheck size={16} />, labelKey: "sidebar.nav.projects_completed" },
      { id: "academy", icon: <BookOpen size={16} />, labelKey: "sidebar.nav.academy" },
      { id: "blog", icon: <FileText size={16} />, labelKey: "sidebar.nav.blog" },
      { id: "figma-demos", icon: <Monitor size={16} />, labelKey: "sidebar.nav.figma_demos" },
    ],
  },
  {
    labelKey: "sidebar.groups.finance",
    items: [
      { id: "revenue", icon: <DollarSign size={16} />, labelKey: "sidebar.nav.revenue" },
      { id: "analytics", icon: <BarChart2 size={16} />, labelKey: "sidebar.nav.analytics" },
      { id: "clients", icon: <UserCheck size={16} />, labelKey: "sidebar.nav.clients" },
      { id: "lp", icon: <Wallet size={16} />, labelKey: "sidebar.nav.lp" },
      { id: "lp_manage", icon: <Zap size={16} />, labelKey: "sidebar.nav.lp_manage" },
      { id: "income_tax", icon: <Calculator size={16} />, labelKey: "sidebar.nav.income_tax" },
      { id: "pricing", icon: <Receipt size={16} />, labelKey: "sidebar.nav.pricing" },
      { id: "web_packages", icon: <Package size={16} />, labelKey: "sidebar.nav.web_packages" },
      { id: "revenue_split", icon: <Calculator size={16} />, labelKey: "sidebar.nav.revenue_split" },
      { id: "off_system_payments", icon: <Wallet size={16} />, labelKey: "sidebar.nav.off_system_payments" },
    ],
  },
  {
    labelKey: "sidebar.groups.system",
    items: [
      { id: "effects", icon: <Sparkles size={16} />, labelKey: "sidebar.nav.effects" },
      { id: "quests_events", icon: <Star size={16} />, labelKey: "sidebar.nav.quests_events" },
      { id: "notification_center", icon: <Bell size={16} />, labelKey: "sidebar.nav.notification_center" },
      { id: "settings", icon: <Settings size={16} />, labelKey: "sidebar.nav.settings" },
    ],
  },
];

interface AdminSidebarProps {
  userName?: string;
  userAvatar?: string;
  userRole?: string;
  userRank?: string;
  userLpBalance?: number;
}

const RANK_COLORS: Record<string, string> = {
  iron: "#9CA3AF",
  bronze: "#CD7F32",
  silver: "#CBD5E1",
  gold: "#FFD700",
  platinum: "#14B8A6",
  ruby: "#EF4444",
  diamond: "#818CF8",
};

export function AdminSidebar({ userName, userAvatar, userRole, userRank, userLpBalance }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useAdminTranslations();

  // Read role from Zustand store (set by SessionHydrator on mount)
  // Falls back to prop value if store not yet initialized
  const storeRole = useAuthStore((s) => s.role);
  const role = storeRole !== "guest" ? storeRole : (userRole ?? "admin");

  const activeTab = (pathname.split("/").pop() ?? "overview") as AdminTab;

  const isAccessible = (tab: AdminTab) => canAccessTab(role as import("@/app/store/authStore").UserRole, undefined, tab);

  return (
    <>
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 40,
          }}
        />
      )}

      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 260,
          height: "100vh",
          background: "var(--figma-bg-card, #0F172A)",
          borderRight: "1px solid var(--figma-border, #1F2937)",
          display: "flex",
          flexDirection: "column",
          zIndex: 50,
          transition: "transform 0.3s ease",
          transform: isOpen ? "translateX(0)" : undefined,
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "1.25rem",
            borderBottom: "1px solid var(--figma-border, #1F2937)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--figma-text4, #64748B)",
                padding: 4,
                display: "none",
              }}
            >
              <X size={18} />
            </button>
            <img
              src="/logo.png"
              alt="LOOP"
              style={{ width: 36, height: 36, objectFit: "contain", borderRadius: 8, flexShrink: 0 }}
            />
            <div>
              <div
                style={{
                  color: "var(--figma-text, #fff)",
                  fontFamily: DS.heading,
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                }}
              >
                LOOP OS
              </div>
              <div
                style={{
                  color: "var(--figma-text5, #475569)",
                  fontSize: 9,
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.15em",
                }}
              >
                {t("sidebar.footer.adminPanel")}
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav
          style={{
            flex: 1,
            padding: "0.75rem",
            overflowY: "auto",
          }}
          className="scrollbar-zen"
        >
          {SIDEBAR_GROUPS_CONFIG.map((group) => {
            const accessibleItems = group.items.filter((item) => isAccessible(item.id));
            if (accessibleItems.length === 0) return null;

            return (
              <div key={group.labelKey} style={{ marginBottom: "1.25rem" }}>
                <div
                  style={{
                    color: "var(--figma-text4, #64748B)",
                    fontSize: 9,
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: "0.2em",
                    padding: "0 0.5rem",
                    marginBottom: "0.375rem",
                  }}
                >
                  {t(group.labelKey)}
                </div>
                {accessibleItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <Link
                      key={item.id}
                      href={`/admin/${item.id}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.625rem",
                        padding: "0.5rem 0.625rem",
                        borderRadius: 8,
                        color: isActive
                          ? "var(--figma-blue, #3B82F6)"
                          : "var(--figma-text3, #94A3B8)",
                        background: isActive
                          ? "rgba(59,130,246,0.1)"
                          : "transparent",
                        border: isActive
                          ? "1px solid rgba(59,130,246,0.3)"
                          : "1px solid transparent",
                        textDecoration: "none",
                        fontSize: "0.8125rem",
                        fontWeight: isActive ? 600 : 400,
                        marginBottom: 2,
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                          e.currentTarget.style.color = "var(--figma-text2, #E2E8F0)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "var(--figma-text3, #94A3B8)";
                        }
                      }}
                    >
                      <span style={{ opacity: isActive ? 1 : 0.7 }}>{item.icon}</span>
                      <span style={{ flex: 1 }}>{t(item.labelKey)}</span>
                      {isActive && <ChevronRight size={12} />}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User info footer */}
        <div
          style={{
            padding: "1rem 1.25rem",
            borderTop: "1px solid var(--figma-border, #1F2937)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            {userAvatar ? (
              <img
                src={userAvatar}
                alt={userName ?? "Avatar"}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "var(--figma-grd-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {(userName ?? "U").slice(0, 2).toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  color: "var(--figma-text2, #E2E8F0)",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {userName ?? "Admin"}
              </div>
              <div
                style={{
                  color: "var(--figma-text5, #475569)",
                  fontSize: "0.6875rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {userRank && (
                  <>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: RANK_COLORS[userRank.toLowerCase()] ?? "var(--figma-purple, #818CF8)",
                        boxShadow: `0 0 6px ${RANK_COLORS[userRank.toLowerCase()] ?? "var(--figma-purple, #818CF8)"}`,
                        display: "inline-block",
                      }}
                    />
                    <span>{userRank}</span>
                    <span style={{ color: "var(--figma-text4, #64748B)" }}>·</span>
                  </>
                )}
                <span>{fmtLP(userLpBalance ?? 0)} LP</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
