"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api/client";
import { DS, GRD } from "@/lib/design-tokens";
import { UserPlus, Copy, Check, Users } from "lucide-react";

type ReferralData = {
 referral: { id: string; code: string; name: string };
 stats: { totalClicks: number; totalSignups: number; totalOrders: number };
};

export function ReferralTab() {
 const [data, setData] = useState<ReferralData | null>(null);
 const [loading, setLoading] = useState(true);
 const [copied, setCopied] = useState(false);

 const load = async () => {
 try {
 const res = await apiClient.get<ReferralData>("/api/client/referral", { throwOnError: false });
 if (!("error" in res)) setData((res as unknown as { data: { data: ReferralData } }).data.data ?? null);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => { load(); }, []);

 const referralLink = typeof window !== "undefined"
  ? `${window.location.origin}/dang-ky?ref=${data?.referral.code ?? ""}`
 : "";

 const copyLink = async () => {
 try {
 await navigator.clipboard.writeText(referralLink);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 } catch {}
 };

 if (loading) return <div style={{ color: DS.text4, textAlign: "center", padding: "3rem" }}>Đang tải...</div>;

 return (
 <div>
 {/* Hero card */}
 <div style={{
 padding: "2rem",
 borderRadius: "1.5rem",
 background: `linear-gradient(135deg, rgba(236,72,153,0.1) 0%, rgba(79,125,243,0.1) 100%)`,
 border: "1px solid rgba(236,72,153,0.2)",
 textAlign: "center",
 marginBottom: "1.5rem",
  }}>
 <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎁</div>
 <h3 style={{ color: DS.text, fontFamily: DS.heading, marginBottom: "0.5rem" }}>Giới thiệu bạn bè</h3>
 <p style={{ color: DS.text3, fontSize: "0.875rem", marginBottom: "1.5rem" }}>
 Nhận <strong style={{ color: DS.purple }}>500–2,000 LP</strong> cho mỗi khách hàng thành công!
 </p>

 {/* Stats */}
 {data && (
 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
 {[
 { label: "Lượt click", value: data.stats.totalClicks, icon: <Users size={14} /> },
 { label: "Đăng ký mới", value: data.stats.totalSignups, icon: <UserPlus size={14} /> },
 { label: "Đơn thành công", value: data.stats.totalOrders, icon: <Check size={14} /> },
 ].map(stat => (
 <div key={stat.label} style={{ padding: "0.75rem", borderRadius: "0.75rem", background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}` }}>
 <div style={{ color: DS.blue, fontSize: "1.5rem", fontWeight: 800 }}>{stat.value}</div>
 <div style={{ color: DS.text4, fontSize: "0.625rem" }}>{stat.label}</div>
 </div>
 ))}
 </div>
 )}

 {/* Referral link */}
 <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
 <div style={{ flex: 1, maxWidth: 320, display: "flex", gap: "0.5rem", alignItems: "center", padding: "0.625rem 1rem", borderRadius: "0.75rem", background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}`, overflow: "hidden" }}>
 <span style={{ color: DS.text3, fontSize: "0.75rem", fontFamily: "'JetBrains Mono', monospace", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
 {referralLink || "Đang tải link..."}
 </span>
 </div>
 <button
 onClick={copyLink}
 style={{
 padding: "0.625rem 1.25rem", borderRadius: "0.75rem",
 background: copied ? "rgba(34,197,94,0.15)" : GRD.primary,
 color: copied ? DS.green : "#fff",
 border: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 700,
 display: "flex", alignItems: "center", gap: "0.375rem",
 transition: "all 0.2s",
 }}
 >
 {copied ? <><Check size={14} /> Đã copy!</> : <><Copy size={14} /> Sao chép link</>}
 </button>
 </div>

 {/* Your code */}
 {data?.referral.code && (
 <div style={{ marginTop: "1rem" }}>
 <div style={{ color: DS.text4, fontSize: "0.625rem", fontFamily: "'JetBrains Mono', monospace", marginBottom: "0.25rem" }}>MÃ GIỚI THIỆU CỦA BẠN</div>
 <div style={{ color: DS.pink, fontSize: "1.5rem", fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.1em" }}>
 {data.referral.code}
 </div>
 </div>
 )}
 </div>

 {/* How it works */}
 <div style={{ padding: "1.25rem", borderRadius: "1rem", background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}` }}>
 <h4 style={{ color: DS.text, fontFamily: DS.heading, marginBottom: "0.75rem", fontSize: "0.875rem" }}>Cách thức hoạt động</h4>
 {[
 { step: "1", text: "Chia sẻ link giới thiệu của bạn với bạn bè" },
 { step: "2", text: "Bạn bè đăng ký và đặt dịch vụ qua link của bạn" },
 { step: "3", text: "Bạn nhận LP thưởng khi họ hoàn tất thanh toán" },
 ].map(item => (
 <div key={item.step} style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "0.625rem" }}>
 <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(236,72,153,0.15)", color: DS.pink, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0 }}>
  {item.step}
 </div>
 <div style={{ color: DS.text3, fontSize: "0.8125rem" }}>{item.text}</div>
 </div>
 ))}
 </div>
 </div>
 );
}
