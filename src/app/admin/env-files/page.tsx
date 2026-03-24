"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const ENV_COLORS: Record<string, string> = { dev: "#64748b", staging: "#F59E0B", production: "#10B981", test: "#06B6D4" };

interface EnvFile {
  id: string;
  projectId: string;
  environment: string;
  fileKey: string;
  updatedAt: string;
  project: { id: string; orderNumber: string; customerName: string };
}

export default function StandaloneEnvFilesPage() {
  const router = useRouter();
  const [files, setFiles] = useState<EnvFile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/env-files");
      const json = await res.json();
      setFiles(json.data ?? []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const byProject = files.reduce<Record<string, EnvFile[]>>((acc, f) => {
    if (!acc[f.projectId]) acc[f.projectId] = [];
    acc[f.projectId].push(f);
    return acc;
  }, {});

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">All Env Files</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>
            {files.length} files across {Object.keys(byProject).length} projects
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-center py-20" style={{ color: "rgba(209,213,219,0.3)" }}>Đang tải...</p>
      ) : files.length === 0 ? (
        <div className="text-center py-20 rounded-xl border"
          style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-4xl mb-3">📄</p>
          <p className="text-sm" style={{ color: "rgba(209,213,219,0.3)" }}>Không có env file nào</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byProject).map(([projectId, items]) => {
            const project = items[0].project;
            return (
              <div key={projectId}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <div className="text-center">
                    <p className="text-xs font-medium" style={{ color: "rgba(139,92,246,0.8)" }}>
                      {project?.orderNumber ?? projectId}
                    </p>
                    <p className="text-[10px]" style={{ color: "rgba(209,213,219,0.4)" }}>
                      {project?.customerName}
                    </p>
                  </div>
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {items.map(file => (
                    <div key={file.id}
                      className="rounded-xl border p-4 cursor-pointer transition-all hover:border-white/15"
                      style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}
                      onClick={() => router.push(`/admin/projects/${projectId}/env`)}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: ENV_COLORS[file.environment] ?? "#64748b" }} />
                        <span className="text-xs font-medium uppercase text-white">{file.environment}</span>
                      </div>
                      <p className="text-sm font-mono text-white">{file.fileKey}</p>
                      <p className="text-[10px] mt-1" style={{ color: "rgba(209,213,219,0.4)" }}>
                        {new Date(file.updatedAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
