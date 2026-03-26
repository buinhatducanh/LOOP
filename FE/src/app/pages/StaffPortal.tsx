/**
 * StaffPortal — Dedicated portal for Staff / Manager roles
 * Tabs: Tổng quan · Dự án · Nhiệm vụ · Ví LP · Hồ sơ · (Manager: Nhóm)
 */
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home, FolderKanban, Star, Wallet, User,
  LogOut, Menu, X, Bell, Zap, CheckCircle2, Clock, Plus,
  ChevronRight, ArrowUpRight, Globe, Shield, TrendingUp,
  Target, Flame, Award, Gift, BarChart3, Users, Settings,
  Trophy, Building2, Activity, ChevronDown, ChevronUp,
  GripVertical,
} from 'lucide-react';
import { DS, GRD } from '../components/layout/ds';
import { members, RANKS } from '../components/team/memberData';
import { useAuthStore } from '../store/authStore';
import { useLoopStore } from '../store/loopStore';
import { ChatWidget } from '../components/ui/ChatWidget';
import { useIsMobile } from '../components/ui/use-mobile';

const fmtLP = (n: number) => n.toLocaleString('vi-VN');
const fmtLP2 = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K`
  : String(n);

// ── NAV ────────────────────────────────────────────────────────────────────
const NAV_STAFF = [
  { id: 'home',     icon: <Home size={16} />,        label: 'Tổng quan' },
  { id: 'projects', icon: <FolderKanban size={16} />, label: 'Dự án' },
  { id: 'quests',   icon: <Star size={16} />,          label: 'Nhiệm vụ', badge: 2 },
  { id: 'lp',       icon: <Wallet size={16} />,        label: 'Ví LP' },
  { id: 'profile',  icon: <User size={16} />,          label: 'Hồ sơ' },
];
const NAV_MANAGER = [
  { id: 'home',     icon: <Home size={16} />,        label: 'Tổng quan' },
  { id: 'team',     icon: <Users size={16} />,        label: 'Quản lý nhóm' },
  { id: 'projects', icon: <FolderKanban size={16} />, label: 'Dự án' },
  { id: 'quests',   icon: <Star size={16} />,          label: 'Nhiệm vụ', badge: 2 },
  { id: 'lp',       icon: <Wallet size={16} />,        label: 'Ví LP' },
  { id: 'profile',  icon: <User size={16} />,          label: 'Hồ sơ' },
];

// ── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar({
  active, onSelect, isOpen, onClose,
  user,
}: {
  active: string;
  onSelect: (id: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
  user: ReturnType<typeof useAuthStore>['user'];
}) {
  const isMobile = useIsMobile();
  const { logout } = useAuthStore();
  const nav = useNavigate();

  const member = user
    ? members.find(m => m.name.toLowerCase().includes(user.shortName.toLowerCase())) ?? members[10]
    : members[10];
  const rc = RANKS[member.rank];

  const handleSelect = (id: string) => {
    onSelect(id);
    if (isMobile && onClose) onClose();
  };

  const inner = (
    <div className="flex flex-col" style={{ width: isMobile ? 280 : 220, background: DS.bgCard, borderRight: `1px solid ${DS.border}`, minHeight: '100vh', height: '100%' }}>
      {/* Logo */}
      <div className="p-5 flex items-center gap-3" style={{ borderBottom: `1px solid ${DS.border}` }}>
        {isMobile && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: DS.text4, padding: 4, marginRight: 2 }}>
            <X size={18} />
          </button>
        )}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: GRD.primary, boxShadow: '0 0 16px rgba(129,140,248,0.4)' }}>
          <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
            <path d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" fill="none" />
            <path d="M20 8 L30 13.5 L30 25 L20 30.5 L10 25 L10 13.5 Z" fill="rgba(255,255,255,0.12)" />
            <text x="20" y="25" textAnchor="middle" fontSize="14" fontWeight="900" fill="white" fontFamily="serif">∞</text>
          </svg>
        </div>
        <div>
          <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: 12, fontWeight: 900, letterSpacing: '0.08em' }}>LOOP OS</div>
          <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.15em' }}>STAFF PORTAL</div>
        </div>
      </div>

      {/* Staff card */}
      <div className="mx-3 mt-3 p-3 rounded-xl relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${rc.color}12, ${rc.color}05)`, border: `1px solid ${rc.color}30` }}>
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0" style={{ border: `1.5px solid ${rc.color}`, boxShadow: `0 0 10px ${rc.glowColor}` }}>
            <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <div style={{ color: DS.text, fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name ?? member.name}</div>
            <div style={{ color: rc.color, fontSize: 9, fontFamily: DS.mono }}>{rc.symbol} {rc.label.toUpperCase()} · {user?.role.toUpperCase()}</div>
            {user?.department && (
              <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, marginTop: 1 }}>Bộ phận: {user.department}</div>
            )}
          </div>
        </div>
        {/* LP mini bar */}
        <div className="mt-2.5">
          <div className="flex justify-between mb-1">
            <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>LP BALANCE</span>
            <span style={{ color: rc.color, fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>{fmtLP(user?.lpBalance ?? member.lpBalance)}</span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: 3, background: DS.border }}>
            <div style={{ height: '100%', width: '62%', background: `linear-gradient(90deg, ${rc.gradientFrom}, ${rc.gradientTo})`, borderRadius: 99 }} />
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 mt-2 space-y-0.5">
        <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.2em', marginBottom: 8, marginLeft: 8 }}>ĐIỀU HƯỚNG</div>
        {(user?.role === 'manager' ? NAV_MANAGER : NAV_STAFF).map(item => (
          <button key={item.id} onClick={() => handleSelect(item.id)}
            className="w-full flex items-center gap-3 px-3 rounded-xl text-left"
            style={{ background: active === item.id ? 'rgba(59,130,246,0.12)' : 'rgba(0,0,0,0)', border: active === item.id ? '1px solid rgba(59,130,246,0.22)' : '1px solid transparent', color: active === item.id ? DS.blue : DS.text3, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s', minHeight: 44, paddingTop: 10, paddingBottom: 10 }}>
            <span style={{ color: active === item.id ? DS.blue : DS.text4 }}>{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {(item as any).badge && (
              <span style={{ background: DS.red, color: '#fff', fontSize: 9, borderRadius: 10, padding: '1px 6px', fontFamily: DS.mono }}>{(item as any).badge}</span>
            )}
            {active === item.id && <div className="w-1.5 h-1.5 rounded-full" style={{ background: DS.blue, boxShadow: `0 0 6px ${DS.blue}` }} />}
          </button>
        ))}

        {/* Quick links */}
        <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.2em', marginBottom: 8, marginLeft: 8, marginTop: 16 }}>LIÊN KẾT</div>
        {[
          { to: '/', icon: <Globe size={14} />, label: 'Trang chủ' },
          { to: '/bang-xep-hang', icon: <Trophy size={14} />, label: 'Bảng xếp hạng' },
          { to: '/admin', icon: <Shield size={14} />, label: 'Admin Dashboard' },
        ].map(l => (
          <Link key={l.to} to={l.to} onClick={() => isMobile && onClose && onClose()}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
            style={{ color: DS.text4, fontSize: 12, textDecoration: 'none', minHeight: 40 }}>
            <span style={{ color: DS.text5 }}>{l.icon}</span>{l.label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3" style={{ borderTop: `1px solid ${DS.border}` }}>
        <button onClick={() => { logout(); nav('/dang-nhap'); }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
          style={{ background: 'none', border: 'none', color: DS.text4, fontSize: 12, cursor: 'pointer', textAlign: 'left' }}>
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

// ── TopBar ──────────────────────────────────────────────────────────────────
function TopBar({ tab, onMenuToggle, user }: {
  tab: string;
  onMenuToggle: () => void;
  user: ReturnType<typeof useAuthStore>['user'];
}) {
  const isMobile = useIsMobile();
  const { getUnreadAdminCount } = useLoopStore();
  const unread = getUnreadAdminCount();
  const labels: Record<string, string> = {
    home: 'Tổng quan cá nhân', projects: 'Dự án của tôi',
    quests: 'Nhiệm vụ & Thành tựu', lp: 'Ví điểm thưởng LP',
    profile: 'Hồ sơ cá nhân', team: 'Quản lý nhóm',
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
          {!isMobile && <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.2em' }}>STAFF PORTAL · {user?.role.toUpperCase()}</div>}
          <div style={{ color: DS.text, fontSize: isMobile ? 13 : 15, fontWeight: 700 }}>{labels[tab] ?? tab}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)' }}>
          <Zap size={11} style={{ color: DS.blue }} />
          <span style={{ color: DS.blue, fontSize: isMobile ? 11 : 12, fontFamily: DS.mono, fontWeight: 700 }}>
            {fmtLP(user?.lpBalance ?? 0)} LP
          </span>
        </div>
        <div className="relative w-9 h-9 flex items-center justify-center rounded-xl"
          style={{ background: DS.bgCard2, border: `1px solid ${DS.border}`, cursor: 'pointer', color: DS.text3 }}>
          <Bell size={15} />
          {unread > 0 && (
            <div className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: DS.red, boxShadow: `0 0 6px ${DS.red}` }}>
              <span style={{ color: '#fff', fontSize: 8, fontFamily: DS.mono }}>{unread}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── HOME TAB ────────────────────────────────────────────────────────────────
function HomeTab({ user, onSelect }: { user: ReturnType<typeof useAuthStore>['user']; onSelect: (t: string) => void }) {
  const { orders } = useLoopStore();
  const { quests, dailyStreak, checkIn, lastCheckIn } = useAuthStore();
  const isMobile = useIsMobile();

  const member = user
    ? members.find(m => m.name.toLowerCase().includes(user.shortName.toLowerCase())) ?? members[10]
    : members[10];
  const rc = RANKS[member.rank];
  const today = new Date().toDateString();
  const checkedIn = lastCheckIn === today;

  const myQuests = quests.filter(q =>
    q.forRoles.includes(user?.role ?? 'staff') &&
    (q.status === 'available' || q.status === 'in_progress')
  ).slice(0, 4);

  const myOrders = orders.filter(o =>
    o.assignedPM && o.assignedPM.includes(user?.shortName ?? '')
  ).slice(0, 4);

  const STATS = [
    { label: 'Dự án đang làm', value: String(myOrders.length || 3), color: DS.blue, icon: <FolderKanban size={15} /> },
    { label: 'Điểm LP hiện có', value: fmtLP(user?.lpBalance ?? 8500), color: rc.color, icon: <Zap size={15} /> },
    { label: 'Nhiệm vụ chờ', value: String(myQuests.length), color: DS.amber, icon: <Target size={15} /> },
    { label: 'Streak hiện tại', value: `${dailyStreak} ngày`, color: DS.red, icon: <Flame size={15} /> },
  ];

  const ACTIVITIES = [
    { text: 'Task "Design homepage v3" được chuyển sang Done', time: '30 phút trước', color: DS.green, icon: <CheckCircle2 size={12} /> },
    { text: 'PM Akira Sato assign bạn vào dự án VNRetail v4', time: '2 giờ trước', color: DS.blue, icon: <FolderKanban size={12} /> },
    { text: 'Bạn nhận được +350 LP từ task hoàn thành', time: '5 giờ trước', color: rc.color, icon: <Zap size={12} /> },
    { text: 'Review sprint demo lúc 15:00 hôm nay', time: 'Hôm nay, 15:00', color: DS.amber, icon: <Clock size={12} /> },
    { text: 'Streak 12 ngày — Tiếp tục giữ vững!', time: '1 ngày trước', color: DS.red, icon: <Flame size={12} /> },
  ];

  return (
    <div className="space-y-5">
      {/* ── Rank card ── */}
      <div className="rounded-2xl relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${DS.bgCard3} 0%, ${DS.bgCard} 100%)`, border: `1px solid ${rc.color}30`, minHeight: 160 }}>
        <div style={{ position: 'absolute', top: -50, right: -30, width: 200, height: 200, borderRadius: '50%', background: `${rc.color}06`, filter: 'blur(50px)' }} />
        <div className="relative z-10 p-6 flex flex-col xl:flex-row items-start xl:items-center gap-5">
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div className="w-16 h-16 rounded-2xl overflow-hidden" style={{ border: `2px solid ${rc.color}`, boxShadow: `0 0 20px ${rc.glowColor}` }}>
              <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: DS.bgCard, border: `1.5px solid ${rc.color}`, fontSize: 10 }}>
              {rc.symbol}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.2em', marginBottom: 4 }}>LOOP STAFF PORTAL · THÀNH VIÊN</div>
            <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: 18, fontWeight: 900, letterSpacing: '0.04em' }}>{user?.name?.toUpperCase() ?? member.name.toUpperCase()}</div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span style={{ color: rc.color, fontSize: 10, fontFamily: DS.mono }}>{rc.symbol} {rc.label} · Lv.{user?.level ?? member.level}</span>
              {user?.department && <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>· Bộ phận: {user.department}</span>}
              <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>· {user?.role.toUpperCase()}</span>
            </div>
            {/* XP bar */}
            <div className="mt-3" style={{ maxWidth: 280 }}>
              <div className="flex justify-between mb-1">
                <span style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>XP PROGRESS</span>
                <span style={{ color: rc.color, fontSize: 9, fontFamily: DS.mono }}>62% → Lv.{(user?.level ?? 28) + 1}</span>
              </div>
              <div className="rounded-full overflow-hidden" style={{ height: 5, background: DS.border }}>
                <motion.div style={{ height: '100%', background: `linear-gradient(90deg, ${rc.gradientFrom}, ${rc.gradientTo})`, borderRadius: 99 }}
                  initial={{ width: '0%' }} animate={{ width: '62%' }} transition={{ duration: 1.2, ease: 'easeOut' }} />
              </div>
            </div>
          </div>

          {/* Daily check-in */}
          <div className="flex-shrink-0">
            <motion.button
              onClick={checkIn}
              disabled={checkedIn}
              style={{
                padding: '10px 20px', borderRadius: 12, border: 'none', cursor: checkedIn ? 'default' : 'pointer',
                background: checkedIn ? `${DS.green}20` : GRD.primary,
                color: checkedIn ? DS.green : '#fff', fontSize: 12, fontWeight: 700,
                boxShadow: checkedIn ? 'none' : '0 0 16px rgba(129,140,248,0.4)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
              whileHover={checkedIn ? {} : { scale: 1.03 }}
              whileTap={checkedIn ? {} : { scale: 0.97 }}>
              {checkedIn ? <><CheckCircle2 size={14} /> Đã điểm danh</> : <><Flame size={14} /> Điểm danh hôm nay</>}
            </motion.button>
            <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, textAlign: 'center', marginTop: 6 }}>
              🔥 Streak: {dailyStreak} ngày · +50 LP
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {STATS.map(s => (
          <motion.div key={s.label} className="rounded-2xl p-4" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                <span style={{ color: s.color }}>{s.icon}</span>
              </div>
              <ChevronRight size={13} style={{ color: DS.text5 }} />
            </div>
            <div style={{ color: s.color, fontFamily: DS.heading, fontSize: 20, fontWeight: 700, textShadow: `0 0 10px ${s.color}40` }}>{s.value}</div>
            <div style={{ color: DS.text4, fontSize: 11, marginTop: 3 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Bottom grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Active quests mini */}
        <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em' }}>── NHIỆM VỤ ĐANG CHỜ</div>
            <button onClick={() => onSelect('quests')} style={{ color: DS.blue, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontFamily: DS.mono, display: 'flex', alignItems: 'center', gap: 4 }}>
              Tất cả <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-2.5">
            {myQuests.map(q => (
              <div key={q.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                  style={{ background: `${q.color}15`, border: `1px solid ${q.color}25` }}>
                  {q.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ color: DS.text2, fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.title}</div>
                  <div className="rounded-full overflow-hidden mt-1" style={{ height: 3, background: DS.border }}>
                    <div style={{ height: '100%', width: `${(q.progress / q.target) * 100}%`, background: q.color, borderRadius: 99 }} />
                  </div>
                </div>
                <div style={{ color: q.color, fontSize: 10, fontFamily: DS.mono, fontWeight: 700, flexShrink: 0 }}>+{q.lpReward} LP</div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 14 }}>── HOẠT ĐỘNG CỦA TÔI</div>
          <div className="space-y-3">
            {ACTIVITIES.map((a, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `${a.color}15`, border: `1px solid ${a.color}25` }}>
                  <span style={{ color: a.color }}>{a.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ color: DS.text3, fontSize: 12, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.text}</div>
                  <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginTop: 2 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PROJECTS TAB — with Kanban Lite ─────────────────────────────────────────
function ProjectsTab({ user }: { user: ReturnType<typeof useAuthStore>['user'] }) {
  const { orders } = useLoopStore();
  const FILTERS = ['Tất cả', 'Đang làm', 'Review', 'Hoàn thành'];
  const [filter, setFilter] = useState('Tất cả');
  const [kanbanView, setKanbanView] = useState(false);

  type KCol = 'todo' | 'doing' | 'done';
  const [kanbanTasks, setKanbanTasks] = useState([
    { id: 'k1', title: 'Thiết kế landing page VNRetail v3', col: 'todo' as KCol, priority: 'high', tag: 'Design', lp: 300 },
    { id: 'k2', title: 'Code component Button & Input DS', col: 'todo' as KCol, priority: 'medium', tag: 'Frontend', lp: 150 },
    { id: 'k3', title: 'Review PR #42 — Auth middleware', col: 'doing' as KCol, priority: 'high', tag: 'Backend', lp: 200 },
    { id: 'k4', title: 'Viết unit test cho Payment service', col: 'doing' as KCol, priority: 'medium', tag: 'Backend', lp: 250 },
    { id: 'k5', title: 'Sprint demo prep — VNRetail v3', col: 'done' as KCol, priority: 'high', tag: 'PM', lp: 500 },
    { id: 'k6', title: 'Deploy staging server #3', col: 'done' as KCol, priority: 'low', tag: 'DevOps', lp: 180 },
  ]);

  const moveTask = (id: string, col: KCol) =>
    setKanbanTasks(prev => prev.map(t => t.id === id ? { ...t, col } : t));

  const KCOLS: { id: KCol; label: string; color: string; dotColor: string }[] = [
    { id: 'todo',  label: 'Cần làm',     color: DS.text5, dotColor: DS.border },
    { id: 'doing', label: 'Đang làm',    color: DS.blue,  dotColor: DS.blue },
    { id: 'done',  label: 'Hoàn thành', color: DS.green, dotColor: DS.green },
  ];
  const PRIORITY_CFG: Record<string, { color: string }> = {
    high: { color: DS.red }, medium: { color: DS.amber }, low: { color: DS.green },
  };

  const allOrders = orders.slice(0, 12);
  const filtered = filter === 'Tất cả' ? allOrders
    : filter === 'Đang làm' ? allOrders.filter(o => o.status === 'in_progress')
    : filter === 'Review' ? allOrders.filter(o => o.status === 'client_review' || o.status === 'demo_ready')
    : allOrders.filter(o => o.status === 'done');

  const STATUS_CFG: Record<string, { label: string; color: string }> = {
    pending_payment: { label: 'Chờ thanh toán', color: DS.text4 },
    paid: { label: 'Mới - Chờ phân công', color: DS.blue },
    in_progress: { label: 'Đang thực hiện', color: DS.purple },
    demo_ready: { label: 'Demo sẵn sàng', color: DS.cyan },
    client_review: { label: 'Client review', color: DS.amber },
    done: { label: 'Hoàn thành', color: DS.green },
    cancelled: { label: 'Đã hủy', color: DS.red },
  };

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center gap-2 flex-wrap justify-between">
        <div className="flex gap-2">
          <button onClick={() => setKanbanView(false)}
            style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${!kanbanView ? DS.blue : DS.border}`, background: !kanbanView ? 'rgba(59,130,246,0.12)' : 'transparent', color: !kanbanView ? DS.blue : DS.text4, cursor: 'pointer', fontSize: 12, fontFamily: DS.mono, display: 'flex', alignItems: 'center', gap: 5 }}>
            <BarChart3 size={13} /> Dự án
          </button>
          <button onClick={() => setKanbanView(true)}
            style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${kanbanView ? DS.purple : DS.border}`, background: kanbanView ? 'rgba(129,140,248,0.1)' : 'transparent', color: kanbanView ? DS.purple : DS.text4, cursor: 'pointer', fontSize: 12, fontFamily: DS.mono, display: 'flex', alignItems: 'center', gap: 5 }}>
            <GripVertical size={13} /> Kanban cá nhân
          </button>
        </div>
        {!kanbanView && (
          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${filter === f ? DS.blue : DS.border}`, background: filter === f ? 'rgba(59,130,246,0.12)' : 'transparent', color: filter === f ? DS.blue : DS.text4, cursor: 'pointer', fontSize: 11, fontFamily: DS.mono, transition: 'all 0.15s' }}>
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {kanbanView ? (
        <div>
          <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.2)' }}>
            <div style={{ color: DS.purple, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 3 }}>── KANBAN CÁ NHÂN · {user?.name?.toUpperCase() ?? 'BẠN'}</div>
            <div style={{ color: DS.text5, fontSize: 11 }}>Task được assign cho bạn. Chuyển sang Done để nhận LP.</div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {KCOLS.map(col => {
              const colTasks = kanbanTasks.filter(t => t.col === col.id);
              return (
                <div key={col.id} className="rounded-2xl p-4" style={{ background: DS.bgCard, border: `1px solid ${col.id === 'done' ? `${DS.green}25` : DS.border}`, minHeight: 180 }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: col.dotColor, boxShadow: col.id !== 'todo' ? `0 0 5px ${col.dotColor}` : 'none' }} />
                      <span style={{ color: col.color, fontSize: 10, fontFamily: DS.mono, fontWeight: 700, letterSpacing: '0.1em' }}>{col.label.toUpperCase()}</span>
                    </div>
                    <span style={{ color: DS.text5, fontSize: 10, background: DS.bgCard2, border: `1px solid ${DS.border}`, borderRadius: 20, padding: '1px 7px', fontFamily: DS.mono }}>{colTasks.length}</span>
                  </div>
                  <div className="space-y-2">
                    {colTasks.map(task => {
                      const pc = PRIORITY_CFG[task.priority];
                      return (
                        <motion.div key={task.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                          className="p-3 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div style={{ color: DS.text, fontSize: 11, fontWeight: 600, lineHeight: 1.4, flex: 1 }}>{task.title}</div>
                            <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: pc.color }} />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span style={{ color: DS.text5, fontSize: 9, background: DS.bgCard, border: `1px solid ${DS.border}`, padding: '1px 6px', borderRadius: 20, fontFamily: DS.mono }}>{task.tag}</span>
                              <span style={{ color: DS.amber, fontSize: 9, fontFamily: DS.mono, fontWeight: 700 }}>+{task.lp}LP</span>
                            </div>
                            <div className="flex gap-0.5">
                              {col.id !== 'todo' && (
                                <button onClick={() => moveTask(task.id, col.id === 'done' ? 'doing' : 'todo')}
                                  style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: `1px solid ${DS.border}`, borderRadius: 5, cursor: 'pointer', color: DS.text5, fontSize: 10 }}>←</button>
                              )}
                              {col.id !== 'done' && (
                                <button onClick={() => moveTask(task.id, col.id === 'todo' ? 'doing' : 'done')}
                                  style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: col.id === 'doing' ? `${DS.green}15` : `${DS.blue}15`, border: `1px solid ${col.id === 'doing' ? DS.green + '40' : DS.blue + '40'}`, borderRadius: 5, cursor: 'pointer', color: col.id === 'doing' ? DS.green : DS.blue, fontSize: 10 }}>→</button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                    {colTasks.length === 0 && (
                      <div style={{ color: DS.text5, fontSize: 11, textAlign: 'center', padding: '16px 0', borderRadius: 10, border: `1px dashed ${DS.border}` }}>Trống</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o, i) => {
            const sc = STATUS_CFG[o.status] ?? { label: o.status, color: DS.text4 };
            return (
              <motion.div key={o.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className="p-4 rounded-2xl" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span style={{ color: DS.text, fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.title}</span>
                      <span style={{ color: sc.color, background: `${sc.color}12`, border: `1px solid ${sc.color}30`, fontSize: 9, padding: '1px 8px', borderRadius: 20, fontFamily: DS.mono, flexShrink: 0 }}>{sc.label}</span>
                    </div>
                    <div style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono }}>{o.clientCompany} · {o.id} · PM: {o.assignedPM ?? '—'}</div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div style={{ color: DS.blue, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>{(o.budget / 1_000_000).toFixed(0)}M</div>
                    <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>⏰ {o.deadline ?? '—'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-full overflow-hidden" style={{ height: 5, background: DS.border }}>
                    <motion.div
                      style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${sc.color}80, ${sc.color})` }}
                      initial={{ width: '0%' }} animate={{ width: `${o.progress}%` }} transition={{ duration: 1, delay: i * 0.04 + 0.2 }}
                    />
                  </div>
                  <span style={{ color: sc.color, fontSize: 11, fontFamily: DS.mono, fontWeight: 700, flexShrink: 0 }}>{o.progress}%</span>
                </div>
                {o.tags.length > 0 && (
                  <div className="flex gap-1.5 mt-2.5 flex-wrap">
                    {o.tags.slice(0, 4).map(t => (
                      <span key={t} style={{ color: DS.text5, fontSize: 9, background: DS.bgCard2, border: `1px solid ${DS.border}`, padding: '1px 6px', borderRadius: 4 }}>{t}</span>
                    ))}
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

// ── QUESTS TAB ──────────────────────────────────────────────────────────────
function QuestsTab({ user }: { user: ReturnType<typeof useAuthStore>['user'] }) {
  const { quests, events, checkIn, lastCheckIn, dailyStreak, completeQuest, joinEvent } = useAuthStore();
  const [tab, setTab] = useState<'quests' | 'events'>('quests');
  const today = new Date().toDateString();
  const checkedIn = lastCheckIn === today;

  const myQuests = quests.filter(q => q.forRoles.includes(user?.role ?? 'staff'));
  const completedCount = myQuests.filter(q => q.status === 'completed').length;
  const totalLP = myQuests.filter(q => q.status === 'completed').reduce((s, q) => s + q.lpReward, 0);

  const FREQ_CFG: Record<string, { label: string; color: string }> = {
    daily: { label: 'Hằng ngày', color: DS.amber },
    weekly: { label: 'Hằng tuần', color: DS.blue },
    monthly: { label: 'Hằng tháng', color: DS.purple },
    one_time: { label: 'Một lần', color: DS.cyan },
    event: { label: 'Sự kiện', color: DS.green },
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Hoàn thành', val: completedCount, color: DS.green },
          { label: 'LP từ quest', val: `${fmtLP(totalLP)} LP`, color: DS.amber },
          { label: 'Streak', val: `${dailyStreak} ngày 🔥`, color: DS.red },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div style={{ color: s.color, fontFamily: DS.heading, fontSize: 18, fontWeight: 700 }}>{s.val}</div>
            <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tab switch */}
      <div className="flex gap-2">
        {[{ id: 'quests' as const, label: 'Nhiệm vụ' }, { id: 'events' as const, label: 'Sự kiện' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '8px 20px', borderRadius: 10, border: `1px solid ${tab === t.id ? DS.blue : DS.border}`, background: tab === t.id ? 'rgba(59,130,246,0.1)' : 'transparent', color: tab === t.id ? DS.blue : DS.text4, cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'quests' ? (
        <div className="space-y-3">
          {myQuests.map((q, i) => {
            const fc = FREQ_CFG[q.frequency] ?? { label: q.frequency, color: DS.text4 };
            const pct = q.target > 1 ? (q.progress / q.target) * 100 : q.status === 'completed' ? 100 : 0;
            return (
              <motion.div key={q.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className="p-4 rounded-2xl" style={{ background: DS.bgCard, border: `1px solid ${q.status === 'completed' ? `${DS.green}30` : DS.border}`, opacity: q.status === 'expired' ? 0.5 : 1 }}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                    style={{ background: `${q.color}15`, border: `1px solid ${q.color}25` }}>
                    {q.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span style={{ color: DS.text, fontSize: 13, fontWeight: 700 }}>{q.title}</span>
                      <span style={{ background: `${fc.color}12`, border: `1px solid ${fc.color}30`, color: fc.color, fontSize: 9, padding: '1px 7px', borderRadius: 20, fontFamily: DS.mono }}>{fc.label}</span>
                      {q.status === 'completed' && (
                        <span style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: DS.green, fontSize: 9, padding: '1px 7px', borderRadius: 20, fontFamily: DS.mono }}>✓ Hoàn thành</span>
                      )}
                    </div>
                    <div style={{ color: DS.text4, fontSize: 12, marginBottom: 6 }}>{q.description}</div>
                    {q.target > 1 && (
                      <div>
                        <div className="flex justify-between mb-1">
                          <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{q.progress}/{q.target}</span>
                          <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{Math.round(pct)}%</span>
                        </div>
                        <div className="rounded-full overflow-hidden" style={{ height: 5, background: DS.border }}>
                          <motion.div style={{ height: '100%', background: `linear-gradient(90deg, ${q.color}80, ${q.color})`, borderRadius: 99 }}
                            initial={{ width: '0%' }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div style={{ color: q.color, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>+{q.lpReward}</div>
                    <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono }}>LP</div>
                    {q.status !== 'completed' && q.target === 1 && (
                      <button onClick={() => completeQuest(q.id)}
                        style={{ marginTop: 6, padding: '4px 10px', background: `${q.color}12`, border: `1px solid ${q.color}30`, borderRadius: 6, color: q.color, fontSize: 10, cursor: 'pointer', fontFamily: DS.mono }}>
                        Hoàn thành
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((ev, i) => (
            <motion.div key={ev.id}
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              className="p-5 rounded-2xl relative overflow-hidden"
              style={{ background: DS.bgCard, border: `1px solid ${ev.color}30` }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: `${ev.color}06`, filter: 'blur(30px)' }} />
              <div className="relative z-10">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: `${ev.color}15`, border: `1px solid ${ev.color}30` }}>
                      {ev.icon}
                    </div>
                    <div>
                      <div style={{ color: DS.text, fontSize: 14, fontWeight: 700 }}>{ev.title}</div>
                      <div style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono }}>{ev.startDate} → {ev.endDate}</div>
                    </div>
                  </div>
                  {ev.active && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: `${DS.green}12`, border: `1px solid ${DS.green}30` }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: DS.green }} />
                      <span style={{ color: DS.green, fontSize: 9, fontFamily: DS.mono }}>ĐANG DIỄN RA</span>
                    </div>
                  )}
                </div>
                <div style={{ color: DS.text4, fontSize: 12, marginBottom: 12, lineHeight: 1.6 }}>{ev.description}</div>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Users size={12} style={{ color: DS.text5 }} />
                      <span style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>{ev.participants}/{ev.maxParticipants}</span>
                    </div>
                    <div style={{ color: ev.color, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>×{ev.lpBonus} LP Bonus</div>
                  </div>
                  {ev.active && (
                    <button onClick={() => joinEvent(ev.id)}
                      style={{ padding: '6px 16px', background: `${ev.color}15`, border: `1px solid ${ev.color}35`, borderRadius: 8, color: ev.color, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: DS.mono }}>
                      Tham gia
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── LP TAB ──────────────────────────────────────────────────────────────────
function LPTab({ user }: { user: ReturnType<typeof useAuthStore>['user'] }) {
  const member = user
    ? members.find(m => m.name.toLowerCase().includes(user.shortName.toLowerCase())) ?? members[10]
    : members[10];
  const rc = RANKS[member.rank];
  const balance = user?.lpBalance ?? member.lpBalance;
  const RATE = 500; // 1000 LP = 500K VNĐ

  const TXS = [
    { label: 'Hoàn thành task "Backend API refactor"', type: 'earn', amount: 350, date: '24/03/2026', ref: 'TASK-4421' },
    { label: 'Điểm danh hàng ngày · Streak bonus', type: 'earn', amount: 50, date: '24/03/2026', ref: 'DAILY' },
    { label: 'Hoàn thành sprint review đúng hạn', type: 'earn', amount: 200, date: '20/03/2026', ref: 'SPRINT-22' },
    { label: 'Quy đổi LP → Voucher ăn uống', type: 'spend', amount: -500, date: '15/03/2026', ref: 'VOUCHER-01' },
    { label: 'Bonus "First Blood" · Đơn đầu tiên', type: 'earn', amount: 500, date: '10/03/2026', ref: 'ACH-FIRST' },
    { label: 'Bonus đánh giá 360° tháng 2', type: 'earn', amount: 1000, date: '01/03/2026', ref: 'REVIEW-T2' },
    { label: 'Referral thành công · StartupX JSC', type: 'earn', amount: 2000, date: '20/02/2026', ref: 'REF-042' },
  ];

  const totalEarned = TXS.filter(t => t.type === 'earn').reduce((s, t) => s + t.amount, 0);
  const totalSpent = Math.abs(TXS.filter(t => t.type === 'spend').reduce((s, t) => s + t.amount, 0));

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Big balance */}
      <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${rc.color}12 0%, ${rc.color}05 60%, rgba(29,78,216,0.08) 100%)`, border: `1px solid ${rc.color}35` }}>
        <div style={{ position: 'absolute', top: -40, right: -30, width: 160, height: 160, borderRadius: '50%', background: `${rc.color}06`, filter: 'blur(40px)' }} />
        <div className="relative z-10">
          <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.2em', marginBottom: 6 }}>◈ LOOP POINTS · SỐ DƯ HIỆN TẠI</div>
          <div style={{ color: rc.color, fontFamily: DS.heading, fontSize: 48, fontWeight: 900, textShadow: `0 0 30px ${rc.glowColor}`, lineHeight: 1, marginBottom: 4 }}>
            {fmtLP(balance)}
          </div>
          <div style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono }}>
            LP ≈ {(Math.round((balance / 1000) * RATE * 1000)).toLocaleString('vi-VN')} VNĐ giảm giá tối đa
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Tổng tích lũy (demo)', val: fmtLP(totalEarned), color: DS.green },
          { label: 'Đã quy đổi (demo)', val: fmtLP(totalSpent), color: DS.amber },
          { label: 'Số dư hiện tại', val: fmtLP(balance), color: rc.color },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div style={{ color: s.color, fontFamily: DS.heading, fontSize: 18, fontWeight: 700 }}>{s.val}</div>
            <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Rank path */}
      <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
        <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 16 }}>── LỘ TRÌNH THĂNG HẠNG</div>
        <div className="flex items-center gap-1">
          {(['iron', 'bronze', 'silver', 'gold', 'platinum', 'ruby', 'diamond'] as const).map((rk, i) => {
            const r = RANKS[rk];
            const isActive = rk === member.rank;
            const isPast = r.tier < RANKS[member.rank].tier;
            return (
              <div key={rk} className="flex items-center gap-1 flex-1">
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: isActive ? `${r.color}20` : isPast ? `${r.color}10` : 'rgba(0,0,0,0)', border: `1px solid ${isActive ? r.color : isPast ? `${r.color}50` : DS.border}`, boxShadow: isActive ? `0 0 10px ${r.glowColor}` : 'none' }}>
                    <span style={{ fontSize: 12, color: isActive ? r.color : isPast ? `${r.color}80` : DS.text5 }}>{r.symbol}</span>
                  </div>
                  <span style={{ fontSize: 7, fontFamily: DS.mono, color: isActive ? r.color : isPast ? `${r.color}60` : DS.text5 }}>{r.label.slice(0, 4)}</span>
                </div>
                {i < 6 && <div style={{ width: 8, height: 1, background: isPast ? `${r.color}50` : DS.border, flexShrink: 0, marginBottom: 14 }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction history */}
      <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
        <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 14 }}>── LỊCH SỬ GIAO DỊCH</div>
        <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 340 }}>
          {TXS.map((tx, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.border}` }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: tx.type === 'earn' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${tx.type === 'earn' ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.25)'}` }}>
                {tx.type === 'earn'
                  ? <ArrowUpRight size={14} style={{ color: DS.green }} />
                  : <ArrowUpRight size={14} style={{ color: DS.amber, transform: 'rotate(180deg)' }} />}
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
  );
}

// ── PROFILE TAB ─────────────────────────────────────────────────────────────
function ProfileTab({ user }: { user: ReturnType<typeof useAuthStore>['user'] }) {
  const member = user
    ? members.find(m => m.name.toLowerCase().includes(user.shortName.toLowerCase())) ?? members[10]
    : members[10];
  const rc = RANKS[member.rank];
  const [saved, setSaved] = useState(false);
  const [showHistory, setShowHistory] = useState(true);

  const SKILLS = Object.entries(member.skills ?? {}).slice(0, 5).map(([label, pct]) => ({
    label, pct,
    color: label === 'Code' ? DS.blue : label === 'Design' ? DS.purple : label === 'Strategy' ? DS.amber : label === 'Execution' ? DS.green : DS.cyan,
  }));

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Profile card */}
      <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: DS.bgCard, border: `1px solid ${rc.color}30` }}>
        <div style={{ position: 'absolute', top: -40, right: -30, width: 150, height: 150, borderRadius: '50%', background: `${rc.color}06`, filter: 'blur(40px)' }} />
        <div className="relative z-10 flex items-center gap-5 flex-wrap">
          <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0" style={{ border: `2px solid ${rc.color}`, boxShadow: `0 0 20px ${rc.glowColor}` }}>
            <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div style={{ color: DS.text, fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{user?.name ?? member.name}</div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl" style={{ background: `${rc.color}15`, border: `1px solid ${rc.color}30` }}>
                <span style={{ color: rc.color }}>{rc.symbol}</span>
                <span style={{ color: rc.color, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>{rc.label} · Lv.{user?.level ?? member.level}</span>
              </div>
              <span style={{ color: DS.text4, fontSize: 12 }}>{user?.role ?? 'staff'} · {user?.department ?? 'engineering'}</span>
            </div>
            <div style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, marginTop: 6 }}>{user?.email ?? `${member.name.toLowerCase().replace(' ', '.')}@loop.vn`}</div>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="rounded-2xl p-6" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
        <div style={{ color: DS.text2, fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Kỹ năng chuyên môn</div>
        <div className="space-y-3">
          {SKILLS.map(s => (
            <div key={s.label}>
              <div className="flex justify-between mb-1.5">
                <span style={{ color: DS.text3, fontSize: 12 }}>{s.label}</span>
                <span style={{ color: s.color, fontSize: 11, fontFamily: DS.mono, fontWeight: 700 }}>{s.pct}%</span>
              </div>
              <div className="rounded-full overflow-hidden" style={{ height: 6, background: DS.border }}>
                <motion.div
                  style={{ height: '100%', background: `linear-gradient(90deg, ${s.color}80, ${s.color})`, borderRadius: 99 }}
                  initial={{ width: '0%' }} animate={{ width: `${s.pct}%` }} transition={{ duration: 1.2, ease: 'easeOut' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Rank History Timeline ── */}
      <div className="rounded-2xl p-6" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
        <button onClick={() => setShowHistory(v => !v)}
          className="w-full flex items-center justify-between"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: showHistory ? 16 : 0 }}>
          <div style={{ color: DS.text2, fontSize: 14, fontWeight: 700 }}>🏅 Lịch sử thăng hạng</div>
          <div className="flex items-center gap-2">
            <span style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono }}>{member.rankHistory?.length ?? 0} mốc</span>
            {showHistory ? <ChevronUp size={16} style={{ color: DS.text4 }} /> : <ChevronDown size={16} style={{ color: DS.text4 }} />}
          </div>
        </button>

        <AnimatePresence>
          {showHistory && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-px" style={{ background: `linear-gradient(180deg, ${rc.color}60, transparent)` }} />
                <div className="space-y-4">
                  {[...(member.rankHistory ?? [])].reverse().map((evt, i) => {
                    const r = RANKS[evt.rank];
                    const isLatest = i === 0;
                    return (
                      <motion.div key={i}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                        className="flex items-start gap-4 relative pl-10">
                        <div className="absolute left-2.5 top-1 w-5 h-5 rounded-full flex items-center justify-center -translate-x-1/2"
                          style={{ background: isLatest ? r.color : `${r.color}30`, border: `2px solid ${r.color}`, boxShadow: isLatest ? `0 0 10px ${r.glowColor}` : 'none', fontSize: 9, flexShrink: 0 }}>
                          {r.symbol}
                        </div>
                        <div className="flex-1 p-3 rounded-xl" style={{ background: isLatest ? `${r.color}08` : DS.bgCard2, border: `1px solid ${isLatest ? r.color + '30' : DS.border}` }}>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span style={{ color: r.color, fontFamily: DS.mono, fontSize: 11, fontWeight: 700 }}>{r.symbol} {r.label} · Lv.{evt.level}</span>
                            {isLatest && <span style={{ color: r.color, fontSize: 9, background: `${r.color}15`, border: `1px solid ${r.color}30`, padding: '1px 7px', borderRadius: 20, fontFamily: DS.mono }}>HIỆN TẠI</span>}
                          </div>
                          <div style={{ color: DS.text3, fontSize: 12, lineHeight: 1.5 }}>{evt.note}</div>
                          <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginTop: 4 }}>{evt.date}</div>
                        </div>
                      </motion.div>
                    );
                  })}
                  {(!member.rankHistory || member.rankHistory.length === 0) && (
                    <div style={{ color: DS.text5, fontSize: 12, textAlign: 'center', padding: '16px 0' }}>Chưa có lịch sử thăng hạng</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Achievements */}
      <div className="rounded-2xl p-6" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
        <div style={{ color: DS.text2, fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Thành tựu đạt được</div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {(member.achievements ?? ['First Blood', 'Streak', 'Fast Coder', 'Team Player']).slice(0, 4).map((ach, i) => {
            const icons = ['🏆', '🔥', '⚡', '🌟'];
            const colors = [DS.amber, DS.red, DS.blue, DS.purple];
            return (
              <div key={ach} className="flex flex-col items-center gap-2 p-4 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${colors[i % colors.length]}25` }}>
                <div style={{ fontSize: 22 }}>{icons[i % icons.length]}</div>
                <div style={{ color: colors[i % colors.length], fontSize: 11, fontFamily: DS.mono, fontWeight: 700, textAlign: 'center' }}>{ach}</div>
              </div>
            );
          })}
        </div>
      </div>

      <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
        style={{ background: GRD.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', cursor: 'pointer', fontSize: 14, fontWeight: 700, boxShadow: '0 0 20px rgba(129,140,248,0.35)', display: 'flex', alignItems: 'center', gap: 8 }}>
        {saved ? <><CheckCircle2 size={16} /> Đã lưu!</> : 'Cập nhật hồ sơ'}
      </button>
    </div>
  );
}

// ── MANAGER TEAM HUB TAB ────────────────────────────────────────────────────
function TeamTab({ user }: { user: ReturnType<typeof useAuthStore>['user'] }) {
  const { orders } = useLoopStore();
  const dept = user?.department ?? 'media';
  const [selectedMember, setSelectedMember] = useState<number | null>(null);

  const teamMembers = members.slice(0, 8);
  const teamOrders = orders.filter(o =>
    o.status === 'in_progress' || o.status === 'demo_ready' || o.status === 'paid'
  ).slice(0, 6);

  const totalLP = teamMembers.reduce((s, m) => s + m.lpBalance, 0);
  const avgLevel = Math.round(teamMembers.reduce((s, m) => s + m.level, 0) / teamMembers.length);
  const completedOrders = orders.filter(o => o.status === 'done').length;

  const KPIs = [
    { label: 'Thành viên nhóm', value: String(teamMembers.length), color: DS.blue, icon: <Users size={15} /> },
    { label: 'LP nhóm tích lũy', value: fmtLP2(totalLP), color: DS.amber, icon: <Zap size={15} /> },
    { label: 'Level trung bình', value: String(avgLevel), color: DS.purple, icon: <TrendingUp size={15} /> },
    { label: 'Dự án hoàn thành', value: String(completedOrders), color: DS.green, icon: <CheckCircle2 size={15} /> },
  ];

  // Radar chart data
  const SKILLS = ['Code', 'Design', 'Strategy', 'Execution', 'Teamwork'];
  const avgSkills = SKILLS.map(sk => ({
    label: sk,
    value: Math.round(teamMembers.reduce((s, m) => s + (m.skills[sk] ?? 0), 0) / teamMembers.length),
  }));
  const radarR = 60, cx = 80, cy = 80;
  const radarPoints = avgSkills.map((s, i) => {
    const angle = (i / avgSkills.length) * 2 * Math.PI - Math.PI / 2;
    const pct = s.value / 100;
    return {
      x: cx + radarR * pct * Math.cos(angle),
      y: cy + radarR * pct * Math.sin(angle),
      labelX: cx + (radarR + 14) * Math.cos(angle),
      labelY: cy + (radarR + 14) * Math.sin(angle),
      label: s.label,
      value: s.value,
    };
  });
  const gridPoints5 = (pct: number) => avgSkills.map((_, i) => {
    const angle = (i / avgSkills.length) * 2 * Math.PI - Math.PI / 2;
    return `${cx + radarR * pct * Math.cos(angle)},${cy + radarR * pct * Math.sin(angle)}`;
  }).join(' ');

  return (
    <div className="space-y-5">
      {/* Manager badge */}
      <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(129,140,248,0.12) 0%, rgba(20,184,166,0.06) 100%)', border: '1px solid rgba(129,140,248,0.25)' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(129,140,248,0.06)', filter: 'blur(30px)' }} />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(129,140,248,0.15)', border: '1px solid rgba(129,140,248,0.3)' }}>
            <Building2 size={22} style={{ color: DS.purple }} />
          </div>
          <div>
            <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.2em', marginBottom: 2 }}>MANAGER HUB · BỘ PHẬN</div>
            <div style={{ color: DS.text, fontSize: 18, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{dept}</div>
            <div style={{ color: DS.purple, fontSize: 11, fontFamily: DS.mono }}>{user?.name} · Quản lý nhóm</div>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {KPIs.map(k => (
          <motion.div key={k.label} className="rounded-2xl p-4" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${k.color}12`, border: `1px solid ${k.color}25` }}>
                <span style={{ color: k.color }}>{k.icon}</span>
              </div>
            </div>
            <div style={{ color: k.color, fontFamily: DS.heading, fontSize: 22, fontWeight: 700 }}>{k.value}</div>
            <div style={{ color: DS.text4, fontSize: 11, marginTop: 2 }}>{k.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Team member list */}
        <div className="xl:col-span-2 rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 16 }}>── THÀNH VIÊN NHÓM · LP & LEVEL</div>
          <div className="space-y-2">
            {teamMembers.map((m, i) => {
              const rc = RANKS[m.rank];
              const isSelected = selectedMember === m.id;
              const pct = Math.round((m.lpBalance / Math.max(...teamMembers.map(mm => mm.lpBalance))) * 100);
              return (
                <motion.div
                  key={m.id}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer"
                  style={{ background: isSelected ? `${DS.blue}08` : DS.bgCard2, border: `1px solid ${isSelected ? DS.blue + '30' : DS.border}`, transition: 'all 0.15s' }}
                  onClick={() => setSelectedMember(isSelected ? null : m.id)}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                >
                  <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0" style={{ border: `1.5px solid ${rc.color}60` }}>
                    <img src={m.img} alt={m.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ color: DS.text, fontSize: 12, fontWeight: 700 }}>{m.name}</span>
                      <span style={{ color: rc.color, fontSize: 9, fontFamily: DS.mono, background: `${rc.color}12`, padding: '1px 6px', borderRadius: 20 }}>{rc.symbol} {rc.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 rounded-full overflow-hidden" style={{ height: 3, background: DS.border }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${rc.gradientFrom}, ${rc.gradientTo})`, borderRadius: 99 }} />
                      </div>
                      <span style={{ color: rc.color, fontSize: 10, fontFamily: DS.mono, fontWeight: 700 }}>{fmtLP2(m.lpBalance)}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono }}>Lv.{m.level}</div>
                    <div style={{ color: DS.text5, fontSize: 10 }}>{m.missions} tasks</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Radar + task progress */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 12 }}>── KỸ NĂNG NHÓM TB</div>
            <svg viewBox="0 0 160 160" className="w-full" style={{ maxWidth: 180, display: 'block', margin: '0 auto' }}>
              {[0.25, 0.5, 0.75, 1].map((pct, i) => (
                <polygon key={i} points={gridPoints5(pct)} fill="none" stroke={DS.border} strokeWidth="0.8" />
              ))}
              {avgSkills.map((_, i) => {
                const angle = (i / avgSkills.length) * 2 * Math.PI - Math.PI / 2;
                return (
                  <line key={i} x1={cx} y1={cy}
                    x2={cx + radarR * Math.cos(angle)} y2={cy + radarR * Math.sin(angle)}
                    stroke={DS.border} strokeWidth="0.8"
                  />
                );
              })}
              <motion.polygon
                points={radarPoints.map(p => `${p.x},${p.y}`).join(' ')}
                fill="rgba(129,140,248,0.15)" stroke={DS.purple} strokeWidth="1.5"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }}
              />
              {radarPoints.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={3} fill={DS.purple} stroke={DS.bgCard} strokeWidth="1.5" />
              ))}
              {radarPoints.map((p, i) => (
                <text key={`l${i}`} x={p.labelX} y={p.labelY} textAnchor="middle" dominantBaseline="middle"
                  fill={DS.text5} fontSize="7" fontFamily={DS.mono}>
                  {p.label}
                </text>
              ))}
            </svg>
          </div>

          <div className="rounded-2xl p-4" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em', marginBottom: 10 }}>── TIẾN ĐỘ DỰ ÁN</div>
            <div className="space-y-2">
              {teamOrders.slice(0, 4).map(o => (
                <div key={o.id} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: o.status === 'done' ? DS.green : o.status === 'demo_ready' ? DS.cyan : DS.blue }} />
                  <div style={{ color: DS.text3, fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.title}</div>
                  <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, flexShrink: 0 }}>{o.progress}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* LP distribution bar */}
      <div className="rounded-2xl p-5" style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
        <div className="flex items-center justify-between mb-4">
          <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: '0.15em' }}>── PHÂN PHỐI LP NHÓM</div>
          <button style={{ padding: '6px 14px', background: GRD.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Plus size={11} /> Thưởng LP
          </button>
        </div>
        <div className="flex gap-0.5 rounded-xl overflow-hidden" style={{ height: 28 }}>
          {[...teamMembers].sort((a, b) => b.lpBalance - a.lpBalance).map((m, i) => {
            const rc = RANKS[m.rank];
            const pct = (m.lpBalance / totalLP) * 100;
            return (
              <motion.div key={m.id}
                style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${rc.gradientFrom}, ${rc.gradientTo})` }}
                title={`${m.name}: ${fmtLP2(m.lpBalance)} LP (${pct.toFixed(1)}%)`}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
              />
            );
          })}
        </div>
        <div className="flex gap-3 mt-3 flex-wrap">
          {[...teamMembers].sort((a, b) => b.lpBalance - a.lpBalance).slice(0, 5).map(m => {
            const rc = RANKS[m.rank];
            return (
              <div key={m.id} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: rc.color }} />
                <span style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>{m.name.split(' ').pop()}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Mobile bottom nav ────────────────────────────────────────────────────────
function BottomNav({ active, onSelect, onMenuOpen }: { active: string; onSelect: (id: string) => void; onMenuOpen: () => void }) {
  const ITEMS = [
    { id: 'home',     icon: <Home size={20} />,        label: 'Tổng quan' },
    { id: 'projects', icon: <FolderKanban size={20} />, label: 'Dự án' },
    { id: 'quests',   icon: <Star size={20} />,          label: 'Nhiệm vụ' },
    { id: 'lp',       icon: <Wallet size={20} />,        label: 'Ví LP' },
  ];
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30, background: DS.bgCard, borderTop: `1px solid ${DS.border}`, paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
      <div className="flex">
        {ITEMS.map(item => (
          <button key={item.id} onClick={() => onSelect(item.id)}
            className="flex-1 flex flex-col items-center gap-0.5"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: active === item.id ? DS.blue : DS.text4, padding: '10px 0 8px', minHeight: 56 }}>
            {active === item.id && (
              <motion.div layoutId="staffBottomIndicator" style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 32, height: 2, background: DS.blue, borderRadius: 1 }} />
            )}
            {item.icon}
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

// ── MAIN ────────────────────────────────────────────────────────────────────
export default function StaffPortal() {
  const { user, isAuthenticated } = useAuthStore();
  const nav = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect if not authenticated or wrong role
  useEffect(() => {
    if (!isAuthenticated) { nav('/dang-nhap'); return; }
    if (user?.role === 'client') { nav('/khach-hang'); return; }
  }, [isAuthenticated, user, nav]);

  const renderTab = () => {
    switch (activeTab) {
      case 'home':     return <HomeTab user={user} onSelect={setActiveTab} />;
      case 'team':     return <TeamTab user={user} />;
      case 'projects': return <ProjectsTab user={user} />;
      case 'quests':   return <QuestsTab user={user} />;
      case 'lp':       return <LPTab user={user} />;
      case 'profile':  return <ProfileTab user={user} />;
      default:         return <HomeTab user={user} onSelect={setActiveTab} />;
    }
  };

  return (
    <div style={{ background: DS.bg, minHeight: '100vh', fontFamily: DS.body }}>
      {/* Desktop sidebar */}
      {!isMobile && (
        <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 20, overflowY: 'auto' }}>
          <Sidebar active={activeTab} onSelect={setActiveTab} user={user} />
        </div>
      )}
      {/* Mobile sidebar */}
      {isMobile && (
        <Sidebar active={activeTab} onSelect={setActiveTab} user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex flex-col" style={{ marginLeft: isMobile ? 0 : 220, minHeight: '100vh' }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 15 }}>
          <TopBar tab={activeTab} onMenuToggle={() => setSidebarOpen(v => !v)} user={user} />
        </div>
        <div className="flex-1 overflow-auto" style={{ padding: isMobile ? '14px 12px' : '24px', paddingBottom: isMobile ? 88 : 24 }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}>
              {renderTab()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile bottom nav */}
      {isMobile && (
        <BottomNav active={activeTab} onSelect={setActiveTab} onMenuOpen={() => setSidebarOpen(true)} />
      )}

      {/* Chat widget */}
      <ChatWidget isAdmin={false} />
    </div>
  );
}