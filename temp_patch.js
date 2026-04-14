var fs = require('fs');
var content = fs.readFileSync('D:/LOOP_COMPANY/LOOP/src/app/api/academy/lessons/[id]/complete/route.ts', 'utf8');
var lines = content.split('\n');
console.log('Lines:', lines.length);

// Confirmed positions from inspection:
// syncRankFields import: line 27 (1-indexed) = index 26
// tx enrollment update blank line: line 154 (1-indexed) = index 153
// else-if enrollment close: line 200 (1-indexed) = index 199
// else-if closing brace: line 201 (1-indexed) = index 200

// Edit 1: Add import at index 27 (after syncRankFields line)
var syncIdx = lines.findIndex(function(l) { return l.includes('syncRankFields') && l.includes('from "@/lib/rank/xp"'); });
console.log('syncRankFields at line (1-indexed):', syncIdx + 1);
if (syncIdx >= 0) {
 lines.splice(syncIdx + 1, 0, 'import { creditSalesCommissionForEnrollmentTx, creditSalesCommissionForEnrollment } from "@/lib/services/commerce/commission.service";');
 console.log('Edit 1: import added');
}

// After splice, indices shift. Recalculate.
var txBlankIdx = lines.findIndex(function(l) {
 return l.trim() === '' &&
 lines[lines.indexOf(l) + 1] &&
 lines[lines.indexOf(l) + 1].includes('if (memberId)') &&
 lines.indexOf(l) > 140; // in the tx block
});
console.log('Blank before if(memberId) at line (1-indexed):', txBlankIdx + 1);

// Simpler: find the blank after '});' in the tx block
var txCloseIdx = lines.findIndex(function(l, i) {
 return l.trim() === '});' && i > 140 && i < 170 &&
 lines[i+1] && lines[i+1].trim() === '' &&
 lines[i+2] && lines[i+2].includes('if (memberId)');
});
console.log('Enrollment update close at line (1-indexed):', txCloseIdx + 1);
var insertTxIdx = txCloseIdx + 1; // insert at the blank
console.log('Insert tx commission at line (1-indexed):', insertTxIdx + 1);

lines.splice(insertTxIdx, 0,
 ' // Credit sales commission for enrollment completion',
 ' await creditSalesCommissionForEnrollmentTx(enrollment.id, tx);'
);
console.log('Edit 2: tx commission added');

// Find else-if closing brace
var eiElseIfIdx = lines.findIndex(function(l) { return l.trim() === '} else if (isCourseComplete) {'; });
console.log('Else-if at line (1-indexed):', eiElseIfIdx + 1);

// After splice, find the closing brace of the enrollment.update inside else-if
var eiCloseIdx = lines.findIndex(function(l, i) {
 return l.trim() === '});' && i > eiElseIfIdx && i < eiElseIfIdx + 10;
});
console.log('Else-if enrollment close at line (1-indexed):', eiCloseIdx + 1);
var insertEiIdx = eiCloseIdx + 1; // blank after enrollment.close
console.log('Insert else-if commission at line (1-indexed):', insertEiIdx + 1);

lines.splice(insertEiIdx, 0,
 '',
 ' // Credit sales commission for enrollment completion (no course LP reward)',
 ' await creditSalesCommissionForEnrollment(enrollment.id);',
 '',
 ' // Sync rank fields for staff',
 ' if (memberId) {',
 ' await syncRankFields(memberId);',
 ' }'
);
console.log('Edit 3: else-if commission added');

var newContent = lines.join('\n');
fs.writeFileSync('D:/LOOP_COMPANY/LOOP/src/app/api/academy/lessons/[id]/complete/route.ts', newContent, 'utf8');

// Verify
var v = fs.readFileSync('D:/LOOP_COMPANY/LOOP/src/app/api/academy/lessons/[id]/complete/route.ts', 'utf8').split('\n');
console.log('\n--- Import section ---');
for(var i=24; i<32; i++) console.log((i+1)+': '+JSON.stringify(v[i]));
console.log('\n--- First tx block (find enrollment.update) ---');
var idx = v.findIndex(function(l){return l.includes('prisma.$transaction');});
for(var j=idx; j<idx+14; j++) console.log((j+1)+': '+JSON.stringify(v[j]));
console.log('\n--- Else-if block ---');
var ei = v.findIndex(function(l){return l.trim()==='} else if (isCourseComplete) {';});
for(var j=ei; j<ei+16; j++) console.log((j+1)+': '+JSON.stringify(v[j]));
