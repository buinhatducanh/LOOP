"use client";

import type { LucideProps } from "lucide-react";
import {
  GitBranch,
  LayoutDashboard,
  Server,
  BarChart3,
  ShieldCheck,
  FileText,
  Globe,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";
import type { DeploymentHandoff } from "@/data/pricingPackages";

interface DeploymentHandoffSectionProps {
  items: DeploymentHandoff[];
  locale: string;
}

const iconMap: Record<string, React.ComponentType<Omit<LucideProps, "ref">>> = {
  GitBranch,
  LayoutDashboard,
  Server,
  BarChart3,
  ShieldCheck,
  FileText,
  Globe,
  GraduationCap,
  AlertTriangle,
};

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div className="animate-fade-in" style={{ animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}

export function DeploymentHandoffSection({
  items,
  locale,
}: DeploymentHandoffSectionProps) {
  const isVi = locale === "vi";
  const includedItems = items.filter((item) => item.handedToClient);
  const excludedItems = items.filter((item) => !item.handedToClient);

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
      {/* Included items grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        {includedItems.map((item, i) => {
          const IconComponent = iconMap[item.icon] || FileText;
          return (
            <FadeIn key={item.id} delay={i * 0.06}>
              <div
                style={{
                  background: "#0F172A",
                  border: "1px solid #1F2937",
                  borderRadius: "14px",
                  padding: "24px",
                  display: "flex",
                  gap: "16px",
                  transition: "all 0.2s ease",
                  height: "100%",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#374151";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#1F2937";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "rgba(59,130,246,0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <IconComponent size={20} color="#3B82F6" />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "6px",
                    }}
                  >
                    <h4
                      style={{
                        color: "#FFFFFF",
                        fontSize: "15px",
                        fontWeight: 600,
                      }}
                    >
                      {isVi ? item.titleVi : item.title}
                    </h4>
                    <CheckCircle2 size={14} color="#22C55E" />
                  </div>
                  <p
                    style={{
                      color: "#94A3B8",
                      fontSize: "13px",
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    {isVi ? item.descriptionVi : item.description}
                  </p>
                </div>
              </div>
            </FadeIn>
          );
        })}
      </div>

      {/* Excluded items callout */}
      {excludedItems.map((item) => (
        <FadeIn key={item.id} delay={0.5}>
          <div
            style={{
              background: "rgba(245,158,11,0.06)",
              border: "1px solid rgba(245,158,11,0.25)",
              borderRadius: "14px",
              padding: "24px 28px",
              display: "flex",
              gap: "16px",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "rgba(245,158,11,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={20} color="#F59E0B" />
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <h4
                  style={{
                    color: "#F59E0B",
                    fontSize: "15px",
                    fontWeight: 700,
                  }}
                >
                  {isVi ? item.titleVi : item.title}
                </h4>
                <XCircle size={14} color="#EF4444" />
              </div>
              <p
                style={{
                  color: "#CBD5E1",
                  fontSize: "14px",
                  lineHeight: 1.6,
                  margin: 0,
                  marginBottom: item.note ? "12px" : 0,
                }}
              >
                {isVi ? item.descriptionVi : item.description}
              </p>
              {item.note && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    background: "rgba(245,158,11,0.08)",
                    borderRadius: "8px",
                    padding: "12px 14px",
                  }}
                >
                  <Info size={14} color="#F59E0B" style={{ marginTop: "2px", flexShrink: 0 }} />
                  <span
                    style={{
                      color: "#94A3B8",
                      fontSize: "13px",
                      lineHeight: 1.5,
                    }}
                  >
                    {isVi ? item.noteVi : item.note}
                  </span>
                </div>
              )}
            </div>
          </div>
        </FadeIn>
      ))}
    </div>
  );
}
