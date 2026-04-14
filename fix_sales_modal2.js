const fs = require('fs');
let c = fs.readFileSync('src/app/admin/orders/page.tsx', 'utf8');
const line900 = c.split('\n')[899];
console.log('Line 900:', JSON.stringify(line900.slice(17, 45)));
// The file has: backslash-backslash-dollar (\\\\$)
// We need: backslash-dollar (\$)
// In JS: '\\\\$' represents \\$ but we need \$
// Actually in the file, JSON shows "\\\\${" = 2 backslashes + $ + {
// So the file has literal \\${ - we need to fix it to \${

// Fix: two backslashes + ${ -> one backslash + ${
c = c.replace(/\}\\\\\$\{order!\.id\}\\,/, `}\${order!.id}\`,`);
fs.writeFileSync('src/app/admin/orders/page.tsx', c);
console.log('Fixed');
const c2 = fs.readFileSync('src/app/admin/orders/page.tsx', 'utf8');
console.log('New line 900:', JSON.stringify(c2.split('\n')[899].slice(17, 45)));
