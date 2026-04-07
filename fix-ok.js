const fs = require('fs');
const path = require('path');

// ── Pattern 1: Add missing `ok` import from `@/lib/api` ────────────────────
// Strategy: find files that use `ok(` without importing it, add import
// Pattern: `import { handleError } from "@/lib/api/response"` → add ok
// OR if no lib/api import exists, add `import { ok } from "@/lib/api/response"` at top

const files1 = [
  'src/app/api/admin/access-tags/route.ts',
  'src/app/api/admin/addon-services/[id]/route.ts',
  'src/app/api/admin/addon-services/route.ts',
  'src/app/api/admin/auth/seed-roles/route.ts',
  'src/app/api/admin/customer-websites/[id]/route.ts',
  'src/app/api/admin/dashboard/charts/route.ts',
  'src/app/api/admin/dashboard/route.ts',
  'src/app/api/admin/edu/instructors/[id]/route.ts',
  'src/app/api/admin/edu/instructors/route.ts',
  'src/app/api/admin/expertises/[id]/route.ts',
  'src/app/api/admin/expertises/route.ts',
  'src/app/api/admin/feature-groups/[id]/route.ts',
  'src/app/api/admin/feature-groups/route.ts',
  'src/app/api/admin/features/[id]/route.ts',
  'src/app/api/admin/features/route.ts',
  'src/app/api/admin/kpi/dashboard/route.ts',
  'src/app/api/admin/kpi/member-performance/route.ts',
  'src/app/api/admin/landing-pages/[id]/route.ts',
  'src/app/api/admin/landing-pages/[id]/sections/[sectionId]/route.ts',
  'src/app/api/admin/landing-pages/[id]/sections/route.ts',
  'src/app/api/admin/landing-pages/route.ts',
  'src/app/api/admin/lp-awards/[id]/route.ts',
  'src/app/api/admin/lp-redemptions/route.ts',
  'src/app/api/admin/maintenance-contracts/[id]/route.ts',
  'src/app/api/admin/maintenance-contracts/route.ts',
  'src/app/api/admin/orders/[id]/route.ts',
  'src/app/api/admin/orders/route.ts',
  'src/app/api/admin/packages/comparison-features/[id]/route.ts',
  'src/app/api/admin/packages/comparison-features/route.ts',
  'src/app/api/admin/packages/deployment-items/[id]/route.ts',
  'src/app/api/admin/packages/deployment-items/route.ts',
  'src/app/api/admin/packages/domain-prices/[id]/route.ts',
  'src/app/api/admin/packages/domain-prices/route.ts',
  'src/app/api/admin/packages/feature-categories/[id]/route.ts',
  'src/app/api/admin/packages/feature-categories/route.ts',
  'src/app/api/admin/packages/hosting-plans/[id]/route.ts',
  'src/app/api/admin/packages/hosting-plans/route.ts',
  'src/app/api/admin/packages/web-packages/[id]/route.ts',
  'src/app/api/admin/packages/web-packages/route.ts',
  'src/app/api/admin/portal/route.ts',
  'src/app/api/admin/projects/[id]/route.ts',
  'src/app/api/admin/projects/route.ts',
  'src/app/api/admin/quote-requests/[id]/route.ts',
  'src/app/api/admin/quote-requests/route.ts',
  'src/app/api/admin/quotes/[id]/route.ts',
  'src/app/api/admin/quotes/route.ts',
  'src/app/api/admin/rank/leaderboard/route.ts',
  'src/app/api/admin/referral-codes/[id]/route.ts',
  'src/app/api/admin/referral-codes/route.ts',
  'src/app/api/admin/reward-tiers/[id]/items/[itemId]/route.ts',
  'src/app/api/admin/reward-tiers/[id]/items/route.ts',
  'src/app/api/admin/reward-tiers/[id]/route.ts',
  'src/app/api/admin/reward-tiers/route.ts',
  'src/app/api/admin/sales-leads/[id]/route.ts',
  'src/app/api/admin/sales-leads/route.ts',
  'src/app/api/admin/service-attributes/[id]/route.ts',
  'src/app/api/admin/service-attributes/route.ts',
  'src/app/api/admin/services/[id]/route.ts',
  'src/app/api/admin/services/route.ts',
  'src/app/api/admin/sla-rules/[id]/route.ts',
  'src/app/api/admin/sla-rules/route.ts',
  'src/app/api/admin/team/[id]/route.ts',
  'src/app/api/admin/team/route.ts',
  'src/app/api/admin/testimonials/[id]/route.ts',
  'src/app/api/admin/testimonials/route.ts',
  'src/app/api/admin/users/[id]/route.ts',
  'src/app/api/admin/users/route.ts',
  'src/app/api/admin/web-templates/[id]/route.ts',
  'src/app/api/admin/web-templates/route.ts',
  'src/app/api/v1/projects/route.ts',
  'src/app/api/v1/services/packages/route.ts',
  'src/app/api/v1/team/route.ts',
  'src/app/api/v1/testimonials/route.ts',
];

let fixed = 0;
files1.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (!fs.existsSync(fullPath)) return;
  const content = fs.readFileSync(fullPath, 'utf8');
  if (!content.includes('ok(')) return;

  // Already has ok from lib/api/response?
  if (content.includes('from "@/lib/api/response"') && !content.includes('ok,')) {
    // Need to add ok to existing import
    if (content.includes('import { handleError } from "@/lib/api/response"')) {
      let newContent = content.replace(
        'import { handleError } from "@/lib/api/response"',
        'import { handleError, ok } from "@/lib/api/response"'
      );
      fs.writeFileSync(fullPath, newContent);
      console.log('Fixed ok:', file);
      fixed++;
    }
  } else if (!content.includes('"@/lib/api/response"') && !content.includes('ok }')) {
    // No lib/api/response import at all — add one after the first import
    // Insert after first `import ... from` line
    const newContent = content.replace(
      /^(import .+? from ["'][^"']+["'];?\n)/m,
      '$1import { ok } from "@/lib/api/response";\n'
    );
    if (newContent !== content) {
      fs.writeFileSync(fullPath, newContent);
      console.log('Fixed ok (new import):', file);
      fixed++;
    }
  }
});

console.log('\nFixed ok imports:', fixed);