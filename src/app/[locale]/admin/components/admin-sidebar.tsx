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
  Video,
  Coins,
  Lock,
  Image,
  Server,
} from "lucide-react";
import { useAdminAuth } from "@/app/[locale]/admin/components/admin-auth-provider";
import { NAV_PERMISSIONS, ROLE_LEVEL } from "@/lib/auth/roles";
import { cn } from "@/components/ui/utils";

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};
type NavGroup = { group: string; items: NavItem[] };
type NavEntry = NavItem | NavGroup;

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
  const cfg = NAV_PERMISSIONS[href];
  if (!cfg) return true; // no restriction defined → allow
  if (cfg.minRoleLevel !== undefined && userRoleLevel > cfg.minRoleLevel) return false;
  return true;
}

// ─── Sidebar ────────────────────────────────────────────────────────────────

export function AdminSidebar() {
  const { user } = useAdminAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const userLevel = user ? ROLE_LEVEL[user.role] ?? 99 : 99;

  // Filter nav items
  const filteredNav = navigation.map((entry) => {
    if ("href" in entry) {
      // Standalone nav item
      if (!canAccessNav(userLevel, entry.href)) return null;
      return entry;
    }
    // Group
    const visibleItems = entry.items.filter((item) => canAccessNav(userLevel, item.href));
    if (visibleItems.length === 0) return null;
    return { ...entry, items: visibleItems };
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
          <Link href="/vi/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
              L
            </div>
            <span className="text-lg font-bold text-white">LOOP</span>
            <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
              Admin
            </span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors",
            collapsed && "mx-auto"
          )}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Role badge */}
      {!collapsed && user && (
        <div className="border-b border-slate-800 px-4 py-2">
          <div className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2">
            <Lock size={12} className="text-slate-500 shrink-0" />
            <span className="text-xs text-slate-400 truncate">{user.role || "member"}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="h-[calc(100vh-8rem)] overflow-y-auto px-3 py-3">
        {filteredNav.map((item, i) => {
          // Standalone nav item (Dashboard)
          if ("href" in item) {
            const navItem = item;
            const isActive = pathname === navItem.href;
            return (
              <Link
                key={navItem.href}
                href={navItem.href}
                className={cn(
                  "mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-600/20 text-blue-400"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                )}
                title={collapsed ? navItem.name : undefined}
              >
                <navItem.icon size={20} className="shrink-0" />
                {!collapsed && <span>{navItem.name}</span>}
              </Link>
            );
          }

          // Group
          const groupItem = item as NavGroup;
          return (
            <div key={groupItem.group} className={cn(i > 0 && "mt-5")}>
              {!collapsed && (
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {groupItem.group}
                </p>
              )}
              {collapsed && <div className="mb-2 border-t border-slate-800 pt-4" />}
              {groupItem.items.map((subItem) => {
                const isActive =
                  pathname === subItem.href ||
                  (subItem.href !== "/admin" && pathname.startsWith(subItem.href));
                return (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    className={cn(
                      "mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-600/20 text-blue-400"
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                    )}
                    title={collapsed ? subItem.name : undefined}
                  >
                    <subItem.icon size={18} className="shrink-0" />
                    {!collapsed && <span>{subItem.name}</span>}
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
