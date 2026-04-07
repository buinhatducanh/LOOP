const fs = require('fs');
const path = require('path');

// ── sessions: add ok from @/lib/api/response ──────────────────────────────
let sc = fs.readFileSync(path.join(process.cwd(), 'src/app/api/admin/auth/sessions/route.ts'), 'utf8');
let ns = sc.replace(
  'import { NextRequest } from "next/server";',
  'import { NextRequest } from "next/server";\nimport { ok } from "@/lib/api/response";'
);
if (ns !== sc) { fs.writeFileSync(path.join(process.cwd(), 'src/app/api/admin/auth/sessions/route.ts'), ns); console.log('Fixed: sessions'); }

// ── blog-posts: add ok from @/lib/api/response ───────────────────────────
let bc = fs.readFileSync(path.join(process.cwd(), 'src/app/api/blog-posts/route.ts'), 'utf8');
let nb = bc.replace(
  'import { handleError } from "@/lib/api";',
  'import { handleError } from "@/lib/api";\nimport { ok } from "@/lib/api/response";'
);
if (nb !== bc) { fs.writeFileSync(path.join(process.cwd(), 'src/app/api/blog-posts/route.ts'), nb); console.log('Fixed: blog-posts'); }

// ── settings/locales/seed: fix auth imports + add ok ──────────────────────
let slc = fs.readFileSync(path.join(process.cwd(), 'src/app/api/admin/settings/locales/seed/route.ts'), 'utf8');
let nsl = slc
  .replace(
    /import \{ requirePermissionFast \} from "@\/lib\/auth\/permissions";\nimport \{ getSession \} from "@\/lib\/auth\/permissions";/,
    'import { requirePermissionFast, getSession } from "@/lib/auth/permissions";'
  )
  .replace(
    'import { NextResponse } from "next/server";',
    'import { NextResponse } from "next/server";\nimport { ok } from "@/lib/api/response";'
  );
if (nsl !== slc) { fs.writeFileSync(path.join(process.cwd(), 'src/app/api/admin/settings/locales/seed/route.ts'), nsl); console.log('Fixed: settings/locales/seed'); }

// ── pricing/seed: add ok from @/lib/api/response ──────────────────────────
let pc = fs.readFileSync(path.join(process.cwd(), 'src/app/api/pricing/seed/route.ts'), 'utf8');
let np = pc.replace(
  'import { isAdmin, requireAuth } from "@/lib/auth/permissions";',
  'import { isAdmin, requireAuth } from "@/lib/auth/permissions";\nimport { ok } from "@/lib/api/response";'
);
if (np !== pc) { fs.writeFileSync(path.join(process.cwd(), 'src/app/api/pricing/seed/route.ts'), np); console.log('Fixed: pricing/seed ok'); }

// ── portal/demos: add ok ─────────────────────────────────────────────────
let dc = fs.readFileSync(path.join(process.cwd(), 'src/app/api/portal/demos/route.ts'), 'utf8');
let nd = dc.replace(
  /import ([^}]+) from "@\/lib\/api[^"]*";/,
  (m, imps) => {
    if (imps.includes('ok')) return m;
    return `import ${imps.trimEnd()}, { ok } from "@/lib/api/response";`;
  }
);
// simpler approach
nd = dc.replace(
  /^(import [^;]+;)/m,
  '$1\nimport { ok } from "@/lib/api/response";'
);
if (nd !== dc) { fs.writeFileSync(path.join(process.cwd(), 'src/app/api/portal/demos/route.ts'), nd); console.log('Fixed: portal/demos'); }

// ── portal/points: add ok ─────────────────────────────────────────────────
let ppc = fs.readFileSync(path.join(process.cwd(), 'src/app/api/portal/points/route.ts'), 'utf8');
let npp = ppc.replace(
  /^(import [^;]+;)/m,
  '$1\nimport { ok } from "@/lib/api/response";'
);
if (npp !== ppc) { fs.writeFileSync(path.join(process.cwd(), 'src/app/api/portal/points/route.ts'), npp); console.log('Fixed: portal/points'); }

// ── customer-points: updated( → NextResponse.json( ───────────────────────
let cc = fs.readFileSync(path.join(process.cwd(), 'src/app/api/admin/customer-points/route.ts'), 'utf8');
let ncc = cc.replace(/return updated\(/g, 'return NextResponse.json(');
if (ncc !== cc) { fs.writeFileSync(path.join(process.cwd(), 'src/app/api/admin/customer-points/route.ts'), ncc); console.log('Fixed: customer-points'); }

// ── pending approve/reject: updated → NextResponse.json ─────────────────
['src/app/api/admin/team/members/pending/[id]/approve/route.ts',
 'src/app/api/admin/team/members/pending/[id]/reject/route.ts'].forEach(f => {
  const fullPath = path.join(process.cwd(), f);
  if (!fs.existsSync(fullPath)) return;
  let c = fs.readFileSync(fullPath, 'utf8');
  let n = c.replace(/return updated\(/g, 'return NextResponse.json(');
  if (n !== c) { fs.writeFileSync(fullPath, n); console.log('Fixed updated:', f); }
});

// ── points: getSession → const session ───────────────────────────────────
let ptsc = fs.readFileSync(path.join(process.cwd(), 'src/app/api/points/route.ts'), 'utf8');
let npts = ptsc.replace(/session\./g, 'session.');
// The issue is that it uses `session.` but never declares `session`
// Check if getSession exists
if (ptsc.includes('session.') && !ptsc.match(/const session = await getSession/)) {
  // Add getSession call
  npts = ptsc.replace(
    /(const \{ searchParams \} = new URL\(req\.url\);)/,
    '$1\n    const session = await getSession(req);'
  );
  // Add getSession import
  if (!ptsc.includes('getSession')) {
    npts = npts.replace(
      /import \{ [^}]+ \} from "@\/lib\/auth\/permissions";/,
      (m) => m.includes('getSession') ? m : m.replace('}', 'getSession }').replace('{ ', '{ ');
    );
  }
}
if (npts !== ptsc) { fs.writeFileSync(path.join(process.cwd(), 'src/app/api/points/route.ts'), npts); console.log('Fixed: points'); }

console.log('\nDone.');
