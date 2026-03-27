"use client";

/**
 * AdminSidebar — LOOP Solutions
 * Dark-themed Figma admin sidebar.
 * Adapted from Figma OLD FE AdminDashboard.tsx Sidebar.
 *
 * Props:
 *  - activeTab: currently selected tab
 *  - onSelectTab: called when user clicks a nav item
 *  - userName: current user display name
 *  - userAvatar: optional avatar URL
 *  - userRole: Figma role (admin|manager|staff|client)
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  LayoutDashboard, Users, FolderKanban, Wallet, Settings,
  DollarSign, UserCheck, BookOpen, FileText, BarChart2,
  Briefcase, Camera, Receipt, Package, FolderCheck,
  Sparkles, Star, Bell, Zap, Calculator, Building2, ShoppingCart,
  X, ChevronRight,
} from "lucide-react";
import { useAuthStore, canAccessTab, type AdminTab } from "@/app/store/authStore";

const fmtLP = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(0)}K` : String(n);

type NavItem = {
  id: AdminTab;
  icon: React.ReactNode;
  label: string;
  badge?: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const SIDEBAR_GROUPS: NavGroup[] = [
  {
    label: "QUẢN LÝ",
    items: [
      { id: "overview", icon: <LayoutDashboard size={16} />, label: "Tổng quan" },
      { id: "orders", icon: <ShoppingCart size={16} />, label: "Đơn hàng" },
      { id: "members", icon: <Users size={16} />, label: "Thành viên" },
      { id: "departments", icon: <Building2 size={16} />, label: "Phòng ban" },
      { id: "projects", icon: <FolderKanban size={16} />, label: "Kanban" },
      { id: "leaderboard_admin", icon: <BarChart2 size={16} />, label: "Leaderboard LP" },
    ],
  },
  {
    label: "SẢN PHẨM",
    items: [
      { id: "services", icon: <Briefcase size={16} />, label: "Dịch vụ" },
      { id: "media", icon: <Camera size={16} />, label: "Quản lý Media Booking" },
      { id: "quotation", icon: <Receipt size={16} />, label: "Báo giá" },
      { id: "portfolio", icon: <Package size={16} />, label: "Portfolio" },
      { id: "projects_completed", icon: <FolderCheck size={16} />, label: "Dự án xong" },
      { id: "academy", icon: <BookOpen size={16} />, label: "Học viện" },
      { id: "blog", icon: <FileText size={16} />, label: "Blog" },
    ],
  },
  {
    label: "TÀI CHÍNH",
    items: [
      { id: "revenue", icon: <DollarSign size={16} />, label: "Doanh thu" },
      { id: "analytics", icon: <BarChart2 size={16} />, label: "Phân tích & Báo cáo" },
      { id: "clients", icon: <UserCheck size={16} />, label: "Khách hàng" },
      { id: "lp", icon: <Wallet size={16} />, label: "Tài chính LP" },
      { id: "lp_manage", icon: <Zap size={16} />, label: "Quản lý LP" },
      { id: "income_tax", icon: <Calculator size={16} />, label: "Thu nhập & Thuế" },
      { id: "web_packages", icon: <Package size={16} />, label: "Gói Web" },
    ],
  },
  {
    label: "HỆ THỐNG",
    items: [
      { id: "effects", icon: <Sparkles size={16} />, label: "Hiệu ứng rank" },
      { id: "quests_events", icon: <Star size={16} />, label: "Nhiệm vụ & Sự kiện" },
      { id: "notification_center", icon: <Bell size={16} />, label: "Trung tâm TB" },
      { id: "settings", icon: <Settings size={16} />, label: "Cài đặt" },
    ],
  },
];

interface AdminSidebarProps {
  userName?: string;
  userAvatar?: string;
  userRole?: string;
}

export function AdminSidebar({ userName, userAvatar, userRole }: AdminSidebarProps) {
  const pathname = usePathname();
  const { role, department, user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  // Determine active tab from URL
  const activeTab = (pathname.split("/").pop() ?? "overview") as AdminTab;

  const isAccessible = (tab: AdminTab) => canAccessTab(role, department, tab);

  return (
    <>
      {/* Mobile overlay */}
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

      {/* Sidebar */}
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
                display: "none", // hidden on desktop, shown on mobile via CSS
              }}
            >
              <X size={18} />
            </button>
            <motion.div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--figma-grd-primary)",
                flexShrink: 0,
              }}
              animate={{
                boxShadow: [
                  "0 0 12px rgba(129,140,248,0.4)",
                  "0 0 24px rgba(129,140,248,0.7)",
                  "0 0 12px rgba(129,140,248,0.4)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
                <path
                  d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z"
                  stroke="rgba(255,255,255,0.8)"
                  strokeWidth="1.5"
                  fill="none"
                />
                <path
                  d="M20 8 L30 13.5 L30 25 L20 30.5 L10 25 L10 13.5 Z"
                  fill="rgba(255,255,255,0.12)"
                />
                <text
                  x="20"
                  y="25"
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="900"
                  fill="white"
                  fontFamily="serif"
                >
                  ∞
                </text>
              </svg>
            </motion.div>
            <div>
              <div
                style={{
                  color: "var(--figma-text, #fff)",
                  fontFamily: "'Cinzel', serif",
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
                ADMIN PANEL
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
          {SIDEBAR_GROUPS.map((group) => {
            const accessibleItems = group.items.filter((item) => isAccessible(item.id));
            if (accessibleItems.length === 0) return null;

            return (
              <div key={group.label} style={{ marginBottom: "1.25rem" }}>
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
                  {group.label}
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
                      <span style={{ flex: 1 }}>{item.label}</span>
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
                {user?.rank && (
                  <>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: user.rankColor ?? "var(--figma-purple, #818CF8)",
                        boxShadow: `0 0 6px ${user.rankColor ?? "var(--figma-purple, #818CF8)"}`,
                        display: "inline-block",
                      }}
                    />
                    <span>{user.rank}</span>
                    <span style={{ color: "var(--figma-text4, #64748B)" }}>·</span>
                  </>
                )}
                <span>{fmtLP(user?.lpBalance ?? 0)} LP</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
