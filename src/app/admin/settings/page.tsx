"use client";

/**
 * Settings Admin Page — LOOP Solutions
 * Route: /admin/settings
 * Wire: /api/admin/settings
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS } from "@/lib/design-tokens";
import { Settings, Save, RefreshCw, Check, Shield, Globe, Bell, Database } from "lucide-react";

type Setting = {
  id: string;
  key: string;
  value: string;
  description?: string;
  updatedAt?: string;
};

const SETTING_SECTIONS = [
  { key: "general", label: "General", icon: <Globe size={14} /> },
  { key: "notifications", label: "Notifications", icon: <Bell size={14} /> },
  { key: "security", label: "Security", icon: <Shield size={14} /> },
  { key: "system", label: "System", icon: <Database size={14} /> },
];

function SettingRow({ setting, onSave }: { setting: Setting; onSave: (key: string, value: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(setting.value);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${DS.border}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ color: DS.text, fontSize: 13, fontWeight: 500 }}>{setting.key}</div>
        {setting.description && (
          <div style={{ color: DS.text4, fontSize: 11, marginTop: 2 }}>{setting.description}</div>
        )}
      </div>
      {editing ? (
        <div style={{ display: "flex", gap: 6 }}>
          <input
            value={value}
            onChange={e => setValue(e.target.value)}
            style={{ background: DS.bg, border: `1px solid ${DS.blue}60`, borderRadius: 8, padding: "4px 10px", color: DS.text, fontSize: 12, fontFamily: DS.mono, outline: "none", width: 200 }}
          />
          <button
            onClick={() => { onSave(setting.key, value); setEditing(false); }}
            style={{ padding: "4px 10px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.4)", borderRadius: 8, color: DS.green, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}
          >
            <Check size={11} /> Lưu
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          style={{ padding: "4px 10px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, color: DS.blue, cursor: "pointer", fontSize: 11, fontFamily: DS.mono }}
        >
          Sửa
        </button>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [section, setSection] = useState("general");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => adminApi.get<{ data: Setting[] }>("/api/admin/settings"),
  });

  const settings = data?.data ?? [];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>
            Cài đặt hệ thống
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            {settings.length} cài đặt
          </p>
        </div>
        <button
          onClick={() => qc.invalidateQueries({ queryKey: ["admin", "settings"] })}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
        >
          <RefreshCw size={13} /> Làm mới
        </button>
      </div>

      {/* Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "1.5rem" }}>
        {/* Section nav */}
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "0.5rem" }}>
          {SETTING_SECTIONS.map(s => (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 8,
                background: section === s.key ? "rgba(59,130,246,0.1)" : "transparent",
                border: section === s.key ? `1px solid rgba(59,130,246,0.3)"` : "1px solid transparent",
                color: section === s.key ? DS.blue : DS.text3,
                fontSize: 13,
                fontFamily: DS.mono,
                cursor: "pointer",
                textAlign: "left",
                marginBottom: 2,
              }}
            >
              <span style={{ opacity: section === s.key ? 1 : 0.6 }}>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Settings list */}
        <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
            <Settings size={14} style={{ color: DS.blue }} />
            <h3 style={{ color: DS.text2, fontSize: 14, fontWeight: 600, margin: 0, textTransform: "capitalize" }}>{section}</h3>
          </div>

          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
              <div style={{ width: 24, height: 24, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : settings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: DS.text4, fontSize: 13 }}>
              <Settings size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
              <div>Chưa có cài đặt nào cho mục này</div>
            </div>
          ) : (
            settings
              .filter(s => s.key.startsWith(section))
              .map(s => <SettingRow key={s.id} setting={s} onSave={() => {}} />)
          )}

          {/* Show all if no filter match */}
          {!isLoading && settings.filter(s => s.key.startsWith(section)).length === 0 && settings.length > 0 && (
            <div>
              {settings.map(s => <SettingRow key={s.id} setting={s} onSave={() => {}} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
