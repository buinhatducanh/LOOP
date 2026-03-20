import "@testing-library/jest-dom";
import { vi } from "vitest";
import React from "react";

// ─── Mock next/navigation ────────────────────────────────────────────────────
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// ─── Mock next/image ──────────────────────────────────────────────────────────
vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) =>
    React.createElement("img", { alt: props.alt ?? "" }),
}));

// ─── Mock next-intl ───────────────────────────────────────────────────────────
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useTranslationsAsync: () => async (key: string) => key,
  getTranslations: async () => async (key: string) => key,
}));

// ─── Mock framer-motion ───────────────────────────────────────────────────────
vi.mock("framer-motion", () => ({
  motion: {
    div: "div",
    span: "span",
    button: "button",
    section: "section",
    nav: "nav",
    header: "header",
    footer: "footer",
    article: "article",
    main: "main",
    aside: "aside",
    ul: "ul",
    li: "li",
    a: "a",
    p: "p",
    h1: "h1",
    h2: "h2",
    h3: "h3",
    h4: "h4",
    img: "img",
    form: "form",
    input: "input",
    label: "label",
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  useAnimation: () => ({
    start: vi.fn(),
  }),
  useInView: () => true,
  useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
  useTransform: () => 0,
  useSpring: () => ({ get: () => 0 }),
  useMotionValueEvent: vi.fn(),
  useReducedMotion: () => false,
}));

// ─── Mock recharts ────────────────────────────────────────────────────────────
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => children,
  LineChart: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  BarChart: () => null,
  Bar: () => null,
  PieChart: () => null,
  Pie: () => null,
  Cell: () => null,
  AreaChart: () => null,
  Area: () => null,
}));

// ─── Mock @vercel/analytics ─────────────────────────────────────────────────
vi.mock("@vercel/analytics/react", () => ({
  Analytics: () => null,
}));

// ─── Mock @vercel/speed-insights ─────────────────────────────────────────────
vi.mock("@vercel/speed-insights/next", () => ({
  SpeedInsights: () => null,
}));

// ─── Global fetch mock (for API tests) ───────────────────────────────────────
global.fetch = vi.fn();
