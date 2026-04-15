// fix_wizard2.mjs - Read actual bytes from file
import fs from 'fs';

// Read file in binary to check content
const buf = fs.readFileSync('src/components/landing/BookingWizardClient.tsx');
const c = buf.toString('utf8');

let changes = 0;
let result = c;

// Helper: find and replace using actual file content
function R(oldStr, newStr, name) {
 if (result.includes(oldStr)) {
 result = result.replace(oldStr, newStr);
 changes++;
 console.log('OK:', name);
 } else {
 console.log('NF:', name);
 }
}

// 1. Icons - use actual Zap line
const zapIdx = c.indexOf('Zap, Eye, Server,');
if (zapIdx >= 0) {
 const afterZap = c.indexOf('\n', zapIdx);
 const zapLine = c.substring(zapIdx, afterZap);
 const closingIdx = c.indexOf('} from "lucide-react";', zapIdx);
 const old = zapLine + '\n' + c.substring(afterZap + 1, closingIdx);
 const newContent = zapLine + '\n Search, AlertCircle,\n} from "lucide-react";';
 R(old, newContent, 'Icons');
}

// 2. Types
const lpIdx = c.indexOf('interface LpRateConfig {');
if (lpIdx >= 0) {
 const prevNl = c.lastIndexOf('\n', lpIdx - 1);
 const prevLineEnd = c.lastIndexOf('\n', prevNl - 1);
 const prevLine = c.substring(prevLineEnd + 1, prevNl);
 const old = prevLine + '\n' + c.substring(prevNl + 1, lpIdx + 'interface LpRateConfig {'.length);
 const newT = '\ninterface DomainSearchResult {\n domain: string;\n extension: string;\n available: boolean;\n price?: number;\n}\ninterface SelectedDomain {\n domain: string;\n price: number;\n}\n';
 R(c.substring(prevLineEnd + 1, lpIdx + 'interface LpRateConfig {'.length), newT + 'interface LpRateConfig {', 'Types');
}

// 3. State vars - insert before selectedFeatures
const sfIdx = c.indexOf('const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);');
if (sfIdx >= 0) {
 const newVars = `
 // Domain search state
 const [selectedDomains, setSelectedDomains] = useState<SelectedDomain[]>([]);
 const [domainSearchResults, setDomainSearchResults] = useState<DomainSearchResult[]>([]);
 const [domainSearching, setDomainSearching] = useState(false);
 const [domainHasSearched, setDomainHasSearched] = useState(false);
 const [domainError, setDomainError] = useState("");
 const [selectedTld, setSelectedTld] = useState(".com");
 // Payment QR state
 const [paymentQrUrls, setPaymentQrUrls] = useState<{bank?: string; momo?: string}>({});
 const [selectedPayment, setSelectedPayment] = useState<string>("");
 // Computed domain total
 const selectedDomainTotal = selectedDomains.reduce((s, d) => s + d.price, 0);
 // Toggle domain selection
 function toggleDomain(domain: string, price: number) {
 setSelectedDomains(prev => {
 const exists = prev.find(d => d.domain === domain);
 if (exists) return prev.filter(d => d.domain !== domain);
 return [...prev, { domain, price }];
 });
 }
 // Search domain function
 async function searchDomain() {
 if (domainName.trim().length < 2 || !domainName.includes(".")) return;
 setDomainSearching(true);
 setDomainError("");
 try {
 const tld = selectedTld.replace(/^\\./, "");
 const res = await fetch("/api/pricing/domain-search?keyword=" + encodeURIComponent(domainName) + "&tld=" + tld);
 const json = await res.json();
 const results = json.data ?? [];
 setDomainSearchResults(results);
 setDomainHasSearched(true);
 const autoSelected = results
 .filter(r => r.available && (r.price ?? 0) > 0)
 .map(r => ({ domain: r.domain, price: r.price ?? 0 }));
 setSelectedDomains(autoSelected);
 } catch {
 setDomainError("Khong the kiem tra domain. Vui long thu lai.");
 } finally {
 setDomainSearching(false);
 }
 }
 // Load payment QR URLs
 useEffect(() => {
 fetch("/api/v1/payment-methods")
 .then(r => r.json())
 .then(json => {
 const d = json.data ?? {};
 setPaymentQrUrls({ bank: d.bank?.qrUrl ?? null, momo: d.momo?.qrUrl ?? null });
 })
 .catch(() => {});
 }, []);

`;
 result = result.substring(0, sfIdx) + newVars + result.substring(sfIdx);
 changes++;
 console.log('OK: State vars');
} else { console.log('NF: State vars'); }

// 4. Remove startDate
const sdIdx = c.indexOf('const [startDate, setStartDate] = useState("");');
if (sdIdx >= 0) {
 const end = c.indexOf('\n', sdIdx) + 1;
 result = result.substring(0, sdIdx) + result.substring(end);
 changes++;
 console.log('OK: startDate');
} else { console.log('NF: startDate'); }

// 5. Remove duration
const durIdx = result.indexOf('const [duration, setDuration] = useState("");');
if (durIdx >= 0) {
 const end = result.indexOf('\n', durIdx) + 1;
 result = result.substring(0, durIdx) + result.substring(end);
 changes++;
 console.log('OK: duration');
} else { console.log('NF: duration'); }

// 6. Notes
const notesIdx = c.indexOf('notes: `Dịch vụ:');
if (notesIdx >= 0) {
 const endIdx = c.indexOf('`,', notesIdx) + 2;
 const oldNotes = c.substring(notesIdx, endIdx);
 const newNotes = 'notes: `Dịch vụ: ${svc?.title ?? ""} | Tính năng: ${selectedFeatures.length} | Ghi chú đội ngũ: ${talentNote || "—"}`,';
 R(oldNotes, newNotes, 'Notes');
}

// 7. domainTotal
const dtIdx = c.indexOf('const domainTotal = domainPurchaseNow');
if (dtIdx >= 0) {
 // Find the start of the line
 let lineStart = dtIdx;
 while (lineStart > 0 && c[lineStart-1] !== '\n') lineStart--;
 // Find the semicolon of the expression (skip nested parens)
 let depth = 0;
 let i = dtIdx;
 let done = false;
 while (i < c.length && i < dtIdx + 500) {
 const ch = c[i];
 if (ch === '(' || ch === '{') { depth++; }
 else if (ch === ')' || ch === '}') { if (depth > 0) depth--; }
 else if (ch === ';' && depth === 0) {
 done = true;
 break;
 }
 i++;
 }
 if (done) {
 const oldDT = c.substring(lineStart, i + 1);
 const newDT = 'const domainTotal = domainPurchaseNow ? selectedDomainTotal : 0;';
 R(oldDT, newDT, 'domainTotal');
 } else { console.log('NF: domainTotal (no semicolon found)'); }
} else { console.log('NF: domainTotal'); }

// 8. Timing condition
const tcIdx = c.indexOf('domainName && domainName.includes(".") && domainPrices.find(d => domainName.endsWith(d.extension)) && (');
if (tcIdx >= 0) {
 const oldTC = 'domainName && domainName.includes(".") && domainPrices.find(d => domainName.endsWith(d.extension)) && (';
 const newTC = 'domainName && domainName.includes(".") && (';
 R(oldTC, newTC, 'Timing');
} else { console.log('NF: Timing'); }

// 9. Payload
const plIdx = c.indexOf('domainName: domainName || undefined,');
if (plIdx >= 0) {
 const oldPL = 'domainName: domainName || undefined,';
 const newPL = 'selectedDomains: selectedDomains.length > 0 ? selectedDomains : (domainName ? [{ domain: domainName, price: domainTotal }] : []),';
 R(oldPL, newPL, 'Payload');
} else { console.log('NF: Payload'); }

// 10. Remove schedule section
const schedIdx = c.indexOf('Lịch trình</h4>');
if (schedIdx >= 0) {
 let mb5Start = schedIdx;
 while (mb5Start > 0 && !c.substring(mb5Start - 20, mb5Start).includes('<div className="mb-5">')) {
 const prev = c.lastIndexOf('<div', mb5Start - 1);
 if (prev < 0) break;
 mb5Start = prev;
 }
 const nextMb5 = c.indexOf('<div className="mb-5">', schedIdx + 20);
 if (mb5Start >= 0 && nextMb5 >= 0) {
 result = result.substring(0, mb5Start) + result.substring(nextMb5);
 changes++;
 console.log('OK: Schedule removed');
 } else { console.log('NF: Schedule boundaries'); }
} else { console.log('NF: Schedule'); }

// 11. Payment buttons
const vnpayIdx = c.indexOf('"vnpay", label: "VNPay QR"');
if (vnpayIdx >= 0) {
 let pStart = vnpayIdx;
 while (pStart > 0 && !c.substring(pStart - 25, pStart).includes('{/* Payment')) {
 pStart--;
 }
 const pEnd = c.indexOf('</div>', vnpayIdx) + 6;
 const oldPay = c.substring(pStart, pEnd);
 // Detect indent from the <div> line
 const lines = oldPay.split('\n');
 const divLine = lines[1] || '';
 const indentMatch = divLine.match(/^(\s*)/);
 const indent = indentMatch ? indentMatch[1] : '';
 const newPay =
 indent + '{/* Payment method */}\n' +
 indent + '<div className="mb-4">\n' +
 indent + ' <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>Hình thức thanh toán</label>\n' +
 indent + ' <div className="flex gap-3 flex-wrap">\n' +
 indent + ' {[{ id: "bank", label: t("bankTransfer"), icon: "🏦" }, { id: "momo", label: "MoMo", icon: "💜" }].map(m => {\n' +
 indent + ' const isSel = selectedPayment === m.id;\n' +
 indent + ' return (\n' +
 indent + ' <motion.button key={m.id}\n' +
 indent + ' onClick={() => setSelectedPayment(isSel ? "" : m.id)}\n' +
 indent + ' whileHover={{ scale: 1.02 }}\n' +
 indent + ' style={{ padding: "10px 18px", borderRadius: 10, fontSize: 13, cursor: "pointer",\n' +
 indent + ' background: isSel ? `${DS.blue}15` : "rgba(15,23,42,0.5)",\n' +
 indent + ' border: isSel ? `1.5px solid ${DS.blue}` : `1px solid ${DS.border}`,\n' +
 indent + ' color: isSel ? DS.blue : DS.text3, display: "flex", alignItems: "center", gap: 8, fontFamily: DS.mono }}>\n' +
 indent + ' <span style={{ fontSize: 16 }}>{m.icon}</span>{m.label}\n' +
 indent + ' {isSel && <Check size={11} style={{ color: DS.blue, marginLeft: 4 }} />}\n' +
 indent + ' </motion.button>\n' +
 indent + ' );\n' +
 indent + ' })}\n' +
 indent + ' </div>\n' +
 indent + ' </div>\n' +
 indent + '{selectedPayment && paymentQrUrls[selectedPayment] && (\n' +
 indent + ' <div className="mt-4 p-4 rounded-xl text-center" style={{ background: "rgba(15,23,42,0.5)", border: `1px solid ${DS.blue}30` }}>\n' +
 indent + ' <div style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", marginBottom: 8 }}>QUÉT MÃ QR ĐỂ THANH TOÁN</div>\n' +
 indent + ' <img src={paymentQrUrls[selectedPayment]} alt="QR Code" style={{ maxWidth: 200, maxHeight: 200, margin: "0 auto", borderRadius: 12 }} />\n' +
 indent + ' <div style={{ color: DS.text4, fontSize: 11, marginTop: 8 }}>Quét mã QR bằng app {selectedPayment === "bank" ? "Ngân hàng" : "MoMo"} để thanh toán</div>\n' +
 indent + ' </div>\n' +
 indent + ' )}';
 R(oldPay, newPay, 'Payment buttons');
} else { console.log('NF: Payment buttons'); }

// Write
fs.writeFileSync('src/components/landing/BookingWizardClient.tsx', result);
console.log(`\nDone! ${changes} changes. Lines: ${result.split('\n').length}`);
