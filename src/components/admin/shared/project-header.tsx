"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface ProjectInfo {
  id: string;
  orderNumber: string;
  customerName: string;
  companyName: string | null;
  area: string | null;
  projectStatus: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  active: "#10B981",
  paused: "#F59E0B",
  completed: "#6366F1",
  cancelled: "#EF4444",
};

const TABS = [
  { key: "board", label: "Kanban", href: "/board" },
  { key: "team", label: "Team LP", href: "/team" },
  { key: "backlogs", label: "Backlogs", href: "/backlogs" },
  { key: "commits", label: "Commits", href: "/commits" },
  { key: "lp", label: "LP Awards", href: "/lp" },
  { key: "standups", label: "Standups", href: "/standups" },
  { key: "qa", label: "QA", href: "/qa" },
  { key: "env", label: "Env", href: "/env" },
  { key: "deployments", label: "Deploy", href: "/deployments" },
  { key: "social", label: "Social", href: "/social" },
  { key: "blog", label: "Blog", href: "/blog" },
  { key: "handover", label: "Handover", href: "/handover" },
];

const AREA_LABELS: Record<string, string> = {
  can_tho: "Cần Thơ", an_giang: "An Giang", kien_giang: "Kiên Giang",
  dong_thap: "Đồng Tháp", long_an: "Long An", tien_giang: "Tiền Giang",
  vinh_long: "Vĩnh Long", ben_tre: "Bến Tre", tra_vinh: "Trà Vinh",
};

interface ProjectHeaderProps {
  orderId?: string;     // legacy name
  projectId?: string;   // alias for orderId (used by new PM APIs)
  className?: string;
}

export function ProjectHeader({ orderId, projectId, className = "" }: ProjectHeaderProps) {
  const id = orderId ?? projectId ?? "";
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/orders/${id}`)
      .then(r => r.json())
      .then(j => setProject(j.data))
      .catch(() => {});
  }, [id]);

  const activeTab = TABS.find(tab => pathname.endsWith(tab.href))?.key ?? "board";

  const statusColor = STATUS_COLORS[project?.projectStatus ?? ""] ?? "#6366F1";

  return (
    <div
      className={`rounded-xl border p-4 ${className}`}
      style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-lg font-bold text-white">
              {project?.customerName ?? "…"}
            </h1>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ background: "rgba(99,102,241,0.15)", color: "#818CF8" }}
            >
              {project?.orderNumber ?? "…"}
            </span>
            {project?.projectStatus && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ background: `${statusColor}22`, color: statusColor }}
              >
                {project.projectStatus}
              </span>
            )}
          </div>
          <p className="text-xs mt-1" style={{ color: "rgba(209,213,219,0.4)" }}>
            {[project?.companyName, project?.area ? AREA_LABELS[project.area] : null]
              .filter(Boolean)
              .join(" · ") || "Đang tải..."}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 flex-wrap">
          {TABS.map(tab => (
            <Link
              key={tab.key}
              href={`/admin/projects/${id}${tab.href}`}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
              style={
                activeTab === tab.key
                  ? { background: "rgba(139,92,246,0.2)", color: "#C4B5FD" }
                  : { color: "rgba(209,213,219,0.4)", background: "transparent" }
              }
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
