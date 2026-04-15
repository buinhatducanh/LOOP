const fs = require('fs');
let content = fs.readFileSync('src/components/landing/BookingWizardClient.tsx', 'utf8');
const original = content;

// ── 0. Add Search + AlertCircle to lucide import ──────────────────────────
content = content.replace(
 'Users, Calendar, Layers, Sparkles, Shield, Plus, Minus, X, ExternalLink, Zap, Eye, Server,',
 'Users, Calendar, Layers, Sparkles, Shield, Plus, Minus, X, ExternalLink, Zap, Eye, Server, Search, AlertCircle,'
);
// ── -1. Add DomainSearchResult type after WizardDomainPrice ───────────────
const typeAfter = `interface WizardDomainPrice {
 extension: string;
 registrationPrice: number;
 renewalPrice: number;
 period: string;
 periodVi: string;
 note: string;
 noteVi: string;
 isAvailable: boolean;
}
interface DomainSearchResult {
 domain: string;
 available: boolean;
 reason?: string;
 price: number;
}
interface LpRateConfig`;
content = content.replace(
 `interface WizardDomainPrice {
 extension: string;
 registrationPrice: number;
 renewalPrice: number;
 period: string;
 periodVi: string;
 note: string;
 noteVi: string;
 isAvailable: boolean;
}
interface LpRateConfig`,
 typeAfter
);
console.log('-1. DomainSearchResult type:', content.includes('interface DomainSearchResult') ? '✅' : '❌');

console.log('0. Icons import:', content.includes('Search, AlertCircle,') ? '✅' : '❌');

// ── 1. Add selectedDomains state after domainPurchaseNow ──────────────────
const stateAfter = `const [domainPurchaseNow, setDomainPurchaseNow] = useState(true);
 const [domainSearchResults, setDomainSearchResults] = useState<DomainSearchResult[]>([]);
 const [domainSearching, setDomainSearching] = useState(false);
 const [domainHasSearched, setDomainHasSearched] = useState(false);
 const [domainError, setDomainError] = useState("");
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
 'const [domainPurchaseNow, setDomainPurchaseNow] = useState(true);\n const [lpRate, setLpRate]',
 stateAfter
);
console.log('1. selectedDomains state:', content.includes('const [selectedDomains, setSelectedDomains]') ? '✅' : '❌');

// ── 2. Replace domainCost calculation ─────────────────────────────────────
content = content.replace(
 / const domainCost = domainPurchaseNow && domainName[\s\S]*?\?0;\n/,
 ' const domainCost = selectedDomains.reduce((s, d) => s + (d.price ?? 0), 0);\n'
);
console.log('2. domainCost:', content.includes('const domainCost = selectedDomains.reduce') ? '✅' : '❌');

// ── 3. Replace domainTotalCost in handleSubmit ─────────────────────────────
content = content.replace(
 / const domainTotalCost = domainPurchaseNow && domainName[\s\S]*?\?0;\n/,
 ' const domainTotalCost = selectedDomains.reduce((s, d) => s + (d.price ?? 0), 0);\n'
);
console.log('3. domainTotalCost:', content.includes('const domainTotalCost = selectedDomains.reduce') ? '✅' : '❌');

// ── 4. Replace domainTotal in display ─────────────────────────────────────
content = content.replace(
 / const domainTotal = domainPurchaseNow && domainName[\s\S]*? : 0;\n/,
 ' const domainTotal = selectedDomains.reduce((s, d) => s + (d.price ?? 0), 0);\n'
);
console.log('4. domainTotal:', content.includes('const domainTotal = selectedDomains.reduce') ? '✅' : '❌');

// ── 5. Update submit domainName ───────────────────────────────────────────
content = content.replace(
 ' domainName: domainName || undefined,',
 ' domainName: selectedDomains.map(d => d.domain).join(", ") || undefined,'
);
console.log('5. Submit domainName:', content.includes("domainName: selectedDomains.map(d => d.domain)") ? '✅' : '❌');

// ── 6. Update sidebar domain display ─────────────────────────────────────
content = content.replace(
 '+Domain: {fmtVND(domainTotal)}',
 '+Domain: {selectedDomains.length > 0 ? `${selectedDomains.length} domain · ${fmtVND(selectedDomainTotal)}` : "+0"}'
);
console.log('6. Sidebar domain:', content.includes('selectedDomains.length > 0') ? '✅' : '❌');

// ── 7. Simplify Purchase timing: remove domainPrices.find ────────────────
content = content.replace(
 /domainPrices\.find\(d => domainName\.endsWith\(d\.extension\)\) && \(/,
 'domainName && domainName.includes(".") && ('
);
console.log('7. Purchase timing:', content.includes('domainName && domainName.includes(".") && (') ? '✅' : '❌');

// ── 8. Replace domain input section (remove matchedExt, add search button + results UI)
// The old section: input + select + matchedExt conditional → input + select + searchBtn + error + results
const oldDomainSection = ` placeholder="ví dụ: mysite.com"
 style={{ flex: 1, background: "rgba\\(15,23,42,0\\.6\\)", border: \`1px solid \$\\{DS\\.border\\}\`, borderRadius: 10, padding: "12px 16px", color: DS\\.text, fontSize: 15, outline: "none", fontFamily: DS\\.body, boxSizing: "border-box" \\} \\}/>
 \\{domainPrices\\.length > 0 && \\(
 <select value=\\{domainName\\.includes\\("\\.\\) \\? "\\." \\+ domainName\\.split\\("\\.\\)"\\.pop\\(\\)\\|\\| "\\.com"\\}
 onChange=\\{e => \\{ const base = domainName\\.includes\\("\\.\\) \\? domainName\\.split\\("\\.\\)"\\[0\\] \\|\\| domainName; setDomainName\\(base \\+ e\\.target\\.value\\); \\}\\}
 style=\\{[^}]+\\}\\>
 \\{domainPrices\\.map\\(d => <option key=\\{d\\.extension\\} value=\\{d\\.extension\\} style=\\{[^}]+\\}\\{d\\.extension\\}<\\/option>\\)
 <\\/select>
 \\)
\\}
 \\{\\(\\(\\) => \\{
 const matchedExt = domainName\\.includes\\("\\.\\) \\? domainPrices\\.find\\(d => domainName\\.endsWith\\(d\\.extension\\)\\) : null;
 return \\(<>
 \\{matchedExt && \\(
 <div className="mt-2 flex items-center gap-2">
 <Check size=\\{11\\} style=\\{[^}]+\\} \\/>
 <span[^>]+>Đăng ký [^<]+<\\/span>
 <span[^>]+>— Gia hạn:[^<]+<\\/span>
 <\\/div>
 \\)
 \\{domainName && !matchedExt && domainName\\.includes\\("\\.\\) && \\(
 <div className="mt-2"><span[^>]+>[^<]+<\\/span><\\/div>
 \\)
 \\{domainName && matchedExt\\?\\.note && \\(
 <div[^>]+>[^<]+<\\/div>
 \\)
 <\\/\\>\\);\\}\\}\\(\\)\\}`;

// Try simple string replacement first
const domainInputMarker = `<input value={domainName} onChange={e => setDomainName(e.target.value)} placeholder="ví dụ: mysite.com"`;
const domainSelectEnd = `</select>`;
const domainMatchedEnd = `});})()}`;

// Find positions
const inputIdx = content.indexOf(domainInputMarker);
const selectEndIdx = content.indexOf(domainSelectEnd, inputIdx);
const matchedEndIdx = content.indexOf(domainMatchedEnd, selectEndIdx);

if (inputIdx > 0 && matchedEndIdx > 0) {
 const before = content.substring(0, inputIdx);
 const after = content.substring(matchedEndIdx + domainMatchedEnd.length);
 const newSection = `<input value={domainName} onChange={e => setDomainName(e.target.value)} placeholder="ví dụ: mysite.com"
 style={{ flex: 1, background: "rgba(15,23,42,0.6)", border: \`1px solid \${DS.border}\`, borderRadius: 10, padding: "12px 16px", color: DS.text, fontSize: 15, outline: "none", fontFamily: DS.body, boxSizing: "border-box" }} />
 {domainPrices.length > 0 && (
 <select value={domainName.includes(".") ? "." + domainName.split(".").pop() || ".com" : ".com"}
 onChange={e => { const base = domainName.includes(".") ? domainName.split(".")[0] || domainName : domainName; setDomainName(base + e.target.value); setDomainHasSearched(false); setDomainSearchResults([]); }}
 style={{ background: "rgba(15,23,42,0.8)", border: \`1px solid \${DS.border}\`, borderRadius: 10, padding: "12px 14px", color: DS.text, fontSize: 14, fontFamily: DS.mono, outline: "none", cursor: "pointer" }}>
 {domainPrices.map(d => <option key={d.extension} value={d.extension} style={{ background: "#0F172A" }}>{d.extension}</option>)}
 </select>
 )}
 </div>

 {/* Search button */}
 <div className="flex gap-2 mt-3">
 <motion.button onClick={searchDomain}
 disabled={domainSearching || domainName.trim().length < 2}
 className="flex items-center gap-2 rounded-xl px-5 py-3 font-semibold transition-all disabled:cursor-not-allowed"
 style={{ background: domainSearching ? "rgba(59,130,246,0.1)" : "rgba(59,130,246,0.15)", border: \`1px solid \${DS.blue}50\`, color: DS.blue, cursor: domainSearching ? "not-allowed" : "pointer" }}
 whileHover={domainSearching ? {} : { scale: 1.02 }}>
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
 const isSelected = selectedDomains.some(d => d.domain === primary.domain);
 const isAvailable = primary.available;
 return (
 <div className="mb-3">
 {isAvailable ? (
 <div>
 <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 6 }}>DOMAIN CHÍNH</div>
 <div className="flex items-center justify-between p-4 rounded-xl cursor-pointer"
 style={{ background: isSelected ? \`rgba(59,130,246,0.12)\` : \`rgba(34,197,94,0.06)\`, border: isSelected ? \`1.5px solid \${DS.blue}\` : \`1px solid \${DS.green}30\` }}
 onClick={() => { if(primary.available) toggleDomain(primary.domain, primary.price ?? 0); }}>
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
 const isSelected = selectedDomains.some(d => d.domain === result.domain);
  const isAvailable = result.available;
 return (
 <div key={result.domain}
 className="flex items-center justify-between p-3 rounded-xl cursor-pointer"
 style={{ background: isSelected ? \`rgba(59,130,246,0.12)\` : isAvailable ? \`rgba(34,197,94,0.06)\` : "rgba(255,255,255,0.03)", border: isSelected ? \`1.5px solid \${DS.blue}\` : isAvailable ? \`1px solid \${DS.green}30\` : \`1px solid \${DS.border}\`, opacity: isAvailable ? 1 : 0.6 }}
 onClick={() => { if(result.available) toggleDomain(result.domain, result.price ?? 0); }}>
  <div className="flex items-center gap-2">
 <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: isSelected ? \`\${DS.blue}20\` : \`\${DS.green}15\` }}>
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
 content = before + newSection + after;
 console.log('8. Domain section replaced:', content.includes('DOMAIN CHÍNH') ? '✅' : '❌');
} else {
 console.log('8. Domain section: could not find markers', inputIdx, matchedEndIdx);
}

// ── 9. Add searchDomain function after toggleExtra ─────────────────────────
const searchFn = ` const toggleExtra = (id: string) =>
 setSelectedExtras(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);

 // ── Domain search (Step 1) ────────────────────────────────────────────
 const searchDomain = async () => {
 if (domainName.trim().length < 2) return;
 setDomainSearching(true);
 setDomainError("");
 setDomainHasSearched(true);
 try {
 const keyword = domainName.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
 const tld = domainName.includes(".")
 ? domainName.split(".").pop() ?? "vn"
 : "vn";
 const params = new URLSearchParams({ q: keyword, tld });
 const res = await fetch(\`/api/pricing/domain-search?\${params}\`);
 if (res.ok) {
 const json = await res.json();
 setDomainSearchResults(json.data?.domains ?? []);
 } else {
 setDomainError("Tìm kiếm thất bại");
 }
 } catch {
 setDomainError("Lỗi mạng");
 }
 setDomainSearching(false);
 };`;
content = content.replace(
 ' const toggleExtra = (id: string) =>\n setSelectedExtras(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);',
 searchFn
);
console.log('9. searchDomain fn:', content.includes('const searchDomain = async ()') ? '✅' : '❌');

// Write
fs.writeFileSync('src/components/landing/BookingWizardClient.tsx', content);
console.log(`\nFile written. Lines: ${content.split('\n').length}`);

// Verify
const checks = [
 'selectedDomains', 'toggleDomain', 'selectedDomainTotal',
 'DOMAIN CHÍNH', 'GỢI Ý KHÁC', 'searchDomain',
 'domainSearchResults', 'domainSearching', 'domainHasSearched', 'domainError',
 "selectedDomains.map(d => d.domain)", 'selectedDomains.length > 0',
 'Kiểm tra', 'AlertCircle', 'Search size={16}',
 "selectedDomains.reduce((s, d) => s + (d.price ?? 0), 0)",
 'domainName && domainName.includes(".") && ('
];
console.log('\nVerification:');
let all = true;
for (const c of checks) {
 const ok = content.includes(c);
 console.log(' ' + c + ':', ok ? '✅' : '❌');
 if (!ok) all = false;
}
if (all) console.log('\n🎉 All checks passed!');
