const fs = require('fs');
let code = fs.readFileSync('src/app/admin/members/page.tsx', 'utf8');

// 1. Add import
code = code.replace(
  'import { MemberDetailDrawer } from \"@/components/admin/members/MemberDetailDrawer\";',
  'import { MemberDetailDrawer } from \"@/components/admin/members/MemberDetailDrawer\";\\nimport { LPAwardDrawer } from \"@/components/admin/members/LPAwardDrawer\";'
);

// 2. Replace component call
code = code.replace(
  '{lpMember && <LPAwardModal_ m={lpMember} />}',
  '<LPAwardDrawer isOpen={!!lpMember} member={lpMember} onClose={() => setLpMember(null)} onSubmit={(data) => lpMutation.mutate(data)} isMutating={lpMutation.isPending} />'
);

// 3. Remove legacy function (lines 714 to 818 approx)
// I will use a regex to find the function block
const regex = /\\n\\s*function LPAwardModal_\\(\\{ m \\}: \\{ m: MemberExt \\}\\) \\{[\\s\\S]*?\\n\\s*\\}\\n/m;
code = code.replace(regex, '\\n');

fs.writeFileSync('src/app/admin/members/page.tsx', code);
console.log('Modified page.tsx');
