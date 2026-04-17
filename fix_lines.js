const fs = require('fs');
let code = fs.readFileSync('src/app/admin/members/page.tsx', 'utf8');

code = code.replace(/\\n/g, '\n');

fs.writeFileSync('src/app/admin/members/page.tsx', code);
console.log('Fixed newlines');
