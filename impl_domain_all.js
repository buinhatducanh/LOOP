const fs = require('fs');
let content = fs.readFileSync('src/components/landing/BookingWizardClient.tsx', 'utf8');
let lines = content.split('\n');
let changes = 0;

function replaceLines(start, end, newLines) {
 const before = lines.slice(0, start);
 const after = lines.slice(end + 1);
 lines = [...before, ...newLines.split('\n'), ...after];
}

// ── 1. Add selectedDomains state after domainError ─────────────────────────────
const domainErrorIdx = lines.findIndex(l => l.includes('const [domainError, setDomainError]'));
const toggleDomainCode = `
 // ── Domain selection from results ────────────────────────────────────────
 const [selectedDomains, setSelectedDomains] = useState<{domain: string; price: number}[]>([]);
 const toggleDomain = (domain: string, price: number) => {
 setSelectedDomains(prev => {
 const exists = prev.find(d => d.domain === domain);
 if (exists) return prev.filter(d => d.domain !== domain);
 return [...prev, { domain, price }];
 });
 };
 const selectedDomainTotal = selectedDomains.reduce((s, d) => s + (d.price ?? 0), 0);
`;
lines.splice(domainErrorIdx + 1, 0, toggleDomainCode);
changes++;
console.log('1. Added selectedDomains state');

// After splice, indices shift. Recalculate for remaining changes.
// DomainCost is at line 438 (original), but we added ~8 lines after 359
// New domainCost index = 438 + (toggleDomainCode.split('\n').length)
const domainCostOffset = toggleDomainCode.split('\n').length; // ~8

// ── 2. Update domainCost calculation ─────────────────────────────────────────
const domainCostIdx = lines.findIndex(l => l.includes('const domainCost = domainPurchaseNow'));
const newDomainCost = ` const domainCost = selectedDomains.reduce((s, d) => s + (d.price ?? 0), 0);`;
lines[domainCostIdx] = lines[domainCostIdx].replace(
 /const domainCost = domainPurchaseNow[\s\S]*?\?0;/,
 newDomainCost.trim()
);
changes++;
console.log('2. Updated domainCost at L' + (domainCostIdx + 1));

// ── 3. Update domainTotalCost in handleSubmit ─────────────────────────────────
const domainTotalCostIdx = lines.findIndex(l => l.includes('const domainTotalCost = domainPurchaseNow'));
lines[domainTotalCostIdx] = lines[domainTotalCostIdx].replace(
 /const domainTotalCost = domainPurchaseNow[\s\S]*?\?0;/,
 ` const domainTotalCost = selectedDomains.reduce((s, d) => s + (d.price ?? 0), 0);`
);
changes++;
console.log('3. Updated domainTotalCost at L' + (domainTotalCostIdx + 1));

// ── 4. Update domainTotal in sidebar ───────────────────────────────────────────
const domainTotalIdx = lines.findIndex(l => l.includes('const domainTotal = domainPurchaseNow'));
lines[domainTotalIdx] = lines[domainTotalIdx].replace(
 /const domainTotal = domainPurchaseNow[\s\S]*?\?0/,
 ` const domainTotal = selectedDomains.reduce((s, d) => s + (d.price ?? 0), 0);`
);
changes++;
console.log('4. Updated domainTotal at L' + (domainTotalIdx + 1));

// ── 5. Replace TLD dropdown with domainPrices ────────────────────────────────
const tldIdx = lines.findIndex(l => l.includes('["vn", "com.vn", "com", "net", "io", "co"'));
lines[tldIdx] = ` {domainPrices.length > 0 ? domainPrices.map(d => <option key={d.extension} value={d.extension} style={{ background: "#0F172A" }}>{d.extension}</option>) : ["vn", "com.vn", "com", "net", "io", "co", "org", "info", "biz"].map(ext => <option key={ext} value={ext} style={{ background: "#0F172A" }}>{ext}</option>)}`;
changes++;
console.log('5. Replaced TLD dropdown at L' + (tldIdx + 1));

// ── 6. Replace domain results UI ──────────────────────────────────────────────
const resultsStartIdx = lines.findIndex(l => l.includes('/* Domain search results */'));
// Find the end of the results section: )} after the map closing
let resultsEndIdx = resultsStartIdx;
let found = 0;
for (let i = resultsStartIdx; i < lines.length; i++) {
 if (lines[i].includes('))}')) found++;
 if (found === 2) { resultsEndIdx = i; break; }
}
const newResultsUI = ` {/* Domain search results */}
 {domainHasSearched && (
 <div className="mt-4 space-y-3">
 {domainSearchResults.length === 0 && (
 <div className="p-4 rounded-xl text-center" style={{ background: "rgba(15,23,42,0.4)", border: \`1px solid \${DS.border}\` }}>
 <span style={{ color: DS.text4, fontSize: 13 }}>Không tìm thấy kết quả</span>
 </div>
 )}

 {/* Primary domain — first result (user's chosen TLD) */}
 {domainSearchResults.length > 0 && (
 <div>
 {(() => {
 const primary = domainSearchResults[0];
 const isSelected = selectedDomains.some(d => d.domain === primary.domain);
 const isAvailable = primary.available;
 return (
 <div>
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
 <span style={{ color: DS.red, fontSize: 11, marginLeft: 8 }}>
 (đã được đăng ký)
 </span>
 </div>
 </div>
 {primary.reason === "reserved" && (
 <span style={{ color: DS.amber, fontSize: 11 }}>tên miền dự trữ</span>
 )}
 </div>
 </div>
 )}
 </div>
 );
 })()}

 {/* Alternatives — other TLDs */}
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
 <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: isSelected ? \`\${DS.blue}20\` : \`\${DS.green}15\`, flexShrink: 0 }}>
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
 )}`;
lines.splice(resultsStartIdx, resultsEndIdx - resultsStartIdx + 1, newResultsUI);
changes++;
console.log('6. Replaced domain results UI');

// After replacing results UI (~70 lines removed, ~100 added), recalculate
// Recalculate Purchase timing index
const purchaseTimingIdx = lines.findIndex(l => l.includes('{/* Purchase timing */}') && lines[lines.indexOf(l) + 1]?.includes('domainName'));
console.log('Purchase timing at L' + (purchaseTimingIdx + 1));

// ── 7. Update Purchase timing: remove domainPrices.find condition ──────────────
lines[purchaseTimingIdx] = lines[purchaseTimingIdx].replace(
 / && domainPrices\.find\([^)]+\)/,
 ''
);
changes++;
console.log('7. Updated Purchase timing condition');

// ── 8. Update submit: domain name from selectedDomains ────────────────────────
// Find domainName in submit
const submitDomainIdx = lines.findIndex(l => l.includes('domainName: domainName'));
lines[submitDomainIdx] = ` domainName: selectedDomains.map(d => d.domain).join(", ") || undefined,`;
changes++;
console.log('8. Updated submit domainName');

// ── 9. Update sidebar domainTotal display to use selectedDomainTotal ─────────────
// Find where domainTotal is shown in sidebar
const sidebarDomainIdx = lines.findIndex(l => l.includes('>+Domain: {fmtVND(domainTotal)}'));
lines[sidebarDomainIdx] = lines[sidebarDomainIdx].replace(
 '{fmtVND(domainTotal)}',
 'selectedDomains.length > 0 ? `${selectedDomains.length} domain · ${fmtVND(selectedDomainTotal)}` : fmtVND(0)'
);
changes++;
console.log('9. Updated sidebar domain display');

// ── 10. Add domainSummary in submit: show selected domains count ───────────────
const lpDiscIdx = lines.findIndex(l => l.includes('vatAmt > 0') && l.includes('+)">'));
// Actually, let's just update the display in the final submit confirmation area
// Find the line that shows domain in the wizard's domainTotal display
const domainDisplayIdx = lines.findIndex(l => l.includes('>+{fmtVND(domainTotal)}'));
if (domainDisplayIdx >= 0) {
 lines[domainDisplayIdx] = lines[domainDisplayIdx].replace(
 '{fmtVND(domainTotal)}',
 'selectedDomains.length > 0 ? `${selectedDomains.length} domain · ${fmtVND(selectedDomainTotal)}` : "+0"'
 );
 changes++;
 console.log('10. Updated domain display in summary');
}

console.log(`\nTotal changes: ${changes}`);
fs.writeFileSync('src/components/landing/BookingWizardClient.tsx', lines.join('\n'));
console.log('Done! File written.');

// Verify key elements
const newContent = fs.readFileSync('src/components/landing/BookingWizardClient.tsx', 'utf8');
const newLines = newContent.split('\n');
const checks = [
 'selectedDomains', 'toggleDomain', 'selectedDomainTotal',
 'DOMAIN CHÍNH', 'GỢI Ý KHÁC', 'domainPrices.map',
 'Đã chọn', 'selectedDomains.length > 0 ?'
];
for (const c of checks) {
 let found = false;
 for (let i = 0; i < newLines.length; i++) {
 if (newLines[i].includes(c)) { found = true; break; }
 }
 console.log(c + ':', found ? 'OK' : 'MISSING');
}
console.log('Total lines:', newLines.length);
