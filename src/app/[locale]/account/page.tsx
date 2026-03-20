"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, UserCircle, LogOut, Mail, Shield, Crown } from "lucide-react";
import { signOut } from "next-auth/react";

export default function AccountPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (mounted && !user) {
      router.replace("/login");
    }
  }, [mounted, user, router]);

  if (!mounted || !user) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#020617",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{
          width: "32px",
          height: "32px",
          border: "2px solid rgba(59,130,246,0.3)",
          borderTopColor: "#3B82F6",
          borderRadius: "50%",
          animation: "spin 0.6s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#020617",
      padding: "40px 24px",
    }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>

        {/* Page Header */}
        <div style={{ marginBottom: "40px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#FFFFFF", marginBottom: "8px" }}>
            Tài khoản của tôi
          </h1>
          <p style={{ color: "#64748B", fontSize: "15px" }}>
            Quản lý thông tin và cài đặt tài khoản
          </p>
        </div>

        {/* Profile Card */}
        <div style={{
          background: "#0F172A",
          border: "1px solid #1F2937",
          borderRadius: "20px",
          padding: "32px",
          marginBottom: "24px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "24px" }}>
            <div style={{
              width: "72px",
              height: "72px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #8B5CF6, #06B6D4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: 800,
              color: "#FFFFFF",
              flexShrink: 0,
            }}>
              {user.avatar?.slice(0, 2).toUpperCase() || user.name?.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: "20px", fontWeight: 700, color: "#FFFFFF", marginBottom: "4px" }}>
                {user.name}
              </div>
              <div style={{ fontSize: "14px", color: "#64748B", marginBottom: "8px" }}>
                {user.email}
              </div>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                background: user.role === "admin"
                  ? "rgba(139,92,246,0.2)"
                  : "rgba(59,130,246,0.2)",
                color: user.role === "admin" ? "#A78BFA" : "#60A5FA",
              }}>
                {user.role === "admin" ? <Crown size={12} /> : <UserCircle size={12} />}
                {user.role === "admin" ? "Administrator" : "Customer"}
              </div>
            </div>
          </div>

          {/* Info grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div style={{ background: "#020617", border: "1px solid #1F2937", borderRadius: "12px", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <Mail size={14} color="#64748B" />
                <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Email</span>
              </div>
              <div style={{ fontSize: "14px", color: "#FFFFFF", wordBreak: "break-all" }}>{user.email}</div>
            </div>
            <div style={{ background: "#020617", border: "1px solid #1F2937", borderRadius: "12px", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <Shield size={14} color="#64748B" />
                <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Role</span>
              </div>
              <div style={{ fontSize: "14px", color: "#FFFFFF" }}>
                {user.role === "admin" ? "Administrator" : "Customer"}
              </div>
            </div>
            <div style={{ background: "#020617", border: "1px solid #1F2937", borderRadius: "12px", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <UserCircle size={14} color="#64748B" />
                <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>Thành viên từ</span>
              </div>
              <div style={{ fontSize: "14px", color: "#FFFFFF" }}>{user.createdAt || "—"}</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {user.role === "admin" && (
          <div style={{
            background: "#0F172A",
            border: "1px solid rgba(139,92,246,0.3)",
            borderRadius: "20px",
            padding: "32px",
            marginBottom: "24px",
          }}>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF", marginBottom: "16px" }}>
              Quick Actions
            </div>
            <a
              href="/admin"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 20px",
                background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.2))",
                border: "1px solid rgba(139,92,246,0.3)",
                borderRadius: "12px",
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
                transition: "all 0.2s",
              }}
            >
              <LayoutDashboard size={16} />
              Mở Admin Dashboard
            </a>
          </div>
        )}

        {/* Danger Zone */}
        <div style={{
          background: "#0F172A",
          border: "1px solid rgba(248,113,113,0.2)",
          borderRadius: "20px",
          padding: "32px",
        }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF", marginBottom: "8px" }}>
            Nguy hiểm
          </div>
          <p style={{ color: "#64748B", fontSize: "14px", marginBottom: "20px" }}>
            Đăng xuất khỏi tài khoản của bạn.
          </p>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              background: "rgba(248,113,113,0.1)",
              border: "1px solid rgba(248,113,113,0.3)",
              borderRadius: "10px",
              color: "#F87171",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <LogOut size={15} />
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}
