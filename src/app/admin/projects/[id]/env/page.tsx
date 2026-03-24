"use client";

import { useState, useEffect, useCallback } from "react";
import { ProjectHeader } from "@/components/admin/shared/project-header";
import { EnvFileEditor } from "@/components/admin/editors/env-file-editor";

interface Props { params: Promise<{ id: string }>; }

interface EnvFile {
  id: string; projectId: string; environment: string; fileKey: string;
  content: string; createdAt: string; updatedAt: string;
  history?: { id: string; version: number; createdAt: string; changedByUser?: { name: string } }[];
}

const ENV_COLORS: Record<string, string> = {
  dev: "#64748b", staging: "#F59E0B", production: "#10B981",
};

export default function EnvFilesPage({ params: paramsPromise }: Props) {
  const [projectId, setProjectId] = useState("");
  const [files, setFiles] = useState<EnvFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeEnv, setActiveEnv] = useState<"dev" | "staging" | "production">("dev");
  const [selectedFile, setSelectedFile] = useState<EnvFile | null>(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ fileKey: ".env", environment: "dev" });

  useEffect(() => { paramsPromise.then(p => setProjectId(p.id)); }, [paramsPromise]);

  const fetchFiles = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/env-files?projectId=${projectId}`);
      const json = await res.json();
      setFiles(json.data ?? []);
    } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const envFiles = files.filter(f => f.environment === activeEnv);

  const openFile = async (file: EnvFile) => {
    const res = await fetch(`/api/admin/env-files/${file.id}`);
    const json = await res.json();
    setSelectedFile(json.data);
    setEditContent(json.data.content);
  };

  const saveFile = async () => {
    if (!selectedFile) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/env-files/${selectedFile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      fetchFiles();
      setSelectedFile(null);
    } finally { setSaving(false); }
  };

  const createFile = async () => {
    if (!projectId) return;
    await fetch("/api/admin/env-files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, environment: form.environment, fileKey: form.fileKey, content: "" }),
    });
    setCreating(false);
    fetchFiles();
  };

  return (
    <div className="p-6">
      <ProjectHeader projectId={projectId} className="mb-6" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Env Files</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>
            Quản lý biến môi trường & credentials
          </p>
        </div>
        <button onClick={() => setCreating(true)}
          className="rounded-lg px-4 py-2 text-sm font-bold text-white"
          style={{ background: "#6366F1" }}>
          + Tạo Env File
        </button>
      </div>

      {/* Env tabs */}
      <div className="flex gap-2 mb-6">
        {(["dev", "staging", "production"] as const).map(env => {
          const count = files.filter(f => f.environment === env).length;
          return (
            <button key={env} onClick={() => setActiveEnv(env)}
              className="rounded-lg border px-4 py-2 text-sm font-medium transition-all flex items-center gap-2"
              style={{
                background: activeEnv === env ? `${ENV_COLORS[env]}20` : "transparent",
                borderColor: activeEnv === env ? `${ENV_COLORS[env]}50` : "rgba(255,255,255,0.1)",
                color: activeEnv === env ? ENV_COLORS[env] : "rgba(209,213,219,0.5)",
              }}>
              <div className="w-2 h-2 rounded-full" style={{ background: ENV_COLORS[env] }} />
              {env}
              <span className="text-xs opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Production warning */}
      {activeEnv === "production" && (
        <div className="rounded-xl border p-4 mb-6 flex items-center gap-3"
          style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.3)" }}>
          <span className="text-red-400 text-lg">⚠</span>
          <p className="text-sm text-red-300">Đây là môi trường PRODUCTION. Hãy cẩn thận khi chỉnh sửa credentials.</p>
        </div>
      )}

      {/* Files grid */}
      {loading ? (
        <p className="text-center py-20" style={{ color: "rgba(209,213,219,0.3)" }}>Đang tải...</p>
      ) : envFiles.length === 0 ? (
        <div className="text-center py-20 rounded-xl border"
          style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-4xl mb-3">📄</p>
          <p className="text-sm mb-4" style={{ color: "rgba(209,213,219,0.3)" }}>Chưa có file nào cho {activeEnv}</p>
          <button onClick={() => { setForm(f => ({ ...f, environment: activeEnv })); setCreating(true); }}
            className="rounded-lg px-4 py-2 text-sm font-bold text-white" style={{ background: "#6366F1" }}>
            + Tạo file đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {envFiles.map(file => (
            <div key={file.id}
              className="rounded-xl border p-4 cursor-pointer transition-all hover:border-white/15"
              style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}
              onClick={() => openFile(file)}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📄</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{file.fileKey}</p>
                  <p className="text-[10px]" style={{ color: "rgba(209,213,219,0.4)" }}>
                    {new Date(file.updatedAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>
              <div className="h-px mb-2" style={{ background: "rgba(255,255,255,0.06)" }} />
              <p className="text-[10px] truncate font-mono" style={{ color: "rgba(139,92,246,0.7)" }}>
                {file.content.split("\n").slice(0, 3).join(" · ")}
              </p>
              <p className="text-[10px] mt-2" style={{ color: "rgba(209,213,219,0.3)" }}>
                {file.content.split("\n").length} lines
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 flex flex-col"
          style={{ background: "rgba(0,0,0,0.8)" }}>
          <div className="flex items-center justify-between p-4 border-b"
            style={{ borderColor: "rgba(255,255,255,0.08)", background: "#0f0f1a" }}>
            <div>
              <p className="text-sm font-bold text-white">{selectedFile.fileKey}</p>
              <p className="text-[10px]" style={{ color: "rgba(209,213,219,0.4)" }}>
                {activeEnv} · {selectedFile.content.split("\n").length} lines
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={saveFile} disabled={saving}
                className="rounded-lg px-4 py-1.5 text-sm font-bold text-white disabled:opacity-50"
                style={{ background: "#10B981" }}>
                {saving ? "Saving..." : "💾 Save"}
              </button>
              <button onClick={() => setSelectedFile(null)}
                className="rounded-lg border px-4 py-1.5 text-sm text-gray-400 border-white/10">
                Đóng
              </button>
            </div>
          </div>
          <EnvFileEditor value={editContent} onChange={setEditContent} className="flex-1" />
        </div>
      )}

      {/* Create modal */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="rounded-2xl border p-6 w-full max-w-sm"
            style={{ background: "#1a1a2e", borderColor: "rgba(255,255,255,0.1)" }}>
            <h2 className="text-lg font-bold text-white mb-4">📄 Tạo Env File</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>Environment</label>
                <select value={form.environment}
                  onChange={e => setForm(f => ({ ...f, environment: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm text-white"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}>
                  {["dev", "staging", "production"].map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(209,213,219,0.6)" }}>File name</label>
                <input value={form.fileKey}
                  onChange={e => setForm(f => ({ ...f, fileKey: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm text-white font-mono"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={createFile} className="flex-1 rounded-lg py-2 text-sm font-bold text-white"
                style={{ background: "#6366F1" }}>Tạo</button>
              <button onClick={() => setCreating(false)}
                className="rounded-lg border px-4 py-2 text-sm text-gray-400 border-white/10">Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
