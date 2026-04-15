#!/usr/bin/env node
import fs from 'fs';
let c = fs.readFileSync('src/components/landing/BookingWizardClient.tsx', 'utf8');
const lines = c.split('\n');

// Helper: find line index by content pattern
function find(pat, from = 0) {
 const re = typeof pat === 'string' ? (l => l.includes(pat)) : pat;
 for (let i = from; i < lines.length; i++) if (re(lines[i])) return i;
 return -1;
}

let edits = 0;

// ── A. Add DomainSearchResult type after WizardDomainPrice interface ──────
const wde_end = find(l => l.trim() === '}' && l.includes('WizardDomainPrice') === false && l.includes('LpRateConfig') === false);
lines.splice(wde_end + 1, 0,
 'interface DomainSearchResult {',
 ' domain: string;',
 ' available: boolean;',
 ' reason?: string;',
 ' price: number;',
 '}'
);
edits++;
console.log('A. Type def at L' + (wde_end + 2));

// ── B. Add Search + AlertCircle icons ─────────────────────────────────────
const icon_i = find(l => l.includes('Users, Calendar, Layers, Sparkles'));
lines[icon_i] = lines[icon_i].replace(
 'Users, Calendar, Layers, Sparkles, Shield, Plus, Minus, X, ExternalLink, Zap, Eye, Server,',
 'Users, Calendar, Layers, Sparkles, Shield, Plus, Minus, X, ExternalLink, Zap, Eye, Server, Search, AlertCircle,'
);
edits++;
console.log('B. Icons at L' + (icon_i + 1));

// ── C. Add selectedDomains state after domainPurchaseNow ────────────────────
const dp_i = find(l => l.includes('const [domainPurchaseNow'));
const new_states = [
 ' const [domainSearchResults, setDomainSearchResults] = useState<DomainSearchResult[]>([]);',
 ' const [domainSearching, setDomainSearching] = useState(false);',
 ' const [domainHasSearched, setDomainHasSearched] = useState(false);',
 ' const [domainError, setDomainError] = useState("");',
 ' const [selectedDomains, setSelectedDomains] = useState<{domain: string; price: number}[]>([]);',
 ' const toggleDomain = (domain: string, price: number) => {',
 ' setSelectedDomains(prev => {',
 ' const exists = prev.find(d => d.domain === domain);',
 ' if (exists) return prev.filter(d => d.domain !== domain);',
 ' return [...prev, { domain, price }];',
 ' });',
 ' };',
 ' const selectedDomainTotal = selectedDomains.reduce((s, d) => s + (d.price ?? 0), 0);',
];
lines.splice(dp_i + 1, 0, ...new_states);
edits++;
console.log('C. State vars at L' + (dp_i + 2));

// ── D. Replace domainCost (3 lines → 1) ───────────────────────────────────
const dc_i = find(l => l.trimStart().startsWith('const domainCost = domainPurchaseNow'));
let dc_end = dc_i;
while (!lines[dc_end].trim().startsWith('const currentSubtotal')) dc_end++;
lines.splice(dc_i, dc_end - dc_i + 1, ' const domainCost = selectedDomains.reduce((s, d) => s + (d.price ?? 0), 0);');
edits++;
console.log('D. domainCost at L' + (dc_i + 1));

// ── E. Replace domainTotalCost (3 lines → 1) ────────────────────────────
const dtc_i = find(l => l.trimStart().startsWith('const domainTotalCost = domainPurchaseNow'));
let dtc_end = dtc_i;
while (!lines[dtc_end].trim().startsWith('const hostingTotalCost')) dtc_end++;
lines.splice(dtc_i, dtc_end - dtc_i + 1, ' const domainTotalCost = selectedDomains.reduce((s, d) => s + (d.price ?? 0), 0);');
edits++;
console.log('E. domainTotalCost at L' + (dtc_i + 1));

// ── F. Replace domainTotal (3 lines → 1) ─────────────────────────────────
const dt_i = find(l => l.trimStart().startsWith('const domainTotal = domainPurchaseNow'));
let dt_end = dt_i;
while (!lines[dt_end].trim().startsWith('const subtotalForDisplay')) dt_end++;
lines.splice(dt_i, dt_end - dt_i + 1, ' const domainTotal = selectedDomains.reduce((s, d) => s + (d.price ?? 0), 0);');
edits++;
console.log('F. domainTotal at L' + (dt_i + 1));

// ── G. Update submit domainName ────────────────────────────────────────────
const sub_i = find(l => l.includes('domainName: domainName || undefined,'));
lines[sub_i] = lines[sub_i].replace(
 'domainName: domainName || undefined,',
 'domainName: selectedDomains.map(d => d.domain).join(", ") || undefined,'
);
edits++;
console.log('G. submit at L' + (sub_i + 1));

// ── H. Update sidebar domain display ──────────────────────────────────────
const side_i = find(l => l.includes('+Domain: {fmtVND(domainTotal)}'));
lines[side_i] = lines[side_i].replace(
 '+Domain: {fmtVND(domainTotal)}',
 '+Domain: {selectedDomains.length > 0 ? `${selectedDomains.length} domain · ${fmtVND(selectedDomainTotal)}` : "+0"}'
);
edits++;
console.log('H. sidebar at L' + (side_i + 1));

// ── I. Simplify Purchase timing condition ─────────────────────────────────
const pt_i = find(l => l.includes('domainPrices.find(d => domainName.endsWith(d.extension))') && l.includes('&& ('));
lines[pt_i] = lines[pt_i].replace(
 'domainPrices.find(d => domainName.endsWith(d.extension)) && (',
 'domainName && domainName.includes(".") && ('
);
edits++;
console.log('I. Purchase timing at L' + (pt_i + 1));

// ── J. Replace domain input section ───────────────────────────────────────
// Find inner <div className="mb-6"> — after state vars added, it's shifted
const mb_start = find(l => l.trim() === '<div className="mb-6">' && l.includes('step') === false && l.includes('hosting') === false && l.includes('summary') === false);
// Find closing </div> of this mb-6
let mb_end = mb_start;
while (!lines[mb_end].trim().startsWith('</div>') || mb_end - mb_start > 50) mb_end++;
console.log('J. mb-6 at L' + (mb_start + 1) + '-' + (mb_end + 1) + ' (' + (mb_end - mb_start + 1) + ' lines)');

const I = n => ' '.repeat(n); // indentation helper

const new_domain = [
 I(14) + '<div className="mb-6">',
 I(16) + '<label style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>TÊN MIỀN BẠN MUỐN ĐĂNG KÝ</label>',
 I(16) + '<div className="flex gap-3">',
 I(18) + '<input value={domainName} onChange={e => setDomainName(e.target.value)} placeholder="vi dụ: mysite.com"',
 I(18) + ' style={{ flex: 1, background: "rgba(15,23,42,0.6)", border: `1px solid ${DS.border}`, borderRadius: 10, padding: "12px 16px", color: DS.text, fontSize: 15, outline: "none", fontFamily: DS.body, boxSizing: "border-box" }} />',
 I(18) + '{domainPrices.length > 0 && (',
 I(18) + ' <select value={domainName.includes(".") ? "." + domainName.split(".").pop() || ".com" : ".com"}',
 I(18) + ' onChange={e => { const base = domainName.includes(".") ? domainName.split(".")[0] || domainName : domainName; setDomainName(base + e.target.value); setDomainHasSearched(false); setDomainSearchResults([]); }}',
 I(18) + ' style={{ background: "rgba(15,23,42,0.8)", border: `1px solid ${DS.border}`, borderRadius: 10, padding: "12px 14px", color: DS.text, fontSize: 14, fontFamily: DS.mono, outline: "none", cursor: "pointer" }}>',
 I(18) + ' {domainPrices.map(d => <option key={d.extension} value={d.extension} style={{ background: "#0F172A" }}>{d.extension}</option>)}',
 I(18) + ' </select>',
 I(18) + ' )}',
 I(16) + '</div>',
 '',
 I(14) + '{/* Search button */}',
 I(14) + '<div className="flex gap-2 mt-3">',
 I(16) + '<motion.button onClick={searchDomain}',
 I(16) + ' disabled={domainSearching || domainName.trim().length < 2}',
 I(16) + ' className="flex items-center gap-2 rounded-xl px-5 py-3 font-semibold transition-all disabled:cursor-not-allowed"',
 I(16) + ' style={{ background: domainSearching ? "rgba(59,130,246,0.1)" : "rgba(59,130,246,0.15)", border: `1px solid ${DS.blue}50`, color: DS.blue, cursor: domainSearching ? "not-allowed" : "pointer" }}',
 I(16) + ' whileHover={domainSearching ? {} : { scale: 1.02 }}>',
 I(16) + ' {domainSearching ? (',
 I(16) + ' <><div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" /><span>Kiểm tra...</span></>',
 I(16) + ' ) : (',
 I(16) + ' <><Search size={16} /><span style={{ fontFamily: DS.mono, fontSize: 13 }}>Kiểm tra</span></>',
 I(16) + ' )}',
 I(16) + '</motion.button>',
 I(14) + '</div>',
 '',
 I(14) + '{domainError && (',
 I(16) + '<div className="mt-2 flex items-center gap-2">',
 I(16) + '<AlertCircle size={13} style={{ color: DS.red }} />',
 I(16) + '<span style={{ color: DS.red, fontSize: 12 }}>{domainError}</span>',
 I(16) + '</div>',
 I(14) + ')}',
 '',
 I(14) + '{/* Domain search results */}',
 I(14) + '{domainHasSearched && (',
 I(14) + ' <div className="mt-4 space-y-3">',
 I(14) + ' {domainSearchResults.length === 0 && (',
 I(14) + ' <div className="p-4 rounded-xl text-center" style={{ background: "rgba(15,23,42,0.4)", border: `1px solid ${DS.border}` }}>',
 I(14) + ' <span style={{ color: DS.text4, fontSize: 13 }}>Không tìm thấy kết quả</span>',
 I(14) + ' </div>',
 I(14) + ' )}',
 I(14) + ' {domainSearchResults.length > 0 && (',
 I(14) + ' <div>',
 '',
 I(14) + ' {/* Primary domain */}',
 I(14) + ' {(() => {',
 I(14) + ' const primary = domainSearchResults[0];',
 I(14) + ' const isSelected = selectedDomains.some(d => d.domain === primary.domain);',
 I(14) + ' const isAvailable = primary.available;',
  I(14) + ' return (',
 I(14) + ' <div className="mb-3">',
 I(14) + ' {isAvailable ? (',
 I(14) + ' <div>',
 I(14) + ' <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 6 }}>DOMAIN CHÍNH</div>',
 I(14) + ' <div className="flex items-center justify-between p-4 rounded-xl cursor-pointer"',
 I(14) + ' style={{ background: isSelected ? `rgba(59,130,246,0.12)` : `rgba(34,197,94,0.06)`, border: isSelected ? `1.5px solid ${DS.blue}` : `1px solid ${DS.green}30` }}',
 I(14) + ' onClick={() => { if(primary.available) toggleDomain(primary.domain, primary.price ?? 0); }}>',
 I(14) + ' <div className="flex items-center gap-3">',
 I(14) + ' <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: isSelected ? `${DS.blue}25` : `${DS.green}20`, border: isSelected ? `2px solid ${DS.blue}` : `2px solid ${DS.green}` }}>',
 I(14) + ' {isSelected ? <Check size={12} style={{ color: DS.blue }} /> : <Check size={12} style={{ color: DS.green }} />}',
 I(14) + ' </div>',
 I(14) + ' <span style={{ color: DS.text, fontSize: 14, fontFamily: DS.mono, fontWeight: 700 }}>{primary.domain}</span>',
 I(14) + ' </div>',
 I(14) + ' <div className="flex items-center gap-3">',
 I(14) + ' {isSelected && <span style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono, background: `${DS.blue}15`, padding: "2px 8px", borderRadius: 6 }}>Đã chọn</span>}',
 I(14) + ' {primary.price > 0 && <span style={{ color: DS.green, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>{fmtVND(primary.price)}</span>}',
 I(14) + ' </div>',
 I(14) + ' </div>',
 I(14) + ' </div>',
 I(14) + ' ) : (',
 I(14) + ' <div>',
 I(14) + ' <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 6 }}>DOMAIN CHÍNH</div>',
 I(14) + ' <div className="flex items-center justify-between p-4 rounded-xl"',
 I(14) + ' style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${DS.border}`, opacity: 0.7 }}>',
 I(14) + ' <div className="flex items-center gap-3">',
 I(14) + ' <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>',
 I(14) + ' <X size={12} style={{ color: DS.text4 }} />',
 I(14) + ' </div>',
 I(14) + ' <div>',
 I(14) + ' <span style={{ color: DS.text3, fontSize: 14, fontFamily: DS.mono, fontWeight: 600 }}>{primary.domain}</span>',
 I(14) + ' <span style={{ color: DS.red, fontSize: 11, marginLeft: 8 }}>(đã được đăng ký)</span>',
 I(14) + ' </div>',
 I(14) + ' </div>',
 I(14) + ' </div>',
 I(14) + ' </div>',
 I(14) + ' )}',
 I(14) + ' </div>',
 I(14) + ' );',
 I(14) + ' })()}',
 '',
 I(14) + ' {/* Alternative TLDs */}',
 I(14) + ' {domainSearchResults.length > 1 && (',
 I(14) + ' <div className="mt-3">',
 I(14) + ' <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 8 }}>GỢI Ý KHÁC</div>',
 I(14) + ' <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>',
 I(14) + ' {domainSearchResults.slice(1).map(result => {',
 I(14) + ' const isSelected = selectedDomains.some(d => d.domain === result.domain);',
 I(14) + ' const isAvailable = result.available;',
 I(14) + ' return (',
 I(14) + ' <div key={result.domain}',
 I(14) + ' className="flex items-center justify-between p-3 rounded-xl cursor-pointer"',
 I(14) + ' style={{ background: isSelected ? `rgba(59,130,246,0.12)` : isAvailable ? `rgba(34,197,94,0.06)` : "rgba(255,255,255,0.03)", border: isSelected ? `1.5px solid ${DS.blue}` : isAvailable ? `1px solid ${DS.green}30` : `1px solid ${DS.border}`, opacity: isAvailable ? 1 : 0.6 }}',
 I(14) + ' onClick={() => { if(result.available) toggleDomain(result.domain, result.price ?? 0); }}>',
 I(14) + ' <div className="flex items-center gap-2">',
 I(14) + ' <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: isSelected ? `${DS.blue}20` : `${DS.green}15` }}>',
 I(14) + ' {isSelected ? <Check size={9} style={{ color: DS.blue }} /> : isAvailable ? <Check size={9} style={{ color: DS.green }} /> : <X size={9} style={{ color: DS.text4 }} />}',
 I(14) + ' </div>',
 I(14) + ' <span style={{ color: isAvailable ? DS.text : DS.text3, fontSize: 12, fontFamily: DS.mono }}>{result.domain}</span>',
 I(14) + ' </div>',
 I(14) + ' {isAvailable && result.price > 0 && (',
 I(14) + ' <span style={{ color: DS.green, fontSize: 11, fontFamily: DS.mono, fontWeight: 600 }}>{fmtVND(result.price)}</span>',
 I(14) + ' )}',
 I(14) + ' </div>',
 I(14) + ' );',
 I(14) + ' })}',
 I(14) + ' </div>',
 I(14) + ' </div>',
 I(14) + ' )}',
 '',
 I(14) + ' {/* Selected summary */}',
 I(14) + ' {selectedDomains.length > 0 && (',
 I(14) + ' <div className="mt-4 p-3 rounded-xl" style={{ background: `${DS.blue}08`, border: `1px solid ${DS.blue}25` }}>',
 I(14) + ' <div className="flex items-center justify-between">',
 I(14) + ' <div className="flex items-center gap-2">',
 I(14) + '<Check size={13} style={{ color: DS.blue }} />',
 I(14) + ' <span style={{ color: DS.blue, fontSize: 12, fontFamily: DS.mono }}>Đã chọn {selectedDomains.length} domain</span>',
 I(14) + ' </div>',
 I(14) + ' <span style={{ color: DS.blue, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>{fmtVND(selectedDomainTotal)}</span>',
 I(14) + ' </div>',
 I(14) + ' <div className="mt-2 flex flex-wrap gap-2">',
 I(14) + ' {selectedDomains.map(d => (',
 I(14) + ' <span key={d.domain} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{ background: `${DS.blue}15`, color: DS.blue, fontFamily: DS.mono }}>',
 I(14) + ' {d.domain}',
 I(14) + ' <button onClick={() => toggleDomain(d.domain, d.price)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: DS.blue, display: "flex" }}>',
 I(14) + ' <X size={10} />',
 I(14) + ' </button>',
 I(14) + ' </span>',
 I(14) + ' ))}',
 I(14) + ' </div>',
 I(14) + ' </div>',
 I(14) + ' )}',
 I(14) + ' </div>',
  I(14) + ' )}',
 I(14) + ' </div>',
 I(14) + ')}',
 I(14) + '</div>',
];
lines.splice(mb_start, mb_end - mb_start + 1, ...new_domain);
edits++;
console.log('J. Domain section replaced');

// ── K. Add searchDomain function after toggleExtra ─────────────────────────
const te_i = find(l => l.includes('const toggleExtra = (id: string)'));
let te_end = te_i;
while (!lines[te_end].trim().endsWith('};')) te_end++;
const search_fn = [
 '',
 ' // ── Domain search (Step 1) ────────────────────────────────────────────',
 ' const searchDomain = async () => {',
 ' if (domainName.trim().length < 2) return;',
 ' setDomainSearching(true);',
 ' setDomainError("");',
 ' setDomainHasSearched(true);',
 ' try {',
 ' const keyword = domainName.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");',
 ' const tld = domainName.includes(".")',
 ' ? domainName.split(".").pop() ?? "vn"',
 ' : "vn";',
 ' const params = new URLSearchParams({ q: keyword, tld });',
 ' const res = await fetch(`/api/pricing/domain-search?${params}`);',
 ' if (res.ok) {',
 ' const json = await res.json();',
 ' setDomainSearchResults(json.data?.domains ?? []);',
 ' } else {',
 ' setDomainError("Tìm kiếm thất bại");',
 ' }',
 ' } catch {',
 ' setDomainError("Lỗi mạng");',
 ' }',
 ' setDomainSearching(false);',
 ' };',
];
lines.splice(te_end + 1, 0, ...search_fn);
edits++;
console.log('K. searchDomain at L' + (te_end + 2));

// ── Write ─────────────────────────────────────────────────────────────────
fs.writeFileSync('src/components/landing/BookingWizardClient.tsx', lines.join('\n'));
console.log('\n' + edits + ' edits. Lines: ' + lines.length);

// Verify
const result = lines.join('\n');
const checks = [
 'interface DomainSearchResult',
 'Search, AlertCircle',
 'const [selectedDomains, setSelectedDomains]',
 'const toggleDomain',
 'const selectedDomainTotal',
 'const domainCost = selectedDomains.reduce',
 'const domainTotalCost = selectedDomains.reduce',
 'const domainTotal = selectedDomains.reduce',
 "selectedDomains.map(d => d.domain)",
 'selectedDomains.length > 0',
 'DOMAIN CHÍNH',
 'GỢI Ý KHÁC',
 'const searchDomain = async',
 'Kiểm tra',
 'AlertCircle size={13}',
 'domainSearchResults',
 'domainSearching',
 'domainHasSearched',
 'domainError',
 'domainName && domainName.includes(".") && (',
];
let all = true;
for (const ch of checks) {
 const ok = result.includes(ch);
 if (!ok) { all = false; console.log('MISSING: ' + ch); }
}
if (all) console.log('\nALL CHECKS PASSED');
