const fs = require('fs');
let content = fs.readFileSync('src/components/landing/BookingWizardClient.tsx', 'utf8');
const original = content;

// ── 1. Add selectedDomains state + toggleDomain + selectedDomainTotal ─────────────
const afterDomainError = `const [domainError, setDomainError] = useState("");
 const [selectedDomains, setSelectedDomains] = useState<{domain: string; price: number}[]>([]);
 const toggleDomain = (domain: string, price: number) => {
 setSelectedDomains(prev => {
 const exists = prev.find(d => d.domain === domain);
 if (exists) return prev.filter(d => d.domain !== domain);
 return [...prev, { domain, price }];
 });
 };
 const selectedDomainTotal = selectedDomains.reduce((s, d) => s + (d.price ?? 0), 0);
 const [lpRate, setLpRate]`;
content = content.replace(
 `const [domainError, setDomainError] = useState("");
 const [lpRate, setLpRate]`,
 afterDomainError
);
console.log('1. selectedDomains state:', content.includes('const [selectedDomains') ? 'OK' : 'FAILED');

// ── 2. Update domainCost calculation ───────────────────────────────────────────
content = content.replace(
 /const domainCost = domainPurchaseNow && domainName[\s\S]*?\?0;/,
 'const domainCost = selectedDomains.reduce((s, d) => s + (d.price ?? 0), 0);'
);
console.log('2. domainCost:', content.includes('selectedDomains.reduce((s, d)') ? 'OK' : 'FAILED');

// ── 3. Update domainTotalCost in handleSubmit ─────────────────────────────────
content = content.replace(
 /const domainTotalCost = domainPurchaseNow && domainName[\s\S]*?\?0;/,
 'const domainTotalCost = selectedDomains.reduce((s, d) => s + (d.price ?? 0), 0);'
);
console.log('3. domainTotalCost:', content.includes('selectedDomains.reduce((s, d)') ? 'OK' : 'FAILED');

// ── 4. Update domainTotal in sidebar ──────────────────────────────────────────
content = content.replace(
 /const domainTotal = domainPurchaseNow && domainName[\s\S]*?\?0/,
 'const domainTotal = selectedDomains.reduce((s, d) => s + (d.price ?? 0), 0)'
);
console.log('4. domainTotal:', content.includes('const domainTotal = selectedDomains.reduce') ? 'OK' : 'FAILED');

// ── 5. Replace TLD dropdown with domainPrices ─────────────────────────────────
content = content.replace(
 /\{domainPrices\.length > 0 && \(\n?\s+<select[\s\S]*?<select[\s\S]*?\[\"vn\", \"com\.vn\", \"com\", \"net\", \"io\", \"co\", \"org\", \"info\", \"biz\"\]/,
 `{domainPrices.length > 0 ? domainPrices.map(d => <option key={d.extension} value={d.extension} style={{ background: "#0F172A" }}>{d.extension}</option>) : `
);
console.log('5. TLD dropdown:', content.includes('domainPrices.map(d => <option') ? 'OK' : 'FAILED');

// ── 6. Replace entire domain results UI ────────────────────────────────────────
// Find and replace from "/* Domain search results */" to the closing `</div>` before Purchase timing
const oldResults = ` {/* Domain search results */}
 {domainHasSearched && (
 <div className="mt-4 space-y-2">
 {domainSearchResults.length === 0 && (
 <div className="p-4 rounded-xl text-center" style={{ background: "rgba(15,23,42,0.4)", border: \`1px solid \${DS.border}\` }}>
 <span style={{ color: DS.text4, fontSize: 13 }}>Không tìm thấy kết quả</span>
 </div>
 )}
 {domainSearchResults.map(result => (
 <div key={result.domain} className="flex items-center justify-between p-3 rounded-xl"
 style={{ background: result.available ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.03)", border: result.available ? \`1px solid \${DS.green}30\` : \`1px solid \${DS.border}\` }}>
 <div className="flex items-center gap-3">
 <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: result.available ? \`\${DS.green}20\` : "rgba(255,255,255,0.06)" }}>
 {result.available ? <Check size={11} style={{ color: DS.green }} /> : <X size={11} style={{ color: DS.text4 }} />}
 </div>
 <div>
 <span style={{ color: DS.text, fontSize: 13, fontFamily: DS.mono, fontWeight: 600 }}>{result.domain}</span>
 {!result.available && result.reason && (
 <span style={{ color: DS.text4, fontSize: 11, marginLeft: 8 }}>
 ({result.reason === "taken" ? "đã được đăng ký" : result.reason === "reserved" ? "tên miền dự trữ" : "không khả dụng"})
 </span>
 )}
 </div>
 </div>
 {result.available && result.price > 0 && (
 <span style={{ color: DS.green, fontSize: 12, fontFamily: DS.mono, fontWeight: 700 }}>{fmtVND(result.price)}</span>
 )}
 </div>
 ))}
 </div>
 )}`;

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
 <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 8 }}>DOMAIN CHÍNH</div>
 <div
 className="flex items-center justify-between p-4 rounded-xl cursor-pointer"
 style={{
 background: isSelected ? \`rgba(59,130,246,0.10)\` : isAvailable ? \`rgba(34,197,94,0.06)\` : "rgba(255,255,255,0.03)",
 border: isSelected ? \`1.5px solid \${DS.blue}\` : isAvailable ? \`1px solid \${DS.green}30\` : \`1px solid \${DS.border}\`,
 opacity: isAvailable ? 1 : 0.7,
 }}
 onClick={() => { if (primary.available) toggleDomain(primary.domain, primary.price ?? 0); }}
 >
 <div className="flex items-center gap-3">
 <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: isSelected ? \`\${DS.blue}20\` : isAvailable ? \`\${DS.green}20\` : "rgba(255,255,255,0.06)", border: isSelected ? \`2px solid \${DS.blue}\` : isAvailable ? \`2px solid \${DS.green}\` : "none" }}>
 {isSelected ? <Check size={12} style={{ color: DS.blue }} /> : isAvailable ? <Check size={12} style={{ color: DS.green }} /> : <X size={12} style={{ color: DS.text4 }} />}
 </div>
 <div>
 <span style={{ color: isAvailable ? DS.text : DS.text3, fontSize: 14, fontFamily: DS.mono, fontWeight: 700 }}>{primary.domain}</span>
 {!isAvailable && (
 <span style={{ color: DS.red, fontSize: 11, marginLeft: 8 }}>(đã được đăng ký)</span>
 )}
 </div>
 </div>
 <div className="flex items-center gap-3">
 {isSelected && (
 <span style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono, background: \`\${DS.blue}15\`, padding: "2px 8px", borderRadius: 6 }}>Đã chọn</span>
 )}
 {primary.price > 0 && (
 <span style={{ color: DS.green, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>{fmtVND(primary.price)}</span>
 )}
 </div>
 </div>
 </div>
 );
 })()}

 {/* ── Alternative TLDs ── */}
 {domainSearchResults.length > 1 && (
 <div>
 <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 8 }}>GỢI Ý KHÁC</div>
 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 8 }}>
 {domainSearchResults.slice(1).map(result => {
 const isSelected = selectedDomains.some(d => d.domain === result.domain);
 const isAvailable = result.available;
 return (
 <div
 key={result.domain}
 className="flex items-center justify-between p-3 rounded-xl cursor-pointer"
 style={{
 background: isSelected ? \`rgba(59,130,246,0.10)\` : isAvailable ? \`rgba(34,197,94,0.06)\` : "rgba(255,255,255,0.03)",
 border: isSelected ? \`1.5px solid \${DS.blue}\` : isAvailable ? \`1px solid \${DS.green}30\` : \`1px solid \${DS.border}\`,
 opacity: isAvailable ? 1 : 0.65,
 }}
 onClick={() => { if (result.available) toggleDomain(result.domain, result.price ?? 0); }}
 >
 <div className="flex items-center gap-2">
 <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: isSelected ? \`\${DS.blue}20\` : isAvailable ? \`\${DS.green}15\` : "rgba(255,255,255,0.06)" }}>
 {isSelected ? <Check size={9} style={{ color: DS.blue }} /> : isAvailable ? <Check size={9} style={{ color: DS.green }} /> : <X size={9} style={{ color: DS.text4 }} />}
 </div>
 <span style={{ color: isAvailable ? DS.text : DS.text3, fontSize: 12, fontFamily: DS.mono }}>{result.domain}</span>
 </div>
 {isAvailable && result.price > 0 && (
 <span style={{ color: DS.green, fontSize: 11, fontFamily: DS.mono, fontWeight: 600, marginLeft: 4 }}>{fmtVND(result.price)}</span>
 )}
 </div>
 );
 })}
 </div>
 </div>
 )}

 {/* ── Selected domains summary ── */}
 {selectedDomains.length > 0 && (
 <div className="mt-4 p-4 rounded-xl" style={{ background: \`\${DS.blue}08\`, border: \`1px solid \${DS.blue}25\` }}>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Check size={13} style={{ color: DS.blue }} />
 <span style={{ color: DS.blue, fontSize: 12, fontFamily: DS.mono }}>Đã chọn {selectedDomains.length} domain · <strong>{fmtVND(selectedDomainTotal)}</strong></span>
 </div>
 </div>
 <div className="mt-3 flex flex-wrap gap-2">
 {selectedDomains.map(d => (
 <div key={d.domain} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs" style={{ background: \`\${DS.blue}15\`, color: DS.blue, fontFamily: DS.mono }}>
 <span>{d.domain}</span>
 <button onClick={() => toggleDomain(d.domain, d.price)} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 0 0 4px", color: DS.blue, display: "flex", alignItems: "center" }}>
 <X size={10} />
 </button>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 )}

 </div>
 )}`;

content = content.replace(oldResults, newResults);
console.log('6. Domain results UI:', content.includes('DOMAIN CHÍNH') ? 'OK' : 'FAILED');

// ── 7. Update submit: domain name from selectedDomains ────────────────────────
content = content.replace(
 /domainName: domainName \|\| undefined,/,
 `domainName: selectedDomains.map(d => d.domain).join(", ") || undefined,`
);
console.log('7. Submit domainName:', content.includes("selectedDomains.map(d => d.domain)") ? 'OK' : 'FAILED');

// ── 8. Update sidebar domain display ───────────────────────────────────────────
content = content.replace(
 /\{domainTotal > 0 && \(\n?\s+<div[\s\S]*?<\/div>\n?\s+\)}/,
 `{selectedDomains.length > 0 && (
 <div style={{ background: \`\${DS.cyan}10\`, border: \`1px solid \${DS.cyan}25\`, borderRadius: 8, padding: "4px 12px" }}>
 <span style={{ color: DS.cyan, fontSize: 12, fontFamily: DS.mono }}>+Domain: {selectedDomains.length} domain · {fmtVND(selectedDomainTotal)}</span>
 </div>
 )}`
);
console.log('8. Sidebar domain:', content.includes("selectedDomains.length > 0") ? 'OK' : 'FAILED');

// ── 9. Update Purchase timing: remove domainPrices.find condition ─────────────
content = content.replace(
 /{domainName && domainName\.includes\("\."\) && domainPrices\.find\([^)]+\) && \(/,
 '{domainName && domainName.includes(".") && ('
);
console.log('9. Purchase timing:', !content.includes('domainPrices.find') || content.includes('domainName.includes') ? 'OK' : 'FAILED');

fs.writeFileSync('src/components/landing/BookingWizardClient.tsx', content);
console.log('\nFile written. Total lines:', content.split('\n').length);

// Final verification
const checks = [
 'selectedDomains', 'toggleDomain', 'selectedDomainTotal',
 'DOMAIN CHÍNH', 'GỢI Ý KHÁC',
 'domainPrices.map(d => <option',
 'selectedDomains.map(d => d.domain)',
 'selectedDomains.length > 0'
];
for (const c of checks) {
 console.log(c + ':', content.includes(c) ? 'OK ✓' : 'MISSING ✗');
}
