"use client";

import { Bell, LogOut, Search, User } from "lucide-react";
import { useAdminAuth } from "./admin-auth-provider";
import { useState } from "react";

export function AdminTopbar() {
  const { user, logout } = useAdminAuth();
  const [showProfile, setShowProfile] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 backdrop-blur-sm">
      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Tìm kiếm... (Ctrl+K)"
            className="h-9 w-64 rounded-lg border border-slate-700 bg-slate-900 pl-9 pr-3 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
          <Bell size={18} />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-800"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div className="hidden text-left md:block">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-[11px] text-slate-500">{user?.roles?.[0] || user?.role}</p>
            </div>
          </button>

          {showProfile && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
              <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-slate-700 bg-slate-900 py-1 shadow-xl">
                <div className="border-b border-slate-700 px-4 py-2">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
                <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800">
                  <User size={14} />
                  Hồ sơ
                </button>
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-800"
                >
                  <LogOut size={14} />
                  Đăng xuất
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
