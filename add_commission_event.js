const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Add SalesCommissionEvent model after LpAward
const salesEventModel = `

/// Sales LP commission events - audit trail for sales commission credits
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

 @@index([salesRepId])
 @@index([referenceType, referenceId])
 @@index([paidAt])
 @@map("sales_commission_events")
}
`;

content = content.replace(
 ' @@map("lp_awards")\n}',
 ' @@map("lp_awards")\n}' + salesEventModel + '\n'
);

// Add relations to TeamMember (find the LpAward relation block in TeamMember)
const teamMemberRelation = `
 /// Sales commission events (audit trail)
 salesCommissionEvents SalesCommissionEvent[]
`;

content = content.replace(
 ' /// LP/EXP awards earned by members. Pending → approved by PM/CEO.\n model LpAward {',
 teamMemberRelation + '\n\n /// LP/EXP awards earned by members. Pending → approved by PM/CEO.\n model LpAward {'
);

// Add relation to Order
const orderRelation = `
 /// Sales commission events for this order
 salesCommissionEvents SalesCommissionEvent[]
`;

content = content.replace(
 ' /// SalesCommissionEvent - audit trail for sales commission credits\nmodel SalesCommissionEvent {',
 orderRelation + '\n\n /// SalesCommissionEvent - audit trail for sales commission credits\nmodel SalesCommissionEvent {'
);

// Add relation to Enrollment
const enrollRelation = `
 /// Sales commission events for this enrollment
 salesCommissionEvents SalesCommissionEvent[]
`;

content = content.replace(
 ' /// TeamMember.id - nhan vien tu van khoa hoc\n salesRepId String? @map("sales_rep_id")',
 enrollRelation + '\n\n /// TeamMember.id - nhan vien tu van khoa hoc\n salesRepId String? @map("sales_rep_id")'
);

fs.writeFileSync('prisma/schema.prisma', content, 'utf8');
console.log('Done. Has SalesCommissionEvent:', content.includes('model SalesCommissionEvent'));
console.log('Relations in TeamMember:', content.includes('salesCommissionEvents SalesCommissionEvent'));
