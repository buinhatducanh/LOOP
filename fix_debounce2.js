// Fix email debounce in BookingWizardClient.tsx
const fs = require('fs');
const path = 'D:/LOOP_COMPANY/LOOP/src/components/landing/BookingWizardClient.tsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

console.log('=== BEFORE ===');
console.log('Lines 360-370:');
for (let i = 359; i < 371; i++) console.log(i+1 + ': ' + JSON.stringify(lines[i]));

// Find the exact line numbers
const featureLineIdx = lines.findIndex((l, i) => i > 355 && l.includes('const currentFeatureOptions: WizardFeature[] = featureOptions'));
const useEffectLineIdx = lines.findIndex((l, i) => i > featureLineIdx && l.includes('useEffect(() => {'));
const cancelledLineIdx = lines.findIndex((l, i) => i > useEffectLineIdx && l.includes('let cancelled = false;'));
const fetchLineIdx = lines.findIndex((l, i) => i > cancelledLineIdx && l.includes('fetch(`/api/pricing/config?lang='));

console.log('\nFeature line:', featureLineIdx+1);
console.log('useEffect line:', useEffectLineIdx+1);
console.log('cancelled line:', cancelledLineIdx+1);
console.log('fetch line:', fetchLineIdx+1);

// Insert ref declaration after feature options line
lines.splice(featureLineIdx + 1, 0, ' const emailTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);');

// Re-calculate indices (we added 1 line)
const fetchLineIdx2 = fetchLineIdx + 1;

// Insert debounce wrapper before 'let cancelled'
lines.splice(cancelledLineIdx + 2, 0,
 ' if (emailTimeout.current) clearTimeout(emailTimeout.current);',
 ' emailTimeout.current = setTimeout(() => {'
);

// Now find the closing of the useEffect (return () => { cancelled = true; })
// After inserting 3 lines, original return line is at index + 3
const returnLineIdx = lines.findIndex((l, i) => i > fetchLineIdx2 + 3 && l.includes('return () => { cancelled = true; }'));
console.log('\nReturn line:', returnLineIdx+1);

// Find '}, [locale, email]);' - the closing of useEffect deps array
const closeDepsIdx = lines.findIndex((l, i) => i > returnLineIdx && l.includes('}, [locale, email]);'));
console.log('Close deps:', closeDepsIdx+1);

// Insert '}, 500);' and '});' before the close deps line
lines.splice(closeDepsIdx, 0, ' }, 500);', ' });');

const result = lines.join('\n');
fs.writeFileSync(path, result);

console.log('\n=== AFTER ===');
const lines2 = result.split('\n');
console.log('Lines 360-375:');
for (let i = 359; i < 376; i++) console.log(i+1 + ': ' + lines2[i]);
console.log('\nLines around return:');
for (let i = returnLineIdx; i < closeDepsIdx + 5; i++) console.log(i+1 + ': ' + lines2[i]);

console.log('\nHas emailTimeout.current:', result.includes('emailTimeout.current'));
console.log('Has setTimeout:', result.includes('setTimeout(() => {'));
console.log('Has }, 500);:', result.includes('}, 500);'));