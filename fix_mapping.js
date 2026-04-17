const fs = require('fs');
let code = fs.readFileSync('src/app/admin/members/page.tsx', 'utf8');

// 1. Update toMemberExt
code = code.replace(
  'const rankKey = getRankFromLevel(level);',
  'const rankKey = (raw.rank && Object.keys(RANKS).includes(raw.rank.toLowerCase())) ? raw.rank.toLowerCase() : getRankFromLevel(level);'
);

code = code.replace(
  'team: raw.department ? capitalize(raw.department) : \"Engineering\",',
  'team: raw.department || \"engineering\",'
);

// 2. Update toMemberStats
code = code.replace(
  '  const rankKey = getRankFromLevel(level);',
  '  const rankKey = (raw.rank && Object.keys(RANKS).includes(raw.rank.toLowerCase())) ? raw.rank.toLowerCase() : getRankFromLevel(level);'
);

code = code.replace(
  '    department: raw.department ?? \"engineering\",',
  '    department: raw.department || \"engineering\",'
);

fs.writeFileSync('src/app/admin/members/page.tsx', code);
console.log('Modified page.tsx');
