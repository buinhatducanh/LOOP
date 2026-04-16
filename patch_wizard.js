#!/usr/bin/env node
"use strict";
const fs = require("fs");

const FILE = "src/components/landing/BookingWizardClient.tsx";
let c = fs.readFileSync(FILE, "utf8");
const origLen = c.length;
let patched = 0;

function rep(old, neu, name) {
 const i = c.indexOf(old);
 if (i === -1) { console.error("NOT FOUND: " + name); return false; }
 c = c.replace(old, neu);
 patched++;
 console.log("Patched: " + name + " (at " + i + ")");
 return true;
}

// ── A. Add payment state vars after paymentPlan state line ──────────────────────────
const stateAnchor = 'const [paymentPlan, setPaymentPlan] = useState<"50" | "100">("50");';
const stateAdd = `\n const [paymentMethod, setPaymentMethod] = useState("vietqr");\n const [qrData, setQrData] = useState<{qrDataURL?: string; payUrl?: string; amount?: number; expiresAt?: string; message?: string} | null>(null);\n const [paymentMethods, setPaymentMethods] = useState<{value: string; label: string; icon: string; hasDynamicQR?: boolean; bankName?: string; accountNo?: string; accountName?: string; bankBin?: string}[]>([\n { value: "vietqr", label: "VietQR", icon: "📱", hasDynamicQR: true },\n { value: "bank", label: "Chuyển khoản", icon: "🏦", hasDynamicQR: false },\n { value: "momo", label: "MoMo", icon: "💜", hasDynamicQR: false },\n { value: "vnpay", label: "VNPay", icon: "💳", hasDynamicQR: false },\n ]);\n const [staticQrInfo, setStaticQrInfo] = useState<{bankTransfer?: {qrUrl?: string | null}; momo?: {qrUrl?: string | null}}>({});\n const [qrLoading, setQrLoading] = useState(false);\n const [qrError, setQrError] = useState("");`;
if (!rep(stateAnchor, stateAnchor + stateAdd, "payment state vars")) process.exit(1);

// ── B. Add payment methods load useEffect + generatePaymentQr function ─────────────────
// Find the closing of the config loading useEffect (after locale, email dependency)
const effectAnchor = "}, [locale, email]);";
const effectAdd = `\n\n // Load payment methods + static QR from BE\n useEffect(() => {\n fetch("/api/payment/methods")\n .then(r => r.json())\n .then(json => {\n if (json?.data?.methods?.length) {\n setPaymentMethods(json.data.methods.map(m => ({\n ...m,\n value: m.value === "bank_transfer" ? "bank" : m.value,\n })));\n setStaticQrInfo(json.data.staticQrInfo ?? {});\n }\n })\n .catch(() => { /* keep defaults */ });\n }, []);\n\n // Generate payment QR / redirect when paymentMethod changes after order creation\n const generatePaymentQr = async (amount: number) => {\n if (!newOrderId) return;\n setQrLoading(true);\n setQrError("");\n try {\n if (paymentMethod === "vietqr") {\n const res = await fetch("/api/payment/vietqr", {\n method: "POST",\n headers: { "Content-Type": "application/json" },\n body: JSON.stringify({ orderId: newOrderId, amount }),\n });\n const data = await res.json();\n if (!res.ok) throw new Error(data?.error || "VietQR failed");\n setQrData(data.data);\n } else if (paymentMethod === "momo") {\n const res = await fetch("/api/payment/momo/create", {\n method: "POST",\n headers: { "Content-Type": "application/json" },\n body: JSON.stringify({ orderId: newOrderId, amount }),\n });\n const data = await res.json();\n if (!res.ok) throw new Error(data?.error || "MoMo failed");\n if (data.data?.payUrl) { window.location.href = data.data.payUrl; return; }\n setQrData(data.data);\n } else if (paymentMethod === "vnpay") {\n const res = await fetch("/api/payment/vnpay/create", {\n method: "POST",\n headers: { "Content-Type": "application/json" },\n body: JSON.stringify({ orderId: newOrderId, amount }),\n });\n const data = await res.json();\n if (!res.ok) throw new Error(data?.error || "VNPay failed");\n if (data.data?.paymentUrl) { window.location.href = data.data.paymentUrl; return; }\n setQrData({ payUrl: data.data?.paymentUrl });\n }\n } catch (err) {\n setQrError(err instanceof Error ? err.message : "Lỗi thanh toán");\n } finally {\n setQrLoading(false);\n }\n  };`;
if (!rep(effectAnchor, effectAnchor + effectAdd, "payment methods + generatePaymentQr")) process.exit(1);

// ── C. After handleSubmit success, auto-trigger payment QR ──────────────────────────
const submitAnchor = 'setSubmitted(true);';
const submitAdd = `\n  // Auto-trigger payment QR/link after quote submission\n const payAmount = paymentPlan === "100" ? total : Math.round(total * 0.5);\n if (payAmount >= 1000) {\n setTimeout(() => generatePaymentQr(payAmount), 100);\n }`;
if (!rep(submitAnchor, submitAnchor + submitAdd, "handleSubmit auto-payment")) process.exit(1);

// ── D. Replace static payment method buttons with dynamic interactive version ─────────
// Find the exact old section: opening <div> through closing </div> before {/* LP redemption */}
const oldPaySection = `<div className="mb-4">
 <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>Hình thức chuyển khoản</label>
 <div className="flex gap-3 flex-wrap">
 {[{ id: "bank", label: t("bankTransfer"), icon: "🏦" }, { id: "vnpay", label: "VNPay QR", icon: "📱" }, { id: "momo", label: "Momo", icon: "💜" }].map(m => (
 <button key={m.id} style={{ padding: "10px 18px", borderRadius: 10, fontSize: 13, cursor: "pointer", background: "rgba(15,23,42,0.5)", border: \`1px solid \${DS.border}\`, color: DS.text3, display: "flex", alignItems: "center", gap: 8, fontFamily: DS.mono }}>
 <span style={{ fontSize: 16 }}>{m.icon}</span>{m.label}
 </button>
 ))}
 </div>
 </div>`;

const newPaySection = `<div className="mb-4">
 <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>Hình thức thanh toán</label>
 <div className="flex gap-3 flex-wrap">
 {paymentMethods.map(m => {
 const isActive = paymentMethod === m.value;
 return (
 <button key={m.value}
 onClick={() => { setPaymentMethod(m.value); setQrData(null); setQrError(""); }}
 style={{
 padding: "10px 18px", borderRadius: 10, fontSize: 13, cursor: "pointer",
 background: isActive ? \`\${DS.green}15\` : "rgba(15,23,42,0.5)",
 border: isActive ? \`1.5px solid \${DS.green}60\` : \`1px solid \${DS.border}\`,
 color: isActive ? DS.green : DS.text3,
 display: "flex", alignItems: "center", gap: 8, fontFamily: DS.mono, transition: "all 0.2s",
 }}>
 <span style={{ fontSize: 16 }}>{m.icon}</span>{m.label}
 {m.hasDynamicQR && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: \`\${DS.green}15\`, color: DS.green }}>QR</span>}
 </button>
 );
 })}
 </div>
 </div>

 {/* Bank transfer static QR fallback */}
 {paymentMethod === "bank" && (
 <div className="mb-4 p-4 rounded-xl" style={{ background: \`\${DS.blue}08\`, border: \`1px solid \${DS.blue}20\` }}>
 <div style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono, marginBottom: 8 }}>◈ Chuyển khoản thủ công</div>
 {staticQrInfo.bankTransfer?.qrUrl ? (
 <img src={staticQrInfo.bankTransfer.qrUrl} alt="Bank QR" style={{ maxWidth: 200, borderRadius: 8 }} />
 ) : (
 <div style={{ color: DS.text4, fontSize: 12 }}>Admin chưa cấu hình QR ngân hàng.</div>
 )}
 </div>
 )}

 {/* MoMo static QR fallback */}
 {paymentMethod === "momo" && !qrData && (
 <div className="mb-4 p-4 rounded-xl" style={{ background: \`\${DS.pink}08\`, border: \`1px solid \${DS.pink}20\` }}>
 <div style={{ color: DS.pink, fontSize: 11, fontFamily: DS.mono, marginBottom: 8 }}>◈ Thanh toán MoMo</div>
 {staticQrInfo.momo?.qrUrl ? (
 <img src={staticQrInfo.momo.qrUrl} alt="MoMo QR" style={{ maxWidth: 200, borderRadius: 8 }} />
 ) : (
 <div style={{ color: DS.text4, fontSize: 12 }}>Admin chưa cấu hình QR MoMo.</div>
 )}
 </div>
 )}

 {/* QR loading */}
 {qrLoading && (
 <div className="mb-4 p-4 rounded-xl text-center" style={{ background: DS.bgCard, border: \`1px solid \${DS.border}\` }}>
 <div style={{ width: 24, height: 24, border: \`2px solid \${DS.border}\`, borderTop: \`2px solid \${DS.green}\`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 8px" }} />
 <div style={{ color: DS.text3, fontSize: 12 }}>Đang tạo mã QR...</div>
 </div>
 )}
 {qrError && (
 <div className="mb-4 p-3 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5", fontSize: 12 }}>
 {qrError}
 </div>
 )}

 {/* VietQR dynamic QR */}
 {qrData?.qrDataURL && (
 <div className="mb-4 p-4 rounded-xl text-center" style={{ background: \`\${DS.green}06\`, border: \`1px solid \${DS.green}25\` }}>
 <div style={{ color: DS.green, fontSize: 11, fontFamily: DS.mono, marginBottom: 8 }}>◈ Quét mã QR VietQR — {qrData.amount?.toLocaleString()} VND</div>
 <img src={qrData.qrDataURL} alt="Payment QR" style={{ maxWidth: 220, borderRadius: 12, boxShadow: \`0 0 20px \${DS.green}30\` }} />
 {qrData.expiresAt && (
 <div style={{ color: DS.text4, fontSize: 10, marginTop: 6 }}>Mã QR hết hạn sau 15 phút</div>
 )}
 </div>
 )}`;

const iOld = c.indexOf(oldPaySection);
if (iOld === -1) {
 // Try partial match
 const alt = `<label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>Hình thức chuyển khoản</label>`;
 const iAlt = c.indexOf(alt);
 if (iAlt === -1) {
 console.error("NOT FOUND: old payment section (tried 2 patterns)");
 process.exit(1);
 }
 // Find the full old section from label to closing </div> before LP redemption
 const labelIdx = iAlt;
 const lpRedemptionIdx = c.indexOf("{/* LP redemption */}", labelIdx);
 if (lpRedemptionIdx === -1) { console.error("NOT FOUND: LP redemption marker"); process.exit(1); }
 // Find the </div> before LP redemption
 const divBeforeLP = c.lastIndexOf("</div>", lpRedemptionIdx);
 const oldSection2 = c.substring(labelIdx - 50, divBeforeLP + 6);
 const newSection2 = newPaySection;
 c = c.replace(oldSection2, newSection2);
 patched++;
 console.log("Patched: dynamic payment UI (alt method) at " + labelIdx);
} else {
 c = c.replace(oldPaySection, newPaySection);
 patched++;
 console.log("Patched: dynamic payment UI at " + iOld);
}

// Add spin keyframe if not present
if (!c.includes("@keyframes spin")) {
 const styleTag = "<style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } `}</style>";
 const mainClose = "</main>";
 const iMain = c.lastIndexOf(mainClose);
 if (iMain !== -1) {
 c = c.slice(0, iMain) + styleTag + c.slice(iMain);
 patched++;
 console.log("Patched: spin keyframes");
 }
}

fs.writeFileSync(FILE, c);
console.log("\nDONE. Patched " + patched + " places. Old len: " + origLen + " → New len: " + c.length);
