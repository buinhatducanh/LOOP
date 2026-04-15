import fs from 'fs';
const lines = fs.readFileSync('src/components/landing/BookingWizardClient.tsx', 'utf8').split('\n');
for (let i = 0; i < lines.length; i++) {
 if (lines[i].includes('className="mb-5"')) {
 for (let j = i; j < Math.min(i+6, lines.length); j++) {
 if (lines[j].includes('Calendar size')) {
 console.log('Schedule: mb-5 at line', i+1, 'Calendar at line', j+1);
 break;
 }
 }
}
