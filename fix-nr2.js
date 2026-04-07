const fs = require('fs');
const path = require('path');

const files = [
  'src/app/api/admin/auth/login/route.ts',
  'src/app/api/admin/auth/seed-roles/route.ts',
  'src/app/api/admin/dashboard/charts/route.ts',
  'src/app/api/admin/dashboard/route.ts',
  'src/app/api/admin/packages/seed/route.ts',
  'src/app/api/admin/roles/route.ts',
  'src/app/api/admin/settings/locales/route.ts',
  'src/app/api/admin/settings/locales/seed/route.ts',
  'src/app/api/health/route.ts',
  'src/app/api/ref/[code]/info/route.ts',
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

  if (content.includes('NextResponse } from "next/server"')) {
    // Already has it
    return;
  }

  let newContent = content;

  if (content.includes('import { NextRequest } from "next/server"')) {
    newContent = content.replace(
      'import { NextRequest } from "next/server"',
      'import { NextRequest, NextResponse } from "next/server"'
    );
  } else if (content.includes('import type { NextRequest } from "next/server"')) {
    // Type-only import — add separate regular import after the type import
    newContent = content.replace(
      'import type { NextRequest } from "next/server"',
      'import type { NextRequest } from "next/server";\nimport { NextResponse } from "next/server";'
    );
  } else if (content.includes('from "next/server"')) {
    // Some other next/server import — add NextResponse to it
    newContent = content.replace(
      /import ([^}]+) from "next\/server"/,
      (m, imports) => {
        if (!imports.includes('NextResponse')) {
          return `import ${imports.trim()}, { NextResponse } from "next/server"`;
        }
        return m;
      }
    );
  }

  if (newContent !== content) {
    fs.writeFileSync(fullPath, newContent);
    console.log('Fixed NextResponse:', file);
    fixed++;
  }
});

console.log('\nFixed NextResponse:', fixed);