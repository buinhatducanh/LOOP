const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Fix pattern 1: "const _session = await requireAuth()" → "const session = await requireAuth()"
const files = glob.sync('src/app/api/**/*.ts');
let fixed1 = 0;

files.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  const content = fs.readFileSync(fullPath, 'utf8');
  // Match: const _session = await requireAuth()
  // But NOT: const _session = await withRetry(...requireAuth...
  if (/const _session = await requireAuth\(\)/.test(content)) {
    const newContent = content.replace(
      /const _session = await requireAuth\(\)/g,
      'const session = await requireAuth()'
    );
    fs.writeFileSync(fullPath, newContent);
    console.log('Fixed session:', file);
    fixed1++;
  }
});

console.log('\nPattern 1 (session) fixed:', fixed1);

// Fix pattern 2: "const _session = await withRetry(() => requireAuth("
files.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  const content = fs.readFileSync(fullPath, 'utf8');
  if (/const _session = await withRetry\(\(\() => )?requireAuth/.test(content)) {
    const newContent = content.replace(
      /const _session = await withRetry\((\() => )?requireAuth/g,
      'const session = await withRetry($1requireAuth'
    );
    fs.writeFileSync(fullPath, newContent);
    console.log('Fixed withRetry session:', file);
  }
});

// Fix pattern 3: "req: NextRequest" → "req: Request" (wrong type annotations)
// This is trickier - only fix if the file actually uses req as Request
// Skip for now, focus on the critical session/ok/req issues