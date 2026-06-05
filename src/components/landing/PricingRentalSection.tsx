"use client";

import { useState, useRef, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { Check, ArrowUpRight } from "lucide-react";

interface Plan {
  id: string;
  code: string;
  tier: string;
  title: string;
  tagline: string;
  setup: string;
  monthly: string;
  features: string[];
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "w-01",
    code: "W-01",
    tier: "STARTER",
    title: "GÓI WEB\nLANDING PAGE",
    tagline: "Gói khởi đầu cho doanh nghiệp mới",
    setup: "0đ KHỞI TẠO · MIỄN PHÍ",
    monthly: "189.000đ",
    features: [
      "Landing Page 1 trang",
      "Responsive Mobile",
      "SSL Security",
      "Hosting Included",
    ],
  },
  {
    id: "w-02",
    code: "W-02",
    tier: "GROWTH",
    title: "GÓI WEB\nLANDING PAGE",
    tagline: "Tối ưu cho tăng trưởng nhanh",
    setup: "0đ KHỞI TẠO · MIỄN PHÍ",
    monthly: "589.000đ",
    features: [
      "Premium Landing Page",
      "Faster Performance",
      "Contact Form",
      "SEO Ready",
    ],
    popular: true,
  },
  {
    id: "w-03",
    code: "W-03",
    tier: "PRO",
    title: "GÓI WEB\nLANDING PAGE",
    tagline: "Chuyên nghiệp & toàn diện",
    setup: "0đ KHỞI TẠO · MIỄN PHÍ",
    monthly: "889.000đ",
    features: [
      "Multi Section Layout",
      "Analytics Dashboard",
      "Marketing Ready",
      "Priority Support",
    ],
  },
  {
    id: "w-04",
    code: "W-04",
    tier: "ENTERPRISE",
    title: "GÓI WEB\nLANDING PAGE",
    tagline: "Giải pháp cấp doanh nghiệp",
    setup: "0đ KHỞI TẠO · MIỄN PHÍ",
    monthly: "1.189.000đ",
    features: [
      "Premium Business Layout",
      "Advanced SEO",
      "CRM Ready",
      "VIP Support 24/7",
    ],
  },
];

function TiltCard({ plan }: { plan: Plan }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [isHovered, setIsHovered] = useState(false);

  const springConfig = { stiffness: 180, damping: 22 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], ["8deg", "-8deg"]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], ["-8deg", "8deg"]), springConfig);
  const shadowX = useSpring(useTransform(x, [-0.5, 0.5], [14, -14]), springConfig);
  const shadowY = useSpring(useTransform(y, [-0.5, 0.5], [-14, 14]), springConfig);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect) return;
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      x.set(px);
      y.set(py);
    },
    [x, y]
  );

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  }, [x, y]);

  const isPopular = plan.popular;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.65, ease: "easeOut" }}
      style={{ perspective: 900, perspectiveOrigin: "center", position: "relative" }}
    >
      {/* Dynamic 3D Glowing Shadow on Hover */}
      <motion.div
        style={{
          position: "absolute",
          inset: 8,
          borderRadius: 24,
          background: isPopular ? "rgba(45, 107, 255, 0.25)" : "rgba(15, 23, 42, 0.15)",
          zIndex: 0,
          rotateX,
          rotateY,
          translateX: shadowX,
          translateY: shadowY,
          opacity: isHovered ? 0.24 : 0,
          filter: "blur(8px)",
          transition: "opacity 0.3s ease",
        }}
      />

      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          position: "relative",
          zIndex: 1,
          borderRadius: 24,
          background: "#FFFFFF",
          boxShadow: isHovered
            ? "0 8px 40px rgba(45,107,255,0.22)"
            : "0 4px 32px rgba(45,107,255,0.06), 0 1px 6px rgba(0,0,0,0.04)",
          border: isHovered ? "1.5px solid #2D6BFF" : "1.5px solid #E8ECF4",
          overflow: "hidden",
          padding: "32px 28px 36px",
          display: "flex",
          flexDirection: "column",
          transition: "box-shadow 0.3s ease, border-color 0.3s ease, transform 0.2s ease-out",
        }}
        className="relative cursor-pointer"
      >
        {/* Radial highlight gloss on hover */}
        {isHovered && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(ellipse at 35% 25%, rgba(255,255,255,0.7) 0%, transparent 55%)",
              pointerEvents: "none",
              borderRadius: 24,
              zIndex: 2,
            }}
          />
        )}

        {/* Top colored accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: isPopular ? 4 : 2,
            background: isPopular ? "linear-gradient(90deg, #2D6BFF, #60A5FA)" : "#E8ECF4",
            zIndex: 3,
          }}
        />

        {/* Popular radial lighting overlay */}
        {isPopular && (
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 200,
              height: 200,
              background: "radial-gradient(circle at top right, #EEF3FF 0%, transparent 65%)",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
        )}

        {/* Badge */}
        {isPopular && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 260 }}
            style={{
              position: "absolute",
              top: 22,
              right: 22,
              backgroundColor: "#2D6BFF",
              color: "#FFFFFF",
              fontSize: 10,
              letterSpacing: "0.12em",
              padding: "5px 13px",
              borderRadius: 100,
              fontWeight: 700,
              boxShadow: "0 4px 14px rgba(45,107,255,0.4)",
              zIndex: 4,
            }}
          >
            PHỔ BIẾN
          </motion.div>
        )}

        {/* Monospace code label (e.g. W-01) */}
        <div
          style={{
            fontFamily: "'SF Mono', 'Fira Code', monospace",
            fontSize: 10,
            color: "#BDC3D8",
            letterSpacing: "0.22em",
            marginBottom: 22,
            zIndex: 2,
          }}
        >
          {plan.code}
        </div>

        {/* Tier name */}
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.22em",
            color: isPopular ? "#2D6BFF" : "#B0B8CC",
            marginBottom: 5,
            fontFamily: "var(--lp2-font-sans), sans-serif",
            zIndex: 2,
          }}
        >
          {plan.tier}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#1B1B1D",
            letterSpacing: "0.02em",
            lineHeight: 1.35,
            marginBottom: 4,
            whiteSpace: "pre-line",
            fontFamily: "var(--lp2-font-sans), sans-serif",
            zIndex: 2,
          }}
        >
          {plan.title}
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 11.5,
            color: "#9EA8BE",
            marginBottom: 24,
            fontFamily: "var(--lp2-font-sans), sans-serif",
            zIndex: 2,
          }}
        >
          {plan.tagline}
        </div>

        {/* Free/setup badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "#EEF3FF",
            border: "1px solid rgba(45,107,255,0.18)",
            borderRadius: 8,
            padding: "5px 11px",
            marginBottom: 14,
            alignSelf: "flex-start",
            zIndex: 2,
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: "#2D6BFF",
              fontWeight: 700,
              letterSpacing: "0.06em",
              fontFamily: "var(--lp2-font-sans), sans-serif",
            }}
          >
            {plan.setup}
          </span>
        </div>

        {/* Price */}
        <div
          style={{
            marginBottom: 26,
            fontFamily: "var(--lp2-font-sans), sans-serif",
            zIndex: 2,
          }}
        >
          <span
            style={{
              fontSize: 38,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              color: isPopular ? "#2D6BFF" : "#1B1B1D",
              lineHeight: 1,
            }}
          >
            {plan.monthly}
          </span>
          <span
            style={{
              fontSize: 13,
              color: "#B0B8CC",
              marginLeft: 5,
            }}
          >
            / tháng
          </span>
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: isPopular
              ? "linear-gradient(90deg, rgba(45,107,255,0.25), transparent)"
              : "#EEF0F5",
            marginBottom: 20,
            zIndex: 2,
          }}
        />

        {/* Features list */}
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: 11,
            marginBottom: 28,
            flex: 1,
            zIndex: 2,
          }}
        >
          {plan.features.map((f, i) => (
            <li key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: isPopular ? "#EEF3FF" : "#F4F6FA",
                  border: `1px solid ${isPopular ? "rgba(45,107,255,0.25)" : "#E4E8F0"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Check size={9} color={isPopular ? "#2D6BFF" : "#94A3B8"} strokeWidth={3} />
              </div>
              <span
                style={{
                  fontSize: 12.5,
                  color: "#5C657A",
                  fontFamily: "var(--lp2-font-sans), sans-serif",
                }}
              >
                {f}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <a
          href="/dat-lich"
          className="block w-full text-center py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer"
          style={{
            background: isPopular ? "#2D6BFF" : "#F4F6FA",
            color: isPopular ? "#FFFFFF" : "#5C657A",
            boxShadow: isPopular ? "0 8px 24px rgba(45,107,255,0.32)" : "none",
            fontFamily: "var(--lp2-font-sans), sans-serif",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            zIndex: 2,
          }}
          onMouseEnter={(e) => {
            if (!isPopular) {
              e.currentTarget.style.background = "#EFF6FF";
              e.currentTarget.style.color = "#2D6BFF";
            } else {
              e.currentTarget.style.background = "#1E5AEE";
            }
          }}
          onMouseLeave={(e) => {
            if (!isPopular) {
              e.currentTarget.style.background = "#F4F6FA";
              e.currentTarget.style.color = "#5C657A";
            } else {
              e.currentTarget.style.background = "#2D6BFF";
            }
          }}
        >
          <span>Chọn gói này</span>
          <ArrowUpRight size={14} color={isPopular ? "#FFFFFF" : "#94A3B8"} strokeWidth={2.5} />
        </a>
      </motion.div>
    </motion.div>
  );
}

export function PricingRentalSection() {
  return (
    <section
      className="relative py-24 px-4 overflow-hidden"
      style={{ background: "#F8FAFC", fontFamily: "var(--lp2-font-sans), sans-serif" }}
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #CBD5E1 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.4,
          zIndex: 0,
        }}
      />

      {/* Blue Ambient Glow in background */}
      <div
        style={{
          position: "absolute",
          top: -160,
          left: "50%",
          transform: "translateX(-50%)",
          width: 700,
          height: 340,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(45, 107, 255, 0.12) 0%, transparent 68%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Header */}
      <div className="relative max-w-6xl mx-auto text-center mb-16" style={{ zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Pill Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wider mb-6"
            style={{
              background: "rgba(45,107,255,0.08)",
              color: "#2D6BFF",
              border: "1px solid rgba(45,107,255,0.15)",
              fontFamily: "var(--lp2-font-sans), sans-serif",
            }}
          >
            <span>⚡</span>
            <span>DIGITAL SERVICE CATALOG</span>
            <span>•</span>
            <span>WEBSITE RENTAL PACKAGES</span>
          </div>

          {/* Heading */}
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4"
            style={{
              fontFamily: "var(--lp2-font-display), var(--lp2-font-sans), sans-serif",
              color: "#1E293B",
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
            }}
          >
            BẢNG GIÁ <span style={{ color: "#2D6BFF" }}>THUÊ WEBSITE</span>
          </h2>

          {/* Subtitle */}
          <p
            className="text-base max-w-2xl mx-auto"
            style={{
              color: "#64748B",
              fontFamily: "var(--lp2-font-sans), sans-serif",
              lineHeight: 1.65,
            }}
          >
            Giải pháp website chuyên nghiệp dành cho doanh nghiệp hiện đại.
            <br />
            Khởi tạo miễn phí — Thanh toán linh hoạt theo tháng.
          </p>
        </motion.div>
      </div>

      {/* Cards grid */}
      <div className="relative max-w-6xl mx-auto" style={{ zIndex: 1 }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <TiltCard key={plan.id} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
}
