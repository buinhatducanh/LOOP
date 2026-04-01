import { useState, useRef } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home, FolderKanban, Wallet, Users, Settings, Bell, LogOut,
  ChevronRight, ChevronDown, Copy, Check, Zap, Gift, Star,
  FileText, MessageSquare, ArrowUpRight, ArrowDownRight,
  Plus, ExternalLink, Download, Send, Clock, CheckCircle2,
  AlertCircle, XCircle, TrendingUp, BarChart3, Shield,
  Phone, Mail, Building2, User, Globe, Lock, CreditCard,
  BookOpen, Play, Award, Monitor, Package, Menu, X, Sparkles,
  Camera,
} from 'lucide-react';
import { motion as m } from 'motion/react';
import { DS, GRD } from '../components/layout/ds';
import { members, RANKS } from '../components/team/memberData';
import { useLoopStore } from '../store/loopStore';
import { useAuthStore } from '../store/authStore';
import { DemoViewer } from '../components/ui/DemoViewer';
import { EffectsInventoryTab } from '../components/customer/EffectsInventoryTab';
import { QuestsTab } from '../components/customer/QuestsTab';
import { ChatWidget } from '../components/ui/ChatWidget';
import { useIsMobile } from '../components/ui/use-mobile';

// ── Build dynamic customer profile from AuthStore ─────────────────────────
function useCustomerProfile() {
  const { user } = useAuthStore();
  const defaultProfile = {
    name: 'Nguyễn Minh Tuấn',
    shortName: 'Minh Tuấn',
    company: 'TechViet JSC',
    email: 'minhtuan@techviet.vn',
    phone: '0912 345 678',
    avatar: 'https://images.unsplash.com/photo-1746105625407-5d49d69a2a47?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    rank: 'gold' as const,
    level: 12,
    xpPct: 72,
    lpBalance: 15_200,
    lpEarned: 65_000,
    lpSpent: 49_800,
    referralCode: 'LOOP-NMT-7X2K',
    memberSince: '09/2024',
    totalProjects: 6,
    totalSpent: 485_000_000,
  };
  if (!user) return defaultProfile;
  return {
    name: user.name,
    shortName: user.shortName,
    company: user.department ? `${user.department.toUpperCase()} Dept.` : 'Khách hàng LOOP',
    email: user.email,
    phone: '0912 345 678',
    avatar: user.avatar,
    rank: (user.rank ?? 'gold') as typeof defaultProfile.rank,
    level: user.level,
    xpPct: Math.round((user.level % 20) * 5),
    lpBalance: user.lpBalance,
    lpEarned: Math.round(user.lpBalance * 4.2),
    lpSpent: Math.round(user.lpBalance * 3.2),
    referralCode: `LOOP-${user.shortName.toUpperCase().slice(0, 3)}-${user.id.slice(-4).toUpperCase()}`,
    memberSince: '09/2024',
    totalProjects: 6,
    totalSpent: 485_000_000,
  };
}

const fmtVND = (n: number) =>
  n >= 1_000_000_000 ? `${(n / 1_000_000_000).toFixed(1)}B`
  : n >= 1_000_000 ? `${(n / 1_000_000).toFixed(0)}M`
  : `${(n / 1_000).toFixed(0)}K`;

const fmtLP = (n: number) => n.toLocaleString('vi-VN');

// ── Sidebar ───────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'home',     icon: <Home size={16} />,        label: 'Tổng quan' },
  { id: 'projects', icon: <FolderKanban size={16} />, label: 'Dự án' },
  { id: 'media',    icon: <Camera size={16} />,       label: 'Media Booking' },
  { id: 'courses',  icon: <BookOpen size={16} />,     label: 'Khóa học', badge: 1 },
  { id: 'effects',  icon: <Sparkles size={16} />,     label: 'Kho hiệu ứng' },
  { id: 'quests',   icon: <Star size={16} />,          label: 'Nhiệm vụ' },
  { id: 'invoices', icon: <FileText size={16} />,     label: 'Hóa đơn', badge: 1 },
  { id: 'lp',       icon: <Wallet size={16} />,       label: 'Ví LP' },
  { id: 'referral', icon: <Gift size={16} />,          label: 'Giới thiệu' },
  { id: 'support',  icon: <MessageSquare size={16} />, label: 'Hỗ trợ', badge: 2 },
  { id: 'settings', icon: <Settings size={16} />,      label: 'Cài đặt' },
];

function Sidebar({ active, onSelect, isOpen, onClose }: { active: string; onSelect: (s: string) => void; isOpen?: boolean; onClose?: () => void }) {
  const isMobile = useIsMobile();
  const CUSTOMER = useCustomerProfile();
  const GLD = RANKS[CUSTOMER.rank] ?? RANKS['gold'];

  const handleSelect = (id: string) => {
    onSelect(id);
    if (isMobile && onClose) onClose();
  };

  const inner = (
    <div className="flex flex-col flex-shrink-0" style={{ width: isMobile ? 280 : 230, background: DS.bgCard, borderRight: `1px solid ${DS.border}`, minHeight: '100vh', height: '100%' }}>
      {/* Logo */}
      <div className="p-5 flex items-center gap-3" style={{ borderBottom: `1px solid ${DS.border}` }}>
        {isMobile && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: DS.text4, padding: 4, marginRight: 2 }}>
            <X size={18} />
          </button>
        )}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: GRD.primary, boxShadow: '0 0 16px rgba(129,140,248,0.5)' }}>
          <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
            <path d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" fill="none"/>
            <path d="M20 8 L30 13.5 L30 25 L20 30.5 L10 25 L10 13.5 Z" fill="rgba(255,255,255,0.12)"/>
            <text x="20" y="25" textAnchor="middle" fontSize="14" fontWeight="900" fill="white" fontFamily="serif">∞</text>
          </svg>
        </div>
        <div>
          <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: 12, fontWeight: 900, letterSpacing: '0.08em' }}>LOOP OS</div>
          <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.15em' }}>CLIENT PORTAL</div>
        </div>
      </div>

      {/* Membership card mini */}
      <div className="mx-3 mt-3 p-3 rounded-xl relative overflow-hidden" style={{ background: `linear-gradient(135deg, rgba(212,175,55,0.12), rgba(245,158,11,0.06))`, border: `1px solid ${GLD.color}30` }}>
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0" style={{ border: `1.5px solid ${GLD.color}`, boxShadow: `0 0 12px ${GLD.glowColor}` }}>
            <img src={CUSTOMER.avatar} alt={CUSTOMER.name} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <div style={{ color: DS.text, fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{CUSTOMER.shortName}</div>
            <div style={{ color: GLD.color, fontSize: 9, fontFamily: DS.mono }}>{GLD.symbol} GOLD · Lv.{CUSTOMER.level}</div>
          </div>
        </div>
        <div className="mt-2.5">
          <div className="flex justify-between mb-1">
            <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>LP BALANCE</span>
            <span style={{ color: GLD.color, fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>{fmtLP(CUSTOMER.lpBalance)}</span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: 3, background: DS.border }}>
            <div style={{ height: '100%', width: `${CUSTOMER.xpPct}%`, background: `linear-gradient(90deg, ${GLD.gradientFrom}, ${GLD.gradientTo})`, borderRadius: 99 }} />
          </div>
          <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, marginTop: 3 }}>XP {CUSTOMER.xpPct}% · Lv.12→13</div>
        </div>
        <div style={{ position: 'absolute', top: -10, right: -10, width: 50, height: 50, borderRadius: '50%', background: `${GLD.color}08` }} />
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 mt-2">
        <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.2em', marginBottom: 8, marginLeft: 8 }}>ĐIỀU HƯỚNG</div>
        <div className="space-y-0.5">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => handleSelect(item.id)}
              className="w-full flex items-center gap-3 px-3 rounded-xl text-left"
              style={{ background: active === item.id ? 'rgba(59,130,246,0.12)' : 'rgba(0,0,0,0)', border: active === item.id ? '1px solid rgba(59,130,246,0.22)' : '1px solid transparent', color: active === item.id ? DS.blue : DS.text3, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s', minHeight: 44, paddingTop: 10, paddingBottom: 10 }}>
              <span style={{ color: active === item.id ? DS.blue : DS.text4 }}>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge && <span style={{ background: DS.red, color: '#fff', fontSize: 9, borderRadius: 10, padding: '1px 6px', fontFamily: DS.mono }}>{item.badge}</span>}
              {active === item.id && <div className="w-1.5 h-1.5 rounded-full" style={{ background: DS.blue, boxShadow: `0 0 6px ${DS.blue}` }} />}
            </button>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3" style={{ borderTop: `1px solid ${DS.border}` }}>
        <Link to="/" onClick={() => isMobile && onClose && onClose()} className="flex items-center gap-2.5 px-3 py-2 rounded-xl" style={{ color: DS.text4, fontSize: 12, textDecoration: 'none', minHeight: 40 }}>
          <Globe size={14} style={{ color: DS.text5 }} /> Trang chủ
        </Link>
        <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl mt-0.5" style={{ background: 'none', border: 'none', color: DS.text4, fontSize: 12, cursor: 'pointer', textAlign: 'left', minHeight: 40 }}>
          <LogOut size={14} style={{ color: DS.text5 }} /> Đăng xuất
        </button>
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

// ── Mobile bottom nav for Customer ─────────────────────────────────────────────
function CustomerMobileBottomNav({ active, onSelect, onMenuOpen }: { active: string; onSelect: (id: string) => void; onMenuOpen: () => void }) {
  const ITEMS = [
    { id: 'home',     icon: <Home size={20} />,        label: 'Tổng quan', badge: 0 },
    { id: 'projects', icon: <FolderKanban size={20} />, label: 'Dự án',    badge: 0 },
    { id: 'courses',  icon: <BookOpen size={20} />,     label: 'Học viện', badge: 1 },
    { id: 'lp',       icon: <Wallet size={20} />,       label: 'Ví LP',    badge: 0 },
  ];

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30, background: DS.bgCard, borderTop: `1px solid ${DS.border}`, paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
      <div className="flex">
        {ITEMS.map(item => (
          <button key={item.id} onClick={() => onSelect(item.id)}
            className="flex-1 flex flex-col items-center gap-0.5 relative"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: active === item.id ? GLD.color : DS.text4, padding: '10px 0 8px', minHeight: 56 }}>
            {active === item.id && (
              <motion.div layoutId="clientBottomIndicator" style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 32, height: 2, background: GLD.color, borderRadius: 1, boxShadow: `0 0 8px ${GLD.glowColor}` }} />
            )}
            <span style={{ position: 'relative' }}>
              {item.icon}
              {item.badge > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -6, background: DS.red, color: '#fff', fontSize: 8, borderRadius: 8, padding: '0 3px', fontFamily: DS.mono, minWidth: 14, textAlign: 'center' }}>{item.badge}</span>
              )}
            </span>
            <span style={{ fontSize: 9, fontFamily: DS.mono }}>{item.label}</span>
          </button>
        ))}
        <button onClick={onMenuOpen}
          className="flex-1 flex flex-col items-center gap-0.5"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: DS.text4, padding: '10px 0 8px', minHeight: 56 }}>
          <Menu size={20} />
          <span style={{ fontSize: 9, fontFamily: DS.mono }}>Thêm</span>
        </button>
      </div>
    </div>
  );
}

// ── TopBar ─────────────────────────────────��──────────────────────────────
function TopBar({ tab, onSelect, onMenuToggle }: { tab: string; onSelect: (s: string) => void; onMenuToggle: () => void }) {
  const isMobile = useIsMobile();
  const CUSTOMER = useCustomerProfile();
  const GLD = RANKS[CUSTOMER.rank] ?? RANKS['gold'];
  const tabLabels: Record<string, string> = {
    home: 'Tổng quan', projects: 'Dự án của tôi', media: 'Media Booking', quests: 'Nhiệm vụ & Sự kiện', invoices: 'Hóa đơn & Thanh toán',
    courses: 'Khóa học của tôi', effects: 'Kho hiệu ứng & Khung avatar',
    lp: 'Ví điểm thưởng LP', referral: 'Chương trình giới thiệu', support: 'Hỗ trợ khách hàng', settings: 'Cài đặt tài khoản',
  };
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Chào buổi sáng' : now.getHours() < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  return (
    <div className="flex items-center justify-between h-14 flex-shrink-0" style={{ background: DS.bgCard, borderBottom: `1px solid ${DS.border}`, padding: isMobile ? '0 12px' : '0 24px' }}>
      <div className="flex items-center gap-3 min-w-0">
        <motion.button onClick={onMenuToggle}
          className="w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0"
          style={{ background: DS.bgCard2, border: `1px solid ${DS.border}`, cursor: 'pointer', color: DS.text3, display: isMobile ? 'flex' : 'none' }}
          whileHover={{ borderColor: GLD.color }}>
          <Menu size={17} />
        </motion.button>
        <div className="min-w-0">
          {!isMobile && <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.2em' }}>CLIENT PORTAL · {(tabLabels[tab] || tab).toUpperCase()}</div>}
          <div style={{ color: DS.text3, fontSize: isMobile ? 12 : 13, marginTop: isMobile ? 0 : 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {isMobile ? <span style={{ color: DS.text, fontWeight: 700 }}>{CUSTOMER.shortName} 👋</span> : <>{greeting}, <span style={{ color: DS.text, fontWeight: 700 }}>{CUSTOMER.shortName}</span> 👋</>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* LP chip */}
        <button onClick={() => onSelect('lp')} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full" style={{ background: `${GLD.color}12`, border: `1px solid ${GLD.color}35`, cursor: 'pointer' }}>
          <span style={{ color: GLD.color, fontSize: 11 }}>★</span>
          <span style={{ color: GLD.color, fontSize: isMobile ? 11 : 12, fontFamily: DS.mono, fontWeight: 700 }}>{isMobile ? `${(CUSTOMER.lpBalance/1000).toFixed(1)}K` : `${fmtLP(CUSTOMER.lpBalance)} LP`}</span>
        </button>
        {/* Notification */}
        <ClientNotifBell onSelect={onSelect} />
        {/* Book service */}
        {!isMobile && (
          <Link to="/dat-lich" style={{ background: GRD.primary, color: '#fff', borderRadius: 10, padding: '7px 14px', fontSize: 12, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, boxShadow: '0 0 12px rgba(129,140,248,0.3)' }}>
            <Plus size={13} /> Đặt dịch vụ
          </Link>
        )}
        {isMobile && (
          <Link to="/dat-lich" style={{ background: GRD.primary, color: '#fff', borderRadius: 10, padding: '9px', fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', boxShadow: '0 0 12px rgba(129,140,248,0.3)' }}>
            <Plus size={15} />
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Client Notification Bell ───────────────────────────────────────────────────
function ClientNotifBell({ onSelect }: { onSelect: (s: string) => void }) {
  const { clientNotifications, getUnreadClientCount, markClientNotifRead, markAllClientNotifsRead } = useLoopStore();
  const [open, setOpen] = useState(false);
  const unread = getUnreadClientCount();

  return (
    <div style={{ position: 'relative' }}>
      <motion.button onClick={() => setOpen(v => !v)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl"
        style={{ background: DS.bgCard2, border: `1px solid ${DS.border}`, cursor: 'pointer', color: DS.text3 }}
        whileHover={{ borderColor: DS.blue }}>
        <Bell size={15} />
        {unread > 0 && (
          <motion.div className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"
            style={{ background: DS.red, boxShadow: `0 0 6px ${DS.red}` }}
            animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <span style={{ color: '#fff', fontSize: 8, fontFamily: DS.mono }}>{unread}</span>
          </motion.div>
        )}
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="absolute right-0 top-12 w-80 rounded-2xl overflow-hidden z-50"
            style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${DS.border}` }}>
              <span style={{ color: DS.text, fontSize: 13, fontWeight: 700 }}>Thông báo ({unread} mới)</span>
              <button onClick={() => { markAllClientNotifsRead(); setOpen(false); }}
                style={{ color: DS.blue, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11 }}>
                Đánh dấu đã đọc
              </button>
            </div>
            <div style={{ maxHeight: 340, overflowY: 'auto' }}>
              {clientNotifications.map(n => (
                <div key={n.id}
                  onClick={() => { markClientNotifRead(n.id); if (n.relatedOrderId) onSelect('projects'); setOpen(false); }}
                  className="flex gap-3 px-4 py-3 cursor-pointer"
                  style={{ background: n.read ? 'none' : `${n.color}06`, borderBottom: `1px solid ${DS.border}` }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                    style={{ background: n.read ? DS.text5 : n.color, boxShadow: n.read ? 'none' : `0 0 4px ${n.color}` }} />
                  <div className="flex-1 min-w-0">
                    <div style={{ color: n.read ? DS.text3 : DS.text, fontSize: 12, fontWeight: n.read ? 400 : 700, marginBottom: 2 }}>{n.title}</div>
                    <div style={{ color: DS.text5, fontSize: 11 }}>{n.body}</div>
                    <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginTop: 2 }}>{n.time}</div>
                    {n.demoUrl && (
                      <div className="flex items-center gap-1.5 mt-2 px-2 py-1 rounded-lg"
                        style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', display: 'inline-flex' }}>
                        <Monitor size={10} style={{ color: DS.green }} />
                        <span style={{ color: DS.green, fontSize: 10, fontFamily: DS.mono }}>Demo sẵn sàng!</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ── HOME TAB ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════
function HomeTab({ onSelect }: { onSelect: (s: string) => void }) {
  const CUSTOMER = useCustomerProfile();
  const GLD = RANKS[CUSTOMER.rank] ?? RANKS['gold'];
  const PROJECTS = [
    { id: 'p1', name: 'Website Công ty TechViet', type: 'Web Development', status: 'doing', progress: 65, pm: 'Yuna Park', pmImg: members[3].img, deadline: '28/03/2026', budget: '85M VNĐ', tags: ['React', 'TailwindCSS', 'Node.js'] },
    { id: 'p2', name: 'App Mobile TechViet v2', type: 'Mobile App', status: 'review', progress: 90, pm: 'Shin Watanabe', pmImg: members[4].img, deadline: '01/04/2026', budget: '120M VNĐ', tags: ['React Native', 'AWS'] },
    { id: 'p3', name: 'SEO & Content Q2/2026', type: 'Marketing', status: 'todo', progress: 10, pm: 'Mei Lin', pmImg: members[1].img, deadline: '30/06/2026', budget: '45M VNĐ', tags: ['SEO', 'Content', 'Analytics'] },
  ];

  const STATUS_CFG = {
    todo:   { label: 'Chờ thực hiện', color: DS.text4,  bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.25)', dot: DS.text4 },
    doing:  { label: 'Đang thực hiện', color: DS.blue,  bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)',  dot: DS.blue },
    review: { label: 'Đang review',    color: DS.amber, bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', dot: DS.amber },
    done:   { label: 'Hoàn thành',     color: DS.green, bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.3)',  dot: DS.green },
  };

  const ACTIVITIES = [
    { icon: <CheckCircle2 size={13} />, color: DS.green,  text: 'Thiết kế UI Website bàn giao đúng hẹn', lp: '+500', time: 'Hôm nay, 14:30' },
    { icon: <FileText size={13} />,     color: DS.blue,   text: 'Hóa đơn INV-2601 thanh toán xác nhận', lp: '+200', time: 'Hôm qua, 09:15' },
    { icon: <TrendingUp size={13} />,   color: DS.amber,  text: 'App Mobile v2 vào giai đoạn review', lp: '', time: '2 ngày trước' },
    { icon: <Gift size={13} />,         color: DS.purple, text: 'Referral bonus từ StartupX thành công', lp: '+1,500', time: '5 ngày trước' },
    { icon: <Star size={13} />,         color: GLD.color, text: 'Đạt Gold Level 12 · Milestone thành công', lp: '+800', time: '1 tuần trước' },
  ];

  const pmOf = (name: string) => members.find(m => m.name.includes(name.split(' ')[0]));

  return (
    <div className="space-y-5">
      {/* ── Hero row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Membership card */}
        <div className="xl:col-span-2 rounded-2xl relative overflow-hidden" style={{ background: `linear-gradient(135deg, #0D1526 0%, #111827 100%)`, border: `1px solid ${GLD.color}30`, minHeight: 200 }}>
          {/* Background glow */}
          <div style={{ position: 'absolute', top: -60, right: -40, width: 220, height: 220, borderRadius: '50%', background: `${GLD.color}08`, filter: 'blur(40px)' }} />
          <div style={{ position: 'absolute', bottom: -40, left: 60, width: 140, height: 140, borderRadius: '50%', background: 'rgba(59,130,246,0.06)', filter: 'blur(30px)' }} />

          <div className="relative z-10 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.25em', marginBottom: 4 }}>LOOP SOLUTIONS · CLIENT MEMBERSHIP</div>
                <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: 20, fontWeight: 900, letterSpacing: '0.05em' }}>{CUSTOMER.name.toUpperCase()}</div>
                <div style={{ color: DS.text4, fontSize: 12, marginTop: 4 }}>{CUSTOMER.company}</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: `${GLD.color}15`, border: `1px solid ${GLD.color}35` }}>
                  <span style={{ color: GLD.color }}>{GLD.symbol}</span>
                  <span style={{ color: GLD.color, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>{GLD.label} Lv.{CUSTOMER.level}</span>
                </div>
                <div className="w-12 h-12 rounded-xl overflow-hidden" style={{ border: `2px solid ${GLD.color}`, boxShadow: `0 0 16px ${GLD.glowColor}` }}>
                  <img src={CUSTOMER.avatar} alt={CUSTOMER.name} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            <div className="flex items-end justify-between mt-4">
              <div>
                <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 4 }}>THÀNH VIÊN TỪ</div>
                <div style={{ color: DS.text3, fontFamily: DS.mono, fontSize: 14, fontWeight: 700 }}>{CUSTOMER.memberSince}</div>
              </div>
              <div className="text-center">
                <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.1em', marginBottom: 4 }}>TỔNG CHI TIÊU</div>
                <div style={{ color: DS.text2, fontFamily: DS.mono, fontSize: 16, fontWeight: 700 }}>{fmtVND(CUSTOMER.totalSpent)} VNĐ</div>
              </div>
              <div className="text-right">
                <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.1em', marginBottom: 4 }}>LP BALANCE</div>
                <div style={{ color: GLD.color, fontFamily: DS.heading, fontSize: 22, fontWeight: 900, textShadow: `0 0 12px ${GLD.glowColor}` }}>{fmtLP(CUSTOMER.lpBalance)}</div>
              </div>
            </div>

            {/* XP Progress */}
            <div className="mt-4">
              <div className="flex justify-between mb-1.5">
                <span style={{ color: GLD.color, fontSize: 10, fontFamily: DS.mono }}>XP LEVEL PROGRESS</span>
                <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{CUSTOMER.xpPct}% · Cần {(100 - CUSTOMER.xpPct) * 140} LP để lên Lv.{CUSTOMER.level + 1}</span>
              </div>
              <div className="rounded-full overflow-hidden" style={{ height: 6, background: DS.border }}>
                <div style={{ height: '100%', width: `${CUSTOMER.xpPct}%`, background: `linear-gradient(90deg, ${GLD.gradientFrom}, ${GLD.gradientTo})`, borderRadius: 99, boxShadow: `0 0 10px ${GLD.glowColor}` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick stats col */}
        <div className="space-y-3">
          {[
            { label: 'Dự án đang chạy', value: '3', sub: '1 sắp deadline', color: DS.blue, icon: <FolderKanban size={16} /> },
            { label: 'LP tổng tích lũy', value: fmtLP(CUSTOMER.lpEarned), sub: `Đã dùng ${fmtLP(CUSTOMER.lpSpent)}`, color: GLD.color, icon: <Zap size={16} /> },
            { label: 'Khách giới thiệu', value: '3', sub: '4,500 LP earned', color: DS.purple, icon: <Users size={16} /> },
          ].map(s => (
            <motion.div key={s.label} className="rounded-2xl p-4" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
              whileHover={{ borderColor: `${s.color}35`, boxShadow: `0 4px 20px rgba(0,0,0,0.3)` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                  <span style={{ color: s.color }}>{s.icon}</span>
                </div>
                <ChevronRight size={13} style={{ color: DS.text5 }} />
              </div>
              <div style={{ color: s.color, fontFamily: DS.heading, fontSize: 20, fontWeight: 700, textShadow: `0 0 10px ${s.color}40` }}>{s.value}</div>
              <div style={{ color: DS.text3, fontSize: 12, marginTop: 2 }}>{s.label}</div>
              <div style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, marginTop: 2 }}>{s.sub}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Active Projects ── */}
      <div className="rounded-2xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${DS.border}` }}>
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em' }}>── DỰ ÁN ĐANG THỰC HIỆN</div>
          <button onClick={() => onSelect('projects')} style={{ color: DS.blue, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: DS.mono, display: 'flex', alignItems: 'center', gap: 4 }}>
            Xem tất cả <ChevronRight size={12} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {PROJECTS.map((p) => {
            const sc = STATUS_CFG[p.status as keyof typeof STATUS_CFG];
            return (
              <motion.div key={p.id} className="p-4 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}
                whileHover={{ borderColor: sc.border }}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot, boxShadow: `0 0 5px ${sc.dot}` }} />
                      <span style={{ color: DS.text, fontSize: 13, fontWeight: 700 }}>{p.name}</span>
                      <span style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color, fontSize: 9, padding: '2px 8px', borderRadius: 20, fontFamily: DS.mono }}>{sc.label}</span>
                    </div>
                    <div style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono }}>{p.type} · {p.budget}</div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {p.tags.map(t => <span key={t} style={{ color: DS.text5, fontSize: 9, background: DS.bgCard, border: `1px solid ${DS.border}`, padding: '1px 6px', borderRadius: 4 }}>{t}</span>)}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1.5 justify-end mb-1">
                      <div className="w-6 h-6 rounded-lg overflow-hidden" style={{ border: `1px solid ${RANKS[members.find(m => m.name.includes(p.pm.split(' ')[0]))?.rank ?? 'iron'].color}50` }}>
                        <img src={p.pmImg} alt={p.pm} className="w-full h-full object-cover" />
                      </div>
                      <span style={{ color: DS.text4, fontSize: 11 }}>{p.pm}</span>
                    </div>
                    <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>⏰ {p.deadline}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 rounded-full overflow-hidden" style={{ height: 5, background: DS.border }}>
                    <div style={{ height: '100%', width: `${p.progress}%`, background: `linear-gradient(90deg, ${sc.dot}99, ${sc.dot})`, borderRadius: 99, boxShadow: `0 0 6px ${sc.dot}` }} />
                  </div>
                  <span style={{ color: sc.color, fontSize: 11, fontFamily: DS.mono, fontWeight: 700, flexShrink: 0 }}>{p.progress}%</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom row: Activity + Rank Progress ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Activity feed */}
        <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 14 }}>── HOẠT ĐỘNG GẦN ĐÂY</div>
          <div className="space-y-3">
            {ACTIVITIES.map((a, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${a.color}15`, border: `1px solid ${a.color}25`, marginTop: 1 }}>
                  <span style={{ color: a.color }}>{a.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ color: DS.text2, fontSize: 12, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.text}</div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{a.time}</span>
                    {a.lp && <span style={{ color: DS.green, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>{a.lp} LP</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rank Progress */}
        <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 14 }}>── TIẾN TRÌNH THĂNG HẠNG</div>
          <div className="flex items-center gap-6">
            {/* Circular SVG */}
            <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
              <svg width="110" height="110" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r="46" fill="none" stroke={DS.border} strokeWidth="7" />
                <circle cx="55" cy="55" r="46" fill="none" stroke={GLD.color} strokeWidth="7"
                  strokeDasharray={`${2 * Math.PI * 46}`}
                  strokeDashoffset={`${2 * Math.PI * 46 * (1 - CUSTOMER.xpPct / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 55 55)"
                  style={{ filter: `drop-shadow(0 0 8px ${GLD.glowColor})` }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: GLD.color, fontSize: 20, fontFamily: DS.heading, fontWeight: 700 }}>{CUSTOMER.xpPct}%</div>
                <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>XP</div>
              </div>
            </div>

            <div className="flex-1 space-y-2.5">
              {[
                { label: 'Cấp hiện tại', val: `Gold Lv.${CUSTOMER.level}`, color: GLD.color },
                { label: 'Cần thêm LP', val: '1,400 LP', color: DS.blue },
                { label: 'Cấp tiếp theo', val: `Gold Lv.${CUSTOMER.level + 1}`, color: DS.text3 },
                { label: 'Đến Platinum', val: 'Cần Lv.75', color: DS.cyan },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center">
                  <span style={{ color: DS.text4, fontSize: 12 }}>{item.label}</span>
                  <span style={{ color: item.color, fontFamily: DS.mono, fontSize: 12, fontWeight: 600 }}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rank path */}
          <div className="flex items-center gap-1 mt-5">
            {(['iron','bronze','silver','gold','platinum','ruby','diamond'] as const).map((rk, i) => {
              const r = RANKS[rk];
              const isActive = rk === 'gold';
              const isPast = r.tier < GLD.tier;
              return (
                <div key={rk} className="flex items-center gap-1 flex-1">
                  <div className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: isActive ? `${r.color}20` : isPast ? `${r.color}10` : 'rgba(0,0,0,0)', border: `1px solid ${isActive ? r.color : isPast ? `${r.color}50` : DS.border}` }}>
                      <span style={{ fontSize: 10, color: isActive ? r.color : isPast ? `${r.color}80` : DS.text5 }}>{r.symbol}</span>
                    </div>
                    <span style={{ fontSize: 7, fontFamily: DS.mono, color: isActive ? r.color : isPast ? `${r.color}60` : DS.text5 }}>{r.label.slice(0,4)}</span>
                  </div>
                  {i < 6 && <div style={{ width: 8, height: 1, background: isPast ? `${r.color}50` : DS.border, flexShrink: 0, marginBottom: 14 }} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Đặt dịch vụ mới', icon: <Plus size={16} />, color: DS.blue, href: '/dat-lich' },
          { label: 'Xem hóa đơn', icon: <FileText size={16} />, color: DS.green, onClick: () => onSelect('invoices') },
          { label: 'Dùng LP giảm giá', icon: <Zap size={16} />, color: GLD.color, onClick: () => onSelect('lp') },
          { label: 'Giới thiệu bạn bè', icon: <Gift size={16} />, color: DS.purple, onClick: () => onSelect('referral') },
        ].map(action => (
          <motion.button key={action.label}
            onClick={action.onClick ?? undefined}
            className="flex items-center gap-3 p-4 rounded-2xl text-left w-full"
            style={{ backgroundColor: DS.bgCard, border: `1px solid ${DS.border}`, cursor: 'pointer' }}
            whileHover={{ borderColor: `${action.color}40`, backgroundColor: `${action.color}06` }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${action.color}15`, border: `1px solid ${action.color}25` }}>
              <span style={{ color: action.color }}>{action.icon}</span>
            </div>
            <span style={{ color: DS.text3, fontSize: 13, fontWeight: 600 }}>{action.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ── PROJECTS TAB ─────────────────────────────────────────
// ═══════════════════════════════════════════════════════════
function ProjectsTab() {
  const [expanded, setExpanded] = useState<string | null>('p1');
  const [demoOrderId, setDemoOrderId] = useState<string | null>(null);
  const { orders, clientNotifications, sendClientMessage } = useLoopStore();
  const [msgText, setMsgText] = useState('');

  // Orders belonging to client ID=2 (Nguyễn Minh Tuấn)
  const clientOrders = orders.filter(o => o.clientId === 2);
  const demoReady = clientOrders.filter(o => o.status === 'demo_ready' || (o.demoUrl && o.status === 'in_progress'));
  const selectedDemoOrder = clientOrders.find(o => o.id === demoOrderId);

  const PROJECTS = [
    { id: 'p1', name: 'Website Công ty TechViet', type: 'Web Development', status: 'doing', progress: 65, pm: members[3], deadline: '28/03/2026', budget: '85,000,000', contract: 'HĐ-2601-WEB', color: DS.blue,
      milestones: [
        { label: 'Khởi động & Brief', done: true, date: '10/01' },
        { label: 'Wireframe & UX', done: true, date: '25/01' },
        { label: 'UI Design', done: true, date: '15/02' },
        { label: 'Frontend Dev', done: false, date: '10/03', active: true },
        { label: 'Backend & API', done: false, date: '20/03' },
        { label: 'Testing & UAT', done: false, date: '25/03' },
        { label: 'Go Live', done: false, date: '28/03' },
      ],
      deliverables: ['Wireframe Figma ✓', 'Mockup UI ✓', 'Brand Guidelines ✓', 'Source code (đang dev)', 'Tài liệu kỹ thuật', 'Training session'],
    },
    { id: 'p2', name: 'App Mobile TechViet v2', type: 'Mobile App', status: 'review', progress: 90, pm: members[4], deadline: '01/04/2026', budget: '120,000,000', contract: 'HĐ-2589-APP', color: DS.amber,
      milestones: [
        { label: 'Discovery Phase', done: true, date: '05/12' },
        { label: 'Design System', done: true, date: '20/12' },
        { label: 'Development Sprint 1', done: true, date: '20/01' },
        { label: 'Development Sprint 2', done: true, date: '20/02' },
        { label: 'QA Testing', done: true, date: '10/03', active: true },
        { label: 'UAT & Review', done: false, date: '25/03' },
        { label: 'Publish App', done: false, date: '01/04' },
      ],
      deliverables: ['Design System ✓', 'App iOS ✓', 'App Android ✓', 'Backend API ✓', 'QA Report (đang review)', 'App Store submission'],
    },
    { id: 'p3', name: 'SEO & Content Marketing Q2/2026', type: 'Digital Marketing', status: 'todo', progress: 10, pm: members[1], deadline: '30/06/2026', budget: '45,000,000', contract: 'HĐ-2612-MKT', color: DS.purple,
      milestones: [
        { label: 'Keyword Research', done: true, date: '01/04', active: true },
        { label: 'Content Strategy', done: false, date: '15/04' },
        { label: 'On-page SEO', done: false, date: '01/05' },
        { label: 'Content Production', done: false, date: '15/05' },
        { label: 'Off-page & Link building', done: false, date: '01/06' },
        { label: 'Report & Optimize', done: false, date: '30/06' },
      ],
      deliverables: ['Keyword map (đang làm)', 'Content calendar', '20 bài blog', 'Backlink profile', 'Báo cáo hàng tháng'],
    },
  ];

  const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
    todo:   { label: 'Chờ thực hiện', color: DS.text4, bg: 'rgba(100,116,139,0.12)' },
    doing:  { label: 'Đang thực hiện', color: DS.blue,  bg: 'rgba(59,130,246,0.12)' },
    review: { label: 'Đang review',    color: DS.amber, bg: 'rgba(245,158,11,0.12)' },
    done:   { label: 'Hoàn thành',     color: DS.green, bg: 'rgba(34,197,94,0.12)' },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em' }}>── DỰ ÁN & ĐƠN HÀNG CỦA TÔI</div>
        <Link to="/dat-lich" style={{ background: GRD.primary, color: '#fff', borderRadius: 10, padding: '7px 14px', fontSize: 12, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Plus size={13} /> Đặt dịch vụ mới
        </Link>
      </div>

      {/* Demo ready alert */}
      {demoReady.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.35)' }}>
          <div className="flex items-center gap-3 mb-3">
            <motion.div className="w-2.5 h-2.5 rounded-full" style={{ background: DS.green }}
              animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
            <span style={{ color: DS.green, fontSize: 13, fontWeight: 700 }}>
              🎉 {demoReady.length} bản demo sẵn sàng để review!
            </span>
          </div>
          <div className="space-y-2">
            {demoReady.map(o => (
              <div key={o.id} className="flex items-center justify-between">
                <span style={{ color: DS.text3, fontSize: 12 }}>• {o.title}</span>
                <button onClick={() => setDemoOrderId(demoOrderId === o.id ? null : o.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                  style={{ background: demoOrderId === o.id ? `${DS.green}20` : `${DS.green}12`, border: `1px solid rgba(34,197,94,0.3)`, color: DS.green, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  <Monitor size={12} /> {demoOrderId === o.id ? 'Đang xem' : 'Xem Demo'}
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Inline demo viewer */}
      <AnimatePresence>
        {selectedDemoOrder?.demoUrl && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid rgba(34,197,94,0.3)` }}>
              <DemoViewer
                demoUrl={selectedDemoOrder.demoUrl}
                maskedUrl={selectedDemoOrder.maskedUrl ?? ''}
                previewImg="https://images.unsplash.com/photo-1590965918603-0dce981d13b8?auto=format&fit=crop&w=800&q=80"
                title={selectedDemoOrder.title}
                accentColor={DS.green}
                height={380}
              />
              {/* Quick reply */}
              <div className="p-4" style={{ background: DS.bgCard, borderTop: `1px solid ${DS.border}` }}>
                <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 8 }}>PHẢN HỒI VỀ DEMO NÀY</div>
                <div className="flex gap-2">
                  <input value={msgText} onChange={e => setMsgText(e.target.value)}
                    placeholder="Nhập phản hồi về demo..."
                    style={{ flex: 1, background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '9px 12px', color: DS.text, fontSize: 13, outline: 'none', fontFamily: DS.body }} />
                  <button onClick={() => { if (msgText && selectedDemoOrder) { sendClientMessage(selectedDemoOrder.id, msgText); setMsgText(''); } }}
                    disabled={!msgText}
                    style={{ padding: '9px 14px', borderRadius: 10, background: GRD.primary, border: 'none', color: '#fff', cursor: 'pointer', opacity: msgText ? 1 : 0.5 }}>
                    <Send size={14} />
                  </button>
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {['✅ Đã duyệt, ra mắt được!', '🎨 Cần chỉnh màu sắc', '📱 Mobile chưa ổn', '✏️ Thay đổi nội dung'].map(q => (
                    <button key={q} onClick={() => setMsgText(q)}
                      style={{ padding: '5px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${DS.border}`, color: DS.text4, fontSize: 11, cursor: 'pointer' }}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Store orders summary */}
      {clientOrders.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <div className="px-5 py-3" style={{ borderBottom: `1px solid ${DS.border}` }}>
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em' }}>── ĐƠNHÀNG TỪ LOOP ({clientOrders.length})</div>
          </div>
          <div className="divide-y" style={{ borderColor: DS.border }}>
            {clientOrders.map(o => {
              const statusColors: Record<string, string> = { pending_payment: DS.text4, paid: DS.blue, in_progress: DS.cyan, demo_ready: DS.amber, done: DS.green, cancelled: DS.red };
              const sc = statusColors[o.status] ?? DS.text4;
              const statusLabels: Record<string, string> = { pending_payment: 'Chờ TT', paid: 'Đã TT', in_progress: 'Đang làm', demo_ready: '⚡ Demo sẵn', client_review: 'Đang review', done: '✓ Hoàn thành', cancelled: 'Đã hủy' };
              return (
                <div key={o.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <div style={{ color: DS.text, fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{o.title}</div>
                    <div style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono }}>{o.invoiceId} · PM: {o.assignedPM ?? 'Chưa phân công'}</div>
                  </div>
                  <div style={{ color: sc, fontSize: 10, fontFamily: DS.mono, padding: '2px 8px', borderRadius: 4, background: `${sc}12`, border: `1px solid ${sc}30`, flexShrink: 0 }}>
                    {statusLabels[o.status] ?? o.status}
                  </div>
                  {o.demoUrl && (
                    <button onClick={() => setDemoOrderId(demoOrderId === o.id ? null : o.id)}
                      style={{ padding: '5px 10px', borderRadius: 8, background: `${DS.green}12`, border: `1px solid rgba(34,197,94,0.3)`, color: DS.green, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Monitor size={11} /> Demo
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}


      {PROJECTS.map(p => {
        const sc = STATUS_CFG[p.status];
        const isOpen = expanded === p.id;
        return (
          <div key={p.id} className="rounded-2xl overflow-hidden" style={{ background: DS.bgCard, border: `1px solid ${isOpen ? p.color + '35' : DS.border}`, transition: 'border-color 0.2s' }}>
            {/* Header */}
            <button className="w-full flex items-center gap-4 p-5 text-left" style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => setExpanded(isOpen ? null : p.id)}>
              <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0" style={{ border: `1.5px solid ${RANKS[p.pm.rank].color}60` }}>
                <img src={p.pm.img} alt={p.pm.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span style={{ color: DS.text, fontSize: 14, fontWeight: 700 }}>{p.name}</span>
                  <span style={{ background: sc.bg, color: sc.color, fontSize: 9, padding: '2px 8px', borderRadius: 20, fontFamily: DS.mono, border: `1px solid ${sc.color}30` }}>{sc.label}</span>
                </div>
                <div style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono }}>
                  {p.contract} · PM: {p.pm.name} · Budget: {p.budget} VNĐ · 🗓 {p.deadline}
                </div>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <div style={{ color: p.color, fontSize: 18, fontFamily: DS.mono, fontWeight: 700 }}>{p.progress}%</div>
                  <div className="rounded-full overflow-hidden mt-1" style={{ height: 4, background: DS.border, width: 80 }}>
                    <div style={{ height: '100%', width: `${p.progress}%`, background: p.color, borderRadius: 99 }} />
                  </div>
                </div>
                <ChevronDown size={16} style={{ color: DS.text4, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
              </div>
            </button>

            {/* Expanded details */}
            <AnimatePresence>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                  style={{ overflow: 'hidden', borderTop: `1px solid ${DS.border}` }}>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 p-5">
                    {/* Milestones */}
                    <div>
                      <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 12 }}>── MILESTONE TIMELINE</div>
                      <div className="space-y-2">
                        {p.milestones.map((ms, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: ms.done ? `${DS.green}20` : ms.active ? `${p.color}20` : 'rgba(30,41,59,0.8)', border: `1.5px solid ${ms.done ? DS.green : ms.active ? p.color : DS.border}` }}>
                              {ms.done ? <Check size={10} style={{ color: DS.green }} /> : ms.active ? <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.color }} /> : null}
                            </div>
                            <div className="flex-1">
                              <span style={{ color: ms.done ? DS.text4 : ms.active ? DS.text : DS.text5, fontSize: 12, textDecoration: ms.done ? 'line-through' : 'none' }}>{ms.label}</span>
                            </div>
                            <span style={{ color: ms.active ? p.color : DS.text5, fontSize: 10, fontFamily: DS.mono }}>{ms.date}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Deliverables + PM contact */}
                    <div className="space-y-4">
                      <div>
                        <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 12 }}>── DELIVERABLES</div>
                        <div className="space-y-1.5">
                          {p.deliverables.map((d, i) => {
                            const done = d.includes('✓');
                            const active = d.includes('đang');
                            return (
                              <div key={i} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: done ? DS.green : active ? p.color : DS.text5 }} />
                                <span style={{ color: done ? DS.text4 : active ? DS.text2 : DS.text5, fontSize: 12, textDecoration: done ? 'line-through' : 'none' }}>
                                  {d.replace(' ✓', '').replace(' (đang dev)', '').replace(' (đang review)', '').replace(' (đang làm)', '')}
                                  {done && ' ✓'} {active ? <span style={{ color: p.color, fontSize: 10, fontFamily: DS.mono }}>(đang thực hiện)</span> : null}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* PM Contact */}
                      <div className="p-3 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                        <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', marginBottom: 8 }}>── PM PHỤ TRÁCH</div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden" style={{ border: `1.5px solid ${RANKS[p.pm.rank].color}` }}>
                            <img src={p.pm.img} alt={p.pm.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div style={{ color: DS.text2, fontSize: 13, fontWeight: 700 }}>{p.pm.name}</div>
                            <div style={{ color: DS.text5, fontSize: 11 }}>{p.pm.role} · {RANKS[p.pm.rank].label}</div>
                          </div>
                          <div className="flex gap-2 ml-auto">
                            <button style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${DS.border}`, background: 'none', color: DS.text4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Mail size={13} />
                            </button>
                            <button style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid rgba(59,130,246,0.3)`, background: 'rgba(59,130,246,0.1)', color: DS.blue, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <MessageSquare size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ── INVOICES TAB ─────────────────────────────────────────
// ═══════════════════════════════════════════════════════════
function InvoicesTab() {
  const INVOICES = [
    { id: 'INV-2601', project: 'Website Công ty TechViet', amount: 85_000_000, paid: 85_000_000, status: 'paid', date: '15/03/2026', due: '15/03/2026', lp: 850 },
    { id: 'INV-2589', project: 'App Mobile TechViet v2 (Đợt 1)', amount: 60_000_000, paid: 60_000_000, status: 'paid', date: '01/02/2026', due: '01/02/2026', lp: 600 },
    { id: 'INV-2598', project: 'App Mobile TechViet v2 (Đợt 2)', amount: 60_000_000, paid: 0, status: 'pending', date: '20/03/2026', due: '01/04/2026', lp: 600 },
    { id: 'INV-2612', project: 'SEO & Content Q2/2026', amount: 22_500_000, paid: 0, status: 'upcoming', date: '—', due: '01/05/2026', lp: 225 },
    { id: 'INV-2540', project: 'Brand Identity 2025', amount: 35_000_000, paid: 35_000_000, status: 'paid', date: '10/10/2025', due: '10/10/2025', lp: 350 },
    { id: 'INV-2531', project: 'Landing Page Campaign', amount: 15_000_000, paid: 15_000_000, status: 'paid', date: '01/08/2025', due: '01/08/2025', lp: 150 },
  ];

  const STATUS_CFG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    paid:     { label: 'Đã thanh toán', color: DS.green,  icon: <CheckCircle2 size={12} /> },
    pending:  { label: 'Đang chờ',       color: DS.amber,  icon: <Clock size={12} /> },
    overdue:  { label: 'Quá hạn',        color: DS.red,    icon: <XCircle size={12} /> },
    upcoming: { label: 'Sắp đến hạn',   color: DS.text4,  icon: <AlertCircle size={12} /> },
  };

  const totalPaid = INVOICES.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
  const totalPending = INVOICES.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0);
  const totalLP = INVOICES.filter(i => i.status === 'paid').reduce((s, i) => s + i.lp, 0);

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Đã thanh toán', value: fmtVND(totalPaid) + ' VNĐ', sub: `${INVOICES.filter(i => i.status === 'paid').length} hóa đơn`, color: DS.green, icon: <CheckCircle2 size={16} /> },
          { label: 'Đang chờ thanh toán', value: fmtVND(totalPending) + ' VNĐ', sub: `${INVOICES.filter(i => i.status === 'pending').length} hóa đơn`, color: DS.amber, icon: <Clock size={16} /> },
          { label: 'LP Tích lũy từ HĐ', value: fmtLP(totalLP) + ' LP', sub: 'Từ tất cả hóa đơn', color: GLD.color, icon: <Zap size={16} /> },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                <span style={{ color: s.color }}>{s.icon}</span>
              </div>
            </div>
            <div style={{ color: s.color, fontFamily: DS.heading, fontSize: 18, fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: DS.text3, fontSize: 12, marginTop: 3 }}>{s.label}</div>
            <div style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Invoice list */}
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${DS.border}` }}>
        <div className="grid px-5 py-3" style={{ gridTemplateColumns: '1.2fr 2.5fr 1.2fr 1fr 1fr 80px', background: DS.bgCard2, borderBottom: `1px solid ${DS.border}` }}>
          {['Số HĐ', 'Dự án', 'Số tiền', 'Ngày xuất', 'Trạng thái', ''].map(h => (
            <div key={h} style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em' }}>{h}</div>
          ))}
        </div>
        {INVOICES.map((inv, i) => {
          const sc = STATUS_CFG[inv.status];
          return (
            <motion.div key={inv.id} className="grid px-5 py-4 items-center"
              style={{ gridTemplateColumns: '1.2fr 2.5fr 1.2fr 1fr 1fr 80px', borderBottom: `1px solid ${DS.border}`, backgroundColor: 'rgba(0,0,0,0)' }}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <div style={{ color: DS.blue, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>{inv.id}</div>
              <div style={{ color: DS.text2, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }}>{inv.project}</div>
              <div>
                <div style={{ color: DS.text, fontSize: 13, fontWeight: 700, fontFamily: DS.mono }}>{fmtVND(inv.amount)} VNĐ</div>
                <div style={{ color: GLD.color, fontSize: 10, fontFamily: DS.mono }}>+{inv.lp} LP</div>
              </div>
              <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{inv.date}</div>
              <div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full w-fit" style={{ background: `${sc.color}12`, border: `1px solid ${sc.color}30` }}>
                  <span style={{ color: sc.color }}>{sc.icon}</span>
                  <span style={{ color: sc.color, fontSize: 9, fontFamily: DS.mono }}>{sc.label}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${DS.border}`, background: 'none', color: DS.text4, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Download size={12} />
                </button>
                {inv.status === 'pending' && (
                  <button style={{ padding: '4px 10px', borderRadius: 7, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: DS.green, fontSize: 10, cursor: 'pointer', fontFamily: DS.mono, fontWeight: 700 }}>
                    Thanh toán
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ── LP WALLET TAB ─────────────────────────────────────────
// ═══════════════════════════════════════════════════════════
function LPWalletTab() {
  const CUSTOMER = useCustomerProfile();
  const GLD = RANKS[CUSTOMER.rank] ?? RANKS['gold'];
  const [lpInput, setLpInput] = useState(1000);
  const RATE = 500; // 1000 LP = 500K VNĐ discount
  const discount = Math.round((lpInput / 1000) * RATE * 1000);

  const TXS = [
    { label: 'Hoàn thành dự án Website · Phase 2', type: 'earn', amount: 500, date: '16/03/2026', ref: 'INV-2601' },
    { label: 'Thanh toán hóa đơn đúng hạn', type: 'earn', amount: 200, date: '12/03/2026', ref: 'INV-2589' },
    { label: 'Quy đổi LP giảm giá · INV-2580', type: 'spend', amount: -800, date: '10/03/2026', ref: 'INV-2580' },
    { label: 'Referral bonus · StartupX JSC', type: 'earn', amount: 1500, date: '08/03/2026', ref: 'REF-089' },
    { label: 'Bonus hoàn thành trước deadline', type: 'earn', amount: 300, date: '05/03/2026', ref: 'INV-2545' },
    { label: 'Quy đổi LP tặng quà', type: 'spend', amount: -200, date: '03/03/2026', ref: 'GIFT-003' },
    { label: 'Milestone bonus · App v2 Phase 1', type: 'earn', amount: 600, date: '20/02/2026', ref: 'INV-2589' },
    { label: 'Loyalty bonus tháng 2', type: 'earn', amount: 500, date: '01/02/2026', ref: 'SYS-AUTO' },
  ];

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Big balance */}
      <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: `linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(245,158,11,0.06) 60%, rgba(29,78,216,0.08) 100%)`, border: `1px solid ${GLD.color}35` }}>
        <div style={{ position: 'absolute', top: -40, right: -30, width: 160, height: 160, borderRadius: '50%', background: `${GLD.color}06`, filter: 'blur(40px)' }} />
        <div className="relative z-10">
          <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.2em', marginBottom: 6 }}>◈ LOOP POINTS · SỐ DƯ HIỆN TẠI</div>
          <div style={{ color: GLD.color, fontFamily: DS.heading, fontSize: 52, fontWeight: 900, textShadow: `0 0 30px ${GLD.glowColor}`, lineHeight: 1, marginBottom: 4 }}>
            {fmtLP(CUSTOMER.lpBalance)}
          </div>
          <div style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>LOOP POINTS ≈ {fmtVND(Math.round((CUSTOMER.lpBalance / 1000) * RATE * 1000))} VNĐ giảm giá tối đa</div>
          <div className="flex gap-3 mt-5">
            <button style={{ padding: '10px 24px', background: GRD.gold, color: '#0a0a0a', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Dùng LP giảm giá</button>
            <button style={{ padding: '10px 24px', background: `${GLD.color}12`, border: `1px solid ${GLD.color}35`, borderRadius: 10, color: GLD.color, fontSize: 13, cursor: 'pointer' }}>Xem ưu đãi LP</button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tổng tích lũy', val: fmtLP(CUSTOMER.lpEarned), color: DS.green },
          { label: 'Đã sử dụng', val: fmtLP(CUSTOMER.lpSpent), color: DS.amber },
          { label: 'Số dư hiện tại', val: fmtLP(CUSTOMER.lpBalance), color: GLD.color },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div style={{ color: s.color, fontFamily: DS.heading, fontSize: 20, fontWeight: 700 }}>{s.val}</div>
            <div style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* LP Calculator */}
        <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 14 }}>── MÁY TÍNH LP → VNĐ</div>
          <div>
            <label style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, display: 'block', marginBottom: 6 }}>NHẬP SỐ LP MUỐN QUY ĐỔI</label>
            <input type="number" value={lpInput} onChange={e => setLpInput(Math.max(0, Math.min(CUSTOMER.lpBalance, Number(e.target.value))))}
              style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px 14px', color: GLD.color, fontSize: 16, fontFamily: DS.mono, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }} />
            <input type="range" min={0} max={CUSTOMER.lpBalance} value={lpInput} onChange={e => setLpInput(Number(e.target.value))}
              style={{ width: '100%', marginTop: 8, accentColor: GLD.color }} />
          </div>
          <div className="mt-4 p-4 rounded-xl space-y-2.5" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
            <div className="flex justify-between">
              <span style={{ color: DS.text4, fontSize: 12 }}>LP sử dụng</span>
              <span style={{ color: GLD.color, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>{fmtLP(lpInput)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: DS.text4, fontSize: 12 }}>Tỷ lệ quy đổi</span>
              <span style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono }}>1,000 LP = 500,000 VNĐ</span>
            </div>
            <div style={{ height: 1, background: DS.border }} />
            <div className="flex justify-between">
              <span style={{ color: DS.text2, fontSize: 13, fontWeight: 700 }}>Giảm giá nhận được</span>
              <span style={{ color: DS.green, fontSize: 15, fontFamily: DS.mono, fontWeight: 700 }}>{discount.toLocaleString('vi-VN')} VNĐ</span>
            </div>
            <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>* Tối đa 20% tổng giá trị đơn hàng</div>
          </div>
          <button style={{ width: '100%', marginTop: 12, background: GRD.gold, color: '#0a0a0a', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Áp dụng {fmtLP(lpInput)} LP
          </button>
        </div>

        {/* Transaction history */}
        <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 14 }}>── LỊCH SỬ GIAO DỊCH</div>
          <div className="space-y-2 overflow-y-auto scrollbar-zen" style={{ maxHeight: 340 }}>
            {TXS.map((tx, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: tx.type === 'earn' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${tx.type === 'earn' ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.25)'}` }}>
                  {tx.type === 'earn' ? <ArrowUpRight size={14} style={{ color: DS.green }} /> : <ArrowDownRight size={14} style={{ color: DS.amber }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ color: DS.text2, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.label}</div>
                  <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{tx.date} · {tx.ref}</div>
                </div>
                <div style={{ color: tx.type === 'earn' ? DS.green : DS.amber, fontFamily: DS.mono, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                  {tx.type === 'earn' ? '+' : ''}{tx.amount.toLocaleString()} LP
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ── REFERRAL TAB ─────────────────────────────────────────
// ═══════════════════════════════════════════════════════════
function ReferralTab() {
  const CUSTOMER = useCustomerProfile();
  const GLD = RANKS[CUSTOMER.rank] ?? RANKS['gold'];
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(CUSTOMER.referralCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const REFS = [
    { name: 'StartupX JSC', date: '08/03/2026', project: 'Web App SaaS', amount: '90M VNĐ', lp: 4500, status: 'paid' },
    { name: 'GreenFood VN', date: '15/01/2026', project: 'E-commerce', amount: '65M VNĐ', lp: 3250, status: 'paid' },
    { name: 'MediSoft Co.', date: '28/02/2026', project: 'Mobile App', amount: '110M VNĐ', lp: 0, status: 'pending' },
  ];

  const totalRefLP = REFS.reduce((s, r) => s + r.lp, 0);

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Hero */}
      <div className="rounded-2xl p-8 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(129,140,248,0.12), rgba(20,184,166,0.08))', border: '1px solid rgba(129,140,248,0.25)' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(129,140,248,0.08)', filter: 'blur(30px)' }} />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Gift size={20} style={{ color: DS.purple }} />
              <span style={{ color: DS.purple, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em', fontWeight: 700 }}>CHƯƠNG TRÌNH GIỚI THIỆU</span>
            </div>
            <div style={{ color: DS.text, fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Giới thiệu bạn bè — Nhận thêm LP</div>
            <div style={{ color: DS.text3, fontSize: 13, lineHeight: 1.8, maxWidth: 440 }}>
              Mỗi khách hàng bạn giới thiệu thành công, bạn nhận <span style={{ color: DS.purple, fontWeight: 700 }}>5% LP</span> trên tổng giá trị dự án.
              Không giới hạn số lượng. LP tích lũy ngay khi hóa đơn được xác nhận.
            </div>
          </div>

          {/* Referral code */}
          <div className="text-center">
            <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 8 }}>MÃ GIỚI THIỆU CÁ NHÂN</div>
            <div className="px-6 py-4 rounded-2xl mb-3" style={{ background: DS.bgCard2, border: '1px solid rgba(129,140,248,0.4)', color: DS.purple, fontFamily: DS.mono, fontSize: 22, fontWeight: 700, letterSpacing: '0.12em' }}>
              {CUSTOMER.referralCode}
            </div>
            <button onClick={copy} style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto', padding: '9px 20px', background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(129,140,248,0.15)', border: `1px solid ${copied ? 'rgba(34,197,94,0.4)' : 'rgba(129,140,248,0.4)'}`, borderRadius: 10, color: copied ? DS.green : DS.purple, cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all 0.2s' }}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Đã sao chép!' : 'Sao chép mã'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Đã giới thiệu', value: String(REFS.length), sub: 'khách hàng', color: DS.purple },
          { label: 'LP đã nhận', value: fmtLP(totalRefLP), sub: 'Loop Points', color: GLD.color },
          { label: 'Đang chờ', value: fmtLP(REFS.filter(r => r.status === 'pending').length * 5500), sub: 'LP pending', color: DS.amber },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-5 text-center" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div style={{ color: s.color, fontFamily: DS.heading, fontSize: 24, fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: DS.text3, fontSize: 13, marginTop: 4 }}>{s.label}</div>
            <div style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Referral list */}
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${DS.border}` }}>
        <div className="px-5 py-3 flex items-center justify-between" style={{ background: DS.bgCard2, borderBottom: `1px solid ${DS.border}` }}>
          <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em' }}>DANH SÁCH GIỚI THIỆU</div>
        </div>
        {REFS.map((ref, i) => (
          <motion.div key={i} className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: i < REFS.length - 1 ? `1px solid ${DS.border}` : 'none', backgroundColor: 'rgba(0,0,0,0)' }}
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(129,140,248,0.12)', border: '1px solid rgba(129,140,248,0.25)' }}>
              <Building2 size={15} style={{ color: DS.purple }} />
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ color: DS.text2, fontSize: 13, fontWeight: 700 }}>{ref.name}</div>
              <div style={{ color: DS.text5, fontSize: 11 }}>{ref.project} · {ref.amount} · {ref.date}</div>
            </div>
            <div className="text-right">
              {ref.lp > 0
                ? <div style={{ color: DS.green, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>+{fmtLP(ref.lp)} LP</div>
                : <div style={{ color: DS.amber, fontSize: 12, fontFamily: DS.mono }}>Đang chờ xác nhận</div>}
              <div style={{ color: ref.status === 'paid' ? DS.green : DS.amber, fontSize: 10, fontFamily: DS.mono, marginTop: 2 }}>
                {ref.status === 'paid' ? '✓ Đã nhận' : '⏳ Pending'}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* How it works */}
      <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
        <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 14 }}>── CÁCH THỨC HOẠT ĐỘNG</div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {[
            { step: '01', title: 'Chia sẻ mã', desc: 'Gửi mã giới thiệu LOOP-NMT-7X2K cho bạn bè, đối tác cần dịch vụ digital.', icon: <Copy size={18} />, color: DS.blue },
            { step: '02', title: 'Họ ký hợp đồng', desc: 'Khi họ đặt dịch vụ và thanh toán hợp đồng đầu tiên thành công.', icon: <CheckCircle2 size={18} />, color: DS.purple },
            { step: '03', title: 'Bạn nhận LP', desc: 'Bạn nhận ngay 5% LP trên tổng giá trị hợp đồng, không giới hạn số lần.', icon: <Zap size={18} />, color: GLD.color },
          ].map(s => (
            <div key={s.step} className="p-4 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                  <span style={{ color: s.color }}>{s.icon}</span>
                </div>
                <span style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono }}>BƯỚC {s.step}</span>
              </div>
              <div style={{ color: DS.text2, fontSize: 13, fontWeight: 700, marginBottom: 5 }}>{s.title}</div>
              <div style={{ color: DS.text4, fontSize: 12, lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ── SUPPORT TAB ───────────────────────────────────────────
// ═══════════════════════════════════════════════════════════
function SupportTab() {
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState('');
  const [msg, setMsg] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [submitted, setSubmitted] = useState(false);

  const TICKETS = [
    { id: 'TKT-2401', title: 'Yêu cầu chỉnh sửa thiết kế banner header', status: 'open', priority: 'medium', pm: members[3], date: '20/03/2026', reply: 'Đã tiếp nhận, PM sẽ liên hệ trong 24h.' },
    { id: 'TKT-2389', title: 'Hỏi về tiến độ App Mobile v2', status: 'resolved', priority: 'low', pm: members[4], date: '15/03/2026', reply: 'App đang trong giai đoạn QA. Dự kiến xong 25/03.' },
    { id: 'TKT-2374', title: 'Báo lỗi form liên hệ trên website', status: 'resolved', priority: 'high', pm: members[2], date: '08/03/2026', reply: 'Đã fix bug và deploy. Kiểm tra lại.' },
  ];

  const PRIO_CFG: Record<string, { label: string; color: string }> = {
    low: { label: 'Thấp', color: DS.text4 },
    medium: { label: 'Trung bình', color: DS.amber },
    high: { label: 'Cao', color: DS.red },
  };
  const STATUS_CFG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    open: { label: 'Đang xử lý', color: DS.blue, icon: <Clock size={11} /> },
    resolved: { label: 'Đã giải quyết', color: DS.green, icon: <CheckCircle2 size={11} /> },
    closed: { label: 'Đã đóng', color: DS.text4, icon: <XCircle size={11} /> },
  };

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em' }}>── HỖ TRỢ KHÁCH HÀNG ({TICKETS.filter(t => t.status === 'open').length} đang mở)</div>
        <button onClick={() => { setShowNew(true); setSubmitted(false); }} style={{ background: GRD.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} /> Tạo ticket mới
        </button>
      </div>

      {/* New ticket form */}
      <AnimatePresence>
        {showNew && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
            <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid rgba(59,130,246,0.3)` }}>
              <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 14 }}>── TICKET MỚI</div>
              {submitted ? (
                <div className="flex flex-col items-center py-6">
                  <CheckCircle2 size={40} style={{ color: DS.green, marginBottom: 12 }} />
                  <div style={{ color: DS.text2, fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Ticket đã được gửi!</div>
                  <div style={{ color: DS.text4, fontSize: 13 }}>PM phụ trách sẽ liên hệ bạn trong vòng 24h làm việc.</div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div>
                      <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: 'block', marginBottom: 6 }}>TIÊU ĐỀ</label>
                      <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Mô tả ngắn vấn đề..."
                        style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '9px 12px', color: DS.text2, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: 'block', marginBottom: 6 }}>ĐỘ ƯU TIÊN</label>
                      <div className="flex gap-2">
                        {(['low', 'medium', 'high'] as const).map(p => {
                          const cfg = PRIO_CFG[p];
                          return (
                            <button key={p} onClick={() => setPriority(p)} style={{ flex: 1, padding: '8px', borderRadius: 8, border: `1px solid ${priority === p ? cfg.color : DS.border}`, background: priority === p ? `${cfg.color}12` : 'none', color: priority === p ? cfg.color : DS.text4, cursor: 'pointer', fontSize: 12, fontFamily: DS.mono, transition: 'all 0.15s' }}>
                              {cfg.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, display: 'block', marginBottom: 6 }}>NỘI DUNG CHI TIẾT</label>
                    <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={4} placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
                      style={{ width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '9px 12px', color: DS.text2, fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }} />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowNew(false)} style={{ padding: '9px 20px', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: 'pointer', fontSize: 13 }}>Hủy</button>
                    <button onClick={() => subject && setSubmitted(true)} style={{ flex: 1, background: GRD.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '9px', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Send size={14} /> Gửi ticket
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ticket list */}
      <div className="space-y-3">
        {TICKETS.map((t, i) => {
          const sc = STATUS_CFG[t.status];
          const pc = PRIO_CFG[t.priority];
          return (
            <motion.div key={t.id} className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              whileHover={{ borderColor: `${sc.color}30` }}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0" style={{ border: `1.5px solid ${RANKS[t.pm.rank].color}60` }}>
                    <img src={t.pm.img} alt={t.pm.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{t.id}</span>
                      <span style={{ background: `${pc.color}12`, border: `1px solid ${pc.color}30`, color: pc.color, fontSize: 9, padding: '1px 7px', borderRadius: 20, fontFamily: DS.mono }}>
                        {pc.label}
                      </span>
                    </div>
                    <div style={{ color: DS.text2, fontSize: 13, fontWeight: 700 }}>{t.title}</div>
                    <div style={{ color: DS.text5, fontSize: 11, marginTop: 2 }}>PM: {t.pm.name} · {t.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full flex-shrink-0" style={{ background: `${sc.color}12`, border: `1px solid ${sc.color}30` }}>
                  <span style={{ color: sc.color }}>{sc.icon}</span>
                  <span style={{ color: sc.color, fontSize: 10, fontFamily: DS.mono }}>{sc.label}</span>
                </div>
              </div>
              {t.reply && (
                <div className="flex items-start gap-2 mt-3 p-3 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                  <MessageSquare size={12} style={{ color: DS.text5, marginTop: 1, flexShrink: 0 }} />
                  <span style={{ color: DS.text4, fontSize: 12, lineHeight: 1.5 }}><span style={{ color: RANKS[t.pm.rank].color }}>PM {t.pm.name.split(' ').pop()}:</span> {t.reply}</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Direct contact */}
      <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
        <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 14 }}>── LIÊN HỆ TRỰC TIẾP</div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
          {[
            { icon: <Phone size={16} />, label: 'Hotline', value: '1800 8888 88', sub: 'T2-T7: 8:00 - 18:00', color: DS.green },
            { icon: <Mail size={16} />, label: 'Email', value: 'support@loop.vn', sub: 'Phản hồi trong 2h', color: DS.blue },
            { icon: <MessageSquare size={16} />, label: 'Zalo OA', value: 'LOOP Solutions', sub: 'Kết nối ngay', color: DS.purple },
          ].map(c => (
            <div key={c.label} className="flex items-center gap-3 p-4 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${c.color}12`, border: `1px solid ${c.color}25` }}>
                <span style={{ color: c.color }}>{c.icon}</span>
              </div>
              <div>
                <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.1em' }}>{c.label}</div>
                <div style={{ color: DS.text2, fontSize: 13, fontWeight: 700, marginTop: 1 }}>{c.value}</div>
                <div style={{ color: DS.text5, fontSize: 11, marginTop: 1 }}>{c.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ── COURSES TAB ───────────────────────────────────────────
// ═══════════════════════════════════════════════════════════
function CoursesTab() {
  const fmtVND2 = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

  const MY_COURSES = [
    {
      id: 1, title: 'React & Next.js 14 Từ Zero Đến Hero', instructor: 'Akira Sato',
      progress: 68, totalLessons: 48, completedLessons: 33, status: 'in-progress',
      img: 'https://images.unsplash.com/photo-1634836023845-eddbfe9937da?auto=format&fit=crop&w=300&q=80',
      color: DS.blue, cat: 'Frontend', lpReward: 200, enrolledDate: '01/03/2026',
      nextLesson: 'Route Groups, Layouts và Loading UI', duration: '32h', timeLeft: '~10h còn lại', certificate: false,
    },
    {
      id: 2, title: 'UI/UX Design System với Figma & Tailwind', instructor: 'Mei Lin',
      progress: 100, totalLessons: 32, completedLessons: 32, status: 'completed',
      img: 'https://images.unsplash.com/photo-1590965918603-0dce981d13b8?auto=format&fit=crop&w=300&q=80',
      color: DS.purple, cat: 'Design', lpReward: 150, enrolledDate: '10/01/2026',
      nextLesson: '', duration: '18h', timeLeft: 'Hoàn thành!', certificate: true,
    },
  ];

  const RECOMMENDED = [
    { id: 3, title: 'Node.js API & PostgreSQL: Production-Ready', instructor: 'Ryo Hashimoto', price: 2_500_000, lpReward: 250, img: 'https://images.unsplash.com/photo-1771012788703-d310cdf189bb?auto=format&fit=crop&w=300&q=80', color: DS.cyan, cat: 'Backend', rating: 4.9 },
    { id: 5, title: 'SEO & Content Marketing cho SaaS B2B', instructor: 'Yuna Park', price: 1_200_000, lpReward: 120, img: 'https://images.unsplash.com/photo-1517309561013-16f6e4020305?auto=format&fit=crop&w=300&q=80', color: DS.amber, cat: 'Marketing', rating: 4.8 },
  ];

  const inProgress = MY_COURSES.filter(c => c.status === 'in-progress');
  const completed = MY_COURSES.filter(c => c.status === 'completed');
  const totalLPEarned = completed.reduce((s, c) => s + c.lpReward, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Đang học', value: String(inProgress.length), sub: 'Khóa học', color: DS.blue, icon: <Play size={16} /> },
          { label: 'Đã hoàn thành', value: String(completed.length), sub: 'Khóa học', color: DS.green, icon: <CheckCircle2 size={16} /> },
          { label: 'LP đã nhận', value: totalLPEarned.toLocaleString('vi-VN'), sub: 'Từ khóa học', color: DS.purple, icon: <Zap size={16} /> },
          { label: 'Chứng chỉ', value: String(completed.filter(c => c.certificate).length), sub: 'Đã cấp', color: DS.amber, icon: <Award size={16} /> },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-2xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div style={{ color: s.color, fontFamily: DS.heading, fontSize: 22, fontWeight: 700 }}>{s.value}</div>
            <div style={{ color: DS.text3, fontSize: 12, marginTop: 3 }}>{s.label}</div>
            <div style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* In Progress */}
      {inProgress.length > 0 && (
        <div>
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em', marginBottom: 14 }}>── ĐANG HỌC</div>
          <div className="space-y-4">
            {inProgress.map(c => (
              <motion.div key={c.id} className="rounded-2xl overflow-hidden"
                style={{ background: DS.bgCard, border: `1px solid ${c.color}30` }}
                whileHover={{ borderColor: `${c.color}60` }}>
                <div className="grid grid-cols-1 xl:grid-cols-3">
                  <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
                    <img src={c.img} alt={c.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(2,6,23,0.4) 0%, transparent 60%)' }} />
                    <div className="absolute top-3 left-3">
                      <span style={{ color: c.color, background: 'rgba(2,6,23,0.88)', border: `1px solid ${c.color}40`, borderRadius: 6, padding: '3px 8px', fontSize: 9, fontFamily: DS.mono }}>{c.cat.toUpperCase()}</span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="rounded-full overflow-hidden" style={{ height: 4, background: 'rgba(255,255,255,0.15)' }}>
                        <div style={{ height: '100%', width: `${c.progress}%`, background: c.color, borderRadius: 99 }} />
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontFamily: DS.mono, marginTop: 4 }}>{c.progress}% hoàn thành</div>
                    </div>
                  </div>
                  <div className="xl:col-span-2 p-5 flex flex-col justify-between">
                    <div>
                      <div style={{ color: DS.text, fontSize: 15, fontWeight: 700, marginBottom: 5 }}>{c.title}</div>
                      <div style={{ color: DS.text4, fontSize: 12, marginBottom: 12 }}>👤 {c.instructor} · {c.duration} · Đăng ký {c.enrolledDate}</div>
                      <div className="flex items-center gap-6 mb-4 flex-wrap">
                        <div style={{ color: DS.text4, fontSize: 12 }}><span style={{ color: DS.green }}>{c.completedLessons}</span>/{c.totalLessons} bài học</div>
                        <div style={{ color: DS.text4, fontSize: 12 }}><Clock size={11} style={{ display: 'inline', marginRight: 3 }} />{c.timeLeft}</div>
                      </div>
                      <div className="p-3 rounded-xl mb-4" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                        <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginBottom: 4 }}>BÀI HỌC TIẾP THEO</div>
                        <div style={{ color: DS.text2, fontSize: 13, fontWeight: 600 }}>{c.nextLesson}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div style={{ color: DS.purple, fontSize: 11, fontFamily: DS.mono }}>◈ Hoàn thành nhận +{c.lpReward} LP</div>
                      <button style={{ background: `${c.color}18`, border: `1px solid ${c.color}40`, borderRadius: 10, padding: '8px 18px', color: c.color, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Play size={13} fill={c.color} /> Tiếp tục học
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em', marginBottom: 14 }}>── ĐÃ HOÀN THÀNH</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completed.map(c => (
              <motion.div key={c.id} className="rounded-2xl overflow-hidden"
                style={{ background: DS.bgCard, border: `1px solid ${DS.green}30` }}
                whileHover={{ borderColor: `${DS.green}60`, y: -2 }}>
                <div className="flex gap-4 p-5">
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={c.img} alt={c.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 size={14} style={{ color: DS.green }} />
                      <span style={{ color: DS.green, fontSize: 10, fontFamily: DS.mono }}>HOÀN THÀNH</span>
                    </div>
                    <div style={{ color: DS.text, fontSize: 13, fontWeight: 700, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                    <div style={{ color: DS.text4, fontSize: 12, marginBottom: 8 }}>👤 {c.instructor}</div>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div style={{ color: DS.purple, fontSize: 11, fontFamily: DS.mono }}>◈ +{c.lpReward} LP nhận được</div>
                      {c.certificate && (
                        <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: `${DS.amber}15`, border: `1px solid ${DS.amber}35`, borderRadius: 8, color: DS.amber, fontSize: 11, cursor: 'pointer', fontFamily: DS.mono }}>
                          <Award size={11} /> Tải chứng chỉ
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div>
        <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em', marginBottom: 14 }}>── GỢI Ý TIẾP THEO</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {RECOMMENDED.map(c => (
            <motion.div key={c.id} className="flex gap-4 p-4 rounded-2xl cursor-pointer"
              style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
              whileHover={{ borderColor: `${c.color}40`, y: -2 }}>
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                <img src={c.img} alt={c.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ color: DS.text, fontSize: 13, fontWeight: 700, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                <div style={{ color: DS.text4, fontSize: 12, marginBottom: 6 }}>👤 {c.instructor}</div>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span style={{ color: c.color, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>{fmtVND2(c.price)}</span>
                    <span style={{ color: DS.purple, fontSize: 10, fontFamily: DS.mono, marginLeft: 8 }}>+{c.lpReward} LP</span>
                  </div>
                  <div className="flex items-center gap-1" style={{ color: DS.amber, fontSize: 12 }}>
                    <Star size={11} fill={DS.amber} />{c.rating}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-5">
          <a href="/hoc-vien" style={{ color: DS.blue, fontSize: 13, fontFamily: DS.mono, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            Xem toàn bộ khóa học <ChevronRight size={13} />
          </a>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ── SETTINGS TAB ─────────────────────────────────════════
// ═══════════════════════════════════════════════════════════
function SettingsTab() {
  const CUSTOMER = useCustomerProfile();
  const GLD = RANKS[CUSTOMER.rank] ?? RANKS['gold'];
  const [name, setName] = useState(CUSTOMER.name);
  const [email, setEmail] = useState(CUSTOMER.email);
  const [phone, setPhone] = useState(CUSTOMER.phone);
  const [company, setCompany] = useState(CUSTOMER.company);
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [saved, setSaved] = useState(false);

  const inputStyle = { width: '100%', background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 10, padding: '10px 14px', color: DS.text2, fontSize: 13, outline: 'none', boxSizing: 'border-box' as const };
  const labelStyle = { color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.12em', display: 'block', marginBottom: 6 };

  const toggle = (val: boolean, set: (v: boolean) => void) => (
    <button onClick={() => set(!val)} style={{ width: 44, height: 24, borderRadius: 99, border: 'none', cursor: 'pointer', background: val ? DS.blue : DS.border, position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
      <div style={{ position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', left: val ? 'calc(100% - 22px)' : 2, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
    </button>
  );

  return (
    <div className="max-w-2xl space-y-5">
      {/* Profile */}
      <div className="rounded-2xl p-6" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
        <div className="flex items-center gap-3 mb-5">
          <User size={16} style={{ color: DS.blue }} />
          <div style={{ color: DS.text2, fontSize: 14, fontWeight: 700 }}>Thông tin cá nhân</div>
        </div>
        <div className="flex items-center gap-4 mb-5 p-4 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
          <div className="w-14 h-14 rounded-2xl overflow-hidden" style={{ border: `2px solid ${GLD.color}`, boxShadow: `0 0 16px ${GLD.glowColor}` }}>
            <img src={CUSTOMER.avatar} alt={CUSTOMER.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <div style={{ color: DS.text, fontSize: 15, fontWeight: 700 }}>{CUSTOMER.name}</div>
            <div style={{ color: GLD.color, fontSize: 11, fontFamily: DS.mono }}>{GLD.symbol} GOLD · Lv.{CUSTOMER.level} · {CUSTOMER.company}</div>
          </div>
          <button style={{ marginLeft: 'auto', padding: '7px 14px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, color: DS.blue, cursor: 'pointer', fontSize: 12 }}>Đổi ảnh</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 xl:col-span-1">
            <label style={labelStyle}>HỌ VÀ TÊN</label>
            <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
          </div>
          <div className="col-span-2 xl:col-span-1">
            <label style={labelStyle}>CÔNG TY</label>
            <input value={company} onChange={e => setCompany(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>EMAIL</label>
            <input value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>ĐIỆN THOẠI</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="rounded-2xl p-6" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
        <div className="flex items-center gap-3 mb-5">
          <Lock size={16} style={{ color: DS.purple }} />
          <div style={{ color: DS.text2, fontSize: 14, fontWeight: 700 }}>Bảo mật</div>
        </div>
        <div className="space-y-3">
          {['Đổi mật khẩu', 'Xác thực 2 bước (2FA)', 'Lịch sử đăng nhập'].map(item => (
            <div key={item} className="flex items-center justify-between p-3 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
              <span style={{ color: DS.text3, fontSize: 13 }}>{item}</span>
              <ChevronRight size={15} style={{ color: DS.text5 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-2xl p-6" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
        <div className="flex items-center gap-3 mb-5">
          <Bell size={16} style={{ color: DS.amber }} />
          <div style={{ color: DS.text2, fontSize: 14, fontWeight: 700 }}>Thông báo</div>
        </div>
        <div className="space-y-4">
          {[
            { label: 'Email thông báo tiến độ dự án', desc: 'Nhận email khi có cập nhật mới', val: emailNotif, set: setEmailNotif },
            { label: 'SMS khi hóa đơn được tạo', desc: 'Tin nhắn xác nhận qua số điện thoại', val: smsNotif, set: setSmsNotif },
          ].map(({ label, desc, val, set }) => (
            <div key={label} className="flex items-center justify-between">
              <div>
                <div style={{ color: DS.text2, fontSize: 13, fontWeight: 600 }}>{label}</div>
                <div style={{ color: DS.text4, fontSize: 12, marginTop: 2 }}>{desc}</div>
              </div>
              {toggle(val, set)}
            </div>
          ))}
        </div>
      </div>

      {/* Billing */}
      <div className="rounded-2xl p-6" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
        <div className="flex items-center gap-3 mb-5">
          <CreditCard size={16} style={{ color: DS.cyan }} />
          <div style={{ color: DS.text2, fontSize: 14, fontWeight: 700 }}>Thông tin thanh toán</div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
          <div className="grid grid-cols-2 gap-3" style={{ fontSize: 12 }}>
            {[
              { label: 'Tên công ty', val: CUSTOMER.company },
              { label: 'Mã số thuế', val: '0123456789' },
              { label: 'Địa chỉ', val: '123 Nguyễn Huệ, Q.1, TP.HCM' },
              { label: 'Hình thức', val: 'Chuyển khoản ngân hàng' },
            ].map(({ label, val }) => (
              <div key={label}>
                <div style={{ color: DS.text5, marginBottom: 2 }}>{label}</div>
                <div style={{ color: DS.text3, fontWeight: 600 }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
        <button style={{ marginTop: 12, padding: '8px 14px', background: 'none', border: `1px solid ${DS.border}`, borderRadius: 8, color: DS.text3, cursor: 'pointer', fontSize: 12 }}>Cập nhật thông tin thanh toán</button>
      </div>

      {/* Save */}
      <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
        style={{ background: GRD.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', cursor: 'pointer', fontSize: 14, fontWeight: 700, boxShadow: '0 0 20px rgba(129,140,248,0.35)', display: 'flex', alignItems: 'center', gap: 8 }}>
        {saved ? <><Check size={16} /> Đã lưu!</> : 'Lưu thay đổi'}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ── MEDIA BOOKING TAB ────────────────────────────────────
// ═══════════════════════════════════════════════════════════
function MediaBookingTab() {
  const { orders } = useLoopStore();
  const mediaOrders = orders.filter(o => o.id.startsWith('MDA-') || o.tags?.includes('media'));

  const fmtPrice = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

  const statusCfg: Record<string, { label: string; color: string }> = {
    pending_payment: { label: 'Chờ thanh toán', color: DS.amber },
    paid: { label: 'Đã thanh toán', color: DS.blue },
    in_progress: { label: 'Đang thực hiện', color: DS.purple },
    demo_ready: { label: 'Đã giao file', color: DS.cyan },
    done: { label: 'Hoàn thành', color: DS.green },
    cancelled: { label: 'Hủy', color: DS.red },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.18em' }}>── MEDIA BOOKING CỦA BẠN</div>
          <div style={{ color: DS.text4, fontSize: 12, marginTop: 4 }}>Chụp ảnh, quay phim, làm content — theo dõi tiến độ tại đây.</div>
        </div>
        <Link to="/media" style={{ background: GRD.primary, color: '#fff', fontSize: 12, fontWeight: 600, padding: '8px 18px', borderRadius: 10, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 0 14px rgba(129,140,248,0.3)' }}>
          <Camera size={14} /> Book mới
        </Link>
      </div>

      {mediaOrders.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <Camera size={48} style={{ color: DS.text5, margin: '0 auto 16px' }} />
          <div style={{ color: DS.text3, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Chưa có booking nào</div>
          <div style={{ color: DS.text4, fontSize: 13, marginBottom: 20, maxWidth: 360, margin: '0 auto 20px' }}>
            Đặt lịch chụp ảnh, quay phim hoặc làm content với đội ngũ chuyên nghiệp của LOOP.
          </div>
          <Link to="/media" style={{ background: GRD.primary, color: '#fff', padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            Bắt đầu Book →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {mediaOrders.map(o => {
            const sc = statusCfg[o.status] ?? { label: o.status, color: DS.text4 };
            return (
              <motion.div key={o.id} className="p-5 rounded-2xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Camera size={14} style={{ color: '#F59E0B' }} />
                      <span style={{ color: DS.text, fontSize: 14, fontWeight: 700 }}>{o.title}</span>
                    </div>
                    <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{o.id} · {o.createdAt}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg" style={{ background: `${sc.color}12`, border: `1px solid ${sc.color}30`, color: sc.color, fontSize: 10, fontFamily: DS.mono }}>
                      {sc.label}
                    </span>
                    <span style={{ color: '#F59E0B', fontFamily: DS.mono, fontSize: 13, fontWeight: 700 }}>{fmtPrice(o.budget)}</span>
                  </div>
                </div>
                {/* Progress */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-full overflow-hidden" style={{ height: 4, background: DS.border }}>
                    <motion.div style={{ height: '100%', borderRadius: 4, background: o.progress > 80 ? DS.green : o.progress > 40 ? DS.blue : DS.amber }}
                      initial={{ width: '0%' }} animate={{ width: `${o.progress}%` }} transition={{ duration: 1.2 }} />
                  </div>
                  <span style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono }}>{o.progress}%</span>
                </div>
                {o.lpReward > 0 && (
                  <div className="mt-2" style={{ color: DS.purple, fontSize: 10, fontFamily: DS.mono }}>
                    ◈ +{o.lpReward.toLocaleString()} LP sau khi hoàn thành
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ── MAIN ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════
export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const renderTab = () => {
    switch (activeTab) {
      case 'home':     return <HomeTab onSelect={setActiveTab} />;
      case 'projects': return <ProjectsTab />;
      case 'media':    return <MediaBookingTab />;
      case 'quests':   return <QuestsTab />;
      case 'courses':  return <CoursesTab />;
      case 'effects':  return <EffectsInventoryTab />;
      case 'invoices': return <InvoicesTab />;
      case 'lp':       return <LPWalletTab />;
      case 'referral': return <ReferralTab />;
      case 'support':  return <SupportTab />;
      case 'settings': return <SettingsTab />;
      default:         return <HomeTab onSelect={setActiveTab} />;
    }
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

      {/* Main content */}
      <div className="flex flex-col" style={{ marginLeft: isMobile ? 0 : 230, minHeight: '100vh' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 15 }}>
          <TopBar tab={activeTab} onSelect={setActiveTab} onMenuToggle={() => setSidebarOpen(v => !v)} />
        </div>
        <div className="flex-1 overflow-auto" style={{ padding: isMobile ? '14px 12px' : '24px', paddingBottom: isMobile ? 88 : 24 }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.22, ease: 'easeOut' }}>
              {renderTab()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      {isMobile && (
        <CustomerMobileBottomNav
          active={activeTab}
          onSelect={setActiveTab}
          onMenuOpen={() => setSidebarOpen(true)}
        />
      )}

      {/* Floating Chat Widget */}
      <ChatWidget isAdmin={false} />
    </div>
  );
}
