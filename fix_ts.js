#!/usr/bin/env node
var fs = require('fs');

// Fix 1: referral.service.ts — add ReferralTier type export
var f1 = 'src/lib/services/customer/referral.service.ts';
var c1 = fs.readFileSync(f1, 'utf8');
var i1 = c1.indexOf('// Default tiers (fallback if SiteSetting not configured)');
if (i1 === -1) { console.log('referral.service.ts: marker not found'); } else {
 c1 = c1.slice(0, i1) + 'export type ReferralTier = { minRevenue: number; maxRevenue: number | null; lpRate: number };\r\n\r\n' + c1.slice(i1);
 fs.writeFileSync(f1, c1);
 console.log('Fixed: referral.service.ts ReferralTier type');
}

// Fix 2: quote-expiry.ts — remove expiredAt from Prisma queries (schema doesn't have it)
// expiredAt is not in Prisma model — just remove it from queries
var f2 = 'src/lib/jobs/quote-expiry.ts';
var c2 = fs.readFileSync(f2, 'utf8');
var i2 = c2.indexOf('expiredAt: null,');
if (i2 !== -1) {
 // Remove expiredAt: null from where clause
 c2 = c2.replace(/\s*expiredAt: null,?\r?\n?/g, '\r\n ');
 console.log('Fixed: quote-expiry.ts expiredAt queries');
} else {
 console.log('No expiredAt in quote-expiry.ts queries');
}
fs.writeFileSync(f2, c2);

// Fix 3: functions.ts — add quoteExpiryJob to allJobs array
var f3 = 'src/lib/jobs/functions.ts';
var c3 = fs.readFileSync(f3, 'utf8');
if (!c3.includes('quoteExpiryJob')) {
 c3 = c3.replace('export { quoteExpiryJob } from "./quote-expiry";\r\n', '');
 var oldJobs = ' questFrequencyReset,\r\n eventLpBonusAward,\r\n domainHostingExpiryNotification,\r\n];';
 var newJobs = ' questFrequencyReset,\r\n eventLpBonusAward,\r\n domainHostingExpiryNotification,\r\n quoteExpiryJob,\r\n];';
 if (c3.includes('domainHostingExpiryNotification,\r\n];')) {
 c3 = c3.replace('domainHostingExpiryNotification,\r\n];', 'domainHostingExpiryNotification,\r\n quoteExpiryJob,\r\n];');
 console.log('Fixed: functions.ts quoteExpiryJob export + array');
 } else {
 console.log('WARN: domainHostingExpiryNotification pattern not found in functions.ts');
 }
}
fs.writeFileSync(f3, c3);

// Fix 4: BookingWizardClient.tsx — add type annotation to map callback parameter
var f4 = 'src/components/landing/BookingWizardClient.tsx';
var c4 = fs.readFileSync(f4, 'utf8');
var old4 = 'paymentMethods.map(m => {\r\n const isActive';
var new4 = 'paymentMethods.map((m: { value: string; label: string; icon: string; hasDynamicQR?: boolean; bankName?: string; accountNo?: string; accountName?: string; bankBin?: string }) => {\r\n const isActive';
if (c4.includes(old4)) {
 c4 = c4.replace(old4, new4);
 console.log('Fixed: BookingWizardClient.tsx paymentMethods map param type');
} else {
 console.log('WARN: paymentMethods.map pattern not found');
}
fs.writeFileSync(f4, c4);

console.log('All fixes applied.');
