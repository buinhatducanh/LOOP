const fs = require('fs');
let code = fs.readFileSync('src/app/admin/members/page.tsx', 'utf8');

const sIdx = code.indexOf('function MemberFormModal_');
const eIdx = code.indexOf('function ApprovalModal_()');

if (sIdx !== -1 && eIdx !== -1) {
  const finalStart = code.lastIndexOf('// ==', sIdx);
  const before = code.substring(0, finalStart);
  const after = code.substring(eIdx);
  
  fs.writeFileSync('src/app/admin/members/page.tsx', before + '\n\n  ' + after);
  console.log('Removed successfully.');
} else {
  console.log('Not found:', sIdx, eIdx);
}
