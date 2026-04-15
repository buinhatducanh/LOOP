import fs from 'fs';
let c = fs.readFileSync('src/components/landing/BookingWizardClient.tsx', 'utf8');
// Use regex to match the domainTotal ternary expression
const re = /const domainTotal = domainPurchaseNow && domainName\r?\n + \? \([^)]+\) \?: 0;/;
const match = c.match(re);
if (match) {
 console.log('Found:', JSON.stringify(match[0].substring(0, 80)));
 const newVal = 'const domainTotal = domainPurchaseNow ? selectedDomainTotal : 0;';
 c = c.replace(re, newVal);
 fs.writeFileSync('src/components/landing/BookingWizardClient.tsx', c);
 console.log('OK: domainTotal');
} else {
 console.log('NF: domainTotal (regex)');
 // Try the simple approach
 const simplePat = 'const domainTotal = domainPurchaseNow && domainName\n ? (domainPrices.find(d => domainName.endsWith(d.extension))?.registrationPrice ?? 0)\n : 0;';
 if (c.includes(simplePat)) {
 console.log('Found (simple)');
 c = c.replace(simplePat, 'const domainTotal = domainPurchaseNow ? selectedDomainTotal : 0;');
 fs.writeFileSync('src/components/landing/BookingWizardClient.tsx', c);
 console.log('OK: domainTotal (simple)');
 }
}
