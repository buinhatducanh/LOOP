#!/usr/bin/env node
import fs from 'fs';

const c = fs.readFileSync('src/components/landing/BookingWizardClient.tsx', 'utf8');
let r = c;

// A. DomainSearchResult type
const tdef = `interface DomainSearchResult {
 domain: string;
 available: boolean;
 reason?: string;
 price: number;
}
`;
r = r.replace(/(interface WizardDomainPrice \{[^}]+\})/s, '$1\n' + tdef);

// B. Icons
r = r.replace('Users, Calendar, Layers, Sparkles, Shield, Plus, Minus, X, ExternalLink, Zap, Eye, Server,',
'Users, Calendar, Layers, Sparkles, Shield, Plus, Minus, X, ExternalLink, Zap, Eye, Server, Search, AlertCircle,');

// C. State vars
const states = `
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
`;
r = r.replace(/(const \[domainPurchaseNow, setDomainPurchaseNow\] = useState<boolean>\(false\);)/, '$1' + states);

// D. domainCost
r = r.replace(/const domainCost = domainPurchaseNow[\s\S]*?const currentSubtotal/,
' const domainCost = selectedDomains.reduce((s, d) => s + (d.price ?? 0), 0);\nconst currentSubtotal');

// E. domainTotalCost
r = r.replace(/const domainTotalCost = domainPurchaseNow[\s\S]*?const hostingTotalCost/,
' const domainTotalCost = selectedDomains.reduce((s, d) => s + (d.price ?? 0), 0);\nconst hostingTotalCost');

// F. domainTotal
r = r.replace(/const domainTotal = domainPurchaseNow[\s\S]*?const subtotalForDisplay/,
' const domainTotal = selectedDomains.reduce((s, d) => s + (d.price ?? 0), 0);\nconst subtotalForDisplay');

// G. Submit
r = r.replace('domainName: domainName || undefined,', 'domainName: selectedDomains.map(d => d.domain).join(", ") || undefined,');

// H. Sidebar
r = r.replace('+Domain: {fmtVND(domainTotal)}',
'+Domain: {selectedDomains.length > 0 ? `${selectedDomains.length} domain · ${fmtVND(selectedDomainTotal)}` : "+0"}');

// I. Purchase timing - ONLY the one that has domainPrices.find
r = r.replace(
/{domainName && domainName\.includes\("\."\) && domainPrices\.find\(d => domainName\.endsWith\(d\.extension\)\) && \(/,
'{domainName && domainName.includes(".") && ('
);

// J. Domain section - replace old mb-6 div
const IND = ' ';
const newD = IND + `<div className="mb-6">
${IND} <label style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>TÊN MIỀN BẠN MUỐN ĐĂNG KÝ</label>
${IND} <div className="flex gap-3">
${IND} <input value={domainName} onChange={e => setDomainName(e.target.value)} placeholder="ví dụ: mysite.com"
${IND} style={{ flex: 1, background: "rgba(15,23,42,0.6)", border: \`1px solid \${DS.border}\`, borderRadius: 10, padding: "12px 16px", color: DS.text, fontSize: 15, outline: "none", fontFamily: DS.body, boxSizing: "border-box" }} />
${IND} {domainPrices.length > 0 && (
${IND} <select value={domainName.includes(".") ? "." + domainName.split(".").pop() || ".com" : ".com"}
${IND} onChange={e => { const base = domainName.includes(".") ? domainName.split(".")[0] || domainName : domainName; setDomainName(base + e.target.value); setDomainHasSearched(false); setDomainSearchResults([]); }}
${IND} style={{ background: "rgba(15,23,42,0.8)", border: \`1px solid \${DS.border}\`, borderRadius: 10, padding: "12px 14px", color: DS.text, fontSize: 14, fontFamily: DS.mono, outline: "none", cursor: "pointer" }}>
${IND} {domainPrices.map(d => <option key={d.extension} value={d.extension} style={{ background: "#0F172A" }}>{d.extension}</option>)}
${IND} </select>
${IND} )}
${IND} </div>
${IND}
${IND} {/* Search button */}
${IND} <div className="flex gap-2 mt-3">
${IND} <motion.button onClick={searchDomain}
${IND} disabled={domainSearching || domainName.trim().length < 2}
${IND} className="flex items-center gap-2 rounded-xl px-5 py-3 font-semibold transition-all disabled:cursor-not-allowed"
${IND} style={{ background: domainSearching ? "rgba(59,130,246,0.1)" : "rgba(59,130,246,0.15)", border: \`1px solid \${DS.blue}50\`, color: DS.blue, cursor: domainSearching ? "not-allowed" : "pointer" }}
${IND} whileHover={domainSearching ? {} : { scale: 1.02 }}>
${IND} {domainSearching ? (
${IND} <><div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" /><span>Kiểm tra...</span></>
${IND} ) : (
${IND} <><Search size={16} /><span style={{ fontFamily: DS.mono, fontSize: 13 }}>Kiểm tra</span></>
${IND} )}
${IND} </motion.button>
${IND} </div>
${IND}
${IND} {domainError && (
${IND} <div className="mt-2 flex items-center gap-2">
${IND} <AlertCircle size={13} style={{ color: DS.red }} />
${IND} <span style={{ color: DS.red, fontSize: 12 }}>{domainError}</span>
${IND} </div>
${IND} )}
${IND}
${IND} {/* Domain search results */}
${IND} {domainHasSearched && (
${IND} <div className="mt-4 space-y-3">
${IND} {domainSearchResults.length === 0 && (
${IND} <div className="p-4 rounded-xl text-center" style={{ background: "rgba(15,23,42,0.4)", border: \`1px solid \${DS.border}\` }}>
${IND} <span style={{ color: DS.text4, fontSize: 13 }}>Không tìm thấy kết quả</span>
${IND} </div>
${IND} )}
${IND} {domainSearchResults.length > 0 && (
${IND} <div>
${IND}
${IND} {/* Primary domain */}
${IND} {(() => {
${IND} const primary = domainSearchResults[0];
${IND} const isSelected = selectedDomains.some(d => d.domain === primary.domain);
${IND} const isAvailable = primary.available;
${IND} return (
${IND} <div className="mb-3">
${IND} {isAvailable ? (
${IND} <div>
${IND} <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 6 }}>DOMAIN CHÍNH</div>
${IND} <div className="flex items-center justify-between p-4 rounded-xl cursor-pointer"
${IND} style={{ background: isSelected ? \`rgba(59,130,246,0.12)\` : \`rgba(34,197,94,0.06)\`, border: isSelected ? \`1.5px solid \${DS.blue}\` : \`1px solid \${DS.green}30\` }}
${IND} onClick={() => { if(primary.available) toggleDomain(primary.domain, primary.price ?? 0); }}>
${IND} <div className="flex items-center gap-3">
${IND} <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: isSelected ? \`\${DS.blue}25\` : \`\${DS.green}20\`, border: isSelected ? \`2px solid \${DS.blue}\` : \`2px solid \${DS.green}\` }}>
${IND} {isSelected ? <Check size={12} style={{ color: DS.blue }} /> : <Check size={12} style={{ color: DS.green }} />}
${IND} </div>
${IND} <span style={{ color: DS.text, fontSize: 14, fontFamily: DS.mono, fontWeight: 700 }}>{primary.domain}</span>
${IND} </div>
${IND} <div className="flex items-center gap-3">
${IND} {isSelected && <span style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono, background: \`\${DS.blue}15\`, padding: "2px 8px", borderRadius: 6 }}>Đã chọn</span>}
${IND} {primary.price > 0 && <span style={{ color: DS.green, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>{fmtVND(primary.price)}</span>}
${IND} </div>
${IND} </div>
${IND} </div>
${IND} ) : (
${IND} <div>
${IND} <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 6 }}>DOMAIN CHÍNH</div>
${IND} <div className="flex items-center justify-between p-4 rounded-xl"
${IND} style={{ background: "rgba(255,255,255,0.03)", border: \`1px solid \${DS.border}\`, opacity: 0.7 }}>
${IND} <div className="flex items-center gap-3">
${IND} <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
${IND} <X size={12} style={{ color: DS.text4 }} />
${IND} </div>
${IND} <div>
${IND} <span style={{ color: DS.text3, fontSize: 14, fontFamily: DS.mono, fontWeight: 600 }}>{primary.domain}</span>
${IND} <span style={{ color: DS.red, fontSize: 11, marginLeft: 8 }}>(đã được đăng ký)</span>
${IND} </div>
${IND} </div>
${IND} </div>
${IND} </div>
${IND} )}
${IND} </div>
${IND} );
${IND} })()}
${IND}
${IND} {/* Alternative TLDs */}
${IND} {domainSearchResults.length > 1 && (
${IND} <div className="mt-3">
${IND} <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 8 }}>GỢI Ý KHÁC</div>
${IND} <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
${IND} {domainSearchResults.slice(1).map(result => {
${IND} const isSelected = selectedDomains.some(d => d.domain === result.domain);
${IND} const isAvailable = result.available;
${IND} return (
${IND} <div key={result.domain}
${IND} className="flex items-center justify-between p-3 rounded-xl cursor-pointer"
${IND} style={{ background: isSelected ? \`rgba(59,130,246,0.12)\` : isAvailable ? \`rgba(34,197,94,0.06)\` : "rgba(255,255,255,0.03)", border: isSelected ? \`1.5px solid \${DS.blue}\` : isAvailable ? \`1px solid \${DS.green}30\` : \`1px solid \${DS.border}\`, opacity: isAvailable ? 1 : 0.6 }}
${IND} onClick={() => { if(result.available) toggleDomain(result.domain, result.price ?? 0); }}>
${IND} <div className="flex items-center gap-2">
${IND} <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: isSelected ? \`\${DS.blue}20\` : \`\${DS.green}15\` }}>
${IND} {isSelected ? <Check size={9} style={{ color: DS.blue }} /> : isAvailable ? <Check size={9} style={{ color: DS.green }} /> : <X size={9} style={{ color: DS.text4 }} />}
${IND} </div>
${IND} <span style={{ color: isAvailable ? DS.text : DS.text3, fontSize: 12, fontFamily: DS.mono }}>{result.domain}</span>
${IND} </div>
${IND} {isAvailable && result.price > 0 && (
${IND} <span style={{ color: DS.green, fontSize: 11, fontFamily: DS.mono, fontWeight: 600 }}>{fmtVND(result.price)}</span>
${IND} )}
${IND} </div>
${IND} );
${IND} })}
${IND} </div>
${IND} </div>
${IND} )}
${IND}
${IND} {/* Selected summary */}
${IND} {selectedDomains.length > 0 && (
${IND} <div className="mt-4 p-3 rounded-xl" style={{ background: \`\${DS.blue}08\`, border: \`1px solid \${DS.blue}25\` }}>
${IND} <div className="flex items-center justify-between">
${IND} <div className="flex items-center gap-2">
${IND} <Check size={13} style={{ color: DS.blue }} />
${IND} <span style={{ color: DS.blue, fontSize: 12, fontFamily: DS.mono }}>Đã chọn {selectedDomains.length} domain</span>
${IND} </div>
${IND} <span style={{ color: DS.blue, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>{fmtVND(selectedDomainTotal)}</span>
${IND} </div>
${IND} <div className="mt-2 flex flex-wrap gap-2">
${IND} {selectedDomains.map(d => (
${IND} <span key={d.domain} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{ background: \`\${DS.blue}15\`, color: DS.blue, fontFamily: DS.mono }}>
${IND} {d.domain}
${IND} <button onClick={() => toggleDomain(d.domain, d.price)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: DS.blue, display: "flex" }}>
${IND} <X size={10} />
${IND} </button>
${IND} </span>
${IND} ))}
${IND} </div>
${IND} </div>
${IND} )}
${IND} </div>
${IND} )}
${IND} </div>
${IND} )}
${IND} </div>
${IND} )}
${IND}</div>`;

const oldMb6 = /<div className="mb-6">\n( [\s\S]*?\n <\/div>\n\n \{\{\/\* Purchase timing\})/;
if (oldMb6.test(r)) {
 r = r.replace(oldMb6, newD + '\n');
 console.log('J. Domain section replaced');
} else {
 console.log('J. FAIL - pattern not found');
}

// K. searchDomain function
const sf = `
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
 };
`;
const teRegex = /(const toggleExtra = \(id: string\) => \{[\s\S]*?^\s\};)/m;
if (teRegex.test(r)) {
 r = r.replace(teRegex, '$1' + sf);
 console.log('K. searchDomain added');
} else {
 console.log('K. FAIL');
}

fs.writeFileSync('src/components/landing/BookingWizardClient.tsx', r);
console.log('Lines:', r.split('\n').length);

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
 'DOMAIN CHÍNH',
 'GỢI Ý KHÁC',
 'const searchDomain = async',
 'Kiểm tra',
 'domainSearchResults',
 'domainSearching',
 'domainHasSearched',
 'domainError',
 'domainName && domainName.includes(".") && (',
];
let ok = true;
for (const ch of checks) {
 if (!r.includes(ch)) { ok = false; console.log('MISSING:', ch); }
}
if (ok) console.log('ALL CHECKS PASSED');
