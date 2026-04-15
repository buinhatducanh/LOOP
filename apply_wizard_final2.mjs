// apply_wizard_final2.mjs — All changes with CORRECT bracket nesting
import fs from 'fs';

const f = 'src/components/landing/BookingWizardClient.tsx';
let c = fs.readFileSync(f, 'utf8');
let lines = c.split('\n');
console.log(`File: ${lines.length} lines`);

const BT = '`';

// ── PHASE 1 ─────────────────────────────────────────────────────────────────

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

// 3. Domain + payment states
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

// 4. Price calc
const priceIdx = lines.findIndex(l => l.includes('const domainTotal = domainPurchaseNow'));
if (priceIdx >= 0) {
 lines[priceIdx] = ' const domainTotal = domainPurchaseNow ? selectedDomainTotal : 0;';
 console.log('4. Price calc at line', priceIdx + 1);
}

// 5. Notes
const notesIdx = lines.findIndex(l => l.includes('notes: `Dịch vụ: ${svc?'));
if (notesIdx >= 0) {
 lines[notesIdx] = ` notes: \`Dịch vụ: \${svc?.title ?? ""} | Tính năng: \${selectedFeatures.length} | Ghi chú đội ngũ: \${talentNote || "—"}\`,`;
 console.log('5. Notes at line', notesIdx + 1);
}

// 6. Domain submit
const domainSubmitIdx = lines.findIndex((l, i) => l.includes('domainName: domainName') && i > 500);
if (domainSubmitIdx >= 0) {
 lines[domainSubmitIdx] = " selectedDomains: selectedDomains.length > 0 ? selectedDomains : (domainName ? [{ domain: domainName, price: selectedDomainTotal }] : []),";
 console.log('6. Domain submit at line', domainSubmitIdx + 1);
}

fs.writeFileSync(f, lines.join('\n'));
console.log(`Phase 1 done. Lines: ${lines.length}`);

// ── PHASE 2 ─────────────────────────────────────────────────────────────────

c = fs.readFileSync(f, 'utf8');
lines = c.split('\n');

// Find the START of the domain section: mb-6 just before TÊN MIỀN label
const labelIdx = lines.findIndex(l => l.includes('TÊN MIỀN BẠN MUỐN ĐĂNG KÝ</label>'));
let mb6Idx = -1;
for (let j = labelIdx; j >= 0; j--) {
 if (lines[j].includes('<div className="mb-6">')) { mb6Idx = j; break; }
}

// Find the END: closing </div> of the outer step 1 wrapper
// Look for </div> + empty + {step === 2} pattern
let step1EndIdx = -1;
for (let k = labelIdx; k < lines.length; k++) {
 if (lines[k].includes('{step === 2')) {
 // The step 1 wrapper closes just before this
 for (let m = k - 1; m >= 0; m--) {
 if (lines[m].trim() === '</div>') { step1EndIdx = m; break; }
 }
 break;
 }
}
console.log('Domain section: mb-6 at line', mb6Idx + 1, ', step1 end at line', step1EndIdx + 1);

// 0. Fix purchase timing condition (find and update)
const timingCondIdx = lines.findIndex(l => l.includes('domainPrices.find(d => domainName.endsWith(d.extension))'));
if (timingCondIdx >= 0) {
 lines[timingCondIdx] = lines[timingCondIdx].replace(
 'domainPrices.find(d => domainName.endsWith(d.extension)) && (',
 '( '
 );
 console.log('0. Timing condition at line', timingCondIdx + 1);
}

// Build NEW domain section
// Structure mirrors original: outer wrapper > inner content > purchase timing > domain price table
// Each div has its own conditional wrapper (except purchase timing which reuses outer wrapper condition)
const newDomainSection = [
 // === OUTER WRAPPER: contains domain input + purchase timing ===
 // Opens at mb6Idx, closes at the end of newDomainSection

 // ── Domain Input UI ──
 ' <div className="mb-6">',
 ' <label style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>TÊN MIỀN BẠN MUỐN ĐĂNG KÝ</label>',
 ' <div className="flex gap-3">',
 ' <input',
 ' value={domainName}',
 ' onChange={e => setDomainName(e.target.value)}',
 ' placeholder="ví dụ: mysite.com"',
 ' style={{ flex: 1, background: "rgba(15,23,42,0.6)", border: ' + BT + '${DS.border}' + BT + ', borderRadius: 10, padding: "12px 16px", color: DS.text, fontSize: 15, outline: "none", fontFamily: DS.body, boxSizing: "border-box" }} />',
 ' {domainPrices.length > 0 && (',
 ' <select value={selectedTld}',
 ' onChange={e => { setSelectedTld(e.target.value); setDomainHasSearched(false); setDomainSearchResults([]); }}',
 ' style={{ background: "rgba(15,23,42,0.8)", border: ' + BT + '${DS.border}' + BT + ', borderRadius: 10, padding: "12px 14px", color: DS.text, fontSize: 14, fontFamily: DS.mono, outline: "none", cursor: "pointer" }}>',
 ' {domainPrices.map(d => <option key={d.extension} value={d.extension} style={{ background: "#0F172A" }}>{d.extension}</option>)}',
 ' </select>',
 ' )}',
 ' </div>',
 '',
 ' {/* Search button */}',
 ' <div className="flex gap-2 mt-3">',
 ' <motion.button onClick={searchDomain}',
 ' disabled={domainSearching || domainName.trim().length < 2}',
 ' className="flex items-center gap-2 rounded-xl px-5 py-3 font-semibold transition-all disabled:cursor-not-allowed"',
 ' style={{ background: domainSearching ? "rgba(59,130,246,0.1)" : "rgba(59,130,246,0.15)", border: ' + BT + '${DS.blue}50' + BT + ', color: DS.blue, cursor: domainSearching ? "not-allowed" : "pointer" }}',
 ' whileHover={domainSearching ? {} : { scale: 1.02 }}>',
 ' {domainSearching ? (',
 ' <><div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" /><span>Kiểm tra...</span></>',
 ' ) : (',
 ' <><Search size={16} /><span style={{ fontFamily: DS.mono, fontSize: 13 }}>Kiểm tra</span></>',
 ' )}',
 ' </motion.button>',
 ' </div>',
 '',
 ' {domainError && (',
 ' <div className="mt-2 flex items-center gap-2">',
 ' <AlertCircle size={13} style={{ color: DS.red }} />',
 ' <span style={{ color: DS.red, fontSize: 12 }}>{domainError}</span>',
 ' </div>',
 ' )}',
 '',
 ' {/* Domain search results */}',
 ' {domainHasSearched && (',
 ' <div className="mt-4 space-y-3">',
 ' {domainSearchResults.length === 0 && (',
 ' <div className="p-4 rounded-xl text-center" style={{ background: "rgba(15,23,42,0.4)", border: ' + BT + '${DS.border}' + BT + ' }}>',
 ' <span style={{ color: DS.text4, fontSize: 13 }}>Không tìm thấy kết quả</span>',
 ' </div>',
 ' )}',
 ' {domainSearchResults.length > 0 && (',
 ' <div>',
 '',
 ' {/* Primary domain */}',
 ' {(() => {',
 ' const primary = domainSearchResults[0];',
 ' if (!primary) return null;',
 ' const isSel = selectedDomains.some(d => d.domain === primary.domain);',
 ' const avail = primary.available && (primary.price ?? 0) > 0;',
 ' return (',
 ' <div className="mb-3">',
 ' {avail ? (',
 ' <div>',
 ' <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 6 }}>DOMAIN CHÍNH</div>',
 ' <div className="flex items-center justify-between p-4 rounded-xl cursor-pointer"',
 ' style={{ background: isSel ? ' + BT + 'rgba(59,130,246,0.12)' + BT + ' : ' + BT + 'rgba(34,197,94,0.06)' + BT + ', border: isSel ? ' + BT + '1.5px solid ${DS.blue}' + BT + ' : ' + BT + '1px solid ${DS.green}30' + BT + ' }}',
 ' onClick={() => { if(avail) toggleDomain(primary.domain, primary.price ?? 0); }}>',
 ' <div className="flex items-center gap-3">',
 ' <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: isSel ? ' + BT + '${DS.blue}25' + BT + ' : ' + BT + '${DS.green}20' + BT + ', border: isSel ? ' + BT + '2px solid ${DS.blue}' + BT + ' : ' + BT + '2px solid ${DS.green}' + BT + ' }}>',
 ' <Check size={12} style={{ color: isSel ? DS.blue : DS.green }} />',
 ' </div>',
 ' <span style={{ color: DS.text, fontSize: 14, fontFamily: DS.mono, fontWeight: 700 }}>{primary.domain}</span>',
 ' </div>',
 ' <div className="flex items-center gap-3">',
 ' {isSel && <span style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono, background: ' + BT + '${DS.blue}15' + BT + ', padding: "2px 8px", borderRadius: 6 }}>Đã chọn</span>}',
 ' {primary.price > 0 && <span style={{ color: DS.green, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>{fmtVND(primary.price)}</span>}',
 ' </div>',
 ' </div>',
 ' </div>',
 ' ) : (',
 ' <div>',
 ' <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 6 }}>DOMAIN CHÍNH</div>',
 ' <div className="flex items-center justify-between p-4 rounded-xl"',
 ' style={{ background: "rgba(255,255,255,0.03)", border: ' + BT + '${DS.border}' + BT + ', opacity: 0.7 }}>',
 ' <div className="flex items-center gap-3">',
 ' <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>',
 ' <X size={12} style={{ color: DS.text4 }} />',
 ' </div>',
 ' <div>',
 ' <span style={{ color: DS.text3, fontSize: 14, fontFamily: DS.mono, fontWeight: 600 }}>{primary.domain}</span>',
 ' <span style={{ color: DS.red, fontSize: 11, marginLeft: 8 }}>(đã được đăng ký)</span>',
 ' </div>',
 ' </div>',
 ' </div>',
 ' </div>',
 ' )}',
 ' </div>',
 ' );',
 ' })()}',
 '',
 ' {/* Alternative TLDs */}',
 ' {domainSearchResults.length > 1 && (',
 ' <div className="mt-3">',
 ' <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 8 }}>GỢI Ý KHÁC</div>',
 ' <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>',
 ' {domainSearchResults.slice(1).map(result => {',
 ' const isSel = selectedDomains.some(d => d.domain === result.domain);',
 ' const avail = result.available && (result.price ?? 0) > 0;',
 ' return (',
 ' <div key={result.domain}',
 ' className="flex items-center justify-between p-3 rounded-xl cursor-pointer"',
 ' style={{ background: isSel ? ' + BT + 'rgba(59,130,246,0.12)' + BT + ' : avail ? ' + BT + 'rgba(34,197,94,0.06)' + BT + ' : "rgba(255,255,255,0.03)", border: isSel ? ' + BT + '1.5px solid ${DS.blue}' + BT + ' : avail ? ' + BT + '1px solid ${DS.green}30' + BT + ' : ' + BT + '${DS.border}' + BT + ', opacity: avail ? 1 : 0.6 }}',
 ' onClick={() => { if(avail) toggleDomain(result.domain, result.price ?? 0); }}>',
 ' <div className="flex items-center gap-2">',
 ' <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: isSel ? ' + BT + '${DS.blue}20' + BT + ' : ' + BT + '${DS.green}15' + BT + ' }}>',
 ' {isSel ? <Check size={9} style={{ color: DS.blue }} /> : avail ? <Check size={9} style={{ color: DS.green }} /> : <X size={9} style={{ color: DS.text4 }} />}',
 ' </div>',
 ' <span style={{ color: avail ? DS.text : DS.text3, fontSize: 12, fontFamily: DS.mono }}>{result.domain}</span>',
 ' </div>',
 ' {avail && result.price > 0 && (',
 ' <span style={{ color: DS.green, fontSize: 11, fontFamily: DS.mono, fontWeight: 600 }}>{fmtVND(result.price)}</span>',
 ' )}',
 ' </div>',
 ' );',
 ' })}',
 ' </div>',
 ' </div>',
 ' )}',
 '',
 ' {/* Selected summary */}',
 ' {selectedDomains.length > 0 && (',
 ' <div className="mt-4 p-3 rounded-xl" style={{ background: ' + BT + '${DS.blue}08' + BT + ', border: ' + BT + '${DS.blue}25' + BT + ' }}>',
 ' <div className="flex items-center justify-between">',
 ' <div className="flex items-center gap-2">',
 ' <Check size={13} style={{ color: DS.blue }} />',
 ' <span style={{ color: DS.blue, fontSize: 12, fontFamily: DS.mono }}>Đã chọn {selectedDomains.length} domain</span>',
 ' </div>',
 ' <span style={{ color: DS.blue, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>{fmtVND(selectedDomainTotal)}</span>',
 ' </div>',
 ' <div className="mt-2 flex flex-wrap gap-2">',
 ' {selectedDomains.map(d => (',
 ' <span key={d.domain} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{ background: ' + BT + '${DS.blue}15' + BT + ', color: DS.blue, fontFamily: DS.mono }}>',
 ' {d.domain}',
 ' <button onClick={() => toggleDomain(d.domain, d.price)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: DS.blue, display: "flex" }}>',
 ' <X size={10} />',
 ' </button>',
 ' </span>',
 ' ))}',
 ' </div>',
 ' </div>',
 ' )}',
 ' </div>',
 ' )}',
 ' </div>',
 ' )}',
 ' </div>',
 ')',
 // === DOMAIN INPUT CLOSES, PURCHASE TIMING STARTS ===

 // ── Purchase Timing ──
 ' {domainName && domainName.includes(".") && (',
 ' <div className="mb-6 p-4 rounded-xl" style={{ background: "rgba(15,23,42,0.5)", border: ' + BT + '${DS.border}' + BT + ' }}>',
 ' <div style={{ color: DS.text2, fontSize: 12, fontFamily: DS.mono, marginBottom: 12 }}>BẠN MUỐN ĐĂNG KÝ KHI NÀO?</div>',
 ' <div className="flex flex-col sm:flex-row gap-3">',
 ' {[{ now: true, label: "Đăng ký ngay bây giờ", desc: "Domain được đăng ký trước khi bàn giao web.", color: DS.blue, bg: "rgba(59,130,246,0.1)", border: "1.5px solid rgba(59,130,246,0.4)" },',
 ' { now: false, label: "Mua sau khi bàn giao", desc: "Bạn tự chuẩn bị domain riêng.", color: DS.purple, bg: "rgba(129,140,248,0.08)", border: "1.5px solid rgba(129,140,248,0.3)" }',
 ' ].map(opt => (',
 ' <motion.button key={String(opt.now)} onClick={() => setDomainPurchaseNow(opt.now)} className="flex-1 text-left p-4 rounded-xl"',
 ' style={{ background: domainPurchaseNow === opt.now ? opt.bg : "rgba(15,23,42,0.3)", border: domainPurchaseNow === opt.now ? opt.border : ' + BT + '1px solid ${DS.border}' + BT + ', cursor: "pointer" }}',
 ' whileHover={{ scale: 1.01 }}>',
 ' <div className="flex items-center gap-2 mb-2">',
 ' <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: domainPurchaseNow === opt.now ? opt.color : "transparent", border: domainPurchaseNow === opt.now ? "none" : ' + BT + '1.5px solid ${DS.text4}' + BT + ' }}>',
 ' {domainPurchaseNow === opt.now && <Check size={9} style={{ color: "#fff" }} />}',
 ' </div>',
 ' <span style={{ color: DS.text, fontSize: 13, fontWeight: 600 }}>{opt.label}</span>',
 ' </div>',
 ' <div style={{ color: DS.text4, fontSize: 11, marginLeft: 24 }}>{opt.desc}</div>',
 ' </motion.button>',
 ' ))}',
 ' </div>',
 ' </div>',
 ' )}',
 // === PURCHASE TIMING CLOSES ===

 // ── Domain Price Table ──
 ' {domainPrices.length > 0 && (',
 ' <div>',
 ' <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 8 }}>BẢNG GIÁ TÊN MIỀN (tham khảo)</div>',
 ' <div className="overflow-x-auto rounded-xl" style={{ border: ' + BT + '1px solid ${DS.border}' + BT + ' }}>',
 ' <table style={{ width: "100%", borderCollapse: "collapse" }}>',
 ' <thead>',
 ' <tr style={{ background: "rgba(15,23,42,0.8)" }}>',
 ' {["ĐUÔI", "ĐĂNG KÝ", "GIA HẠN", "GHI CHÚ"].map((h, i) => (',
 ' <th key={h} style={{ padding: "10px 14px", textAlign: i === 1 || i === 2 ? "right" : "left", color: DS.text4, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", borderBottom: ' + BT + '1px solid ${DS.border}' + BT + ' }}>{h}</th>',
 ' ))}',
 ' </tr>',
 ' </thead>',
 ' <tbody>',
 ' {domainPrices.map(d => (',
 ' <tr key={d.extension} style={{ borderBottom: ' + BT + '1px solid ${DS.border}' + BT + ' }}>',
 ' <td style={{ padding: "10px 14px" }}><span style={{ color: DS.blue, fontFamily: DS.mono, fontSize: 13, fontWeight: 700 }}>{d.extension}</span></td>',
 ' <td style={{ padding: "10px 14px", textAlign: "right" }}><span style={{ color: DS.text, fontFamily: DS.mono, fontSize: 12 }}>{fmtVND(d.registrationPrice)}</span></td>',
 ' <td style={{ padding: "10px 14px", textAlign: "right" }}><span style={{ color: DS.text4, fontFamily: DS.mono, fontSize: 12 }}>{fmtVND(d.renewalPrice)}</span></td>',
 ' <td style={{ padding: "10px 14px" }}><span style={{ color: d.note ? DS.text4 : DS.text5, fontSize: 11 }}>{d.note || "—"}</span></td>',
 ' </tr>',
 ' ))}',
 ' </tbody>',
 ' </table>',
 ' </div>',
 ' </div>',
 ' )}',
 // === DOMAIN PRICE TABLE CLOSES, OUTER WRAPPER CLOSES ===
 ')',
];

// Replace domain section
lines = lines.slice(0, mb6Idx).concat(newDomainSection).concat(lines.slice(step1EndIdx + 1));
console.log('Domain section replaced. Lines now:', lines.length);

// ── PHASE 3 ─────────────────────────────────────────────────────────────────

c = lines.join('\n');
lines = c.split('\n');

// 2. Remove schedule section
const schedIdx = lines.findIndex(l => l.includes('Lịch trình</h4>'));
if (schedIdx >= 0) {
 let schedStart = -1;
 for (let j = schedIdx; j >= 0; j--) {
 if (lines[j].includes('<div className="mb-5">')) { schedStart = j; break; }
 }
 if (schedStart >= 0) {
 let depth = 0, schedEnd = -1;
 for (let k = schedStart; k < lines.length; k++) {
 const l = lines[k];
 const opens = (l.match(/<div /g) || []).length + (l.match(/<div>/g) || []).length;
 const closes = (l.match(/<\/div>/g) || []).length;
 if (depth === 0) depth += opens;
 else depth += opens - closes;
 if (depth === 0 && k > schedStart) { schedEnd = k; break; }
 }
 if (schedEnd >= 0) {
 lines = lines.slice(0, schedStart).concat(lines.slice(schedEnd + 1));
 console.log('2. Schedule removed:', schedStart + 1, '-', schedEnd + 1);
 } else {
 console.log('2. Schedule end not found');
 }
 }
}

// 3. Replace payment method buttons
c = lines.join('\n');
lines = c.split('\n');

const pmtIdx = lines.findIndex(l => l.includes('{ id: "bank", label: t("bankTransfer")'));
if (pmtIdx >= 0) {
 let pmtStart = -1;
 for (let j = pmtIdx; j >= 0; j--) {
 if (lines[j].includes('<div className="mb-4">')) { pmtStart = j; break; }
 }
 if (pmtStart >= 0) {
 let depth = 0, pmtEnd = -1;
 for (let k = pmtStart; k < lines.length; k++) {
 const l = lines[k];
 const opens = (l.match(/<div /g) || []).length + (l.match(/<div>/g) || []).length;
 const closes = (l.match(/<\/div>/g) || []).length;
 if (depth === 0) depth += opens;
 else depth += opens - closes;
 if (depth === 0 && k > pmtStart) { pmtEnd = k; break; }
 }
 console.log('3. Payment section:', pmtStart + 1, '-', pmtEnd + 1);

 const newPayment = [
 ' {/* Payment method */}',
 ' <div className="mb-4">',
 ' <label style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>Hình thức thanh toán</label>',
 ' <div className="flex gap-3 flex-wrap">',
 ' <button onClick={() => setSelectedPayment("bank")}',
 ' style={{ padding: "10px 20px", borderRadius: 10, fontSize: 13, cursor: "pointer",',
 ' background: selectedPayment === "bank" ? "rgba(34,197,94,0.12)" : "rgba(15,23,42,0.5)",',
 ' border: ' + BT + '${selectedPayment === "bank" ? DS.green : DS.border}' + BT + ',',
 ' color: selectedPayment === "bank" ? DS.green : DS.text3,',
 ' display: "flex", alignItems: "center", gap: 8, fontFamily: DS.mono, fontWeight: selectedPayment === "bank" ? 600 : 400 }}>',
 ' <span style={{ fontSize: 16 }}>🏦</span>Chuyển khoản ngân hàng',
 ' </button>',
 ' <button onClick={() => setSelectedPayment("momo")}',
 ' style={{ padding: "10px 20px", borderRadius: 10, fontSize: 13, cursor: "pointer",',
 ' background: selectedPayment === "momo" ? "rgba(236,72,153,0.12)" : "rgba(15,23,42,0.5)",',
 ' border: ' + BT + '${selectedPayment === "momo" ? DS.pink : DS.border}' + BT + ',',
 ' color: selectedPayment === "momo" ? DS.pink : DS.text3,',
 ' display: "flex", alignItems: "center", gap: 8, fontFamily: DS.mono, fontWeight: selectedPayment === "momo" ? 600 : 400 }}>',
 ' <span style={{ fontSize: 16 }}>💜</span>Ví MoMo',
 ' </button>',
 ' </div>',
 ' </div>',
 '',
 ' {selectedPayment && (',
 ' <div className="mb-4 p-4 rounded-xl" style={{ background: "rgba(15,23,42,0.7)", border: ' + BT + '${DS.border}' + BT + ', textAlign: "center" }}>',
 ' {(selectedPayment === "bank" ? paymentQrUrls.bank : paymentQrUrls.momo) ? (',
 ' <div>',
 ' <div style={{ color: DS.text3, fontSize: 11, fontFamily: DS.mono, letterSpacing: "0.1em", marginBottom: 12 }}>',
 ' {selectedPayment === "bank" ? "QUÉT MÃ QR NGÂN HÀNG" : "QUÉT MÃ QR MOMO"}',
 ' </div>',
 ' <img',
 ' src={selectedPayment === "bank" ? paymentQrUrls.bank : paymentQrUrls.momo},',
 ' alt="QR Code",',
 ' style={{ maxWidth: 220, maxHeight: 220, borderRadius: 12, border: ' + BT + '${DS.border}' + BT + ' }}',
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

 lines = lines.slice(0, pmtStart).concat(newPayment).concat(lines.slice(pmtEnd + 1));
 console.log('Payment section replaced. Lines now:', lines.length);
 }
}

fs.writeFileSync(f, lines.join('\n'));
console.log(`\nDone! Final: ${lines.length} lines`);
