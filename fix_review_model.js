const fs = require('fs');
let c = fs.readFileSync('prisma/schema.prisma', 'utf8');
const lines = c.split('\n');

// Find and extract the ProjectReview model block (it's currently incorrectly placed inside Order)
// It starts at the line containing '/// ProjectReview' and ends at the first '}' after that
let projReviewStart = -1;
let projReviewEnd = -1;
for (let i = 0; i < lines.length; i++) {
 if (lines[i].includes('/// ProjectReview') && lines[i+1] && lines[i+1].includes('model ProjectReview')) {
 projReviewStart = i;
 }
 if (projReviewStart >= 0 && lines[i].trim() === '}' && i > projReviewStart) {
 // Check if this is the closing brace of ProjectReview
 // Count braces between projReviewStart and i
 let braceCount = 0;
 for (let j = projReviewStart; j <= i; j++) {
 if (lines[j].includes('{')) braceCount++;
 if (lines[j].includes('}')) braceCount--;
 }
 if (braceCount === 0) {
 projReviewEnd = i;
 break;
 }
 }
}

console.log('ProjectReview block: lines', projReviewStart+1, 'to', projReviewEnd+1);

// Extract the ProjectReview model
const projReviewBlock = lines.slice(projReviewStart, projReviewEnd+1);
console.log('Block:', JSON.stringify(projReviewBlock.slice(0,3)));

// Remove from current location
const without = [...lines.slice(0, projReviewStart), ...lines.slice(projReviewEnd+1)];
console.log('Removed. New length:', without.length);

// Find the Order model's closing brace (should be the first '}' that closes Order)
// After removing ProjectReview, find where Order's closing brace is
let orderBraceIdx = -1;
let braceCount = 0;
let inOrder = false;
for (let i = 0; i < without.length; i++) {
 if (without[i].includes('model Order {')) inOrder = true;
 if (inOrder) {
 if (without[i].includes('{')) braceCount++;
 if (without[i].includes('}')) braceCount--;
 if (braceCount === 0 && inOrder) {
 orderBraceIdx = i;
 break;
  }
 }
}
console.log('Order closing brace at line:', orderBraceIdx+1);

// Insert ProjectReview after Order's closing brace
const result = [...without.slice(0, orderBraceIdx+1), ...projReviewBlock, ...without.slice(orderBraceIdx+1)];
fs.writeFileSync('prisma/schema.prisma', result.join('\n'));
console.log('Done. Added ProjectReview after Order model.');
