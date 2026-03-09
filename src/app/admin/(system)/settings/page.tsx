"use client";

import { Settings, Globe, Mail, Shield, Database } from "lucide-react";

const settingGroups = [
  {
    title: "Cài đặt chung",
    icon: Settings,
    description: "Tên website, logo, thông tin liên hệ",
    status: "Sắp ra mắt",
  },
  {
    title: "SEO & Meta",
    icon: Globe,
    description: "Default meta tags, Open Graph, sitemap",
    status: "Sắp ra mắt",
  },
  {
    title: "Email Templates",
    icon: Mail,
    description: "Mẫu email tự động: welcome, order confirmation, etc.",
    status: "Sắp ra mắt",
  },
  {
    title: "Bảo mật",
    icon: Shield,
    description: "Rate limiting, CORS, password policy",
    status: "Sắp ra mắt",
  },
  {
    title: "Backup & Data",
    icon: Database,
    description: "Sao lưu dữ liệu, export/import",
    status: "Sắp ra mắt",
  },
];

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Cài đặt hệ thống</h1>
        <p className="text-sm text-slate-400">Quản lý cấu hình website và hệ thống</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {settingGroups.map((group) => (
          <div
            key={group.title}
            className="flex items-start gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-5"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800">
              <group.icon size={18} className="text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-white">{group.title}</h3>
                <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-medium text-yellow-400">
                  {group.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-400">{group.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
