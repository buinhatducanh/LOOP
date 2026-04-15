const fs = require('fs');
let lines = fs.readFileSync('src/components/landing/BookingWizardClient.tsx', 'utf8').split('\n');
let changes = 0;

// ── 0. Helper ────────────────────────────────────────────────────────────────
function splice(start, end, newLines) {
 const before = lines.slice(0, start);
 const after = lines.slice(end + 1);
 lines = [...before, ...newLines.split('\n'), ...after];
}
function idx(pattern) { return lines.findIndex(l => l.includes(pattern)); }
function multiIdx(patterns) { return patterns.map(p => lines.findIndex(l => l.includes(p))); }

// ════════════════════════════════════════════════════════════════════════════
// P1: Add selectedDomains state + toggleDomain + selectedDomainTotal
// ════════════════════════════════════════════════════════════════════════════
const domainErrorLine = idx('const [domainError, setDomainError]');
const p1Code = `
 // ── Domain selection from search results ──────────────────────────────────
 const [selectedDomains, setSelectedDomains] = useState<{domain: string; price: number}[]>([]);
 const toggleDomain = (domain: string, price: number) => {
 setSelectedDomains(prev => {
 const exists = prev.find(d => d.domain === domain);
 if (exists) return prev.filter(d => d.domain !== domain);
 return [...prev, { domain, price }];
 });
 };
 const selectedDomainTotal = selectedDomains.reduce((s, d) => s + (d.price ?? 0), 0);`;
lines.splice(domainErrorLine + 1, 0, p1Code);
changes++;
console.log('P1: selectedDomains state added at L' + (domainErrorLine + 1));

// ════════════════════════════════════════════════════════════════════════════
// P3: Replace hardcoded TLD dropdown with domainPrices.map
// ════════════════════════════════════════════════════════════════════════════
const tldLine = idx('"vn", "com.vn", "com", "net"');
lines[tldLine] = lines[tldLine].replace(
 /\{"\? vn", "com\.vn", "com", "net", "io", "co", "org", "info", "biz"\]\.map\(ext =>/,
 '{domainPrices.length > 0 ? domainPrices.map(d => '
);
lines[tldLine] = lines[tldLine].replace(
 /<option key=\{ext\} value=\{ext\}/,
 '<option key={d.extension} value={d.extension}'
);
lines[tldLine] = lines[tldLine].replace(
 /\{ext\}<\/option>\)/,
 '{d.extension}</option>) : ["vn","com.vn","com","net","io","co","org","info","biz"].map(ext => <option key={ext} value={ext}>{ext}</option>)}'
);
changes++;
console.log('P3: TLD dropdown replaced at L' + (tldLine + 1));

// ════════════════════════════════════════════════════════════════════════════
// P2: Replace domain results UI (flat list → primary + alternatives + summary)
// ════════════════════════════════════════════════════════════════════════════
const resultsStart = idx('{/* Domain search results */}');
// Find closing: }) and then </div> — count braces
let depth = 0, resultsEnd = resultsStart;
for (let i = resultsStart; i < lines.length; i++) {
 if (lines[i].includes('<')) depth += (lines[i].match(/</g) || []).length;
 if (lines[i].includes('>')) depth -= (lines[i].match(/>/g) || []).length;
 if (depth === 0 && i > resultsStart) { resultsEnd = i; break; }
}
console.log('P2: Domain results section L' + (resultsStart + 1) + '–' + (resultsEnd + 1));

const newResults = ` {/* Domain search results */}
 {domainHasSearched && (
 <div className="mt-4 space-y-3">

 {domainSearchResults.length === 0 && (
 <div className="p-4 rounded-xl text-center" style={{ background: "rgba(15,23,42,0.4)", border: \`1px solid \${DS.border}\` }}>
 <span style={{ color: DS.text4, fontSize: 13 }}>Không tìm thấy kết quả</span>
 </div>
 )}

 {/* Primary domain + Alternatives */}
 {domainSearchResults.length > 0 && (
 <div>

 {/* ── Primary domain ── */}
 {(() => {
 const primary = domainSearchResults[0];
 const isSelected = selectedDomains.some(d => d.domain === primary.domain);
 const isAvailable = primary.available;
 return (
 <div className="mb-3">
 {isAvailable ? (
 <div>
 <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 6 }}>DOMAIN CHÍNH</div>
 <div
 className="flex items-center justify-between p-4 rounded-xl cursor-pointer"
 style={{
 background: isSelected ? \`rgba(59,130,246,0.12)\` : \`rgba(34,197,94,0.06)\`,
 border: isSelected ? \`1.5px solid \${DS.blue}\` : \`1px solid \${DS.green}30\`,
 }}
 onClick={() => { if(primary.available) toggleDomain(primary.domain, primary.price ?? 0); }}
 >
 <div className="flex items-center gap-3">
 <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: isSelected ? \`\${DS.blue}25\` : \`\${DS.green}20\`, border: isSelected ? \`2px solid \${DS.blue}\` : \`2px solid \${DS.green}\` }}>
 {isSelected ? <Check size={12} style={{ color: DS.blue }} /> : <Check size={12} style={{ color: DS.green }} />}
 </div>
 <span style={{ color: DS.text, fontSize: 14, fontFamily: DS.mono, fontWeight: 700 }}>{primary.domain}</span>
 </div>
 <div className="flex items-center gap-3">
 {isSelected && <span style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono, background: \`\${DS.blue}15\`, padding: "2px 8px", borderRadius: 6 }}>Đã chọn</span>}
 {primary.price > 0 && <span style={{ color: DS.green, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>{fmtVND(primary.price)}</span>}
 </div>
 </div>
 </div>
 ) : (
 <div>
 <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 6 }}>DOMAIN CHÍNH</div>
 <div className="flex items-center justify-between p-4 rounded-xl"
 style={{ background: "rgba(255,255,255,0.03)", border: \`1px solid \${DS.border}\`, opacity: 0.7 }}>
 <div className="flex items-center gap-3">
 <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
 <X size={12} style={{ color: DS.text4 }} />
 </div>
 <div>
 <span style={{ color: DS.text3, fontSize: 14, fontFamily: DS.mono, fontWeight: 600 }}>{primary.domain}</span>
 <span style={{ color: DS.red, fontSize: 11, marginLeft: 8 }}>(đã được đăng ký)</span>
 </div>
 </div>
 {primary.reason === "reserved" && <span style={{ color: DS.amber, fontSize: 11 }}>tên miền dự trữ</span>}
 </div>
 </div>
 )}
 </div>
 );
 })()}

 {/* ── Alternative TLDs ── */}
 {domainSearchResults.length > 1 && (
 <div className="mt-3">
 <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 8 }}>GỢI Ý KHÁC</div>
 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
 {domainSearchResults.slice(1).map(result => {
 const isSelected = selectedDomains.some(d => d.domain === result.domain);
 const isAvailable = result.available;
 return (
 <div
 key={result.domain}
 className="flex items-center justify-between p-3 rounded-xl cursor-pointer"
 style={{
 background: isSelected ? \`rgba(59,130,246,0.12)\` : isAvailable ? \`rgba(34,197,94,0.06)\` : "rgba(255,255,255,0.03)",
 border: isSelected ? \`1.5px solid \${DS.blue}\` : isAvailable ? \`1px solid \${DS.green}30\` : \`1px solid \${DS.border}\`,
 opacity: isAvailable ? 1 : 0.6,
 }}
 onClick={() => { if(result.available) toggleDomain(result.domain, result.price ?? 0); }}
 >
 <div className="flex items-center gap-2">
 <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: isSelected ? \`\${DS.blue}20\` : \`\${DS.green}15\`, flexShrink: 0 }}>
 {isSelected ? <Check size={9} style={{ color: DS.blue }} /> : isAvailable ? <Check size={9} style={{ color: DS.green }} /> : <X size={9} style={{ color: DS.text4 }} />}
 </div>
 <span style={{ color: isAvailable ? DS.text : DS.text3, fontSize: 12, fontFamily: DS.mono }}>{result.domain}</span>
 </div>
 {isAvailable && result.price > 0 && (
 <span style={{ color: DS.green, fontSize: 11, fontFamily: DS.mono, fontWeight: 600 }}>{fmtVND(result.price)}</span>
 )}
 </div>
 );
 })}
 </div>
 </div>
 )}

 {/* ── Selected domains summary ── */}
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
 )}`;
splice(resultsStart, resultsEnd, newResults);
changes++;
console.log('P2: Domain results UI replaced');

// ════════════════════════════════════════════════════════════════════════════
// P1: Update domainCost calculation (line numbers shifted by +12 lines)
// ════════════════════════════════════════════════════════════════════════════
const dcIdx = idx('const domainCost = domainPurchaseNow');
lines[dcIdx] = ' const domainCost = selectedDomains.reduce((s, d) => s + (d.price ?? 0), 0);';
changes++;
console.log('P1: domainCost updated at L' + (dcIdx + 1));

// ════════════════════════════════════════════════════════════════════════════
// P1: Update domainTotalCost in handleSubmit
// ════════════════════════════════════════════════════════════════════════════
const dtcIdx = idx('const domainTotalCost = domainPurchaseNow && domainName');
lines[dtcIdx] = lines[dtcIdx].replace(
 /const domainTotalCost = domainPurchaseNow && domainName[\s\S]*?\?0;/,
 ' const domainTotalCost = selectedDomains.reduce((s, d) => s + (d.price ?? 0), 0);'
);
changes++;
console.log('P1: domainTotalCost updated at L' + (dtcIdx + 1));

// ════════════════════════════════════════════════════════════════════════════
// P1: Update domainTotal in sidebar display
// ════════════════════════════════════════════════════════════════════════════
const dtIdx = idx('const domainTotal = domainPurchaseNow && domainName');
lines[dtIdx] = ' const domainTotal = selectedDomains.reduce((s, d) => s + (d.price ?? 0), 0);';
changes++;
console.log('P1: domainTotal updated at L' + (dtIdx + 1));

// ════════════════════════════════════════════════════════════════════════════
// P1: Update submit domainName
// ════════════════════════════════════════════════════════════════════════════
const submitDomainIdx = idx('domainName: domainName || undefined,');
lines[submitDomainIdx] = ' domainName: selectedDomains.map(d => d.domain).join(", ") || undefined,';
changes++;
console.log('P1: submit domainName updated at L' + (submitDomainIdx + 1));

// ════════════════════════════════════════════════════════════════════════════
// P1: Update sidebar domain display (show count + price)
// ════════════════════════════════════════════════════════════════════════════
const sidebarDomainIdx = idx('>+Domain: {fmtVND(domainTotal)}');
lines[sidebarDomainIdx] = lines[sidebarDomainIdx].replace(
 '>+Domain: {fmtVND(domainTotal)}',
 '>+Domain: {selectedDomains.length > 0 ? `${selectedDomains.length} domain · ${fmtVND(selectedDomainTotal)}` : "+0"}'
);
changes++;
console.log('P1: sidebar domain display updated at L' + (sidebarDomainIdx + 1));

// ════════════════════════════════════════════════════════════════════════════
// Write
// ════════════════════════════════════════════════════════════════════════════
fs.writeFileSync('src/components/landing/BookingWizardClient.tsx', lines.join('\n'));
console.log(`\n✅ Done! ${changes} changes. Total lines: ${lines.length}`);

// Verify
const content = fs.readFileSync('src/components/landing/BookingWizardClient.tsx', 'utf8');
const checks = [
 'selectedDomains', 'toggleDomain', 'selectedDomainTotal',
 'DOMAIN CHÍNH', 'GỢI Ý KHÁC',
 'domainPrices.map(d =>',
 "selectedDomains.map(d => d.domain)",
 'selectedDomains.length > 0'
];
console.log('\nVerification:');
for (const c of checks) {
 console.log(' ' + c + ':', content.includes(c) ? '✅ OK' : '❌ MISSING');
}
