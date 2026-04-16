#!/usr/bin/env node
var fs = require('fs');
var content = fs.readFileSync('src/app/admin/settings/page.tsx', 'utf8');

var bad = '\r\n { key: "payments", label: "Thanh Toán", icon: <CreditCard size={14} /> },\r\n];({ checked';
var good = '\r\n { key: "payments", label: "Thanh Toán", icon: <CreditCard size={14} /> },\r\n];\r\n\r\nfunction Toggle({ checked';

if (content.indexOf(bad) === -1) {
 console.log('NOT FOUND');
 console.log(JSON.stringify(bad));
 process.exit(1);
}

content = content.replace(bad, good);
fs.writeFileSync('src/app/admin/settings/page.tsx', content);
console.log('OK. Len:', content.length);
