// fix_wizard.mjs - Fix BookingWizardClient.tsx using file-based patterns
import fs from 'fs';

// Read the current file
let c = fs.readFileSync('src/components/landing/BookingWizardClient.tsx', 'utf8');
let changes = 0;

function R(old, new, name) {
 if (c.includes(old)) {
 c = c.replace(old, new);
 changes++;
 console.log('OK:', name);
 } else {
 console.log('NF:', name);
 }
}

// 1. Icons - insert Search and AlertCircle
const iconOld = ' Globe, Code2, BarChart3, Target, Check, ArrowRight, ArrowLeft,\r\n Users, Calendar, Layers, Sparkles, Shield, Plus, Minus, X, ExternalLink, Zap, Eye, Server,';
const iconNew = ' Globe, Code2, BarChart3, Target, Check, ArrowRight, ArrowLeft,\r\n Users, Calendar, Layers, Sparkles, Shield, Plus, Minus, X, ExternalLink, Zap, Eye, Server,\r\n Search, AlertCircle,';
R(iconOld, iconNew, 'Icons');

// 2. Types - insert DomainSearchResult and SelectedDomain
R('}\r\ninterface LpRateConfig {', '}\r\ninterface DomainSearchResult {\r\n domain: string;\r\n extension: string;\r\n available: boolean;\r\n price?: number;\r\n}\r\ninterface SelectedDomain {\r\n domain: string;\r\n price: number;\r\n}\r\ninterface LpRateConfig {', 'Types');

// 3. State vars - extract exact selectedFeatures line from file
const sfIdx = c.indexOf('const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);');
if (sfIdx >= 0) {
 // Find how many newlines before it
 let start = sfIdx;
 while (start > 0 && c[start-1] !== '\n' && c[start-1] !== '\r') start--;
 const nlCount = c.substring(start, sfIdx).split('\n').length - 1;
 // Determine proper indent (2 spaces typical)
 let indent = '';
 if (nlCount >= 2) {
 // Find the indent by looking at the previous line
 const prevNl = c.lastIndexOf('\n', sfIdx - 1);
 const prevLine = c.substring(prevNl + 1, sfIdx);
 const match = prevLine.match(/^(\s*)/);
 indent = match ? match[1] : ' ';
 }
 // Use exact file context for insertion
 const beforeSF = c.substring(sfIdx - 50, sfIdx);
 const insertStart = c.indexOf('\n', sfIdx - 1) + 1;
 const newVars = '\r\n\r\n // Domain search state\r\n' +
 ' const [selectedDomains, setSelectedDomains] = useState<SelectedDomain[]>([]);\r\n' +
 ' const [domainSearchResults, setDomainSearchResults] = useState<DomainSearchResult[]>([]);\r\n' +
 ' const [domainSearching, setDomainSearching] = useState(false);\r\n' +
 ' const [domainHasSearched, setDomainHasSearched] = useState(false);\r\n' +
 ' const [domainError, setDomainError] = useState("");\r\n' +
 ' const [selectedTld, setSelectedTld] = useState(".com");\r\n' +
 ' // Payment QR state\r\n' +
 ' const [paymentQrUrls, setPaymentQrUrls] = useState<{bank?: string; momo?: string}>({});\r\n' +
 ' const [selectedPayment, setSelectedPayment] = useState<string>("");\r\n' +
 ' // Computed domain total\r\n' +
 ' const selectedDomainTotal = selectedDomains.reduce((s, d) => s + d.price, 0);\r\n' +
 ' // Toggle domain selection\r\n' +
 ' function toggleDomain(domain: string, price: number) {\r\n' +
 ' setSelectedDomains(prev => {\r\n' +
 ' const exists = prev.find(d => d.domain === domain);\r\n' +
 ' if (exists) return prev.filter(d => d.domain !== domain);\r\n' +
 ' return [...prev, { domain, price }];\r\n' +
 ' });\r\n' +
 ' }\r\n' +
 ' // Search domain function\r\n' +
 ' async function searchDomain() {\r\n' +
 ' if (domainName.trim().length < 2 || !domainName.includes(".")) return;\r\n' +
 ' setDomainSearching(true);\r\n' +
 ' setDomainError("");\r\n' +
 ' try {\r\n' +
 ' const tld = selectedTld.replace(/^\\./, "");\r\n' +
 ' const res = await fetch("/api/pricing/domain-search?keyword=" + encodeURIComponent(domainName) + "&tld=" + tld);\r\n' +
 ' const json = await res.json();\r\n' +
 ' const results = json.data ?? [];\r\n' +
 ' setDomainSearchResults(results);\r\n' +
 ' setDomainHasSearched(true);\r\n' +
 ' const autoSelected = results\r\n' +
 ' .filter(r => r.available && (r.price ?? 0) > 0)\r\n' +
 ' .map(r => ({ domain: r.domain, price: r.price ?? 0 }));\r\n' +
 ' setSelectedDomains(autoSelected);\r\n' +
 ' } catch {\r\n' +
 ' setDomainError("Khong the kiem tra domain. Vui long thu lai.");\r\n' +
 ' } finally {\r\n' +
 ' setDomainSearching(false);\r\n' +
 ' }\r\n' +
 ' }\r\n' +
 ' // Load payment QR URLs\r\n' +
 ' useEffect(() => {\r\n' +
 ' fetch("/api/v1/payment-methods")\r\n' +
 ' .then(r => r.json())\r\n' +
 ' .then(json => {\r\n' +
 ' const d = json.data ?? {};\r\n' +
 ' setPaymentQrUrls({ bank: d.bank?.qrUrl ?? null, momo: d.momo?.qrUrl ?? null });\r\n' +
 ' })\r\n' +
 ' .catch(() => {});\r\n' +
 ' }, []);\r\n';
 c = c.substring(0, sfIdx) + newVars + c.substring(sfIdx);
 changes++;
 console.log('OK: State vars');
} else { console.log('NF: State vars'); }

// 4. Remove startDate and duration
R('const [startDate, setStartDate] = useState("");\r\n', '', 'startDate');
R('const [duration, setDuration] = useState("");\r\n', '', 'duration');

// 5. Notes
R('notes: `Dịch vụ: ${svc?.title ?? ""} | Tính năng: ${selectedFeatures.length} | Ghi chú đội ngũ: ${talentNote || "—"} | Bắt đầu: ${startDate || "—"} | Thời gian: ${duration || "—"}`,',
 'notes: `Dịch vụ: ${svc?.title ?? ""} | Tính năng: ${selectedFeatures.length} | Ghi chú đội ngũ: ${talentNote || "—"}`,',
 'Notes');

// 6. Extract and fix domainTotal from the file
const dtStart = c.indexOf('const domainTotal = domainPurchaseNow');
if (dtStart >= 0) {
 // Find the full expression
 const semi1 = c.indexOf(';', dtStart);
 const before = c.substring(dtStart - 5, semi1 + 5);
 // Check if it's the ternary continuation
 if (before.includes('&& domainName') && before.includes('? (')) {
 // Read the exact multi-line expression
 let dtEnd = dtStart;
 let depth = 0;
 let inStr = false;
 let strChar = '';
 for (let i = dtStart; i < c.length && i < dtStart + 500; i++) {
 const ch = c[i];
 if (!inStr && (ch === '"' || ch === "'" || ch === '`')) { inStr = true; strChar = ch; }
 else if (inStr && ch === '\\') i++;
 else if (inStr && ch === strChar) inStr = false;
 else if (!inStr && (ch === '(' || ch === '{')) depth++;
 else if (!inStr && (ch === ')' || ch === '}')) { if (depth > 0) depth--; }
 else if (!inStr && ch === ';' && depth === 0) { dtEnd = i + 1; break; }
 }
 const oldDT = c.substring(dtStart, dtEnd);
 const newDT = 'const domainTotal = domainPurchaseNow ? selectedDomainTotal : 0;';
 c = c.replace(oldDT, newDT);
 changes++;
 console.log('OK: domainTotal');
 } else { console.log('NF: domainTotal (pattern mismatch)'); }
} else { console.log('NF: domainTotal (not found)'); }

// 7. Timing condition
R('domainName && domainName.includes(".") && domainPrices.find(d => domainName.endsWith(d.extension)) && (',
 'domainName && domainName.includes(".") && (', 'Timing condition');

// 8. Payload domainName -> selectedDomains
R('domainName: domainName || undefined,', 'selectedDomains: selectedDomains.length > 0 ? selectedDomains : (domainName ? [{ domain: domainName, price: domainTotal }] : []),', 'Payload');

// 9. Remove schedule section (Lịch trình)
const schedLabel = 'Lịch trình</h4>';
const schedIdx = c.indexOf(schedLabel);
if (schedIdx >= 0) {
 const mb5Start = c.lastIndexOf('<div className="mb-5">', schedIdx);
 const schedContent = c.indexOf('</div>', schedIdx);
 // Find the next mb-5 or section end
 let nextSection = c.indexOf('<div className="mb-5">', schedIdx + schedLabel.length);
 if (mb5Start >= 0 && nextSection >= 0) {
 c = c.substring(0, mb5Start) + c.substring(nextSection);
 changes++;
 console.log('OK: Schedule removed');
 } else { console.log('NF: Schedule (boundaries not found)'); }
} else { console.log('NF: Schedule section'); }

// 10. Payment buttons
const vnpayIdx = c.indexOf('"vnpay", label: "VNPay QR"');
if (vnpayIdx >= 0) {
 const pStart = c.lastIndexOf('{/* Payment', vnpayIdx);
 const pEnd = c.indexOf('</div>', vnpayIdx) + 6;
 const oldPay = c.substring(pStart, pEnd);
 // Detect indent from the <div> line
 const lines = oldPay.split('\n');
 const divLine = lines[1] || '';
 const indentMatch = divLine.match(/^(\s*)/);
 const indent = indentMatch ? indentMatch[1] : '';
 const baseIndent = indent;
 const indent2 = indent + ' ';
 const newPay =
 baseIndent + '{/* Payment method */}\r\n' +
 baseIndent + '<div className="mb-4">\r\n' +
 baseIndent + ' <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>Hình thức thanh toán</label>\r\n' +
 baseIndent + ' <div className="flex gap-3 flex-wrap">\r\n' +
 baseIndent + ' {[{ id: "bank", label: t("bankTransfer"), icon: "🏦" }, { id: "momo", label: "MoMo", icon: "💜" }].map(m => {\r\n' +
 baseIndent + ' const isSel = selectedPayment === m.id;\r\n' +
 baseIndent + ' return (\r\n' +
 baseIndent + ' <motion.button key={m.id}\r\n' +
 baseIndent + ' onClick={() => setSelectedPayment(isSel ? "" : m.id)}\r\n' +
 baseIndent + ' whileHover={{ scale: 1.02 }}\r\n' +
 baseIndent + ' style={{ padding: "10px 18px", borderRadius: 10, fontSize: 13, cursor: "pointer",\r\n' +
 baseIndent + ' background: isSel ? `${DS.blue}15` : "rgba(15,23,42,0.5)",\r\n' +
 baseIndent + ' border: isSel ? `1.5px solid ${DS.blue}` : `1px solid ${DS.border}`,\r\n' +
 baseIndent + ' color: isSel ? DS.blue : DS.text3, display: "flex", alignItems: "center", gap: 8, fontFamily: DS.mono }}>\r\n' +
 baseIndent + ' <span style={{ fontSize: 16 }}>{m.icon}</span>{m.label}\r\n' +
 baseIndent + ' {isSel && <Check size={11} style={{ color: DS.blue, marginLeft: 4 }} />}\r\n' +
 baseIndent + ' </motion.button>\r\n' +
 baseIndent + ' );\r\n' +
 baseIndent + ' })}\r\n' +
 baseIndent + ' </div>\r\n' +
 baseIndent + ' </div>\r\n' +
 baseIndent + '{selectedPayment && paymentQrUrls[selectedPayment] && (\r\n' +
 baseIndent + ' <div className="mt-4 p-4 rounded-xl text-center" style={{ background: "rgba(15,23,42,0.5)", border: `1px solid ${DS.blue}30` }}>\r\n' +
 baseIndent + ' <div style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", marginBottom: 8 }}>QUÉT MÃ QR ĐỂ THANH TOÁN</div>\r\n' +
 baseIndent + ' <img src={paymentQrUrls[selectedPayment]} alt="QR Code" style={{ maxWidth: 200, maxHeight: 200, margin: "0 auto", borderRadius: 12 }} />\r\n' +
 baseIndent + ' <div style={{ color: DS.text4, fontSize: 11, marginTop: 8 }}>Quét mã QR bằng app {selectedPayment === "bank" ? "Ngân hàng" : "MoMo"} để thanh toán</div>\r\n' +
 baseIndent + ' </div>\r\n' +
 baseIndent + ' )}';
 c = c.replace(oldPay, newPay);
 changes++;
 console.log('OK: Payment buttons');
} else { console.log('NF: Payment buttons'); }

fs.writeFileSync('src/components/landing/BookingWizardClient.tsx', c);
console.log(`\nDone! ${changes} changes. Lines: ${c.split('\n').length}`);
