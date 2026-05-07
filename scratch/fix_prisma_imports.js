const fs = require('fs');
const path = require('path');

const filesToFix = [
    'src/lib/analytics/server.ts',
    'src/app/api/admin/team/[id]/route.ts',
    'src/app/api/admin/tasks/[id]/revoke/route.ts',
    'src/app/api/admin/referral-codes/[id]/route.ts',
    'src/app/api/admin/orders/[id]/route.ts',
    'src/app/api/admin/lp-awards/route.ts',
    'src/lib/pricing/order-lifecycle.ts'
];

filesToFix.forEach(relPath => {
    const fullPath = path.join(process.cwd(), relPath.replace(/\//g, path.sep));
    if (!fs.existsSync(fullPath)) {
        console.log(`File not found: ${fullPath}`);
        return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');

    // Replace the import statement
    content = content.replace(
        /import type \{ InputJsonValue \} from "@\/generated\/prisma\/internal\/prismaNamespace";/g,
        'import { Prisma } from "@/generated/prisma/client";'
    );

    // Replace usages
    content = content.replace(/as unknown as InputJsonValue/g, 'as Prisma.InputJsonValue');
    content = content.replace(/as InputJsonValue/g, 'as Prisma.InputJsonValue');

    // Special case for order-lifecycle.ts inline import
    content = content.replace(
        /as unknown as import\("@\/generated\/prisma\/internal\/prismaNamespace"\)\.InputJsonValue/g,
        'as Prisma.InputJsonValue'
    );

    // Ensure Prisma is imported if we used it in order-lifecycle.ts
    if (relPath === 'src/lib/pricing/order-lifecycle.ts' && !content.includes('import { Prisma } from "@/generated/prisma/client"')) {
        content = 'import { Prisma } from "@/generated/prisma/client";\n' + content;
    }

    fs.writeFileSync(fullPath, content);
    console.log(`Fixed: ${relPath}`);
});
