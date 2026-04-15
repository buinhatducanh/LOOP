import fs from 'fs';
const f = 'src/components/landing/BookingWizardClient.tsx';
let c = fs.readFileSync(f, 'utf8');
let lines = c.split('\n');

let start = -1, end = -1;
for (let i = 0; i < lines.length; i++) {
 if (lines[i].includes('Hình thức chuyển khoản</label>')) { start = i - 1; }
 if (lines[i].trim() === '</div>' && i+2 < lines.length && lines[i+2].includes('LP redemption')) { end = i; break; }
}
console.log('Payment section: lines', start+1, '-', end+1);

const newSection = [
 ` {/* Payment method */}`,
 ` <div className="mb-4">`,
 ` <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>Hình thức thanh toán</label>`,
 ` <div className="flex gap-3 flex-wrap">`,
 ` <button onClick={() => setSelectedPayment("bank")}`,
 ` style={{ padding: "10px 20px", borderRadius: 10, fontSize: 13, cursor: "pointer",`,
 ` background: selectedPayment === "bank" ? "rgba(34,197,94,0.12)" : "rgba(15,23,42,0.5)",`,
 ` border: \`1px solid \${selectedPayment === "bank" ? DS.green : DS.border}\`,`,
 ` color: selectedPayment === "bank" ? DS.green : DS.text3,`,
 ` display: "flex", alignItems: "center", gap: 8, fontFamily: DS.mono, fontWeight: selectedPayment === "bank" ? 600 : 400 }}>`,
 ` <span style={{ fontSize: 16 }}>🏦</span>Chuyển khoản ngân hàng`,
 ` </button>`,
 ` <button onClick={() => setSelectedPayment("momo")}`,
 ` style={{ padding: "10px 20px", borderRadius: 10, fontSize: 13, cursor: "pointer",`,
 ` background: selectedPayment === "momo" ? "rgba(236,72,153,0.12)" : "rgba(15,23,42,0.5)",`,
 ` border: \`1px solid \${selectedPayment === "momo" ? DS.pink : DS.border}\`,`,
 ` color: selectedPayment === "momo" ? DS.pink : DS.text3,`,
 ` display: "flex", alignItems: "center", gap: 8, fontFamily: DS.mono, fontWeight: selectedPayment === "momo" ? 600 : 400 }}>`,
 ` <span style={{ fontSize: 16 }}>💜</span>Ví MoMo`,
 ` </button>`,
 ` </div>`,
 ` </div>`,
 ``,
 ` {/* QR Code display */}`,
 ` {selectedPayment && (`,
 ` <div className="mb-4 p-4 rounded-xl" style={{ background: "rgba(15,23,42,0.7)", border: \`1px solid \${DS.border}\`, textAlign: "center" }}>`,
 ` {(selectedPayment === "bank" ? paymentQrUrls.bank : paymentQrUrls.momo) ? (`,
 ` <div>`,
 ` <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", marginBottom: 12 }}>`,
 ` {selectedPayment === "bank" ? "QUÉT MÃ QR NGÂN HÀNG" : "QUÉT MÃ QR MOMO"}`,
 ` </div>`,
 ` <img`,
 ` src={selectedPayment === "bank" ? paymentQrUrls.bank : paymentQrUrls.momo}`,
 ` alt="QR Code"`,
 ` style={{ maxWidth: 220, maxHeight: 220, borderRadius: 12, border: \`1px solid \${DS.border}\` }}`,
 ` />`,
 ` <div style={{ color: DS.text4, fontSize: 11, marginTop: 10 }}>`,
 ` Quét mã QR bằng app ngân hàng hoặc MoMo để chuyển khoản`,
 ` </div>`,
 ` </div>`,
 ` ) : (`,
 ` <div style={{ color: DS.text4, fontSize: 13, padding: "20px 0" }}>`,
 ` Chưa có mã QR cho phương thức này. Vui lòng liên hệ LOOP để được hỗ trợ.`,
 ` </div>`,
 ` )}`,
 ` </div>`,
 ` )}`,
];

if (start !== -1 && end !== -1) {
 lines.splice(start, end - start + 1, ...newSection);
 console.log('Replaced. New lines:', lines.length);
} else {
 console.log('Not found');
}
fs.writeFileSync(f, lines.join('\n'));
