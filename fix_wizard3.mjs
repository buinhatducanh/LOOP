// fix_wizard3.mjs - Step-by-step debugging
import fs from 'fs';

let c = fs.readFileSync('src/components/landing/BookingWizardClient.tsx', 'utf8');
console.log('Original lines:', c.split('\n').length, 'bytes:', c.length);

let result = c;
let changes = 0;

// 1. Icons
const zapIdx = c.indexOf('Zap, Eye, Server,');
const afterZap = c.indexOf('\n', zapIdx);
const closingIdx = c.indexOf('} from "lucide-react";', zapIdx);
const oldIcon = c.substring(zapIdx, afterZap) + '\n' + c.substring(afterZap + 1, closingIdx);
const newIcon = c.substring(zapIdx, afterZap) + '\n Search, AlertCircle,\n} from "lucide-react";';
if (result.includes(oldIcon)) {
 result = result.replace(oldIcon, newIcon);
 changes++;
 console.log('OK: Icons');
} else { console.log('NF: Icons'); }

// 2. Types
const lpIdx = c.indexOf('interface LpRateConfig {');
const prevLineStart = c.lastIndexOf('\n', c.lastIndexOf('\n', lpIdx) - 1);
const oldTypes = c.substring(prevLineStart, lpIdx + 'interface LpRateConfig {'.length);
const newTypes = '\ninterface DomainSearchResult {\n domain: string;\n extension: string;\n available: boolean;\n price?: number;\n}\ninterface SelectedDomain {\n domain: string;\n price: number;\n}\n';
if (result.includes(oldTypes)) {
 result = result.replace(oldTypes, newTypes + 'interface LpRateConfig {');
 changes++;
 console.log('OK: Types');
} else { console.log('NF: Types'); }

// 3. State vars - use string concatenation, NOT template literal
const sfIdx = c.indexOf('const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);');
if (sfIdx >= 0) {
 const newVars = [
 '',
 ' // Domain search state',
 ' const [selectedDomains, setSelectedDomains] = useState<SelectedDomain[]>([]);',
 ' const [domainSearchResults, setDomainSearchResults] = useState<DomainSearchResult[]>([]);',
 ' const [domainSearching, setDomainSearching] = useState(false);',
 ' const [domainHasSearched, setDomainHasSearched] = useState(false);',
 ' const [domainError, setDomainError] = useState("");',
 ' const [selectedTld, setSelectedTld] = useState(".com");',
 ' // Payment QR state',
 ' const [paymentQrUrls, setPaymentQrUrls] = useState<{bank?: string; momo?: string}>({});',
 ' const [selectedPayment, setSelectedPayment] = useState<string>("");',
 ' // Computed domain total',
 ' const selectedDomainTotal = selectedDomains.reduce((s, d) => s + d.price, 0);',
 ' // Toggle domain selection',
 ' function toggleDomain(domain: string, price: number) {',
 ' setSelectedDomains(prev => {',
 ' const exists = prev.find(d => d.domain === domain);',
 ' if (exists) return prev.filter(d => d.domain !== domain);',
 ' return [...prev, { domain, price }];',
 ' });',
 ' }',
 ' // Search domain function',
 ' async function searchDomain() {',
 ' if (domainName.trim().length < 2 || !domainName.includes(".")) return;',
 ' setDomainSearching(true);',
 ' setDomainError("");',
 ' try {',
 ' const tld = selectedTld.replace(/^\\./, "");',
 ' const res = await fetch("/api/pricing/domain-search?keyword=" + encodeURIComponent(domainName) + "&tld=" + tld);',
 ' const json = await res.json();',
 ' const results = json.data ?? [];',
 ' setDomainSearchResults(results);',
 ' setDomainHasSearched(true);',
 ' const autoSelected = results',
 ' .filter(r => r.available && (r.price ?? 0) > 0)',
 ' .map(r => ({ domain: r.domain, price: r.price ?? 0 }));',
 ' setSelectedDomains(autoSelected);',
 ' } catch {',
 ' setDomainError("Khong the kiem tra domain. Vui long thu lai.");',
 ' } finally {',
 ' setDomainSearching(false);',
 ' }',
 ' }',
 ' // Load payment QR URLs',
 ' useEffect(() => {',
 ' fetch("/api/v1/payment-methods")',
 ' .then(r => r.json())',
 ' .then(json => {',
 ' const d = json.data ?? {};',
 ' setPaymentQrUrls({ bank: d.bank?.qrUrl ?? null, momo: d.momo?.qrUrl ?? null });',
 ' })',
 ' .catch(() => {});',
 ' }, []);',
 ].join('\n');
 result = result.substring(0, sfIdx) + newVars + '\n' + result.substring(sfIdx);
 changes++;
 console.log('OK: State vars. Lines after:', result.split('\n').length);
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
const notesStart = c.indexOf('notes: `Dịch vụ:');
if (notesStart >= 0) {
 const notesEnd = c.indexOf('`,', notesStart) + 2;
 const oldNotes = c.substring(notesStart, notesEnd);
 const newNotes = 'notes: `Dịch vụ: ${svc?.title ?? ""} | Tính năng: ${selectedFeatures.length} | Ghi chú đội ngũ: ${talentNote || "—"}`,';
 if (result.includes(oldNotes)) {
 result = result.replace(oldNotes, newNotes);
 changes++;
 console.log('OK: Notes');
 } else { console.log('NF: Notes'); }
} else { console.log('NF: Notes'); }

// 7. domainTotal
const dtIdx = c.indexOf('const domainTotal = domainPurchaseNow');
if (dtIdx >= 0) {
 let lineStart = dtIdx;
 while (lineStart > 0 && c[lineStart-1] !== '\n') lineStart--;
 let end = dtIdx;
 let depth = 0;
 for (let i = dtIdx; i < c.length && i < dtIdx + 500; i++) {
 const ch = c[i];
 if (ch === '(' || ch === '{') depth++;
 else if (ch === ')' || ch === '}') depth--;
 else if (ch === ';' && depth === 0) { end = i + 1; break; }
 }
 const oldDT = c.substring(lineStart, end);
 const newDT = 'const domainTotal = domainPurchaseNow ? selectedDomainTotal : 0;';
 if (result.includes(oldDT)) {
 result = result.replace(oldDT, newDT);
 changes++;
 console.log('OK: domainTotal');
 } else { console.log('NF: domainTotal'); }
} else { console.log('NF: domainTotal'); }

// 8. Timing condition
const tcOld = 'domainName && domainName.includes(".") && domainPrices.find(d => domainName.endsWith(d.extension)) && (';
if (result.includes(tcOld)) {
 result = result.replace(tcOld, 'domainName && domainName.includes(".") && (');
 changes++;
 console.log('OK: Timing');
} else { console.log('NF: Timing'); }

// 9. Payload
const plOld = 'domainName: domainName || undefined,';
if (result.includes(plOld)) {
 result = result.replace(plOld, 'selectedDomains: selectedDomains.length > 0 ? selectedDomains : (domainName ? [{ domain: domainName, price: domainTotal }] : []),');
 changes++;
 console.log('OK: Payload');
} else { console.log('NF: Payload'); }

// 10. Remove schedule
const schedIdx = c.indexOf('Lịch trình</h4>');
if (schedIdx >= 0) {
 let mb5Start = schedIdx;
 while (mb5Start > 0 && !c.substring(mb5Start - 30, mb5Start).includes('<div className="mb-5">')) {
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
 while (pStart > 0 && !c.substring(pStart - 30, pStart).includes('{/* Payment')) {
 pStart--;
 }
 const pEnd = c.indexOf('</div>', vnpayIdx) + 6;
 const oldPay = c.substring(pStart, pEnd);
 const lines = oldPay.split('\n');
 let indent = '';
 for (let i = 1; i < lines.length; i++) {
 const line = lines[i];
 if (line.trim()) {
 const m = line.match(/^(\s*)/);
 indent = m ? m[1] : '';
 break;
 }
 }
 const newPay = [
 indent + '{/* Payment method */}',
 indent + '<div className="mb-4">',
 indent + ' <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>Hình thức thanh toán</label>',
 indent + ' <div className="flex gap-3 flex-wrap">',
 indent + ' {[{ id: "bank", label: t("bankTransfer"), icon: "🏦" }, { id: "momo", label: "MoMo", icon: "💜" }].map(m => {',
 indent + ' const isSel = selectedPayment === m.id;',
 indent + ' return (',
 indent + ' <motion.button key={m.id}',
 indent + ' onClick={() => setSelectedPayment(isSel ? "" : m.id)}',
 indent + ' whileHover={{ scale: 1.02 }}',
 indent + ' style={{ padding: "10px 18px", borderRadius: 10, fontSize: 13, cursor: "pointer",',
 indent + ' background: isSel ? `${DS.blue}15` : "rgba(15,23,42,0.5)",',
 indent + ' border: isSel ? `1.5px solid ${DS.blue}` : `1px solid ${DS.border}`,',
 indent + ' color: isSel ? DS.blue : DS.text3, display: "flex", alignItems: "center", gap: 8, fontFamily: DS.mono }}>',
 indent + ' <span style={{ fontSize: 16 }}>{m.icon}</span>{m.label}',
 indent + ' {isSel && <Check size={11} style={{ color: DS.blue, marginLeft: 4 }} />',
 indent + ' </motion.button>',
 indent + ' );',
 indent + ' })}',
 indent + ' </div>',
 indent + ' </div>',
 indent + '{selectedPayment && paymentQrUrls[selectedPayment] && (',
 indent + ' <div className="mt-4 p-4 rounded-xl text-center" style={{ background: "rgba(15,23,42,0.5)", border: `1px solid ${DS.blue}30` }}>',
 indent + ' <div style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", marginBottom: 8 }}>QUÉT MÃ QR ĐỂ THANH TOÁN</div>',
 indent + ' <img src={paymentQrUrls[selectedPayment]} alt="QR Code" style={{ maxWidth: 200, maxHeight: 200, margin: "0 auto", borderRadius: 12 }} />',
 indent + ' <div style={{ color: DS.text4, fontSize: 11, marginTop: 8 }}>Quét mã QR bằng app {selectedPayment === "bank" ? "Ngân hàng" : "MoMo"} để thanh toán</div>',
 indent + ' </div>',
 indent + ' )}',
 ].join('\n');
 if (result.includes(oldPay)) {
 result = result.replace(oldPay, newPay);
 changes++;
 console.log('OK: Payment buttons');
 } else { console.log('NF: Payment buttons'); }
} else { console.log('NF: Payment buttons'); }

fs.writeFileSync('src/components/landing/BookingWizardClient.tsx', result);
console.log(`\nDone! ${changes} changes. Lines: ${result.split('\n').length}`);
