"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Globe,
  FolderKanban,
  MessageSquare,
  Users,
  ShieldCheck,
  Settings,
  FileText,
  Star,
  UsersRound,
  Package,
  ShoppingCart,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Calculator,
  FileQuestion,
  Layout,
  Tag,
  Gift,
  Puzzle,
  LayoutTemplate,
  Wrench,
  Monitor,
  Server,
  Coins,
  Lock,
  Image,
} from "lucide-react";
import { useAdminAuth } from "./admin-auth-provider";
import { ROLE_LEVEL } from "@/lib/auth/roles";
import { cn } from "@/components/ui/utils";

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};
type NavGroup = { group: string; items: NavItem[] };
type NavEntry = NavItem | NavGroup;

// NOTE: All paths use /admin/* — no locale prefix for admin routes
const navigation: NavEntry[] = [
  // Standalone items
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  // Nội dung
  {
    group: "Nội dung",
    items: [
      { name: "Trang chủ (Slider)", href: "/admin/home-sliders", icon: Image },
      { name: "Landing Pages", href: "/admin/landing-pages", icon: LayoutTemplate },
      { name: "Dịch vụ", href: "/admin/services", icon: Globe },
      { name: "Dự án", href: "/admin/projects", icon: FolderKanban },
      { name: "Đội ngũ", href: "/admin/team", icon: UsersRound },
      { name: "Kỹ năng", href: "/admin/expertises", icon: Wrench },
      { name: "Đánh giá", href: "/admin/testimonials", icon: Star },
      { name: "Tin nhắn", href: "/admin/messages", icon: MessageSquare },
    ],
  },
  // Kinh doanh
  {
    group: "Kinh doanh",
    items: [
      { name: "Đơn hàng", href: "/admin/orders", icon: ShoppingCart },
      { name: "Kho Giao Diện", href: "/admin/web-templates", icon: Layout },
      { name: "Kho Tính Năng", href: "/admin/service-attributes", icon: Tag },
      { name: "Dịch vụ Rời", href: "/admin/addon-services", icon: Puzzle },
      { name: "XP & Rewards", href: "/admin/reward-tiers", icon: Gift },
      { name: "Gói dịch vụ", href: "/admin/packages", icon: Package },
      { name: "Hosting Plans", href: "/admin/hosting-plans", icon: Server },
      { name: "Domain Prices", href: "/admin/domain-prices", icon: Globe },
      { name: "Deployment Items", href: "/admin/deployment-items", icon: FileText },
      { name: "Báo giá tính năng", href: "/admin/pricing-features", icon: Calculator },
      { name: "Yêu cầu báo giá", href: "/admin/quote-requests", icon: FileQuestion },
    ],
  },
  // Hệ thống
  {
    group: "Hệ thống",
    items: [
      { name: "Tài Khoản NV", href: "/admin/staff-users", icon: Users },
      { name: "Phân quyền", href: "/admin/roles", icon: ShieldCheck },
      { name: "Điểm thưởng", href: "/admin/points", icon: Coins },
      { name: "Website KH", href: "/admin/websites", icon: Monitor },
      { name: "Nhật ký", href: "/admin/audit-log", icon: ClipboardList },
      { name: "Cài đặt", href: "/admin/settings", icon: Settings },
    ],
  },
];

// ─── Filter nav items by role ──────────────────────────────────────────────────────

function canAccessNav(userRoleLevel: number, href: string): boolean {
  // Admin routes: only super_admin/admin/ceo can access
  if (href === "/admin") return true; // all staff
  const adminOnlyRoutes = ["/users", "/roles", "/audit-log", "/settings"];
  if (adminOnlyRoutes.some((r) => href === `/admin${r}`)) {
    return userRoleLevel <= 1; // admin or higher
  }
  return true;
}

// ─── Sidebar ───────────────────────────────────────────────────────────────

export function AdminSidebar({ onCollapse }: { onCollapse?: (collapsed: boolean) => void }) {
  const { user } = useAdminAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const userLevel = user ? ROLE_LEVEL[user.role] ?? 99 : 99;

  const filteredNav = navigation.map((entry) => {
    if ("href" in entry) {
      if (!canAccessNav(userLevel, entry.href)) return null;
      return entry;
    }
    const visibleItems = entry.items.filter((item) => canAccessNav(userLevel, item.href));
    if (visibleItems.length === 0) return null;
    return { ...entry, items: visibleItems };
  }).filter(Boolean) as NavEntry[];

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
      style={{
        background: "rgba(9,11,20,0.98)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Logo */}
      <div
        className="flex h-16 items-center justify-between px-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-2" style={{ textDecoration: "none" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 14px rgba(139,92,246,0.35)",
              }}
            >
              <span style={{ fontSize: "13px", fontWeight: 800, color: "#FFFFFF" }}>L</span>
            </div>
            <span
              style={{
                fontSize: "18px",
                fontWeight: 800,
                background: "linear-gradient(to right, #C4B5FD, #A5F3FC)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                letterSpacing: "-0.02em",
              }}
            >
              LOOP
            </span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                color: "#A78BFA",
                background: "rgba(139,92,246,0.15)",
                padding: "2px 6px",
                borderRadius: "4px",
                letterSpacing: "0.02em",
              }}
            >
              Admin
            </span>
          </Link>
        )}
        <button
          onClick={() => {
            const next = !collapsed;
            setCollapsed(next);
            onCollapse?.(next);
          }}
          className={cn(
            "rounded-lg p-1.5 transition-colors",
            collapsed && "mx-auto"
          )}
          style={{
            color: "rgba(209,213,219,0.6)",
            background: "transparent",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#FFFFFF";
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(209,213,219,0.6)";
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Role badge */}
      {!collapsed && user && (
        <div className="px-4 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <Lock size={12} className="shrink-0" style={{ color: "rgba(209,213,219,0.4)" }} />
            <span className="truncate text-xs" style={{ color: "rgba(209,213,219,0.5)" }}>
              {user.role || "member"}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="h-[calc(100vh-8rem)] overflow-y-auto px-3 py-3">
        {filteredNav.map((item, i) => {
          if ("href" in item) {
            const navItem = item;
            const isActive = pathname === navItem.href;
            return (
              <Link
                key={navItem.href}
                href={navItem.href}
                className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all"
                style={{
                  color: isActive ? "#FFFFFF" : "rgba(209,213,219,0.7)",
                  background: isActive ? "rgba(139,92,246,0.15)" : "transparent",
                  textDecoration: "none",
                  position: "relative",
                }}
                title={collapsed ? navItem.name : undefined}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLAnchorElement).style.color = "#FFFFFF";
                    (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.06)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLAnchorElement).style.color = "rgba(209,213,219,0.7)";
                    (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                  }
                }}
              >
                <navItem.icon size={20} className="shrink-0" style={{ opacity: isActive ? 1 : 0.7 }} />
                {!collapsed && <span>{navItem.name}</span>}
                {isActive && (
                  <span
                    style={{
                      position: "absolute",
                      right: "8px",
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      background: "linear-gradient(to right, #8B5CF6, #06B6D4)",
                    }}
                  />
                )}
              </Link>
            );
          }

          const groupItem = item as NavGroup;
          return (
            <div key={groupItem.group} className={cn(i > 0 && "mt-5")}>
              {!collapsed && (
                <p
                  className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: "rgba(209,213,219,0.35)" }}
                >
                  {groupItem.group}
                </p>
              )}
              {collapsed && <div className="mb-2 border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.07)" }} />}
              {groupItem.items.map((subItem) => {
                const isActive =
                  pathname === subItem.href ||
                  (subItem.href !== "/admin" && pathname.startsWith(subItem.href));
                return (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    className="mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all"
                    style={{
                      color: isActive ? "#FFFFFF" : "rgba(209,213,219,0.7)",
                      background: isActive ? "rgba(139,92,246,0.15)" : "transparent",
                      textDecoration: "none",
                      position: "relative",
                    }}
                    title={collapsed ? subItem.name : undefined}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLAnchorElement).style.color = "#FFFFFF";
                        (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.06)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLAnchorElement).style.color = "rgba(209,213,219,0.7)";
                        (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                      }
                    }}
                  >
                    <subItem.icon size={18} className="shrink-0" style={{ opacity: isActive ? 1 : 0.7 }} />
                    {!collapsed && <span>{subItem.name}</span>}
                    {isActive && (
                      <span
                        style={{
                          position: "absolute",
                          right: "8px",
                          width: "5px",
                          height: "5px",
                          borderRadius: "50%",
                          background: "linear-gradient(to right, #8B5CF6, #06B6D4)",
                        }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
