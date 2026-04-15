import fs from 'fs';
const f = 'src/components/landing/BookingWizardClient.tsx';
let c = fs.readFileSync(f, 'utf8');
let lines = c.split('\n');

console.log('File lines:', lines.length);

// ── A. Remove schedule section (lines 1373-1399, the whole "Lịch trình" div) ──
// Find the schedule section start: "<div className="mb-5">" with Calendar icon + "Lịch trình" heading
let schedStart = -1, schedEnd = -1;
for (let i = 0; i < lines.length; i++) {
 if (lines[i].includes('className="mb-5"') && lines[i+1]?.includes('Calendar size={14}')) {
 schedStart = i;
 }
  if (schedStart >= 0 && lines[i].includes('className="mb-5"') && i > schedStart) {
 schedEnd = i - 1; // previous line closes the schedule div
 break;
 }
}
if (schedStart < 0 || schedEnd < 0) {
 console.log('ERROR: schedule section not found. start=', schedStart, 'end=', schedEnd);
 process.exit(1);
}
console.log('Schedule section: lines', schedStart+1, '-', schedEnd+1);
console.log('Preview start:', lines[schedStart].substring(0, 60));
console.log('Preview end:', lines[schedEnd].substring(0, 60));
lines.splice(schedStart, schedEnd - schedStart + 1);
console.log('Removed schedule section. Lines now:', lines.length);

// ── B. Replace payment method buttons ──
// Find: { id: "bank"... }, { id: "vnpay"... }, { id: "momo"... }
let pmtStart = -1, pmtEnd = -1;
for (let i = 0; i < lines.length; i++) {
 if (lines[i].includes('Hình thức chuyển khoản</label>')) {
 pmtStart = i - 1; // <div className="mb-4">
 for (let j = i; j < lines.length; j++) {
 if (lines[j].trim() === '</div>' && j > i) {
 pmtEnd = j;
 break;
 }
  }
 break;
 }
}
if (pmtStart < 0 || pmtEnd < 0) {
 console.log('ERROR: payment method section not found. start=', pmtStart, 'end=', pmtEnd);
 process.exit(1);
}
console.log('Payment method section: lines', pmtStart+1, '-', pmtEnd+1);

const newPmtSection = [
 ' {/* Payment method */}',
 ' <div className="mb-4">',
 ' <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>Hình thức thanh toán</label>',
 ' <div className="flex gap-3 flex-wrap">',
 ' <button onClick={() => setSelectedPayment("bank")}',
 ' style={{ padding: "10px 20px", borderRadius: 10, fontSize: 13, cursor: "pointer",',
 ' background: selectedPayment === "bank" ? "rgba(34,197,94,0.12)" : "rgba(15,23,42,0.5)",',
 ' border: \`1px solid \${selectedPayment === "bank" ? DS.green : DS.border}\`,',
 ' color: selectedPayment === "bank" ? DS.green : DS.text3,',
 ' display: "flex", alignItems: "center", gap: 8, fontFamily: DS.mono, fontWeight: selectedPayment === "bank" ? 600 : 400 }}>',
 ' <span style={{ fontSize: 16 }}>🏦</span>Chuyển khoản ngân hàng',
 ' </button>',
 ' <button onClick={() => setSelectedPayment("momo")}',
 ' style={{ padding: "10px 20px", borderRadius: 10, fontSize: 13, cursor: "pointer",',
 ' background: selectedPayment === "momo" ? "rgba(236,72,153,0.12)" : "rgba(15,23,42,0.5)",',
 ' border: \`1px solid \${selectedPayment === "momo" ? DS.pink : DS.border}\`,',
 ' color: selectedPayment === "momo" ? DS.pink : DS.text3,',
 ' display: "flex", alignItems: "center", gap: 8, fontFamily: DS.mono, fontWeight: selectedPayment === "momo" ? 600 : 400 }}>',
 ' <span style={{ fontSize: 16 }}>💜</span>Ví MoMo',
 ' </button>',
 ' </div>',
 ' </div>',
 '',
 ' {/* QR Code display */}',
 ' {selectedPayment && (',
 ' <div className="mb-4 p-4 rounded-xl" style={{ background: "rgba(15,23,42,0.7)", border: \`1px solid \${DS.border}\`, textAlign: "center" }}>',
 ' {(selectedPayment === "bank" ? paymentQrUrls.bank : paymentQrUrls.momo) ? (',
 ' <div>',
 ' <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", marginBottom: 12 }}>',
 ' {selectedPayment === "bank" ? "QUÉT MÃ QR NGÂN HÀNG" : "QUÉT MÃ QR MOMO"}',
 ' </div>',
 ' <img',
 ' src={selectedPayment === "bank" ? paymentQrUrls.bank : paymentQrUrls.momo},',
 ' alt="QR Code",',
 ' style={{ maxWidth: 220, maxHeight: 220, borderRadius: 12, border: \`1px solid \${DS.border}\` }}',
 ' />',
 ' <div style={{ color: DS.text4, fontSize: 11, marginTop: 10 }}>',
 ' Quét mã QR bằng app ngân hàng hoặc MoMo để chuyển khoản',
 ' </div>',
 ' </div>',
 ' ) : (',
 ' <div style={{ color: DS.text4, fontSize: 13, padding: "20px 0" }}>',
 ' Chưa có mã QR cho phương thức này. Vui lòng liên hệ LOOP để được hỗ trợ.',
 ' </div>',
 ' )}',
 ' </div>',
 ' )}',
];

lines.splice(pmtStart, pmtEnd - pmtStart + 1, ...newPmtSection);
console.log('Replaced payment method. Lines now:', lines.length);

fs.writeFileSync(f, lines.join('\n'));
console.log('Phase 2 done.');
