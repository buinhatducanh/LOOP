const fs = require('fs');
let code = fs.readFileSync('src/app/admin/members/page.tsx', 'utf8');

const regex = /\[\];\s*missionLogs: \{ date: string; task: string; lpEarned: number \}\[\];\s*lpEarned: number;\s*lpSpent: number;\s*\}/s;
code = code.replace(regex, '');

fs.writeFileSync('src/app/admin/members/page.tsx', code);
console.log('Fixed syntax error');
