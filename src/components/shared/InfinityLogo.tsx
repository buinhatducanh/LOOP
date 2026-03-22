"use client";

import { Link } from "@/i18n/routing";

interface InfinityLogoProps {
  /** Show "Solutions" subtitle below the wordmark */
  showSubtitle?: boolean;
  /** Link href — defaults to "/" */
  href?: string;
  /** Clickable area height (controls overall size) */
  size?: "sm" | "md" | "lg";
  /** Additional CSS class */
  className?: string;
}

/**
 * Shared LOOPS (Loop Solutions) logo component.
 * Uses an inline SVG infinity-loop symbol that replaces the two "O"s in "LOOPS".
 * Drop this component anywhere you need the company logo.
 */
export function InfinityLogo({
  showSubtitle = false,
  href = "/",
  size = "md",
  className = "",
}: InfinityLogoProps) {
  const sizes = {
    sm: { icon: 28, text: "16px", subtitle: "8px", gap: "6px" },
    md: { icon: 36, text: "20px", subtitle: "10px", gap: "7px" },
    lg: { icon: 44, text: "26px", subtitle: "12px", gap: "8px" },
  };

  const s = sizes[size];

  return (
    <Link
      href={href}
      className={className}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: s.gap,
        textDecoration: "none",
      }}
    >
      {/* Icon + Wordmark row */}
      <div style={{ display: "flex", alignItems: "center", gap: s.gap }}>
        {/* Infinity-loop SVG — replaces the "OO" in "LOOPS" */}
        <svg
          width={s.icon}
          height={s.icon}
          viewBox="0 0 44 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ flexShrink: 0 }}
          aria-hidden="true"
        >
          {/* Glow filter */}
          <defs>
            <filter id="inf-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer dark stroke */}
          <path
            d="M 2 12 C 2 6 7 2 13 2 C 19 2 22 6 22 12 C 22 18 19 22 13 22 C 7 22 2 18 2 12"
            stroke="#0a0f1e"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Outer dark stroke (second loop) */}
          <path
            d="M 42 12 C 42 6 37 2 31 2 C 25 2 22 6 22 12 C 22 18 25 22 31 22 C 37 22 42 18 42 12"
            stroke="#0a0f1e"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Gradient inner stroke */}
          <path
            d="M 2 12 C 2 6 7 2 13 2 C 19 2 22 6 22 12 C 22 18 19 22 13 22 C 7 22 2 18 2 12"
            stroke="url(#inf-grad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            filter="url(#inf-glow)"
          />
          {/* Gradient inner stroke (second loop) */}
          <path
            d="M 42 12 C 42 6 37 2 31 2 C 25 2 22 6 22 12 C 22 18 25 22 31 22 C 37 22 42 18 42 12"
            stroke="url(#inf-grad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
            filter="url(#inf-glow)"
          />
          {/* Gradient definition */}
          <defs>
            <linearGradient id="inf-grad" x1="2" y1="2" x2="42" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
        </svg>

        {/* LOOPS text */}
        <span
          style={{
            fontSize: s.text,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            background: "linear-gradient(to right, #C4B5FD, #A5F3FC)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            lineHeight: 1,
          }}
        >
          LOOPS
        </span>
      </div>

      {/* Subtitle */}
      {showSubtitle && (
        <span
          style={{
            fontSize: s.subtitle,
            fontWeight: 600,
            letterSpacing: "0.08em",
            color: "rgba(167,139,250,0.7)",
            lineHeight: 1,
            textTransform: "uppercase",
          }}
        >
          Solutions
        </span>
      )}
    </Link>
  );
}

/**
 * Compact inline logo variant — just icon + "LOOPS" wordmark, no subtitle.
 * Drop-in replacement for all logo usages across the site.
 */
export function LogoInline({
  href = "/",
  size = "md",
  className = "",
}: Pick<InfinityLogoProps, "href" | "size" | "className">) {
  return (
    <InfinityLogo
      showSubtitle={false}
      href={href}
      size={size}
      className={className}
    />
  );
}
