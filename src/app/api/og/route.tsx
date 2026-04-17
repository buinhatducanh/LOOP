import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

const LOCALES = ["vi", "en", "ja", "ko", "zh"] as const;
type Locale = (typeof LOCALES)[number];

const SUBTITLES: Record<Locale, Record<string, string>> = {
 vi: {
 home: "Thiết kế Website & Ứng dụng chuyên nghiệp",
 booking: "Nhận báo giá Website",
 service: "Thiết kế Website & Ứng dụng chuyên nghiệp",
 portfolio: "Dự án đạt giải & Case Studies",
 pricing: "Bảng giá minh bạch cho mọi doanh nghiệp",
 blog: "Kiến thức, hướng dẫn & tin tức ngành",
 team: "Gặp gỡ đội ngũ chuyên gia tại LOOP",
 about: "Về LOOP — Câu chuyện, sứ mệnh & giá trị",
 contact: "Liên hệ với đội ngũ của chúng tôi",
 },
 en: {
 home: "Professional Website Design & Development",
 booking: "Get a Free Website Quote",
 service: "Professional Web Design & Development Agency",
 portfolio: "Award-Winning Projects & Case Studies",
 pricing: "Transparent Pricing Plans for Every Business",
 blog: "Insights, Tutorials & Industry News",
 team: "Meet the Experts Behind LOOP",
 about: "About LOOP — Our Story, Mission & Values",
 contact: "Get in Touch with Our Team",
 },
 ja: {
 home: "ウェブサイト・ならLOOP",
 booking: "ウェブサイトもりをける",
 service: "プロフェッショナルなWeb・アプリ",
 portfolio: "のあるプロジェクト",
 pricing: "あらゆるビジネスにしたな",
 blog: "とヒント、thành công",
 team: "LOOPのチームをします",
 about: "LOOPについて — たちのストーリーと",
 contact: "チームにする",
 },
 ko: {
 home: "전문적인 웹사이트 설계 및 개발",
 booking: "웹사이트 견적 받기",
 service: "전문 웹 디자인 & 개발 에이전시",
 portfolio: "수상 경력 프로젝트 & 사례 연구",
 pricing: "모든 비즈니스를 위한 투명한 가격 계획",
 blog: "인사이트, 튜토리얼 & 업계 뉴스",
 team: "LOOP의 전문가 팀 소개",
 about: "LOOP 소개 — 우리의 이야기, 미션 & 가치",
 contact: "우리 팀에 연락하기",
 },
 zh: {
 home: "",
 booking: "",
 service: "proxy",
 portfolio: "",
 pricing: "",
 blog: "、",
 team: "LOOP",
 about: "LOOP — 、",
 contact: "",
 },
};

const DEFAULT_DESCRIPTIONS: Record<Locale, string> = {
 vi: "Wizard 3 bước chọn gói Website phù hợp. Báo giá minh bạch, không phí ẩn. Tặng 500 LP khi đăng ký.",
 en: "3-step wizard to choose the right website package. Transparent pricing, no hidden fees. Get 500 LP reward on sign-up.",
 ja: "3ステップでなウェブサイトパッケージを。な、れたなし。サインアップで500 LPを。",
 ko: "올바른 웹사이트 패키지를 선택하는 3단계 마법사. 투명한 가격, 숨겨진 비용 없음. 가입 시 500 LP 보상 획득.",
 zh: "3。。500 LP。",
};

// Inline SVG logo — avoids external image fetch at Edge runtime
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="56" height="56">
 <defs>
 <linearGradient id="lbg" x1="0%" y1="0%" x2="100%" y2="100%">
 <stop offset="0%" stop-color="#6B3DF5"/>
 <stop offset="100%" stop-color="#EC4899"/>
 </linearGradient>
 </defs>
 <polygon points="32,3 57,17.5 57,46.5 32,61 7,46.5 7,17.5" fill="url(#lbg)"/>
 <path d="M32 32 C24 20,10 20,10 32 C10 44,24 44,32 32" fill="none" stroke="white" stroke-width="5.5" stroke-linecap="round"/>
 <path d="M32 32 C40 44,54 44,54 32 C54 20,40 20,32 32" fill="none" stroke="white" stroke-width="5.5" stroke-linecap="round"/>
 <line x1="28" y1="28" x2="36" y2="36" stroke="white" stroke-width="5.5" stroke-linecap="round"/>
 <circle cx="12" cy="20" r="2" fill="#EC4899" opacity="0.8"/>
 <circle cx="52" cy="44" r="2" fill="#4F7DF3" opacity="0.8"/>
</svg>`;

const LOGO_DATA_URI = `data:image/svg+xml,${encodeURIComponent(LOGO_SVG)}`;

const CTA_LABELS: Record<Locale, string> = {
 vi: "Khám phá ngay",
 en: "Explore Now",
 ja: "すぐめる",
 ko: "지금 살펴보기",
 zh: "",
};

// ─── Blog Post OG Image ─────────────────────────────────────────────────────────

async function renderBlogPostOg(title: string, excerpt: string, imageUrl?: string, locale: Locale = "vi") {
  const accent = "#6B3DF5";
  const accent2 = "#EC4899";
  const accent3 = "#4F7DF3";
  const text = "#ffffff";
  const muted = "#94a3b8";
  const cardBg = "rgba(15,23,42,0.85)";

  const localeLabels: Record<Locale, string> = {
    vi: "Bài viết",
    en: "Blog Post",
    ja: "ブログ",
    ko: "블로그",
    zh: "博客",
  };

  // Use cover image as left-side accent if provided
  const hasImage = imageUrl && (imageUrl.startsWith("http://") || imageUrl.startsWith("https://") || imageUrl.startsWith("//"));

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "row",
          background: `linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)`,
          fontFamily: "Inter, system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background decorative elements */}
        <div style={{ position: "absolute", top: 0, right: 0, width: "600px", height: "600px", background: `radial-gradient(circle, ${accent}25 0%, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, width: "500px", height: "500px", background: `radial-gradient(circle, ${accent2}18 0%, transparent 70%)`, pointerEvents: "none" }} />

        {/* Cover image on the right side */}
        {hasImage && (
          <div
            style={{
              width: "420px",
              flexShrink: 0,
              position: "relative",
              display: "flex",
              alignItems: "stretch",
            }}
          >
            <img
              src={imageUrl}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              alt=""
            />
            {/* Gradient overlay */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: `linear-gradient(to right, rgba(2,6,23,0.7) 0%, transparent 60%)`,
              }}
            />
          </div>
        )}

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px 60px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Top bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <img src={LOGO_DATA_URI} width={44} height={44} style={{ borderRadius: "10px" }} />
              <span style={{ fontSize: "22px", fontWeight: 700, color: text, letterSpacing: "-0.02em" }}>LOOP</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "6px 16px",
                borderRadius: "999px",
                border: `1px solid ${accent2}50`,
                background: `${accent2}18`,
                fontSize: "13px",
                fontWeight: 600,
                color: "#F472B6",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              ✦ {localeLabels[locale]}
            </div>
          </div>

          {/* Title & Excerpt */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1, justifyContent: "center", paddingTop: "20px" }}>
            <div
              style={{
                fontSize: title.length > 50 ? "36px" : title.length > 30 ? "44px" : "52px",
                fontWeight: 700,
                color: text,
                lineHeight: 1.15,
                letterSpacing: "-0.03em",
                maxWidth: hasImage ? "680px" : "1080px",
              }}
            >
              {title}
            </div>
            {excerpt ? (
              <div
                style={{
                  fontSize: "18px",
                  color: muted,
                  lineHeight: 1.55,
                  maxWidth: hasImage ? "600px" : "900px",
                  maxHeight: "80px",
                  overflow: "hidden",
                }}
              >
                {excerpt.length > 150 ? excerpt.substring(0, 147) + "…" : excerpt}
              </div>
            ) : null}
          </div>

          {/* Bottom bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              paddingTop: "20px",
            }}
          >
            <span style={{ fontSize: "16px", color: muted }}>loops.vn/blog</span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "16px", color: muted }}>
              <span style={{ color: accent3, fontWeight: 600 }}>loops.vn</span>
              <span>·</span>
              <span>+84 37 844 3602</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

// ─── Generic OG Image ───────────────────────────────────────────────────────────

function renderGenericOg(title: string, description: string, subtitle: string, locale: Locale, type: string) {
 const accent = "#6B3DF5";
 const accent2 = "#EC4899";
 const accent3 = "#4F7DF3";
 const text = "#ffffff";
 const muted = "#94a3b8";
 const isHome = type === "home";

 return new ImageResponse(
 (
 <div
 style={{
 height: "100%",
 width: "100%",
 display: "flex",
 flexDirection: "column",
 justifyContent: "space-between",
 padding: "72px",
 background: `linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)`,
 fontFamily: "Inter, system-ui, sans-serif",
 }}
 >
 {/* Top Bar */}
 <div
 style={{
 display: "flex",
 alignItems: "center",
 justifyContent: "space-between",
 }}
 >
 {/* Logo + Brand */}
 <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
 <img
 src={LOGO_DATA_URI}
 width={56}
 height={56}
 style={{ borderRadius: "12px" }}
 />
 <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
 <span
 style={{
 fontSize: "32px",
 fontWeight: 700,
 color: text,
 letterSpacing: "-0.02em",
 lineHeight: 1,
 }}
 >
 LOOP
 </span>
 <span
 style={{
 fontSize: "14px",
 fontWeight: 500,
 color: muted,
 letterSpacing: "0.08em",
 }}
 >
 SOLUTIONS
 </span>
 </div>
 </div>

 {/* Type badge */}
 <div
 style={{
 display: "flex",
 alignItems: "center",
 padding: "8px 20px",
 borderRadius: "999px",
 border: `1px solid ${accent}40`,
 background: `${accent}18`,
 fontSize: "15px",
 fontWeight: 600,
 color: "#818CF8",
 textTransform: "uppercase",
 letterSpacing: "0.05em",
 }}
 >
 {isHome ? "✦ Professional Web Agency" : type === "booking" ? "✦ Nhận báo giá Website" : type}
 </div>
 </div>

 {/* Main Content */}
 <div
 style={{
 display: "flex",
 flexDirection: "column",
 gap: "20px",
 flex: 1,
 justifyContent: "center",
 paddingTop: "16px",
 }}
 >
 {/* Title */}
 <div
 style={{
 fontSize: title.length > 36 ? "52px" : "64px",
 fontWeight: 700,
 color: text,
 lineHeight: 1.1,
 letterSpacing: "-0.03em",
 maxWidth: "1100px",
 }}
 >
 {title}
 </div>

 {/* Description */}
 <div
 style={{
 fontSize: "22px",
 color: muted,
 lineHeight: 1.5,
 maxWidth: "880px",
 }}
 >
 {description.length > 130
 ? description.substring(0, 127) + "…"
 : description}
 </div>

 {/* CTA hint */}
 <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "8px" }}>
 <div
 style={{
 display: "flex",
 alignItems: "center",
 gap: "8px",
 padding: "10px 22px",
 borderRadius: "999px",
 background: `linear-gradient(135deg, ${accent}, ${accent2})`,
 color: "#fff",
 fontSize: "16px",
 fontWeight: 600,
 }}
 >
 → {CTA_LABELS[locale]}
 </div>
 <div
 style={{
 display: "flex",
 alignItems: "center",
 gap: "8px",
 padding: "10px 20px",
 borderRadius: "999px",
 border: `1px solid ${accent}30`,
 background: `${accent}10`,
 color: "#818CF8",
 fontSize: "15px",
 fontWeight: 600,
 }}
 >
 ✦ +500 LP Reward
 </div>
 </div>
 </div>

 {/* Bottom Bar */}
 <div
 style={{
 display: "flex",
 alignItems: "center",
 justifyContent: "space-between",
 borderTop: "1px solid rgba(255,255,255,0.08)",
 paddingTop: "24px",
 }}
 >
 <span style={{ fontSize: "18px", color: muted }}>{subtitle}</span>
 <div
 style={{
 display: "flex",
 alignItems: "center",
 gap: "8px",
 fontSize: "18px",
 color: muted,
 }}
 >
 <span style={{ color: accent3, fontWeight: 600 }}>loops.vn</span>
 <span>·</span>
 <span>+84 37 844 3602</span>
 </div>
 </div>

 {/* Decorative — top right glow */}
 <div
 style={{
 position: "absolute",
 top: 0,
 right: 0,
 width: "500px",
 height: "500px",
 background: `radial-gradient(circle, ${accent}20 0%, transparent 70%)`,
 pointerEvents: "none",
 }}
 />
 {/* Decorative — bottom left glow */}
 <div
 style={{
 position: "absolute",
 bottom: 0,
 left: 0,
 width: "400px",
 height: "400px",
 background: `radial-gradient(circle, ${accent2}15 0%, transparent 70%)`,
 pointerEvents: "none",
 }}
 />
 </div>
 ),
 {
 width: 1200,
 height: 630,
 }
 );
}

// ─── Route Handler ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
 const { searchParams } = req.nextUrl;
 const rawLocale = searchParams.get("locale") ?? "vi";
 const locale = LOCALES.includes(rawLocale as Locale) ? (rawLocale as Locale) : "vi";
 const type = searchParams.get("type") ?? "home";

 const rawTitle = searchParams.get("title");
 const rawDescription = searchParams.get("description");
 const rawSubtitle = searchParams.get("subtitle");
 const rawImage = searchParams.get("image");

 // ── Blog post OG: /api/og?type=blog-post&slug=...&locale=... ──
 if (type === "blog-post") {
   // Edge runtime cannot import prisma (uses Node.js 'pg' module).
   // Use explicit params for blog post OG — prisma lookup is skipped.
   const title = rawTitle ?? "Blog | LOOP Solutions";
   const excerpt = rawDescription ?? "";
   const image = rawImage ?? undefined;
   return renderBlogPostOg(title, excerpt, image, locale);
 }

 // ── Generic OG (existing types) ──
 const title =
 rawTitle ??
 (type === "home"
 ? "LOOP Solutions"
 : SUBTITLES[locale][type] ?? SUBTITLES[locale].home);

 const description = rawDescription ?? DEFAULT_DESCRIPTIONS[locale];
 const subtitle = rawSubtitle ?? SUBTITLES[locale][type] ?? SUBTITLES[locale].home;

 return renderGenericOg(title, description, subtitle, locale, type);
}
