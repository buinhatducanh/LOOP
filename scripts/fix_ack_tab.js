const fs = require('fs');
let content = fs.readFileSync('src/app/admin/pricing/acknowledgments/AcknowledgmentsTab.tsx', 'utf-8');

// Find and fix the missing backtick in border style
const lines = content.split('\n');
const badLineIdx = lines.findIndex(l => l.includes('rgba(79,125,243,0.05)') && l.includes('dashed') && !l.includes('rgba(79,125,243,0.3)`'));
if (badLineIdx !== -1) {
 const line = lines[badLineIdx];
 console.log('Found bad line at', badLineIdx + 1);
 console.log('Before:', JSON.stringify(line));
 // Fix: change the ending from `..."}` to `..."` }
 const fixedLine = line.replace(/`\s*}`/g, '` }');
 // More specifically: the line ends with `1px dashed rgba(79,125,243,0.3)"` }}"
 // Should be: `1px dashed rgba(79,125,243,0.3)"` }}
 const fixed = line.replace(
 /rgba\(79,125,243,0\.3\)\s*"\s*}`,
 'rgba(79,125,243,0.3)"` }'
 );
 if (fixed !== line) {
 lines[badLineIdx] = fixed;
 content = lines.join('\n');
 fs.writeFileSync('src/app/admin/pricing/acknowledgments/AcknowledgmentsTab.tsx', content);
 console.log('Fixed!');
 } else {
 console.log('Could not fix, line is:', JSON.stringify(line));
 }
} else {
 console.log('Bad line not found');
}

// Also check for similar issues in the file
const allLines = content.split('\n');
let open = 0;
for (const line of allLines) {
 for (const c of line) {
 if (c === '{') open++;
 else if (c === '}') open--;
 }
}
console.log('Open braces after fix:', open);
