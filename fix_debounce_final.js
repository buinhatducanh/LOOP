const fs = require('fs');
const path = 'D:/LOOP_COMPANY/LOOP/src/components/landing/BookingWizardClient.tsx';
let content = fs.readFileSync(path, 'utf8');

// Find the section from 'const emailTimeout' to 'fetch' and replace it entirely
// We need to find a unique anchor before it
// The anchor is the line 'const currentFeatureOptions...' before emailTimeout

const anchorBefore = 'const currentFeatureOptions: WizardFeature[] = featureOptions["web"] ?? [];\n\n';
const oldSection = (
 'const emailTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);\n' +
 ' useEffect(() => {\n' +
 ' let cancelled = false;\n' +
 ' if (emailTimeout.current) clearTimeout(emailTimeout.current);\n' +
 ' emailTimeout.current = setTimeout(() => {\n' +
 ' fetch(`/api/pricing/config'
);

const newSection = (
 'const emailTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);\n' +
 ' useEffect(() => {\n' +
 ' let cancelled = false;\n' +
 ' if (emailTimeout.current) clearTimeout(emailTimeout.current);\n' +
 ' emailTimeout.current = setTimeout(() => {\n' +
 ' fetch(`/api/pricing/config'
);

const searchStr = anchorBefore + oldSection;
const replaceStr = anchorBefore + newSection;

console.log('Search found:', content.includes(searchStr));
console.log('Search length:', searchStr.length);
console.log('Replace length:', replaceStr.length);

if (content.includes(searchStr)) {
 content = content.replace(searchStr, replaceStr);
 console.log('Replaced');
} else {
 console.log('ERROR: search pattern not found');
}

// Also fix closing
const oldClose = '\n }, 500);\n });\n }, [locale, email]);';
const newClose = '\n }, 500);\n });\n }, [locale, email]);';
if (content.includes(oldClose)) {
 content = content.replace(oldClose, newClose);
 console.log('Fixed close');
} else {
 console.log('ERROR: close not found');
}

fs.writeFileSync(path, content);

// Verify
const lines2 = content.split('\n');
for (let i = 0; i < lines2.length; i++) {
 const l = lines2[i];
 if (l.includes('emailTimeout') || (l.includes('setTimeout') && l.includes('emailTimeout')) || l.includes('}, 500')) {
 const leading = l.length - l.trimStart().length;
 console.log('L' + (i+1) + '(' + leading + '):', JSON.stringify(l.substring(0, 70)));
 }
}
