const fs = require('fs');
const content = fs.readFileSync('d:/WEB/LOOP/src/components/landing/BookingWizardClient.tsx', 'utf8');

let curly = 0;
let round = 0;
let inString = null;
let inTemplate = false;
let inComment = null; // 'line' or 'block'

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  const next = content[i+1];
  
  if (inComment === 'line') {
    if (char === '\n') inComment = null;
    continue;
  }
  if (inComment === 'block') {
    if (char === '*' && next === '/') {
        inComment = null;
        i++;
    }
    continue;
  }
  
  if (inString) {
    if (char === inString && content[i-1] !== '\\') inString = null;
    continue;
  }
  
  if (inTemplate) {
    if (char === '`' && content[i-1] !== '\\') {
        inTemplate = false;
    }
    continue;
  }

  if (char === '/' && next === '/') {
    inComment = 'line';
    i++;
    continue;
  }
  if (char === '/' && next === '*') {
    inComment = 'block';
    i++;
    continue;
  }

  if (char === '"' || char === "'") {
    inString = char;
    continue;
  }
  
  if (char === '`') {
    inTemplate = true;
    continue;
  }

  if (char === '{') curly++;
  if (char === '}') curly--;
  if (char === '(') round++;
  if (char === ')') round--;
}

console.log(`Curly: ${curly}`);
console.log(`Round: ${round}`);
