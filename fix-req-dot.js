const fs = require('fs');
const path = require('path');

const files = [
  'src/app/api/admin/audit-log/route.ts',
  'src/app/api/admin/auth/logout/route.ts',
  'src/app/api/admin/customer-websites/route.ts',
  'src/app/api/admin/expertises/route.ts',
  'src/app/api/admin/figma-demos/route.ts',
  'src/app/api/admin/git-commits/route.ts',
  'src/app/api/admin/pricing/addons/route.ts',
  'src/app/api/admin/pricing/features/route.ts',
  'src/app/api/admin/pricing/infra-tiers/route.ts',
  'src/app/api/admin/pricing/packages/route.ts',
  'src/app/api/admin/team/members/invite-accept/route.ts',
  'src/app/api/admin/upload/route.ts',
];

let fixed = 0;
files.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  let newContent = content.replace(/_req\.url/g, 'req.url');

  // Also fix cases where _req was used as the URL object directly
  // e.g. new URL(_req.url) or _req.json()
  newContent = newContent.replace(/_req\.json\(\)/g, 'req.json()');
  newContent = newContent.replace(/new URL\(_req\.url\)/g, 'new URL(req.url)');

  if (newContent !== content) {
    fs.writeFileSync(fullPath, newContent);
    console.log('Fixed req:', file);
    fixed++;
  }
});

console.log('\nDone. Fixed:', fixed);