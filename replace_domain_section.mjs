import fs from 'fs';
const f = 'src/components/landing/BookingWizardClient.tsx';
let c = fs.readFileSync(f, 'utf8');
let lines = c.split('\n');

// Find old mb-6 section start (before "TÊN MIỀN BẠN MUỐN ĐĂNG KÝ")
let start = -1;
for (let i = 0; i < lines.length; i++) {
 if (lines[i].includes('TÊN MIỀN BẠN MUỐN ĐĂNG KÝ</label>')) {
 for (let j = i; j >= 0; j--) {
 if (lines[j].includes('<div className="mb-6">')) { start = j; break; }
 }
 }
}

// Find old purchase timing closing div
let end = -1;
for (let i = start; i < lines.length; i++) {
 if (lines[i].includes('BẠN MUỐN ĐĂNG KÝ KHI NÀO?</div>')) {
 for (let j = i; j < lines.length; j++) {
 if (lines[j].trim() === '</div>') { end = j; break; }
 }
 }
}

console.log('Old section: lines', start+1, '-', end+1);

// Helper: escape $ for template literal content
function esc(s) { return s.replace(/\\`/g, '`').replace(/\\$\\{/g, '${').replace(/\\{/g, '{').replace(/\\}/g, '}'); }

// Write JSX content as regular string lines
const B = ' '; // 12 spaces for inner indentation
const B2 = ' '; // 14 spaces

const newSection = [
`${B}<div className="mb-6">`,
`${B2}<label style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>TÊN MIỀN BẠN MUỐN ĐĂNG KÝ</label>`,
`${B2}<div className="flex gap-3">`,
`${B3}<input value={domainName} onChange={e => setDomainName(e.target.value)} placeholder="ví dụ: mysite.com"`,
`${B3}style={{ flex: 1, background: "rgba(15,23,42,0.6)", border: \`1px solid \${DS.border}\`, borderRadius: 10, padding: "12px 16px", color: DS.text, fontSize: 15, outline: "none", fontFamily: DS.body, boxSizing: "border-box" }} />`,
`${B3}{domainPrices.length > 0 && (`,
`${B3} <select value={selectedTld}`,
`${B3} onChange={e => { setSelectedTld(e.target.value); setDomainHasSearched(false); setDomainSearchResults([]); }}`,
`${B3} style={{ background: "rgba(15,23,42,0.8)", border: \`1px solid \${DS.border}\`, borderRadius: 10, padding: "12px 14px", color: DS.text, fontSize: 14, fontFamily: DS.mono, outline: "none", cursor: "pointer" }}>`,
`${B3} {domainPrices.map(d => <option key={d.extension} value={d.extension} style={{ background: "#0F172A" }}>{d.extension}</option>)}`,
`${B3}</select>`,
`${B3} )}`,
`${B2}</div>`,
``,
`${B2}{/* Search button */}`,
`${B2}<div className="flex gap-2 mt-3">`,
`${B2}<motion.button onClick={searchDomain}`,
`${B2} disabled={domainSearching || domainName.trim().length < 2}`,
`${B2} className="flex items-center gap-2 rounded-xl px-5 py-3 font-semibold transition-all disabled:cursor-not-allowed"`,
`${B2} style={{ background: domainSearching ? "rgba(59,130,246,0.1)" : "rgba(59,130,246,0.15)", border: \`1px solid \${DS.blue}50\`, color: DS.blue, cursor: domainSearching ? "not-allowed" : "pointer" }}`,
`${B2} whileHover={domainSearching ? {} : { scale: 1.02 }}>`,
`${B2}{domainSearching ? (`,
`${B2} <><div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" /><span>Kiểm tra...</span></>`,
`${B2} ) : (`,
`${B2} <><Search size={16} /><span style={{ fontFamily: DS.mono, fontSize: 13 }}>Kiểm tra</span></>`,
`${B2} )}`,
`${B2}</motion.button>`,
`${B2}</div>`,
``,
`${B2}{domainError && (`,
`${B2} <div className="mt-2 flex items-center gap-2">`,
`${B2} <AlertCircle size={13} style={{ color: DS.red }} />`,
`${B2} <span style={{ color: DS.red, fontSize: 12 }}>{domainError}</span>`,
`${B2} </div>`,
`${B2} )}`,
``,
`${B2}{/* Domain search results */}`,
`${B2}{domainHasSearched && (`,
`${B2} <div className="mt-4 space-y-3">`,
`${B2} {domainSearchResults.length === 0 && (`,
`${B2} <div className="p-4 rounded-xl text-center" style={{ background: "rgba(15,23,42,0.4)", border: \`1px solid \${DS.border}\` }}>`,
`${B2} <span style={{ color: DS.text4, fontSize: 13 }}>Không tìm thấy kết quả</span>`,
`${B2} </div>`,
`${B2} )}`,
`${B2} {domainSearchResults.length > 0 && (`,
`${B2} <div>`,
``,
`${B2} {(() => {`,
`${B2} const primary = domainSearchResults[0];`,
`${B2} if (!primary) return null;`,
`${B2} const isSel = selectedDomains.some(d => d.domain === primary.domain);`,
`${B2} const avail = primary.available && (primary.price ?? 0) > 0;`,
`${B2} return (`,
`${B2} <div className="mb-3">`,
`${B2} {avail ? (`,
`${B2} <div>`,
`${B2} <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 6 }}>DOMAIN CHÍNH</div>`,
`${B2} <div className="flex items-center justify-between p-4 rounded-xl cursor-pointer"`,
`${B2} style={{ background: isSel ? \`rgba(59,130,246,0.12)\` : \`rgba(34,197,94,0.06)\`, border: isSel ? \`1.5px solid \${DS.blue}\` : \`1px solid \${DS.green}30\` }}`,
`${B2} onClick={() => { if(avail) toggleDomain(primary.domain, primary.price ?? 0); }}>`,
`${B2} <div className="flex items-center gap-3">`,
`${B2} <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: isSel ? \`\${DS.blue}25\` : \`\${DS.green}20\`, border: isSel ? \`2px solid \${DS.blue}\` : \`2px solid \${DS.green}\` }}>`,
`${B2} <Check size={12} style={{ color: isSel ? DS.blue : DS.green }} />`,
`${B2} </div>`,
`${B2} <span style={{ color: DS.text, fontSize: 14, fontFamily: DS.mono, fontWeight: 700 }}>{primary.domain}</span>`,
`${B2} </div>`,
`${B2} <div className="flex items-center gap-3">`,
`${B2} {isSel && <span style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono, background: \`\${DS.blue}15\`, padding: "2px 8px", borderRadius: 6 }}>Đã chọn</span>}`,
`${B2} {primary.price > 0 && <span style={{ color: DS.green, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>{fmtVND(primary.price)}</span>}`,
`${B2} </div>`,
`${B2} </div>`,
`${B2} </div>`,
`${B2} ) : (`,
`${B2} <div>`,
`${B2} <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 6 }}>DOMAIN CHÍNH</div>`,
`${B2} <div className="flex items-center justify-between p-4 rounded-xl"`,
`${B2} style={{ background: "rgba(255,255,255,0.03)", border: \`1px solid \${DS.border}\`, opacity: 0.7 }}>`,
`${B2} <div className="flex items-center gap-3">`,
`${B2} <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>`,
`${B2} <X size={12} style={{ color: DS.text4 }} />`,
`${B2} </div>`,
`${B2} <div>`,
`${B2} <span style={{ color: DS.text3, fontSize: 14, fontFamily: DS.mono, fontWeight: 600 }}>{primary.domain}</span>`,
`${B2} <span style={{ color: DS.red, fontSize: 11, marginLeft: 8 }}>(đã được đăng ký)</span>`,
`${B2} </div>`,
`${B2} </div>`,
`${B2} </div>`,
`${B2} </div>`,
`${B2} )}`,
`${B2} </div>`,
`${B2} );`,
`${B2} })()}`,
``,
`${B2} {/* Alternative TLDs */}`,
`${B2} {domainSearchResults.length > 1 && (`,
`${B2} <div className="mt-3">`,
`${B2} <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 8 }}>GỢI Ý KHÁC</div>`,
`${B2} <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>`,
`${B2} {domainSearchResults.slice(1).map(result => {`,
`${B2} const isSel = selectedDomains.some(d => d.domain === result.domain);`,
`${B2} const avail = result.available && (result.price ?? 0) > 0;`,
`${B2} return (`,
`${B2} <div key={result.domain}`,
`${B2} className="flex items-center justify-between p-3 rounded-xl cursor-pointer"`,
`${B2} style={{ background: isSel ? \`rgba(59,130,246,0.12)\` : avail ? \`rgba(34,197,94,0.06)\` : "rgba(255,255,255,0.03)", border: isSel ? \`1.5px solid \${DS.blue}\` : avail ? \`1px solid \${DS.green}30\` : \`1px solid \${DS.border}\`, opacity: avail ? 1 : 0.6 }}`,
`${B2} onClick={() => { if(avail) toggleDomain(result.domain, result.price ?? 0); }}>`,
`${B2} <div className="flex items-center gap-2">`,
`${B2} <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: isSel ? \`\${DS.blue}20\` : \`\${DS.green}15\` }}>`,
`${B2} {isSel ? <Check size={9} style={{ color: DS.blue }} /> : avail ? <Check size={9} style={{ color: DS.green }} /> : <X size={9} style={{ color: DS.text4 }} />}`,
`${B2} </div>`,
`${B2} <span style={{ color: avail ? DS.text : DS.text3, fontSize: 12, fontFamily: DS.mono }}>{result.domain}</span>`,
`${B2} </div>`,
`${B2} {avail && result.price > 0 && (`,
`${B2} <span style={{ color: DS.green, fontSize: 11, fontFamily: DS.mono, fontWeight: 600 }}>{fmtVND(result.price)}</span>`,
`${B2} )}`,
`${B2} </div>`,
`${B2} );`,
`${B2} })}`,
`${B2} </div>`,
`${B2} </div>`,
`${B2} )}`,
``,
`${B2} {/* Selected summary */}`,
`${B2} {selectedDomains.length > 0 && (`,
`${B2} <div className="mt-4 p-3 rounded-xl" style={{ background: \`\${DS.blue}08\`, border: \`1px solid \${DS.blue}25\` }}>`,
`${B2} <div className="flex items-center justify-between">`,
`${B2} <div className="flex items-center gap-2">`,
`${B2} <Check size={13} style={{ color: DS.blue }} />`,
`${B2} <span style={{ color: DS.blue, fontSize: 12, fontFamily: DS.mono }}>Đã chọn {selectedDomains.length} domain</span>`,
`${B2} </div>`,
`${B2} <span style={{ color: DS.blue, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>{fmtVND(selectedDomainTotal)}</span>`,
`${B2} </div>`,
`${B2} <div className="mt-2 flex flex-wrap gap-2">`,
`${B2} {selectedDomains.map(d => (`,
`${B2} <span key={d.domain} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{ background: \`\${DS.blue}15\`, color: DS.blue, fontFamily: DS.mono }}>`,
`${B2} {d.domain}`,
`${B2} <button onClick={() => toggleDomain(d.domain, d.price)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: DS.blue, display: "flex" }}>`,
`${B2} <X size={10} />`,
`${B2} </button>`,
`${B2} </span>`,
`${B2} ))}`,
`${B2} </div>`,
`${B2} </div>`,
`${B2} )}`,
`${B2} </div>`,
`${B2} )}`,
`${B2} </div>`,
`${B2} )}`,
`${B}</div>`,
``,
`${B}{/* Purchase timing */}`,
`${B}{domainName && domainName.includes(".") && (`,
`${B} <div className="mb-6 p-4 rounded-xl" style={{ background: "rgba(15,23,42,0.5)", border: \`1px solid \${DS.border}\` }}>`,
`${B} <div style={{ color: DS.text2, fontSize: 12, fontFamily: DS.mono, marginBottom: 12 }}>BẠN MUỐN ĐĂNG KÝ KHI NÀO?</div>`,
`${B} <div className="flex flex-col sm:flex-row gap-3">`,
`${B} {[{ now: true, label: "Đăng ký ngay bây giờ", desc: "Domain được đăng ký trước khi bàn giao web.", color: DS.blue, bg: "rgba(59,130,246,0.1)", border: "1.5px solid rgba(59,130,246,0.4)" },`,
`${B} { now: false, label: "Mua sau khi bàn giao", desc: "Bạn tự chuẩn bị domain riêng.", color: DS.purple, bg: "rgba(129,140,248,0.08)", border: "1.5px solid rgba(129,140,248,0.3)" }]`,
`${B} .map(opt => (`,
`${B} <motion.button key={String(opt.now)} onClick={() => setDomainPurchaseNow(opt.now)} className="flex-1 text-left p-4 rounded-xl"`,
`${B} style={{ background: domainPurchaseNow === opt.now ? opt.bg : "rgba(15,23,42,0.3)", border: domainPurchaseNow === opt.now ? opt.border : \`1px solid \${DS.border}\`, cursor: "pointer" }}`,
`${B} whileHover={{ scale: 1.01 }}>`,
`${B} <div className="flex items-center gap-2 mb-2">`,
`${B} <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: domainPurchaseNow === opt.now ? opt.color : "transparent", border: domainPurchaseNow === opt.now ? "none" : \`1.5px solid \${DS.text4}\` }}>`,
`${B} {domainPurchaseNow === opt.now && <Check size={9} style={{ color: "#fff" }} />}`,
`${B} </div>`,
`${B} <span style={{ color: DS.text, fontSize: 13, fontWeight: 600 }}>{opt.label}</span>`,
`${B} </div>`,
`${B} <div style={{ color: DS.text4, fontSize: 11, marginLeft: 24 }}>{opt.desc}</div>`,
`${B} </motion.button>`,
`${B} ))}`,
`${B} </div>`,
`${B} </div>`,
`${B} )}`,
];

// Build the actual lines from the array
// The array above is the content to insert
// But we need to write it as literal TSX lines, not evaluate them
// So: write each item as a separate line

const rawSection = newSection.join('\n');

if (start !== -1 && end !== -1) {
 lines.splice(start, end - start + 1, rawSection);
 console.log('Replaced. New lines:', lines.length);
} else {
 console.log('Not found: start=' + start + ' end=' + end);
}
fs.writeFileSync(f, lines.join('\n'));
