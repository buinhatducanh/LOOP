// apply_wizard_v4.mjs — String-based replacements (avoids line number shifting)
import fs from 'fs';

const f = 'src/components/landing/BookingWizardClient.tsx';
let c = fs.readFileSync(f, 'utf8');

console.log('File size:', c.length, 'chars');

// ── PHASE 1: State/Type additions (line-based, no line shift) ──────────────
let lines = c.split('\n');

// 1. Icons
const iconsIdx = lines.findIndex(l => l.includes('Globe, Code2, BarChart3'));
if (iconsIdx >= 0) {
 lines[iconsIdx] = lines[iconsIdx].replace(
 'Globe, Code2, BarChart3, Target, Check, ArrowRight, ArrowLeft,',
 'Globe, Code2, BarChart3, Target, Check, ArrowRight, ArrowLeft, Search, AlertCircle,'
 );
 console.log('1. Icons at line', iconsIdx + 1);
}

// 2. TypeScript interfaces
const typesIdx = lines.findIndex(l => l.includes('interface WizardDomainPrice'));
if (typesIdx >= 0) {
 lines.splice(typesIdx, 0,
 'interface DomainSearchResult {',
 ' domain: string;',
 ' extension: string;',
 ' available: boolean;',
 ' price?: number;',
 '}',
 'interface SelectedDomain {',
 ' domain: string;',
 ' price: number;',
 '}',
 );
 console.log('2. Types at line', typesIdx + 1);
}

// 3. States
const stateIdx = lines.findIndex(l => l.includes('const [selectedPackage, setSelectedPackage]'));
if (stateIdx < 0) { console.error('ERROR: selectedPackage'); process.exit(1); }

const newStates = [
 ' // Domain search state',
 ' const [selectedDomains, setSelectedDomains] = useState<SelectedDomain[]>([]);',
 ' const [domainSearchResults, setDomainSearchResults] = useState<DomainSearchResult[]>([]);',
 ' const [domainSearching, setDomainSearching] = useState(false);',
 ' const [domainHasSearched, setDomainHasSearched] = useState(false);',
 ' const [domainError, setDomainError] = useState("");',
 ' const [selectedTld, setSelectedTld] = useState(".com");',
 '',
 ' // Payment QR state',
 ' const [paymentQrUrls, setPaymentQrUrls] = useState<{bank?: string; momo?: string}>({});',
 ' const [selectedPayment, setSelectedPayment] = useState<string>("");',
 '',
 ' // Computed domain total',
 ' const selectedDomainTotal = selectedDomains.reduce((s, d) => s + d.price, 0);',
 '',
 ' // Toggle domain selection',
 ' function toggleDomain(domain: string, price: number) {',
 ' setSelectedDomains(prev => {',
 ' const exists = prev.find(d => d.domain === domain);',
 ' if (exists) return prev.filter(d => d.domain !== domain);',
 ' return [...prev, { domain, price }];',
 ' });',
 ' }',
 '',
 ' // Search domain function',
 ' async function searchDomain() {',
 ' if (domainName.trim().length < 2 || !domainName.includes(".")) return;',
 ' setDomainSearching(true);',
 ' setDomainError("");',
 ' try {',
 ` const tld = selectedTld.replace(/^\\./, "");`,
 ' const res = await fetch(`/api/pricing/domain-search?keyword=${encodeURIComponent(domainName)}&tld=${tld}`);',
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
 '',
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
];
lines.splice(stateIdx, 0, ...newStates);
console.log('3. States at line', stateIdx + 1);

// 4. Notes
const notesIdx = lines.findIndex(l => l.includes('notes: `Dịch vụ: ${svc?'));
if (notesIdx >= 0) {
 lines[notesIdx] = ` notes: \`Dịch vụ: \${svc?.title ?? ""} | Tính năng: \${selectedFeatures.length} | Ghi chú đội ngũ: \${talentNote || "—"}\`,`;
 console.log('4. Notes at line', notesIdx + 1);
}

// Write phase 1
fs.writeFileSync(f, lines.join('\n'));
console.log(`Phase 1 done. Lines: ${lines.length}`);

// ── PHASE 2: Use STRING-BASED replacements for domain section ────────────────

c = fs.readFileSync(f, 'utf8');

// 0. Fix purchase timing condition
c = c.replace(
 'domainName && domainName.includes(".") && domainPrices.find(d => domainName.endsWith(d.extension)) && (',
 'domainName && domainName.includes(".") && ('
);

// 1. DOMAIN INPUT UI replacement — find the UNIQUE section to replace
// Original domain input section (from mb-6 to closing of domain UI section)
const OLD_DOMAIN_INPUT = ` <div className="mb-6">
 <label style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>TÊN MIỀN BẠN MUỐN ĐĂNG KÝ</label>
 <div className="flex gap-3">
  <input value={domainName} onChange={e => setDomainName(e.target.value)} placeholder="ví dụ: mysite.com"
 style={{ flex: 1, background: "rgba(15,23,42,0.6)", border: \`1px solid \${DS.border}\`, borderRadius: 10, padding: "12px 16px", color: DS.text, fontSize: 15, outline: "none", fontFamily: DS.body, boxSizing: "border-box" }} />
  {domainPrices.length > 0 && (
 <select value={domainName.includes(".") ? "." + domainName.split(".").pop() : ".com"}
 onChange={e => { const base = domainName.includes(".") ? domainName.split(".")[0] : domainName; setDomainName(base + e.target.value); }}
 style={{ background: "rgba(15,23,42,0.8)", border: \`1px solid \${DS.border}\`, borderRadius: 10, padding: "12px 14px", color: DS.text, fontSize: 14, fontFamily: DS.mono, outline: "none", cursor: "pointer" }}>
 {domainPrices.map(d => <option key={d.extension} value={d.extension} style={{ background: "#0F172A" }}>{d.extension}</option>)}
 </select>
 )}
 </div>
 {(() => {
 const matchedExt = domainName.includes(".") ? domainPrices.find(d => domainName.endsWith(d.extension)) : null;
 return (<>
 {matchedExt && (
 <div className="mt-2 flex items-center gap-2">
 <Check size={11} style={{ color: DS.green }} />
 <span style={{ color: DS.green, fontSize: 11, fontFamily: DS.mono }}>Đăng ký {matchedExt.extension}: {fmtVND(matchedExt.registrationPrice)}/{matchedExt.periodVi}</span>
 <span style={{ color: DS.text5, fontSize: 10 }}>— Gia hạn: {fmtVND(matchedExt.renewalPrice)}/năm</span>
 </div>
 )}
 {domainName && !matchedExt && domainName.includes(".") && (
 <div className="mt-2"><span style={{ color: DS.amber, fontSize: 11 }}>⚠ Không tìm thấy giá cho .{domainName.split(".").pop()}</span></div>
 )}
 {domainName && matchedExt?.note && (
 <div className="mt-1 px-3 py-2 rounded-lg" style={{ background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.2)" }}>
 <span style={{ color: DS.amber, fontSize: 11 }}>{matchedExt.note}</span>
 </div>
 )}
 </>);
 })()}
 </div>`;

const NEW_DOMAIN_INPUT = ` <div className="mb-6">
 <label style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>TÊN MIỀN BẠN MUỐN ĐĂNG KÝ</label>
 <div className="flex gap-3">
 <input
 value={domainName}
 onChange={e => setDomainName(e.target.value)}
 placeholder="ví dụ: mysite.com"
 style={{ flex: 1, background: "rgba(15,23,42,0.6)", border: \`1px solid \${DS.border}\`, borderRadius: 10, padding: "12px 16px", color: DS.text, fontSize: 15, outline: "none", fontFamily: DS.body, boxSizing: "border-box" }}
 />
 {domainPrices.length > 0 && (
 <select
 value={selectedTld}
 onChange={e => { setSelectedTld(e.target.value); setDomainHasSearched(false); setDomainSearchResults([]); }}
 style={{ background: "rgba(15,23,42,0.8)", border: \`1px solid \${DS.border}\`, borderRadius: 10, padding: "12px 14px", color: DS.text, fontSize: 14, fontFamily: DS.mono, outline: "none", cursor: "pointer" }}
 >
 {domainPrices.map(d => <option key={d.extension} value={d.extension} style={{ background: "#0F172A" }}>{d.extension}</option>)}
 </select>
 )}
 </div>

 {/* Search button */}
 <div className="flex gap-2 mt-3">
 <motion.button
 onClick={searchDomain}
 disabled={domainSearching || domainName.trim().length < 2}
 className="flex items-center gap-2 rounded-xl px-5 py-3 font-semibold transition-all disabled:cursor-not-allowed"
 style={{ background: domainSearching ? "rgba(59,130,246,0.1)" : "rgba(59,130,246,0.15)", border: \`1px solid \${DS.blue}50\`, color: DS.blue, cursor: domainSearching ? "not-allowed" : "pointer" }}
 whileHover={domainSearching ? {} : { scale: 1.02 }}
 >
 {domainSearching ? (
 <><div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" /><span>Kiểm tra...</span></>
 ) : (
 <><Search size={16} /><span style={{ fontFamily: DS.mono, fontSize: 13 }}>Kiểm tra</span></>
 )}
 </motion.button>
 </div>

 {domainError && (
 <div className="mt-2 flex items-center gap-2">
 <AlertCircle size={13} style={{ color: DS.red }} />
 <span style={{ color: DS.red, fontSize: 12 }}>{domainError}</span>
 </div>
 )}

 {/* Domain search results */}
 {domainHasSearched && (
 <div className="mt-4 space-y-3">
 {domainSearchResults.length === 0 && (
 <div className="p-4 rounded-xl text-center" style={{ background: "rgba(15,23,42,0.4)", border: \`1px solid \${DS.border}\` }}>
 <span style={{ color: DS.text4, fontSize: 13 }}>Không tìm thấy kết quả</span>
 </div>
 )}
 {domainSearchResults.length > 0 && (
 <div>

 {/* Primary domain */}
 {(() => {
 const primary = domainSearchResults[0];
 if (!primary) return null;
 const isSel = selectedDomains.some(d => d.domain === primary.domain);
 const avail = primary.available && (primary.price ?? 0) > 0;
 return (
 <div className="mb-3">
 {avail ? (
 <div>
 <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 6 }}>DOMAIN CHÍNH</div>
 <div className="flex items-center justify-between p-4 rounded-xl cursor-pointer"
  style={{ background: isSel ? \`rgba(59,130,246,0.12)\` : \`rgba(34,197,94,0.06)\`, border: isSel ? \`1.5px solid \${DS.blue}\` : \`1px solid \${DS.green}30\` }}
 onClick={() => { if(avail) toggleDomain(primary.domain, primary.price ?? 0); }}
 >
 <div className="flex items-center gap-3">
 <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: isSel ? \`\${DS.blue}25\` : \`\${DS.green}20\`, border: isSel ? \`2px solid \${DS.blue}\` : \`2px solid \${DS.green}\` }}>
 <Check size={12} style={{ color: isSel ? DS.blue : DS.green }} />
 </div>
 <span style={{ color: DS.text, fontSize: 14, fontFamily: DS.mono, fontWeight: 700 }}>{primary.domain}</span>
 </div>
 <div className="flex items-center gap-3">
 {isSel && <span style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono, background: \`\${DS.blue}15\`, padding: "2px 8px", borderRadius: 6 }}>Đã chọn</span>}
 {primary.price > 0 && <span style={{ color: DS.green, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>{fmtVND(primary.price)}</span>}
 </div>
 </div>
 </div>
 ) : (
 <div>
 <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 6 }}>DOMAIN CHÍNH</div>
 <div className="flex items-center justify-between p-4 rounded-xl"
 style={{ background: "rgba(255,255,255,0.03)", border: \`1px solid \${DS.border}\`, opacity: 0.7 }}
 >
 <div className="flex items-center gap-3">
 <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
 <X size={12} style={{ color: DS.text4 }} />
 </div>
 <div>
 <span style={{ color: DS.text3, fontSize: 14, fontFamily: DS.mono, fontWeight: 600 }}>{primary.domain}</span>
 <span style={{ color: DS.red, fontSize: 11, marginLeft: 8 }}>(đã được đăng ký)</span>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 );
 })()}

 {/* Alternative TLDs */}
 {domainSearchResults.length > 1 && (
 <div className="mt-3">
 <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 8 }}>GỢI Ý KHÁC</div>
 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
 {domainSearchResults.slice(1).map(result => {
 const isSel = selectedDomains.some(d => d.domain === result.domain);
 const avail = result.available && (result.price ?? 0) > 0;
 return (
 <div key={result.domain}
  className="flex items-center justify-between p-3 rounded-xl cursor-pointer"
 style={{ background: isSel ? \`rgba(59,130,246,0.12)\` : avail ? \`rgba(34,197,94,0.06)\` : "rgba(255,255,255,0.03)", border: isSel ? \`1.5px solid \${DS.blue}\` : avail ? \`1px solid \${DS.green}30\` : \`1px solid \${DS.border}\`, opacity: avail ? 1 : 0.6 }}
 onClick={() => { if(avail) toggleDomain(result.domain, result.price ?? 0); }}
 >
 <div className="flex items-center gap-2">
 <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: isSel ? \`\${DS.blue}20\` : \`\${DS.green}15\` }}>
 {isSel ? <Check size={9} style={{ color: DS.blue }} /> : avail ? <Check size={9} style={{ color: DS.green }} /> : <X size={9} style={{ color: DS.text4 }} />}
 </div>
 <span style={{ color: avail ? DS.text : DS.text3, fontSize: 12, fontFamily: DS.mono }}>{result.domain}</span>
 </div>
 {avail && result.price > 0 && (
 <span style={{ color: DS.green, fontSize: 11, fontFamily: DS.mono, fontWeight: 600 }}>{fmtVND(result.price)}</span>
 )}
 </div>
 );
 })}
 </div>
 </div>
 )}

 {/* Selected summary */}
 {selectedDomains.length > 0 && (
 <div className="mt-4 p-3 rounded-xl" style={{ background: \`\${DS.blue}08\`, border: \`1px solid \${DS.blue}25\` }}>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Check size={13} style={{ color: DS.blue }} />
 <span style={{ color: DS.blue, fontSize: 12, fontFamily: DS.mono }}>Đã chọn {selectedDomains.length} domain</span>
 </div>
 <span style={{ color: DS.blue, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>{fmtVND(selectedDomainTotal)}</span>
 </div>
 <div className="mt-2 flex flex-wrap gap-2">
 {selectedDomains.map(d => (
 <span key={d.domain} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{ background: \`\${DS.blue}15\`, color: DS.blue, fontFamily: DS.mono }}>
 {d.domain}
 <button onClick={() => toggleDomain(d.domain, d.price)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: DS.blue, display: "flex" }}>
 <X size={10} />
 </button>
 </span>
 ))}
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 )}
 </div>`;

if (c.includes(OLD_DOMAIN_INPUT)) {
 c = c.replace(OLD_DOMAIN_INPUT, NEW_DOMAIN_INPUT);
 console.log('2. Domain input section replaced');
} else {
 console.log('2. WARNING: Domain input pattern not found exactly. Trying partial match...');
 // Try to find the start of the section
 const startMarker = '<label style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>TÊN MIỀN BẠN MUỐN ĐĂNG KÝ</label>';
 const startIdx = c.indexOf(startMarker);
 if (startIdx >= 0) {
 // Find the mb-6 div before this
 const mb6Start = c.lastIndexOf('<div className="mb-6">', startIdx);
 const mb6End = c.indexOf(' </div>\n\n {/* Purchase timing */}', startIdx);
 if (mb6Start >= 0 && mb6End >= 0) {
 const oldSection = c.substring(mb6Start, mb6End + ' </div>'.length + 1);
 c = c.replace(oldSection, NEW_DOMAIN_INPUT);
 console.log('2. Domain input section replaced (partial match)');
 } else {
 console.log('2. ERROR: Could not find domain section boundaries');
 }
 }
}

fs.writeFileSync(f, c);
console.log(`Phase 2 done. Lines: ${c.split('\n').length}`);
