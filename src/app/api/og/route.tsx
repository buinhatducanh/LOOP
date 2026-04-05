import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title") ?? "Nhận báo giá Website";
  const description =
    searchParams.get("description") ??
    "Wizard 3 bước chọn gói Website phù hợp. Báo giá minh bạch, không phí ẩn. Tặng 500 LP khi đăng ký.";
  const type = searchParams.get("type") ?? "booking";
  const locale = searchParams.get("locale") ?? "vi";

  // Colors
  const bgFrom = "#020617";
  const bgVia = "#0f172a";
  const bgTo = "#1e1b4b";
  const accent = "#6366f1"; // indigo-500
  const accent2 = "#8b5cf6"; // purple-500
  const text = "#ffffff";
  const muted = "#94a3b8";

  const subtitle =
    locale === "en"
      ? getSubtitle(type)
      : getSubtitleVi(type);

  // Logo URL — @vercel/og fetches remote <img> URLs automatically inside ImageResponse.
  // Cache at CDN layer (1 week) so Edge cold-starts don't pay the fetch cost.
  const logoUrl = `${req.nextUrl.origin}/logo.png`;

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
          background: `linear-gradient(135deg, ${bgFrom} 0%, ${bgVia} 50%, ${bgTo} 100%)`,
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
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "18px",
            }}
          >
            {/* @vercel/og fetches remote <img> src URLs automatically.
                If logo.png is missing, the image slot stays blank — acceptable. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
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
                  letterSpacing: "0.05em",
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
              background: `${accent}15`,
              fontSize: "16px",
              fontWeight: 600,
              color: accent,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {type === "booking" ? "✦ Nhận báo giá Website" : type}
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
            paddingTop: "20px",
          }}
        >
          {/* Title */}
          <div
            style={{
              fontSize: title.length > 40 ? "52px" : "64px",
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginTop: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                borderRadius: "999px",
                background: `linear-gradient(135deg, ${accent}, ${accent2})`,
                color: "#fff",
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              →
              {locale === "en" ? "Get Quote Now" : "Nhận báo giá ngay"}
            </div>
            <div
              style={{
                fontSize: "15px",
                color: muted,
              }}
            >
              ✦ +500 LP reward
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
            paddingTop: "28px",
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
            <span style={{ color: accent, fontWeight: 600 }}>ducanhnhatbui@gmail.com</span>
            <span>·</span>
            <span>+84 37 844 3602</span>
          </div>
        </div>

        {/* Decorative grid dots */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "400px",
            height: "400px",
            background: `radial-gradient(circle, ${accent}18 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />
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
    booking: "Professional Website Design & Development",
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
    booking: "Thiết kế Website chuyên nghiệp",
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
