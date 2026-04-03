// ── LOOP Solutions — Global Design System Tokens ──────────────────────────
// Dùng chung cho tất cả các trang

export const DS = {
  // Backgrounds
  bg: '#020617',
  bgCard: '#0F172A',
  bgCard2: '#111827',
  bgCard3: '#0D1526',

  // Borders
  border: '#1F2937',
  border2: '#374151',

  // Primary palette
  blue: '#3B82F6',
  blueDark: '#1D4ED8',
  purple: '#818CF8',
  cyan: '#14B8A6',
  green: '#22C55E',
  amber: '#F59E0B',
  red: '#EF4444',

  // Text
  text: '#FFFFFF',
  text2: '#E2E8F0',
  text3: '#94A3B8',
  text4: '#64748B',
  text5: '#475569',

  // Fonts
  mono: "'JetBrains Mono', monospace",
  heading: "'Cinzel', serif",
  body: "'Inter', 'Noto Serif JP', sans-serif",
};

// Gradient strings
export const GRD = {
  primary: 'linear-gradient(135deg, #1D4ED8, #818CF8)',
  blue: 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
  purple: 'linear-gradient(135deg, #818CF8, #7DD3FC)',
  cyan: 'linear-gradient(135deg, #14B8A6, #818CF8)',
  gold: 'linear-gradient(135deg, #F59E0B, #FDE68A)',
  hero: 'linear-gradient(135deg, rgba(29,78,216,0.15), rgba(129,140,248,0.08))',
  heroText: 'linear-gradient(135deg, #FFFFFF 0%, #94A3B8 100%)',
  nav: 'rgba(2,6,23,0.85)',
};

// Glow shadows
export const GLOW = {
  blue: '0 0 20px rgba(59,130,246,0.4)',
  purple: '0 0 20px rgba(129,140,248,0.4)',
  cyan: '0 0 20px rgba(20,184,166,0.4)',
  card: '0 8px 32px rgba(0,0,0,0.4)',
};

// Navigation links
export const NAV_LINKS = [
  { label: 'Trang chủ', href: '/' },
  { label: 'Dịch vụ', href: '/dich-vu' },
  { label: 'Media', href: '/media' },
  { label: 'Dự án', href: '/du-an' },
  { label: 'Đội ngũ', href: '/doi-ngu' },
  { label: 'Học viện', href: '/hoc-vien' },
  { label: 'Blog', href: '/blog' },
  { label: 'Bảng giá', href: '/bao-gia' },
  { label: 'Xếp hạng', href: '/bang-xep-hang' },
  { label: 'Liên hệ', href: '/lien-he' },
];