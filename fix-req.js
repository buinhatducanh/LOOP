const fs = require('fs');
const path = require('path');

// Read files from /tmp/req_files.txt
const content = fs.readFileSync('req_files.txt', 'utf8');
const files = content.split('\n').filter(f => f.trim());

let fixed = 0;
let skipped = 0;

files.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (!fs.existsSync(fullPath)) return;

  const c = fs.readFileSync(fullPath, 'utf8');
  if (!c.includes('_req: NextRequest')) return;

  // Replace _req: NextRequest → req: NextRequest
  const n = c.replace(/_req: NextRequest/g, 'req: NextRequest');
  if (n !== c) {
    fs.writeFileSync(fullPath, n);
    console.log('Fixed:', file);
    fixed++;
  } else {
    skipped++;
  }
});

console.log('\nDone. Fixed:', fixed, '| Skipped:', skipped);
