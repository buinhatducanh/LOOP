const fs = require('fs');
let c = fs.readFileSync('src/app/admin/orders/page.tsx', 'utf8');
const lines = c.split('\n');

// Fix line 900 (0-indexed 899)
// Current: `await adminApi.put(\`/api/admin/orders/\\${order!.id}\`, {`
// Target: `await adminApi.put(`/api/admin/orders/${order!.id}`, {`

const old900 = lines[899];
if (old900.includes('api/admin/orders/\\\\${order')) {
 lines[899] = old900
 .replace(/\(\\\`\/api\/admin\/orders\/\\\\\$\{order!\.id\}\\\`,/,
 '(`/api/admin/orders/${order!.id}`,');
}

// Fix all lines in 877-964 range for backslash-template-literal patterns
// Pattern: backslash-backtick, double-backslash-dollar
for (let i = 877; i < Math.min(lines.length, 965); i++) {
 let l = lines[i];
 if (l.includes('\\`') || l.includes('\\\\$')) {
 // Fix escaped backtick
 l = l.replace(/\\`/g, '`');
 // Fix double backslash-dollar
 l = l.replace(/\\\\\$\{DS\.border\}/g, '${DS.border}');
 // Fix backslash-brace in API URL
 l = l.replace(/\\\\\$\{order!\.id\}\\,/g, '${order!.id},');
 lines[i] = l;
 }
}

fs.writeFileSync('src/app/admin/orders/page.tsx', lines.join('\n'));

// Verify
const c2 = fs.readFileSync('src/app/admin/orders/page.tsx', 'utf8');
const l900 = c2.split('\n')[899];
console.log('Line 900:', JSON.stringify(l900.slice(0, 60)));
console.log('OK:', !l900.includes('\\\\') && !l900.includes('\\`'));
