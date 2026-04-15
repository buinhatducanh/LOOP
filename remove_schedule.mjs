import fs from 'fs';
const f = 'src/components/landing/BookingWizardClient.tsx';
let c = fs.readFileSync(f, 'utf8');
let lines = c.split('\n');

let schedStart = -1, schedEnd = -1;
for (let i = 0; i < lines.length; i++) {
 if (lines[i].includes('Lịch trình</h4>')) {
 for (let j = i; j >= 0; j--) {
 if (lines[j].includes('<div className="mb-5">')) { schedStart = j; break; }
 }
 }
 if (lines[i].includes('Ghi chú thêm</h4>')) {
 for (let j = i; j >= 0; j--) {
 if (lines[j].includes('<div className="mb-5">')) { schedEnd = j - 1; break; }
 }
 }
}
console.log('Schedule section: lines', schedStart+1, '-', schedEnd+1);
if (schedStart !== -1 && schedEnd !== -1) {
 lines.splice(schedStart, schedEnd - schedStart + 1);
 console.log('Removed. New lines:', lines.length);
}
fs.writeFileSync(f, lines.join('\n'));
