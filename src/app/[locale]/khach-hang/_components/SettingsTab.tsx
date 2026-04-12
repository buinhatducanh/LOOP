"use client";

import { useState } from "react";
import { apiClient } from "@/lib/api/client";
import { DS } from "@/lib/design-tokens";
import { useAuthStore } from "@/app/store/authStore";
import { Eye, EyeOff, Save } from "lucide-react";

export function SettingsTab() {
 const { user } = useAuthStore();
 const [showPassword, setShowPassword] = useState(false);
 const [currentPassword, setCurrentPassword] = useState("");
 const [newPassword, setNewPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
 const [message, setMessage] = useState("");

 const handlePasswordChange = async (e: React.FormEvent) => {
 e.preventDefault();
 if (newPassword !== confirmPassword) {
 setStatus("error");
 setMessage("Mật khẩu mới không khớp");
 return;
 }
 if (newPassword.length < 8) {
 setStatus("error");
 setMessage("Mật khẩu mới phải có ít nhất 8 ký tự");
 return;
 }
 setStatus("loading");
 try {
 const res = await apiClient.put<unknown>("/api/client/password", {
 currentPassword,
 newPassword,
 }, { throwOnError: false });
 if (!("error" in (res as Record<string, unknown>))) {
 setStatus("success");
 setMessage("Đổi mật khẩu thành công!");
 setCurrentPassword("");
 setNewPassword("");
 setConfirmPassword("");
 } else {
 setStatus("error");
 setMessage((res as Record<string, unknown>).error as string ?? "Có lỗi xảy ra");
 }
 } catch {
 setStatus("error");
 setMessage("Có lỗi xảy ra, vui lòng thử lại");
 }
 };

 return (
  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
 {/* Account info */}
 <div style={{ padding: "1.5rem", borderRadius: "1rem", background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}` }}>
 <h3 style={{ color: DS.text, fontFamily: DS.heading, marginBottom: "1rem", fontSize: "0.9375rem" }}>Thông tin tài khoản</h3>
 <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
 <div style={{ display: "flex", justifyContent: "space-between" }}>
 <span style={{ color: DS.text4, fontSize: "0.8125rem" }}>Tên</span>
 <span style={{ color: DS.text, fontSize: "0.8125rem", fontWeight: 600 }}>{user?.name ?? "—"}</span>
 </div>
 <div style={{ display: "flex", justifyContent: "space-between" }}>
 <span style={{ color: DS.text4, fontSize: "0.8125rem" }}>Email</span>
 <span style={{ color: DS.text, fontSize: "0.8125rem", fontFamily: "'JetBrains Mono', monospace" }}>{user?.email ?? "—"}</span>
 </div>
 </div>
 </div>

 {/* Change password */}
 <div style={{ padding: "1.5rem", borderRadius: "1rem", background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}` }}>
 <h3 style={{ color: DS.text, fontFamily: DS.heading, marginBottom: "1rem", fontSize: "0.9375rem" }}>Đổi mật khẩu</h3>
 <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
 {/* Current password */}
 <div>
 <label style={{ display: "block", color: DS.text3, fontSize: "0.75rem", marginBottom: "0.375rem" }}>Mật khẩu hiện tại</label>
 <input
 type="password"
 value={currentPassword}
 onChange={e => setCurrentPassword(e.target.value)}
 required
 style={{
 width: "100%", padding: "0.625rem 0.875rem", borderRadius: "0.625rem",
 background: "rgba(15,23,42,0.8)", border: `1px solid ${DS.border}`,
 color: DS.text, fontSize: "0.875rem", outline: "none",
  }}
 />
 </div>

 {/* New password */}
 <div>
 <label style={{ display: "block", color: DS.text3, fontSize: "0.75rem", marginBottom: "0.375rem" }}>Mật khẩu mới</label>
 <div style={{ position: "relative" }}>
 <input
 type={showPassword ? "text" : "password"}
 value={newPassword}
 onChange={e => setNewPassword(e.target.value)}
 required
 minLength={8}
 style={{
 width: "100%", padding: "0.625rem 2.5rem 0.625rem 0.875rem", borderRadius: "0.625rem",
 background: "rgba(15,23,42,0.8)", border: `1px solid ${DS.border}`,
 color: DS.text, fontSize: "0.875rem", outline: "none",
 }}
 />
 <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: "absolute", right: "0.625rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: DS.text4, display: "flex" }}>
 {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
 </button>
 </div>
 {newPassword.length > 0 && newPassword.length < 8 && (
 <div style={{ color: "#EF4444", fontSize: "0.6875rem", marginTop: "0.25rem" }}>Ít nhất 8 ký tự</div>
 )}
  </div>

 {/* Confirm new password */}
 <div>
 <label style={{ display: "block", color: DS.text3, fontSize: "0.75rem", marginBottom: "0.375rem" }}>Xác nhận mật khẩu mới</label>
 <input
 type="password"
 value={confirmPassword}
 onChange={e => setConfirmPassword(e.target.value)}
 required
 style={{
 width: "100%", padding: "0.625rem 0.875rem", borderRadius: "0.625rem",
 background: "rgba(15,23,42,0.8)", border: `1px solid ${confirmPassword && newPassword !== confirmPassword ? "#EF4444" : DS.border}`,
 color: DS.text, fontSize: "0.875rem", outline: "none",
 }}
 />
 </div>

 {/* Status message */}
 {message && (
 <div style={{
 padding: "0.625rem 0.875rem", borderRadius: "0.5rem",
 background: status === "success" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
 color: status === "success" ? "#22C55E" : "#EF4444",
 fontSize: "0.8125rem",
 }}>
 {message}
 </div>
 )}

 <button
 type="submit"
 disabled={status === "loading"}
 style={{
 padding: "0.75rem", borderRadius: "0.75rem",
 background: status === "loading" ? "rgba(59,130,246,0.5)" : DS.blue,
 color: "#fff", border: "none", cursor: status === "loading" ? "not-allowed" : "pointer",
 fontSize: "0.875rem", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
 }}
 >
 <Save size={14} />
 {status === "loading" ? "Đang xử lý..." : "Đổi mật khẩu"}
 </button>
 </form>
 </div>
 </div>
 );
}
