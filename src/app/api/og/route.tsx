import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://loop.vn";

// Extract fonts from next/font or use system fallback
const fontStyles = {
  fontFamily: "Inter, system-ui, sans-serif",
  fontWeight: 700,
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title") ?? "LOOPS - Loop Solutions";
  const description = searchParams.get("description") ?? "Thiết kế Website & Ứng dụng chuyên nghiệp";
  const type = searchParams.get("type") ?? "website";
  const locale = searchParams.get("locale") ?? "vi";

  // Color palette matching dark theme
  const bgGradient = `linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)`;
  const accentColor = "#6366f1"; // indigo-500
  const textColor = "#ffffff";
  const mutedColor = "#94a3b8"; // slate-400

  const subtitle =
    locale === "en"
      ? getSubtitle(type)
      : getSubtitleVi(type);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: bgGradient,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo / Brand */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "12px",
                background: `linear-gradient(135deg, ${accentColor}, #8b5cf6)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                fontWeight: 700,
                color: "#fff",
              }}
            >
              L
            </div>
            <span
              style={{
                fontSize: "36px",
                fontWeight: 700,
                color: textColor,
                letterSpacing: "-0.02em",
              }}
            >
              LOOPS
            </span>
          </div>

          {/* Page type badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 20px",
              borderRadius: "999px",
              border: `1px solid ${accentColor}40`,
              background: `${accentColor}15`,
              fontSize: "18px",
              color: accentColor,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {type}
          </div>
        </div>

        {/* Main Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            flex: 1,
            justifyContent: "center",
            paddingTop: "40px",
          }}
        >
          {/* Title */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontSize: title.length > 40 ? "56px" : "72px",
              fontWeight: 700,
              color: textColor,
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
              display: "flex",
              fontSize: "24px",
              color: mutedColor,
              lineHeight: 1.5,
              maxWidth: "900px",
            }}
          >
            {description.length > 120
              ? description.substring(0, 117) + "..."
              : description}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: "32px",
          }}
        >
          <span
            style={{
              fontSize: "20px",
              color: mutedColor,
            }}
          >
            {subtitle}
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "20px",
              color: mutedColor,
            }}
          >
            <span style={{ color: accentColor, fontWeight: 600 }}>loop.vn</span>
            <span>—</span>
            <span>2026</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    }
  );
}

function getSubtitle(type: string): string {
  const map: Record<string, string> = {
    service: "Professional Web Design & Development Agency",
    portfolio: "Award-Winning Projects & Case Studies",
    pricing: "Transparent Pricing Plans for Every Business",
    blog: "Insights, Tutorials & Industry News",
    team: "Meet the Experts Behind LOOP",
    about: "About LOOP — Our Story, Mission & Values",
    contact: "Get in Touch with Our Team",
  };
  return map[type] ?? "Professional Web Design & Development Agency";
}

function getSubtitleVi(type: string): string {
  const map: Record<string, string> = {
    service: "Thiết kế Website & Ứng dụng chuyên nghiệp",
    portfolio: "Dự án đạt giải & Case Studies",
    pricing: "Bảng giá minh bạch cho mọi doanh nghiệp",
    blog: "Kiến thức, hướng dẫn & tin tức ngành",
    team: "Gặp gỡ đội ngũ chuyên gia tại LOOP",
    about: "Về LOOP — Câu chuyện, sứ mệnh & giá trị",
    contact: "Liên hệ với đội ngũ của chúng tôi",
  };
  return map[type] ?? "Thiết kế Website & Ứng dụng chuyên nghiệp";
}
