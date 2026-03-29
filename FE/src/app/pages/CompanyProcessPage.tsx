/**
 * CompanyProcessPage — Trang "Quy trình công ty" LOOP Solutions
 * Tài liệu nội bộ chuẩn hóa nghiệp vụ theo FE-first roadmap (UI giữ nguyên, data source kết nối BE dần theo phase)
 * Route: /quy-trinh
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, Lock, ChevronDown, ChevronUp, Zap,
  Users, FolderKanban, BarChart3,
  CheckCircle2, Settings, Database, Code,
  TrendingUp, Award, Bell, CreditCard, Globe,
  Camera, Star, Package,
} from 'lucide-react';
import { DS, GRD } from '../components/layout/ds';

const fmtLP = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K`
  : String(n);

type SectionId =
  | 'intro' | 'architecture' | 'roles' | 'lp_system' | 'rank_system'
  | 'order_flow' | 'project_flow' | 'kanban_flow' | 'media_flow'
  | 'notification_flow' | 'quest_flow' | 'data_models' | 'permissions'
  | 'ui_rules' | 'algorithms';

// ── Collapsible Section ───────────────────────────────────────────────────────
function Section({
  id, icon, title, badge, children, defaultOpen = false,
}: {
  id: SectionId; icon: React.ReactNode; title: string; badge?: string;
  children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl overflow-hidden" id={id}
      style={{ border: `1px solid ${DS.border}`, background: DS.bgCard }}>
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-3 p-5"
        style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}>
            <span style={{ color: DS.blue }}>{icon}</span>
          </div>
          <div>
            <div style={{ color: DS.text, fontSize: 14, fontWeight: 700 }}>{title}</div>
            {badge && <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono, marginTop: 1 }}>{badge}</div>}
          </div>
        </div>
        {open ? <ChevronUp size={16} style={{ color: DS.text4, flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: DS.text4, flexShrink: 0 }} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden">
            <div className="px-5 pb-6 pt-1"
              style={{ borderTop: `1px solid ${DS.border}` }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Code-style block ──────────────────────────────────────────────────────────
function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="rounded-xl p-4 overflow-x-auto text-xs"
      style={{ background: DS.bgCard2, border: `1px solid ${DS.border}`, color: DS.cyan, fontFamily: DS.mono, lineHeight: 1.7, margin: '12px 0' }}>
      {code}
    </pre>
  );
}

// ── Flow step row ─────────────────────────────────────────────────────────────
function FlowStep({ step, label, desc, color = DS.blue, last = false }: {
  step: string; label: string; desc: string; color?: string; last?: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
          style={{ background: `${color}20`, border: `2px solid ${color}`, color, fontFamily: DS.mono }}>
          {step}
        </div>
        {!last && <div className="w-px flex-1 mt-1" style={{ background: `${color}30`, minHeight: 24 }} />}
      </div>
      <div className="pb-4 flex-1">
        <div style={{ color, fontSize: 12, fontWeight: 700, fontFamily: DS.mono, marginBottom: 2 }}>{label}</div>
        <div style={{ color: DS.text3, fontSize: 12, lineHeight: 1.6 }}>{desc}</div>
      </div>
    </div>
  );
}

// ── Table ─────────────────────────────────────────────────────────────────────
function DocTable({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${DS.border}`, margin: '12px 0' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: DS.bgCard2 }}>
            {headers.map(h => (
              <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: DS.text5, fontFamily: DS.mono, fontSize: 10, letterSpacing: '0.1em', borderBottom: `1px solid ${DS.border}`, fontWeight: 700 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: `1px solid ${DS.border}`, background: ri % 2 === 0 ? 'transparent' : `${DS.bgCard2}60` }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{ padding: '9px 14px', color: DS.text3, verticalAlign: 'top' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Tag({ label, color = DS.blue }: { label: string; color?: string }) {
  return (
    <span style={{ background: `${color}12`, border: `1px solid ${color}30`, color, fontSize: 9, padding: '2px 8px', borderRadius: 20, fontFamily: DS.mono, fontWeight: 700, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════
// ── MAIN ────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════
export default function CompanyProcessPage() {
  const TOC: { id: SectionId; label: string }[] = [
    { id: 'intro',          label: '00 · Tổng quan hệ thống' },
    { id: 'architecture',   label: '01 · Kiến trúc kỹ thuật' },
    { id: 'roles',          label: '02 · Vai trò & phân quyền' },
    { id: 'data_models',    label: '03 · Mô hình dữ liệu' },
    { id: 'order_flow',     label: '04 · Luồng đơn hàng' },
    { id: 'project_flow',   label: '05 · Luồng quản lý dự án' },
    { id: 'kanban_flow',    label: '06 · Kanban & Task flow' },
    { id: 'media_flow',     label: '07 · Media Booking flow' },
    { id: 'lp_system',      label: '08 · Hệ thống LP' },
    { id: 'rank_system',    label: '09 · Hệ thống Rank' },
    { id: 'quest_flow',     label: '10 · Quest & Event flow' },
    { id: 'notification_flow', label: '11 · Notification flow' },
    { id: 'permissions',    label: '12 · Ma trận quyền hạn' },
    { id: 'algorithms',     label: '13 · Thuật toán & Logic' },
    { id: 'ui_rules',       label: '14 · Quy tắc UI/UX' },
  ];

  return (
    <div style={{ background: DS.bg, minHeight: '100vh', fontFamily: DS.body }}>
      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden py-16 px-8"
        style={{ background: 'linear-gradient(135deg, rgba(29,78,216,0.18) 0%, rgba(129,140,248,0.08) 60%, rgba(20,184,166,0.06) 100%)', borderBottom: `1px solid rgba(59,130,246,0.15)` }}>
        {/* BG glows */}
        <div style={{ position: 'absolute', top: -80, right: -60, width: 400, height: 400, borderRadius: '50%', background: 'rgba(129,140,248,0.05)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: 40, width: 300, height: 300, borderRadius: '50%', background: 'rgba(59,130,246,0.04)', filter: 'blur(60px)', pointerEvents: 'none' }} />

        <div className="max-w-5xl mx-auto">
          {/* Classified badge */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)' }}>
            <Lock size={11} style={{ color: DS.red }} />
            <span style={{ color: DS.red, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.2em' }}>
              TÀI LIỆU MẬT · CHỈ ĐỌC NỘI BỘ · KHÔNG PHÁT TÁN
            </span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            style={{ fontFamily: DS.heading, fontSize: 'clamp(22px,4vw,40px)', fontWeight: 900, letterSpacing: '0.06em', background: GRD.heroText, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 12 }}>
            QUY TRÌNH VẬN HÀNH LOOP SOLUTIONS
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ color: DS.text3, fontSize: 14, lineHeight: 1.8, maxWidth: 680, marginBottom: 20 }}>
            Tài liệu nội bộ tổng hợp toàn bộ quy trình nghiệp vụ, luồng logic kỹ thuật, cấu trúc dữ liệu, thuật toán và nguyên tắc thiết kế của hệ điều hành LOOP Solutions. Phiên bản Season III · 2026.
          </motion.p>

          {/* Meta chips */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
            className="flex gap-3 flex-wrap">
            {[
              { label: 'Season III · 2026', color: DS.blue },
              { label: '27 thành viên', color: DS.purple },
              { label: 'Zustand + React', color: DS.cyan },
              { label: 'Tailwind v4 + Motion', color: DS.amber },
              { label: 'Pure-SVG Charts', color: DS.green },
              { label: 'VNĐ · LP Dual Currency', color: DS.red },
            ].map(c => (
              <Tag key={c.label} label={c.label} color={c.color} />
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* TOC sidebar (sticky) */}
        <aside className="hidden xl:block xl:col-span-1">
          <div className="sticky top-4 rounded-2xl p-4"
            style={{ background: DS.bgCard, border: `1px solid ${DS.border}` }}>
            <div style={{ color: DS.text5, fontSize: 9, fontFamily: DS.mono, letterSpacing: '0.2em', marginBottom: 12 }}>MỤC LỤC</div>
            <div className="space-y-0.5">
              {TOC.map(t => (
                <a key={t.id} href={`#${t.id}`}
                  style={{ display: 'block', color: DS.text4, fontSize: 11, padding: '5px 8px', borderRadius: 7, textDecoration: 'none', fontFamily: DS.mono, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = DS.blue; e.currentTarget.style.background = 'rgba(59,130,246,0.07)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = DS.text4; e.currentTarget.style.background = 'transparent'; }}>
                  {t.label}
                </a>
              ))}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="xl:col-span-3 space-y-4">

          {/* ── 00 Tổng quan ── */}
          <Section id="intro" icon={<Globe size={16} />} title="00 · Tổng quan hệ thống" badge="LOOP Solutions Digital Agency OS" defaultOpen={true}>
            <div style={{ color: DS.text3, fontSize: 13, lineHeight: 1.9, marginBottom: 16 }}>
              LOOP Solutions là một <strong style={{ color: DS.text }}>hệ điều hành số (Digital Agency OS)</strong> được xây dựng để vận hành toàn bộ hoạt động của một Digital Agency hiện đại. Hệ thống kết hợp 4 lớp chính:
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {[
                { icon: <Globe size={14} />, label: 'Public Website', desc: 'Landing, dịch vụ, portfolio, blog, academy, leaderboard, media booking — dành cho khách hàng tiềm năng.', color: DS.blue },
                { icon: <Shield size={14} />, label: 'Admin Dashboard', desc: 'Quản trị toàn hệ thống: đơn hàng, nhân sự, LP, doanh thu, kanban, notification — chỉ dành cho admin & manager.', color: DS.purple },
                { icon: <Users size={14} />, label: 'Customer Portal', desc: 'Cổng khách hàng cá nhân: theo dõi dự án, hóa đơn, ví LP, quà tặng, khóa học — sau khi đăng nhập.', color: DS.cyan },
                { icon: <FolderKanban size={14} />, label: 'Staff Portal', desc: 'Cổng nhân viên: task kanban cá nhân, quest, bảng LP, hồ sơ, lịch sử thăng hạng — dành cho staff & manager.', color: DS.amber },
              ].map(s => (
                <div key={s.label} className="p-4 rounded-xl"
                  style={{ background: DS.bgCard2, border: `1px solid ${s.color}20` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{ color: s.color }}>{s.icon}</span>
                    <span style={{ color: s.color, fontSize: 12, fontWeight: 700, fontFamily: DS.mono }}>{s.label}</span>
                  </div>
                  <div style={{ color: DS.text4, fontSize: 11, lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              ))}
            </div>

            <div style={{ color: DS.text4, fontSize: 12, lineHeight: 1.8 }}>
              <strong style={{ color: DS.text2 }}>Nguyên tắc cốt lõi:</strong> Bất kỳ tính năng nào dành cho user (khách hàng/nhân viên) đều phải có phần quản lý tương ứng ở admin. Mọi dữ liệu được đồng bộ qua Zustand global store — không sử dụng state cục bộ cho dữ liệu nghiệp vụ. Hệ thống phân tách rõ ràng hai loại tiền tệ: <Tag label="VNĐ · Tiền thật" color={DS.green} /> và <Tag label="LP · Điểm nội bộ" color={DS.purple} />.
            </div>

            <div style={{ color: DS.text4, fontSize: 12, lineHeight: 1.8, marginTop: 10 }}>
              <strong style={{ color: DS.text2 }}>Nguyên tắc triển khai FE-first:</strong> Giữ nguyên 100% UI/UX, animation và bố cục FE đã thiết kế; chỉ thay data source theo lộ trình phase: F0 (Auth + API client) → F1 (Public pages) → F2 (Booking/Orders) → F3 (Team/Effects) → F4 (Academy) → F5 (Customer portal) → F6 (Admin 23 tabs) → F7 (Realtime + polish).
            </div>

            <div style={{ color: DS.text4, fontSize: 12, lineHeight: 1.8, marginTop: 10 }}>
              <strong style={{ color: DS.text2 }}>Nguyên tắc vận hành để scale:</strong> Feature mới bắt buộc đi kèm retry policy, cache strategy cho endpoint read-heavy, async xử lý tác vụ nặng và metric theo dõi sau release (latency/error/queue backlog).
            </div>
          </Section>

          {/* ── 01 Kiến trúc ── */}
          <Section id="architecture" icon={<Code size={16} />} title="01 · Kiến trúc kỹ thuật" badge="React + Zustand + Tailwind v4 + Motion">
            <div style={{ color: DS.text3, fontSize: 12, lineHeight: 1.7, marginBottom: 12 }}>
              Toàn bộ hệ thống là một SPA (Single Page Application) React chạy client-side, sử dụng React Router v7 (Data Mode) để quản lý routing.
            </div>
            <CodeBlock code={`// Stack công nghệ
Frontend:     React 18 + TypeScript
Routing:      react-router v7 (Data Mode / createBrowserRouter)
State:        Zustand (global store — 2 stores: authStore + loopStore)
Styling:      Tailwind CSS v4 + inline style (rgba() thay cho opacity class)
Animation:    motion/react (Framer Motion)
              ✅ Dùng longhand properties khi animate màu: backgroundColor, borderColor
              ❌ Không dùng shorthand: background, border trong whileHover/animate/initial
Icons:        lucide-react
Charts:       100% pure-SVG (không dùng recharts/d3)
Images:       Unsplash + figma:asset scheme
Fonts:        Cinzel (heading) · JetBrains Mono · Inter · Noto Serif JP`} />

            <div style={{ color: DS.text3, fontSize: 12, marginBottom: 8 }}>Cấu trúc thư mục:</div>
            <CodeBlock code={`src/app/
├── App.tsx                    # Entry point, RouterProvider
├── routes.tsx                 # createBrowserRouter config + auth guards
├── Home.tsx                   # Trang đội ngũ (/doi-ngu)
├── MemberDetailPage.tsx       # Chi tiết thành viên (/member/:id)
│
├── pages/
│   ├── LandingPage.tsx        # Trang chủ (/)
│   ├── ServicesPage.tsx       # Dịch vụ (/dich-vu)
│   ├── PortfolioPage.tsx      # Portfolio (/du-an)
│   ├── BlogPage.tsx + Detail  # Blog (/blog, /blog/:id)
│   ├── AcademyPage.tsx + Detail # Học viện (/hoc-vien, /hoc-vien/:id)
│   ├── ContactPage.tsx        # Liên hệ (/lien-he)
│   ├── BookingWizardPage.tsx  # Đặt lịch (/dat-lich)
│   ├── MediaBookingPage.tsx   # Media (/media)
│   ├── LeaderboardPage.tsx    # BXH public (/bang-xep-hang)
│   ├── AuthPage.tsx           # Đăng nhập/Đăng ký
│   ├── OnboardingPage.tsx     # Onboarding
│   ├── AdminDashboard.tsx     # Admin (/admin)
│   ├── CustomerDashboard.tsx  # Khách hàng (/khach-hang)
│   ├── StaffPortal.tsx        # Nhân viên (/nhan-vien)
│   └── CompanyProcessPage.tsx # Quy trình (/quy-trinh)
│
├── store/
│   ├── authStore.ts           # Auth + Quest + Event
│   └── loopStore.ts           # Orders, Portfolio, Services, Notifications, Effects
│
├── components/
│   ├── layout/                # Navbar, Footer, PublicLayout, ds.ts, AdvancedSearch
│   ├── admin/                 # 20+ tab components cho AdminDashboard
│   ├── customer/              # EffectsInventoryTab, QuestsTab
│   ├── team/                  # memberData.ts (27 thành viên)
│   └── ui/                   # ChatWidget, DemoViewer, LoadingScreen, etc.`} />
          </Section>

          {/* ── 02 Roles ── */}
          <Section id="roles" icon={<Users size={16} />} title="02 · Vai trò & Phân quyền" badge="5 roles: admin · manager · staff · client · guest">
            <div style={{ color: DS.text3, fontSize: 12, lineHeight: 1.7, marginBottom: 12 }}>
              Hệ thống RBAC (Role-Based Access Control) được định nghĩa trong <code style={{ color: DS.cyan, fontFamily: DS.mono }}>authStore.ts</code>. Mỗi user có một role duy nhất.
            </div>
            <DocTable
              headers={['Role', 'Tên hiển thị', 'Portal', 'Quyền Admin', 'Ghi chú']}
              rows={[
                ['admin', 'Admin', 'Admin + Staff + Customer', <Tag label="ALL TABS" color={DS.purple} />, 'Toàn quyền, ví dụ: Akira Sato'],
                ['manager', 'Trưởng phòng', 'Admin (tab giới hạn) + Staff', <Tag label="DEPT TABS" color={DS.blue} />, 'Quyền theo bộ phận (department)'],
                ['staff', 'Nhân viên', 'Staff Portal', <Tag label="overview/projects/notif" color={DS.cyan} />, ''],
                ['client', 'Khách hàng', 'Customer Portal', <Tag label="NONE" color={DS.red} />, 'Chỉ xem portal cá nhân'],
                ['guest', 'Khách', 'Public pages', <Tag label="NONE" color={DS.text5} />, 'Chưa đăng nhập'],
              ]}
            />
            <div style={{ color: DS.text3, fontSize: 12, marginTop: 12, marginBottom: 8 }}>Phân quyền tab Admin theo phòng ban (Manager):</div>
            <DocTable
              headers={['Department', 'Tabs được truy cập']}
              rows={[
                ['engineering', 'overview, orders, projects, members, notification_center'],
                ['design', 'overview, orders, projects, portfolio, members, notification_center'],
                ['media', 'overview, media, orders, projects, members, notification_center'],
                ['marketing', 'overview, blog, academy, clients, services, notification_center'],
                ['sales', 'overview, orders, clients, quotation, services, revenue, notification_center'],
                ['finance', 'overview, revenue, lp, lp_manage, income_tax, web_packages, orders, notification_center'],
                ['hr', 'overview, members, departments, notification_center'],
                ['management', 'overview, orders, members, departments, projects, revenue, clients, notification_center, quests_events'],
              ]}
            />
            <div style={{ color: DS.text4, fontSize: 11, marginTop: 10, lineHeight: 1.7 }}>
              Hàm <code style={{ color: DS.cyan, fontFamily: DS.mono }}>getAccessibleTabs(role, department)</code> trả về danh sách tab hoặc <code style={{ color: DS.amber, fontFamily: DS.mono }}>'all'</code> nếu là admin. Hàm <code style={{ color: DS.cyan, fontFamily: DS.mono }}>canEdit(role)</code> trả về true nếu là admin hoặc manager.
            </div>
          </Section>

          {/* ── 03 Data Models ── */}
          <Section id="data_models" icon={<Database size={16} />} title="03 · Mô hình dữ liệu" badge="Interfaces & Types">
            <div style={{ color: DS.text3, fontSize: 12, lineHeight: 1.7, marginBottom: 12 }}>
              Tất cả types được định nghĩa trong 2 store files và <code style={{ color: DS.cyan, fontFamily: DS.mono }}>memberData.ts</code>. Theo lộ trình FE-first, dữ liệu nghiệp vụ đang chuyển dần từ INIT_* (mock fallback) sang API thật theo phase F0→F7.
            </div>
            <CodeBlock code={`// ── authStore.ts + auth.service.ts ─────────────────────────────────
interface AuthUser {
  id: string; name: string; shortName: string; email: string;
  avatar: string; role: UserRole; department?: string;
  rank?: string; rankColor?: string; lpBalance: number; level: number;
}
type UserRole = 'admin' | 'manager' | 'staff' | 'client' | 'guest'

// F0 auth flow:
// login(email,password) → POST /api/admin/auth/login
// initAuth()            → GET /api/admin/auth/me
// logout()              → POST /api/admin/auth/logout
// DEMO_USERS chỉ là fallback khi VITE_DEMO_MODE=true hoặc BE lỗi tạm thời

interface Quest {
  id: string; title: string; description: string;
  lpReward: number; xpReward: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'one_time' | 'event';
  category: 'engagement' | 'project' | 'social' | 'learning' | 'achievement';
  icon: string; color: string; target: number; progress: number;
  status: 'available' | 'in_progress' | 'completed' | 'expired';
  expiresAt?: string; forRoles: UserRole[];
}

interface CompanyEvent {
  id: string; title: string; description: string;
  type: 'seasonal' | 'milestone' | 'competition' | 'celebration' | 'training';
  startDate: string; endDate: string; lpBonus: number;
  quests: string[]; participants: number; maxParticipants: number;
  color: string; icon: string; active: boolean;
  rewards: { rank: number; label: string; lp: number }[];
}`} />
            <CodeBlock code={`// ── loopStore.ts ────────────────────────────────────────────
type OrderStatus = 
  'pending_payment' | 'paid' | 'in_progress' | 'demo_ready' 
  | 'client_review' | 'done' | 'cancelled'

interface Order {
  id: string; clientId: number; clientName: string; clientCompany: string;
  clientAvatar: string; serviceType?: ServiceType; serviceTitle?: string;
  projectId?: string; type: 'service' | 'course' | 'project_custom';
  title: string; budget: number;   // VNĐ — tiền thật
  lpUsed: number; lpReward: number; // LP — điểm nội bộ
  status: OrderStatus; progress: number;  // 0-100%
  createdAt: string; updatedAt: string; deadline?: string;
  assignedPM?: string; demoUrl?: string; maskedDemoUrl?: string;
  messages: OrderMessage[]; invoiceId: string; paidAt?: string;
  tags: string[];
}

interface OrderMessage {
  id: string; senderId: 'admin' | 'client'; senderName: string;
  content: string; type: 'text' | 'demo_link' | 'file' | 'system';
  demoUrl?: string; maskedUrl?: string; timestamp: string; read: boolean;
}

interface PortfolioProject { /* id, title, tag, cat, client, budget (VNĐ),
  team, status, metrics (x3), challenge/solution/result,
  tags, features, lp, demo, testimonial, featured, publishedAt */ }

interface AdminNotification {
  id: string; type: notifType; title: string; body: string;
  time: string; timestamp: number; read: boolean; color: string;
  relatedOrderId?: string; relatedClientId?: number;
  priority: 'low'|'normal'|'high'|'urgent'; department?: string;
  assignedTo?: string; category: 'order'|'finance'|'team'|'client'|'media'|'system';
  archived: boolean;
}

interface Service {
  id: ServiceType; title: string; subtitle: string; icon: string; color: string;
  startPrice: number; endPrice: number; // VNĐ
  active: boolean; demoUrl: string; maskedUrl: string;
  ordersCount: number; revenue: number; // VNĐ
}

interface RankEffect {
  id: string; name: string; description: string;
  type: 'particle'|'glow'|'border'|'aura'|'badge'|'trail';
  unlockRank: RankKey; unlockLevel: number; enabled: boolean;
  cssConfig: string; preview: string; rarity: 'common'|'rare'|'epic'|'legendary';
}`} />
            <CodeBlock code={`// ── memberData.ts (Team) ────────────────────────────────────
interface Member {
  id: number; name: string; title: string; role: string; roleCode: string;
  team: 'Alpha' | 'Sigma' | 'Omega'; rank: RankKey; level: number;
  currentXP: number; maxXP: number;
  lpBalance: number;  // LP hiện tại đang giữ
  lpEarned: number;   // Tổng LP đã kiếm được all-time
  lpSpent: number;    // Tổng LP đã dùng
  img: string; bio: string; specialty: string; missions: number;
  achievements: string[]; skills: Record<string, number>;
  techStack: string[]; missionLogs: MissionLog[];
  rankHistory: RankProgressEvent[];
}
// 27 thành viên, 3 nhóm: Alpha · Sigma · Omega
// Rank phân bổ: Iron(3) · Bronze(6) · Silver(6) · Gold(6) · Platinum(3) · Ruby(2) · Diamond(1)`} />
          </Section>

          {/* ── 04 Order Flow ── */}
          <Section id="order_flow" icon={<CreditCard size={16} />} title="04 · Luồng đơn hàng" badge="7 trạng thái: pending_payment → done">
            <div style={{ color: DS.text3, fontSize: 12, lineHeight: 1.7, marginBottom: 16 }}>
              Luồng đơn hàng bắt đầu từ khi khách hàng đặt dịch vụ đến khi hoàn thành và nhận LP thưởng.
            </div>
            <FlowStep step="01" label="PENDING_PAYMENT · Chờ thanh toán" color={DS.text4}
              desc="Khách xác nhận đặt dịch vụ qua BookingWizard. Hệ thống tạo Order + Invoice. Chờ khách thanh toán (chuyển khoản / VNPAY / Momo)." />
            <FlowStep step="02" label="PAID · Đã thanh toán — Chờ phân công" color={DS.blue}
              desc="Nhận thanh toán → tạo AdminNotification (type: payment, priority: high, dept: finance). Badge đỏ xuất hiện ở tab Đơn hàng trong sidebar admin." />
            <FlowStep step="03" label="IN_PROGRESS · Đang thực hiện" color={DS.purple}
              desc="Admin phân công PM → updateOrderStatus(orderId, 'in_progress', pmName). PM cập nhật progress (0→100%) qua updateOrderProgress(). Kanban tasks được tạo và assign cho team members." />
            <FlowStep step="04" label="DEMO_READY · Demo sẵn sàng" color={DS.cyan}
              desc="PM gửi link demo qua sendDemoLink(orderId, realUrl, maskedUrl). Demo URL được mask để bảo vệ (hiện maskedUrl, ẩn realUrl). ClientNotification (type: demo_ready) được tạo tự động." />
            <FlowStep step="05" label="CLIENT_REVIEW · Khách đang review" color={DS.amber}
              desc="Khách xem demo trong Customer Portal qua DemoViewer component. Khách gửi feedback qua sendClientMessage(). Tin nhắn hiển thị trong thread 2 chiều." />
            <FlowStep step="06" label="DONE · Hoàn thành" color={DS.green}
              desc="Admin xác nhận done → LP reward được ghi nhận cho cả khách (lpReward) và team. Invoice cuối được xuất. Review 5 sao được invite." last={true} />

            <div className="mt-4 p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <div style={{ color: DS.red, fontSize: 11, fontFamily: DS.mono, marginBottom: 6 }}>⚠ CANCELLED — Hủy đơn</div>
              <div style={{ color: DS.text4, fontSize: 11, lineHeight: 1.6 }}>
                Có thể hủy ở bất kỳ bước nào (trừ DONE). LP đã dùng được hoàn lại 80%. Budget VNĐ hoàn theo chính sách từng case.
              </div>
            </div>

            <div style={{ color: DS.text3, fontSize: 12, marginTop: 16 }}>
              <strong style={{ color: DS.text2 }}>Dual currency trong Order:</strong>
            </div>
            <DocTable
              headers={['Field', 'Loại tiền', 'Chiều', 'Mô tả']}
              rows={[
                ['budget', <Tag label="VNĐ" color={DS.green} />, 'Khách → LOOP', 'Giá trị hợp đồng bằng tiền thật'],
                ['lpUsed', <Tag label="LP" color={DS.purple} />, 'Khách → Order', 'Khách dùng LP để giảm giá (max 20% budget)'],
                ['lpReward', <Tag label="LP" color={DS.purple} />, 'LOOP → Khách', 'LP thưởng sau khi hoàn thành (thường = budget/20K LP)'],
              ]}
            />
          </Section>

          {/* ── 05 Project Flow ── */}
          <Section id="project_flow" icon={<FolderKanban size={16} />} title="05 · Luồng quản lý dự án" badge="Portfolio + Orders tích hợp">
            <div style={{ color: DS.text3, fontSize: 12, lineHeight: 1.7, marginBottom: 12 }}>
              Dự án tồn tại ở 2 dạng: <Tag label="Order đang chạy" color={DS.blue} /> và <Tag label="Portfolio project đã hoàn thành" color={DS.green} />. Sau khi Order chuyển sang DONE, admin có thể tạo PortfolioProject tương ứng.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div className="p-4 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.blue}20` }}>
                <div style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono, marginBottom: 8 }}>ACTIVE ORDER</div>
                <div style={{ color: DS.text4, fontSize: 11, lineHeight: 1.7 }}>
                  • PM được assign qua Admin → Kanban<br />
                  • Progress tracking 0→100%<br />
                  • Demo link với masking<br />
                  • Thread tin nhắn admin↔client<br />
                  • Deadline monitoring
                </div>
              </div>
              <div className="p-4 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.green}20` }}>
                <div style={{ color: DS.green, fontSize: 11, fontFamily: DS.mono, marginBottom: 8 }}>PORTFOLIO PROJECT</div>
                <div style={{ color: DS.text4, fontSize: 11, lineHeight: 1.7 }}>
                  • Hiển thị công khai tại /du-an<br />
                  • Có metrics (x3 KPI numbers)<br />
                  • Challenge/Solution/Result<br />
                  • LP gắn theo (project value / 20K)<br />
                  • Featured projects ưu tiên hiển thị
                </div>
              </div>
            </div>
            <div style={{ color: DS.text4, fontSize: 11, lineHeight: 1.7 }}>
              <strong style={{ color: DS.text3 }}>LP từ dự án:</strong> Portfolio project có field <code style={{ color: DS.cyan, fontFamily: DS.mono }}>lp</code> = budgetNum / 20,000 (làm tròn). Ví dụ: dự án 350M VNĐ → 17,500 LP. Đây là LP display (hiển thị thành tích), không phải LP được credit trực tiếp.
            </div>
          </Section>

          {/* ── 06 Kanban ── */}
          <Section id="kanban_flow" icon={<Settings size={16} />} title="06 · Kanban & Task Flow" badge="Admin KanbanHub + Staff mini-Kanban">
            <div style={{ color: DS.text3, fontSize: 12, lineHeight: 1.7, marginBottom: 12 }}>
              Hệ thống Kanban hoạt động ở 2 cấp độ:
            </div>
            <div className="space-y-3">
              <div className="p-4 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.purple}20` }}>
                <div style={{ color: DS.purple, fontSize: 11, fontFamily: DS.mono, marginBottom: 6 }}>ADMIN — KanbanHub (/admin → tab Kanban)</div>
                <div style={{ color: DS.text4, fontSize: 11, lineHeight: 1.7 }}>
                  Board toàn công ty. 3 cột: <strong style={{ color: DS.text3 }}>Todo / In Progress / Done</strong>. Admin có thể assign task cho bất kỳ thành viên nào. Drag & drop (motion animation). Hiển thị avatar PM và deadline. Filter theo dự án / thành viên.
                </div>
              </div>
              <div className="p-4 rounded-xl" style={{ background: DS.bgCard2, border: `1px solid ${DS.cyan}20` }}>
                <div style={{ color: DS.cyan, fontSize: 11, fontFamily: DS.mono, marginBottom: 6 }}>STAFF — Mini Kanban (Staff Portal → tab Dự án)</div>
                <div style={{ color: DS.text4, fontSize: 11, lineHeight: 1.7 }}>
                  Board cá nhân. Chỉ hiển thị task được assign cho user đang đăng nhập (lọc theo useAuthStore user). 3 cột: Todo → Doing → Done. Di chuyển task sang Done → trigger LP reward (+lp theo task). Priority badge: high/medium/low theo màu đỏ/vàng/xanh.
                </div>
              </div>
            </div>
            <CodeBlock code={`// Task structure (Staff Kanban)
{ id: string; title: string; col: 'todo'|'doing'|'done';
  priority: 'high'|'medium'|'low'; tag: string; lp: number }

// LP reward khi hoàn thành task:
// Task lp trung bình: 100~500 LP
// Tổng LP từ kanban tasks: ~2,000-5,000 LP/tháng/nhân viên`} />
          </Section>

          {/* ── 07 Media Flow ── */}
          <Section id="media_flow" icon={<Camera size={16} />} title="07 · Media Booking Flow" badge="Chụp ảnh · Quay phim · Content">
            <FlowStep step="01" label="Khách đặt lịch qua /media" color={DS.amber}
              desc="BookingWizard 4 bước: Chọn gói (Basic/Professional/Premium/TVC) → Ngày giờ → Brief yêu cầu → Xác nhận & Thanh toán. Gói từ 5-200M VNĐ." />
            <FlowStep step="02" label="Admin nhận notification media_booking" color={DS.amber}
              desc="AdminNotification type: media_booking tạo tự động. Assign cho Haru Tanaka (Media Manager). Badge media trên sidebar admin." />
            <FlowStep step="03" label="Sản xuất & Giao file" color={DS.amber}
              desc="Admin cập nhật progress. Giao file qua media_delivery notification. Khách nhận trong Customer Portal → tab Media Booking." />
            <FlowStep step="04" label="Escalation nếu cần chỉnh sửa" color={DS.red}
              desc="Khách yêu cầu chỉnh sửa → tạo AdminNotification type: escalation (priority: urgent). Cần xử lý trong 24h." last={true} />

            <div style={{ color: DS.text3, fontSize: 12, marginTop: 12 }}>Gói Media hiện có:</div>
            <DocTable
              headers={['Gói', 'Nội dung', 'Giá (VNĐ)', 'LP thưởng']}
              rows={[
                ['Basic', 'Chụp ảnh sản phẩm (30 ảnh)', '5,000,000', '250 LP'],
                ['Professional', 'Chụp ảnh thương mại (60 ảnh + edit)', '19,000,000', '950 LP'],
                ['Premium', 'Quay phim + edit (video 2-5 phút)', '45,000,000', '2,250 LP'],
                ['TVC', 'Phim quảng cáo chuyên nghiệp 30s-60s', '80,000,000+', '4,000+ LP'],
              ]}
            />
          </Section>

          {/* ── 08 LP System ── */}
          <Section id="lp_system" icon={<Zap size={16} />} title="08 · Hệ thống LP (Loop Points)" badge="Dual currency — LP ≠ VNĐ">
            <div style={{ color: DS.text3, fontSize: 12, lineHeight: 1.7, marginBottom: 12 }}>
              LP (Loop Points) là hệ thống điểm thưởng gamified nội bộ, <strong style={{ color: DS.text }}>hoàn toàn tách biệt với VNĐ</strong>. LP không phải tiền thật và không quy đổi thành tiền mặt — chỉ dùng để giảm giá dịch vụ hoặc đổi quà nội bộ.
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Điểm danh/ngày', lp: '50 LP', color: DS.amber },
                { label: 'Hoàn thành task', lp: '100-5,000 LP', color: DS.blue },
                { label: 'Referral thành công', lp: '2,000 LP', color: DS.purple },
                { label: 'Quest hoàn thành', lp: '20-3,000 LP', color: DS.green },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-xl text-center" style={{ background: DS.bgCard2, border: `1px solid ${s.color}20` }}>
                  <div style={{ color: s.color, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>{s.lp}</div>
                  <div style={{ color: DS.text5, fontSize: 10, marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <CodeBlock code={`// Tỷ giá quy đổi LP (chỉ để giảm giá, không quy ra tiền mặt)
1,000 LP = 500,000 VNĐ giảm giá (max 20% giá trị hóa đơn)

// Ví dụ:
Hóa đơn: 100,000,000 VNĐ
Dùng 4,000 LP = giảm 2,000,000 VNĐ (= 2% giảm giá)
Max LP có thể dùng: 40,000 LP (= 20% giảm giá)

// Luồng LP cho Staff (Nhân viên):
Kiếm LP    → Hoàn thành task/quest/streak/referral
Giữ LP     → lpBalance (số dư hiện tại)
Đổi LP     → Voucher ăn uống / thưởng tháng / giảm giá nội bộ
             KHÔNG quy ra tiền mặt

// Luồng LP cho Client (Khách hàng):
Kiếm LP    → Đặt dịch vụ, đánh giá, referral, hoàn thành quest
Dùng LP    → Giảm giá hóa đơn (max 20%)
             KHÔNG quy ra tiền mặt`} />

            <div style={{ color: DS.text3, fontSize: 12, marginTop: 12, marginBottom: 8 }}>Nguồn LP cho các vai trò:</div>
            <DocTable
              headers={['Nguồn', 'Staff LP', 'Client LP', 'Trigger']}
              rows={[
                ['Đặt dịch vụ', '—', 'budget/20,000', 'Order status → done'],
                ['Hoàn thành task', '100-5,000', '—', 'Kanban task → Done'],
                ['Điểm danh streak', '50/ngày', '50/ngày', 'checkIn() trong authStore'],
                ['Quest daily/weekly', '20-500', '20-500', 'completeQuest(questId)'],
                ['Quest monthly', '1,000-2,000', '1,000-2,000', 'completeQuest(questId)'],
                ['Referral thành công', '2,000', '2,000', 'Manual admin'],
                ['Event bonus', 'x2-x3 multiplier', 'x2-x3 multiplier', 'CompanyEvent.lpBonus'],
                ['Admin manual', 'AdminLeaderboardTab', '—', 'updateLPManually()'],
              ]}
            />
          </Section>

          {/* ── 09 Rank System ── */}
          <Section id="rank_system" icon={<Award size={16} />} title="09 · Hệ thống Rank" badge="7 bậc: Iron → Diamond · Level 1→135+">
            <div style={{ color: DS.text3, fontSize: 12, lineHeight: 1.7, marginBottom: 12 }}>
              Hệ thống rank theo kiểu game RPG Asian. Mỗi rank có level range và yêu cầu LP/level khác nhau. Rank quyết định hiệu ứng visual, màu sắc và đặc quyền.
            </div>
            <DocTable
              headers={['Rank', 'Tier', 'Symbol', 'Level', 'LP/Level', 'Màu', 'Rarity hiệu ứng']}
              rows={[
                [<Tag label="IRON" color="#9CA3AF" />, '1', '⬡', '1-14', '100 LP', '#9CA3AF', 'Common'],
                [<Tag label="BRONZE" color="#CD7F32" />, '2', '◈', '15-34', '350 LP', '#CD7F32', 'Common'],
                [<Tag label="SILVER" color="#CBD5E1" />, '3', '◇', '35-54', '800 LP', '#CBD5E1', 'Rare'],
                [<Tag label="GOLD" color="#FFD700" />, '4', '★', '55-74', '2,000 LP', '#FFD700', 'Rare'],
                [<Tag label="PLATINUM" color="#14B8A6" />, '5', '❋', '75-94', '5,000 LP', '#14B8A6', 'Epic'],
                [<Tag label="RUBY" color="#EF4444" />, '6', '♦', '95-114', '12,000 LP', '#EF4444', 'Epic'],
                [<Tag label="DIAMOND" color="#818CF8" />, '7', '✦', '115+', '30,000 LP', '#818CF8', 'Legendary'],
              ]}
            />
            <div style={{ color: DS.text4, fontSize: 11, lineHeight: 1.7, marginTop: 10 }}>
              <strong style={{ color: DS.text3 }}>Unlock hiệu ứng theo rank:</strong> Mỗi rank unlock một số RankEffect (particle, glow, border, aura, badge, trail). Admin có thể bật/tắt từng hiệu ứng toàn cục hoặc override cho từng thành viên. User tự chọn equip tối đa 2-3 hiệu ứng từ kho đã unlock.
            </div>
            <div style={{ color: DS.text4, fontSize: 11, lineHeight: 1.7, marginTop: 8 }}>
              <strong style={{ color: DS.text3 }}>RankHistory:</strong> Mỗi thành viên có mảng <code style={{ color: DS.cyan, fontFamily: DS.mono }}>rankHistory: RankProgressEvent[]</code> ghi lại từng mốc thăng hạng với rank, level, date, note. Hiển thị dạng timeline trong Staff Portal → tab Hồ sơ.
            </div>
          </Section>

          {/* ── 10 Quest Flow ── */}
          <Section id="quest_flow" icon={<Star size={16} />} title="10 · Quest & Event Flow" badge="Daily · Weekly · Monthly · One-time · Event">
            <div style={{ color: DS.text3, fontSize: 12, lineHeight: 1.7, marginBottom: 12 }}>
              Quest là nhiệm vụ gamified giúp user kiếm LP và XP. Event là sự kiện theo mùa/milestone gắn với quest đặc biệt và LP bonus multiplier.
            </div>
            <div style={{ color: DS.text3, fontSize: 12, marginBottom: 8 }}>Các loại Quest theo frequency:</div>
            <DocTable
              headers={['Frequency', 'LP Range', 'Reset', 'Ví dụ']}
              rows={[
                ['daily', '20-50 LP', 'Mỗi ngày 00:00', 'Điểm danh, gửi tin nhắn, đọc blog'],
                ['weekly', '200-500 LP', 'Thứ 2 hàng tuần', 'Hoàn thành 3 task, viết blog post'],
                ['monthly', '1,000-2,000 LP', 'Ngày 1 hàng tháng', 'Đánh giá 360°, referral khách hàng'],
                ['one_time', '500-3,000 LP', 'Không reset', 'First Blood, Streak 30 ngày'],
                ['event', 'Bonus', 'Theo event', 'LOOP Spring Festival, Hackathon'],
              ]}
            />
            <div style={{ color: DS.text3, fontSize: 12, margin: '12px 0 8px' }}>Event flow:</div>
            <FlowStep step="01" label="Admin tạo CompanyEvent trong QuestEventsTab" color={DS.purple}
              desc="Điền title, type (seasonal/milestone/competition/celebration/training), thời gian, lpBonus multiplier, gắn quest IDs, giải thưởng top 1/2/3." />
            <FlowStep step="02" label="Event active=true → Hiển thị cho user" color={DS.purple}
              desc="Staff Portal tab Nhiệm vụ → tab Sự kiện. Customer Portal tab Nhiệm vụ. Banner 'ĐANG DIỄN RA' với đếm ngược." />
            <FlowStep step="03" label="User tham gia event (joinEvent)" color={DS.purple}
              desc="participants++ (max maxParticipants). LP bonus áp dụng cho mọi quest hoàn thành trong event: lpReward × lpBonus." last={true} />

            <CodeBlock code={`// Cơ chế quest progress trong authStore:
updateQuestProgress(questId, progress)
  → status = progress >= target ? 'completed' : 'in_progress'

completeQuest(questId) 
  → progress = target, status = 'completed'
  → LP được ghi nhận (display-only trong demo)

checkIn() // Daily streak:
  → streak++ nếu check-in ngày liên tiếp
  → Streak reset về 1 nếu bỏ ngày
  → Quest 'q-daily-1' tự động completed`} />
          </Section>

          {/* ── 11 Notification Flow ── */}
          <Section id="notification_flow" icon={<Bell size={16} />} title="11 · Notification Flow" badge="Real-time simulation · Admin + Client channels">
            <div style={{ color: DS.text3, fontSize: 12, lineHeight: 1.7, marginBottom: 12 }}>
              Hệ thống notification 2 kênh độc lập: AdminNotification và ClientNotification, đều được lưu trong loopStore. Hiện tại đang có realtime simulation bằng setInterval; phase F7 sẽ nâng cấp sang SSE/WebSocket.
            </div>
            <CodeBlock code={`// Tạo notification tự động:
updateOrderStatus()    → AdminNotification (type: system)
sendDemoLink()         → ClientNotification (type: demo_ready)
                         + AdminNotification embed

// Real-time simulation (useRealtimeNotifications hook):
setInterval(28_000)    → addAdminNotification(template)
Pool 9 templates xoay vòng: payment/new_order/client_message/
  lp/media_booking/system/task/escalation/review

// Priority levels:
'urgent'  → màu đỏ, badge nhấp nháy, cần xử lý ngay
'high'    → màu xanh/tím, banner thông báo
'normal'  → hiển thị bình thường  
'low'     → chỉ hiện trong list`} />
            <div style={{ color: DS.text3, fontSize: 12, marginTop: 12, marginBottom: 8 }}>Notification categories:</div>
            <DocTable
              headers={['Category', 'Gồm các types', 'Hiện trong dept']}
              rows={[
                ['order', 'new_order, demo_approved', 'sales, design, engineering'],
                ['finance', 'payment, invoice', 'finance, management'],
                ['team', 'lp, task, review', 'management, hr'],
                ['client', 'client_message, escalation', 'design, engineering, media'],
                ['media', 'media_booking, media_delivery', 'media'],
                ['system', 'system', 'management, all'],
              ]}
            />
            <div style={{ color: DS.text4, fontSize: 11, lineHeight: 1.7, marginTop: 10 }}>
              <strong style={{ color: DS.text3 }}>Bulk actions:</strong> bulkDeleteAdminNotifs, bulkReadAdminNotifs, bulkArchiveAdminNotifs — hỗ trợ chọn nhiều và thao tác hàng loạt trong NotificationCenter tab.
            </div>
          </Section>

          {/* ── 12 Permissions Matrix ── */}
          <Section id="permissions" icon={<Lock size={16} />} title="12 · Ma trận quyền hạn đầy đủ" badge="Theo tab trong AdminDashboard">
            <div style={{ color: DS.text3, fontSize: 12, lineHeight: 1.7, marginBottom: 12 }}>
              Tất cả 24 admin tabs được kiểm soát bởi hàm <code style={{ color: DS.cyan, fontFamily: DS.mono }}>canAccessTab(role, department, tab)</code>. Sidebar tự ẩn tab không có quyền.
            </div>
            <DocTable
              headers={['Tab ID', 'Tên tab', 'Admin', 'Manager (theo dept)', 'Staff']}
              rows={[
                ['overview', 'Tổng quan', '✅', '✅ tất cả', '✅'],
                ['orders', 'Đơn hàng', '✅', 'eng/design/media/sales/finance', '❌'],
                ['members', 'Thành viên', '✅', 'eng/design/media/hr/mgmt', '❌'],
                ['departments', 'Phòng ban', '✅', 'hr/mgmt', '❌'],
                ['projects', 'Kanban', '✅', 'eng/design/media', '✅'],
                ['leaderboard_admin', 'Leaderboard LP', '✅', '❌', '❌'],
                ['services', 'Dịch vụ', '✅', 'marketing', '❌'],
                ['media', 'Media Booking', '✅', 'media', '❌'],
                ['portfolio', 'Portfolio', '✅', 'design', '❌'],
                ['academy', 'Học viện', '✅', 'marketing', '❌'],
                ['blog', 'Blog', '✅', 'marketing', '❌'],
                ['revenue', 'Doanh thu', '✅', 'sales/finance/mgmt', '❌'],
                ['clients', 'Khách hàng', '✅', 'sales/marketing/mgmt', '❌'],
                ['lp', 'Tài chính LP', '✅', 'finance', '❌'],
                ['lp_manage', 'Quản lý LP', '✅', 'finance', '❌'],
                ['income_tax', 'Thu nhập & Thuế', '✅', 'finance', '❌'],
                ['effects', 'Hiệu ứng rank', '✅', '❌', '❌'],
                ['quests_events', 'Quest & Event', '✅', 'mgmt', '❌'],
                ['notification_center', 'Trung tâm TB', '✅', '✅ tất cả', '✅'],
                ['settings', 'Cài đặt', '✅', '❌', '❌'],
              ]}
            />
          </Section>

          {/* ── 13 Algorithms ── */}
          <Section id="algorithms" icon={<TrendingUp size={16} />} title="13 · Thuật toán & Logic tính toán" badge="LP · Rank · Leaderboard · Charts">
            <div style={{ color: DS.text3, fontSize: 12, lineHeight: 1.7, marginBottom: 12 }}>
              Tổng hợp các công thức và thuật toán được sử dụng xuyên suốt hệ thống.
            </div>
            <CodeBlock code={`// ── LP Conversion Rate ───────────────────────────────────────
LP_RATE = 500 // VNĐ per 1,000 LP discount
discount_vnd = Math.round((lpInput / 1000) * LP_RATE * 1000)
max_lp_discount = budget * 0.20 / (LP_RATE / 1000)

// ── Rank Determination ───────────────────────────────────────
RANKS: { iron: 1-14, bronze: 15-34, silver: 35-54, 
         gold: 55-74, platinum: 75-94, ruby: 95-114, diamond: 115+ }
rank = RANKS.find(r => level >= r.minLevel && level <= r.maxLevel)

// ── LP per Level ─────────────────────────────────────────────
LP needed to reach next level = RANKS[currentRank].lpPerLevel
iron: 100, bronze: 350, silver: 800, gold: 2000,
platinum: 5000, ruby: 12000, diamond: 30000

// ── Leaderboard Sort ─────────────────────────────────────────
sort: by lpBalance DESC (primary), by level DESC (secondary)
Top 1-3: Medal badges (🥇🥈🥉)

// ── Portfolio LP Display ─────────────────────────────────────
project.lp = Math.round(project.budgetNum / 20000)
Ví dụ: 350M VNĐ → 17,500 LP (display only)

// ── Daily Streak ─────────────────────────────────────────────
lastCheckIn === yesterday → streak++
else → streak = 1
Bonus LP = 50 * Math.min(streak, 7) (capped tại streak 7 ngày)

// ── Admin LP Adjustment (AdminLeaderboardTab) ─────────────────
effectiveLP = member.lpBalance + member.delta (pending)
Commit → lpBalance += delta, delta = 0
Bonus type → +delta; Penalty type → -abs(delta)
Event type → +delta (thường là event reward)
Manual type → ±delta (correction)

// ── Notification Priority Sort ────────────────────────────────
sort: by timestamp DESC (mới nhất trước)
urgent → đặt banner riêng với màu đỏ
Badge count = adminNotifications.filter(n => !n.read && !n.archived).length

// ── Donut Chart (Leaderboard public) ─────────────────────────
// Pure SVG: strokeDasharray + strokeDashoffset
circumference = 2 * π * r
dashOffset = circumference * (1 - percentage/100)
Each rank segment = (count/total) * circumference`} />
          </Section>

          {/* ── 14 UI Rules ── */}
          <Section id="ui_rules" icon={<Package size={16} />} title="14 · Quy tắc UI/UX & Motion" badge="Asian Tech-Zen · Cyberpunk · Vietnamese">
            <div style={{ color: DS.text3, fontSize: 12, lineHeight: 1.7, marginBottom: 12 }}>
              Bộ quy tắc thiết kế bắt buộc áp dụng nhất quán trong toàn bộ hệ thống.
            </div>
            <div className="space-y-3">
              {[
                {
                  title: '⚠ Motion Props — QUAN TRỌNG',
                  content: 'Dùng longhand properties khi animate màu với Motion: backgroundColor, borderColor. Không dùng shorthand background/border trong whileHover/animate/initial. Các transform (scale, opacity, x, y) vẫn ưu tiên cho hover micro-interactions.',
                  color: DS.red,
                },
                {
                  title: 'Màu sắc — Dùng rgba() thay cho class opacity',
                  content: 'Tailwind v4: dùng rgba(hex, alpha) inline style thay vì bg-blue-500/20. Ví dụ: background: rgba(59,130,246,0.12). Hàm helper rgba(hex, alpha) được định nghĩa local trong mỗi file.',
                  color: DS.blue,
                },
                {
                  title: 'Dual Currency — Không nhầm lẫn',
                  content: 'VNĐ (tiền thật): budget, revenue, startPrice, endPrice, totalSpent. LP (điểm): lpBalance, lpEarned, lpSpent, lpReward, lpUsed. Luôn format: fmtVND() cho VNĐ, fmtLP() = toLocaleString(vi-VN) cho LP.',
                  color: DS.green,
                },
                {
                  title: 'Charts — Pure SVG bắt buộc',
                  content: 'Không dùng recharts, d3, chart.js. Tất cả biểu đồ là SVG thuần: bar chart = rect elements, donut = circle + strokeDasharray, line chart = polyline/path, radar = polygon. Dùng motion.polygon/motion.div cho animation.',
                  color: DS.purple,
                },
                {
                  title: 'Design Tokens — ds.ts là nguồn sự thật',
                  content: 'Không hardcode màu. Luôn dùng DS.blue, DS.purple, DS.cyan, DS.green, DS.amber, DS.red, DS.text, DS.text3-5, DS.bgCard/2/3, DS.border, DS.mono, DS.heading, DS.body. GRD.primary = gradient xanh-tím.',
                  color: DS.cyan,
                },
                {
                  title: 'Fonts — Cinzel + JetBrains Mono',
                  content: 'fontFamily: DS.heading (Cinzel) cho title lớn. DS.mono (JetBrains Mono) cho số, code, badge, label kỹ thuật. DS.body (Inter) cho body text. Font import chỉ trong /src/styles/fonts.css.',
                  color: DS.amber,
                },
                {
                  title: 'Responsive — Mobile-first',
                  content: 'Dùng useIsMobile() hook để detect mobile. Sidebar: fixed desktop, overlay drawer mobile. Grid: grid-cols-1 xl:grid-cols-N. Padding: isMobile ? 12px : 24px. Bottom nav trên mobile.',
                  color: DS.text3,
                },
                {
                  title: 'Protected files — KHÔNG chỉnh sửa',
                  content: '/src/app/components/ui/DemoViewer.tsx là file đã được chỉnh thủ công và cần giữ nguyên. Các file khác chỉ chỉnh khi có yêu cầu nghiệp vụ rõ ràng và follow code review checklist.',
                  color: DS.red,
                },
              ].map(rule => (
                <div key={rule.title} className="p-4 rounded-xl"
                  style={{ background: DS.bgCard2, border: `1px solid ${rule.color}20` }}>
                  <div style={{ color: rule.color, fontSize: 11, fontFamily: DS.mono, fontWeight: 700, marginBottom: 6 }}>{rule.title}</div>
                  <div style={{ color: DS.text4, fontSize: 11, lineHeight: 1.7 }}>{rule.content}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Footer stamp ── */}
          <div className="py-8 text-center" style={{ borderTop: `1px solid ${DS.border}` }}>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <Lock size={12} style={{ color: DS.red }} />
              <span style={{ color: DS.red, fontSize: 10, fontFamily: DS.mono, letterSpacing: '0.2em' }}>
                TÀI LIỆU NỘI BỘ CONFIDENTIAL · LOOP SOLUTIONS © 2026 · SEASON III
              </span>
            </div>
            <div style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono, marginTop: 12 }}>
              Cập nhật lần cuối: 26/03/2026 · Phiên bản: v3.0.0
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
