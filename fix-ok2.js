const fs = require('fs');
const path = require('path');

// Fix ok import in all files listed in ok_files.txt
const okContent = fs.readFileSync('ok_files.txt', 'utf8');
const okFiles = okContent.split('\n').filter(f => f.trim());

let fixed = 0;
okFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (!fs.existsSync(fullPath)) return;
  const content = fs.readFileSync(fullPath, 'utf8');
  if (!content.includes('ok(')) return;

  // Already has ok from @/lib/api?
  if (content.includes('from "@/lib/api/response"') && !content.match(/\{[^}]*\bok[,}]/)) {
    let newContent = content.replace(
      /import \{ ([^}]+) \} from "@\/lib\/api\/response"/,
      (match, imports) => {
        const impList = imports.split(',').map(i => i.trim()).filter(i => i);
        if (!impList.includes('ok')) impList.push('ok');
        return `import { ${impList.join(', ')} } from "@/lib/api/response"`;
      }
    );
    if (newContent !== content) {
      fs.writeFileSync(fullPath, newContent);
      console.log('Fixed ok:', file);
      fixed++;
    }
  }
});

console.log('\nFixed ok:', fixed);
