// apply_wizard_phase2_v2.mjs — Domain UI replacement + Schedule removal + Payment update
import fs from 'fs';

const f = 'src/components/landing/BookingWizardClient.tsx';
let c = fs.readFileSync(f, 'utf8');
let lines = c.split('\n');
console.log(`File: ${lines.length} lines`);

const BT = '`';

// ── 0. Fix purchase timing condition ─────────────────────────────────────
const timingIdx = lines.findIndex(l => l.includes('domainName && domainName.includes(".") && domainPrices.find'));
if (timingIdx >= 0) {
 lines[timingIdx] = lines[timingIdx].replace(
 'domainName && domainName.includes(".") && domainPrices.find(d => domainName.endsWith(d.extension)) && (',
 'domainName && domainName.includes(".") && ('
 );
 console.log('0. Timing condition updated at line', timingIdx + 1);
}

// ── 1. Replace domain input section (lines 1165-1198) ──────────────────
// Find <div className="mb-6"> just before the TÊN MIỀN label
const labelIdx = lines.findIndex(l => l.includes('TÊN MIỀN BẠN MUỐN ĐĂNG KÝ'));
let mb6Idx = -1;
for (let j = labelIdx; j >= 0; j--) {
 if (lines[j].includes('<div className="mb-6">')) { mb6Idx = j; break; }
}
console.log('1. Domain section: mb-6 at line', mb6Idx + 1, ', label at line', labelIdx + 1);
// Old section ends at line 1198 (the </div> closing the input section)
// Find closing </div>: the one after })();}
let domainEndIdx = -1;
for (let k = labelIdx; k < lines.length; k++) {
 if (lines[k].trim() === '</div>' && k > labelIdx) {
 domainEndIdx = k;
 break;
 }
}
console.log(' Domain section end: line', domainEndIdx + 1);

const newDomainUI = [
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
 ')}',
];

// Replace lines mb6Idx to domainEndIdx
lines = lines.slice(0, mb6Idx).concat(newDomainUI).concat(lines.slice(domainEndIdx + 1));
console.log('Domain UI replaced. Lines now:', lines.length);

// Re-read from string to update
c = lines.join('\n');
lines = c.split('\n');

// ── 2. Remove schedule section ──────────────────────────────────────────
const schedIdx = lines.findIndex(l => l.includes('Lịch trình</h4>'));
if (schedIdx >= 0) {
 let schedStart = -1;
 for (let j = schedIdx; j >= 0; j--) {
 if (lines[j].includes('<div className="mb-5">')) { schedStart = j; break; }
 }
 if (schedStart >= 0) {
 // Find closing </div>
 let depth = 0, schedEnd = -1;
 for (let k = schedStart; k < lines.length; k++) {
 const l = lines[k];
 if (l.includes('<div')) depth += (l.match(/<div/g) || []).length;
 if (l.includes('</div>')) depth -= (l.match(/<\/div>/g) || []).length;
 if (depth === 0 && k > schedStart) { schedEnd = k; break; }
 }
 if (schedEnd >= 0) {
 lines = lines.slice(0, schedStart).concat(lines.slice(schedEnd + 1));
 console.log('2. Schedule removed: lines', schedStart + 1, '-', schedEnd + 1);
 } else {
 console.log('2. Schedule end not found');
 }
 }
}

// Re-read from string
c = lines.join('\n');
lines = c.split('\n');

// ── 3. Replace payment method buttons ──────────────────────────────────
const pmtIdx = lines.findIndex(l => l.includes('{ id: "bank", label: t("bankTransfer")'));
if (pmtIdx >= 0) {
 let pmtStart = -1;
 for (let j = pmtIdx; j >= 0; j--) {
 if (lines[j].includes('<div className="mb-4">')) { pmtStart = j; break; }
 }
 if (pmtStart >= 0) {
 // Find closing </div>
 let depth = 0, pmtEnd = -1;
 for (let k = pmtStart; k < lines.length; k++) {
 const l = lines[k];
 if (l.includes('<div')) depth += (l.match(/<div/g) || []).length;
 if (l.includes('</div>')) depth -= (l.match(/<\/div>/g) || []).length;
 if (depth === 0 && k > pmtStart) { pmtEnd = k; break; }
 }
 console.log('3. Payment section: lines', pmtStart + 1, '-', pmtEnd + 1);

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
console.log(`Phase 2 done. Final: ${lines.length} lines`);
