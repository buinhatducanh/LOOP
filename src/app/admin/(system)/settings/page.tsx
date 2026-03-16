"use client";

import { useEffect, useState, useCallback } from "react";
import { Settings, Globe, Check, Loader2 } from "lucide-react";

type FieldType = "text" | "textarea";

interface SettingField {
  key: string;
  label: string;
  type: FieldType;
}

interface SettingGroup {
  title: string;
  icon: typeof Settings;
  fields: SettingField[];
}

const settingSchema: Record<string, SettingGroup> = {
  general: {
    title: "Cài đặt chung",
    icon: Settings,
    fields: [
      { key: "site_name", label: "Tên website", type: "text" },
      { key: "site_description", label: "Mô tả website", type: "textarea" },
      { key: "site_logo", label: "Logo URL", type: "text" },
      { key: "contact_email", label: "Email liên hệ", type: "text" },
      { key: "contact_phone", label: "Số điện thoại", type: "text" },
      { key: "contact_address", label: "Địa chỉ", type: "textarea" },
      { key: "working_hours", label: "Giờ làm việc", type: "text" },
    ],
  },
  seo: {
    title: "SEO & Meta",
    icon: Globe,
    fields: [
      { key: "meta_title", label: "Meta Title", type: "text" },
      { key: "meta_description", label: "Meta Description", type: "textarea" },
      { key: "og_image", label: "OG Image URL", type: "text" },
      { key: "google_analytics_id", label: "Google Analytics ID", type: "text" },
    ],
  },
  social: {
    title: "Mạng xã hội",
    icon: Globe,
    fields: [
      { key: "facebook_url", label: "Facebook URL", type: "text" },
      { key: "linkedin_url", label: "LinkedIn URL", type: "text" },
      { key: "github_url", label: "GitHub URL", type: "text" },
      { key: "tiktok_url", label: "TikTok URL", type: "text" },
      { key: "twitter_url", label: "Twitter / X URL", type: "text" },
      { key: "instagram_url", label: "Instagram URL", type: "text" },
    ],
  },
  stats: {
    title: "Thống kê hiển thị",
    icon: Settings,
    fields: [
      { key: "stat_projects", label: "Số dự án (vd: 150+)", type: "text" },
      { key: "stat_satisfaction", label: "Tỉ lệ hài lòng (vd: 98%)", type: "text" },
      { key: "stat_team_size", label: "Quy mô team (vd: 50+)", type: "text" },
      { key: "stat_years", label: "Số năm kinh nghiệm (vd: 8+)", type: "text" },
    ],
  },
  content: {
    title: "Nội dung trang",
    icon: Globe,
    fields: [
      { key: "tech_stack", label: "Công nghệ sử dụng (phân cách bằng dấu phẩy)", type: "textarea" },
      { key: "team_page_title", label: "Tiêu đề trang Đội ngũ", type: "text" },
      { key: "team_page_subtitle", label: "Phụ đề trang Đội ngũ", type: "text" },
      { key: "company_address", label: "Địa chỉ công ty", type: "textarea" },
      { key: "company_email", label: "Email công ty", type: "text" },
      { key: "company_phone", label: "Số điện thoại công ty", type: "text" },
    ],
  },
};

const groupKeys = Object.keys(settingSchema);

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState(groupKeys[0]);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings");
      const json = await res.json();
      if (json.data) {
        // Flatten grouped data into a flat key->value map
        const flat: Record<string, string> = {};
        for (const group of Object.values(json.data) as Record<string, string>[]) {
          for (const [key, value] of Object.entries(group)) {
            flat[key] = value;
          }
        }
        setValues(flat);
      }
    } catch {
      // silently fail - fields will just be empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  function handleChange(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    // Clear saved indicator when user edits
    setSaved((prev) => ({ ...prev, [activeTab]: false }));
    setErrors((prev) => ({ ...prev, [activeTab]: "" }));
  }

  async function handleSave(groupKey: string) {
    const group = settingSchema[groupKey];
    setSaving((prev) => ({ ...prev, [groupKey]: true }));
    setSaved((prev) => ({ ...prev, [groupKey]: false }));
    setErrors((prev) => ({ ...prev, [groupKey]: "" }));

    try {
      const settings = group.fields.map((field) => ({
        key: field.key,
        value: values[field.key] || "",
        group: groupKey,
      }));

      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Lỗi khi lưu cài đặt");
      }

      setSaved((prev) => ({ ...prev, [groupKey]: true }));
      // Auto-clear success after 3 seconds
      setTimeout(() => {
        setSaved((prev) => ({ ...prev, [groupKey]: false }));
      }, 3000);
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [groupKey]: err instanceof Error ? err.message : "Lỗi khi lưu cài đặt",
      }));
    } finally {
      setSaving((prev) => ({ ...prev, [groupKey]: false }));
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-800/50" />
        ))}
      </div>
    );
  }

  const currentGroup = settingSchema[activeTab];
  const Icon = currentGroup.icon;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Cài đặt hệ thống</h1>
        <p className="text-sm text-slate-400">Quản lý cấu hình website và hệ thống</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-0">
        {groupKeys.map((key) => {
          const group = settingSchema[key];
          const GroupIcon = group.icon;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition ${
                activeTab === key
                  ? "border-b-2 border-blue-500 bg-slate-800/50 text-white"
                  : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-300"
              }`}
            >
              <GroupIcon size={16} />
              {group.title}
            </button>
          );
        })}
      </div>

      {/* Active group content */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
            <Icon size={18} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{currentGroup.title}</h2>
          </div>
        </div>

        <div className="space-y-5">
          {currentGroup.fields.map((field) => (
            <div key={field.key}>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                {field.label}
              </label>
              {field.type === "textarea" ? (
                <textarea
                  value={values[field.key] || ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder={field.label}
                />
              ) : (
                <input
                  type="text"
                  value={values[field.key] || ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder={field.label}
                />
              )}
            </div>
          ))}
        </div>

        {/* Save button + feedback */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => handleSave(activeTab)}
            disabled={saving[activeTab]}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
          >
            {saving[activeTab] ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Đang lưu...
              </>
            ) : (
              "Lưu"
            )}
          </button>

          {saved[activeTab] && (
            <span className="flex items-center gap-1 text-sm text-green-400">
              <Check size={16} />
              Đã lưu thành công
            </span>
          )}

          {errors[activeTab] && (
            <span className="text-sm text-red-400">{errors[activeTab]}</span>
          )}
        </div>
      </div>
    </div>
  );
}
