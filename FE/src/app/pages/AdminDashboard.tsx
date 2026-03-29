// All 21 tab components are lazy-loaded to split the 598 KB AdminDashboard chunk.
// Each tab only loads its JS when the user first clicks its sidebar item.
import { lazy } from 'react';

const RevenueTab           = lazy(() => import('../components/admin/RevenueTab'));
const ClientsTab           = lazy(() => import('../components/admin/ClientsTab'));
const MembersTab           = lazy(() => import('../components/admin/MembersTab'));
const AcademyTab           = lazy(() => import('../components/admin/AcademyTab'));
const BlogTab              = lazy(() => import('../components/admin/BlogTab'));
const ServicesTab          = lazy(() => import('../components/admin/ServicesTab'));
const PortfolioTab         = lazy(() => import('../components/admin/PortfolioTab'));
const OrdersTab            = lazy(() => import('../components/admin/OrdersTab'));
const QuotationTab        = lazy(() => import('../components/admin/QuotationTab'));
const EffectsTab           = lazy(() => import('../components/admin/EffectsTab'));
const ProjectsCompletedTab = lazy(() => import('../components/admin/ProjectsCompletedTab'));
const KanbanHub            = lazy(() => import('../components/admin/KanbanHub'));
const DepartmentTab        = lazy(() => import('../components/admin/DepartmentTab'));
const LPManagementTab      = lazy(() => import('../components/admin/LPManagementTab'));
const IncomeTaxTab         = lazy(() => import('../components/admin/IncomeTaxTab'));
const WebPackagesTab       = lazy(() => import('../components/admin/WebPackagesTab'));
const MediaTab             = lazy(() => import('../components/admin/MediaTab'));
const NotificationCenter   = lazy(() => import('../components/admin/NotificationCenter'));
const QuestEventsTab       = lazy(() => import('../components/admin/QuestEventsTab'));
const AnalyticsTab         = lazy(() => import('../components/admin/AnalyticsTab'));
const ChatWidget           = lazy(() => import('../components/ui/ChatWidget'));
const LoadingScreen        = lazy(() => import('../components/ui/LoadingScreen'));
import { useAuthStore, canAccessTab, type AdminTab } from '../store/authStore';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Users, FolderKanban, Wallet, Settings,
  TrendingUp, ArrowUpRight, ArrowDownRight, Bell, Search,
  ChevronRight, Zap, Plus, LogOut, Globe,
  DollarSign, UserCheck, CheckCircle2, Clock, AlertCircle, X,
  BookOpen, FileText, BarChart3, Briefcase, Package, ShoppingCart,
  Sparkles, Receipt, FolderCheck, Menu, Building2, Calculator,
  Camera, Star, BarChart2,
} from 'lucide-react';
import { DS, GRD } from '../components/layout/ds';
import { members, RANKS } from '../components/team/memberData';
import { useLoopStore } from '../store/loopStore';
import { useIsMobile } from '../components/ui/use-mobile';
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications';
import { AdminLeaderboardTab } from '../components/admin/AdminLeaderboardTab';
import { useApi } from '../../hooks/useApi';
import { revenueService } from '../../api/revenue.service';

const fmtLP = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n);

// ── Animated number hook ──────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1400) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const t0 = Date.now();
    const frame = () => {
      const pct = Math.min((Date.now() - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - pct, 3);
      setVal(Math.round(target * ease));
      if (pct < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [target, duration]);
  return val;
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
const SIDEBAR_GROUPS = [
  { label: 'QUẢN LÝ',   items: [
    { id: 'overview',    icon: <LayoutDashboard size={16} />, label: 'Tổng quan' },
    { id: 'orders',      icon: <ShoppingCart size={16} />,    label: 'Đơn hàng',  badge: 'orders' },
    { id: 'members',     icon: <Users size={16} />,           label: 'Thành viên' },
    { id: 'departments', icon: <Building2 size={16} />,       label: 'Phòng ban' },
    { id: 'projects',    icon: <FolderKanban size={16} />,    label: 'Kanban' },
    { id: 'leaderboard_admin', icon: <BarChart2 size={16} />, label: 'Leaderboard LP' },
  ]},
  { label: 'SẢN PHẨM', items: [
    { id: 'services',  icon: <Briefcase size={16} />,       label: 'Dịch vụ' },
    { id: 'media',     icon: <Camera size={16} />,          label: 'Quản lý Media Booking', badge: 'media' },
    { id: 'quotation', icon: <Receipt size={16} />,          label: 'Báo giá' },
    { id: 'portfolio', icon: <Package size={16} />,          label: 'Portfolio' },
    { id: 'projects_completed', icon: <FolderCheck size={16} />, label: 'Dự án xong' },
    { id: 'academy',   icon: <BookOpen size={16} />,         label: 'Học viện' },
    { id: 'blog',      icon: <FileText size={16} />,         label: 'Blog' },
  ]},
  { label: 'TÀI CHÍNH', items: [
    { id: 'revenue',    icon: <DollarSign size={16} />,   label: 'Doanh thu' },
    { id: 'analytics',  icon: <BarChart2 size={16} />,    label: 'Phân tích & Báo cáo' },
    { id: 'clients',    icon: <UserCheck size={16} />,     label: 'Khách hàng' },
    { id: 'lp',         icon: <Wallet size={16} />,        label: 'Tài chính LP' },
    { id: 'lp_manage',  icon: <Zap size={16} />,           label: 'Quản lý LP' },
    { id: 'income_tax', icon: <Calculator size={16} />,    label: 'Thu nhập & Thuế' },
    { id: 'web_packages', icon: <Package size={16} />,    label: 'Gói Web' },
  ]},
  { label: 'HỆ THỐNG', items: [
    { id: 'effects',   icon: <Sparkles size={16} />,         label: 'Hiệu ứng rank' },
    { id: 'quests_events', icon: <Star size={16} />,         label: 'Nhiệm vụ & Sự kiện' },
    { id: 'notification_center', icon: <Bell size={16} />,  label: 'Trung tâm TB', badge: 'notif' },
    { id: 'settings',  icon: <Settings size={16} />,          label: 'Cài đặt' },
  ]},
];

function Sidebar({ active, onSelect, isOpen, onClose }: {
  active: string;
  onSelect: (id: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const isMobile = useIsMobile();
  const { orders, getUnreadAdminCount } = useLoopStore();
  const newOrders = orders.filter(o => o.status === 'paid').length;
  const unreadNotifs = getUnreadAdminCount();

  const getBadge = (badge?: string) => {
    if (badge === 'orders') return newOrders;
    if (badge === 'notif') return unreadNotifs;
    return 0;
  };

  const handleSelect = (id: string) => {
    onSelect(id);
    if (isMobile && onClose) onClose();
  };

  const inner = (
    <div className="flex flex-col" style={{ width: isMobile ? 280 : 224, background: DS.bgCard, borderRight: `1px solid ${DS.border}`, minHeight: '100vh', height: '100%' }}>
      {/* Logo */}
      <div className="p-5" style={{ borderBottom: `1px solid ${DS.border}` }}>
        <div className="flex items-center gap-3">
          {isMobile && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: DS.text4, padding: 4, marginRight: 2 }}>
              <X size={18} />
            </button>
          )}
          <motion.div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: GRD.primary }}
            animate={{ boxShadow: ['0 0 12px rgba(129,140,248,0.4)', '0 0 24px rgba(129,140,248,0.7)', '0 0 12px rgba(129,140,248,0.4)'] }}
            transition={{ duration: 3, repeat: Infinity }}>
            <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
              <path d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" fill="none"/>
              <path d="M20 8 L30 13.5 L30 25 L20 30.5 L10 25 L10 13.5 Z" fill="rgba(255,255,255,0.12)"/>
              <text x="20" y="25" textAnchor="middle" fontSize="14" fontWeight="900" fill="white" fontFamily="serif">∞</text>
            </svg>
          </motion.div>
          <div>
            <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: 12, fontWeight: 900, letterSpacing: '0.08em' }}>LOOP OS</div>
            <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.15em' }}>ADMIN PANEL</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto scrollbar-zen">
        {SIDEBAR_GROUPS.map(group => (
          <div key={group.label} className="mb-4">
            <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.2em', marginBottom: 6, marginLeft: 8 }}>
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const badgeCount = getBadge((item as any).badge);
                return (
                  <motion.button key={item.id} onClick={() => handleSelect(item.id)}
                    className="w-full flex items-center gap-3 px-3 rounded-xl text-left"
                    style={{ backgroundColor: active === item.id ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0)', border: active === item.id ? '1px solid rgba(59,130,246,0.25)' : '1px solid transparent', color: active === item.id ? DS.blue : DS.text3, fontSize: 13, cursor: 'pointer', minHeight: 44, paddingTop: 10, paddingBottom: 10 }}
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                    <span style={{ color: active === item.id ? DS.blue : DS.text4 }}>{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    {badgeCount > 0 && (
                      <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                        style={{ background: DS.red, color: '#fff', fontSize: 9, borderRadius: 10, padding: '1px 5px', fontFamily: DS.mono, boxShadow: `0 0 6px ${DS.red}` }}>
                        {badgeCount}
                      </motion.span>
                    )}
                    {active === item.id && <div className="w-1.5 h-1.5 rounded-full" style={{ background: DS.blue, boxShadow: `0 0 6px ${DS.blue}` }} />}
                  </motion.button>
                );
              })}
            </div>
          </div>
        ))}

        <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.2em', marginBottom: 8, marginLeft: 8, marginTop: 8 }}>ĐIỀU HƯỚNG</div>
        {[{ to: '/', icon: <Globe size={15} />, label: 'Trang chủ' },
          { to: '/khach-hang', icon: <UserCheck size={15} />, label: 'Customer Portal' },
          { to: '/nhan-vien', icon: <Users size={15} />, label: 'Staff Portal' },
          { to: '/bang-xep-hang', icon: <BarChart3 size={15} />, label: 'Bảng xếp hạng' },
        ].map(l => (
          <Link key={l.to} to={l.to} onClick={() => isMobile && onClose && onClose()} className="flex items-center gap-2.5 px-3 py-2 rounded-xl" style={{ color: DS.text4, fontSize: 12, textDecoration: 'none', minHeight: 40 }}>
            <span style={{ color: DS.text5 }}>{l.icon}</span>{l.label}
          </Link>
        ))}
      </nav>

      {/* Admin profile */}
      <div className="p-3" style={{ borderTop: `1px solid ${DS.border}` }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0" style={{ border: `1.5px solid ${RANKS.diamond.color}`, boxShadow: `0 0 10px ${RANKS.diamond.glowColor}` }}>
            <img src={members[6].img} alt="admin" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <div style={{ color: DS.text, fontSize: 12, fontWeight: 700 }}>Akira Sato</div>
            <div style={{ color: RANKS.diamond.color, fontSize: 9, fontFamily: DS.mono }}>✦ DIAMOND · ADMIN</div>
          </div>
          <button style={{ color: DS.text5, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 6 }}><LogOut size={13} /></button>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onClose}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 40, backdropFilter: 'blur(4px)' }}
            />
            <motion.div
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 50, overflowY: 'auto' }}>
              {inner}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return inner;
}

// ── Mobile Bottom Nav ──────────────────────────────────────────────────────────
function MobileBottomNav({ active, onSelect, onMenuOpen }: { active: string; onSelect: (id: string) => void; onMenuOpen: () => void }) {
  const { orders, getUnreadAdminCount } = useLoopStore();
  const newOrders = orders.filter(o => o.status === 'paid').length;
  const unread = getUnreadAdminCount();

  const ITEMS = [
    { id: 'overview',  icon: <LayoutDashboard size={20} />, label: 'Tổng quan', badge: 0 },
    { id: 'orders',    icon: <ShoppingCart size={20} />,    label: 'Đơn hàng',  badge: newOrders },
    { id: 'projects',  icon: <FolderKanban size={20} />,    label: 'Kanban',    badge: 0 },
    { id: 'revenue',   icon: <DollarSign size={20} />,      label: 'Doanh thu', badge: 0 },
  ];

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30, background: DS.bgCard, borderTop: `1px solid ${DS.border}`, paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
      <div className="flex">
        {ITEMS.map(item => (
          <button key={item.id} onClick={() => onSelect(item.id)}
            className="flex-1 flex flex-col items-center gap-0.5 relative"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: active === item.id ? DS.blue : DS.text4, padding: '10px 0 8px', minHeight: 56 }}>
            {active === item.id && (
              <motion.div layoutId="adminBottomIndicator" style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 32, height: 2, background: DS.blue, borderRadius: 1, boxShadow: `0 0 8px ${DS.blue}` }} />
            )}
            <span style={{ position: 'relative' }}>
              {item.icon}
              {item.badge > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -6, background: DS.red, color: '#fff', fontSize: 8, borderRadius: 8, padding: '0 3px', fontFamily: DS.mono, minWidth: 14, textAlign: 'center', boxShadow: `0 0 6px ${DS.red}` }}>{item.badge}</span>
              )}
            </span>
            <span style={{ fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.05em' }}>{item.label}</span>
          </button>
        ))}
        <button onClick={onMenuOpen}
          className="flex-1 flex flex-col items-center gap-0.5"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: DS.text4, padding: '10px 0 8px', minHeight: 56, position: 'relative' }}>
          {unread > 0 && (
            <span style={{ position: 'absolute', top: 8, right: 'calc(50% - 14px)', background: DS.red, color: '#fff', fontSize: 8, borderRadius: 8, padding: '0 3px', fontFamily: DS.mono, boxShadow: `0 0 6px ${DS.red}` }}>{unread}</span>
          )}
          <Menu size={20} />
          <span style={{ fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.05em' }}>Thêm</span>
        </button>
      </div>
    </div>
  );
}

// ── Top Bar ────────────────────────────────────────────────────────────────────
function TopBar({ tab, onSelect, onMenuToggle }: { tab: string; onSelect: (t: string) => void; onMenuToggle: () => void }) {
  const { getUnreadAdminCount, adminNotifications, markAllAdminNotifsRead } = useLoopStore();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const isMobile = useIsMobile();
  const unread = getUnreadAdminCount();

  const tabLabels: Record<string, string> = {
    overview: 'Tổng quan hệ thống', members: 'Quản lý thành viên', projects: 'Kanban dự án',
    revenue: 'Thống kê doanh thu', clients: 'Quản lý khách hàng', lp: 'Tài chính LP',
    notifications: 'Thông báo', settings: 'Cài đặt hệ thống',
    academy: 'Quản lý học viện', blog: 'Quản lý blog',
    services: 'Quản lý dịch vụ', portfolio: 'Quản lý portfolio dự án',
    orders: 'Quản lý đơn hàng & Demo',
    quotation: 'Quản lý báo giá',
    effects: 'Quản lý hiệu ứng rank',
    projects_completed: 'Quản lý dự án hoàn thành',
    departments: 'Quản lý phòng ban',
    lp_manage: 'Quản lý LP',
    income_tax: 'Thu nhập & Thuế',
    web_packages: 'Gói Web',
    media: 'Quản lý Media Booking',
    notification_center: 'Trung tâm thông báo',
    quests_events: 'Nhiệm vụ & Sự kiện',
    analytics: 'Phân tích & Báo cáo',
    leaderboard_admin: 'Leaderboard LP',
  };

  return (
    <div className="flex items-center justify-between h-14" style={{ background: DS.bgCard, borderBottom: `1px solid ${DS.border}`, padding: isMobile ? '0 12px' : '0 24px', flexShrink: 0 }}>
      <div className="flex items-center gap-3 min-w-0">
        <motion.button onClick={onMenuToggle}
          className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0"
          style={{ background: DS.bgCard2, border: `1px solid ${DS.border}`, cursor: 'pointer', color: DS.text3, display: isMobile ? 'flex' : 'none' }}
          whileHover={{ borderColor: DS.blue }}>
          <Menu size={17} />
        </motion.button>
        <div className="min-w-0">
          {!isMobile && <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.2em' }}>ADMIN DASHBOARD</div>}
          <div style={{ color: DS.text, fontSize: isMobile ? 13 : 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: isMobile ? 0 : 1 }}>{tabLabels[tab] ?? tab}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {!isMobile && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
            <Search size={14} style={{ color: DS.text4 }} />
            <input type="text" placeholder="Tìm kiếm..." style={{ background: 'none', border: 'none', outline: 'none', color: DS.text3, fontSize: 13, width: 160, fontFamily: DS.body }} />
          </div>
        )}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)' }}>
          <Zap size={11} style={{ color: DS.blue }} />
          <span style={{ color: DS.blue, fontSize: isMobile ? 11 : 12, fontFamily: DS.mono, fontWeight: 700 }}>{isMobile ? '820K' : '820K LP'}</span>
        </div>
        {/* Notification with dropdown */}
        <div style={{ position: 'relative' }}>
          <motion.button onClick={() => setShowNotifDropdown(v => !v)}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl"
            style={{ background: DS.bgCard2, border: `1px solid ${DS.border}`, cursor: 'pointer', color: DS.text3 }}
            whileHover={{ borderColor: DS.blue }}>
            <Bell size={15} />
            {unread > 0 && (
              <motion.div className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: DS.red, boxShadow: `0 0 8px ${DS.red}` }}
                animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <span style={{ color: '#fff', fontSize: 8, fontFamily: DS.mono }}>{unread}</span>
              </motion.div>
            )}
          </motion.button>
          <AnimatePresence>
            {showNotifDropdown && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                style={{ position: 'fixed', right: isMobile ? 8 : 'auto', top: 56, width: isMobile ? 'calc(100vw - 16px)' : 320, borderRadius: 16, overflow: 'hidden', zIndex: 50, background: DS.bgCard, border: `1px solid ${DS.border}`, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${DS.border}` }}>
                  <span style={{ color: DS.text, fontSize: 13, fontWeight: 700 }}>Thông báo ({unread} mới)</span>
                  <button onClick={() => { markAllAdminNotifsRead(); setShowNotifDropdown(false); onSelect('notifications'); }}
                    style={{ color: DS.blue, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11 }}>
                    Xem tất cả
                  </button>
                </div>
                <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                  {adminNotifications.slice(0, 5).map(n => (
                    <div key={n.id}
                      onClick={() => { if (n.relatedOrderId) { onSelect('orders'); } setShowNotifDropdown(false); }}
                      className="flex gap-3 px-4 py-3 cursor-pointer"
                      style={{ background: n.read ? 'none' : `${n.color}06`, borderBottom: `1px solid ${DS.border}` }}>
                      <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                        style={{ background: n.read ? DS.text5 : n.color, boxShadow: n.read ? 'none' : `0 0 4px ${n.color}` }} />
                      <div className="flex-1 min-w-0">
                        <div style={{ color: n.read ? DS.text3 : DS.text, fontSize: 12, fontWeight: n.read ? 400 : 700, marginBottom: 2 }}>{n.title}</div>
                        <div style={{ color: DS.text5, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</div>
                        <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginTop: 2 }}>{n.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ── Animated StatCard ────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon, trend, trendUp }: {
  label: string; value: string; sub?: string; color: string;
  icon: React.ReactNode; trend?: string; trendUp?: boolean;
}) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <motion.div ref={ref} className="rounded-2xl p-5 relative overflow-hidden"
      style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ borderColor: `${color}40`, boxShadow: `0 0 24px ${color}12` }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at top right, ${color}06, transparent 60%)` }} />
      <div className="flex items-start justify-between mb-4">
        <motion.div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15`, border: `1px solid ${color}25` }}
          animate={inView ? { boxShadow: [`0 0 0px ${color}00`, `0 0 14px ${color}50`, `0 0 0px ${color}00`] } : {}}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}>
          <span style={{ color }}>{icon}</span>
        </motion.div>
        {trend && (
          <div className="flex items-center gap-1" style={{ color: trendUp ? DS.green : DS.red, fontSize: 12 }}>
            {trendUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {trend}
          </div>
        )}
      </div>
      <div style={{ color, fontFamily: DS.heading, fontSize: 26, fontWeight: 700, textShadow: `0 0 12px ${color}50`, lineHeight: 1 }}>{value}</div>
      <div style={{ color: DS.text3, fontSize: 13, marginTop: 6 }}>{label}</div>
      {sub && <div style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, marginTop: 3 }}>{sub}</div>}
      <motion.div className="absolute bottom-0 left-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
        initial={{ width: '0%' }} animate={{ width: inView ? '100%' : '0%' }}
        transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }} />
    </motion.div>
  );
}

// ── OVERVIEW TAB ──────────────────────────────────────────────────────────
function OverviewTab() {
  const { orders } = useLoopStore();

  // Real API data — falls back to store orders when BE is unavailable
  const { data: dashboard, loading: dashLoading } = useApi(
    () => revenueService.getDashboard(),
    [],
  );

  const apiStats = dashboard?.stats;
  const apiRecentOrders = dashboard?.recentOrders ?? [];

  const totalRevenue = apiStats
    ? apiRecentOrders
        .filter((o) => o.status !== 'pending_payment')
        .reduce((s, o) => s + o.totalAmount, 0)
    : orders.filter((o) => o.status !== 'pending_payment' && o.status !== 'cancelled').reduce((s, o) => s + o.budget, 0);

  const activeCount = apiStats
    ? apiRecentOrders.filter((o) => o.status === 'in_progress' || o.status === 'demo_ready').length
    : orders.filter((o) => o.status === 'in_progress' || o.status === 'demo_ready').length;

  const newPaid = apiStats
    ? apiRecentOrders.filter((o) => o.status === 'paid').length
    : orders.filter((o) => o.status === 'paid').length;

  const kpis = [
    { label: 'Doanh thu Q1/2026', value: `${(totalRevenue / 1_000_000).toFixed(0)}M`, sub: dashLoading ? '...' : '↑ 28% so Q4/2025 (VNĐ)', color: DS.blue, icon: <DollarSign size={18} />, trend: '+28%', trendUp: true },
    { label: 'Đơn hàng đang làm', value: String(activeCount), sub: dashLoading ? '...' : `${newPaid} đơn mới cần phân công`, color: DS.purple, icon: <ShoppingCart size={18} />, trend: `+${newPaid}`, trendUp: true },
    { label: 'Thành viên tích cực', value: String(apiStats?.totalUsers ?? 27), sub: 'Season III · Full team', color: DS.cyan, icon: <Users size={18} />, trend: '100%', trendUp: true },
    { label: 'LP phát hành T3', value: '35.2K', sub: 'Điểm thưởng nội bộ', color: DS.amber, icon: <Zap size={18} />, trend: '+22%', trendUp: true },
  ];

  const recentActivities = [
    { user: 'Rin Nakamura', action: 'hoàn thành task', detail: '10x Performance Refactor · 25K LP', time: '2 phút trước', rank: 'ruby', type: 'done' },
    { user: 'Akira Sato', action: 'phê duyệt dự án', detail: 'Platform Architecture Overhaul · 80K LP', time: '15 phút trước', rank: 'diamond', type: 'approve' },
    { user: 'Yuna Park', action: 'lên cấp Level 69', detail: 'Gold Rank · Tổng LP: 65K', time: '1 giờ trước', rank: 'gold', type: 'levelup' },
    { user: 'Shin Watanabe', action: 'nộp báo cáo', detail: 'Observability Stack Setup · 10K LP', time: '2 giờ trước', rank: 'platinum', type: 'report' },
    { user: 'Nguyễn Minh Tuấn', action: 'booking dịch vụ', detail: 'VNRetail Platform v3 · 175M VNĐ', time: '4 giờ trước', rank: 'gold', type: 'booking' },
  ];

  // Use real API orders when available, fall back to store orders
  const displayOrders = apiRecentOrders.length > 0
    ? apiRecentOrders.map(o => ({
        name: o.package?.title ?? o.orderNumber ?? o.id,
        client: o.customerName,
        progress: 50,
        status: o.status === 'done' ? 'ahead'
          : o.status === 'in_progress' || o.status === 'demo_ready' || o.status === 'client_review' ? 'on-track'
          : 'at-risk',
        pm: '—',
        deadline: '—',
      }))
    : orders.filter(o => ['in_progress','demo_ready','client_review'].includes(o.status)).slice(0, 5).map(o => ({
      name: o.title, client: o.clientCompany, progress: o.progress,
      status: o.progress >= 90 ? 'ahead' : o.progress < 30 ? 'at-risk' : 'on-track',
      pm: o.assignedPM ?? '—', deadline: o.deadline ?? '—',
    }));

  const statusCfg: Record<string, { label: string; color: string }> = {
    'on-track': { label: 'Đúng tiến độ', color: DS.green },
    'at-risk': { label: 'Có rủi ro', color: DS.amber },
    'ahead': { label: 'Vượt kế hoạch', color: DS.blue },
  };

  const actTypeIcon = (t: string) => {
    if (t === 'done') return <CheckCircle2 size={13} />;
    if (t === 'levelup') return <TrendingUp size={13} />;
    if (t === 'booking') return <DollarSign size={13} />;
    return <Clock size={13} />;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {kpis.map((k) => <StatCard key={k.label} {...k} />)}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Projects */}
        <div className="xl:col-span-2 rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <div className="flex items-center justify-between mb-5">
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em' }}>── DỰ ÁN ĐANG THỰC HIỆN</div>
            <button style={{ color: DS.blue, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: DS.mono, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={13} /> Thêm mới
            </button>
          </div>
          <div className="space-y-3">
            {displayOrders.map((p) => {
              const sc = statusCfg[p.status];
              const pm = members.find(m => m.name.includes(p.pm.split(' ')[0]));
              return (
                <div key={p.name} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                  {pm && (
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0" style={{ border: `1px solid ${RANKS[pm.rank].color}60` }}>
                      <img src={pm.img} alt={pm.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div style={{ color: DS.text, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ color: DS.text4, fontSize: 11, marginTop: 2 }}>{p.client} · PM: {p.pm}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 rounded-full overflow-hidden" style={{ height: 4, background: DS.border }}>
                        <motion.div
                          style={{ height: '100%', borderRadius: 4, background: p.progress > 80 ? DS.green : p.progress > 50 ? DS.blue : DS.amber }}
                          initial={{ width: '0%' }}
                          animate={{ width: `${p.progress}%` }}
                          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.1 }}
                        />
                      </div>
                      <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, flexShrink: 0 }}>{p.progress}%</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div style={{ color: sc.color, fontSize: 10, fontFamily: DS.mono, padding: '2px 8px', borderRadius: 4, background: `${sc.color}15`, border: `1px solid ${sc.color}30` }}>{sc.label}</div>
                    <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginTop: 4 }}>{p.deadline}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity feed */}
        <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 16 }}>── HOẠT ĐỘNG GẦN ĐÂY</div>
          <div className="space-y-3">
            {recentActivities.map((a, i) => {
              const rc = RANKS[a.rank as keyof typeof RANKS];
              const m = members.find(mm => mm.name.includes(a.user.split(' ')[0]));
              return (
                <div key={i} className="flex gap-3">
                  <div style={{ width: 30, height: 30, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: `1.5px solid ${rc.color}60` }}>
                    {m ? <img src={m.img} alt={m.name} className="w-full h-full object-cover" /> : <div style={{ width: '100%', height: '100%', background: `${rc.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: rc.color, fontSize: 10 }}>{actTypeIcon(a.type)}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ color: DS.text2, fontSize: 12, lineHeight: 1.4 }}>
                      <span style={{ color: rc.color, fontWeight: 700 }}>{a.user}</span>{' '}
                      <span style={{ color: DS.text4 }}>{a.action}</span>
                    </div>
                    <div style={{ color: DS.text5, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.detail}</div>
                    <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginTop: 2 }}>{a.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── LP FINANCE TAB ─────────────────────────────────────────────────────────
function LPFinanceTab() {
  const transactions = [
    { user: 'Akira Sato', type: 'earn', detail: 'Platform Architecture Overhaul', amount: 80000, date: '16/03', rank: 'diamond' },
    { user: 'Rin Nakamura', type: 'earn', detail: 'Distributed Cache System', amount: 20000, date: '13/03', rank: 'ruby' },
    { user: 'Shin Watanabe', type: 'spend', detail: 'Đổi LP → Thưởng tháng 3', amount: -15000, date: '12/03', rank: 'platinum' },
    { user: 'Yuna Park', type: 'earn', detail: 'E-commerce Platform v3', amount: 3000, date: '14/03', rank: 'gold' },
    { user: 'Ryo Hashimoto', type: 'earn', detail: 'Cache Layer Migration', amount: 900, date: '05/03', rank: 'silver' },
    { user: 'Mei Lin', type: 'spend', detail: 'Giảm giá hóa đơn khách hàng', amount: -500, date: '08/03', rank: 'bronze' },
  ];
  const lpStats = [
    { label: 'LP Tổng phát hành', value: fmtLP(3_200_000), color: DS.blue, sub: 'All time' },
    { label: 'LP Đang lưu thông', value: fmtLP(members.reduce((s, m) => s + m.lpBalance, 0)), color: DS.cyan, sub: 'Season III' },
    { label: 'LP Đã đổi', value: fmtLP(820_000), color: DS.green, sub: 'Mùa này' },
    { label: 'Rate: 1,000 LP', value: '500K VNĐ', color: DS.amber, sub: 'Giảm giá tối đa 20%' },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {lpStats.map((s) => (
          <div key={s.label} className="p-5 rounded-2xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 8 }}>{s.label}</div>
            <div style={{ color: s.color, fontFamily: DS.heading, fontSize: 22, fontWeight: 700, textShadow: `0 0 12px ${s.color}50` }}>{s.value}</div>
            <div style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 16 }}>── LP THEO THÀNH VIÊN</div>
          <div className="space-y-3">
            {[...members].sort((a, b) => b.lpBalance - a.lpBalance).map((m) => {
              const rc = RANKS[m.rank];
              const maxLP = Math.max(...members.map(mm => mm.lpBalance));
              return (
                <div key={m.id} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0" style={{ border: `1px solid ${rc.color}60` }}>
                    <img src={m.img} alt={m.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ color: DS.text2, fontSize: 12, fontWeight: 600 }}>{m.name}</span>
                      <span style={{ color: rc.color, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>{fmtLP(m.lpBalance)}</span>
                    </div>
                    <div className="rounded-full overflow-hidden" style={{ height: 3, background: DS.border }}>
                      <motion.div
                        style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${rc.gradientFrom}, ${rc.gradientTo})` }}
                        initial={{ width: '0%' }}
                        animate={{ width: `${(m.lpBalance / maxLP) * 100}%` }}
                        transition={{ duration: 1.4, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 16 }}>── GIAO DỊCH GẦN ĐÂY</div>
          <div className="space-y-2">
            {transactions.map((tx, i) => {
              const rc = RANKS[tx.rank as keyof typeof RANKS];
              const m = members.find(mm => mm.name.includes(tx.user.split(' ')[0]));
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: tx.type === 'earn' ? DS.green : DS.red }} />
                  {m && <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0" style={{ border: `1px solid ${rc.color}60` }}><img src={m.img} alt={m.name} className="w-full h-full object-cover" /></div>}
                  <div className="flex-1 min-w-0">
                    <div style={{ color: rc.color, fontSize: 11, fontWeight: 700 }}>{tx.user}</div>
                    <div style={{ color: DS.text4, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.detail}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div style={{ color: tx.type === 'earn' ? DS.green : DS.red, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>
                      {tx.type === 'earn' ? '+' : ''}{fmtLP(Math.abs(tx.amount))} LP
                    </div>
                    <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{tx.date}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <button className="w-full mt-4 py-2.5 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: DS.blue, fontSize: 12, fontFamily: DS.mono, cursor: 'pointer' }}>
            PHÂN PHỐI LP MỚI +
          </button>
        </div>
      </div>
    </div>
  );
}

// ── NOTIFICATIONS TAB ──────────────────────────────────────────────────────
function NotificationsTab() {
  const { adminNotifications, markAdminNotifRead, markAllAdminNotifsRead, deleteAdminNotif } = useLoopStore();
  const unread = adminNotifications.filter(n => !n.read).length;

  const typeIconMap: Record<string, React.ReactNode> = {
    new_order: <Plus size={14} />,
    payment: <DollarSign size={14} />,
    client_message: <AlertCircle size={14} />,
    task: <Clock size={14} />,
    lp: <Zap size={14} />,
    review: <CheckCircle2 size={14} />,
    system: <BarChart3 size={14} />,
  };

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em' }}>── THÔNG BÁO HỆ THỐNG ({unread} chưa đọc)</div>
        <button onClick={markAllAdminNotifsRead} style={{ color: DS.blue, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: DS.mono }}>
          Đánh dấu tất cả đã đọc
        </button>
      </div>
      {adminNotifications.map((n, i) => (
        <motion.div key={n.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
          className="flex items-start gap-4 p-4 rounded-2xl cursor-pointer"
          style={{ background: n.read ? DS.bgCard : `${n.color}08`, border: `1px solid ${n.read ? DS.border : n.color + '30'}` }}
          whileHover={{ borderColor: `${n.color}50`, backgroundColor: `${n.color}06` }}
          onClick={() => markAdminNotifRead(n.id)}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${n.color}15`, border: `1px solid ${n.color}30` }}>
            <span style={{ color: n.color }}>{typeIconMap[n.type] ?? <Clock size={14} />}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span style={{ color: n.read ? DS.text2 : DS.text, fontSize: 13, fontWeight: n.read ? 500 : 700 }}>{n.title}</span>
              {!n.read && <motion.div className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: n.color, boxShadow: `0 0 4px ${n.color}` }}
                animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />}
            </div>
            <p style={{ color: DS.text4, fontSize: 12, lineHeight: 1.6 }}>{n.body}</p>
            <div style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, marginTop: 6 }}>{n.time}</div>
          </div>
          <button onClick={e => { e.stopPropagation(); deleteAdminNotif(n.id); }} style={{ color: DS.text5, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
            <X size={14} />
          </button>
        </motion.div>
      ))}
    </div>
  );
}

// ── SETTINGS TAB ───────────────────────────────────────────────────────────
function SettingsTab() {
  const [lpRate, setLpRate] = useState('500');
  const [seasonName, setSeasonName] = useState('Season III');
  const [notifications, setNotifications] = useState(true);
  const [autoRankUp, setAutoRankUp] = useState(true);
  const [darkMode] = useState(true);

  const toggle = (val: boolean, set: (v: boolean) => void) => (
    <button onClick={() => set(!val)} className="w-12 h-6 rounded-full relative" style={{ background: val ? DS.blue : DS.border, border: 'none', cursor: 'pointer', flexShrink: 0 }}>
      <div className="absolute top-0.5 w-5 h-5 rounded-full" style={{ background: '#fff', left: val ? 'calc(100% - 22px)' : 2, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
    </button>
  );

  return (
    <div className="max-w-2xl space-y-5">
      <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em' }}>── CÀI ĐẶT HỆ THỐNG</div>
      <div className="rounded-2xl p-6" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
        <div style={{ color: DS.text2, fontSize: 15, fontWeight: 700, marginBottom: 20 }}>◈ Hệ thống LP</div>
        <div className="space-y-5">
          <div>
            <label style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, display: 'block', marginBottom: 8 }}>TỶ GIÁ: 1,000 LP = ? VNĐ (Giảm giá)</label>
            <div className="flex items-center gap-3">
              <input type="number" value={lpRate} onChange={e => setLpRate(e.target.value)} style={{ flex: 1, background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px 14px', color: DS.text, fontSize: 14, outline: 'none' }} />
              <span style={{ color: DS.text3, fontSize: 13 }}>VNĐ / 1,000 LP</span>
            </div>
          </div>
          <div>
            <label style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, display: 'block', marginBottom: 8 }}>TÊN SEASON</label>
            <input value={seasonName} onChange={e => setSeasonName(e.target.value)} style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px 14px', color: DS.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>
      </div>
      <div className="rounded-2xl p-6" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
        <div style={{ color: DS.text2, fontSize: 15, fontWeight: 700, marginBottom: 20 }}>⚙️ Tuỳ chọn hệ thống</div>
        <div className="space-y-5">
          {[
            { label: 'Thông báo khi thành viên lên rank', desc: 'Email + in-app', val: notifications, set: setNotifications },
            { label: 'Tự động thăng hạng LP đủ điều kiện', desc: 'Cập nhật rank tự động', val: autoRankUp, set: setAutoRankUp },
            { label: 'Dark mode bắt buộc', desc: 'Asian Tech-Zen theme', val: darkMode, set: () => {} },
          ].map(({ label, desc, val, set }) => (
            <div key={label} className="flex items-center justify-between">
              <div>
                <div style={{ color: DS.text, fontSize: 13, fontWeight: 600 }}>{label}</div>
                <div style={{ color: DS.text4, fontSize: 12, marginTop: 2 }}>{desc}</div>
              </div>
              {toggle(val, set)}
            </div>
          ))}
        </div>
      </div>
      <button style={{ background: GRD.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', cursor: 'pointer', fontSize: 14, fontWeight: 600, boxShadow: '0 0 20px rgba(129,140,248,0.35)' }}>
        Lưu thay đổi
      </button>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  // Real-time notifications simulation
  useRealtimeNotifications(28_000);

  const tabContent: Record<string, React.ReactNode> = {
    overview: <OverviewTab />,
    members: <MembersTab />,
    departments: <DepartmentTab />,
    projects: <KanbanHub />,
    revenue: <RevenueTab />,
    analytics: <AnalyticsTab />,
    clients: <ClientsTab />,
    lp: <LPFinanceTab />,
    lp_manage: <LPManagementTab />,
    income_tax: <IncomeTaxTab />,
    notifications: <NotificationsTab />,
    settings: <SettingsTab />,
    academy: <AcademyTab />,
    blog: <BlogTab />,
    services: <ServicesTab />,
    portfolio: <PortfolioTab />,
    orders: <OrdersTab />,
    quotation: <QuotationTab />,
    effects: <EffectsTab />,
    projects_completed: <ProjectsCompletedTab />,
    web_packages: <WebPackagesTab />,
    media: <MediaTab />,
    notification_center: <NotificationCenter />,
    quests_events: <QuestEventsTab />,
    leaderboard_admin: <AdminLeaderboardTab />,
    chat_widget: <ChatWidget />,
    loading_screen: <LoadingScreen />,
  };

  return (
    <div style={{ background: DS.bg, minHeight: '100vh', fontFamily: DS.body }}>
      {/* Desktop sidebar — fixed */}
      {!isMobile && (
        <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 20, overflowY: 'auto' }}>
          <Sidebar active={activeTab} onSelect={setActiveTab} />
        </div>
      )}
      {/* Mobile sidebar — overlay drawer */}
      {isMobile && (
        <Sidebar active={activeTab} onSelect={setActiveTab} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}

      {/* Main content area */}
      <div className="flex flex-col" style={{ marginLeft: isMobile ? 0 : 224, minHeight: '100vh' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 15 }}>
          <TopBar tab={activeTab} onSelect={setActiveTab} onMenuToggle={() => setSidebarOpen(v => !v)} />
        </div>
        <div className="flex-1 overflow-auto" style={{ padding: isMobile ? '14px 12px' : '24px', paddingBottom: isMobile ? 88 : 24 }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              style={{ height: activeTab === 'orders' ? '100%' : 'auto' }}>
              {tabContent[activeTab]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile bottom navigation bar */}
      {isMobile && (
        <MobileBottomNav
          active={activeTab}
          onSelect={setActiveTab}
          onMenuOpen={() => setSidebarOpen(true)}
        />
      )}

      {/* Floating Chat Widget */}
      <ChatWidget isAdmin={true} />
    </div>
  );
}