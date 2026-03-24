"use client";

import { useState, useEffect, useCallback } from "react";
import { ProjectHeader } from "@/components/admin/shared/project-header";

interface Props { params: Promise<{ id: string }>; }

interface Deployment {
  id: string; projectId: string; environment: string; platform: string;
  deployUrl: string | null; commitSha: string | null;
  status: string; gscVerified: boolean;
  deployedAt: string | null; deployedBy: string | null;
}

const STATUS_COLORS: Record<string, { bg: string; color: string; dot: string }> = {
  pending: { bg: "rgba(100,116,139,0.2)", color: "#94a3b8", dot: "#64748b" },
  running: { bg: "rgba(59,130,246,0.2)", color: "#60a5fa", dot: "#3B82F6" },
  success: { bg: "rgba(16,185,129,0.2)", color: "#10B981", dot: "#10B981" },
  failed: { bg: "rgba(239,68,68,0.2)", color: "#EF4444", dot: "#EF4444" },
};
const ENV_COLORS: Record<string, string> = {
  dev: "#64748b", staging: "#F59E0B", production: "#10B981",
};
const PLATFORM_LABELS: Record<string, string> = {
  vercel: "▲ Vercel", aws: "☁ AWS", gcp: "☁ GCP", manual: "⚙ Manual",
};

const VI_DATE = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
});

export default function DeploymentsPage({ params: paramsPromise }: Props) {
  const [projectId, setProjectId] = useState("");
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "dev" | "staging" | "production">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [form, setForm] = useState({ environment: "dev", platform: "manual", deployUrl: "" });

  useEffect(() => { paramsPromise.then(p => setProjectId(p.id)); }, [paramsPromise]);

  const fetchDeployments = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/deployments?projectId=${projectId}`);
      const json = await res.json();
      setDeployments(json.data ?? []);
    } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchDeployments(); }, [fetchDeployments]);

  const filtered = filter === "all"
    ? deployments
    : deployments.filter(d => d.environment === filter);

  const trigger = async (id: string) => {
    setTriggering(id);
    try {
      await fetch(`/api/admin/deployments/${id}/trigger`, { method: "POST" });
      fetchDeployments();
    } finally { setTriggering(null); }
  };

  const createDeployment = async () => {
    if (!projectId) return;
    await fetch("/api/admin/deployments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, ...form, status: "pending" }),
    });
    setCreateOpen(false);
    fetchDeployments();
  };

  const lastDeploy = deployments.find(d => d.status === "success");
  const envCounts = { dev: deployments.filter(d => d.environment === "dev").length, staging: deployments.filter(d => d.environment === "staging").length, production: deployments.filter(d => d.environment === "production").length };

  return (
    <div className="p-6">
      <ProjectHeader projectId={projectId} className="mb-6" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Deployments</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>
            Quản lý CI/CD & release history
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastDeploy?.deployUrl && (
            <a href={lastDeploy.deployUrl} target="_blank" rel="noopener noreferrer"
              className="rounded-lg border px-4 py-2 text-sm text-white border-green-500/30 hover:bg-green-500/10 transition-colors"
              style={{ color: "#10B981" }}>
              ↗ Live: {lastDeploy.environment}
            </a>
          )}
          <button onClick={() => setCreateOpen(true)}
            className="rounded-lg px-4 py-2 text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background: "#6366F1" }}>
            + Deploy
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {(["dev", "staging", "production"] as const).map(env => {
          const envDeploys = deployments.filter(d => d.environment === env);
          const success = envDeploys.filter(d => d.status === "success").length;
          const failed = envDeploys.filter(d => d.status === "failed").length;
          return (
            <div key={env} className="rounded-xl border p-4"
              style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ background: ENV_COLORS[env] }} />
                <span className="text-xs font-medium text-white uppercase">{env}</span>
              </div>
              <p className="text-2xl font-black" style={{ color: ENV_COLORS[env] }}>{success}</p>
              <p className="text-[10px] mt-1" style={{ color: "rgba(209,213,219,0.4)" }}>
                {failed > 0 ? `${failed} failed` : "all passing"}
              </p>
            </div>
          );
        })}
      </div>

      {/* Environment filter tabs */}
      <div className="flex gap-2 mb-4">
        {(["all", "dev", "staging", "production"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="rounded-lg border px-4 py-1.5 text-xs font-medium transition-all"
            style={{
              background: filter === f ? "rgba(99,102,241,0.15)" : "transparent",
              borderColor: filter === f ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.1)",
              color: filter === f ? "#fff" : "rgba(209,213,219,0.5)",
            }}>
            {f === "all" ? `Tất cả (${deployments.length})` : `${f} (${envCounts[f]})`}
          </button>
        ))}
      </div>

      {/* Deployment list */}
      {loading ? (
        <p className="text-center py-20" style={{ color: "rgba(209,213,219,0.3)" }}>Đang tải...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-xl border"
          style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-4xl mb-3">🚀</p>
          <p className="text-sm" style={{ color: "rgba(209,213,219,0.3)" }}>Chưa có deployment nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(deploy => {
            const colors = STATUS_COLORS[deploy.status] ?? STATUS_COLORS.pending;
            return (
              <div key={deploy.id}
                className="rounded-xl border p-4 flex items-center gap-4"
                style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}>
                {/* Status indicator */}
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: colors.dot }} />

                {/* Environment badge */}
                <span className="text-xs font-bold uppercase px-2 py-0.5 rounded shrink-0"
                  style={{ background: `${ENV_COLORS[deploy.environment]}20`, color: ENV_COLORS[deploy.environment] }}>
                  {deploy.environment}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{PLATFORM_LABELS[deploy.platform]}</span>
                    {deploy.gscVerified && (
                      <span className="text-[10px] rounded px-1.5 py-0.5"
                        style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}>
                        GSC ✓
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {deploy.commitSha && (
                      <code className="text-[10px] rounded px-1.5 py-0.5"
                        style={{ background: "rgba(255,255,255,0.05)", color: "rgba(139,92,246,0.8)" }}>
                        {deploy.commitSha.slice(0, 7)}
                      </code>
                    )}
                    {deploy.deployedAt && (
                      <span className="text-[10px]" style={{ color: "rgba(209,213,219,0.4)" }}>
                        {VI_DATE.format(new Date(deploy.deployedAt))}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status label */}
                <span className="text-xs font-medium px-2 py-0.5 rounded shrink-0"
                  style={{ background: colors.bg, color: colors.color }}>
                  {deploy.status === "success" ? "✓ Success" :
                   deploy.status === "failed" ? "✕ Failed" :
                   deploy.status === "running" ? "⚡ Running" : "○ Pending"}
                </span>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  {deploy.deployUrl && (
                    <a href={deploy.deployUrl} target="_blank" rel="noopener noreferrer"
                      className="rounded-lg border px-3 py-1.5 text-xs text-white border-white/10 hover:bg-white/5 transition-colors">
                      ↗
                    </a>
                  )}
                  <button
                    onClick={() => trigger(deploy.id)}
                    disabled={triggering === deploy.id || deploy.status === "running"}
                    className="rounded-lg px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
                    style={{ background: "#3B82F6" }}>
                    {triggering === deploy.id ? "..." : "▶ Redeploy"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="rounded-2xl border p-6 w-full max-w-sm"
            style={{ background: "#1a1a2e", borderColor: "rgba(255,255,255,0.1)" }}>
            <h2 className="text-lg font-bold text-white mb-4">🚀 New Deployment</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>Environment</label>
                <select value={form.environment}
                  onChange={e => setForm(f => ({ ...f, environment: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
                  {["dev", "staging", "production"].map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>Platform</label>
                <select value={form.platform}
                  onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
                  {Object.entries(PLATFORM_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>Deploy URL</label>
                <input value={form.deployUrl}
                  onChange={e => setForm(f => ({ ...f, deployUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={createDeployment}
                className="flex-1 rounded-lg py-2 text-sm font-bold text-white"
                style={{ background: "#6366F1" }}>
                Deploy
              </button>
              <button onClick={() => setCreateOpen(false)}
                className="rounded-lg border px-4 py-2 text-sm text-gray-400 border-white/10">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
