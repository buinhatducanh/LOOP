"use client";

import { Bell, LogOut, Search, User } from "lucide-react";
import { useAdminAuth } from "./admin-auth-provider";
import { useState } from "react";

export function AdminTopbar() {
  const { user, logout } = useAdminAuth();
  const [showProfile, setShowProfile] = useState(false);

  return (
    <header
      className="sticky top-0 z-30 flex h-16 items-center justify-between px-6 backdrop-blur-sm"
      style={{
        background: "rgba(9,11,20,0.90)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(209,213,219,0.4)" }} />
          <input
            type="text"
            placeholder="Tìm kiếm... (Ctrl+K)"
            className="h-9 w-64 rounded-lg pl-9 pr-3 text-sm outline-none"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.10)",
              color: "white",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "rgba(139,92,246,0.6)";
              e.currentTarget.style.boxShadow = "0 0 0 2px rgba(139,92,246,0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button
          className="relative rounded-lg p-2 transition-colors"
          style={{ color: "rgba(209,213,219,0.6)", background: "transparent" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#FFFFFF";
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(209,213,219,0.6)";
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
        >
          <Bell size={18} />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full" style={{ background: "#F87171" }} />
        </button>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors"
            style={{ background: "transparent" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #8B5CF6, #06B6D4)", boxShadow: "0 0 10px rgba(139,92,246,0.3)" }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div className="hidden text-left md:block">
              <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.9)" }}>{user?.name}</p>
              <p className="text-[11px]" style={{ color: "rgba(209,213,219,0.4)" }}>{user?.roles?.[0] || user?.role}</p>
            </div>
          </button>

          {showProfile && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
              <div
                className="absolute right-0 z-50 mt-2 w-48 rounded-xl py-1"
                style={{
                  background: "rgba(15,17,23,0.98)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.1)",
                }}
              >
                <div className="border-b px-4 py-3" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                  <p className="text-sm font-medium" style={{ color: "#FFFFFF" }}>{user?.name}</p>
                  <p className="text-xs" style={{ color: "rgba(209,213,219,0.5)", marginTop: "2px" }}>{user?.email}</p>
                </div>
                <button
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors"
                  style={{ color: "rgba(209,213,219,0.8)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
                    (e.currentTarget as HTMLButtonElement).style.color = "#FFFFFF";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                    (e.currentTarget as HTMLButtonElement).style.color = "rgba(209,213,219,0.8)";
                  }}
                >
                  <User size={14} />
                  Hồ sơ
                </button>
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors"
                  style={{ color: "#F87171" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(248,113,113,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  }}
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
