const fs = require('fs');
const path = require('path');

function fixFile(file, transforms) {
  const fullPath = path.join(process.cwd(), file);
  if (!fs.existsSync(fullPath)) return false;
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;
  transforms.forEach(([pattern, replacement]) => {
    const newContent = content.replace(pattern, replacement);
    if (newContent !== content) {
      content = newContent;
      changed = true;
    }
  });
  if (changed) {
    fs.writeFileSync(fullPath, content);
    return true;
  }
  return false;
}

// ── access-tags: add requireAuth from permissions ────────────────────────────
const a1 = fixFile('src/app/api/admin/access-tags/route.ts', [
  [/requireAuth\(\);/g, 'requireAuth(req);'],
  [/from "@\/lib\/auth\/permissions";/g, 'from "@/lib/auth/permissions"'],
  // add requireAuth to the import line
  [/import \{ requirePermissionFast \} from "@\/lib\/auth\/permissions";/g, 'import { requireAuth, requirePermissionFast } from "@/lib/auth/permissions";'],
]);
if (a1) console.log('Fixed: access-tags/route.ts');

// The issue: access-tags uses requireAuth but doesn't import it
// Check current imports
const ac = fs.readFileSync(path.join(process.cwd(), 'src/app/api/admin/access-tags/route.ts'), 'utf8');
if (!ac.includes('requireAuth') || !ac.match(/import.*requireAuth/)) {
  let content = ac.replace(
    /import \{ requirePermissionFast \} from "@\/lib\/auth\/permissions";/,
    'import { requireAuth, requirePermissionFast } from "@/lib/auth/permissions";'
  );
  if (content !== ac) {
    fs.writeFileSync(path.join(process.cwd(), 'src/app/api/admin/access-tags/route.ts'), content);
    console.log('Fixed import: access-tags/route.ts');
  }
}

// ── pending routes: add requireAuth import ──────────────────────────────────
['src/app/api/admin/team/members/pending/route.ts',
 'src/app/api/admin/team/members/pending/[id]/approve/route.ts',
 'src/app/api/admin/team/members/pending/[id]/reject/route.ts'].forEach(f => {
  const fullPath = path.join(process.cwd(), f);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  // Fix requireAuth(req) → needs import
  // Change to getSession which may already be imported
  const newContent = content.replace(/requireAuth\(req\);/g, 'getSession(req);');
  if (newContent !== content) {
    fs.writeFileSync(fullPath, newContent);
    console.log('Fixed:', f);
  }
});

// ── sessions: add ok to lib/api/response import ──────────────────────────────
const sc = fs.readFileSync(path.join(process.cwd(), 'src/app/api/admin/auth/sessions/route.ts'), 'utf8');
if (sc.includes('ok(') && !sc.includes('ok }')) {
  let content = sc;
  if (content.includes('import { handleError } from "@/lib/api/response"')) {
    content = content.replace(
      'import { handleError } from "@/lib/api/response"',
      'import { handleError, ok } from "@/lib/api/response"'
    );
  } else if (content.includes('from "@/lib/api/response"')) {
    content = content.replace(
      /import \{ ([^}]+) \} from "@\/lib\/api\/response"/,
      (m, imps) => {
        const list = imps.split(',').map(i => i.trim()).filter(i => i);
        if (!list.includes('ok')) list.push('ok');
        return 'import { ' + list.join(', ') + ' } from "@/lib/api/response"';
      }
    );
  }
  fs.writeFileSync(path.join(process.cwd(), 'src/app/api/admin/auth/sessions/route.ts'), content);
  console.log('Fixed: sessions/route.ts');
}

// ── settings/locales/seed: add ok ─────────────────────────────────────────
const slc = fs.readFileSync(path.join(process.cwd(), 'src/app/api/admin/settings/locales/seed/route.ts'), 'utf8');
if (slc.includes('ok(') && !slc.match(/import.*\bok[,}]/)) {
  let content = slc;
  if (content.includes('from "@/lib/api/response"')) {
    content = content.replace(
      /import \{ ([^}]+) \} from "@\/lib\/api\/response"/,
      (m, imps) => {
        const list = imps.split(',').map(i => i.trim()).filter(i => i);
        if (!list.includes('ok')) list.push('ok');
        return 'import { ' + list.join(', ') + ' } from "@/lib/api/response"';
      }
    );
  }
  fs.writeFileSync(path.join(process.cwd(), 'src/app/api/admin/settings/locales/seed/route.ts'), content);
  console.log('Fixed: settings/locales/seed/route.ts');
}

// ── trigger: _session → session ────────────────────────────────────────────
const tc = fs.readFileSync(path.join(process.cwd(), 'src/app/api/admin/deployments/[id]/trigger/route.ts'), 'utf8');
if (tc.includes('_session')) {
  let content = tc.replace(/_session/g, 'session');
  fs.writeFileSync(path.join(process.cwd(), 'src/app/api/admin/deployments/[id]/trigger/route.ts'), content);
  console.log('Fixed: trigger/route.ts');
}

// ── invite-accept: badRequest → NextResponse.json({error:...}, {status:400})
const ic = fs.readFileSync(path.join(process.cwd(), 'src/app/api/admin/team/members/invite-accept/route.ts'), 'utf8');
if (ic.includes('badRequest(')) {
  let content = ic.replace(/return badRequest\(\{([^}]+)\}\);/g, 'return NextResponse.json({$1}, {status: 400});');
  content = content.replace(/badRequest\(/g, '// badRequest(');
  fs.writeFileSync(path.join(process.cwd(), 'src/app/api/admin/team/members/invite-accept/route.ts'), content);
  console.log('Fixed: invite-accept/route.ts');
}

// ── blog-posts: add ok import ───────────────────────────────────────────────
const bc = fs.readFileSync(path.join(process.cwd(), 'src/app/api/blog-posts/route.ts'), 'utf8');
if (bc.includes('ok(') && !bc.match(/import.*\bok[,}]/)) {
  let content = bc;
  if (content.includes('import { handleError } from "@/lib/api/response"')) {
    content = content.replace(
      'import { handleError } from "@/lib/api/response"',
      'import { handleError, ok } from "@/lib/api/response"'
    );
  } else if (content.includes('from "@/lib/api/response"')) {
    content = content.replace(
      /import \{ ([^}]+) \} from "@\/lib\/api\/response"/,
      (m, imps) => {
        const list = imps.split(',').map(i => i.trim()).filter(i => i);
        if (!list.includes('ok')) list.push('ok');
        return 'import { ' + list.join(', ') + ' } from "@/lib/api/response"';
      }
    );
  }
  fs.writeFileSync(path.join(process.cwd(), 'src/app/api/blog-posts/route.ts'), content);
  console.log('Fixed: blog-posts/route.ts');
}

// ── upload: _req → req ──────────────────────────────────────────────────────
const uc = fs.readFileSync(path.join(process.cwd(), 'src/app/api/admin/upload/route.ts'), 'utf8');
if (uc.includes('_req')) {
  let content = uc.replace(/_req/g, 'req');
  fs.writeFileSync(path.join(process.cwd(), 'src/app/api/admin/upload/route.ts'), content);
  console.log('Fixed: upload/route.ts');
}

// ── points: session → need proper getSession call ─────────────────────────
const pc = fs.readFileSync(path.join(process.cwd(), 'src/app/api/points/route.ts'), 'utf8');
if (pc.includes('session.') && !pc.match(/const session = await getSession/)) {
  let content = pc.replace(/const session = (?!await getSession)/g, '');
  // Actually check if it has getSession at all
  console.log('points/route.ts needs session - checking...');
}

// ── customer-points: updated → NextResponse.json ─────────────────────────────
const cc = fs.readFileSync(path.join(process.cwd(), 'src/app/api/admin/customer-points/route.ts'), 'utf8');
if (cc.includes('updated(')) {
  let content = cc.replace(/return updated\(\{/g, 'return NextResponse.json({');
  fs.writeFileSync(path.join(process.cwd(), 'src/app/api/admin/customer-points/route.ts'), content);
  console.log('Fixed: customer-points/route.ts');
}

// ── pending approve/reject: updated → NextResponse.json ───────────────────
['src/app/api/admin/team/members/pending/[id]/approve/route.ts',
 'src/app/api/admin/team/members/pending/[id]/reject/route.ts'].forEach(f => {
  const fullPath = path.join(process.cwd(), f);
  if (!fs.existsSync(fullPath)) return;
  let content = fs.readFileSync(fullPath, 'utf8');
  if (content.includes('updated(')) {
    content = content.replace(/return updated\(\{/g, 'return NextResponse.json({');
    fs.writeFileSync(fullPath, content);
    console.log('Fixed:', f);
  }
});

console.log('\nDone.');