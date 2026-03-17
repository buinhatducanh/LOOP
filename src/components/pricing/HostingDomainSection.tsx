"use client";

import { Check, Server, Globe, AlertCircle } from "lucide-react";
import {
  type HostingPlan,
  type DomainPrice,
  formatVND,
} from "@/data/pricingPackages";

interface HostingDomainSectionProps {
  hostingPlans: HostingPlan[];
  domainPrices: DomainPrice[];
  locale: string;
}

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div className="animate-fade-in" style={{ animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}

function HostingCard({
  plan,
  locale,
  delay,
}: {
  plan: HostingPlan;
  locale: string;
  delay: number;
}) {
  const isVi = locale === "vi";
  const features = isVi ? plan.featuresVi : plan.features;

  return (
    <FadeIn delay={delay}>
      <div
        style={{
          background: plan.highlighted
            ? "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.15))"
            : "#0F172A",
          border: plan.highlighted
            ? "2px solid #6366F1"
            : "1px solid #1F2937",
          borderRadius: "16px",
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          position: "relative",
          transition: "all 0.3s ease",
          boxShadow: plan.highlighted
            ? "0 0 30px rgba(99, 102, 241, 0.15)"
            : "none",
          height: "100%",
        }}
        onMouseEnter={(e) => {
          if (!plan.highlighted) {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = plan.color;
            el.style.transform = "translateY(-4px)";
          }
        }}
        onMouseLeave={(e) => {
          if (!plan.highlighted) {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = "#1F2937";
            el.style.transform = "translateY(0)";
          }
        }}
      >
        <div>
          <h3
            style={{
              color: plan.highlighted ? "#FFFFFF" : "#94A3B8",
              fontSize: "13px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              marginBottom: "4px",
            }}
          >
            {isVi ? plan.nameVi : plan.name}
          </h3>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: "4px" }}>
          <span
            style={{
              fontSize: "clamp(24px, 3vw, 32px)",
              fontWeight: 800,
              color: "#FFFFFF",
              lineHeight: 1,
            }}
          >
            {formatVND(plan.price)}
          </span>
          <span
            style={{
              color: "#94A3B8",
              fontSize: "13px",
              marginBottom: "4px",
            }}
          >
            / {isVi ? plan.periodVi : plan.period}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {features.map((feature) => (
            <div
              key={feature}
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
            >
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  background: plan.highlighted
                    ? "linear-gradient(135deg, #3B82F6, #6366F1)"
                    : "rgba(59,130,246,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Check size={10} color="#FFFFFF" />
              </div>
              <span style={{ color: "#E2E8F0", fontSize: "13px" }}>
                {feature}
              </span>
            </div>
          ))}
        </div>
      </div>
    </FadeIn>
  );
}

export function HostingDomainSection({
  hostingPlans,
  domainPrices,
  locale,
}: HostingDomainSectionProps) {
  const isVi = locale === "vi";

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
      {/* Hosting Plans */}
      <FadeIn>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #3B82F6, #6366F1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Server size={18} color="#fff" />
          </div>
          <h3 style={{ fontSize: "24px", fontWeight: 700, color: "#FFFFFF" }}>
            {isVi ? "Gói Hosting" : "Hosting Plans"}
          </h3>
        </div>
      </FadeIn>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "20px",
          marginBottom: "60px",
        }}
      >
        {hostingPlans.map((plan, i) => (
          <HostingCard key={plan.id} plan={plan} locale={locale} delay={i * 0.1} />
        ))}
      </div>

      {/* Domain Pricing */}
      <FadeIn>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #8B5CF6, #06B6D4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Globe size={18} color="#fff" />
          </div>
          <h3 style={{ fontSize: "24px", fontWeight: 700, color: "#FFFFFF" }}>
            {isVi ? "Bảng Giá Tên Miền" : "Domain Pricing"}
          </h3>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div
          style={{
            borderRadius: "16px",
            border: "1px solid #1F2937",
            background: "#0F172A",
            overflow: "hidden",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    padding: "16px 24px",
                    textAlign: "left",
                    borderBottom: "1px solid #1F2937",
                    color: "#94A3B8",
                    fontSize: "12px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  {isVi ? "Tên miền" : "Domain"}
                </th>
                <th
                  style={{
                    padding: "16px 24px",
                    textAlign: "center",
                    borderBottom: "1px solid #1F2937",
                    color: "#94A3B8",
                    fontSize: "12px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  {isVi ? "Đăng ký" : "Registration"}
                </th>
                <th
                  style={{
                    padding: "16px 24px",
                    textAlign: "center",
                    borderBottom: "1px solid #1F2937",
                    color: "#94A3B8",
                    fontSize: "12px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  {isVi ? "Gia hạn" : "Renewal"}
                </th>
                <th
                  style={{
                    padding: "16px 24px",
                    textAlign: "center",
                    borderBottom: "1px solid #1F2937",
                    color: "#94A3B8",
                    fontSize: "12px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  {isVi ? "Ghi chú" : "Note"}
                </th>
              </tr>
            </thead>
            <tbody>
              {domainPrices.map((domain) => (
                <tr
                  key={domain.extension}
                  style={{ transition: "background 0.15s" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "rgba(255,255,255,0.02)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "transparent";
                  }}
                >
                  <td
                    style={{
                      padding: "16px 24px",
                      borderBottom: "1px solid rgba(31,41,55,0.5)",
                      color: "#FFFFFF",
                      fontSize: "15px",
                      fontWeight: 600,
                    }}
                  >
                    {domain.extension}
                  </td>
                  <td
                    style={{
                      padding: "16px 24px",
                      textAlign: "center",
                      borderBottom: "1px solid rgba(31,41,55,0.5)",
                      color: "#E2E8F0",
                      fontSize: "14px",
                    }}
                  >
                    {formatVND(domain.registrationPrice)}/{isVi ? domain.periodVi : domain.period}
                  </td>
                  <td
                    style={{
                      padding: "16px 24px",
                      textAlign: "center",
                      borderBottom: "1px solid rgba(31,41,55,0.5)",
                      color: "#E2E8F0",
                      fontSize: "14px",
                    }}
                  >
                    {formatVND(domain.renewalPrice)}/{isVi ? domain.periodVi : domain.period}
                  </td>
                  <td
                    style={{
                      padding: "16px 24px",
                      textAlign: "center",
                      borderBottom: "1px solid rgba(31,41,55,0.5)",
                    }}
                  >
                    {domain.note ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          color: "#F59E0B",
                          fontSize: "12px",
                          fontWeight: 500,
                        }}
                      >
                        <AlertCircle size={12} />
                        {isVi ? domain.noteVi : domain.note}
                      </span>
                    ) : (
                      <span style={{ color: "#4B5563", fontSize: "13px" }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FadeIn>
    </div>
  );
}
