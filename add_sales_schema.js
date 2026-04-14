const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// 1. Add salesRepId + commission fields to Order model
const orderCommissionFields = `
 /// TeamMember.id - nhan vien tu van truc tiep cho khach hang
 salesRepId String? @map("sales_rep_id")
 /// LP earned from main service (10% direct commission)
 salesDirectCommission Int @default(0) @map("sales_direct_commission")
 /// LP earned from addons (5% addon commission)
 salesAddonCommission Int @default(0) @map("sales_addon_commission")
 /// Whether commission has been credited to salesRep
 commissionPaid Boolean @default(false) @map("commission_paid")
 /// When commission was credited
 commissionPaidAt DateTime? @map("commission_paid_at")
`;

content = content.replace(
 ' @@index([status, createdAt])',
 orderCommissionFields + '\n @@index([status, createdAt])'
);

// 2. Add salesRepId + commission fields to Enrollment model
const enrollCommissionFields = `
 /// TeamMember.id - nhan vien tu van khoa hoc
 salesRepId String? @map("sales_rep_id")
 /// Whether academy commission has been credited
  commissionPaid Boolean @default(false) @map("commission_paid")
 /// When commission was credited
 commissionPaidAt DateTime? @map("commission_paid_at")
`;

content = content.replace(
 ' @@index([courseId])',
 enrollCommissionFields + '\n @@index([courseId])'
);

// 3. Add sales commission tracking to TeamMember
const memberSalesFields = `
 /// Tong LP tu sales commission (tat ca sources)
 totalSalesCommission Int @default(0) @map("total_sales_commission")
 /// LP sales commission dang cho credited (order chua done)
 pendingCommission Int @default(0) @map("pending_commission")
 /// LP sales commission da credited
 completedCommission Int @default(0) @map("completed_commission")
`;

content = content.replace(
 ' level  Int @default(1) @map("level")',
 ' level Int @default(1) @map("level")\n' + memberSalesFields
);

fs.writeFileSync('prisma/schema.prisma', content, 'utf8');
console.log('Schema updated');
