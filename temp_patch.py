#!/usr/bin/env python3
with open('D:/LOOP_COMPANY/LOOP/src/app/admin/leaderboard_admin/page.tsx', 'r', encoding='utf-8') as f:
 content = f.read()

marker = 'export default function LeaderboardAdminPage()'
pos = content.find(marker)
if pos == -1:
 print('Main page not found!'); exit(1)

commission_component = '''// Commission Leaderboard component

const fmtCommLP = (n: number) =>
 n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M LP` :
 n >= 1_000 ? `${(n / 1_000).toFixed(0)}K LP` :
 `${n} LP`;

function CommissionLeaderboard({
 entries,
 isLoading,
 isFetching,
 onRefresh,
}: {
 entries: Array<{
 id: string;
 name: string;
 avatar: string | null;
 systemRole: string | null;
 departmentKey: string | null;
 completedCommission: number;
 totalSalesCommission: number;
 dealCount: number;
 }>;
 isLoading: boolean;
 isFetching: boolean;
 onRefresh: () => void;
}) {
 const medals = ["\\u0001F949", "\\u0001F948", "\\u0001F949"];
 const top3 = entries.slice(0, 3);
 const rest = entries.slice(3);

 return (
 <div>
 {/* KPI Row */}
 <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
 <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "16px 20px" }}>
 <div style={{ color: DS.text4, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: DS.mono, marginBottom: 4 }}>
 Top Sales
 </div>
 <div style={{ color: DS.pink, fontSize: 20, fontWeight: 800 }}>
 {top3[0]?.name ?? "\\u2014"}
 </div>
 </div>
 <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "16px 20px" }}>
 <div style={{ color: DS.text4, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: DS.mono, marginBottom: 4 }}>
 Tong LP hoa hong
 </div>
 <div style={{ color: DS.pink, fontSize: 20, fontWeight: 800 }}>
 {fmtCommLP(entries.reduce((s, e) => s + e.completedCommission, 0))}
 </div>
 </div>
 <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "16px 20px" }}>
 <div style={{ color: DS.text4, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: DS.mono, marginBottom: 4 }}>
 Top Deals
 </div>
 <div style={{ color: DS.amber, fontSize: 20, fontWeight: 800 }}>
 {entries.reduce((s, e) => s + e.dealCount, 0)}
 </div>
 </div>
 <div style={{ background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 12, padding: "16px 20px" }}>
 <div style={{ color: DS.text4, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: DS.mono, marginBottom: 4 }}>
 Sales reps
 </div>
 <div style={{ color: DS.cosmicBlue, fontSize: 20, fontWeight: 800 }}>
 {entries.length}
 </div>
 </div>
 </div>

 {/* Loading */}
 {isLoading ? (
 <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
 <div style={{ width: 36, height: 36, border: `3px solid ${DS.border}`, borderTopColor: DS.pink, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
 </div>
 ) : entries.length === 0 ? (
 <div style={{ textAlign: "center", padding: "60px 0", color: DS.text4 }}>
 <TrendingUp size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
 <p style={{ fontSize: 14, fontWeight: 600 }}>Chua co du lieu hoa hong</p>
 <p style={{ fontSize: 12, marginTop: 4 }}>Hoan hong se hien thi khi co don hang hoan thanh</p>
 </div>
 ) : (
 <>
 {/* Top 3 Podium */}
 {top3.length > 0 && (
 <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: "0 16px", marginBottom: 28, padding: "20px 0 0" }}>
 {top3.map((member, idx) => {
 const medal = medals[idx];
 const heights = ["80px", "110px", "60px"];
 const colors = ["#FFD700", "#C0C0C0", "#CD7F32"];
 const h = heights[idx];
 const col = colors[idx];
 return (
 <div key={member.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, maxWidth: 160 }}>
 <span style={{ fontSize: 18, marginBottom: 4 }}>{medal}</span>
 <div style={{
 width: idx === 0 ? 72 : 60, height: idx === 0 ? 72 : 60,
 borderRadius: "50%", overflow: "hidden",
 background: "#111827", border: `3px solid ${col}`,
 boxShadow: `0 0 20px ${col}50`,
 marginBottom: 6,
 display: "flex", alignItems: "center", justifyContent: "center",
 }}>
 {member.avatar
 ? <img src={member.avatar} alt={member.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
 : <span style={{ color: DS.text2, fontWeight: 800, fontSize: 20 }}>{member.name.charAt(0)}</span>}
 </div>
 <div style={{ color: DS.text, fontWeight: 700, fontSize: 13, textAlign: "center", marginBottom: 2 }}>{member.name}</div>
 <div style={{ color: DS.text4, fontSize: 11 }}>{member.dealCount} deals</div>
 <div style={{ color: DS.pink, fontWeight: 800, fontSize: 15, marginTop: 4 }}>{fmtCommLP(member.completedCommission)}</div>
 </div>
 );
 })}
 </div>
 )}

 {/* Table */}
 <div style={{ overflowX: "auto" }}>
 <table style={{ width: "100%", borderCollapse: "collapse" }}>
 <thead>
 <tr style={{ borderBottom: `1px solid ${DS.border}` }}>
 <th style={{ padding: "12px 16px", textAlign: "left", color: DS.text4, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>#</th>
 <th style={{ padding: "12px 16px", textAlign: "left", color: DS.text4, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Sales Rep</th>
 <th style={{ padding: "12px 16px", textAlign: "left", color: DS.text4, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Chuc vu</th>
 <th style={{ padding: "12px 16px", textAlign: "center", color: DS.text4, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Deals</th>
 <th style={{ padding: "12px 16px", textAlign: "right", color: DS.text4, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Tong LP</th>
 <th style={{ padding: "12px 16px", textAlign: "right", color: DS.text4, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Trang thai</th>
 </tr>
 </thead>
 <tbody>
 {rest.map((member, idx) => {
 const rank = idx + 4;
 return (
 <tr key={member.id} style={{ borderBottom: `1px solid ${DS.border}22` }}>
 <td style={{ padding: "14px 16px", color: DS.text4, fontSize: 13, fontWeight: 600 }}>{rank}</td>
 <td style={{ padding: "14px 16px" }}>
 <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
 <div style={{
 width: 36, height: 36, borderRadius: "50%", overflow: "hidden",
 background: "#111827", border: `2px solid ${DS.border}`,
 display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
 }}>
 {member.avatar
 ? <img src={member.avatar} alt={member.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
 : <span style={{ color: DS.text2, fontWeight: 800, fontSize: 14 }}>{member.name.charAt(0)}</span>}
 </div>
 <span style={{ color: DS.text2, fontSize: 13, fontWeight: 600 }}>{member.name}</span>
 </div>
 </td>
 <td style={{ padding: "14px 16px", color: DS.text4, fontSize: 12 }}>
 {member.systemRole ?? member.departmentKey ?? "\\u2014"}
 </td>
 <td style={{ padding: "14px 16px", textAlign: "center", color: DS.amber, fontSize: 13, fontWeight: 700 }}>
 {member.dealCount}
 </td>
 <td style={{ padding: "14px 16px", textAlign: "right" }}>
 <span style={{ color: DS.pink, fontSize: 14, fontWeight: 800, fontFamily: DS.mono }}>
 {fmtCommLP(member.completedCommission)}
 </span>
 </td>
 <td style={{ padding: "14px 16px", textAlign: "right" }}>
 <span style={{
 padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
 background: "rgba(34,197,94,0.15)", color: "#22C55E",
 }}>
 Da nhan
 </span>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>

 {/* Refresh */}
 <div style={{ marginTop: 16, textAlign: "right" }}>
 <button
 onClick={onRefresh}
 style={{
 display: "inline-flex", alignItems: "center", gap: 6,
 padding: "8px 16px",
 background: DS.bgCard, border: `1px solid ${DS.border}`, borderRadius: 10,
 color: DS.text3, cursor: isFetching ? "wait" : "pointer",
 fontSize: 12, fontFamily: DS.mono,
 }}
 >
 <RefreshCw size={13} style={{ animation: isFetching ? "spin 1s linear infinite" : "none" }} />
 Lam moi
 </button>
 </div>
 </>
 )}
 </div>
 );
 }

'''

new_content = content[:pos] + commission_component + '\n' + content[pos:]
with open('D:/LOOP_COMPANY/LOOP/src/app/admin/leaderboard_admin/page.tsx', 'w', encoding='utf-8') as f:
 f.write(new_content)

print('Done! Inserted CommissionLeaderboard component')
