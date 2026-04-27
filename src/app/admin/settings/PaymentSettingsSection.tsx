"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { adminApi } from "@/lib/api/client";
import { DS } from "@/lib/design-tokens";
import { useAdminTranslations } from "@/i18n/admin/useAdminTranslations";
import {
 CreditCard, CheckCircle2, AlertCircle, Wifi, WifiOff, RefreshCw, Save, ExternalLink,
} from "lucide-react";
import { InlineLoader } from "@/components/ui/LoadingScreen";

// ── Types ─────────────────────────────────────────────────────────────────────

type PaymentConfig = {
 vietqr_config?: {
 apiKey?: string;
 apiSecret?: string;
 accountNo?: string;
 accountName?: string;
 bankId?: string;
 bankName?: string;
 };
 momo_config?: {
 partnerCode?: string;
 apiKey?: string;
 secretKey?: string;
 endpoint?: string;
 enabled?: boolean;
 };
 vnpay_config?: {
 vnp_TmnCode?: string;
 vnp_HashSecret?: string;
 vnp_ReturnUrl?: string;
 vnp_IpnUrl?: string;
 vnp_ApiUrl?: string;
 };
 payment_bank_qr?: string;
 payment_momo_qr?: string;
 payment_vnpay_info?: string;
};

type ReferralTier = {
 minRevenue: number;
 maxRevenue: number | null;
 lpRate: number;
 label: string;
};

// ── Sub-components ───────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
 return (
 <button
 onClick={() => onChange(!checked)}
 style={{
 width: 36, height: 20, borderRadius: 10, border: "none", cursor: "pointer",
 background: checked ? DS.green : DS.border,
 transition: "background 0.2s",
 position: "relative", flexShrink: 0,
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

function StatusBadge({ ok }: { ok: boolean }) {
 return ok ? (
 <span style={{ display: "flex", alignItems: "center", gap: 4, color: DS.green, fontSize: 11, fontFamily: DS.mono }}>
 <Wifi size={11} /> Da ket noi
 </span>
 ) : (
 <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#EF4444", fontSize: 11, fontFamily: DS.mono }}>
 <WifiOff size={11} /> Chua cau hinh
 </span>
 );
}

// ── VietQR Card ──────────────────────────────────────────────────────────────

function VietQRCard({ data, onSave, saving }: {
 data: Record<string, string>;
 onSave: (d: Record<string, string>) => void;
 saving: boolean;
}) {
 const [form, setForm] = useState<Record<string, string>>(data);
 const [testing, setTesting] = useState(false);
 const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
 const [showSecret, setShowSecret] = useState(false);

 useEffect(() => { setForm(data); }, [data]);

 const testConnection = async () => {
 setTesting(true);
 setTestResult(null);
 try {
 const res = await fetch("/api/admin/settings/vietqr/test", {
 method: "POST",
 headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
 body: JSON.stringify(form),
 });
 const json = await res.json();
 setTestResult(json.data ?? { ok: false, message: json.message ?? "Loi" });
 } catch {
 setTestResult({ ok: false, message: "Loi mang" });
 } finally {
 setTesting(false);
 }
 };

 const hasData = !!(form.apiKey && form.accountNo);

 return (
 <div style={{ background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "1rem", marginBottom: "1rem" }}>
 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
 <div style={{ color: DS.text2, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
 VietQR <CreditCard size={13} style={{ color: DS.green }} />
 </div>
 <StatusBadge ok={hasData} />
 </div>

 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
 <div>
 <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 4 }}>API KEY</label>
 <input value={form.apiKey ?? ""} onChange={e => setForm({ ...form, apiKey: e.target.value })}
 style={{ width: "100%", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "6px 10px", color: DS.text, fontSize: 12, outline: "none" }} />
 </div>
 <div>
 <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 4 }}>API SECRET</label>
 <div style={{ position: "relative" }}>
 <input type={showSecret ? "text" : "password"} value={form.apiSecret ?? ""} onChange={e => setForm({ ...form, apiSecret: e.target.value })}
 style={{ width: "100%", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "6px 32px 6px 10px", color: DS.text, fontSize: 12, outline: "none" }} />
 <button onClick={() => setShowSecret(s => !s)} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: DS.text4, fontSize: 11 }}>
 {showSecret ? "AN" : "HIEN"}
 </button>
 </div>
 </div>
 </div>

 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
 <div>
 <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 4 }}>SO TK</label>
 <input value={form.accountNo ?? ""} onChange={e => setForm({ ...form, accountNo: e.target.value })}
 style={{ width: "100%", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "6px 10px", color: DS.text, fontSize: 12, outline: "none" }} />
 </div>
 <div>
 <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 4 }}>TEN CHU TK</label>
 <input value={form.accountName ?? ""} onChange={e => setForm({ ...form, accountName: e.target.value })}
 style={{ width: "100%", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "6px 10px", color: DS.text, fontSize: 12, outline: "none" }} />
 </div>
 <div>
 <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 4 }}>NGAN HANG (bin)</label>
 <input value={form.bankId ?? "970436"} onChange={e => setForm({ ...form, bankId: e.target.value })}
 style={{ width: "100%", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "6px 10px", color: DS.text, fontSize: 12, outline: "none" }} />
 </div>
 </div>

 {testResult && (
 <div style={{
 padding: "6px 10px", borderRadius: 8, fontSize: 11, fontFamily: DS.mono,
 background: testResult.ok ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
 border: `1px solid ${testResult.ok ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
 color: testResult.ok ? DS.green : "#EF4444", marginBottom: "0.75rem",
 }}>
 {testResult.ok ? "Ket noi thanh cong" : testResult.message}
 </div>
 )}

 <div style={{ display: "flex", gap: 8 }}>
 <button onClick={testConnection} disabled={testing || !form.apiKey}
 style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", background: `${DS.blue}10`, border: `1px solid ${DS.blue}30`, borderRadius: 8, color: DS.blue, cursor: testing ? "not-allowed" : "pointer", fontSize: 11, fontFamily: DS.mono }}>
 {testing ? <InlineLoader size={10} color={DS.blue} /> : <RefreshCw size={10} />}
 Test ket noi
 </button>
 <button onClick={() => onSave(form)} disabled={saving}
 style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", background: saving ? DS.text4 : DS.green, border: "none", borderRadius: 8, color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontSize: 11, fontFamily: DS.mono }}>
 {saving ? <InlineLoader size={10} color="#fff" /> : <Save size={10} />}
 Luu
 </button>
 </div>
 </div>
 );
}

// ── MoMo Card ────────────────────────────────────────────────────────────────

function MoMoCard({ data, onSave, saving }: {
 data: Record<string, string | boolean>;
 onSave: (d: Record<string, string | boolean>) => void;
 saving: boolean;
}) {
 const [form, setForm] = useState<Record<string, string | boolean>>(data);
 const [showSecret, setShowSecret] = useState(false);

 useEffect(() => { setForm(data); }, [data]);

 const hasData = !!(form.partnerCode && form.apiKey);

 return (
 <div style={{ background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "1rem", marginBottom: "1rem" }}>
 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
 <div style={{ color: DS.text2, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
 MoMo <span style={{ fontSize: 14 }}>💜</span>
 </div>
 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
 <Toggle checked={!!form.enabled} onChange={v => setForm({ ...form, enabled: v })} />
 <StatusBadge ok={hasData} />
 </div>
 </div>

 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
 <div>
 <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 4 }}>PARTNER CODE</label>
 <input value={String(form.partnerCode ?? "")} onChange={e => setForm({ ...form, partnerCode: e.target.value })}
 style={{ width: "100%", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "6px 10px", color: DS.text, fontSize: 12, outline: "none" }} />
 </div>
 <div>
 <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 4 }}>API KEY</label>
 <input value={String(form.apiKey ?? "")} onChange={e => setForm({ ...form, apiKey: e.target.value })}
 style={{ width: "100%", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "6px 10px", color: DS.text, fontSize: 12, outline: "none" }} />
 </div>
 </div>

 <div style={{ marginBottom: "0.75rem" }}>
 <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 4 }}>SECRET KEY</label>
 <div style={{ position: "relative" }}>
 <input type={showSecret ? "text" : "password"} value={String(form.secretKey ?? "")} onChange={e => setForm({ ...form, secretKey: e.target.value })}
 style={{ width: "100%", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "6px 32px 6px 10px", color: DS.text, fontSize: 12, outline: "none" }} />
 <button onClick={() => setShowSecret(s => !s)} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: DS.text4, fontSize: 11 }}>
 {showSecret ? "AN" : "HIEN"}
 </button>
 </div>
 </div>

 <div style={{ display: "flex", gap: 8 }}>
 <button onClick={() => onSave(form)} disabled={saving}
 style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", background: saving ? DS.text4 : DS.green, border: "none", borderRadius: 8, color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontSize: 11, fontFamily: DS.mono }}>
 {saving ? <InlineLoader size={10} color="#fff" /> : <Save size={10} />}
 Luu
 </button>
 </div>
 </div>
 );
}

// ── VNPay Card ───────────────────────────────────────────────────────────────

function VNPayCard({ data, onSave, saving }: {
 data: Record<string, string | boolean>;
 onSave: (d: Record<string, string | boolean>) => void;
 saving: boolean;
}) {
 const [form, setForm] = useState<Record<string, string | boolean>>(data);
 const [showSecret, setShowSecret] = useState(false);

 useEffect(() => { setForm(data); }, [data]);

 const hasData = !!(form.vnp_TmnCode && form.vnp_HashSecret);

 return (
 <div style={{ background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "1rem", marginBottom: "1rem" }}>
 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
 <div style={{ color: DS.text2, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
 VNPay <span style={{ fontSize: 14 }}>💳</span>
 </div>
 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
 <Toggle checked={!!form.enabled} onChange={v => setForm({ ...form, enabled: v })} />
 <StatusBadge ok={hasData} />
 </div>
 </div>

 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
 <div>
 <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 4 }}>MERCHANT CODE (TmnCode)</label>
 <input value={String(form.vnp_TmnCode ?? "")} onChange={e => setForm({ ...form, vnp_TmnCode: e.target.value })}
 style={{ width: "100%", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "6px 10px", color: DS.text, fontSize: 12, outline: "none" }} />
 </div>
 <div>
 <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 4 }}>HASH SECRET</label>
 <div style={{ position: "relative" }}>
 <input type={showSecret ? "text" : "password"} value={String(form.vnp_HashSecret ?? "")} onChange={e => setForm({ ...form, vnp_HashSecret: e.target.value })}
 style={{ width: "100%", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "6px 32px 6px 10px", color: DS.text, fontSize: 12, outline: "none" }} />
 <button onClick={() => setShowSecret(s => !s)} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: DS.text4, fontSize: 11 }}>
 {showSecret ? "AN" : "HIEN"}
 </button>
 </div>
 </div>
 </div>

 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
 <div>
 <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 4 }}>RETURN URL</label>
 <input value={String(form.vnp_ReturnUrl ?? "")} onChange={e => setForm({ ...form, vnp_ReturnUrl: e.target.value })}
 placeholder="https://loops.vn/khach-hang"
 style={{ width: "100%", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "6px 10px", color: DS.text, fontSize: 12, outline: "none" }} />
 </div>
 <div>
 <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 4 }}>IPN URL</label>
 <input value={String(form.vnp_IpnUrl ?? "")} onChange={e => setForm({ ...form, vnp_IpnUrl: e.target.value })}
 placeholder="https://loops.vn/api/webhooks/vnpay"
 style={{ width: "100%", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "6px 10px", color: DS.text, fontSize: 12, outline: "none" }} />
 </div>
 </div>

 <div style={{ display: "flex", gap: 8 }}>
 <a href="https://sandbox.vnpayment.vn/apis/docs/huong-dan-tich-hop" target="_blank" rel="noopener noreferrer"
 style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", background: `${DS.blue}10`, border: `1px solid ${DS.blue}30`, borderRadius: 8, color: DS.blue, cursor: "pointer", fontSize: 11, fontFamily: DS.mono, textDecoration: "none" }}>
 <ExternalLink size={10} /> Docs VNPay
 </a>
 <button onClick={() => onSave(form)} disabled={saving}
 style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", background: saving ? DS.text4 : DS.green, border: "none", borderRadius: 8, color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontSize: 11, fontFamily: DS.mono }}>
 {saving ? <InlineLoader size={10} color="#fff" /> : <Save size={10} />}
 Luu
 </button>
 </div>
 </div>
 );
}

// ── Referral Tiers Card ──────────────────────────────────────────────────────

function ReferralTiersCard({ data, onSave, saving }: {
 data: ReferralTier[];
 onSave: (d: ReferralTier[]) => void;
 saving: boolean;
}) {
 const [tiers, setTiers] = useState<ReferralTier[]>(
 data.length ? data : [
 { minRevenue: 0, maxRevenue: 50_000_000, lpRate: 0.05, label: "Tier 1 (0-50M)" },
 { minRevenue: 50_000_000, maxRevenue: 200_000_000, lpRate: 0.07, label: "Tier 2 (50-200M)" },
 { minRevenue: 200_000_000, maxRevenue: null, lpRate: 0.10, label: "Tier 3 (200M+)" },
 ]
 );

 useEffect(() => { if (data.length) setTiers(data); }, [data]);

 const updateTier = (i: number, field: keyof ReferralTier, value: number) => {
 setTiers(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t));
 };

 return (
 <div style={{ background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "1rem", marginBottom: "1rem" }}>
 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
 <div style={{ color: DS.text2, fontSize: 13, fontWeight: 600 }}>Ty le LP Referral</div>
 <span style={{ fontSize: 10, fontFamily: DS.mono, color: DS.text4, background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 6, padding: "2px 8px" }}>
 % chia cho nguoi gioi thieu
 </span>
 </div>

 <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "0.75rem" }}>
 {tiers.map((tier, i) => (
 <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "0.5rem", alignItems: "center", padding: "6px 10px", background: DS.bgCard, borderRadius: 8 }}>
 <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono }}>{tier.label}</div>
 <div>
 <div style={{ color: DS.text4, fontSize: 9, fontFamily: DS.mono, marginBottom: 2 }}>TY LE LP (%)</div>
 <input type="number" value={tier.lpRate * 100} min={0} max={100}
 onChange={e => updateTier(i, "lpRate", parseFloat(e.target.value) / 100)}
 style={{ width: 60, background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 6, padding: "3px 8px", color: DS.text, fontSize: 12, outline: "none" }} />
 </div>
 <div style={{ color: DS.green, fontFamily: DS.mono, fontSize: 12 }}>
 {(tier.lpRate * 100).toFixed(0)}%
 </div>
 </div>
 ))}
 </div>

 <button onClick={() => onSave(tiers)} disabled={saving}
 style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", background: saving ? DS.text4 : DS.green, border: "none", borderRadius: 8, color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontSize: 11, fontFamily: DS.mono }}>
 {saving ? <InlineLoader size={10} color="#fff" /> : <Save size={10} />}
 Luu tiers
 </button>
 </div>
 );
}

// ── Quote Expiry Card ───────────────────────────────────────────────────────

function QuoteExpiryCard({ data, onSave, saving }: {
 data: { quote_expiry_days?: number; quote_auto_expire?: boolean; quote_reminder_hours?: number };
 onSave: (d: Record<string, number | boolean>) => void;
 saving: boolean;
}) {
 const [form, setForm] = useState(data);

 useEffect(() => { setForm(data); }, [data]);

 return (
 <div style={{ background: DS.bg, border: `1px solid ${DS.border}`, borderRadius: 10, padding: "1rem", marginBottom: "1rem" }}>
 <div style={{ color: DS.text2, fontSize: 13, fontWeight: 600, marginBottom: "0.75rem" }}>Quote Expiry</div>

 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
 <div>
 <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 4 }}>SO NGAY HET HAN</label>
 <input type="number" value={form.quote_expiry_days ?? 7} min={1} max={90}
 onChange={e => setForm({ ...form, quote_expiry_days: parseInt(e.target.value) })}
 style={{ width: "100%", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "6px 10px", color: DS.text, fontSize: 12, outline: "none" }} />
 </div>
 <div>
 <label style={{ color: DS.text4, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 4 }}>NHAC TRUOC (gio)</label>
 <input type="number" value={form.quote_reminder_hours ?? 24} min={1} max={168}
 onChange={e => setForm({ ...form, quote_reminder_hours: parseInt(e.target.value) })}
 style={{ width: "100%", background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 8, padding: "6px 10px", color: DS.text, fontSize: 12, outline: "none" }} />
 </div>
 </div>

 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
 <span style={{ color: DS.text3, fontSize: 12 }}>Auto-expire khi het han</span>
 <Toggle checked={form.quote_auto_expire ?? true} onChange={v => setForm({ ...form, quote_auto_expire: v })} />
 </div>

 <button onClick={() => onSave(form)} disabled={saving}
 style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", background: saving ? DS.text4 : DS.green, border: "none", borderRadius: 8, color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontSize: 11, fontFamily: DS.mono }}>
 {saving ? <InlineLoader size={10} color="#fff" /> : <Save size={10} />}
 Luu
 </button>
 </div>
 );
}

// ── Main Section ─────────────────────────────────────────────────────────────

export function PaymentSettingsSection() {
 const { t } = useAdminTranslations();
 const qc = useQueryClient();
 const [saving, setSaving] = useState(false);
 const [success, setSuccess] = useState("");

 // Load payment settings
 const { data: payData } = useQuery<{ data: PaymentConfig }>({
 queryKey: ["admin", "settings", "payment"],
 queryFn: () => adminApi.get("/api/admin/settings/payment"),
 });

 // Load referral tiers
 const { data: refData } = useQuery<{ data: ReferralTier[] }>({
 queryKey: ["admin", "settings", "referral"],
 queryFn: () => adminApi.get("/api/admin/settings/referral"),
 });

 // Load quote settings
 const { data: quoteData } = useQuery<{ data: Record<string, unknown> }>({
 queryKey: ["admin", "settings", "quote"],
 queryFn: () => adminApi.get("/api/admin/settings/quote"),
 });

 const cfg = payData?.data ?? {};

 // Save handlers
 const handleSaveVietQR = async (form: Record<string, string>) => {
 setSaving(true); setSuccess("");
 try {
 await adminApi.post("/api/admin/settings/payment", {
 settings: [{ key: "vietqr_config", value: JSON.stringify(form) }],
 });
 setSuccess("Da luu VietQR");
 qc.invalidateQueries({ queryKey: ["admin", "settings", "payment"] });
 setTimeout(() => setSuccess(""), 3000);
 } catch { setSuccess("Loi luu"); }
 finally { setSaving(false); }
 };

 const handleSaveMoMo = async (form: Record<string, string | boolean>) => {
 setSaving(true); setSuccess("");
 try {
 await adminApi.post("/api/admin/settings/payment", {
 settings: [{ key: "momo_config", value: JSON.stringify(form) }],
 });
 setSuccess("Da luu MoMo");
 qc.invalidateQueries({ queryKey: ["admin", "settings", "payment"] });
 setTimeout(() => setSuccess(""), 3000);
 } catch { setSuccess("Loi luu"); }
 finally { setSaving(false); }
 };

 const handleSaveVNPay = async (form: Record<string, string | boolean>) => {
 setSaving(true); setSuccess("");
 try {
 await adminApi.post("/api/admin/settings/payment", {
 settings: [{ key: "vnpay_config", value: JSON.stringify(form) }],
 });
 setSuccess("Da luu VNPay");
 qc.invalidateQueries({ queryKey: ["admin", "settings", "payment"] });
 setTimeout(() => setSuccess(""), 3000);
 } catch { setSuccess("Loi luu"); }
 finally { setSaving(false); }
 };

 const handleSaveReferral = async (tiers: ReferralTier[]) => {
 setSaving(true); setSuccess("");
 try {
 await adminApi.post("/api/admin/settings/referral", { tiers });
 setSuccess("Da luu Referral tiers");
 qc.invalidateQueries({ queryKey: ["admin", "settings", "referral"] });
 setTimeout(() => setSuccess(""), 3000);
 } catch { setSuccess("Loi luu"); }
 finally { setSaving(false); }
 };

 const handleSaveQuote = async (form: Record<string, number | boolean>) => {
 setSaving(true); setSuccess("");
 try {
 await adminApi.post("/api/admin/settings/quote", {
 settings: Object.entries(form).map(([key, value]) => ({ key, value })),
 });
 setSuccess("Da luu Quote expiry");
 qc.invalidateQueries({ queryKey: ["admin", "settings", "quote"] });
 setTimeout(() => setSuccess(""), 3000);
 } catch { setSuccess("Loi luu"); }
 finally { setSaving(false); }
 };

 return (
 <div>
 {/* Header */}
 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
 <div>
 <div style={{ color: DS.text2, fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Cau hinh Thanh Toan</div>
 <div style={{ color: DS.text4, fontSize: 11 }}>VietQR, MoMo, VNPay, Referral LP Tiers, Quote Expiry</div>
 </div>
 {success && (
 <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
 style={{ display: "flex", alignItems: "center", gap: 4, color: DS.green, fontSize: 12, fontFamily: DS.mono }}>
 <CheckCircle2 size={13} /> {success}
 </motion.div>
 )}
 </div>

 <VietQRCard
 data={cfg.vietqr_config ?? {}}
 onSave={handleSaveVietQR}
 saving={saving}
 />
 <MoMoCard
 data={cfg.momo_config ?? { enabled: false }}
 onSave={handleSaveMoMo}
 saving={saving}
 />
 <VNPayCard
 data={cfg.vnpay_config ?? { enabled: false }}
 onSave={handleSaveVNPay}
 saving={saving}
 />

 <ReferralTiersCard
 data={refData?.data ?? []}
 onSave={handleSaveReferral}
 saving={saving}
 />

 <QuoteExpiryCard
 data={quoteData?.data ?? {}}
 onSave={handleSaveQuote}
 saving={saving}
 />

 <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
 </div>
 );
}
