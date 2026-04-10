"use client";

/**
 * WhyUsClient — LOOP Solutions Why Us Page
 */
import { motion } from "motion/react";
import {
  Zap, TrendingUp, Users, Trophy, CheckCircle2,
  ArrowRight, Star, Code,
} from "lucide-react";
import { DS, GRD } from "@/lib/design-tokens";

const PROCESS_STEPS = [
  {
    icon: <Star size={20} />,
    color: DS.pink,
    step: "01",
    title: "Khám phá nhu cầu",
    desc: "Chúng tôi lắng nghe mục tiêu, đối tượng và thách thức của doanh nghiệp bạn.",
  },
  {
    icon: <Zap size={20} />,
    color: DS.cosmicPurple,
    step: "02",
    title: "Chiến lược số",
    desc: "Xây dựng lộ trình chuyển đổi số phù hợp với ngân sách và timeline.",
  },
  {
    icon: <Code size={20} />,
    color: DS.cosmicBlue,
    step: "03",
    title: "Thiết kế & Phát triển",
    desc: "Đội ngũ 27+ chuyên gia thiết kế, code và tối ưu sản phẩm.",
  },
  {
    icon: <TrendingUp size={20} />,
    color: DS.green,
    step: "04",
    title: "Kiểm thử & Triển khai",
    desc: "QA chuyên nghiệp, staging và deployment lên production.",
  },
  {
    icon: <Trophy size={20} />,
    color: DS.gold,
    step: "05",
    title: "Bàn giao & Đào tạo",
    desc: "Tài liệu đầy đủ, đào tạo sử dụng và handover trơn tru.",
  },
  {
    icon: <Users size={20} />,
    color: DS.teal,
    step: "06",
    title: "Hỗ trợ liên tục",
    desc: "Bảo trì, cập nhật và mở rộng hệ thống theo nhu cầu phát triển.",
  },
];

const COMPARISON = [
  {
    feature: "Đội ngũ chuyên nghiệp",
    loop: true,
    agency: false,
    freelancer: false,
  },
  {
    feature: "Quy trình chuẩn hóa",
    loop: true,
    agency: true,
    freelancer: false,
  },
  {
    feature: "Bảo hành & Hỗ trợ dài hạn",
    loop: true,
    agency: "partial",
    freelancer: false,
  },
  {
    feature: "Hệ thống LP — thưởng cho khách hàng",
    loop: true,
    agency: false,
    freelancer: false,
  },
  {
    feature: "Tích hợp đa nền tảng",
    loop: true,
    agency: "partial",
    freelancer: false,
  },
  {
    feature: "Đội ngũ PM/Designer/Dev/QA đầy đủ",
    loop: true,
    agency: true,
    freelancer: false,
  },
  {
    feature: "Giao hàng đúng timeline",
    loop: true,
    agency: "partial",
    freelancer: false,
  },
  {
    feature: "Chi phí minh bạch, không phát sinh",
    loop: true,
    agency: false,
    freelancer: "partial",
  },
];

const TECH_STACK = [
  { name: "Next.js", color: "#fff" },
  { name: "React", color: "#61DAFB" },
  { name: "TypeScript", color: "#3178C6" },
  { name: "Tailwind CSS", color: "#38BDF8" },
  { name: "Vercel", color: "#fff" },
  { name: "Supabase", color: "#3ECF8E" },
  { name: "Prisma", color: "#5A67D8" },
  { name: "PostgreSQL", color: "#336791" },
  { name: "Figma", color: "#F24E1E" },
  { name: "Cloudinary", color: "#3448C5" },
  { name: "Shopify", color: "#95BF47" },
  { name: "HubSpot", color: "#FF7A59" },
  { name: "Google Cloud", color: "#4285F4" },
  { name: "Node.js", color: "#339933" },
];

function CheckIcon({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="8" fill={color} fillOpacity="0.15" />
      <path d="M5 8l2 2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="8" fill={DS.red} fillOpacity="0.1" />
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke={DS.red} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PartialIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="8" fill={DS.amber} fillOpacity="0.1" />
      <path d="M5 8h6" stroke={DS.amber} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function WhyUsClient({ locale }: { locale: string }) {
  return (
    <div style={{ minHeight: "100vh", background: DS.bg }}>
      {/* Hero */}
      <div
        style={{
          padding: "5rem 1.5rem 4rem",
          textAlign: "center",
          background: GRD.cosmicBg1,
          borderBottom: `1px solid ${DS.border}`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse 50% 60% at 50% -10%, rgba(236,72,153,0.15) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", maxWidth: 760, margin: "0 auto" }}>
          <div
            style={{
              display: "inline-flex",
              padding: "6px 14px",
              borderRadius: 20,
              background: `${DS.pink}15`,
              border: `1px solid ${DS.pink}30`,
              color: DS.pinkLight,
              fontSize: "0.6875rem",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.1em",
              marginBottom: "1.5rem",
            }}
          >
            TẠI SAO CHỌN CHÚNG TÔI
          </div>
          <h1
            style={{
              color: DS.text,
              fontFamily: DS.heading,
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: "1rem",
              background: `linear-gradient(135deg, #fff 0%, ${DS.cosmicPurple} 40%, ${DS.pink} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Tại sao chọn LOOP?
          </h1>
          <p style={{ color: DS.text3, fontSize: "1.0625rem", lineHeight: 1.6, maxWidth: 560, margin: "0 auto" }}>
            Chúng tôi không chỉ xây dựng website — chúng tôi kiến tạo hệ thống tăng trưởng bền vững cho doanh nghiệp của bạn.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "3rem 1.5rem",
        }}
      >
        <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: "1.25rem", marginBottom: "1.5rem", textAlign: "center" }}>
          Con số ấn tượng
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {[
            { value: "50+", label: "Dự án đã hoàn thành", color: DS.pink },
            { value: "200+", label: "Khách hàng hài lòng", color: DS.cosmicPurple },
            { value: "27+", label: "Thành viên", color: DS.cosmicBlue },
            { value: "10M+", label: "LP đã trao thưởng", color: DS.gold },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              style={{
                padding: "1.5rem",
                borderRadius: "1.25rem",
                background: `${stat.color}0D`,
                border: `1px solid ${stat.color}25`,
                textAlign: "center",
                boxShadow: `0 0 20px ${stat.color}10`,
              }}
            >
              <div
                style={{
                  color: stat.color,
                  fontSize: "2.25rem",
                  fontWeight: 900,
                  fontFamily: DS.heading,
                  marginBottom: "0.375rem",
                }}
              >
                {stat.value}
              </div>
              <div style={{ color: DS.text3, fontSize: "0.8125rem" }}>{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Comparison table */}
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "0 1.5rem 3rem",
        }}
      >
        <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: "1.25rem", marginBottom: "1.5rem", textAlign: "center" }}>
          LOOP vs Đối thủ khác
        </h2>
        <div
          style={{
            borderRadius: "1.25rem",
            background: "rgba(15,23,42,0.65)",
            border: `1px solid ${DS.border}`,
            overflow: "hidden",
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 120px 120px 120px",
              padding: "0.875rem 1.5rem",
              borderBottom: `1px solid ${DS.border}`,
              background: "rgba(30,40,60,0.3)",
            }}
          >
            {["", "LOOP", "Agency truyền thống", "Freelancer"].map((h) => (
              <div
                key={h}
                style={{
                  textAlign: "center",
                  fontSize: "0.6875rem",
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.1em",
                  fontWeight: h === "LOOP" ? 700 : 400,
                  color: h === "LOOP" ? DS.pink : DS.text4,
                }}
              >
                {h}
              </div>
            ))}
          </div>
          {COMPARISON.map((row, i) => (
            <div
              key={row.feature}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 120px 120px 120px",
                padding: "0.875rem 1.5rem",
                borderBottom: i < COMPARISON.length - 1 ? `1px solid ${DS.border}30` : "none",
                alignItems: "center",
              }}
            >
              <div style={{ color: DS.text2, fontSize: "0.875rem" }}>{row.feature}</div>
              {[
                row.loop,
                row.agency,
                row.freelancer,
              ].map((val, j) => (
                <div key={j} style={{ textAlign: "center" }}>
                  {val === true ? (
                    <CheckIcon color={j === 0 ? DS.pink : DS.green} />
                  ) : val === "partial" ? (
                    <PartialIcon />
                  ) : (
                    <CrossIcon />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Process */}
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "0 1.5rem 3rem",
        }}
      >
        <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: "1.25rem", marginBottom: "1.5rem", textAlign: "center" }}>
          Quy trình 6 bước
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "1rem",
          }}
        >
          {PROCESS_STEPS.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              style={{
                padding: "1.25rem",
                borderRadius: "1rem",
                background: `${step.color}08`,
                border: `1px solid ${step.color}25`,
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "0.875rem",
                  right: "0.875rem",
                  color: step.color,
                  fontSize: "0.5625rem",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                }}
              >
                {step.step}
              </div>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: `${step.color}15`,
                  border: `1px solid ${step.color}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: step.color,
                  marginBottom: "0.75rem",
                }}
              >
                {step.icon}
              </div>
              <div style={{ color: DS.text, fontWeight: 700, fontSize: "0.9375rem", marginBottom: "0.375rem" }}>
                {step.title}
              </div>
              <div style={{ color: DS.text3, fontSize: "0.8125rem", lineHeight: 1.5 }}>
                {step.desc}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tech stack */}
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "0 1.5rem 3rem",
        }}
      >
        <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: "1.25rem", marginBottom: "1.5rem", textAlign: "center" }}>
          Công nghệ chúng tôi sử dụng
        </h2>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            justifyContent: "center",
          }}
        >
          {TECH_STACK.map((tech) => (
            <div
              key={tech.name}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "2rem",
                background: `${tech.color}12`,
                border: `1px solid ${tech.color}30`,
                color: tech.color,
                fontSize: "0.8125rem",
                fontWeight: 600,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {tech.name}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "3rem 1.5rem 5rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            padding: "2.5rem",
            borderRadius: "1.5rem",
            background: GRD.cosmicBg2,
            border: `1px solid ${DS.border}`,
            boxShadow: "0 0 40px rgba(236,72,153,0.1)",
          }}
        >
          <h2 style={{ color: DS.text, fontFamily: DS.heading, fontSize: "1.375rem", marginBottom: "0.75rem" }}>
            Sẵn sàng bắt đầu dự án?
          </h2>
          <p style={{ color: DS.text3, fontSize: "0.9375rem", marginBottom: "1.5rem" }}>
            Đặt lịch tư vấn miễn phí 30 phút với chuyên gia LOOP.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href={`/${locale}/consultation`}
              style={{
                padding: "0.75rem 1.75rem",
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
              Đặt lịch tư vấn
              <ArrowRight size={16} />
            </a>
            <a
              href={`/${locale}/dat-lich`}
              style={{
                padding: "0.75rem 1.75rem",
                borderRadius: "1rem",
                background: "rgba(30,40,60,0.6)",
                border: `1px solid ${DS.border}`,
                color: DS.text3,
                fontWeight: 600,
                fontSize: "0.9375rem",
                textDecoration: "none",
              }}
            >
              Nhận báo giá
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
