import fs from 'fs';
let c = fs.readFileSync('src/components/landing/BookingWizardClient.tsx', 'utf8');
// domainTotal (4 spaces before ? and :)
const dtOld = 'const domainTotal = domainPurchaseNow && domainName\r\n ? (domainPrices.find(d => domainName.endsWith(d.extension))?.registrationPrice ?? 0)\r\n : 0;';
const dtNew = 'const domainTotal = domainPurchaseNow ? selectedDomainTotal : 0;';
if (c.includes(dtOld)) {
 c = c.replace(dtOld, dtNew);
 console.log('OK: domainTotal');
} else {
 console.log('NF: domainTotal');
}
fs.writeFileSync('src/components/landing/BookingWizardClient.tsx', c);
