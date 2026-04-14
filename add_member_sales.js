const fs = require('fs');
let content = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Use regex to find the level field regardless of spacing
const levelRegex = /(\s+level\s+Int\s+@default\(1\) @map\("level"\))/;
const afterLevel = `
 totalSalesCommission Int @default(0) @map("total_sales_commission")
 pendingCommission Int @default(0) @map("pending_commission")
 completedCommission Int @default(0) @map("completed_commission")
`;

if (!content.includes('totalSalesCommission')) {
 content = content.replace(levelRegex, '$1' + afterLevel);
 fs.writeFileSync('prisma/schema.prisma', content, 'utf8');
 console.log('Done. Has sales fields:', content.includes('totalSalesCommission'));
} else {
 console.log('Already added');
}
