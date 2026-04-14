const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');
const lines = content.split('\n');

// 1. Remove Order duplicate (lines 689-699, 0-indexed: 688-698)
// The duplicate block starts after line 688 (first salesCommissionEvents in Order)
// and ends before line 700 (@@index([status, createdAt]))
// Find the second salesCommissionEvents in Order (after line 688)
// It's the one where the previous line is the duplicate's commissionPaidAt

// Find second 'salesCommissionEvents' in Order section (around line 699)
const orderDuplicateStart = 688; // 0-indexed: line 689
const orderDuplicateEnd = 699; // 0-indexed: line 700 (@@index, inclusive remove)
// Remove lines 689-699 (0-indexed: 688-698)
lines.splice(orderDuplicateStart, 11); // 11 lines: 689 through 699
console.log('Removed Order duplicate (11 lines)');

// 2. Remove Enrollment duplicate (now shifted due to above removal)
// After removal, the Enrollment duplicate was at lines 2435-2441 (0-indexed: 2434-2440)
// But since we removed 11 lines above, it's now at 2434-2440 in terms of 0-indexed array
// In the array (0-indexed), the enrollment duplicate starts after the first salesCommissionEvents
// First Enrollment salesCommissionEvents is at original line 2434 (0-idx: 2433)
// After removing 11 lines from position 688, the line numbers shift by -11 for lines after 699
// Original enrollment dup: lines 2435-2441 (0-idx: 2434-2440)
// After shift: 2435-11=2424 to 2441-11=2430
// But the enrollment duplicate starts at 2435-11=2424 in 0-idx, so line 2425 in 1-idx
// The enrollment duplicate has 7 fields: salesRepId, commissionPaid comment, commissionPaid, commissionPaidAt comment, commissionPaidAt, salesCommissionEvents comment, salesCommissionEvents
// Remove from index 2424 to 2430 (7 lines)
lines.splice(2424, 7);
console.log('Removed Enrollment duplicate (7 lines)');

// Reconstruct content
let newContent = lines.join('\n');
// Add trailing \r\n to match original format if needed
if (!newContent.endsWith('\n')) newContent += '\n';

fs.writeFileSync('prisma/schema.prisma', newContent, 'utf8');

// Verify
const matches = [...newContent.matchAll(/salesCommissionEvents SalesCommissionEvent\[\]/g)];
console.log('\nRelation occurrences:', matches.length);
matches.forEach((m, i) => {
 const line = newContent.substring(0, m.index).split('\n').length;
 console.log(' ' + (i+1) + '. line ' + line);
});
