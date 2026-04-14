const fs = require('fs');
const content = fs.readFileSync('prisma/schema.prisma', 'utf8');
const lines = content.split('\n');
for (let i = 440; i < 455; i++) {
 const l = lines[i];
 const bytes = [];
 for (let j = 0; j < Math.min(30, l.length); j++) {
 bytes.push(l.charCodeAt(j).toString(16).padStart(2, '0'));
 }
 console.log(i+1, bytes.join(' '), '|', l);
}
