const fs = require('fs');
const path = require('path');

const files = [
  'src/app/api/admin/auth/seed-roles/route.ts',
  'src/app/api/admin/packages/seed/route.ts',
  'src/app/api/admin/roles/route.ts',
  'src/app/api/admin/settings/locales/route.ts',
  'src/app/api/admin/settings/locales/seed/route.ts',
  'src/app/api/health/route.ts',
  'src/app/api/v1/blog/route.ts',
  'src/app/api/v1/courses/route.ts',
  'src/app/api/v1/pricing/route.ts',
  'src/app/api/v1/projects/route.ts',
  'src/app/api/v1/services/packages/route.ts',
  'src/app/api/v1/team/route.ts',
  'src/app/api/v1/testimonials/route.ts',
];

let fixed = 0;
files.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (!fs.existsSync(fullPath)) return;
  const content = fs.readFileSync(fullPath, 'utf8');
  if (content.includes('from "next/server"') || content.includes('NextResponse }')) return;

  // Add import after the opening /** comment block or at very top
  let newContent = content.replace(
    /^\/\*\*[\s\S]*?\*\/\n/m,
    (match) => match + 'import { NextResponse } from "next/server";\n'
  );
  // If no JSDoc, add after first line
  if (newContent === content) {
    const lines = content.split('\n');
    lines.splice(1, 0, 'import { NextResponse } from "next/server";');
    newContent = lines.join('\n');
  }

  if (newContent !== content) {
    fs.writeFileSync(fullPath, newContent);
    console.log('Fixed NextResponse:', file);
    fixed++;
  }
});

console.log('\nFixed NextResponse (new import):', fixed);