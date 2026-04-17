const fs = require('fs');
let code = fs.readFileSync('src/app/admin/members/page.tsx', 'utf8');

// 1. Add import
code = code.replace(
  'import { LPAwardDrawer } from \"@/components/admin/members/LPAwardDrawer\";',
  'import { LPAwardDrawer } from \"@/components/admin/members/LPAwardDrawer\";\\nimport { BulkLPDrawer } from \"@/components/admin/members/BulkLPDrawer\";'
);

// 2. Replace component call
code = code.replace(
  '{bulkMembers.length > 0 && <BulkLPModal_ />}',
  '<BulkLPDrawer isOpen={bulkMembers.length > 0} members={bulkMembers} onClose={() => setBulkMembers([])} onSubmit={(members, amount, desc) => { members.forEach(m => bulkLpMutation.mutate({ memberId: m.id, amount, description: desc })); }} isMutating={bulkLpMutation.isPending} />'
);

// 3. Remove legacy function (lines approx 859 to end of function)
const regex = /\\n\\s*function BulkLPModal_\\(\\)[\\s\\S]*?\\n\\s*\\}\\n/m;
code = code.replace(regex, '\\n');

fs.writeFileSync('src/app/admin/members/page.tsx', code);
console.log('Modified page.tsx');
