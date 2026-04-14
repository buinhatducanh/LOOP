const fs = require('fs');
let content = fs.readFileSync('D:/LOOP_COMPANY/LOOP/src/app/admin/web_packages/page.tsx', 'utf8');

// Fix 1: Replace broken header section with clean header
const returnStart = content.indexOf('return (\n <div>');
const brokenHeaderStart = content.indexOf('{/* Section tabs */}');
const brokenHeaderEnd = content.indexOf('{/* ── SECTION 1:');

const cleanHeader = ` {/* Tab buttons */}
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
 <div>
 <h2 style={{ fontFamily: DS.heading, fontSize: 20, fontWeight: 800, color: DS.text, margin: "0 0 4px" }}>
 Web Packages
 </h2>
 <p style={{ color: DS.text4, fontSize: 12, fontFamily: DS.mono, margin: 0 }}>
 {activeSection === "packages"
 ? \`\${allPackages.length} goi \xb7 \${activeCount} dang hoat dong\`
 : "Quan ly website khach hang"}
 </p>
 </div>
 <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
 {/* Section tabs */}
 <div style={{ display: "flex", background: DS.bgCard, border: \`1px solid \${DS.border}\`, borderRadius: 10, padding: 3, gap: 2 }}>
 <button
 onClick={() => setActiveSection("packages")}
 style={{
 padding: "5px 14px", borderRadius: 8, border: "none", cursor: "pointer",
 fontSize: 12, fontFamily: DS.mono, fontWeight: 600,
 background: activeSection === "packages" ? GRD.primary : "transparent",
 color: activeSection === "packages" ? "#fff" : DS.text4,
 transition: "all 0.2s",
 }}
 >
 <Package size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
 Goi Web
 </button>
 <button
 onClick={() => setActiveSection("websites")}
 style={{
 padding: "5px 14px", borderRadius: 8, border: "none", cursor: "pointer",
 fontSize: 12, fontFamily: DS.mono, fontWeight: 600,
 background: activeSection === "websites" ? GRD.primary : "transparent",
 color: activeSection === "websites" ? "#fff" : DS.text4,
 transition: "all 0.2s",
 }}
 >
 <Globe size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
 Websites
 </button>
 </div>

 {/* Packages actions */}
 {activeSection === "packages" && (
 <>
 <button
 onClick={() => qc.invalidateQueries({ queryKey: ["admin", "web-packages"] })}
 style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: DS.bgCard, border: \`1px solid \${DS.border}\`, borderRadius: 10, color: DS.text3, cursor: "pointer", fontSize: 12, fontFamily: DS.mono }}
 >
 <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} /> Lam moi
 </button>
 <button onClick={() => setShowAdd(true)}
 style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 16px", background: GRD.primary, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: DS.mono, boxShadow: "0 0 16px rgba(129,140,248,0.3)" }}>
 <Plus size={13} /> Them goi web
 </button>
 </>
 )}
 </div>
 </div>

 {/* SECTION 1: Goi Web Templates */}
 {activeSection === "packages" && (
 <>
`;

const beforeReturn = content.substring(0, returnStart);
const afterBroken = content.substring(brokenHeaderEnd);
content = beforeReturn + cleanHeader + afterBroken;

// Fix 2: Remove duplicate KPI comment
content = content.replace(/\n\s*{\/\* KPI overview \*\/\}\n\s*{\/\* KPI overview \*\/\}/, '\n{/* KPI overview */}');

fs.writeFileSync('D:/LOOP_COMPANY/LOOP/src/app/admin/web_packages/page.tsx', content, 'utf8');
console.log('Header fixed, lines:', content.split('\n').length);
