const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');
const lines = content.split('\n');
const N = lines.length;
console.log(`Original lines: ${N}`);

// ── Helpers ─────────────────────────────────────────────────────────────────
function lineAt(idx) { return lines[idx] ?? '(OOB)'; }

// ── Verify anchors (0-indexed) ───────────────────────────────────────────────
function verify(label, idx, pattern) {
 const ok = lineAt(idx).includes(pattern);
 console.log(`${ok ? '✓' : '✗'} [${idx}] (line ${idx+1}): "${lineAt(idx).trim()}" -- ${label}`);
 return ok;
}

const ORDER_CLOSE = 677; // original 0-idx: line 678 "}"
const ENROLL_CLOSE = 2339; // original 0-idx: line 2340 "}"
const LPAWARD_CLOSE = 1922; // original 0-idx: line 1923 "}"
const LEVEL_IDX = 446; // original 0-idx: line 447 level field
const OFFSPLITS_IDX = 488; // original 0-idx: line 489 offSystemSplits

verify('Order closing brace', ORDER_CLOSE, '}');
verify('Enrollment closing brace', ENROLL_CLOSE, '}');
verify('LpAward closing brace', LPAWARD_CLOSE, '}');
verify('TeamMember level', LEVEL_IDX, '@map("level")');
verify('TeamMember offSystemSplits', OFFSPLITS_IDX, 'offSystemSplits');

// ── Fields definitions ───────────────────────────────────────────────────────
const ORDER_FIELDS = [
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

const ENROLL_FIELDS = [
 ' salesRepId String? @map("sales_rep_id")',
 ' /// Whether academy commission has been credited',
 ' commissionPaid Boolean @default(false) @map("commission_paid")',
 ' /// When commission was credited',
 ' commissionPaidAt DateTime? @map("commission_paid_at")',
  ' /// Sales commission events for this enrollment',
 ' salesCommissionEvents SalesCommissionEvent[]',
];

const SCE_MODEL = [
 '',
 '/// Sales LP commission events — audit trail for sales commission credits.',
 'model SalesCommissionEvent {',
 ' id String @id @default(cuid())',
 ' /// TeamMember.id — nhân viên nhận commission',
 ' salesRepId String @map("sales_rep_id")',
 ' /// Loại nguồn: "order" | "enrollment" | "media_booking"',
 ' referenceType String @map("reference_type")',
 ' /// Order.id / Enrollment.id / ...',
 ' referenceId String @map("reference_id")',
 ' /// LP từ dịch vụ chính (10%)',
 ' directLp Int @default(0) @map("direct_lp")',
 ' /// LP từ addon (5%)',
 ' addonLp Int @default(0) @map("addon_lp")',
  ' /// Tổng LP đã credited',
 ' totalLp Int @map("total_lp")',
 ' /// Thời điểm credited',
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

const MEMBER_FIELDS = [
 ' /// Tổng LP commission đã nhận',
 ' totalSalesCommission Int @default(0) @map("total_sales_commission")',
 ' /// LP commission đang chờ (chưa done)',
 ' pendingCommission Int @default(0) @map("pending_commission")',
 ' /// LP commission đã nhận (done)',
 ' completedCommission Int @default(0) @map("completed_commission")',
];

const MEMBER_REL = [
 ' /// Sales commission events (audit trail)',
 ' salesCommissionEvents SalesCommissionEvent[]',
];

// ── Build result by splicing into a copy of the lines array ─────────────────
// We insert in DESCENDING original-index order so earlier (lower-index)
// insertions don't affect later (higher-index) positions.
//
// Order of operations (descending):
// 1. Enrollment  at 2339 (+7 lines) → shifts indices < 2339 by 0
// 2. SCE model at 1930 (+28 lines) → Enrollment (2339+) shifts by +28
// 3. Order at 684 (+10 lines) → Enrollment (+35), SCE (+28) → shift Order by 0
// 4. Member rel at 527 (+2 lines) → shifts by nothing above 527
// 5. Member flds at 450 (+3 lines) → shifts by nothing above 450

let result = [...lines];
let offset = 0; // cumulative offset applied so far

// 1. Enrollment — insert BEFORE closing "}" at 2339 (Enrollment is near end, so insert LAST)
// Actually: Enrollment is at 2339 (the highest index), so insert FIRST (splice at 2339)
// Enrollment close is at 2339 → insert fields at 2339 (before the "}")
result.splice(ENROLL_CLOSE, 0, ...ENROLL_FIELDS);
offset += ENROLL_FIELDS.length;
console.log(`\n✓ Enrollment: inserted ${ENROLL_FIELDS.length} fields at original idx ${ENROLL_CLOSE} (now at ${ENROLL_CLOSE + offset - ENROLL_FIELDS.length})`);

// After Enrollment: Enrollment close shifts from 2339 to 2339+7=2346
// LpAward close (original 1922) stays at 1922 (Enrollment insert is below it)

// 2. SCE model — insert AFTER LpAward closing "}" (original 1922, now 1922 after Enrollment)
// LpAward close at original 1922 → now at 1922 (Enrollment is 2339+)
result.splice(LPAWARD_CLOSE + 1, 0, ...SCE_MODEL);
offset += SCE_MODEL.length;
console.log(`✓ SCE model: inserted ${SCE_MODEL.length} lines after original LpAward close at ${LPAWARD_CLOSE + 1}`);
// After SCE: offSystemSplits (original 488) stays at 488 (SCE is at 1923+)
// Enrollment close shifted from 2339 to 2339+7+28=2374

// 3. Order — insert BEFORE closing "}" at original 677 (no shifts from below since all insertions are below it)
// Order close original 677 → unchanged (Enrollment 2339+, SCE 1923+)
result.splice(ORDER_CLOSE, 0, ...ORDER_FIELDS);
offset += ORDER_FIELDS.length;
console.log(`✓ Order: inserted ${ORDER_FIELDS.length} fields at original idx ${ORDER_CLOSE}`);

// 4. Member relation — insert AFTER offSystemSplits (original 488, unchanged by all below)
// offSystemSplits original 488 → still 488 (Enrollment 2339+, SCE 1923+, Order 677+)
// Insert after offSystemSplits line
const memberRelInsertIdx = OFFSPLITS_IDX + 1; // after the offSystemSplits line
result.splice(memberRelInsertIdx, 0, ...MEMBER_REL);
offset += MEMBER_REL.length;
console.log(`✓ Member relation: inserted ${MEMBER_REL.length} lines at idx ${memberRelInsertIdx}`);

// 5. Member fields — insert AFTER level field (original 446, unchanged by all below)
// Insert at 446+1 = 447 (after the level line)
const memberFieldsInsertIdx = LEVEL_IDX + 1;
result.splice(memberFieldsInsertIdx, 0, ...MEMBER_FIELDS);
offset += MEMBER_FIELDS.length;
console.log(`✓ Member fields: inserted ${MEMBER_FIELDS.length} fields at idx ${memberFieldsInsertIdx}`);

// ── Write ───────────────────────────────────────────────────────────────────
const newContent = result.join('\n') + '\n';
fs.writeFileSync('prisma/schema.prisma', newContent, 'utf8');

// ── Verify ───────────────────────────────────────────────────────────────────
const relMatches = [...newContent.matchAll(/salesCommissionEvents SalesCommissionEvent\[\]/g)];
console.log(`\n=== VERIFICATION ===`);
console.log(`salesCommissionEvents relations: ${relMatches.length}`);
relMatches.forEach((m, i) => {
 const lineNum = newContent.substring(0, m.index).split('\n').length;
 console.log(` ${i+1}. line ${lineNum}`);
});

const sceModels = [...newContent.matchAll(/^model SalesCommissionEvent \{$/m)];
console.log(`\nSalesCommissionEvent models: ${sceModels.length}`);

const checks = [
 ['Order: salesRepId', 'salesRepId String? @map("sales_rep_id")'],
 ['Order: salesDirectCommission', 'salesDirectCommission Int @default(0) @map("sales_direct_commission")'],
 ['Order: salesAddonCommission', 'salesAddonCommission Int @default(0) @map("sales_addon_commission")'],
 ['Order: commissionPaid', 'commissionPaid Boolean @default(false) @map("commission_paid")'],
 ['Order: commissionPaidAt', 'commissionPaidAt DateTime? @map("commission_paid_at")'],
 ['Enrollment: commissionPaidAt', 'commissionPaidAt DateTime? @map("commission_paid_at")'],
 ['TeamMember: totalSalesCommission', 'totalSalesCommission Int @default(0) @map("total_sales_commission")'],
 ['TeamMember: pendingCommission', 'pendingCommission Int @default(0) @map("pending_commission")'],
 ['TeamMember: completedCommission', 'completedCommission Int @default(0) @map("completed_commission")'],
 ['SCE: directLp', 'directLp Int @default(0) @map("direct_lp")'],
 ['SCE: addonLp', 'addonLp Int @default(0) @map("addon_lp")'],
 ['SCE: totalLp', 'totalLp Int @map("total_lp")'],
 ['SCE: paidAt', 'paidAt DateTime @default(now()) @map("paid_at")'],
 ['SCE: relation order', 'order Order? @relation("SalesCommissionOrder"'],
 ['SCE: relation enrollment', 'enrollment Enrollment? @relation("SalesCommissionEnrollment"'],
];

let allPass = true;
checks.forEach(([label, pattern]) => {
 const ok = newContent.includes(pattern);
 if (!ok) allPass = false;
 console.log(` ${ok ? '✓' : '✗'} ${label}`);
});

console.log(`\nTotal lines: ${result.length} (was ${N}, delta +${result.length - N})`);
console.log(`\n${allPass ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED'}`);
