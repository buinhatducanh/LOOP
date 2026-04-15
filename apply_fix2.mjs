// apply_fix2.mjs - targeted replacements using file content extraction
import fs from 'fs';
let c = fs.readFileSync('src/components/landing/BookingWizardClient.tsx', 'utf8');
let changes = 0;

function R(a, b, n) {
 if (c.includes(a)) { c = c.replace(a, b); changes++; console.log('OK:', n); }
 else { console.log('NF:', n); }
}

// State vars - insert before selectedFeatures
const sfIdx = c.indexOf('const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);');
if (sfIdx >= 0) {
 const insert = '\r\n\r\n // Domain search state\r\n' +
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
 ' }, []);';
 c = c.substring(0, sfIdx) + insert + c.substring(sfIdx);
 changes++;
 console.log('OK: State vars');
} else { console.log('NF: State vars'); }

// domainTotal
const dtOld = 'const domainTotal = domainPurchaseNow && domainName\r\n  ? (domainPrices.find(d => domainName.endsWith(d.extension))?.registrationPrice ?? 0) : 0;';
if (c.includes(dtOld)) {
 c = c.replace(dtOld, 'const domainTotal = domainPurchaseNow ? selectedDomainTotal : 0;');
 changes++;
 console.log('OK: domainTotal');
} else { console.log('NF: domainTotal'); }

// Payment buttons - find by VNPay
const vnpayIdx = c.indexOf('"vnpay", label: "VNPay QR"');
if (vnpayIdx >= 0) {
 const sectionStart = c.lastIndexOf('{/* Payment', vnpayIdx);
 const sectionEnd = c.indexOf('</div>', vnpayIdx) + 6;
 const oldSection = c.substring(sectionStart, sectionEnd);
 // Detect indent from the <div line (second line of section)
 const lines = oldSection.split('\n');
 const divLine = lines[1]; // <div className="mb-4">
 const indent = divLine.match(/^(\s*)/)[1];
 const indentL2 = divLine.replace(/^(\s*).*/, '$1').replace(divLine.trimStart().slice(0,5).repeat(1), '').slice(0, indent.length) || indent;
 // Count spaces in divLine
 const spacesDiv = divLine.length - divLine.trimStart().length;
 console.log('Payment indent:', spacesDiv, 'spaces');
 const newSection =
 indent + '{/* Payment method */}\r\n' +
 indent + '<div className="mb-4">\r\n' +
 indent + ' <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>Hình thức thanh toán</label>\r\n' +
 indent + ' <div className="flex gap-3 flex-wrap">\r\n' +
 indent + ' {[{ id: "bank", label: t("bankTransfer"), icon: "🏦" }, { id: "momo", label: "MoMo", icon: "💜" }].map(m => {\r\n' +
 indent + ' const isSel = selectedPayment === m.id;\r\n' +
 indent + ' return (\r\n' +
 indent + ' <motion.button key={m.id}\r\n' +
 indent + ' onClick={() => setSelectedPayment(isSel ? "" : m.id)}\r\n' +
 indent + ' whileHover={{ scale: 1.02 }}\r\n' +
 indent + ' style={{ padding: "10px 18px", borderRadius: 10, fontSize: 13, cursor: "pointer",\r\n' +
 indent + ' background: isSel ? `${DS.blue}15` : "rgba(15,23,42,0.5)",\r\n' +
 indent + ' border: isSel ? `1.5px solid ${DS.blue}` : `1px solid ${DS.border}`,\r\n' +
 indent + ' color: isSel ? DS.blue : DS.text3, display: "flex", alignItems: "center", gap: 8, fontFamily: DS.mono }}>\r\n' +
 indent + ' <span style={{ fontSize: 16 }}>{m.icon}</span>{m.label}\r\n' +
 indent + ' {isSel && <Check size={11} style={{ color: DS.blue, marginLeft: 4 }} />}\r\n' +
 indent + ' </motion.button>\r\n' +
 indent + ' );\r\n' +
 indent + ' })}\r\n' +
 indent + ' </div>\r\n' +
 indent + ' </div>\r\n' +
 indent + '{selectedPayment && paymentQrUrls[selectedPayment] && (\r\n' +
 indent + ' <div className="mt-4 p-4 rounded-xl text-center" style={{ background: "rgba(15,23,42,0.5)", border: `1px solid ${DS.blue}30` }}>\r\n' +
 indent + ' <div style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", marginBottom: 8 }}>QUÉT MÃ QR ĐỂ THANH TOÁN</div>\r\n' +
 indent + ' <img src={paymentQrUrls[selectedPayment]} alt="QR Code" style={{ maxWidth: 200, maxHeight: 200, margin: "0 auto", borderRadius: 12 }} />\r\n' +
 indent + ' <div style={{ color: DS.text4, fontSize: 11, marginTop: 8 }}>Quét mã QR bằng app {selectedPayment === "bank" ? "Ngân hàng" : "MoMo"} để thanh toán</div>\r\n' +
 indent + ' </div>\r\n' +
 indent + ' )}';
 c = c.replace(oldSection, newSection);
 changes++;
 console.log('OK: Payment buttons');
} else { console.log('NF: Payment buttons'); }

fs.writeFileSync('src/components/landing/BookingWizardClient.tsx', c);
console.log(`\nDone! ${changes} changes. Lines: ${c.split('\n').length}`);
