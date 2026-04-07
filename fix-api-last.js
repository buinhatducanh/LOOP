const fs = require('fs');
const path = require('path');

// Fix access-tags
const ac = fs.readFileSync(path.join(process.cwd(), 'src/app/api/admin/access-tags/route.ts'), 'utf8');
let content = ac.replace(
  /import \{ requirePermissionFast \} from "@\/lib\/auth\/permissions"/,
  'import { requireAuth, requirePermissionFast } from "@/lib/auth/permissions"'
);
if (content !== ac) {
  fs.writeFileSync(path.join(process.cwd(), 'src/app/api/admin/access-tags/route.ts'), content);
  console.log('Fixed: access-tags');
}

// Fix pending routes
['src/app/api/admin/team/members/pending/route.ts',
 'src/app/api/admin/team/members/pending/[id]/approve/route.ts',
 'src/app/api/admin/team/members/pending/[id]/reject/route.ts'].forEach(f => {
  const fullPath = path.join(process.cwd(), f);
  if (!fs.existsSync(fullPath)) return;
  const c = fs.readFileSync(fullPath, 'utf8');
  let n = c.replace(
    /import \{ requirePermissionFast \} from "@\/lib\/auth\/permissions";/,
    'import { requireAuth, requirePermissionFast } from "@/lib/auth/permissions";'
  );
  n = n.replace(
    /import \{ [^}]* \} from "@\/lib\/auth\/permissions";/,
    (m) => {
      if (m.includes('requireAuth')) return m;
      return m.replace(/import \{ ([^}]+) \} from/, (__, imps) => {
        const list = imps.split(',').map(i => i.trim()).filter(i => i);
        if (!list.includes('requireAuth')) list.push('requireAuth');
        return `import { ${list.join(', ')} } from`;
      });
    }
  );
  if (n !== c) {
    fs.writeFileSync(fullPath, n);
    console.log('Fixed:', f);
  }
});

// Fix pricing/seed
const pc = fs.readFileSync(path.join(process.cwd(), 'src/app/api/pricing/seed/route.ts'), 'utf8');
let np = pc.replace(
  /import \{ isAdmin \} from "@\/lib\/auth\/permissions";/,
  'import { isAdmin, requireAuth } from "@/lib/auth/permissions";'
);
if (np !== pc) {
  fs.writeFileSync(path.join(process.cwd(), 'src/app/api/pricing/seed/route.ts'), np);
  console.log('Fixed: pricing/seed');
}

// Fix sessions
const sc = fs.readFileSync(path.join(process.cwd(), 'src/app/api/admin/auth/sessions/route.ts'), 'utf8');
let ns = sc.replace(
  /import \{ handleError \} from "@\/lib\/api\/response";/,
  'import { handleError, ok } from "@/lib/api/response";'
);
if (ns !== sc) {
  fs.writeFileSync(path.join(process.cwd(), 'src/app/api/admin/auth/sessions/route.ts'), ns);
  console.log('Fixed: sessions');
}

// Fix settings/locales/seed
const slc = fs.readFileSync(path.join(process.cwd(), 'src/app/api/admin/settings/locales/seed/route.ts'), 'utf8');
let nsl = slc.replace(
  /import \{ [^}]* \} from "@\/lib\/api\/response";/,
  (m) => {
    if (m.includes('ok')) return m;
    return m.replace(/import \{ ([^}]+) \} from/, (__, imps) => {
      const list = imps.split(',').map(i => i.trim()).filter(i => i);
      if (!list.includes('ok')) list.push('ok');
      return `import { ${list.join(', ')} } from`;
    });
  }
);
if (nsl !== slc) {
  fs.writeFileSync(path.join(process.cwd(), 'src/app/api/admin/settings/locales/seed/route.ts'), nsl);
  console.log('Fixed: settings/locales/seed');
}

// Fix blog-posts
const bc = fs.readFileSync(path.join(process.cwd(), 'src/app/api/blog-posts/route.ts'), 'utf8');
let nb = bc.replace(
  /import \{ handleError \} from "@\/lib\/api\/response";/,
  'import { handleError, ok } from "@/lib/api/response";'
);
if (nb !== bc) {
  fs.writeFileSync(path.join(process.cwd(), 'src/app/api/blog-posts/route.ts'), nb);
  console.log('Fixed: blog-posts');
}

// Fix customer-points: updated → NextResponse.json
const cc = fs.readFileSync(path.join(process.cwd(), 'src/app/api/admin/customer-points/route.ts'), 'utf8');
let ncc = cc.replace(/return updated\(\{/g, 'return NextResponse.json({');
if (ncc !== cc) {
  fs.writeFileSync(path.join(process.cwd(), 'src/app/api/admin/customer-points/route.ts'), ncc);
  console.log('Fixed: customer-points');
}

// Fix pending approve/reject: updated → NextResponse.json
['src/app/api/admin/team/members/pending/[id]/approve/route.ts',
 'src/app/api/admin/team/members/pending/[id]/reject/route.ts'].forEach(f => {
  const fullPath = path.join(process.cwd(), f);
  if (!fs.existsSync(fullPath)) return;
  let c = fs.readFileSync(fullPath, 'utf8');
  let n = c.replace(/return updated\(\{/g, 'return NextResponse.json({');
  if (n !== c) {
    fs.writeFileSync(fullPath, n);
    console.log('Fixed updated:', f);
  }
});

console.log('\nDone.');
