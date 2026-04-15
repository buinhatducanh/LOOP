// apply_fixes.mjs - All BookingWizardClient.tsx fixes
import fs from 'fs';
let c = fs.readFileSync('src/components/landing/BookingWizardClient.tsx', 'utf8');
let changes = 0;
function R(a, b, n) { if (c.includes(a)) { c = c.replace(a, b); changes++; console.log('OK:', n); } else { console.log('NF:', n); } }
const N = '\n';

// 1. Icons
R(
 ' Users, Calendar, Layers, Sparkles, Shield, Plus, Minus, X, ExternalLink, Zap, Eye, Server,\n} from "lucide-react";',
 ' Users, Calendar, Layers, Sparkles, Shield, Plus, Minus, X, ExternalLink, Zap, Eye, Server,\n Search, AlertCircle,\n} from "lucide-react";',
 'Icons'
);

// 2. Types
R(
 '}\ninterface LpRateConfig {',
 '}\ninterface DomainSearchResult {\n domain: string;\n extension: string;\n available: boolean;\n price?: number;\n}\ninterface SelectedDomain {\n domain: string;\n price: number;\n}\ninterface LpRateConfig {',
 'Types'
);

// 3. State vars
const sfIdx = c.indexOf('const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);');
if (sfIdx >= 0) {
 const insert = '\n\n // Domain search state\n' +
 ' const [selectedDomains, setSelectedDomains] = useState<SelectedDomain[]>([]);\n' +
 ' const [domainSearchResults, setDomainSearchResults] = useState<DomainSearchResult[]>([]);\n' +
 ' const [domainSearching, setDomainSearching] = useState(false);\n' +
 ' const [domainHasSearched, setDomainHasSearched] = useState(false);\n' +
 ' const [domainError, setDomainError] = useState("");\n' +
 ' const [selectedTld, setSelectedTld] = useState(".com");\n' +
 ' // Payment QR state\n' +
 ' const [paymentQrUrls, setPaymentQrUrls] = useState<{bank?: string; momo?: string}>({});\n' +
 ' const [selectedPayment, setSelectedPayment] = useState<string>("");\n' +
 ' // Computed domain total\n' +
 ' const selectedDomainTotal = selectedDomains.reduce((s, d) => s + d.price, 0);\n' +
 ' // Toggle domain selection\n' +
 ' function toggleDomain(domain: string, price: number) {\n' +
 ' setSelectedDomains(prev => {\n' +
 ' const exists = prev.find(d => d.domain === domain);\n' +
 ' if (exists) return prev.filter(d => d.domain !== domain);\n' +
 ' return [...prev, { domain, price }];\n' +
 ' });\n' +
 ' }\n' +
 ' // Search domain function\n' +
 ' async function searchDomain() {\n' +
 ' if (domainName.trim().length < 2 || !domainName.includes(".")) return;\n' +
 ' setDomainSearching(true);\n' +
 ' setDomainError("");\n' +
 ' try {\n' +
 ' const tld = selectedTld.replace(/^\\./, "");\n' +
 ' const res = await fetch("/api/pricing/domain-search?keyword=" + encodeURIComponent(domainName) + "&tld=" + tld);\n' +
 ' const json = await res.json();\n' +
 ' const results = json.data ?? [];\n' +
 ' setDomainSearchResults(results);\n' +
 ' setDomainHasSearched(true);\n' +
 ' const autoSelected = results\n' +
 ' .filter(r => r.available && (r.price ?? 0) > 0)\n' +
 ' .map(r => ({ domain: r.domain, price: r.price ?? 0 }));\n' +
 ' setSelectedDomains(autoSelected);\n' +
 ' } catch {\n' +
 ' setDomainError("Khong the kiem tra domain. Vui long thu lai.");\n' +
 ' } finally {\n' +
 ' setDomainSearching(false);\n' +
 ' }\n' +
 ' }\n' +
 ' // Load payment QR URLs\n' +
 ' useEffect(() => {\n' +
 ' fetch("/api/v1/payment-methods")\n' +
 ' .then(r => r.json())\n' +
 ' .then(json => {\n' +
 ' const d = json.data ?? {};\n' +
 ' setPaymentQrUrls({ bank: d.bank?.qrUrl ?? null, momo: d.momo?.qrUrl ?? null });\n' +
 ' })\n' +
 ' .catch(() => {});\n' +
 ' }, []);\n';
 c = c.substring(0, sfIdx) + insert + c.substring(sfIdx);
 changes++;
 console.log('OK: State vars');
} else { console.log('NF: State vars'); }

// 4. Remove startDate
R('const [startDate, setStartDate] = useState("");\n', '', 'startDate');

// 5. Remove duration
R('const [duration, setDuration] = useState("");\n', '', 'duration');

// 6. Notes
R(
 'notes: `Dịch vụ: ${svc?.title ?? ""} | Tính năng: ${selectedFeatures.length} | Ghi chú đội ngũ: ${talentNote || "—"} | Bắt đầu: ${startDate || "—"} | Thời gian: ${duration || "—"}`,',
 'notes: `Dịch vụ: ${svc?.title ?? ""} | Tính năng: ${selectedFeatures.length} | Ghi chú đội ngũ: ${talentNote || "—"}`,',
 'Notes'
);

// 7. domainTotal
R(
 'const domainTotal = domainPurchaseNow && domainName\n ? (domainPrices.find(d => domainName.endsWith(d.extension))?.registrationPrice ?? 0) : 0;',
 'const domainTotal = domainPurchaseNow ? selectedDomainTotal : 0;',
 'domainTotal'
);

// 8. Timing condition
R(
 'domainName && domainName.includes(".") && domainPrices.find(d => domainName.endsWith(d.extension)) && (',
 'domainName && domainName.includes(".") && (',
 'Timing condition'
);

// 9. Payload
R(
 'domainName: domainName || undefined,',
 'selectedDomains: selectedDomains.length > 0 ? selectedDomains : (domainName ? [{ domain: domainName, price: domainTotal }] : []),',
 'Payload'
);

// 10. Remove schedule (Lich trinh)
const schedIdx = c.indexOf('Lịch trình</h4>');
if (schedIdx >= 0) {
 const mb5Start = c.lastIndexOf('<div className="mb-5">', schedIdx);
 const nextSec = c.indexOf('<div className="mb-5">', schedIdx + 20);
 if (mb5Start >= 0 && nextSec >= 0) {
 c = c.substring(0, mb5Start) + c.substring(nextSec);
 changes++;
 console.log('OK: Schedule removed');
 } else { console.log('NF: Schedule boundaries'); }
} else { console.log('NF: Schedule section'); }

// 11. Payment buttons
const vnpayIdx = c.indexOf('"vnpay", label: "VNPay QR"');
if (vnpayIdx >= 0) {
 const pStart = c.lastIndexOf('{/* Payment', vnpayIdx);
 const pEnd = c.indexOf('</div>', vnpayIdx) + 6;
 const oldPay = c.substring(pStart, pEnd);
 const indent = oldPay.match(/^(\s*)/)[1];
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
 c = c.replace(oldPay, newPay);
 changes++;
 console.log('OK: Payment buttons');
} else { console.log('NF: Payment buttons'); }

fs.writeFileSync('src/components/landing/BookingWizardClient.tsx', c);
console.log('\nDone!', changes, 'changes. Lines:', c.split('\n').length);
