var fs = require('fs');
var f = 'D:/LOOP_COMPANY/LOOP/src/app/api/ref/[code]/route.ts';
var c = fs.readFileSync(f, 'utf8');
var lines = c.split('\n');

// Build line 120 using known parts (to avoid whitespace issues)
// Line 120 should be: 10 spaces + "data: { referralCodeId: referralCode.id, salesRepId: referralCode.memberId ?? undefined },"
var indent = '\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20'; // 10 spaces
var dataLine = indent + 'data: { referralCodeId: referralCode.id, salesRepId: referralCode.memberId ?? undefined },';
console.log('New line:', JSON.stringify(dataLine));
console.log('Indent length:', indent.length);

lines[119] = dataLine;

var newContent = lines.join('\n');
fs.writeFileSync(f, newContent, 'utf8');
console.log('Done');

// Verify
var v = fs.readFileSync(f, 'utf8').split('\n');
console.log('Line 120:', JSON.stringify(v[119]));
console.log('Line 121:', JSON.stringify(v[120]));
