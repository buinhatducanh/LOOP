const fs = require('fs');
let c = fs.readFileSync('src/app/admin/orders/page.tsx', 'utf8');

// The file has literal `\$` (backslash + dollar) + `{order!.id}`
// We need to change it to `${order!.id}` (template expression)
// In JS source: we write `'${order!.id}'` which produces the correct output
c = c.replace('/api/admin/orders/\\${order!.id}', '/api/admin/orders/${order!.id}');

// Fix escaped backtick in SalesRepModal: `\`` -> `` ` ``
c = c.replace(/\\`1px solid/g, '`1px solid');
// Fix outer template literal backtick
c = c.replace(/\\`\/api\/admin\/orders\//g, '`/api/admin/orders/');
// Fix escaped DS.border
c = c.replace(/\\\$\{DS\.border\}/g, '${DS.border}');

fs.writeFileSync('src/app/admin/orders/page.tsx', c);

// Verify
const c2 = fs.readFileSync('src/app/admin/orders/page.tsx', 'utf8');
const l900 = c2.split('\n')[899];
const l919 = c2.split('\n')[918];
console.log('Line 900:', JSON.stringify(l900.slice(0, 65)));
console.log('Line 919:', JSON.stringify(l919.slice(0, 65)));
console.log('Line 900 has backslash:', l900.includes('\\'));
