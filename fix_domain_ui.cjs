const fs = require('fs');
const BT = String.fromCharCode(96);
const NL = '\r\n';

// Build new domain UI section
const newSection = [
 ` <div className="mb-6">`,
 ` <label style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>TÊN MIỀN BẠN MUỐN ĐĂNG KÝ</label>`,
 ` <div className="flex gap-3">`,
 ` <input`,
 ` value={domainName}`,
 ` onChange={e => setDomainName(e.target.value)}`,
 ` placeholder="ví dụ: mysite.com"`,
 ` style={{ flex: 1, background: "rgba(15,23,42,0.6)", border: \`1px solid \${DS.border}\`, borderRadius: 10, padding: "12px 16px", color: DS.text, fontSize: 15, outline: "none", fontFamily: DS.body, boxSizing: "border-box" }}`,
 ` />`,
 ` {domainPrices.length > 0 && (`,
 ` <select`,
 ` value={selectedTld}`,
 ` onChange={e => { setSelectedTld(e.target.value); setDomainHasSearched(false); setDomainSearchResults([]); }}`,
 ` style={{ background: "rgba(15,23,42,0.8)", border: \`1px solid \${DS.border}\`, borderRadius: 10, padding: "12px 14px", color: DS.text, fontSize: 14, fontFamily: DS.mono, outline: "none", cursor: "pointer" }}>`,
 ` {domainPrices.map(d => <option key={d.extension} value={d.extension} style={{ background: "#0F172A" }}>{d.extension}</option>)}`,
 ` </select>`,
 ` )}`,
 ` </div>`,
 ` <div className="flex gap-2 mt-3">`,
 ` <motion.button`,
 ` onClick={searchDomain}`,
 ` disabled={domainSearching || domainName.trim().length < 2}`,
 ` className="flex items-center gap-2 rounded-xl px-5 py-3 font-semibold transition-all disabled:cursor-not-allowed"`,
 ` style={{ background: domainSearching ? "rgba(59,130,246,0.1)" : "rgba(59,130,246,0.15)", border: \`1px solid \${DS.blue}50\`, color: DS.blue, cursor: domainSearching ? "not-allowed" : "pointer" }}`,
 ` whileHover={domainSearching ? {} : { scale: 1.02 }}>`,
 ` {domainSearching ? (`,
 ` <><div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" /><span>Kiểm tra...</span></>`,
 ` ) : (`,
 ` <><Search size={16} /><span style={{ fontFamily: DS.mono, fontSize: 13 }}>Kiểm tra</span></>`,
 ` )}`,
 ` </motion.button>`,
 ` </div>`,
 ` {domainError && (`,
 ` <div className="mt-2 flex items-center gap-2">`,
 ` <AlertCircle size={13} style={{ color: DS.red }} />`,
 ` <span style={{ color: DS.red, fontSize: 12 }}>{domainError}</span>`,
 ` </div>`,
 ` )}`,
 ` {domainHasSearched && (`,
 ` <div className="mt-4 space-y-3">`,
 ` {domainSearchResults.length === 0 && (`,
 ` <div className="p-4 rounded-xl text-center" style={{ background: "rgba(15,23,42,0.4)", border: \`1px solid \${DS.border}\` }}>`,
 ` <span style={{ color: DS.text4, fontSize: 13 }}>Không tìm thấy kết quả</span>`,
 ` </div>`,
 ` )}`,
 ` {domainSearchResults.length > 0 && (`,
 ` <div>`,
 ` {(() => {`,
 ` const primary = domainSearchResults[0];`,
 ` if (!primary) return null;`,
 ` const isSel = selectedDomains.some(d => d.domain === primary.domain);`,
 ` const avail = primary.available && (primary.price ?? 0) > 0;`,
 ` return (`,
 ` <div className="mb-3">`,
 ` {avail ? (`,
 ` <div>`,
 ` <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 6 }}>DOMAIN CHÍNH</div>`,
 ` <div className="flex items-center justify-between p-4 rounded-xl cursor-pointer"`,
 ` style={{ background: isSel ? \`rgba(59,130,246,0.12)\` : \`rgba(34,197,94,0.06)\`, border: isSel ? \`1.5px solid \${DS.blue}\` : \`1px solid \${DS.green}30\` }}`,
 ` onClick={() => { if(avail) toggleDomain(primary.domain, primary.price ?? 0); }}>`,
 ` <div className="flex items-center gap-3">`,
 ` <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: isSel ? \`\${DS.blue}25\` : \`\${DS.green}20\`, border: isSel ? \`2px solid \${DS.blue}\` : \`2px solid \${DS.green}\` }}>`,
 ` <Check size={12} style={{ color: isSel ? DS.blue : DS.green }} />`,
 ` </div>`,
 ` <span style={{ color: DS.text, fontSize: 14, fontFamily: DS.mono, fontWeight: 700 }}>{primary.domain}</span>`,
 ` </div>`,
 ` <div className="flex items-center gap-3">`,
 ` {isSel && <span style={{ color: DS.blue, fontSize: 11, fontFamily: DS.mono, background: \`\${DS.blue}15\`, padding: "2px 8px", borderRadius: 6 }}>Đã chọn</span>}`,
 ` {primary.price > 0 && <span style={{ color: DS.green, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>{fmtVND(primary.price)}</span>}`,
 ` </div>`,
 ` </div>`,
 ` </div>`,
 ` ) : (`,
 ` <div>`,
 ` <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 6 }}>DOMAIN CHÍNH</div>`,
 ` <div className="flex items-center justify-between p-4 rounded-xl"`,
 ` style={{ background: "rgba(255,255,255,0.03)", border: \`1px solid \${DS.border}\`, opacity: 0.7 }}>`,
 ` <div className="flex items-center gap-3">`,
 ` <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>`,
 ` <X size={12} style={{ color: DS.text4 }} />`,
 ` </div>`,
 ` <div>`,
 ` <span style={{ color: DS.text3, fontSize: 14, fontFamily: DS.mono, fontWeight: 600 }}>{primary.domain}</span>`,
 ` <span style={{ color: DS.red, fontSize: 11, marginLeft: 8 }}>(đã được đăng ký)</span>`,
 ` </div>`,
 ` </div>`,
 ` </div>`,
 ` </div>`,
 ` )}`,
 ` </div>`,
 ` );`,
 ` })()}`,
 ` {domainSearchResults.length > 1 && (`,
 ` <div className="mt-3">`,
 ` <div style={{ color: DS.text4, fontSize: 11, fontFamily: DS.mono, marginBottom: 8 }}>GỢI Ý KHÁC</div>`,
 ` <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>`,
 ` {domainSearchResults.slice(1).map(result => {`,
 ` const isSel = selectedDomains.some(d => d.domain === result.domain);`,
 ` const avail = result.available && (result.price ?? 0) > 0;`,
 ` return (`,
 ` <div key={result.domain}`,
 ` className="flex items-center justify-between p-3 rounded-xl cursor-pointer"`,
 ` style={{ background: isSel ? \`rgba(59,130,246,0.12)\` : avail ? \`rgba(34,197,94,0.06)\` : "rgba(255,255,255,0.03)", border: isSel ? \`1.5px solid \${DS.blue}\` : avail ? \`1px solid \${DS.green}30\` : \`1px solid \${DS.border}\`, opacity: avail ? 1 : 0.6 }}`,
 ` onClick={() => { if(avail) toggleDomain(result.domain, result.price ?? 0); }}>`,
 ` <div className="flex items-center gap-2">`,
 ` <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: isSel ? \`\${DS.blue}20\` : \`\${DS.green}15\` }}>`,
 ` {isSel ? <Check size={9} style={{ color: DS.blue }} /> : avail ? <Check size={9} style={{ color: DS.green }} /> : <X size={9} style={{ color: DS.text4 }} />}`,
 ` </div>`,
 ` <span style={{ color: avail ? DS.text : DS.text3, fontSize: 12, fontFamily: DS.mono }}>{result.domain}</span>`,
 ` </div>`,
 ` {avail && result.price > 0 && (`,
 ` <span style={{ color: DS.green, fontSize: 11, fontFamily: DS.mono, fontWeight: 600 }}>{fmtVND(result.price)}</span>`,
 ` )}`,
 ` </div>`,
 ` );`,
 ` })}}`,
 ` </div>`,
 ` )}`,
 ` {selectedDomains.length > 0 && (`,
 ` <div className="mt-4 p-3 rounded-xl" style={{ background: \`\${DS.blue}08\`, border: \`1px solid \${DS.blue}25\` }}>`,
 ` <div className="flex items-center justify-between">`,
 ` <div className="flex items-center gap-2">`,
 ` <Check size={13} style={{ color: DS.blue }} />`,
 ` <span style={{ color: DS.blue, fontSize: 12, fontFamily: DS.mono }}>Đã chọn {selectedDomains.length} domain</span>`,
 ` </div>`,
 ` <span style={{ color: DS.blue, fontSize: 13, fontFamily: DS.mono, fontWeight: 700 }}>{fmtVND(selectedDomainTotal)}</span>`,
 ` </div>`,
 ` <div className="mt-2 flex flex-wrap gap-2">`,
 ` {selectedDomains.map(d => (`,
 ` <span key={d.domain} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{ background: \`\${DS.blue}15\`, color: DS.blue, fontFamily: DS.mono }}>`,
 ` {d.domain}`,
 ` <button onClick={() => toggleDomain(d.domain, d.price)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: DS.blue, display: "flex" }}>`,
 ` <X size={10} />`,
 ` </button>`,
 ` </span>`,
 ` ))}`,
 ` </div>`,
 ` </div>`,
 ` )}`,
 ` </div>`,
 ` )}`,
 ` </div>`,
 ` )}`,
 ` </div>`,
 ` )}`,
].join(NL);

const oldSection = [
 ` <div className="mb-6">`,
 ` <label style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>TÊN MIỀN BẠN MUỐN ĐĂNG KÝ</label>`,
 ` <div className="flex gap-3">`,
 ` <input value={domainName} onChange={e => setDomainName(e.target.value)} placeholder="ví dụ: mysite.com"`,
 ` style={{ flex: 1, background: "rgba(15,23,42,0.6)", border: \`1px solid \${DS.border}\`, borderRadius: 10, padding: "12px 16px", color: DS.text, fontSize: 15, outline: "none", fontFamily: DS.body, boxSizing: "border-box" }} />`,
 ` {domainPrices.length > 0 && (`,
 ` <select value={domainName.includes(".") ? "." + domainName.split(".").pop() : ".com"}`,
 ` onChange={e => { const base = domainName.includes(".") ? domainName.split(".")[0] : domainName; setDomainName(base + e.target.value); }}`,
 ` style={{ background: "rgba(15,23,42,0.8)", border: \`1px solid \${DS.border}\`, borderRadius: 10, padding: "12px 14px", color: DS.text, fontSize: 14, fontFamily: DS.mono, outline: "none", cursor: "pointer" }}>`,
 ` {domainPrices.map(d => <option key={d.extension} value={d.extension} style={{ background: "#0F172A" }}>{d.extension}</option>)}`,
 ` </select>`,
 ` )}`,
 ` </div>`,
 ` {(() => {`,
 ` const matchedExt = domainName.includes(".") ? domainPrices.find(d => domainName.endsWith(d.extension)) : null;`,
 ` return (<>`,
 ` {matchedExt && (`,
 ` <div className="mt-2 flex items-center gap-2">`,
 ` <Check size={11} style={{ color: DS.green }} />`,
 ` <span style={{ color: DS.green, fontSize: 11, fontFamily: DS.mono }}>Đăng ký {matchedExt.extension}: {fmtVND(matchedExt.registrationPrice)}/{matchedExt.periodVi}</span>`,
 ` <span style={{ color: DS.text5, fontSize: 10 }}>— Gia hạn: {fmtVND(matchedExt.renewalPrice)}/năm</span>`,
 ` </div>`,
 ` )}`,
 ` {domainName && !matchedExt && domainName.includes(".") && (`,
 ` <div className="mt-2"><span style={{ color: DS.amber, fontSize: 11 }}>⚠ Không tìm thấy giá cho .{domainName.split(".").pop()}</span></div>`,
 ` )}`,
 ` {domainName && matchedExt?.note && (`,
 ` <div className="mt-1 px-3 py-2 rounded-lg" style={{ background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.2)" }}>`,
 ` <span style={{ color: DS.amber, fontSize: 11 }}>{matchedExt.note}</span>`,
 ` </div>`,
 ` )}`,
 ` </>);`,
 ` })()}`,
 ` </div>`,
].join(NL);

const c = fs.readFileSync('src/components/landing/BookingWizardClient.tsx', 'utf8');

if (c.includes(oldSection)) {
 const replaced = c.replace(oldSection, newSection);
 fs.writeFileSync('src/components/landing/BookingWizardClient.tsx', replaced);
 console.log('Domain UI replaced. Lines:', replaced.split('\n').length);
} else {
 console.error('Old section not found exactly. Trying byte-index approach...');
 // Use byte-index: find the mb-6 div starting at the label
 const labelIdx = c.indexOf('<label style={{ color: DS.text3, fontSize: 12, fontFamily: DS.mono, letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>TÊN MIỀN BẠN MUỐN ĐĂNG KÝ</label>');
 if (labelIdx < 0) { console.error('Label not found'); process.exit(1); }
 // Find the mb-6 div before this label
 let mb6Idx = labelIdx;
 while (mb6Idx >= 0 && !c.substring(mb6Idx - 20, mb6Idx).includes('<div className="mb-6">')) {
 const prev = c.lastIndexOf('<div', mb6Idx - 1);
 if (prev < 0) break;
 mb6Idx = prev;
 }
 // Count depth to find closing </div>
 let depth = 0;
 let start = mb6Idx;
 let i = mb6Idx;
 let inStr = false;
 let strChar = '';
 while (i < c.length) {
 const ch = c[i];
 const nch = c[i+1];
 if (!inStr) {
 if (ch === '"' || ch === "'" || ch === '`') { inStr = true; strChar = ch; }
 else if (ch === '<' && nch === 'd' && c.substring(i, i+5) === '<div ') depth++;
 else if (ch === '<' && nch === '/' && c.substring(i, i+6) === '</div>') depth--;
 if (depth < 0 || (i > labelIdx && depth === 0 && c.substring(i, i+6) === '</div>')) {
 i += 6;
 break;
 }
 } else {
 if (ch === '\\') i++;
 else if (ch === strChar) inStr = false;
 }
 i++;
 }
 const endIdx = i;
 const oldContent = c.substring(start, endIdx);
 console.log('Section bytes:', start, '-', endIdx, '(', endIdx - start, 'chars)');
 const newContent = oldContent.replace(
 c.substring(labelIdx, mb6Idx + 200),
 newSection
 );
 const replaced2 = c.substring(0, start) + oldContent.replace(oldContent, newSection) + c.substring(endIdx);
 fs.writeFileSync('src/components/landing/BookingWizardClient.tsx', replaced2);
 console.log('Done (byte-index)');
}
