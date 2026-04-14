const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Remove duplicate enrollment fields (second occurrence)
const oldDup = '\r\n salesRepId String? @map("sales_rep_id")\r\n /// Whether academy commission has been credited\r\n commissionPaid Boolean @default(false) @map("commission_paid")\r\n /// When commission was credited\r\n commissionPaidAt DateTime? @map("commission_paid_at")\r\n /// Sales commission events for this enrollment\r\n salesCommissionEvents SalesCommissionEvent[]\r\n@@index';
const newDup = '\r\n@@index';

if (content.includes(oldDup)) {
 content = content.replace(oldDup, newDup);
 console.log('Removed duplicate enrollment fields');
} else {
 console.log('Duplicate pattern not found');
}

fs.writeFileSync('prisma/schema.prisma', content, 'utf8');

// Verify
const matches = [...content.matchAll(/salesCommissionEvents SalesCommissionEvent\[\]/g)];
console.log('Relation occurrences:', matches.length);
matches.forEach((m, i) => {
 const line = content.substring(0, m.index).split('\n').length;
 console.log(' ' + (i+1) + '. line ' + line);
});
