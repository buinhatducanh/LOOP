const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

let changes = 0;

// 1. Add commission fields to Order model (before @@index)
const orderIdx = content.indexOf('@@index([status, createdAt])');
if (orderIdx !== -1) {
 const before = content.substring(0, orderIdx);
 const after = content.substring(orderIdx);
 const fields = ` salesRepId String? @map("sales_rep_id")
 /// LP earned from main service (10% direct commission)
 salesDirectCommission Int @default(0) @map("sales_direct_commission")
 /// LP earned from addons (5% addon commission)
 salesAddonCommission Int @default(0) @map("sales_addon_commission")
 /// Whether commission has been credited to salesRep
 commissionPaid Boolean @default(false) @map("commission_paid")
 /// When commission was credited
 commissionPaidAt DateTime? @map("commission_paid_at")
 /// Sales commission events for this order
 salesCommissionEvents SalesCommissionEvent[]
`;
 content = before + fields + after;
 console.log('OK: Order commission fields');
 changes++;
} else {
 console.log('MISSING: Order @@index anchor');
}

// 2. Add commission fields to Enrollment model (before @@index([courseId]))
const enrollIdx = content.indexOf('@@index([courseId])');
if (enrollIdx !== -1) {
 const before = content.substring(0, enrollIdx);
 const after = content.substring(enrollIdx);
 const fields = ` salesRepId String? @map("sales_rep_id")
 /// Whether academy commission has been credited
 commissionPaid Boolean @default(false) @map("commission_paid")
 /// When commission was credited
 commissionPaidAt DateTime? @map("commission_paid_at")
 /// Sales commission events for this enrollment
 salesCommissionEvents SalesCommissionEvent[]
`;
 content = before + fields + after;
 console.log('OK: Enrollment commission fields');
 changes++;
} else {
 console.log('MISSING: Enrollment @@index anchor');
}

// 3. Add sales tracking fields to TeamMember (after level field)
const levelRegex = /(\n\s+level\s+Int\s+@default\(1\)\s+@map\("level"\))/;
const memberFields = `\n totalSalesCommission Int @default(0) @map("total_sales_commission")
 pendingCommission Int @default(0) @map("pending_commission")
 completedCommission Int @default(0) @map("completed_commission")`;

const match = content.match(levelRegex);
if (match) {
 content = content.replace(levelRegex, match[1] + memberFields);
 console.log('OK: TeamMember commission fields');
 changes++;
} else {
 console.log('MISSING: TeamMember level field');
}

// 4. Add SalesCommissionEvent model after LpAward
const lpAwardsEnd = '@@map("lp_awards")\r\n}';
const sceModel = `
/// Sales LP commission events - audit trail for sales commission credits.
model SalesCommissionEvent {
 id String @id @default(cuid())
 /// TeamMember.id - nhan vien nhan commission
 salesRepId String @map("sales_rep_id")
 /// Loai nguon: "order" | "enrollment" | "media_booking"
 referenceType String @map("reference_type")
 /// Order.id / Enrollment.id / ...
 referenceId String @map("reference_id")
 /// LP tu dich vu chinh (10%)
 directLp Int @default(0) @map("direct_lp")
 /// LP tu addon (5%)
 addonLp Int @default(0) @map("addon_lp")
 /// Tong LP da credited
 totalLp Int @map("total_lp")
 /// Thoi diem credited
 paidAt DateTime @default(now()) @map("paid_at")

 salesRep TeamMember @relation(fields: [salesRepId], references: [id])
 /// Back-ref to Order (nullable)
 order Order? @relation("SalesCommissionOrder", fields: [orderId], references: [id])
 orderId String? @map("order_id")
 /// Back-ref to Enrollment (nullable)
 enrollment Enrollment? @relation("SalesCommissionEnrollment", fields: [enrollmentId], references: [id])
 enrollmentId String? @map("enrollment_id")

 @@index([salesRepId])
 @@index([orderId])
 @@index([enrollmentId])
 @@index([referenceType, referenceId])
 @@index([paidAt])
 @@map("sales_commission_events")
}`;

if (content.includes(lpAwardsEnd)) {
 content = content.replace(lpAwardsEnd, lpAwardsEnd + sceModel);
 console.log('OK: SalesCommissionEvent model');
 changes++;
} else {
 console.log('MISSING: LpAward ending');
}

// 5. Add relation to TeamMember (after offSystemSplits line)
const offIdx = content.indexOf('offSystemSplits');
if (offIdx !== -1) {
 const lineEnd = content.indexOf('\r\n', offIdx) + 2;
 content = content.substring(0, lineEnd) + '\r\n /// Sales commission events (audit trail)\r\n salesCommissionEvents SalesCommissionEvent[]' + content.substring(lineEnd);
 console.log('OK: TeamMember relation');
 changes++;
} else {
 console.log('MISSING: offSystemSplits in TeamMember');
}

fs.writeFileSync('prisma/schema.prisma', content, 'utf8');
console.log(`\nTotal changes: ${changes}`);
console.log('SalesCommissionEvent:', content.includes('model SalesCommissionEvent'));
console.log('Order sales fields:', content.includes('salesRepId String? @map("sales_rep_id")'));
console.log('TeamMember sales fields:', content.includes('totalSalesCommission'));

// Verify all 3 relations
const matches = [...content.matchAll(/salesCommissionEvents SalesCommissionEvent\[\]/g)];
console.log('\nRelation occurrences:', matches.length);
matches.forEach((m, i) => {
 const line = content.substring(0, m.index).split('\n').length;
 console.log(` ${i+1}. line ${line}`);
});
