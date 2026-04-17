const fs = require('fs');
let content = fs.readFileSync('src/app/admin/pricing/page.tsx', 'utf-8');

// 1. Add import for AcknowledgmentsTab
const importLine = 'import { AcknowledgmentsTab } from "./acknowledgments/AcknowledgmentsTab";';
if (content.indexOf(importLine) === -1) {
 // Insert before the first import line
 const idx = content.indexOf("import { useState }");
 const lines = content.split('\n');
 const lineIdx = lines.findIndex(l => l.includes("import { useState }"));
 if (lineIdx !== -1) {
 lines.splice(lineIdx, 0, importLine);
 content = lines.join('\n');
 console.log('Added import');
 }
}

// 2. Add to TABS array
const oldTabEntry = "{ key: \"domain-prices\", label: \"Tên miền\", icon: <Globe size={14} /> },";
const newTabEntry = "{ key: \"domain-prices\", label: \"Tên miền\", icon: <Globe size={14} /> },\n { key: \"acknowledgments\", label: \"Acknowledgments\", icon: <CheckSquare size={14} /> },";
if (content.indexOf(oldTabEntry) !== -1 && content.indexOf('"acknowledgments"') === -1) {
 content = content.replace(oldTabEntry, newTabEntry);
 console.log('Added acknowledgments tab');
}

// 3. Add render condition
const oldRender = '{tab === "domain-prices" && <DomainPricesTab />}';
const newRender = '{tab === "domain-prices" && <DomainPricesTab />}\n {tab === "acknowledgments" && <AcknowledgmentsTab />}';
if (content.indexOf(oldRender) !== -1 && content.indexOf('AcknowledgmentsTab />') === -1) {
 content = content.replace(oldRender, newRender);
 console.log('Added render condition');
}

fs.writeFileSync('src/app/admin/pricing/page.tsx', content);
console.log('Done');
