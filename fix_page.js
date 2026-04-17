const fs = require('fs');
let code = fs.readFileSync('src/app/admin/members/page.tsx', 'utf8');

// 1. Remove duplicate capitalize
const capStart = 'function capitalize(s: string) {';
const capIdx = code.indexOf(capStart);
if (capIdx !== -1) {
    const capEndIdx = code.indexOf('}', capIdx) + 1;
    code = code.substring(0, capIdx) + code.substring(capEndIdx);
}

// 2. Add DEPARTMENTS_EN/VI to imports
code = code.replace(
    'import { fmtLP, fmtDate, deptLabel, deptColor, capitalize, xpPct, rCfg } from \"./utils\";',
    'import { fmtLP, fmtDate, deptLabel, deptColor, capitalize, xpPct, rCfg, DEPARTMENTS_EN, DEPARTMENTS_VI } from \"./utils\";'
);

fs.writeFileSync('src/app/admin/members/page.tsx', code);
console.log('Fixed page.tsx');
