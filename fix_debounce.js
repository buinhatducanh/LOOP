const fs = require('fs');
let content = fs.readFileSync('D:/LOOP_COMPANY/LOOP/src/components/landing/BookingWizardClient.tsx', 'utf8');

console.log('=== Checking current state ===');
console.log('Has emailTimeout.current:', content.includes('emailTimeout.current'));
console.log('Has setTimeout:', content.includes('setTimeout'));
console.log('Has }, 500);:', content.includes('}, 500);');

// Check lines 387-391
const lines = content.split('\n');
for (let i = 386; i < 392; i++) console.log(`L${i+1}: ${lines[i]}`);

console.log('\n=== Adding debounce ===');

// Add debounce wrapper inside useEffect - find the exact string
const oldStart = ` let cancelled = false;
 fetch(\`/api/pricing/config?lang=\${locale}\${email ? \`&email=\${encodeURIComponent(email)}\` : ""}\`)`;

const newStart = `if (emailTimeout.current) clearTimeout(emailTimeout.current);
 emailTimeout.current = setTimeout(() => {
 let cancelled = false;
 fetch(\`/api/pricing/config?lang=\${locale}\${email ? \`&email=\${encodeURIComponent(email)}\` : ""}\`)`;

if (content.includes(oldStart)) {
 content = content.replace(oldStart, newStart);
 console.log('Replaced useEffect start');
} else {
 console.log('Could not find useEffect start - searching...');
 const idx = content.indexOf("let cancelled = false;\n fetch");
 console.log('Found at index:', idx);
 if (idx > -1) console.log('Context:', JSON.stringify(content.substring(idx, idx+200)));
}

// Add }, 500); and close setTimeout - find the exact end
const oldEnd = ` return () => { cancelled = true; };
 }, [locale, email]);`;

const newEnd = ` return () => { cancelled = true; };
 }, 500);
 });
 }, [locale, email]);`;

if (content.includes(oldEnd)) {
 content = content.replace(oldEnd, newEnd);
 console.log('Replaced useEffect end');
} else {
 console.log('Could not find useEffect end - searching...');
 const idx2 = content.indexOf('return () => { cancelled = true; }');
 console.log('Found return at:', idx2);
 if (idx2 > -1) console.log('Context:', JSON.stringify(content.substring(idx2, idx2+100)));
}

fs.writeFileSync('D:/LOOP_COMPANY/LOOP/src/components/landing/BookingWizardClient.tsx', content);

console.log('\n=== Verifying ===');
const content2 = fs.readFileSync('D:/LOOP_COMPANY/LOOP/src/components/landing/BookingWizardClient.tsx', 'utf8');
console.log('Has emailTimeout.current:', content2.includes('emailTimeout.current'));
console.log('Has setTimeout:', content2.includes('setTimeout'));
console.log('Has }, 500);:', content2.includes('}, 500);'));

const lines2 = content2.split('\n');
console.log('\nLines 387-392:');
for (let i = 386; i < 393; i++) console.log(`${i+1}: ${lines2[i]}`);
console.log('\nLines 438-443:');
for (let i = 437; i < 443; i++) console.log(`${i+1}: ${lines2[i]}`);