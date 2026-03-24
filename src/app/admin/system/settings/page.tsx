"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/admin/ui/empty-state";

interface SettingGroup {
  [key: string]: string;
}

export default function AdminSettingsPage() {
  const [groups, setGroups] = useState<Record<string, SettingGroup>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<{ [group: string]: { [key: string]: string } }>({});

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(r => r.json())
      .then(json => {
        setGroups(json.data ?? {});
        setEditing(json.data ?? {});
      })
      .catch(() => toast.error("Lỗi khi tải cài đặt"))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const flat: { key: string; value: string; group: string }[] = [];
      for (const [group, settings] of Object.entries(editing)) {
        for (const [key, value] of Object.entries(settings)) {
          flat.push({ key, value, group });
        }
      }
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: flat }),
      });
      if (!res.ok) throw new Error("Lỗi khi lưu");
      const json = await res.json();
      setGroups(json.data ?? editing);
      toast.success("Đã lưu cài đặt");
    } catch {
      toast.error("Lỗi khi lưu cài đặt");
    } finally {
      setSaving(false);
    }
  };

  const GROUP_LABELS: Record<string, string> = {
    general: "Chung",
    seo: "SEO",
    contact: "Liên hệ",
    social: "Mạng xã hội",
    email: "Email",
    lp: "LP",
    referral: "Giới thiệu",
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white">Cài đặt</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>Cấu hình hệ thống</p>
        </div>
        <EmptyState icon="⏳" message="Đang tải..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Cài đặt</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(209,213,219,0.5)" }}>
            Cấu hình hệ thống
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-40"
          style={{ background: "#7C3AED" }}>
          {saving ? "Đang lưu..." : "💾 Lưu thay đổi"}
        </button>
      </div>

      {/* Groups */}
      {Object.keys(groups).length === 0 ? (
        <EmptyState icon="⚙️" message="Chưa có cài đặt nào" description="Cài đặt sẽ xuất hiện sau khi được thêm vào database." />
      ) : (
        <div className="space-y-6">
          {Object.entries(groups).map(([group, settings]) => (
            <div key={group}
              className="rounded-xl border"
              style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
              {/* Group header */}
              <div className="px-5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                  {GROUP_LABELS[group] ?? group}
                </h2>
              </div>
              {/* Settings rows */}
              <div className="divide-y" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                {Object.entries(settings).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-4 px-5 py-4">
                    <div className="w-48 shrink-0 pt-1">
                      <p className="text-sm font-medium text-slate-300">{key}</p>
                    </div>
                    <div className="flex-1">
                      <input
                        value={editing[group]?.[key] ?? value}
                        onChange={e => setEditing(prev => ({
                          ...prev,
                          [group]: { ...prev[group], [key]: e.target.value },
                        }))}
                        className="w-full rounded-lg border px-3 py-2 text-sm text-white outline-none"
                        style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}
                      />
                    </div>
                    <div className="w-32 shrink-0 hidden md:block pt-1">
                      <p className="text-xs truncate" style={{ color: "rgba(209,213,219,0.25)" }}
                        title={value}>
                        Hiện tại: {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
