/**
 * LOOP Solutions — Figma Design System Tokens
 * Re-exported from FIGMA OLD FE ds.ts for use across Next.js app.
 *
 * Source: DESIGN LOOPS/src/app/components/layout/ds.ts (đã đồng bộ)
 * ⚠️ NGUỒN SỰ THẬT CHO TOÀN BỘ PROJECT ⚠️
 *
 * Palette updated 2026-04-07:
 *   color_2.png → COSMIC: deep space, purple/blue/red nebula
 *   color_3.png → ACCENT: gold, lavender, teal tones
 *
 * Usage in React:
 *   import { DS, GRD, GLOW, NAV_LINKS } from "@/lib/design-tokens"
 *   style={{ background: DS.bg, color: DS.text }}
 *
 * Dark theme colors mapped to CSS custom properties in src/styles/index.css.
 */

export const DS = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  bg:          "#0C0C14",   // Deep space (cosmic palette)
  bgCosmic:    "#0C0C14",
  bgDeep:      "#1A1A2E",
  bgCard:      "#111827",
  bgCard2:     "#111827",
  bgCard3:     "#0D1526",

  // ── Borders ──────────────────────────────────────────────────────────────
  border:       "#2A2A4A",
  border2:      "#374151",

  // ── Cosmic palette (from color_2.png) ─────────────────────────────────────
  cosmicPurple: "#6B3DF5",
  cosmicBlue:   "#4F7DF3",
  cosmicRed:    "#CC3344",

  // ── Accent palette (from color_3.png) ────────────────────────────────────
  gold:         "#E6C75F",
  lavender:     "#B07CC6",
  teal:         "#6EB1A8",
  sky:          "#6E8EC0",
  rose:         "#D77E8E",
  mint:         "#7CB5A0",
  navy:         "#7C6DAA",
  blueAccent:   "#89A8C0",

  // ── Legacy palette (mapped to cosmic/accent) ──────────────────────────────
  blue:         "#4F7DF3",   // was #3B82F6 → cosmic blue
  blueDark:     "#6B3DF5",   // was #1D4ED8 → cosmic purple
  purple:       "#6B3DF5",   // was #818CF8 → cosmic purple
  cyan:         "#6EB1A8",   // was #14B8A6 → teal accent
  green:        "#7CB5A0",   // was #22C55E → mint accent
  amber:        "#E6C75F",   // was #F59E0B → gold accent
  red:          "#CC3344",   // was #EF4444 → cosmic red

  // ── Text ─────────────────────────────────────────────────────────────────
  text:         "#FFFFFF",
  text2:        "#E2E8F0",
  text3:        "#B8C4D4",
  text4:        "#7A8A9E",
  text5:        "#5A6A7E",

  // ── Fonts ────────────────────────────────────────────────────────────────
  mono:         "'JetBrains Mono', monospace",
  heading:      "Plus Jakarta Sans, var(--font-plus-jakarta), system-ui, sans-serif",
  body:         "DM Sans, var(--font-dm-sans), system-ui, sans-serif",
} as const;

// ── Gradients ────────────────────────────────────────────────────────────────

export const GRD = {
  primary:      "linear-gradient(135deg, #6B3DF5, #4F7DF3)",
  primaryHover: "linear-gradient(135deg, #7B4FFF, #5F8BFF)",
  cosmic:       "linear-gradient(135deg, #6B3DF5, #CC3344)",
  cosmicBlue:   "linear-gradient(135deg, #4F7DF3, #6B3DF5)",
  accent:       "linear-gradient(135deg, #E6C75F, #B07CC6)",
  gold:         "linear-gradient(135deg, #E6C75F, #FFD700)",
  teal:         "linear-gradient(135deg, #6EB1A8, #7CB5A0)",
  blue:         "linear-gradient(135deg, #4F7DF3, #6E8EC0)",
  purple:       "linear-gradient(135deg, #6B3DF5, #B07CC6)",
  cyan:         "linear-gradient(135deg, #6EB1A8, #6B3DF5)",
  hero:         "linear-gradient(135deg, rgba(107,61,245,0.15), rgba(79,125,243,0.08))",
  heroText:     "linear-gradient(135deg, #FFFFFF 0%, #B8C4D4 100%)",
  text:         "linear-gradient(135deg, #FFFFFF, #B8C4D4)",
  nav:          "rgba(12,12,20,0.90)",
  card:         "rgba(17,24,39,0.80)",
  glow:         "rgba(107,61,245,0.15)",
} as const;

// ── Glow shadows ─────────────────────────────────────────────────────────────

export const GLOW = {
  purple:   "0 0 20px rgba(107,61,245,0.45)",
  blue:     "0 0 20px rgba(79,125,243,0.40)",
  red:      "0 0 20px rgba(204,51,68,0.35)",
  gold:     "0 0 20px rgba(230,199,95,0.35)",
  cosmic:   "0 0 20px rgba(107,61,245,0.30), 0 0 40px rgba(79,125,243,0.15)",
  card:     "0 8px 32px rgba(0,0,0,0.40)",
  cardGlow: "0 0 60px rgba(107,61,245,0.12)",
} as const;

export const NAV_LINKS = [
  { label: "Trang chủ", href: "/" },
  { label: "Dịch vụ", href: "/dich-vu" },
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
