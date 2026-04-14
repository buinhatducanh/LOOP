#!/usr/bin/env python3
with open('D:/LOOP_COMPANY/LOOP/src/app/admin/leaderboard_admin/page.tsx', 'r', encoding='utf-8') as f:
 lines = f.readlines()

# Build new file content
new_lines = []
i = 0
while i < len(lines):
 l = lines[i]

 # After the header div (line with "Làm mới" button's outer div)
 if 'Làm mới' in l and i > 680:
 new_lines.append(l)
 i += 1
 # The closing </div> of the header
 new_lines.append(lines[i]) # </div> of button div
 i += 1
 new_lines.append(lines[i]) # </div> of header flex div
 i += 1
 # Now add tab switcher before KPI Bar
 new_lines.append('\n')
 new_lines.append(' {/* Tab Switcher */}\n')
 new_lines.append(' <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${DS.border}`, paddingBottom: 0 }}>\n')
 new_lines.append(' {(["lp", "Bảng xếp hạng LP"] as const).map((tab) => (\n')
 new_lines.append(' <button\n')
 new_lines.append(' key={tab}\n')
 new_lines.append(' onClick={() => setViewTab(tab)}\n')
 new_lines.append(' style={{\n')
 new_lines.append(' padding: "10px 20px",\n')
 new_lines.append(' background: "none",\n')
 new_lines.append(' border: "none",\n')
 new_lines.append(' cursor: "pointer",\n')
 new_lines.append(' fontSize: 13,\n')
 new_lines.append(' fontWeight: 600,\n')
 new_lines.append(' color: viewTab === tab ? DS.pink : DS.text4,\n')
 new_lines.append(' borderBottom: viewTab === tab ? `2px solid ${DS.pink}` : "2px solid transparent",\n')
 new_lines.append(' marginBottom: -1,\n')
 new_lines.append(' display: "flex",\n')
 new_lines.append(' alignItems: "center",\n')
 new_lines.append(' gap: 8,\n')
 new_lines.append(' transition: "color 0.2s, border-color 0.2s",\n')
 new_lines.append(' }}\n')
 new_lines.append(' >\n')
 new_lines.append(' {tab === "lp" ? <Trophy size={15} style={{ color: viewTab === tab ? DS.pink : DS.text4 }} /> : <TrendingUp size={15} style={{ color: viewTab === tab ? DS.pink : DS.text4 }} />}\n')
 new_lines.append(' {tab === "lp" ? "Bang xep hang LP" : "Hoa hong Sales"}\n')
 new_lines.append(' </button>\n')
 new_lines.append(' ))}\n')
 new_lines.append(' </div>\n')
 continue

 new_lines.append(l)
 i += 1

with open('D:/LOOP_COMPANY/LOOP/src/app/admin/leaderboard_admin/page.tsx', 'w', encoding='utf-8') as f:
 f.writelines(new_lines)
print(f'Done! {len(new_lines)} lines')
