"use client";

/**
 * Settings Admin Page — LOOP Solutions
 * Route: /admin/settings
 * Wire: /api/admin/settings + /api/admin/settings/locales
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import { useAdminTranslations } from "@/i18n/admin/useAdminTranslations";
import { Settings, RefreshCw, Check, Shield, Globe, Bell, Database, AlertTriangle, Languages } from "lucide-react";

type Setting = {
  id: string;
  key: string;
  value: string;
  description?: string;
  updatedAt?: string;
};

type Locale = {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  isEnabled: boolean;
  isDefault: boolean;
  order: number;
};

const SETTING_SECTIONS = [
  { key: "general",     label: "General",    icon: <Globe size={14} /> },
  { key: "locales",     label: "Locales",   icon: <Languages size={14} /> },
  { key: "notifications", label: "Notifications", icon: <Bell size={14} /> },
  { key: "security",    label: "Security",  icon: <Shield size={14} /> },
  { key: "system",      label: "System",    icon: <Database size={14} /> },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 36, height: 20, borderRadius: 10, border: "none", cursor: "pointer",
        background: checked ? DS.green : DS.border,
        transition: "background 0.2s",
        position: "relative",
        flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 2, left: checked ? 18 : 2,
        width: 16, height: 16, borderRadius: "50%", background: "#fff",
        transition: "left 0.2s",
      }} />
    </button>
  );
}

function LocaleRow({ locale, onToggle, onSetDefault, saving }: {
  locale: Locale;
  onToggle: (code: string, enabled: boolean) => void;
  onSetDefault: (code: string) => void;
  saving?: boolean;
}) {
  const { t } = useAdminTranslations();
  return (
    <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
      <td style={{ padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>{locale.code === "vi" ? "🇻🇳" : locale.code === "en" ? "🇬🇧" : locale.code === "ja" ? "🇯🇵" : locale.code === "ko" ? "🇰🇷" : "🇨🇳"}</span>
          <div>
            <div style={{ color: DS.text, fontSize: 13, fontWeight: 500 }}>{locale.name}</div>
            <div style={{ color: DS.text5, fontSize: 11, fontFamily: DS.mono }}>{locale.nativeName}</div>
          </div>
        </div>
      </td>
      <td style={{ padding: "10px 12px" }}>
        <div style={{ fontFamily: DS.mono, fontSize: 11, color: DS.text5, background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 6, padding: "2px 8px", display: "inline-block" }}>
          {locale.code}
        </div>
      </td>
      <td style={{ padding: "10px 12px" }}>
        {locale.isDefault ? (
          <span style={{ fontSize: 10, fontFamily: DS.mono, color: DS.green, background: "rgba(34,197,94,0.1)", border: `1px solid rgba(34,197,94,0.3)`, borderRadius: 6, padding: "2px 8px" }}>
            {t("settings.default")}
          </span>
        ) : (
          <button
            onClick={() => onSetDefault(locale.code)}
            disabled={saving}
            style={{ fontSize: 10, fontFamily: DS.mono, color: DS.text5, background: "transparent", border: `1px solid ${DS.border}`, borderRadius: 6, padding: "2px 8px", cursor: saving ? "not-allowed" : "pointer" }}
          >
            {t("settings.setDefault")}
          </button>
        )}
      </td>
      <td style={{ padding: "10px 12px", textAlign: "center" }}>
        <Toggle checked={locale.isEnabled} onChange={(v) => onToggle(locale.code, v)} />
      </td>
    </tr>
  );
}

function LocaleManagement() {
  const { t } = useAdminTranslations();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ data: Locale[] }>({
    queryKey: ["admin", "settings", "locales"],
    queryFn: () => adminApi.get("/api/admin/settings/locales"),
  });

  const seedMutation = useMutation({
    mutationFn: () => adminApi.post("/api/admin/settings/locales/seed", {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "settings", "locales"] }),
    onError: (err: unknown) => { alert(err instanceof Error ? err.message : "Seed failed"); },
  });

  const locales: Locale[] = data?.data ?? [];

  const toggleLocale = (code: string, enabled: boolean) => {
    const updated = locales.map(l => l.code === code ? { ...l, isEnabled: enabled } : l);
    qc.setQueryData(["admin", "settings", "locales"], { data: updated });
    // Optimistic update + API call
    adminApi.post("/api/admin/settings/locales", { locales: updated }).then(() =>
      qc.invalidateQueries({ queryKey: ["admin", "settings", "locales"] })
    );
  };

  const setDefault = (code: string) => {
    const updated = locales.map(l => ({ ...l, isDefault: l.code === code }));
    qc.setQueryData(["admin", "settings", "locales"], { data: updated });
    adminApi.post("/api/admin/settings/locales", { locales: updated }).then(() =>
      qc.invalidateQueries({ queryKey: ["admin", "settings", "locales"] })
    );
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div>
          <div style={{ color: DS.text2, fontSize: 13, fontWeight: 500 }}>{t("settings.localesTitle")}</div>
          <div style={{ color: DS.text5, fontSize: 11, marginTop: 2 }}>{t("settings.localesDesc")}</div>
        </div>
        <button
          onClick={() => seedMutation.mutate()}
          disabled={seedMutation.isPending}
          style={{ padding: "6px 12px", background: seedMutation.isPending ? DS.text4 : "rgba(59,130,246,0.1)", border: `1px solid rgba(59,130,246,0.3)`, borderRadius: 8, color: seedMutation.isPending ? DS.text4 : DS.blue, cursor: seedMutation.isPending ? "not-allowed" : "pointer", fontSize: 11, fontFamily: DS.mono }}
        >
          {seedMutation.isPending ? t("common.loading") : t("settings.seedLocales")}
        </button>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
          <div style={{ width: 24, height: 24, border: `2px solid ${DS.border}`, borderTop: `2px solid ${DS.blue}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : locales.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem", color: DS.text4, fontSize: 13 }}>
          <Languages size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
          <div>{t("settings.noLocales")}</div>
          <div style={{ fontSize: 11, color: DS.text5, marginTop: 4 }}>{t("settings.seedHint")}</div>
        </div>
      ) : (
        <div style={{ background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${DS.border}`, background: "rgba(255,255,255,0.02)" }}>
                <th style={{ padding: "8px 12px", textAlign: "left", color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em" }}>LANGUAGE</th>
                <th style={{ padding: "8px 12px", textAlign: "left", color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em" }}>CODE</th>
                <th style={{ padding: "8px 12px", textAlign: "left", color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em" }}>DEFAULT</th>
                <th style={{ padding: "8px 12px", textAlign: "center", color: DS.text5, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em" }}>ENABLED</th>
              </tr>
            </thead>
            <tbody>
              {locales.map(l => (
                <LocaleRow
                  key={l.id}
                  locale={l}
                  onToggle={toggleLocale}
                  onSetDefault={setDefault}
                  saving={seedMutation.isPending}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SettingRow({ setting, onSave, saving }: { setting: Setting; onSave: (key: string, value: string) => void; saving?: boolean }) {
  const { t } = useAdminTranslations();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(setting.value);

  const handleSave = () => {
    onSave(setting.key, value);
    setEditing(false);
  };

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
            onClick={handleSave}
            disabled={saving}
            style={{ padding: "4px 10px", background: saving ? DS.text4 : "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.4)", borderRadius: 8, color: saving ? DS.text4 : DS.green, cursor: saving ? "not-allowed" : "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}
          >
            <Check size={11} /> {t("common.save")}
          </button>
          <button
            onClick={() => { setValue(setting.value); setEditing(false); }}
            style={{ padding: "4px 8px", background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 8, color: DS.text4, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center" }}
          >
            {t("common.cancel")}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          style={{ padding: "4px 10px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, color: DS.blue, cursor: "pointer", fontSize: 11, fontFamily: DS.mono }}
        >
          {t("common.edit")}
        </button>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { t } = useAdminTranslations();
  const [section, setSection] = useState("general");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => adminApi.get<{ data: Setting[] }>("/api/admin/settings"),
  });

  const saveMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      await adminApi.put(`/api/admin/settings/${key}`, { value });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "settings"] }),
    onError: (err: unknown) => { alert(err instanceof Error ? err.message : "Lưu thất bại"); },
  });

  const settings = data?.data ?? [];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>
            {t("settings.title")}
          </h2>
          <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
            {settings.length} {t("settings.settingCount")}
          </p>
        </div>
        <button
          onClick={() => qc.invalidateQueries({ queryKey: ["admin", "settings"] })}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
        >
          <RefreshCw size={13} /> {t("common.refresh")}
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
          {section === "locales" ? (
            <LocaleManagement />
          ) : (
            <>
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
                  <div>{t("settings.empty")}</div>
                </div>
              ) : (
                settings
                  .filter(s => s.key.startsWith(section))
                  .map(s => <SettingRow key={s.id} setting={s} saving={saveMutation.isPending} onSave={(key, value) => saveMutation.mutate({ key, value })} />)
              )}

              {!isLoading && settings.filter(s => s.key.startsWith(section)).length === 0 && settings.length > 0 && (
                <div>
                  {settings.map(s => <SettingRow key={s.id} setting={s} saving={saveMutation.isPending} onSave={(key, value) => saveMutation.mutate({ key, value })} />)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
