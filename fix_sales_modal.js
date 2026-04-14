const fs = require('fs');
let c = fs.readFileSync('src/app/admin/orders/page.tsx', 'utf8');
// Char codes: 92 = backslash, 96 = backtick
const bs = String.fromCharCode(92);
const bt = String.fromCharCode(96);
// Fix backslash-backtick -> backtick
c = c.split(bs + bt).join(bt);
// Fix backslash-dollar -> dollar in DS.border context
c = c.split(bs + '${DS.border}').join('${DS.border}');
fs.writeFileSync('src/app/admin/orders/page.tsx', c);
console.log('Fixed');
const lines = c.split('\n');
console.log('Line 900:', JSON.stringify(lines[899]));
console.log('Line 919:', JSON.stringify(lines[918]));
