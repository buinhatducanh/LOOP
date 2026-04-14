const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');
const lines = content.split('\n');

// Find anchors by line content
function findLineStart(searchStr) {
 for (let i = 0; i < lines.length; i++) {
 if (lines[i].includes(searchStr)) return i;
 }
 return -1;
}

// Find model closing braces - insert before the "}" of each model
function findModelClosingBrace(searchStr) {
 // Find the @@map line
 const idx = findLineStart(searchStr);
 if (idx === -1) return -1;
 // The "}" is the next element in the array (same line split, or next line)
 // Check if "}" is on the next line in the original array
 // Actually, after split by \n, each line ends with \r
 // The "}" follows @@map on the next array element
 const nextIdx = idx + 1;
 if (nextIdx < lines.length && lines[nextIdx].trim() === '}') {
 return nextIdx;
 }
 // Otherwise find "}" on a subsequent line
 for (let i = idx + 1; i < Math.min(idx + 5, lines.length); i++) {
 if (lines[i].trim() === '}') return i;
 }
 return idx + 1; // fallback
}

// Find line numbers of key anchors - use model closing braces
const orderCloseIdx = findModelClosingBrace('@@map("orders")');
const enrollCloseIdx = findModelClosingBrace('@@map("enrollments")');
const lpAwardsCloseIdx = findModelClosingBrace('@@map("lp_awards")');
console.log('Order closing } at line:', orderCloseIdx !== -1 ? orderCloseIdx + 1 : 'not found');
console.log('Enrollment closing } at line:', enrollCloseIdx !== -1 ? enrollCloseIdx + 1 : 'not found');
console.log('LpAwards closing } at line:', lpAwardsCloseIdx !== -1 ? lpAwardsCloseIdx + 1 : 'not found');
const lpAwardsIdx = findLineStart('@@map("lp_awards")');
const offIdx = findLineStart('offSystemSplits');
const levelIdx = findLineStart('@map("level")');

console.log('Anchors (0-indexed):', { orderIdx, enrollIdx, lpAwardsIdx, offIdx, levelIdx });

// Work with a mutable copy
const newLines = [...lines];
let cumulativeOffset = 0; // Track how many lines have been inserted before each anchor

// 1. Insert TeamMember fields after level field
const memberFields = [
 ' totalSalesCommission Int @default(0) @map("total_sales_commission")',
 ' pendingCommission Int @default(0) @map("pending_commission")',
 ' completedCommission Int @default(0) @map("completed_commission")',
];
newLines.splice(levelIdx + 1, 0, ...memberFields);
cumulativeOffset += memberFields.length;
console.log('OK: TeamMember commission fields at line', levelIdx + 2);

// 2. Insert TeamMember relation after offSystemSplits
const teamRelFields = [
 ' /// Sales commission events (audit trail)',
 ' salesCommissionEvents SalesCommissionEvent[]',
];
// offSystemSplits shifts by cumulativeOffset
const offInsertIdx = offIdx + cumulativeOffset;
newLines.splice(offInsertIdx + 1, 0, ...teamRelFields);
cumulativeOffset += teamRelFields.length;
console.log('OK: TeamMember relation at line', offInsertIdx + 2);

// 3. Insert SalesCommissionEvent model after LpAward (before the } of LpAward)
const sceModelLines = [
 '',
 '/// Sales LP commission events - audit trail for sales commission credits.',
 'model SalesCommissionEvent {',
 ' id String @id @default(cuid())',
 ' /// TeamMember.id - nhan vien nhan commission',
 ' salesRepId String @map("sales_rep_id")',
 ' /// Loai nguon: "order" | "enrollment" | "media_booking"',
 ' referenceType String @map("reference_type")',
 ' /// Order.id / Enrollment.id / ...',
 ' referenceId String @map("reference_id")',
 ' /// LP tu dich vu chinh (10%)',
 ' directLp Int @default(0) @map("direct_lp")',
 ' /// LP tu addon (5%)',
 ' addonLp Int @default(0) @map("addon_lp")',
 ' /// Tong LP da credited',
 ' totalLp Int @map("total_lp")',
 ' /// Thoi diem credited',
 ' paidAt DateTime @default(now()) @map("paid_at")',
 '',
 ' salesRep TeamMember @relation(fields: [salesRepId], references: [id])',
 ' /// Back-ref to Order (nullable)',
 ' order Order? @relation("SalesCommissionOrder", fields: [orderId], references: [id])',
 ' orderId String? @map("order_id")',
 ' /// Back-ref to Enrollment (nullable)',
 ' enrollment Enrollment? @relation("SalesCommissionEnrollment", fields: [enrollmentId], references: [id])',
 ' enrollmentId String? @map("enrollment_id")',
 '',
 ' @@index([salesRepId])',
 ' @@index([orderId])',
 ' @@index([enrollmentId])',
 ' @@index([referenceType, referenceId])',
 ' @@index([paidAt])',
 ' @@map("sales_commission_events")',
 '}',
];
// lpAwardsIdx shifts by cumulativeOffset; insert AFTER the blank line + } of LpAward
// The pattern is: @@map("lp_awards") + "\n" + blank + "\n" + "}"
// We want to insert after the "}" of LpAward
const lpAwardsInsertIdx = lpAwardsIdx + cumulativeOffset;
// blank line is at lpAwardsInsertIdx + 1, "}" is at lpAwardsInsertIdx + 2
// Insert at lpAwardsInsertIdx + 3 (after the "}")
newLines.splice(lpAwardsInsertIdx + 3, 0, ...sceModelLines);
cumulativeOffset += sceModelLines.length;
console.log('OK: SalesCommissionEvent model at line', lpAwardsInsertIdx + 4);

// 4. Insert Enrollment commission fields BEFORE the closing } of Enrollment
// enrollIdx is the index of @@map("enrollments"), which is followed by } on the next line
const enrollFields = [
 ' salesRepId String? @map("sales_rep_id")',
 ' /// Whether academy commission has been credited',
 ' commissionPaid Boolean @default(false) @map("commission_paid")',
 ' /// When commission was credited',
 ' commissionPaidAt DateTime? @map("commission_paid_at")',
 ' /// Sales commission events for this enrollment',
 ' salesCommissionEvents SalesCommissionEvent[]',
];
// cumulativeOffset before enrollment: only insertions BEFORE this point
const beforeEnrollmentOffset = cumulativeOffset; // = 32 (member 3 + team 2 + SCE 27)
const enrollInsertIdx = enrollIdx + beforeEnrollmentOffset;
newLines.splice(enrollInsertIdx, 0, ...enrollFields);
cumulativeOffset += enrollFields.length; // now 39
console.log('OK: Enrollment commission fields at line', enrollInsertIdx + 1);

// 5. Insert Order commission fields BEFORE the closing } of Order
const orderFields = [
 ' salesRepId String? @map("sales_rep_id")',
 ' /// LP earned from main service (10% direct commission)',
 ' salesDirectCommission Int @default(0) @map("sales_direct_commission")',
 ' /// LP earned from addons (5% addon commission)',
 ' salesAddonCommission Int @default(0) @map("sales_addon_commission")',
 ' /// Whether commission has been credited to salesRep',
 ' commissionPaid Boolean @default(false) @map("commission_paid")',
 ' /// When commission was credited',
 ' commissionPaidAt DateTime? @map("commission_paid_at")',
 ' /// Sales commission events for this order',
 ' salesCommissionEvents SalesCommissionEvent[]',
];
// Insert before the "}" of Order model
const beforeOrderOffset = cumulativeOffset; // after enrollment splice = 39
const orderInsertIdx = orderCloseIdx + beforeOrderOffset;
newLines.splice(orderInsertIdx, 0, ...orderFields);
console.log('OK: Order commission fields at line', orderInsertIdx + 1);

// Write
const newContent = newLines.join('\n') + '\n';
fs.writeFileSync('prisma/schema.prisma', newContent, 'utf8');
console.log('\nDone!');

// Verify
const matches = [...newContent.matchAll(/salesCommissionEvents SalesCommissionEvent\[\]/g)];
console.log('Relation occurrences:', matches.length);
matches.forEach((m, i) => {
 const line = newContent.substring(0, m.index).split('\n').length;
 console.log(' ' + (i+1) + '. line ' + line);
});

const sceMatches = [...newContent.matchAll(/model SalesCommissionEvent/g)];
console.log('\nSalesCommissionEvent models:', sceMatches.length);
