"use client";

/**
 * ProjectTrackerTab — Customer portal tab showing order progress timeline
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import {
  Brush, Code, FlaskConical, Rocket, Package,
  ExternalLink, Calendar, CheckCircle2, Clock,
  MessageSquare, Users,
} from "lucide-react";
import { DS, GRD } from "@/lib/design-tokens";
import { apiClient } from "@/lib/api/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProjectMember {
  id: string;
  member: {
    id: string;
    name: string;
    rank: string;
    level: number;
    avatar: string | null;
  };
  projectRole: { key: string; label: string };
}

interface FigmaDemo {
  id: string;
  title: string;
  figmaUrl: string;
  status: string;
  sentAt: string | null;
  approvedAt: string | null;
  versionHash: string | null;
  rejectionNote: string | null;
}

interface HandoverPackage {
  id: string;
  scope: string | null;
  figmaUrl: string | null;
  projectUrl: string | null;
  gitRepoUrl: string | null;
  docs: string | null;
}

interface TrackedOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number | null;
  createdAt: string;
  updatedAt: string | null;
  gitRepoUrl: string | null;
  package: { title: string } | null;
  figmaDemos: FigmaDemo[];
  handoverPackages: HandoverPackage[];
  projectMembers: ProjectMember[];
  statusHistory: Array<{
    fromStatus: string;
    toStatus: string;
    note: string | null;
    createdAt: string;
  }>;
}

// ── Phase config ────────────────────────────────────────────────────────────────

type PhaseId = "design" | "dev" | "qa" | "deploy" | "handover";

interface PhaseConfig {
  id: PhaseId;
  icon: React.ReactNode;
  color: string;
  glowColor: string;
}

const PHASES: PhaseConfig[] = [
  { id: "design", icon: <Brush size={16} />, color: "#A78BFA", glowColor: "rgba(167,139,250,0.4)" },
  { id: "dev", icon: <Code size={16} />, color: "#60A5FA", glowColor: "rgba(96,165,250,0.4)" },
  { id: "qa", icon: <FlaskConical size={16} />, color: "#34D399", glowColor: "rgba(52,211,153,0.4)" },
  { id: "deploy", icon: <Rocket size={16} />, color: "#F472B6", glowColor: "rgba(244,114,182,0.4)" },
  { id: "handover", icon: <Package size={16} />, color: "#E6C75F", glowColor: "rgba(230,199,95,0.4)" },
];

// ── Status → phase mapping ─────────────────────────────────────────────────────

function getActivePhase(status: string): PhaseId | null {
  if (status === "pending_payment" || status === "paid") return null;
  if (status === "in_progress") return "design"; // design phase while in_progress + FigmaDemo
  if (status === "demo_ready") return "deploy";
  if (status === "client_review") return "qa";
  if (status === "done") return "handover";
  if (status === "cancelled") return null;
  return null;
}

function getPhaseStatus(
  phaseId: PhaseId,
  orderStatus: string,
  activePhase: PhaseId | null
): "completed" | "active" | "pending" {
  if (orderStatus === "cancelled") return "pending";
  if (orderStatus === "done" && phaseId !== "handover") return "completed";
  if (phaseId === "handover" && orderStatus === "done") return "completed";
  if (activePhase === null) return "pending";
  const phaseOrder: PhaseId[] = ["design", "dev", "qa", "deploy", "handover"];
  const activeIdx = phaseOrder.indexOf(activePhase);
  const phaseIdx = phaseOrder.indexOf(phaseId);
  if (phaseIdx < activeIdx) return "completed";
  if (phaseIdx === activeIdx) return "active";
  return "pending";
}

// ── Phase card ─────────────────────────────────────────────────────────────────

function PhaseCard({
  phase,
  status,
  label,
  completedAt,
  details,
  locale,
}: {
  phase: PhaseConfig;
  status: "completed" | "active" | "pending";
  label: string;
  completedAt?: string;
  details?: React.ReactNode;
  locale: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
      {/* Icon node */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: status === "active"
            ? `linear-gradient(135deg, ${phase.color}30, ${phase.color}10)`
            : status === "completed"
            ? GRD.primary
            : "rgba(30,40,60,0.6)",
          border: status === "active"
            ? `2px solid ${phase.color}`
            : status === "completed"
            ? "2px solid transparent"
            : `2px solid ${DS.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: status === "pending" ? DS.text4 : "#fff",
          boxShadow: status === "active" ? `0 0 16px ${phase.glowColor}` : "none",
          position: "relative",
          zIndex: 1,
        }}
      >
        {status === "completed" ? (
          <CheckCircle2 size={20} style={{ color: "#fff" }} />
        ) : (
          phase.icon
        )}
      </motion.div>
      {/* Label */}
      <div
        style={{
          color: status === "active" ? phase.color : status === "completed" ? DS.text2 : DS.text4,
          fontSize: "0.6875rem",
          fontWeight: status === "active" ? 700 : 500,
          marginTop: "0.375rem",
          textAlign: "center",
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </div>
      {/* Date */}
      {completedAt && status === "completed" && (
        <div style={{ color: DS.text4, fontSize: "0.5625rem", marginTop: "0.125rem", fontFamily: "'JetBrains Mono', monospace" }}>
          {new Date(completedAt).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
            day: "2-digit", month: "short",
          })}
        </div>
      )}
      {/* Connector line */}
      <div
        style={{
          flex: 1,
          width: 2,
          background: status !== "pending" ? PHASES.find(p => p.id === phase.id)!.color + "40" : DS.border,
          marginTop: "0.375rem",
          borderRadius: 1,
          opacity: 0.5,
        }}
      />
      {/* Details (active phase only) */}
      {status === "active" && details && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            marginTop: "0.5rem",
            padding: "0.625rem",
            borderRadius: "0.5rem",
            background: `${phase.color}0D`,
            border: `1px solid ${phase.color}25`,
            width: "100%",
          }}
        >
          {details}
        </motion.div>
      )}
    </div>
  );
}

// ── Order card ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending_payment: { label: "Chờ thanh toán", color: "#F59E0B" },
  paid: { label: "Đã thanh toán", color: "#3B82F6" },
  in_progress: { label: "Đang thực hiện", color: "#8B5CF6" },
  demo_ready: { label: "Demo sẵn sàng", color: "#06B6D4" },
  client_review: { label: "Khách review", color: "#F59E0B" },
  done: { label: "Hoàn thành", color: "#10B981" },
  cancelled: { label: "Đã hủy", color: "#EF4444" },
};

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: "Toàn thời gian",
  part_time: "Bán thời gian",
  contract: "Hợp đồng",
  internship: "Thực tập",
};

function OrderCard({ order, locale }: { order: TrackedOrder; locale: string }) {
  const t = useTranslations("ProjectTrackerPage");
  const activePhase = getActivePhase(order.status);
  const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending_payment;
  const latestDemo = order.figmaDemos[0] ?? null;
  const handover = order.handoverPackages[0] ?? null;
  const pm = order.projectMembers.find((pm) => pm.projectRole.key === "pm")?.member;
  const hasFigma = !!latestDemo?.figmaUrl;

  const phaseLabels: Record<PhaseId, string> = {
    design: t("designPhase"),
    dev: t("devPhase"),
    qa: t("qaPhase"),
    deploy: t("deployPhase"),
    handover: t("handoverPhase"),
  };

  // Find completion date for each completed phase from statusHistory
  function getPhaseCompletionDate(phaseId: PhaseId): string | undefined {
    // For now, use the last statusHistory entry where toStatus indicates that phase
    return undefined;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        borderRadius: "1.25rem",
        background: "rgba(15,23,42,0.65)",
        border: `1px solid ${DS.border}`,
        padding: "1.5rem",
        marginBottom: "1.25rem",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1.25rem",
        }}
      >
        <div>
          <div
            style={{
              color: DS.text,
              fontWeight: 800,
              fontSize: "1rem",
              fontFamily: DS.heading,
              marginBottom: "0.25rem",
            }}
          >
            {order.package?.title ?? "Dự án LOOP"}
          </div>
          <div
            style={{
              color: DS.text4,
              fontSize: "0.625rem",
              fontFamily: "'JetBrains Mono', monospace",
              display: "flex",
              gap: "0.75rem",
            }}
          >
            <span>#{order.orderNumber}</span>
            <span>{new Date(order.createdAt).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US")}</span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            color: statusCfg.color,
            background: `${statusCfg.color}15`,
            padding: "4px 10px",
            borderRadius: 20,
            fontSize: "0.6875rem",
            fontWeight: 600,
            border: `1px solid ${statusCfg.color}30`,
          }}
        >
          {order.status === "done" ? <CheckCircle2 size={12} /> : <Clock size={12} />}
          {statusCfg.label}
        </div>
      </div>

      {/* Timeline phases */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
        {PHASES.map((phase) => (
          <PhaseCard
            key={phase.id}
            phase={phase}
            status={getPhaseStatus(phase.id, order.status, activePhase)}
            label={phaseLabels[phase.id]}
            completedAt={getPhaseCompletionDate(phase.id)}
            locale={locale}
            details={
              phase.id === "design" && hasFigma ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div style={{ color: DS.text3, fontSize: "0.75rem", fontWeight: 600 }}>{latestDemo.title}</div>
                  <a
                    href={`https://www.figma.com/embed?embed_host=loops&url=${encodeURIComponent(latestDemo.figmaUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem",
                      color: DS.cosmicPurple,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    <ExternalLink size={11} />
                    {t("viewFigma")}
                    {latestDemo.versionHash && (
                      <span style={{ color: DS.text4, marginLeft: "0.25rem" }}>v{latestDemo.versionHash}</span>
                    )}
                  </a>
                </div>
              ) : phase.id === "dev" && order.gitRepoUrl ? (
                <a
                  href={order.gitRepoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    color: DS.cosmicBlue,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  <ExternalLink size={11} />
                  {t("viewRepo")}
                </a>
              ) : phase.id === "deploy" && latestDemo ? (
                <a
                  href={`https://www.figma.com/embed?embed_host=loops&url=${encodeURIComponent(latestDemo.figmaUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    color: DS.pink,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  <ExternalLink size={11} />
                  {t("viewFigma")}
                </a>
              ) : undefined
            }
          />
        ))}
      </div>

      {/* Figma + Handover */}
      {(latestDemo || handover) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: latestDemo && handover ? "1fr 1fr" : "1fr",
            gap: "0.75rem",
            marginBottom: "1rem",
          }}
        >
          {latestDemo && (
            <div
              style={{
                padding: "0.875rem",
                borderRadius: "0.75rem",
                background: `${DS.cosmicPurple}0D`,
                border: `1px solid ${DS.cosmicPurple}20`,
              }}
            >
              <div style={{ color: DS.text4, fontSize: "0.5625rem", fontFamily: "'JetBrains Mono', monospace", marginBottom: "0.375rem" }}>
                FIGMA DEMO
              </div>
              <div style={{ color: DS.text3, fontSize: "0.8125rem", marginBottom: "0.5rem" }}>
                {latestDemo.title}
              </div>
              <a
                href={`https://www.figma.com/embed?embed_host=loops&url=${encodeURIComponent(latestDemo.figmaUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0.375rem 0.75rem",
                  borderRadius: "0.5rem",
                  background: `rgba(107,61,245,0.12)`,
                  color: DS.cosmicPurple,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  border: `1px solid rgba(107,61,245,0.3)`,
                }}
              >
                <ExternalLink size={12} />
                {t("viewFigma")}
              </a>
            </div>
          )}
          {handover && (
            <div
              style={{
                padding: "0.875rem",
                borderRadius: "0.75rem",
                background: `${DS.gold}0D`,
                border: `1px solid ${DS.gold}20`,
              }}
            >
              <div style={{ color: DS.text4, fontSize: "0.5625rem", fontFamily: "'JetBrains Mono', monospace", marginBottom: "0.375rem" }}>
                BÀN GIAO
              </div>
              {handover.scope && (
                <div style={{ color: DS.text3, fontSize: "0.8125rem", marginBottom: "0.5rem" }}>
                  {handover.scope}
                </div>
              )}
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {handover.figmaUrl && (
                  <a
                    href={`https://www.figma.com/embed?embed_host=loops&url=${encodeURIComponent(handover.figmaUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      padding: "0.375rem 0.75rem",
                      borderRadius: "0.5rem",
                      background: `rgba(230,199,95,0.1)`,
                      color: DS.gold,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textDecoration: "none",
                      border: `1px solid rgba(230,199,95,0.25)`,
                    }}
                  >
                    <ExternalLink size={11} />
                    Figma
                  </a>
                )}
                {handover.projectUrl && (
                  <a
                    href={handover.projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      padding: "0.375rem 0.75rem",
                      borderRadius: "0.5rem",
                      background: `rgba(59,130,246,0.1)`,
                      color: DS.cosmicBlue,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textDecoration: "none",
                      border: `1px solid rgba(59,130,246,0.25)`,
                    }}
                  >
                    <ExternalLink size={11} />
                    Website
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Team */}
      {order.projectMembers.length > 0 && (
        <div>
          <div
            style={{
              color: DS.text4,
              fontSize: "0.5625rem",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.1em",
              marginBottom: "0.625rem",
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
            }}
          >
            <Users size={10} />
            {t("assignedTeam").toUpperCase()}
          </div>
          <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
            {order.projectMembers.map((pm) => (
              <div
                key={pm.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.375rem 0.625rem",
                  borderRadius: "2rem",
                  background: "rgba(30,40,60,0.6)",
                  border: `1px solid ${DS.border}`,
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: GRD.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "0.5625rem",
                    fontWeight: 700,
                    overflow: "hidden",
                  }}
                >
                  {pm.member.avatar ? (
                    <img src={pm.member.avatar} alt={pm.member.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    pm.member.name[0]
                  )}
                </div>
                <div>
                  <div style={{ color: DS.text2, fontSize: "0.6875rem", fontWeight: 600 }}>
                    {pm.member.name}
                  </div>
                  <div style={{ color: DS.text4, fontSize: "0.5625rem", fontFamily: "'JetBrains Mono', monospace" }}>
                    {pm.projectRole.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────────

export function ProjectTrackerTab({
  orders,
  locale,
}: {
  orders: TrackedOrder[];
  locale: string;
}) {
  const t = useTranslations("ProjectTrackerPage");
  const router = useRouter();

  if (!orders || orders.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          textAlign: "center",
          padding: "4rem 2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>📋</div>
        <h3 style={{ color: DS.text, fontFamily: DS.heading, fontSize: "1.125rem" }}>
          {t("noProjects")}
        </h3>
        <p style={{ color: DS.text3, fontSize: "0.875rem", maxWidth: 360 }}>
          {t("heroDesc")}
        </p>
        <button
          onClick={() => router.push(`/${locale}/dat-lich`)}
          style={{
            padding: "0.75rem 2rem",
            borderRadius: "1rem",
            background: GRD.primary,
            color: "#fff",
            border: "none",
            fontWeight: 700,
            fontSize: "0.875rem",
            cursor: "pointer",
          }}
        >
          {t("startProject")}
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} locale={locale} />
      ))}
    </motion.div>
  );
}
