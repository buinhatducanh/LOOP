/**
 * LOOP Solutions — Figma Design System Tokens
 *
 * ⚠️ NGUỒN SỰ THẬT CHO TOÀN BỘ PROJECT ⚠️
 *
 * Source: public/assets/design-company/Bảng màu.png + color_1/2/3.png
 * Updated 2026-04-07:
 *   - COSMIC PALETTE: deep blue cosmos (color_2.png)
 *   - ACCENT PALETTE: vibrant accent colors (color_3.png)
 *   - PRIMARY ACCENT: Hot Pink (#EC4899)
 *
 * Usage in React:
 *   import { DS, GRD, GLOW, NAV_LINKS } from "@/lib/design-tokens"
 *   style={{ background: DS.bg, color: DS.text }}
 */

export const DS = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  bg: "var(--bg, #0C0C14)",
  bgCosmic: "var(--bg-cosmic, #0C0C14)",
  bgDeep: "var(--bg-deep, #1A1A2E)",
  bgCard: "var(--bg-card, #111827)",
  bgCard2: "var(--bg-card2, #111827)",
  bgCard3: "var(--bg-card3, #0D1526)",

  // ── Borders ──────────────────────────────────────────────────────────────
  border: "var(--border, #2A2A4A)",
  border2: "var(--border2, #374151)",

  // ── Cosmic Palette (color_2.png — deep blue cosmos) ───────────────────────
  cosmicPurple: "var(--ds-cosmic-purple, #6B3DF5)",   // Bright cosmic purple
  cosmicBlue: "var(--ds-cosmic-blue, #4F7DF3)",   // Bright cosmic blue
  cosmicRed: "var(--ds-cosmic-red, #CC3344)",   // Cosmic red
  cosmicCyan: "var(--ds-cosmic-cyan, #62C5EB)",   // Bright cosmic cyan
  cosmicIndigo: "#18387A",   // Deep indigo
  cosmicNavy: "#143F72",   // Deep navy blue
  cosmicMagenta: "var(--ds-cosmic-magenta, #CF53B6)",  // Cosmic magenta
  cosmicViolet: "#5F3C99",  // Cosmic violet
  cosmicRose: "var(--ds-cosmic-rose, #8E3577)",   // Cosmic rose
  cosmicDeepMag: "#6F265A",  // Deep magenta

  // Secondary cosmic tones
  cosmicRoyalBlue: "#2C61A0",
  cosmicMedBlue: "#3C63A9",
  cosmicSkyBlue: "#618FCA",
  cosmicNavyMed: "#174A8D",
  cosmicPurpleMid: "#6662B0",
  cosmicPurpleLt: "#2D2179",
  cosmicIndigoLt: "#291F75",
  cosmicDeepBlue: "#0F2753",
  cosmicNavyBlue: "#03234F",
  cosmicTealBlue: "#38529D",
  cosmicMedIndigo: "#343071",
  cosmicLavender: "#A571BC",
  cosmicPinkLt: "#A6689B",

  // ── Accent Palette (color_3.png — vibrant accent) ────────────────────────
  gold: "var(--ds-gold, #E6C75F)",
  goldLight: "var(--ds-gold-light, #FFD700)",
  lavender: "var(--ds-lavender, #B07CC6)",
  teal: "var(--ds-teal, #6EB1A8)",
  sky: "#6E8EC0",
  rose: "var(--ds-rose, #D77E8E)",
  mint: "var(--ds-mint, #7CB5A0)",
  navy: "#7C6DAA",
  blueAccent: "#89A8C0",
  pink: "var(--ds-pink, #EC4899)",    // Hot pink — PRIMARY ACCENT (2026-04-07)
  pinkLight: "var(--ds-pink-light, #F472B6)",    // Light pink

  // ── Neutral Palette (color_1.png — gray scale) ───────────────────────────
  gray50: "#FAFAFA",
  gray100: "#F4F4F5",
  gray200: "#E4E4E7",
  gray300: "#D4D4D8",
  gray400: "#A1A1AA",
  gray500: "#71717A",
  gray600: "#52525B",
  gray700: "#3F3F46",
  gray800: "#27272A",
  gray900: "#18181B",

  // ── Legacy palette (mapped to cosmic/accent) ──────────────────────────────
  blue: "var(--ds-cosmic-blue, #4F7DF3)",   // was #3B82F6 → cosmic blue
  blueDark: "var(--ds-cosmic-purple, #6B3DF5)",   // was #1D4ED8 → cosmic purple
  purple: "var(--ds-cosmic-purple, #6B3DF5)",   // was #818CF8 → cosmic purple
  cyan: "var(--ds-teal, #6EB1A8)",   // was #14B8A6 → teal accent
  green: "var(--ds-mint, #7CB5A0)",   // was #22C55E → mint accent
  amber: "var(--ds-gold, #E6C75F)",   // was #F59E0B → gold accent
  red: "var(--ds-cosmic-red, #CC3344)",   // was #EF4444 → cosmic red

  // ── Text ─────────────────────────────────────────────────────────────────
  text: "var(--text, #FFFFFF)",
  text2: "var(--text2, #E2E8F0)",
  text3: "var(--text3, #B8C4D4)",
  text4: "var(--text4, #7A8A9E)",
  text5: "var(--text5, #5A6A7E)",

  // ── Fonts ────────────────────────────────────────────────────────────────
  mono: "'JetBrains Mono', monospace",
  heading: "Plus Jakarta Sans, var(--font-plus-jakarta), system-ui, sans-serif",
  body: "DM Sans, var(--font-dm-sans), system-ui, sans-serif",
} as const;

// ── Gradients ────────────────────────────────────────────────────────────────

export const GRD = {
  // Primary (cosmic purple → hot pink) — resolved via --figma-grd-primary CSS var for light mode
  primary: "var(--figma-grd-primary, linear-gradient(135deg, #6B3DF5, #EC4899))",
  primaryHover: "var(--figma-grd-primary, linear-gradient(135deg, #6B3DF5, #EC4899))",

  // Pink variants
  pink: "linear-gradient(135deg, #EC4899, #F472B6)",
  pinkCosmic: "linear-gradient(135deg, #6B3DF5, #EC4899, #F472B6)",
  pinkGold: "linear-gradient(135deg, #EC4899, #E6C75F)",
  pinkPurple: "linear-gradient(135deg, #F472B6, #B07CC6)",

  // Cosmic gradients
  cosmic: "linear-gradient(135deg, #6B3DF5, #CC3344)",
  cosmicBlue: "linear-gradient(135deg, #4F7DF3, #6B3DF5)",
  cosmicPurple: "linear-gradient(135deg, #6B3DF5, #5F3C99)",
  cosmicCyan: "linear-gradient(135deg, #62C5EB, #4F7DF3)",
  cosmicMagenta: "linear-gradient(135deg, #CF53B6, #6B3DF5)",
  cosmicNavy: "linear-gradient(135deg, #143F72, #18387A)",
  cosmicRed: "linear-gradient(135deg, #CC3344, #8E3577)",

  // Accent gradients
  accent: "linear-gradient(135deg, #E6C75F, #B07CC6)",
  gold: "linear-gradient(135deg, #E6C75F, #FFD700)",
  goldCosmic: "linear-gradient(135deg, #E6C75F, #6B3DF5)",
  teal: "linear-gradient(135deg, #6EB1A8, #7CB5A0)",
  tealCosmic: "linear-gradient(135deg, #6EB1A8, #6B3DF5)",
  blue: "linear-gradient(135deg, #4F7DF3, #6E8EC0)",
  blueCosmic: "linear-gradient(135deg, #4F7DF3, #62C5EB)",
  purple: "linear-gradient(135deg, #6B3DF5, #B07CC6)",
  purpleCosmic: "linear-gradient(135deg, #5F3C99, #6B3DF5)",
  cyan: "linear-gradient(135deg, #6EB1A8, #6B3DF5)",
  rose: "linear-gradient(135deg, #D77E8E, #CF53B6)",

  // Background / layout
  hero: "linear-gradient(135deg, rgba(107,61,245,0.15), rgba(79,125,243,0.08))",
  heroText: "linear-gradient(135deg, #FFFFFF 0%, #B8C4D4 100%)",
  text: "linear-gradient(135deg, #FFFFFF, #B8C4D4)",
  nav: "rgba(12,12,20,0.90)",
  card: "rgba(17,24,39,0.80)",
  glow: "rgba(107,61,245,0.15)",

  // Cosmic background layers
  cosmicBg1: "linear-gradient(135deg, rgba(107,61,245,0.20) 0%, rgba(79,125,243,0.10) 50%, rgba(98,197,235,0.05) 100%)",
  cosmicBg2: "linear-gradient(135deg, rgba(207,83,182,0.12) 0%, rgba(107,61,245,0.10) 50%, rgba(12,29,73,0.20) 100%)",
  cosmicBg3: "linear-gradient(135deg, rgba(12,29,73,0.30) 0%, rgba(107,61,245,0.15) 50%, rgba(98,197,235,0.08) 100%)",
} as const;

// ── Glow shadows ─────────────────────────────────────────────────────────────

export const GLOW = {
  // Primary glows
  pink: "0 0 20px rgba(236,72,153,0.45)",
  pinkStrong: "0 0 30px rgba(236,72,153,0.55), 0 0 60px rgba(236,72,153,0.25)",
  pinkCosmic: "0 0 30px rgba(236,72,153,0.30), 0 0 60px rgba(107,61,245,0.15)",

  // Cosmic glows
  purple: "0 0 20px rgba(107,61,245,0.45)",
  purpleStrong: "0 0 30px rgba(107,61,245,0.55), 0 0 60px rgba(107,61,245,0.25)",
  blue: "0 0 20px rgba(79,125,243,0.40)",
  blueStrong: "0 0 30px rgba(79,125,243,0.50), 0 0 60px rgba(79,125,243,0.25)",
  cyan: "0 0 20px rgba(98,197,235,0.45)",
  cyanStrong: "0 0 30px rgba(98,197,235,0.55), 0 0 60px rgba(98,197,235,0.25)",
  magenta: "0 0 20px rgba(207,83,182,0.45)",
  red: "0 0 20px rgba(204,51,68,0.35)",
  cosmic: "0 0 20px rgba(107,61,245,0.30), 0 0 40px rgba(79,125,243,0.15)",
  cosmicFull: "0 0 40px rgba(107,61,245,0.30), 0 0 80px rgba(79,125,243,0.15), 0 0 120px rgba(98,197,235,0.08)",
  cosmicCyan: "0 0 30px rgba(98,197,235,0.30), 0 0 60px rgba(79,125,243,0.20)",

  // Accent glows
  gold: "0 0 20px rgba(230,199,95,0.35)",
  goldStrong: "0 0 30px rgba(230,199,95,0.50), 0 0 60px rgba(230,199,95,0.25)",
  teal: "0 0 20px rgba(110,177,168,0.40)",
  lavender: "0 0 20px rgba(176,124,198,0.40)",
  rose: "0 0 20px rgba(215,126,142,0.40)",

  // Layout glows
  cardShadow: "0 8px 32px rgba(0,0,0,0.40)",
  cardGlow: "0 0 60px rgba(107,61,245,0.12)",
  cardPinkGlow: "0 0 60px rgba(236,72,153,0.12), 0 0 120px rgba(107,61,245,0.06)",
  soft: "0 4px 20px rgba(0,0,0,0.25)",
} as const;

export const NAV_LINKS = [
  { label: "Trang chủ", href: "/" },
  { label: "Dịch vụ", href: "/thiet-ke-website" },
  { label: "Media", href: "/media" },
  { label: "Dự án", href: "/du-an" },
  { label: "Đội ngũ", href: "/doi-ngu" },
  { label: "Học viện", href: "/hoc-vien" },
  { label: "Blog", href: "/blog" },
  { label: "Bảng giá", href: "/bao-gia" },
  { label: "Xếp hạng", href: "/bang-xep-hang" },
  { label: "Liên hệ", href: "/lien-he" },
] as const;

// ── Type helpers ─────────────────────────────────────────────────────────────

export type DSColor = (typeof DS)[keyof typeof DS];
export type GRDValue = (typeof GRD)[keyof typeof GRD];
export type GLOWValue = (typeof GLOW)[keyof typeof GLOW];
