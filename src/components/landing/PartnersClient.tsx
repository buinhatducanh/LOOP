"use client";

/**
 * PartnersClient — LOOP Solutions Partners Page
 */
import { motion } from "motion/react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { DS, GRD } from "@/lib/design-tokens";

interface TechPartner {
  name: string;
  category: string;
  color: string;
  logo: React.ReactNode;
}

function TechLogo({ name, color }: { name: string; color: string }) {
  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "3/2",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "0.75rem",
        background: `${color}10`,
        border: `1px solid ${color}20`,
        flexDirection: "column",
        gap: "0.375rem",
        padding: "1rem",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: `${color}20`,
          border: `1px solid ${color}35`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: color,
          fontSize: "0.6875rem",
          fontWeight: 900,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "-0.02em",
        }}
      >
        {name.slice(0, 2).toUpperCase()}
      </div>
      <span
        style={{
          color: color,
          fontSize: "0.75rem",
          fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
          textAlign: "center",
          letterSpacing: "0.02em",
        }}
      >
        {name}
      </span>
    </div>
  );
}

const TECH_PARTNERS = [
  { name: "Next.js", category: "Framework", color: "#FFFFFF" },
  { name: "Vercel", category: "Hosting", color: "#FFFFFF" },
  { name: "Supabase", category: "Database", color: "#3ECF8E" },
  { name: "PostgreSQL", category: "Database", color: "#6699CC" },
  { name: "Prisma", category: "ORM", color: "#5A67D8" },
  { name: "Figma", category: "Design", color: "#F24E1E" },
  { name: "Cloudinary", category: "Media", color: "#3448C5" },
  { name: "Shopify", category: "E-Commerce", color: "#95BF47" },
  { name: "HubSpot", category: "Marketing", color: "#FF7A59" },
  { name: "Google Cloud", category: "Infrastructure", color: "#4285F4" },
  { name: "Stripe", category: "Payments", color: "#635BFF" },
  { name: "Node.js", category: "Runtime", color: "#339933" },
];

export function PartnersClient({ locale }: { locale: string }) {
  return (
    <div style={{ minHeight: "100vh", background: DS.bg }}>
      {/* Hero */}
      <div
        style={{
          padding: "5rem 1.5rem 4rem",
          textAlign: "center",
          background: GRD.cosmicBg3,
          borderBottom: `1px solid ${DS.border}`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse 50% 50% at 50% -10%, rgba(98,197,235,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", maxWidth: 760, margin: "0 auto" }}>
          <div
            style={{
              display: "inline-flex",
              padding: "6px 14px",
              borderRadius: 20,
              background: `${DS.cosmicCyan}15`,
              border: `1px solid ${DS.cosmicCyan}30`,
              color: DS.cosmicCyan,
              fontSize: "0.6875rem",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.1em",
              marginBottom: "1.5rem",
            }}
          >
            ĐỐI TÁC CÔNG NGHỆ
          </div>
          <h1
            style={{
              color: DS.text,
              fontFamily: DS.heading,
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: "1rem",
              background: `linear-gradient(135deg, #fff 0%, ${DS.cosmicCyan} 60%, ${DS.cosmicBlue} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Đối tác công nghệ
          </h1>
          <p style={{ color: DS.text3, fontSize: "1.0625rem", lineHeight: 1.6, maxWidth: 540, margin: "0 auto" }}>
            Chúng tôi sử dụng và là đối tác với các nền tảng công nghệ tốt nhất để mang lại giải pháp tối ưu cho khách hàng.
          </p>
        </div>
      </div>

      {/* Tech partners grid */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem" }}>
        <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: "1.25rem", marginBottom: "0.5rem", textAlign: "center" }}>
          Đối tác công nghệ
        </h2>
        <p style={{ color: DS.text4, fontSize: "0.875rem", textAlign: "center", marginBottom: "2.5rem" }}>
          Các nền tảng và công cụ chúng tôi sử dụng để xây dựng sản phẩm vượt kỳ vọng
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: "1rem",
          }}
        >
          {TECH_PARTNERS.map((partner, i) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <TechLogo name={partner.name} color={partner.color} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div
        style={{
          maxWidth: 860,
          margin: "0 auto",
          padding: "0 1.5rem 3rem",
        }}
      >
        <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: "1.25rem", marginBottom: "1.5rem", textAlign: "center" }}>
          Lợi ích khi làm việc với chúng tôi
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "1rem",
          }}
        >
          {[
            {
              icon: "⚡",
              title: "Hiệu suất cao",
              desc: "Next.js SSR, tốc độ tải dưới 1s, Core Web Vitals đạt 90+.",
            },
            {
              icon: "🔒",
              title: "Bảo mật",
              desc: "HTTPS, JWT, mã hóa PII, quy trình DevSecOps chuẩn quốc tế.",
            },
            {
              icon: "📈",
              title: "Mở rộng",
              desc: "Hạ tầng cloud auto-scale, chịu tải 100K+ người dùng đồng thời.",
            },
            {
              icon: "🤝",
              title: "Hỗ trợ 24/7",
              desc: "Đội ngũ kỹ thuật sẵn sàng xử lý sự cố bất kỳ lúc nào.",
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              style={{
                padding: "1.25rem",
                borderRadius: "1rem",
                background: "rgba(15,23,42,0.65)",
                border: `1px solid ${DS.border}`,
              }}
            >
              <div style={{ fontSize: "1.5rem", marginBottom: "0.625rem" }}>{item.icon}</div>
              <div style={{ color: DS.text, fontWeight: 700, fontSize: "0.9375rem", marginBottom: "0.375rem" }}>
                {item.title}
              </div>
              <div style={{ color: DS.text3, fontSize: "0.8125rem", lineHeight: 1.5 }}>
                {item.desc}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "0 1.5rem 5rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            padding: "2.5rem",
            borderRadius: "1.5rem",
            background: GRD.cosmicBg1,
            border: `1px solid ${DS.border}`,
          }}
        >
          <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: "1.25rem", marginBottom: "0.75rem" }}>
            Trở thành đối tác
          </h2>
          <p style={{ color: DS.text3, fontSize: "0.9375rem", marginBottom: "1.5rem" }}>
            Bạn muốn hợp tác với LOOP Solutions? Liên hệ ngay để thảo luận cơ hội hợp tác.
          </p>
          <a
            href={`/${locale}/consultation`}
            style={{
              padding: "0.75rem 2rem",
              borderRadius: "1rem",
              background: GRD.primary,
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.9375rem",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            Liên hệ ngay
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}
