import fs from 'fs';
const f = 'src/components/landing/BookingWizardClient.tsx';
let c = fs.readFileSync(f, 'utf8');
let lines = c.split('\n');

let start = -1, end = -1;
for (let i = 0; i < lines.length; i++) {
 if (lines[i].includes('Hình thức chuyển khoản</label>')) { start = i - 1; console.log('start at', i+1); }
 if (lines[i].trim() === '</div>' && lines[i+1] && lines[i+1].includes('LP redemption')) {
 end = i; console.log('end at', i+1, ':', lines[i+1].substring(0,50));
 break;
 }
}
console.log('Result:', start+1, '-', end+1);
