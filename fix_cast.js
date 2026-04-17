const fs = require('fs');
let code = fs.readFileSync('src/app/admin/members/page.tsx', 'utf8');

// Fix the cast for rankKey in both toMemberExt and toMemberStats
code = code.replace(
  'const rankKey = (raw.rank && Object.keys(RANKS).includes(raw.rank.toLowerCase())) ? raw.rank.toLowerCase() : getRankFromLevel(level);',
  'const rankKey = (raw.rank && Object.keys(RANKS).includes(raw.rank.toLowerCase())) ? (raw.rank.toLowerCase() as RankKey) : getRankFromLevel(level);'
);

// We need to do it twice since it appears twice
code = code.replace(
  '  const rankKey = (raw.rank && Object.keys(RANKS).includes(raw.rank.toLowerCase())) ? raw.rank.toLowerCase() : getRankFromLevel(level);',
  '  const rankKey = (raw.rank && Object.keys(RANKS).includes(raw.rank.toLowerCase())) ? (raw.rank.toLowerCase() as RankKey) : getRankFromLevel(level);'
);

fs.writeFileSync('src/app/admin/members/page.tsx', code);
console.log('Fixed TS casting in page.tsx');
