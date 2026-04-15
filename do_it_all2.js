const fs = require('fs');
let lines = fs.readFileSync('src/components/landing/BookingWizardClient.tsx', 'utf8').split('\n');
const out = [];

let i = 0;
function emit(l) { out.push(l); }
function skip(n) { i += n; }
function until(s) { while (i < lines.length && !lines[i].includes(s)) emit(lines[i++]); emit(lines[i] || ''); }

// ── All key line indices ────────────────────────────────────────────────────
const L = {};
for (let j = 0; j < lines.length; j++) {
 const t = lines[j].trim();
 if (t === 'Globe, Code2, BarChart3, Target, Check, ArrowRight, ArrowLeft,') L._lucide1 = j;
 if (t === 'Users, Calendar, Layers, Sparkles, Shield, Plus, Minus, X, ExternalLink, Zap, Eye, Server,') L._lucide2 = j;
 if (t.match(/^const \[domainPurchaseNow, setDomainPurchaseNow\]/)) L.domainPurchaseNow = j;
 if (t.match(/^ const domainCost = domainPurchaseNow/)) L.domainCost = j;
 if (t.includes('const domainTotalCost = domainPurchaseNow && domainName') && !t.includes('domainName:')) L.domainTotalCost = j;
 if (t.includes('const domainTotal = domainPurchaseNow && domainName') && !t.includes('domainPurchaseNow') === false && t.includes('? (domainPrices')) L.domainTotal = j;
 if (t === ' domainName: domainName || undefined,') L.submitDomain = j;
 if (t.includes('>+Domain: {fmtVND(domainTotal)}')) L.sidebarDomain = j;
 if (t.includes('BẢNG GIÁ TÊN MIỀN (tham khảo)')) L.priceTableStart = j;
 if (t.includes('{/* Purchase timing */}') || (lines[j].includes('BẠN MUỐN ĐĂNG KÝ KHI NÀO?'))) L.purchaseTiming = j;
}

// Fix domainTotal (regex match was loose)
L.domainTotal = lines.findIndex((l, j) =>
 l.includes('const domainTotal = domainPurchaseNow && domainName') && l.includes('domainPrices')
);
L.purchaseTiming = lines.findIndex((l, j) =>
 l.includes('Purchase timing') || l.includes('BẠN MUỐN ĐĂNG KÝ KHI NÀO')
);
L.domainCost = lines.findIndex((l, j) => l.trim().startsWith('const domainCost = domainPurchaseNow'));

console.log('Key lines:', JSON.stringify(L, null, 0));

// ════════════════════════════════════════════════════════════════════════════
// Pass: copy lines 0 → just before lucide import, add Search/AlertCircle
// ════════════════════════════════════════════════════════════════════════════
while (i < lines.length) {
 if (i === L._lucide2) {
 emit(lines[i].replace('Users, Calendar, Layers, Sparkles, Shield, Plus, Minus, X, ExternalLink, Zap, Eye, Server,',
 'Users, Calendar, Layers, Sparkles, Shield, Plus, Minus, X, ExternalLink, Zap, Eye, Server, Search, AlertCircle,'));
 i++; continue;
 }
 if (i === L.domainPurchaseNow) {
 // Copy original line
 emit(lines[i]);
 i++;
 // Inject new state vars
 const injected = `
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
 const selectedDomainTotal = selectedDomains.reduce((s, d) => s + (d.price ?? 0), 0);`;
 injected.split('\n').filter(l => l.trim()).forEach(l => emit(' ' + l.trim()));
 continue;
 }
 if (i === L.domainCost) {
 emit(` const domainCost = selectedDomains.reduce((s, d) => s + (d.price ?? 0), 0);`);
 // Skip original 3 lines (condition + ternary + closing)
 i++; while (i < lines.length && lines[i].trim() !== '' && !lines[i].trim().startsWith('const currentSubtotal')) i++;
 i++; while (i < lines.length && lines[i].trim() === '') i++;
 continue;
 }
 if (i === L.domainTotalCost) {
 emit(` const domainTotalCost = selectedDomains.reduce((s, d) => s + (d.price ?? 0), 0);`);
 // Skip 3 lines
 i++; while (i < lines.length && !lines[i].trim().startsWith('const hostingTotalCost')) i++;
 continue;
 }
 if (i === L.domainTotal) {
 emit(` const domainTotal = selectedDomains.reduce((s, d) => s + (d.price ?? 0), 0);`);
 i++; while (i < lines.length && !lines[i].includes('const subtotalForDisplay')) i++;
 continue;
 }
 if (i === L.submitDomain) {
 emit(` domainName: selectedDomains.map(d => d.domain).join(", ") || undefined,`);
 i++; continue;
 }
 if (i === L.sidebarDomain) {
 emit(lines[i].replace(
 '+Domain: {fmtVND(domainTotal)}',
 '+Domain: {selectedDomains.length > 0 ? `${selectedDomains.length} domain · ${fmtVND(selectedDomainTotal)}` : "+0"}'
 ));
 i++; continue;
 }
 // Domain section: replace input+dropdown+matchedExt with input+dropdown+searchBtn+results
 if (lines[i].includes('placeholder="ví dụ: mysite.com"') && lines[i].includes('domainName')) {
 // Emit input + dropdown
 emit(lines[i]); // input
 i++;
 emit(lines[i]); // select open tag
 i++;
 emit(lines[i]); // options map
 i++;
 emit(lines[i]); // select close
 i++;
 // Skip matchedExt block (lines until })()})()}
 while (i < lines.length && !lines[i].includes("})()})()")) i++;
 i++; // skip })()})()}
 // Emit searchDomain function
 emit(`
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
 setDomainError("Tìm kiến thất bại");
 }
 } catch {
  setDomainError("Lỗi mạng");
 }
 setDomainSearching(false);
 };`);
 // Skip the matchedExt closing })
 while (i < lines.length && !lines[i].includes("})()}")) i++;
 i++;
 // Emit search button + error + results UI
 emit(`
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

 {{/* ── Primary domain ── */}}
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

 {{/* ── Alternative TLDs ── */}}
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

 {{/* ── Selected domains summary ── */}}
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
 )}`);
 continue;
 }
 // Simplify Purchase timing: remove domainPrices.find condition
 if (lines[i].includes('domainPrices.find(d => domainName.endsWith(d.extension))') && lines[i].includes('&& (')) {
 emit(lines[i].replace(
 /domainPrices\.find\(d => domainName\.endsWith\(d\.extension\)\) && \(/,
 'domainName && domainName.includes(".") && ('
 ));
 i++; continue;
 }
 // Copy everything else
 emit(lines[i]);
 i++;
}

// Write
const result = out.join('\n');
fs.writeFileSync('src/components/landing/BookingWizardClient.tsx', result);
console.log(`Done. Original: ${lines.length} lines → New: ${out.length} lines`);

// Verify
const content = fs.readFileSync('src/components/landing/BookingWizardClient.tsx', 'utf8');
const checks = [
 'selectedDomains', 'toggleDomain', 'selectedDomainTotal',
 'DOMAIN CHÍNH', 'GỢI Ý KHÁC', 'searchDomain',
 'domainSearchResults', 'domainSearching', 'domainHasSearched', 'domainError',
 "selectedDomains.map(d => d.domain)",
 'selectedDomains.length > 0',
 'Kiểm tra', 'AlertCircle', 'Search size={16}'
];
console.log('\nVerification:');
let all = true;
for (const c of checks) {
 const ok = content.includes(c);
 console.log(' ' + c + ':', ok ? '✅' : '❌');
 if (!ok) all = false;
}
if (all) console.log('\n🎉 All checks passed!');
