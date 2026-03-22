"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoInline } from "@/components/shared/InfinityLogo";
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
  type LucideIcon,
} from "lucide-react";
import { useAdminAuth } from "./admin-auth-provider";
import { canSeeNavItem } from "@/navigation/guards";
import { NAV_PERMISSIONS } from "@/lib/auth/roles";
import type { NavPermission } from "@/lib/auth/roles";
import { NavLink } from "@/navigation/router";
import { cn } from "@/components/ui/utils";

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};
type NavGroup = { group: string; items: NavItem[] };
type NavEntry = NavItem | NavGroup;

// Nav group labels
const GROUP_LABELS: Record<string, string> = {
  content: "Nội dung",
  sales: "Kinh doanh",
  system: "Hệ thống",
};

// Icon registry — maps icon name string to Lucide component
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Image,
  LayoutTemplate,
  Globe,
  Wrench,
  UsersRound,
  FolderKanban,
  Star,
  MessageSquare,
  ShoppingCart,
  Layout,
  Tag,
  Puzzle,
  Gift,
  Package,
  Server,
  FileText,
  Calculator,
  FileQuestion,
  Users,
  ShieldCheck,
  Coins,
  Monitor,
  ClipboardList,
  Settings,
  Lock,
};

// ─── Build nav data using NAV_PERMISSIONS (single source of truth) ────────────

function useNavData(): NavEntry[] {
  const { user } = useAdminAuth();
  if (!user) return [];

  // Filter all nav paths using canSeeNavItem (checks role level + permissions)
  const navPaths = Object.keys(NAV_PERMISSIONS as Record<string, NavPermission>);
  const visible = navPaths.filter((path) => canSeeNavItem(user, path));

  const entries: NavEntry[] = [];

  // Dashboard (standalone, always first)
  if (visible.includes("/admin")) {
    const dash = NAV_PERMISSIONS["/admin"] as NavPermission;
    entries.push({
      name: (dash.label as { vi: string }).vi || "Dashboard",
      href: "/admin",
      icon: ICON_MAP[dash.icon ?? "LayoutDashboard"] ?? LayoutDashboard,
    });
  }

  // Grouped sections
  const groups = {
    content: visible.filter((p) => p.startsWith("/admin/content/")),
    sales: visible.filter((p) => p.startsWith("/admin/sales/")),
    system: visible.filter((p) => p.startsWith("/admin/system/")),
  } as Record<string, string[]>;

  for (const [groupKey, paths] of Object.entries(groups)) {
    if (paths.length === 0) continue;
    entries.push({
      group: GROUP_LABELS[groupKey] ?? groupKey,
      items: paths.map((path) => {
        const config = NAV_PERMISSIONS[path] as NavPermission;
        return {
          name: (config.label as { vi: string }).vi || path,
          href: path,
          icon: ICON_MAP[config.icon ?? "FileText"] ?? FileText,
        };
      }),
    });
  }

  return entries;
}

// ─── Sidebar ───────────────────────────────────────────────────────────────

export function AdminSidebar({ onCollapse }: { onCollapse?: (collapsed: boolean) => void }) {
  const { user } = useAdminAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const navigation = useNavData();

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
          <div className="flex items-center gap-2">
            <LogoInline href="/admin" size="sm" />
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
          </div>
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
        {navigation.map((item, i) => {
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
