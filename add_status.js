const fs = require('fs');
let code = fs.readFileSync('src/app/admin/members/page.tsx', 'utf8');

// 1. Update sorting logic
code = code.replace(
  'else if (sortKey === \"team\") cmp = (a.team ?? \"\").localeCompare(b.team ?? \"\");',
  'else if (sortKey === \"team\") cmp = (a.team ?? \"\").localeCompare(b.team ?? \"\");\\n      else if (sortKey === \"status\") cmp = a.status.localeCompare(b.status);'
);

// 2. Update table metadata
code = code.replace(
  '{ key: \"team\" as SortKey, label: \"Phòng ban\" },',
  '{ key: \"team\" as SortKey, label: \"Phòng ban\" },\\n                      { key: \"status\" as SortKey, label: \"Trạng thái\" },'
);

// 3. Update table row
// We look for the cell that contains m.team and add a cell after it
const teamCellStr = '<span style={{ fontFamily: DS.mono, fontSize: 11, color: DS.text2 }}>{m.team || \"—\"}</span>';
const idx = code.indexOf(teamCellStr);
if (idx !== -1) {
    const tdEnd = code.indexOf('</td>', idx) + 5;
    code = code.substring(0, tdEnd) + '\\n                        <td style={{ padding: \"10px 14px\" }}>\\n                          <StatusBadge_ status={m.status} />\\n                        </td>' + code.substring(tdEnd);
}

fs.writeFileSync('src/app/admin/members/page.tsx', code);
console.log('Modified page.tsx via script');
