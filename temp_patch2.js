var fs = require('fs');
var content = fs.readFileSync('D:/LOOP_COMPANY/LOOP/src/app/api/academy/lessons/[id]/complete/route.ts', 'utf8');

// Show lines around the broken section
var lines = content.split('\n');
for(var i=193; i<=219; i++) {
 console.log((i+1)+': ['+lines[i]+']');
}
