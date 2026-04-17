const fs = require('fs');
let code = fs.readFileSync('src/app/admin/members/page.tsx', 'utf8');

// 1. Update Imports
if (!code.includes('MemberDetailDrawer')) {
  code = code.replace(
    'import { MemberFormDrawer } from \"@/components/admin/members/MemberFormDrawer\";',
    'import { MemberFormDrawer } from \"@/components/admin/members/MemberFormDrawer\";\\nimport { MemberDetailDrawer } from \"@/components/admin/members/MemberDetailDrawer\";'
  );
  code = code.replace(
    'import { TeamMemberBE, MemberStatus, ViewMode, SortKey, ToastType, ToastItem, MemberExt, STATUS_CFG } from \"./types\";',
    'import { TeamMemberBE, MemberStatus, ViewMode, SortKey, ToastType, ToastItem, MemberExt, STATUS_CFG } from \"./types\";\\nimport { fmtLP, fmtDate, deptLabel, deptColor, capitalize, xpPct, rCfg } from \"./utils\";'
  );
}

// 2. Remove Utils & Constants
const utilsStart = 'const DEPARTMENTS_EN =';
const utilsEnd = 'function toMemberExt';
const utilsIdx1 = code.indexOf(utilsStart);
const utilsIdx2 = code.indexOf(utilsEnd);

if (utilsIdx1 !== -1 && utilsIdx2 !== -1 && utilsIdx2 > utilsIdx1) {
  code = code.substring(0, utilsIdx1) + code.substring(utilsIdx2);
}

// 3. Remove MemberDetailModal_
const detailStart = 'function MemberDetailModal_';
const detailEnd = 'function LPAwardModal_';
const dIdx1 = code.indexOf(detailStart);
const dIdx2 = code.indexOf(detailEnd);

if (dIdx1 !== -1 && dIdx2 !== -1 && dIdx2 > dIdx1) {
    // Find the comment block before detailStart if possible
    let finalStart = code.lastIndexOf('// ==', dIdx1);
    if (finalStart === -1) finalStart = dIdx1;
    code = code.substring(0, finalStart) + code.substring(dIdx2);
}

// 4. Update Rendering of MemberDetailModal_
const renderOld = '<MemberDetailModal_ m={detailMember} />';
const renderNew = '<MemberDetailDrawer isOpen={!!detailMember} member={detailMember} onClose={() => setDetailMember(null)} onEdit={(m) => { setDetailMember(null); setFormMember(m); }} />';
code = code.replace(renderOld, renderNew);

fs.writeFileSync('src/app/admin/members/page.tsx', code);
console.log('Modified page.tsx');
