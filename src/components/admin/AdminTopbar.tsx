"use client";

/**
 * AdminTopbar — LOOP Solutions
 * Dark-themed top navigation bar for the admin panel.
 * Adapted from Figma OLD FE AdminDashboard.tsx topbar section.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/authStore";
import {
  Bell,
  LogOut,
  Search,
  ChevronDown,
} from "lucide-react";

interface AdminTopbarProps {
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
}

export function AdminTopbar({ userName, userEmail, userAvatar }: AdminTopbarProps) {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [showNotif, setShowNotif] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
  };

  return (
    <header
      style={{
        height: 60,
        borderBottom: "1px solid var(--figma-border, #1F2937)",
        display: "flex",
        alignItems: "center",
        padding: "0 1.5rem",
        gap: "1rem",
        background: "var(--figma-bg, #020617)",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Search bar */}
      <div
        style={{
          flex: 1,
          maxWidth: 400,
          position: "relative",
        }}
      >
        <Search
          size={14}
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--figma-text4, #64748B)",
          }}
        />
        <input
          type="text"
          placeholder="Tìm kiếm nhanh..."
          className="figma-input"
          style={{
            paddingLeft: "2rem",
            fontSize: "0.8125rem",
            height: 34,
            maxWidth: 360,
          }}
        />
      </div>

      {/* Right actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginLeft: "auto" }}>
        {/* Notifications */}
        <button
          onClick={() => setShowNotif(!showNotif)}
          style={{
            position: "relative",
            background: "none",
            border: "1px solid var(--figma-border, #1F2937)",
            borderRadius: 8,
            padding: "0.375rem",
            cursor: "pointer",
            color: "var(--figma-text3, #94A3B8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--figma-blue, #3B82F6)";
            e.currentTarget.style.color = "var(--figma-blue, #3B82F6)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--figma-border, #1F2937)";
            e.currentTarget.style.color = "var(--figma-text3, #94A3B8)";
          }}
        >
          <Bell size={16} />
          {/* Unread indicator */}
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--figma-red, #EF4444)",
              border: "1.5px solid var(--figma-bg, #020617)",
            }}
          />
        </button>

        {/* User menu */}
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "none",
            border: "1px solid var(--figma-border, #1F2937)",
            borderRadius: 8,
            padding: "0.25rem 0.625rem 0.25rem 0.375rem",
            cursor: "pointer",
            color: "var(--figma-text2, #E2E8F0)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--figma-border2, #374151)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--figma-border, #1F2937)";
          }}
        >
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName ?? "User"}
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: "var(--figma-grd-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {(userName ?? "U").slice(0, 2).toUpperCase()}
            </div>
          )}
          <span style={{ fontSize: "0.8125rem", fontWeight: 500 }}>
            {userName ?? "Admin"}
          </span>
          <ChevronDown size={12} style={{ color: "var(--figma-text4, #64748B)" }} />
        </button>

        {/* User dropdown */}
        {showUserMenu && (
          <div
            style={{
              position: "absolute",
              top: 60,
              right: "1.5rem",
              width: 200,
              background: "var(--figma-bg-card2, #111827)",
              border: "1px solid var(--figma-border2, #374151)",
              borderRadius: 10,
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              overflow: "hidden",
              zIndex: 100,
            }}
          >
            <div
              style={{
                padding: "0.75rem 1rem",
                borderBottom: "1px solid var(--figma-border, #1F2937)",
              }}
            >
              <div style={{ color: "var(--figma-text2, #E2E8F0)", fontSize: "0.875rem", fontWeight: 500 }}>
                {userName}
              </div>
              <div style={{ color: "var(--figma-text4, #64748B)", fontSize: "0.75rem" }}>
                {userEmail}
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                width: "100%",
                padding: "0.625rem 1rem",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--figma-red, #EF4444)",
                fontSize: "0.875rem",
                textAlign: "left",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
              }}
            >
              <LogOut size={14} />
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
