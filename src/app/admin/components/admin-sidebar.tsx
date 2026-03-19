"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  FolderKanban,
  MessageSquare,
  Users,
  ShieldCheck,
  Settings,
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
  Image,
  Website,
  Coins,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/components/ui/utils";
import { useAdminAuth } from "@/app/[locale]/admin/components/admin-auth-provider";
import { NAV_PERMISSIONS, ROLE_LEVEL } from "@/lib/auth/roles";

// ─── Icon map (avoids importing lucide icons dynamically) ─────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  LayoutDashboard,
  Globe,
  FolderKanban,
  MessageSquare,
  Users,
  ShieldCheck,
  Settings,
  Star,
  UsersRound,
  Package,
  ShoppingCart,
  ClipboardList,
  Calculator,
  FileQuestion,
  Layout,
  Tag,
  Gift,
  Puzzle,
  LayoutTemplate,
  Wrench,
  Image,
  Website,
  Coins,
};

// ─── Types ─────────────────────────────────────────────────────────────────────

type NavItem = {
  name: { vi: string; en: string };
  href: string;
  icon: string;
};

type NavGroup = {
  group: { vi: string; en: string };
  items: NavItem[];
};

type NavEntry = NavItem | NavGroup;

// ─── Static nav definition (all possible items) ────────────────────────────────

const navigation: NavEntry[] = [
  {
    group: { vi: "Nội dung", en: "Content" },
    items: [
      { name: { vi: "Trang chủ (Slider)", en: "Home Sliders" }, href: "/admin/home-sliders", icon: "Image" },
      { name: { vi: "Landing Pages", en: "Landing Pages" }, href: "/admin/landing-pages", icon: "LayoutTemplate" },
      { name: { vi: "Dịch vụ", en: "Services" }, href: "/admin/services", icon: "Globe" },
      { name: { vi: "Dự án", en: "Projects" }, href: "/admin/projects", icon: "FolderKanban" },
      { name: { vi: "Đội ngũ", en: "Team" }, href: "/admin/team", icon: "UsersRound" },
      { name: { vi: "Kỹ năng", en: "Expertises" }, href: "/admin/expertises", icon: "Wrench" },
      { name: { vi: "Đánh giá", en: "Testimonials" }, href: "/admin/testimonials", icon: "Star" },
    ],
  },
  {
    group: { vi: "Kinh doanh", en: "Sales" },
    items: [
      { name: { vi: "Đơn hàng", en: "Orders" }, href: "/admin/orders", icon: "ShoppingCart" },
      { name: { vi: "Kho Giao Diện", en: "Web Templates" }, href: "/admin/web-templates", icon: "Layout" },
      { name: { vi: "Kho Tính Năng", en: "Service Attributes" }, href: "/admin/service-attributes", icon: "Tag" },
      { name: { vi: "Dịch vụ Rời", en: "Addon Services" }, href: "/admin/addon-services", icon: "Puzzle" },
      { name: { vi: "XP & Rewards", en: "XP & Rewards" }, href: "/admin/reward-tiers", icon: "Gift" },
      { name: { vi: "Gói dịch vụ", en: "Service Packages" }, href: "/admin/packages", icon: "Package" },
      { name: { vi: "Báo giá tính năng", en: "Pricing Features" }, href: "/admin/pricing-features", icon: "Calculator" },
      { name: { vi: "Yêu cầu báo giá", en: "Quote Requests" }, href: "/admin/quote-requests", icon: "FileQuestion" },
      { name: { vi: "Tin nhắn", en: "Messages" }, href: "/admin/messages", icon: "MessageSquare" },
    ],
  },
  {
    group: { vi: "Hệ thống", en: "System" },
    items: [
      { name: { vi: "Người dùng", en: "Users" }, href: "/admin/users", icon: "Users" },
      { name: { vi: "Phân quyền", en: "Roles" }, href: "/admin/roles", icon: "ShieldCheck" },
      { name: { vi: "Nhật ký", en: "Audit Log" }, href: "/admin/audit-log", icon: "ClipboardList" },
      { name: { vi: "Cài đặt", en: "Settings" }, href: "/admin/settings", icon: "Settings" },
      { name: { vi: "Websites", en: "Websites" }, href: "/admin/websites", icon: "Website" },
      { name: { vi: "Điểm thưởng", en: "Points" }, href: "/admin/points", icon: "Coins" },
    ],
  },
];

// ─── Permission check helper ──────────────────────────────────────────────────

/**
 * Check if user can see a nav item based on NAV_PERMISSIONS config.
 * Super admin (level=0) sees everything.
 * Others check minRoleLevel.
 */
function canSeeNavItem(userRole: string, href: string): boolean {
  const roleLevel = ROLE_LEVEL[userRole] ?? 99;

  // CEO (-1) and super_admin (0): see everything
  if (roleLevel <= 0) return true;

  const config = NAV_PERMISSIONS[href];
  if (!config) return true; // Unknown item: show (auth will block later)

  // Check minRoleLevel
  if (config.minRoleLevel !== undefined && roleLevel <= config.minRoleLevel) {
    return true;
  }

  return false;
}

/**
 * Get the icon component for a nav item
 */
function getIcon(iconName: string) {
  return ICON_MAP[iconName] ?? LayoutDashboard;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAdminAuth();

  // Filter nav items based on user role
  const visibleNavigation = navigation.map((entry) => {
    if (!("group" in entry)) {
      // Single item (Dashboard)
      const show = user ? canSeeNavItem(user.role, entry.href) : false;
      return show ? entry : null;
    }

    const filteredItems = entry.items.filter((item) =>
      user ? canSeeNavItem(user.role, item.href) : false
    );

    return filteredItems.length > 0 ? { ...entry, items: filteredItems } : null;
  }).filter(Boolean) as NavEntry[];

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-slate-800 bg-slate-950 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
              L
            </div>
            <span className="text-lg font-bold text-white">LOOP</span>
            <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
              Admin
            </span>
          </Link>
        )}
        {collapsed && (
          <Link href="/admin" className="mx-auto">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
              L
            </div>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          title={collapsed ? "Mở rộng" : "Thu gọn"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="h-[calc(100vh-4rem)] overflow-y-auto px-3 py-4 scrollbar-thin scrollbar-thumb-slate-800">
        {/* Dashboard always visible */}
        {user && canSeeNavItem(user.role, "/admin") && (
          <NavLink
            href="/admin"
            icon={<LayoutDashboard size={20} className="shrink-0" />}
            active={pathname === "/admin"}
            collapsed={collapsed}
          >
            {viEn("Dashboard", "Dashboard")}
          </NavLink>
        )}

        {visibleNavigation.map((entry, i) => {
          if (!("group" in entry)) return null;

          return (
            <div key={entry.group.vi} className={cn(i >= 0 && "mt-6")}>
              {!collapsed && (
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {viEn(entry.group.vi, entry.group.en)}
                </p>
              )}
              {collapsed && <div className="my-2 border-t border-slate-800" />}
              {entry.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href));

                return (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    icon={<IconComponent name={item.icon} size={18} className="shrink-0" />}
                    active={isActive}
                    collapsed={collapsed}
                  >
                    {viEn(item.name.vi, item.name.en)}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

// ─── NavLink sub-component ─────────────────────────────────────────────────────

function NavLink({
  href,
  icon,
  active,
  collapsed,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  active: boolean;
  collapsed: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-blue-600/20 text-blue-400"
          : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
      )}
      title={collapsed ? String(children) : undefined}
    >
      {icon}
      {!collapsed && <span>{children}</span>}
    </Link>
  );
}

// ─── Icon component ─────────────────────────────────────────────────────────────

function IconComponent({
  name,
  size,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon size={size ?? 18} className={className} />;
}

// ─── Locale helper ─────────────────────────────────────────────────────────────

function viEn(vi: string, _en: string): string {
  // Default to Vietnamese for admin panel
  return vi;
}
