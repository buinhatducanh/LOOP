const fs = require('fs');
let code = fs.readFileSync('src/app/admin/members/page.tsx', 'utf8');

if (!code.includes('import { TeamMemberBE')) {
  code = code.replace(
    'import { ImageUpload }',
    'import { TeamMemberBE, MemberStatus, ViewMode, SortKey, ToastType, ToastItem, MemberExt, STATUS_CFG } from "./types";\nimport { ImageUpload }'
  );
}

const startStr = '// ── Types & Interfaces';
const matcher1 = new RegExp('\\/\\*\\* Partial shape of BE TeamMember.*?interface MemberExt extends TeamMemberBE \\{[^\\}]+\\}\\s*', 's');
const matcher2 = new RegExp('export const STATUS_CFG: Record<MemberStatus,.*?\\};\\s*', 's');

code = code.replace(matcher1, '');
code = code.replace(matcher2, '');

fs.writeFileSync('src/app/admin/members/page.tsx', code);
console.log('Cleaned and Updated imports');
