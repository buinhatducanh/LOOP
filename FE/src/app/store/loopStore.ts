/**
 * LOOP Solutions — Shared Global Store
 * Zustand store đồng bộ toàn bộ dữ liệu giữa Admin, Customer và Public pages
 */
import { create } from 'zustand';
import { DS } from '../components/layout/ds';

// ── Types ───────────────────────────────────────────────────────────────────

export type RankKey = 'iron' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'ruby' | 'diamond';

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'in_progress'
  | 'demo_ready'
  | 'client_review'
  | 'done'
  | 'cancelled';

export type ServiceType = 'thiet-ke-web' | 'phat-trien-app' | 'dashboard-analytics' | 'seo-marketing';

// ── Effect Types ──────────────────────────────────────────────────────────────

export interface RankEffect {
  id: string;
  name: string;
  description: string;
  type: 'particle' | 'glow' | 'border' | 'aura' | 'badge' | 'trail';
  unlockRank: RankKey;
  unlockLevel: number;
  enabled: boolean;
  cssConfig: string;
  preview: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  color?: string;
}

export interface MemberEffectOverride {
  memberId: number;
  effectId: string;
  visible: boolean;
  selectedByMember: boolean;
}

// ── Order Types ───────────────────────────────────────────────────────────────

export interface Order {
  id: string;
  clientId: number;
  clientName: string;
  clientCompany: string;
  clientAvatar: string;
  serviceType?: ServiceType;
  serviceTitle?: string;
  projectId?: string;
  type: 'service' | 'course' | 'project_custom';
  title: string;
  budget: number;
  lpUsed: number;
  lpReward: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  deadline?: string;
  assignedPM?: string;
  demoUrl?: string;
  maskedDemoUrl?: string;
  demoNote?: string;
  messages: OrderMessage[];
  invoiceId: string;
  paidAt?: string;
  progress: number;
  tags: string[];
}

export interface OrderMessage {
  id: string;
  senderId: 'admin' | 'client';
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: 'text' | 'demo_link' | 'file' | 'system';
  demoUrl?: string;
  maskedUrl?: string;
  timestamp: string;
  read: boolean;
}

export interface PortfolioProject {
  id: string;
  title: string;
  tag: string;
  cat: string;
  client: string;
  color: string;
  img: string;
  year: string;
  duration: string;
  budget: string;
  budgetNum: number;
  team: string;
  status: 'completed' | 'in_progress' | 'paused';
  metric1: string; m1label: string;
  metric2: string; m2label: string;
  metric3: string; m3label: string;
  challenge: string; solution: string; result: string;
  tags: string[];
  features: string[];
  lp: number;
  hasDemo: boolean;
  demoUrl: string;
  maskedUrl: string;
  demoTitle: string;
  testimonial?: { name: string; role: string; quote: string };
  featured: boolean;
  publishedAt: string;
  // i18n fields
  titleEn?: string;   titleJa?: string;   titleKo?: string;   titleZh?: string;
  challengeEn?: string; challengeJa?: string; challengeKo?: string; challengeZh?: string;
  solutionEn?: string;  solutionJa?: string;  solutionKo?: string;  solutionZh?: string;
  resultEn?: string;    resultJa?: string;    resultKo?: string;    resultZh?: string;
  tagsEn?: string[];    tagsJa?: string[];   tagsKo?: string[];    tagsZh?: string[];
  featuresEn?: string[]; featuresJa?: string[]; featuresKo?: string[]; featuresZh?: string[];
}

export interface AdminNotification {
  id: string;
  type: 'new_order' | 'payment' | 'client_message' | 'demo_approved' | 'system' | 'task' | 'lp' | 'review' | 'media_booking' | 'media_delivery' | 'escalation';
  title: string;
  body: string;
  time: string;
  timestamp: number; // unix ms for sorting
  read: boolean;
  color: string;
  relatedOrderId?: string;
  relatedClientId?: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  department?: string;  // 'engineering' | 'design' | 'media' | 'marketing' | 'finance' | 'hr' | 'management'
  assignedTo?: string;  // team member name
  category: 'order' | 'finance' | 'team' | 'client' | 'media' | 'system';
  archived: boolean;
}

export interface ClientNotification {
  id: string;
  type: 'order_update' | 'demo_ready' | 'invoice' | 'lp_earned' | 'message' | 'system';
  title: string;
  body: string;
  time: string;
  read: boolean;
  color: string;
  relatedOrderId?: string;
  demoUrl?: string;
  maskedUrl?: string;
}

export interface Service {
  id: ServiceType;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  startPrice: number;
  endPrice: number;
  perMonth?: boolean;
  active: boolean;
  demoUrl: string;
  maskedUrl: string;
  ordersCount: number;
  revenue: number;
  /** Extra fields for ServiceDetailPage */
  desc?: string;
  features?: string[];
  process?: Array<{ title: string; desc: string }>;
  tech?: string[];
  cases?: Array<{ name: string; metric: string; img: string }>;
  faqs?: Array<{ q: string; a: string }>;
  /** i18n — BE stores these as Prisma fields; FE uses them for translation display */
  titleEn?: string;   titleJa?: string;   titleKo?: string;   titleZh?: string;
  shortDescriptionEn?: string; shortDescriptionJa?: string; shortDescriptionKo?: string; shortDescriptionZh?: string;
  longDescriptionEn?: string;  longDescriptionJa?: string;  longDescriptionKo?: string;  longDescriptionZh?: string;
  featuresEn?: string[]; featuresJa?: string[]; featuresKo?: string[]; featuresZh?: string[];
  technologiesEn?: string[]; technologiesJa?: string[]; technologiesKo?: string[]; technologiesZh?: string[];
}

// ── Initial Effects Data ──────────────────────────────────────────────────────

export const INIT_EFFECTS: RankEffect[] = [
  { id: 'eff-1',  name: 'Particle Glow cơ bản',   description: 'Hiệu ứng particle nhẹ xung quanh card',      type: 'particle', unlockRank: 'iron',     unlockLevel: 1,   enabled: true,  cssConfig: 'count: 5; opacity: 0.3; speed: 3s',                preview: '✨', rarity: 'common' },
  { id: 'eff-2',  name: 'Border Gradient',          description: 'Viền gradient xoay theo rank color',          type: 'border',   unlockRank: 'bronze',   unlockLevel: 15,  enabled: true,  cssConfig: 'rotation: 360deg; speed: 3s; width: 2px',           preview: '◈', rarity: 'common' },
  { id: 'eff-3',  name: 'Silver Shimmer',           description: 'Hiệu ứng lấp lánh bạc trên card',            type: 'glow',     unlockRank: 'silver',   unlockLevel: 35,  enabled: true,  cssConfig: 'shimmer: true; speed: 2s; color: #CBD5E1',           preview: '◇', rarity: 'rare' },
  { id: 'eff-4',  name: 'Gold Aura',                description: 'Hào quang vàng bao quanh avatar',             type: 'aura',     unlockRank: 'gold',     unlockLevel: 55,  enabled: true,  cssConfig: 'radius: 40px; pulse: true; color: #FFD700',          preview: '★', rarity: 'rare' },
  { id: 'eff-5',  name: 'Platinum Trail',           description: 'Vệt sáng theo chuyển động',                   type: 'trail',    unlockRank: 'platinum', unlockLevel: 75,  enabled: true,  cssConfig: 'length: 8; fade: 0.5s; color: #14B8A6',             preview: '❋', rarity: 'epic' },
  { id: 'eff-6',  name: 'Ruby Fire Particles',      description: 'Particles lửa đỏ xung quanh card',            type: 'particle', unlockRank: 'ruby',     unlockLevel: 85,  enabled: true,  cssConfig: 'count: 15; color: #EF4444; gravity: -0.5',           preview: '♦', rarity: 'epic' },
  { id: 'eff-7',  name: 'Diamond Holographic',      description: 'Hiệu ứng holographic toàn card',              type: 'aura',     unlockRank: 'diamond',  unlockLevel: 95,  enabled: true,  cssConfig: 'holographic: true; rainbow: true; speed: 4s',        preview: '✦', rarity: 'legendary' },
  { id: 'eff-8',  name: 'Cosmic Badge',             description: 'Badge đặc biệt hiển thị trên avatar',         type: 'badge',    unlockRank: 'diamond',  unlockLevel: 100, enabled: true,  cssConfig: 'badge: cosmic; animated: true; glow: rainbow',       preview: '🌟', rarity: 'legendary' },
  { id: 'eff-9',  name: 'Neon Pulse Border',        description: 'Viền neon nhấp nháy theo nhịp',               type: 'border',   unlockRank: 'gold',     unlockLevel: 60,  enabled: true,  cssConfig: 'neon: true; pulse: 1.5s; color: #3B82F6',            preview: '💫', rarity: 'rare' },
  { id: 'eff-10', name: 'Matrix Rain',              description: 'Hiệu ứng mưa matrix trên card',               type: 'particle', unlockRank: 'platinum', unlockLevel: 80,  enabled: false, cssConfig: 'style: matrix; speed: fast; color: #22C55E',         preview: '🌧', rarity: 'epic' },
  { id: 'eff-11', name: 'Bronze Ember',             description: 'Tia lửa màu đồng bay lên',                    type: 'particle', unlockRank: 'bronze',   unlockLevel: 20,  enabled: true,  cssConfig: 'count: 8; color: #CD7F32; rise: true; speed: 2.5s',  preview: '🔥', rarity: 'common' },
  { id: 'eff-12', name: 'Iron Shield Pulse',        description: 'Vòng khiên kim loại rung nhẹ',                type: 'border',   unlockRank: 'iron',     unlockLevel: 5,   enabled: true,  cssConfig: 'style: shield; vibrate: 0.2s; color: #9CA3AF',       preview: '🛡', rarity: 'common' },
];

// NOTE: memberId references are by memberData.ts id (number).
// After R1.1 insert: Haru Tanaka=#14, Ngô Thanh Vân removed, IDs shifted.
// Current key members: Akira=#7, Ryo=#3, Vũ Đình Trọng=#13.
const INIT_OVERRIDES: MemberEffectOverride[] = [
  { memberId: 7,  effectId: 'eff-7', visible: true,  selectedByMember: true },   // Akira Sato (Diamond) — Diamond Holographic
  { memberId: 7,  effectId: 'eff-8', visible: true,  selectedByMember: true },   // Akira — Cosmic Badge
  { memberId: 7,  effectId: 'eff-6', visible: false, selectedByMember: false },  // Akira — (Ruby Fire hidden)
  { memberId: 3,  effectId: 'eff-5', visible: true,  selectedByMember: true },  // Ryo Hashimoto — Platinum Trail
  { memberId: 13, effectId: 'eff-7', visible: true,  selectedByMember: true },  // Vũ Đình Trọng (QA, Silver) — demo override
];

// ── Initial Data ─────────────────────────────────────────────────────────────

const INIT_PORTFOLIO: PortfolioProject[] = [
  {
    id: '1', title: 'VNRetail Platform', tag: 'E-commerce SaaS', cat: 'SaaS',
    client: 'VNRetail JSC', color: DS.blue,
    img: 'https://images.unsplash.com/photo-1517309561013-16f6e4020305?auto=format&fit=crop&w=900&q=80',
    year: '2025', duration: '5 tháng', budget: '350,000,000 VNĐ', budgetNum: 350_000_000, team: '6 người',
    status: 'completed',
    metric1: '+320%', m1label: 'Tăng trưởng doanh thu',
    metric2: '50K', m2label: 'Active users',
    metric3: '99.8%', m3label: 'Uptime SLA',
    challenge: 'VNRetail cần chuyển đổi hệ thống bán hàng legacy sang nền tảng SaaS hiện đại.',
    solution: 'Xây dựng nền tảng SaaS multi-tenant với kiến trúc microservices trên AWS.',
    result: 'Ra mắt sau 5 tháng. Doanh thu tăng 320% trong 6 tháng đầu.',
    tags: ['React', 'Next.js', 'Node.js', 'AWS', 'PostgreSQL'],
    features: ['Multi-tenant SaaS', 'Real-time inventory', 'VNPAY/Momo', 'Analytics'],
    lp: 17500, hasDemo: true,
    demoUrl: 'https://demo.vercel.store',
    maskedUrl: 'demo.loop-solutions.vn/vnretail',
    demoTitle: 'VNRetail Platform — Live Demo',
    testimonial: { name: 'Nguyễn Minh Tuấn', role: 'CEO, VNRetail JSC', quote: 'LOOP Solutions đã thay đổi hoàn toàn cách chúng tôi vận hành.' },
    featured: true, publishedAt: '2025-08-15',
  },
  {
    id: '2', title: 'MedApp Vietnam', tag: 'Mobile Health App', cat: 'App',
    client: 'HealthTech Vietnam', color: DS.purple,
    img: 'https://images.unsplash.com/photo-1596843720750-7de9329da5d7?auto=format&fit=crop&w=900&q=80',
    year: '2025', duration: '4 tháng', budget: '180,000,000 VNĐ', budgetNum: 180_000_000, team: '4 người',
    status: 'completed',
    metric1: '200K', m1label: 'Lượt tải xuống',
    metric2: '4.9★', m2label: 'App Store rating',
    metric3: '98%', m3label: 'User retention 30 ngày',
    challenge: 'Xây dựng ứng dụng y tế kết nối bệnh nhân với bác sĩ.',
    solution: 'React Native, WebRTC cho video consultation, end-to-end encryption.',
    result: '200K downloads trong 3 tháng đầu. Rating 4.9/5.',
    tags: ['React Native', 'Firebase', 'WebRTC', 'Node.js'],
    features: ['Video call HD', 'Bảo mật end-to-end', 'AI triage'],
    lp: 9000, hasDemo: true,
    demoUrl: 'https://example.com',
    maskedUrl: 'demo.loop-solutions.vn/medapp',
    demoTitle: 'MedApp Vietnam — UI Prototype',
    testimonial: { name: 'Dr. Trần Thị Mai', role: 'Medical Director', quote: 'MedApp giúp chúng tôi tiếp cận bệnh nhân ở vùng xa.' },
    featured: true, publishedAt: '2025-06-20',
  },
  {
    id: '3', title: 'AnalyticsPro Dashboard', tag: 'Data Analytics SaaS', cat: 'SaaS',
    client: 'DataViet Corp', color: DS.cyan,
    img: 'https://images.unsplash.com/photo-1771012788703-d310cdf189bb?auto=format&fit=crop&w=900&q=80',
    year: '2024', duration: '3 tháng', budget: '120,000,000 VNĐ', budgetNum: 120_000_000, team: '3 người',
    status: 'completed',
    metric1: '#1', m1label: 'Market Share VN',
    metric2: '99.9%', m2label: 'Uptime 12 tháng',
    metric3: '<2s', m3label: 'Query latency 100M rows',
    challenge: 'Dashboard analytics real-time xử lý 100M+ data points.',
    solution: 'Kiến trúc event-driven với BigQuery + materialized views.',
    result: '#1 analytics platform cho SME tại Việt Nam.',
    tags: ['React', 'D3.js', 'BigQuery', 'Python'],
    features: ['No-code report builder', 'Real-time sync', 'PDF export'],
    lp: 6000, hasDemo: true,
    demoUrl: 'https://example.com',
    maskedUrl: 'demo.loop-solutions.vn/analyticspro',
    demoTitle: 'AnalyticsPro Dashboard — Live Demo',
    featured: false, publishedAt: '2024-11-10',
  },
  {
    id: '4', title: 'EduViet Portal', tag: 'EdTech Platform', cat: 'Website',
    client: 'EduViet Foundation', color: DS.green,
    img: 'https://images.unsplash.com/photo-1762330910399-95caa55acf04?auto=format&fit=crop&w=900&q=80',
    year: '2024', duration: '3 tháng', budget: '75,000,000 VNĐ', budgetNum: 75_000_000, team: '3 người',
    status: 'completed',
    metric1: '10K', m1label: 'Học viên đăng ký',
    metric2: '+180%', m2label: 'Engagement rate',
    metric3: '95', m3label: 'PageSpeed score',
    challenge: 'Nền tảng học trực tuyến với video streaming và quiz.',
    solution: 'Next.js SSR, Cloudflare Stream, auto-generate PDF certificate.',
    result: '10K học viên trong 2 tháng đầu.',
    tags: ['Next.js', 'Supabase', 'Cloudflare'],
    features: ['Video streaming CDN', 'Interactive quiz', 'Auto certificate'],
    lp: 3750, hasDemo: false, demoUrl: '', maskedUrl: '', demoTitle: '',
    featured: false, publishedAt: '2024-09-05',
  },
  {
    id: '5', title: 'StartupHub Landing', tag: 'Corporate Website', cat: 'Website',
    client: 'StartupHub Vietnam', color: DS.amber,
    img: 'https://images.unsplash.com/photo-1588336443962-49d88df004a1?auto=format&fit=crop&w=900&q=80',
    year: '2025', duration: '3 tuần', budget: '25,000,000 VNĐ', budgetNum: 25_000_000, team: '2 người',
    status: 'completed',
    metric1: '98', m1label: 'PageSpeed score',
    metric2: '+45%', m2label: 'Conversion rate',
    metric3: '<0.5s', m3label: 'FCP',
    challenge: 'Landing page cần chuyển đổi cao, tốc độ cực nhanh.',
    solution: 'React + Vite, Motion animations, A/B testing.',
    result: '+45% conversion rate. PageSpeed 98.',
    tags: ['React', 'Vite', 'Motion'],
    features: ['Micro-interactions', 'A/B testing', 'Performance 98+'],
    lp: 1250, hasDemo: true,
    demoUrl: 'https://vercel.com/solutions/nextjs',
    maskedUrl: 'demo.loop-solutions.vn/startuphub',
    demoTitle: 'StartupHub Landing — Live Preview',
    featured: false, publishedAt: '2025-01-20',
  },
  {
    id: '6', title: 'FinDash Enterprise', tag: 'FinTech Dashboard', cat: 'SaaS',
    client: 'FinCorp Vietnam', color: DS.red,
    img: 'https://images.unsplash.com/photo-1634836023845-eddbfe9937da?auto=format&fit=crop&w=900&q=80',
    year: '2025', duration: '6 tháng', budget: '500,000,000 VNĐ', budgetNum: 500_000_000, team: '8 người',
    status: 'completed',
    metric1: '2B+', m1label: 'VNĐ được quản lý',
    metric2: '500+', m2label: 'Giao dịch/ngày',
    metric3: '99.99%', m3label: 'Uptime mission-critical',
    challenge: 'Nền tảng fintech enterprise với bảo mật banking-grade.',
    solution: 'Zero-trust security, Rust cho transaction engine.',
    result: 'Đang quản lý 2B+ VNĐ. Zero security incident.',
    tags: ['React', 'Rust', 'PostgreSQL', 'Redis', 'AWS'],
    features: ['Banking-grade security', 'Real-time transaction', 'AI fraud detection'],
    lp: 25000, hasDemo: false, demoUrl: '', maskedUrl: '', demoTitle: '',
    testimonial: { name: 'Lê Quang Đức', role: 'CTO, FinCorp Vietnam', quote: 'Đội ngũ hiểu sâu về fintech Việt Nam.' },
    featured: true, publishedAt: '2025-11-30',
  },
];

const INIT_SERVICES: Service[] = [
  { id: 'thiet-ke-web',       title: 'Thiết kế & Phát triển Website',   subtitle: 'Landing page đến e-commerce platform', icon: '🌐', color: DS.blue,   startPrice: 15_000_000,  endPrice: 200_000_000,   active: true, demoUrl: 'https://demo.vercel.store',            maskedUrl: 'demo.loop-solutions.vn/web-demo',            ordersCount: 8,  revenue: 620_000_000   },
  { id: 'phat-trien-app',     title: 'Phát triển App & SaaS Platform',   subtitle: 'Mobile app, web app enterprise',       icon: '⚙️', color: DS.purple, startPrice: 80_000_000,  endPrice: 1_000_000_000, active: true, demoUrl: 'https://example.com',                  maskedUrl: 'demo.loop-solutions.vn/saas-platform',       ordersCount: 5,  revenue: 1_250_000_000 },
  { id: 'dashboard-analytics',title: 'Dashboard & Data Analytics',       subtitle: 'Biến dữ liệu thành insight',            icon: '📊', color: DS.cyan,   startPrice: 25_000_000,  endPrice: 300_000_000,   active: true, demoUrl: 'https://example.com',                  maskedUrl: 'demo.loop-solutions.vn/analytics-dashboard', ordersCount: 3,  revenue: 360_000_000   },
  { id: 'seo-marketing',      title: 'SEO & Digital Marketing',           subtitle: 'Tăng trưởng organic bền vững',          icon: '📈', color: DS.green,  startPrice: 8_000_000,   endPrice: 50_000_000,    active: true, demoUrl: 'https://example.com',                  maskedUrl: 'demo.loop-solutions.vn/seo-report',          ordersCount: 12, revenue: 480_000_000,  perMonth: true },
];

const INIT_ORDERS: Order[] = [
  {
    id: 'ORD-2601', clientId: 2, clientName: 'Nguyễn Minh Tuấn', clientCompany: 'VNRetail JSC',
    clientAvatar: 'https://images.unsplash.com/photo-1665615839740-f9cfcc9568f9?auto=format&fit=crop&w=80&h=80&crop=faces',
    type: 'service', serviceType: 'phat-trien-app', serviceTitle: 'Phát triển App & SaaS Platform',
    title: 'VNRetail Platform v3 — Phase 2',
    budget: 175_000_000, lpUsed: 0, lpReward: 8750,
    status: 'in_progress', progress: 45,
    createdAt: '10/03/2026', updatedAt: '22/03/2026', deadline: '30/05/2026',
    assignedPM: 'Yuna Park',
    demoUrl: 'https://demo.vercel.store',
    maskedDemoUrl: 'demo.loop-solutions.vn/vnretail-v3',
    invoiceId: 'INV-2601', paidAt: '12/03/2026',
    tags: ['React', 'Next.js', 'Node.js', 'AWS'],
    messages: [
      { id: 'm1', senderId: 'admin', senderName: 'Yuna Park', content: 'Chào anh Tuấn! Team đã bắt đầu sprint 1. Sprint review vào 28/03.', type: 'text', timestamp: '12/03/2026 09:00', read: true },
      { id: 'm2', senderId: 'client', senderName: 'Nguyễn Minh Tuấn', content: 'Cảm ơn chị Yuna! Anh rất mong đợi.', type: 'text', timestamp: '12/03/2026 14:30', read: true },
      { id: 'm3', senderId: 'admin', senderName: 'Yuna Park', content: 'Em đã upload bản demo sprint 1!', type: 'demo_link', demoUrl: 'https://demo.vercel.store', maskedUrl: 'demo.loop-solutions.vn/vnretail-v3/sprint1', timestamp: '20/03/2026 11:15', read: true },
      { id: 'm4', senderId: 'client', senderName: 'Nguyễn Minh Tuấn', content: 'Nhờ chỉnh màu button checkout sang màu đỏ cam theo brand anh.', type: 'text', timestamp: '20/03/2026 16:00', read: false },
    ],
  },
  {
    id: 'ORD-2602', clientId: 3, clientName: 'Dr. Trần Thị Mai', clientCompany: 'HealthTech Vietnam',
    clientAvatar: 'https://images.unsplash.com/photo-1729337531424-198f880cb6c7?auto=format&fit=crop&w=80&h=80&crop=faces',
    type: 'service', serviceType: 'thiet-ke-web', serviceTitle: 'Thiết kế & Phát triển Website',
    title: 'HealthTech Corporate Website Redesign',
    budget: 45_000_000, lpUsed: 2000, lpReward: 2250,
    status: 'demo_ready', progress: 90,
    createdAt: '15/02/2026', updatedAt: '20/03/2026', deadline: '30/03/2026',
    assignedPM: 'Mei Lin',
    demoUrl: 'https://vercel.com/solutions/nextjs',
    maskedDemoUrl: 'demo.loop-solutions.vn/healthtech-web',
    invoiceId: 'INV-2602', paidAt: '16/02/2026',
    tags: ['Next.js', 'Tailwind', 'Sanity'],
    messages: [
      { id: 'm1', senderId: 'admin', senderName: 'Mei Lin', content: 'Em đã hoàn thiện 90% website. Đây là link review:', type: 'demo_link', demoUrl: 'https://vercel.com/solutions/nextjs', maskedUrl: 'demo.loop-solutions.vn/healthtech-web', timestamp: '20/03/2026 10:00', read: false },
    ],
  },
  {
    id: 'ORD-2603', clientId: 1, clientName: 'Lê Quang Đức', clientCompany: 'FinCorp Vietnam',
    clientAvatar: 'https://images.unsplash.com/photo-1642531291598-3a6b5cf98428?auto=format&fit=crop&w=80&h=80&crop=faces',
    type: 'service', serviceType: 'dashboard-analytics', serviceTitle: 'Dashboard & Data Analytics',
    title: 'FinCorp Internal Analytics Dashboard v2',
    budget: 280_000_000, lpUsed: 0, lpReward: 14000,
    status: 'paid', progress: 5,
    createdAt: '23/03/2026', updatedAt: '23/03/2026',
    assignedPM: undefined,
    invoiceId: 'INV-2603', paidAt: '23/03/2026',
    tags: ['React', 'D3.js', 'BigQuery'],
    messages: [
      { id: 'm1', senderId: 'admin', senderName: 'LOOP System', content: 'Hệ thống đã nhận thanh toán 280M VNĐ. Chúng tôi sẽ liên hệ trong vòng 24h.', type: 'system', timestamp: '23/03/2026 14:55', read: true },
    ],
  },
  {
    id: 'ORD-2604', clientId: 7, clientName: 'Vũ Hoàng Minh', clientCompany: 'RetailMax VN',
    clientAvatar: 'https://images.unsplash.com/photo-1769221909855-d1f62ef5aaa7?auto=format&fit=crop&w=80&h=80&crop=faces',
    type: 'service', serviceType: 'thiet-ke-web', serviceTitle: 'Thiết kế & Phát triển Website',
    title: 'RetailMax E-commerce Website',
    budget: 80_000_000, lpUsed: 0, lpReward: 4000,
    status: 'pending_payment', progress: 0,
    createdAt: '24/03/2026', updatedAt: '24/03/2026',
    invoiceId: 'INV-2604',
    tags: ['React', 'Next.js', 'WooCommerce'],
    messages: [],
  },
  {
    id: 'ORD-2505', clientId: 5, clientName: 'Ngô Thị Lan', clientCompany: 'EduViet Foundation',
    clientAvatar: 'https://images.unsplash.com/photo-1725144118950-44dc92db3f09?auto=format&fit=crop&w=80&h=80&crop=faces',
    type: 'service', serviceType: 'seo-marketing', serviceTitle: 'SEO & Digital Marketing',
    title: 'EduViet SEO Package Q1-Q2 2026',
    budget: 96_000_000, lpUsed: 1500, lpReward: 4800,
    status: 'done', progress: 100,
    createdAt: '01/01/2026', updatedAt: '20/03/2026', deadline: '30/06/2026',
    assignedPM: 'Yuna Park',
    invoiceId: 'INV-2505', paidAt: '02/01/2026',
    tags: ['SEO', 'Content', 'Analytics'],
    messages: [
      { id: 'm1', senderId: 'admin', senderName: 'Yuna Park', content: 'Báo cáo tháng 3: Traffic tăng 180%, 12 từ khóa top 3 Google.', type: 'text', timestamp: '20/03/2026 09:00', read: true },
    ],
  },
];

// ── Seed reference time: 2026-03-30 09:00 UTC (session start) ──────────────
// Captured once at module load → timestamps stay fresh within a session
// while remaining consistent across page reloads (not frozen at build time).
const SEED_NOW = Date.now();
const ago = (minutes: number) => SEED_NOW - minutes * 60 * 1000;
const agoH = (hours: number)   => SEED_NOW - hours * 3600 * 1000;
const agoD = (days: number)    => SEED_NOW - days * 86400 * 1000;

const INIT_ADMIN_NOTIFS: AdminNotification[] = [
  { id: 'an1', type: 'payment',        title: '💳 Thanh toán mới — FinCorp 280M VNĐ',  body: 'Lê Quang Đức (FinCorp Vietnam) vừa thanh toán INV-2603 trị giá 280,000,000 VNĐ.',  time: '5 phút trước',  timestamp: ago(5),     read: false, color: DS.green,  relatedOrderId: 'ORD-2603', relatedClientId: 1, priority: 'high',    department: 'finance',     assignedTo: 'Yuna Park',      category: 'finance', archived: false },
  { id: 'an2', type: 'client_message', title: '💬 Phản hồi từ khách hàng',              body: 'Nguyễn Minh Tuấn (VNRetail) đã reply: "Nhờ chỉnh màu button checkout."',           time: '32 phút trước', timestamp: ago(32),    read: false, color: DS.blue,   relatedOrderId: 'ORD-2601', relatedClientId: 2, priority: 'normal',  department: 'design',     assignedTo: 'Yuna Park',      category: 'client',   archived: false },
  { id: 'an3', type: 'new_order',      title: '📦 Đơn hàng mới — RetailMax 80M',        body: 'Vũ Hoàng Minh (RetailMax VN) xác nhận đơn ORD-2604. Đang chờ thanh toán.',          time: '2 giờ trước',   timestamp: agoH(2),   read: false, color: DS.purple, relatedOrderId: 'ORD-2604', relatedClientId: 7, priority: 'high',    department: 'sales',      assignedTo: undefined,       category: 'order',    archived: false },
  { id: 'an4', type: 'task',           title: '⚠️ Task khẩn sắp deadline',              body: 'Payment API Integration của Ryo Hashimoto đến hạn 01/04/2026.',                       time: '3 giờ trước',   timestamp: agoH(3),   read: true,  color: DS.red,   priority: 'urgent',  department: 'engineering', assignedTo: 'Ryo Hashimoto',  category: 'team',     archived: false },
  { id: 'an5', type: 'lp',             title: '⚡ Yuna Park lên cấp Level 68',          body: 'Yuna Park đạt Level 68 · Gold Rank. Tổng LP earned: 65,000.',                       time: '5 giờ trước',   timestamp: agoH(5),   read: true,  color: DS.amber, priority: 'low',     department: 'management',  assignedTo: 'Yuna Park',      category: 'team',     archived: false },
  { id: 'an6', type: 'system',         title: '📊 Báo cáo tuần S12',                    body: 'Báo cáo tuần #12/2026: Doanh thu 87M VNĐ, LP phát hành 8,200.',                     time: '1 ngày trước',  timestamp: agoD(1),   read: true,  color: DS.cyan,  priority: 'normal',  department: 'management',  category: 'system',   archived: false },
  { id: 'an7', type: 'media_booking', title: '📸 Booking mới — CafeHouse chụp ẩm thực', body: 'Trần Minh Hùng (CafeHouse VN) đặt lịch chụp ảnh sản phẩm + ẩm thực. Gói Professional, 19M VNĐ.', time: '6 giờ trước', timestamp: agoH(6),   read: false, color: '#F59E0B', relatedOrderId: 'MDA-8821', priority: 'normal',  department: 'media',     assignedTo: 'Haru Tanaka',     category: 'media',    archived: false },
  { id: 'an8', type: 'media_delivery', title: '🎬 Giao file — FashionX lookbook xong', body: 'Haru Tanaka đã giao toàn bộ ảnh lookbook Summer 2026 cho Phạm Thị Lan (FashionX). 120 ảnh, 5 sets.', time: '8 giờ trước', timestamp: agoH(8),   read: true,  color: '#14B8A6', relatedOrderId: 'MDA-8824', priority: 'normal',  department: 'media',     assignedTo: 'Haru Tanaka',     category: 'media',    archived: false },
  { id: 'an9', type: 'escalation',     title: '🔴 Escalation — ResortStar yêu cầu chỉnh sửa gấp', body: 'Vũ Đức Anh (ResortStar) yêu cầu chỉnh video intro trong 24h. Cần ưu tiên xử lý.', time: '10 giờ trước', timestamp: agoH(10),  read: false, color: DS.red,   priority: 'urgent',  department: 'media',     assignedTo: 'Trần Thu Linh',   category: 'media',    archived: false },
  { id: 'an10', type: 'payment',       title: '💳 Đặt cọc 30% — BeautyLab 24.75M VNĐ', body: 'Nguyễn Thu Hà (BeautyLab) đã đặt cọc 30% cho gói quay phim Premium. Tổng 82.5M VNĐ.', time: '3 ngày trước', timestamp: agoD(3),   read: true,  color: DS.green,  relatedOrderId: 'MDA-8822', priority: 'normal',  department: 'finance',     category: 'finance',   archived: false },
  { id: 'an11', type: 'client_message', title: '💬 TechStart hỏi về tiến độ content',  body: 'Lê Hoàng Nam (TechStart VN): "Anh muốn hỏi timeline series 8 videos. Khi nào bắt đầu quay?"', time: '12 giờ trước', timestamp: agoH(12),  read: false, color: DS.blue,   relatedOrderId: 'MDA-8823', priority: 'normal',  department: 'media',     assignedTo: 'Haru Tanaka',     category: 'client',   archived: false },
  { id: 'an12', type: 'task',          title: '📋 Review script TVC BeautyLab',        body: 'Haru Tanaka cần Akira Sato review và approve script TVC 30s trước khi quay.',          time: '1 ngày trước',  timestamp: agoD(1),   read: true,  color: DS.amber, priority: 'high',    department: 'media',     assignedTo: 'Akira Sato',      category: 'team',     archived: false },
];

const INIT_CLIENT_NOTIFS: ClientNotification[] = [
  { id: 'cn1', type: 'demo_ready', title: '🎉 Demo sẵn sàng — HealthTech Website', body: 'Mei Lin đã hoàn thiện 90% website. Nhấp để xem demo.', time: '2 giờ trước',  read: false, color: DS.green,  relatedOrderId: 'ORD-2602', demoUrl: 'https://vercel.com/solutions/nextjs', maskedUrl: 'demo.loop-solutions.vn/healthtech-web' },
  { id: 'cn2', type: 'message',    title: '💬 Tin nhắn từ Yuna Park',               body: 'VNRetail v3: Em đã upload bản demo sprint 1. Anh vào xem nhé!',  time: '3 ngày trước', read: true,  color: DS.blue,   relatedOrderId: 'ORD-2601' },
  { id: 'cn3', type: 'lp_earned',  title: '⚡ +8,750 LP được cộng',                 body: 'Dự án VNRetail Platform v3 tiến triển tốt. LP cộng khi hoàn thành.', time: '1 tuần trước', read: true,  color: DS.amber },
];

// ── Store Interface ──────────────────────────────────────────────────────────

interface LoopStore {
  portfolio: PortfolioProject[];
  services: Service[];
  orders: Order[];
  adminNotifications: AdminNotification[];
  clientNotifications: ClientNotification[];
  effects: RankEffect[];
  globalEffectsEnabled: boolean;
  memberEffectOverrides: MemberEffectOverride[];
  userEquippedEffects: string[];

  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus, pm?: string) => void;
  updateOrderProgress: (orderId: string, progress: number) => void;
  sendDemoLink: (orderId: string, demoUrl: string, maskedUrl: string, note?: string) => void;
  sendAdminMessage: (orderId: string, content: string, type?: OrderMessage['type'], demoUrl?: string, maskedUrl?: string) => void;
  markAdminNotifRead: (id: string) => void;
  markAllAdminNotifsRead: () => void;
  deleteAdminNotif: (id: string) => void;
  archiveAdminNotif: (id: string) => void;
  bulkDeleteAdminNotifs: (ids: string[]) => void;
  bulkReadAdminNotifs: (ids: string[]) => void;
  bulkArchiveAdminNotifs: (ids: string[]) => void;
  addAdminNotification: (notif: AdminNotification) => void;

  updateProject: (id: string, data: Partial<PortfolioProject>) => void;
  addProject: (p: PortfolioProject) => void;
  deleteProject: (id: string) => void;

  updateService: (id: ServiceType, data: Partial<Service>) => void;

  addEffect: (effect: RankEffect) => void;
  updateEffect: (id: string, data: Partial<RankEffect>) => void;
  deleteEffect: (id: string) => void;
  toggleEffectEnabled: (id: string) => void;
  setGlobalEffectsEnabled: (enabled: boolean) => void;
  updateMemberOverride: (override: MemberEffectOverride) => void;
  setMemberOverridesForMember: (memberId: number, overrides: MemberEffectOverride[]) => void;

  equipUserEffect: (effectId: string) => void;
  clearUserEffects: () => void;

  sendClientMessage: (orderId: string, content: string) => void;
  markClientNotifRead: (id: string) => void;
  markAllClientNotifsRead: () => void;

  getOrdersByClient: (clientId: number) => Order[];
  getUnreadAdminCount: () => number;
  getUnreadClientCount: () => number;
  getOrderById: (id: string) => Order | undefined;
  getEnabledEffects: () => RankEffect[];
  getUserEquippedEffectObjects: () => RankEffect[];
}

// ── Zustand Store ────────────────────────────────────────────────────────────

export const useLoopStore = create<LoopStore>((set, get) => ({
  portfolio: INIT_PORTFOLIO,
  services: INIT_SERVICES,
  orders: INIT_ORDERS,
  adminNotifications: INIT_ADMIN_NOTIFS,
  clientNotifications: INIT_CLIENT_NOTIFS,
  effects: INIT_EFFECTS,
  globalEffectsEnabled: true,
  memberEffectOverrides: INIT_OVERRIDES,
  userEquippedEffects: ['eff-1', 'eff-9'],

  // ── Admin order actions ──────────────────────────────────────────────────
  addOrder: (order) => set(s => ({ orders: [order, ...s.orders] })),

  updateOrderStatus: (orderId, status, pm) => set(s => {
    const newNotif: AdminNotification = {
      id: `an_${Date.now()}`, type: 'system',
      title: `Đơn ${orderId} → ${status}`,
      body: `Trạng thái đơn hàng đã được cập nhật thành: ${status}`,
      time: 'Vừa xong', read: false, color: DS.blue, relatedOrderId: orderId,
      timestamp: Date.now(), priority: 'normal', department: 'sales', assignedTo: 'Nguyễn Văn A', category: 'order', archived: false,
    };
    return {
      orders: s.orders.map(o => o.id === orderId
        ? { ...o, status, assignedPM: pm ?? o.assignedPM, updatedAt: new Date().toLocaleDateString('vi-VN') }
        : o),
      adminNotifications: [newNotif, ...s.adminNotifications],
    };
  }),

  updateOrderProgress: (orderId, progress) => set(s => ({
    orders: s.orders.map(o => o.id === orderId ? { ...o, progress } : o),
  })),

  sendDemoLink: (orderId, demoUrl, maskedUrl, note) => set(s => {
    const order = s.orders.find(o => o.id === orderId);
    if (!order) return {};
    const msg: OrderMessage = {
      id: `msg_${Date.now()}`, senderId: 'admin', senderName: order.assignedPM ?? 'LOOP Team',
      content: note ?? 'Demo sẵn sàng! Anh/Chị xem và phản hồi nhé.',
      type: 'demo_link', demoUrl, maskedUrl,
      timestamp: new Date().toLocaleString('vi-VN'), read: false,
    };
    const clientNotif: ClientNotification = {
      id: `cn_${Date.now()}`, type: 'demo_ready',
      title: `🎉 Demo sẵn sàng — ${order.title}`,
      body: `${order.assignedPM ?? 'Đội LOOP'} vừa gửi demo dự án của bạn.`,
      time: 'Vừa xong', read: false, color: DS.green,
      relatedOrderId: orderId, demoUrl, maskedUrl,
    };
    return {
      orders: s.orders.map(o => o.id === orderId
        ? { ...o, status: 'demo_ready', demoUrl, maskedDemoUrl: maskedUrl, messages: [...o.messages, msg], updatedAt: new Date().toLocaleDateString('vi-VN') }
        : o),
      clientNotifications: [clientNotif, ...s.clientNotifications],
    };
  }),

  sendAdminMessage: (orderId, content, type = 'text', demoUrl, maskedUrl) => set(s => {
    const order = s.orders.find(o => o.id === orderId);
    if (!order) return {};
    const msg: OrderMessage = {
      id: `msg_${Date.now()}`, senderId: 'admin', senderName: order.assignedPM ?? 'LOOP Team',
      content, type, demoUrl, maskedUrl,
      timestamp: new Date().toLocaleString('vi-VN'), read: false,
    };
    return { orders: s.orders.map(o => o.id === orderId ? { ...o, messages: [...o.messages, msg] } : o) };
  }),

  markAdminNotifRead: (id) => set(s => ({ adminNotifications: s.adminNotifications.map(n => n.id === id ? { ...n, read: true } : n) })),
  markAllAdminNotifsRead: () => set(s => ({ adminNotifications: s.adminNotifications.map(n => ({ ...n, read: true })) })),
  deleteAdminNotif: (id) => set(s => ({ adminNotifications: s.adminNotifications.filter(n => n.id !== id) })),
  archiveAdminNotif: (id) => set(s => ({ adminNotifications: s.adminNotifications.map(n => n.id === id ? { ...n, archived: true } : n) })),
  bulkDeleteAdminNotifs: (ids) => set(s => ({ adminNotifications: s.adminNotifications.filter(n => !ids.includes(n.id)) })),
  bulkReadAdminNotifs: (ids) => set(s => ({ adminNotifications: s.adminNotifications.map(n => ids.includes(n.id) ? { ...n, read: true } : n) })),
  bulkArchiveAdminNotifs: (ids) => set(s => ({ adminNotifications: s.adminNotifications.map(n => ids.includes(n.id) ? { ...n, archived: true } : n) })),
  addAdminNotification: (notif) => set(s => ({ adminNotifications: [notif, ...s.adminNotifications] })),
  setAdminNotifications: (notifs) => set({ adminNotifications: notifs }),

  // ── Portfolio ────────────────────────────────────────────────────────────
  updateProject: (id, data) => set(s => ({ portfolio: s.portfolio.map(p => p.id === id ? { ...p, ...data } : p) })),
  addProject: (p) => set(s => ({ portfolio: [p, ...s.portfolio] })),
  deleteProject: (id) => set(s => ({ portfolio: s.portfolio.filter(p => p.id !== id) })),

  // ── Services ─────────────────────────────────────────────────────────────
  updateService: (id, data) => set(s => ({ services: s.services.map(sv => sv.id === id ? { ...sv, ...data } : sv) })),

  // ── Effects admin actions ────────────────────────────────────────────────
  addEffect: (effect) => set(s => ({ effects: [...s.effects, effect] })),
  updateEffect: (id, data) => set(s => ({ effects: s.effects.map(e => e.id === id ? { ...e, ...data } : e) })),
  deleteEffect: (id) => set(s => ({
    effects: s.effects.filter(e => e.id !== id),
    userEquippedEffects: s.userEquippedEffects.filter(eid => eid !== id),
  })),
  toggleEffectEnabled: (id) => set(s => ({ effects: s.effects.map(e => e.id === id ? { ...e, enabled: !e.enabled } : e) })),
  setGlobalEffectsEnabled: (enabled) => set({ globalEffectsEnabled: enabled }),
  // Replace all effects (used for BE sync)
  setEffects: (effects) => set({ effects }),
  // Sync effects from BE — merges BE data into store, keeps local-only fields
  syncEffects: (beEffects: RankEffect[]) => set(s => {
    const merged = [...s.effects];
    for (const be of beEffects) {
      const idx = merged.findIndex(e => e.id === be.id);
      if (idx >= 0) merged[idx] = { ...merged[idx], ...be };
      else merged.push(be);
    }
    return { effects: merged };
  }),
  updateMemberOverride: (override) => set(s => {
    const idx = s.memberEffectOverrides.findIndex(o => o.memberId === override.memberId && o.effectId === override.effectId);
    if (idx >= 0) {
      return { memberEffectOverrides: s.memberEffectOverrides.map((o, i) => i === idx ? override : o) };
    }
    return { memberEffectOverrides: [...s.memberEffectOverrides, override] };
  }),
  setMemberOverridesForMember: (memberId, overrides) => set(s => ({
    memberEffectOverrides: [
      ...s.memberEffectOverrides.filter(o => o.memberId !== memberId),
      ...overrides,
    ],
  })),

  // ── User effect actions ──────────────────────────────────────────────────
  equipUserEffect: (effectId) => set(s => {
    const equipped = s.userEquippedEffects;
    if (equipped.includes(effectId)) {
      return { userEquippedEffects: equipped.filter(id => id !== effectId) };
    }
    if (equipped.length >= 3) {
      return { userEquippedEffects: [...equipped.slice(1), effectId] };
    }
    return { userEquippedEffects: [...equipped, effectId] };
  }),
  clearUserEffects: () => set({ userEquippedEffects: [] }),

  // ── Client actions ───────────────────────────────────────────────────────
  sendClientMessage: (orderId, content) => set(s => {
    const msg: OrderMessage = {
      id: `msg_${Date.now()}`, senderId: 'client', senderName: 'Nguyễn Minh Tuấn',
      content, type: 'text',
      timestamp: new Date().toLocaleString('vi-VN'), read: false,
    };
    const adminNotif: AdminNotification = {
      id: `an_${Date.now()}`, type: 'client_message',
      title: `💬 Tin nhắn mới từ khách — Đơn ${orderId}`,
      body: content.slice(0, 100),
      time: 'Vừa xong', read: false, color: DS.blue, relatedOrderId: orderId,
      timestamp: Date.now(), priority: 'normal', department: 'sales', assignedTo: 'Nguyễn Văn A', category: 'order', archived: false,
    };
    return {
      orders: s.orders.map(o => o.id === orderId ? { ...o, messages: [...o.messages, msg] } : o),
      adminNotifications: [adminNotif, ...s.adminNotifications],
    };
  }),

  markClientNotifRead: (id) => set(s => ({ clientNotifications: s.clientNotifications.map(n => n.id === id ? { ...n, read: true } : n) })),
  markAllClientNotifsRead: () => set(s => ({ clientNotifications: s.clientNotifications.map(n => ({ ...n, read: true })) })),

  // ── Computed ─────────────────────────────────────────────────────────────
  getOrdersByClient: (clientId) => get().orders.filter(o => o.clientId === clientId),
  getUnreadAdminCount: () => get().adminNotifications.filter(n => !n.read && !n.archived).length,
  getUnreadClientCount: () => get().clientNotifications.filter(n => !n.read).length,
  getOrderById: (id) => get().orders.find(o => o.id === id),
  getEnabledEffects: () => get().effects.filter(e => e.enabled),
  getUserEquippedEffectObjects: () => {
    const { effects, userEquippedEffects } = get();
    return userEquippedEffects.map(id => effects.find(e => e.id === id)).filter(Boolean) as RankEffect[];
  },
}));