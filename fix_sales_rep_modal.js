const fs = require('fs');
let c = fs.readFileSync('src/app/admin/orders/page.tsx', 'utf8');
const lines = c.split('\n');

// Fix line 900: escaped backtick → real backtick
lines[899] = lines[899].replace(/\\`/g, '`');

// Fix lines with DS.border issues (around 919, 941, 955)
for (let i = 877; i < lines.length; i++) {
 const l = lines[i];
 // Only fix in the SalesRepModal section (lines 877-964)
 if (i >= 877 && i <= 964) {
 // Replace escaped template literal border
 lines[i] = lines[i].replace(/\\`1px solid/g, '`1px solid');
 lines[i] = lines[i].replace(/\\\$\{DS\.border\}/g, '${DS.border}');
 }
}

fs.writeFileSync('src/app/admin/orders/page.tsx', lines.join('\n'));
console.log('Fixed');

// Verify
const c2 = fs.readFileSync('src/app/admin/orders/page.tsx', 'utf8');
const l900 = c2.split('\n')[899];
console.log('Line 900:', JSON.stringify(l900));
