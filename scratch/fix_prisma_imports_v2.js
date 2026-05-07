const fs = require('fs');
const path = require('path');

const filesToFix = [
    'src/app/api/admin/team/route.ts',
    'src/app/api/admin/users/route.ts',
    'src/app/api/admin/features/route.ts'
];

filesToFix.forEach(relPath => {
    const fullPath = path.join(process.cwd(), relPath.replace(/\//g, path.sep));
    if (!fs.existsSync(fullPath)) {
        console.log(`File not found: ${fullPath}`);
        return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');

    // Replace the import statement
    // Match something like: import type { ... } from "@/generated/prisma/models/...";
    content = content.replace(
        /import type \{ ([^}]+) \} from "@\/generated\/prisma\/models\/[^"]+";/g,
        'import { Prisma } from "@/generated/prisma/client";'
    );

    // Replace usages: Change the type names to Prisma.TypeName
    // We need to capture the type names from the import first
    const match = content.match(/import \{ Prisma \} from "@\/generated\/prisma\/client";/);
    if (match) {
        // This is a bit complex to do generic replacement, so let's do it specifically for these 3 files
        if (relPath.includes('team')) {
            content = content.replace(/TeamMemberCreateInput/g, 'Prisma.TeamMemberCreateInput');
        } else if (relPath.includes('users')) {
            // UserModel is likely User
            content = content.replace(/UserModel/g, 'Prisma.User');
        } else if (relPath.includes('features')) {
            content = content.replace(/FeatureWhereInput/g, 'Prisma.FeatureWhereInput');
        }
    }

    fs.writeFileSync(fullPath, content);
    console.log(`Fixed: ${relPath}`);
});
