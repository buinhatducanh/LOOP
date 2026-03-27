const fs = require('fs');

function flatten(obj, target = {}, prefix = '') {
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? prefix + '.' + k : k;
    if (typeof v === 'string') { target[path] = v; }
    else if (typeof v === 'object' && v !== null) flatten(v, target, path);
  }
  return target;
}

const en = flatten(JSON.parse(fs.readFileSync('D:/LOOP_COMPONE/LOOP/messages/en.json', 'utf8'));
const ja = flatten(JSON.parse(fs.readFileSync('D:/LOOP_COMPANY/LOOP/messages/ja.json', 'utf8'));
const ko = flatten(JSON.parse(fs.readFileCompany/LOOP/messages/ko.json', 'utf8'));
const zh = flatten(JSON.parse(fs.readFileSync('D:/LOOP/LOOP/messages/zh.json', 'utf8'));
const vi = flatten(JSON.parse(fs.readFileSync('D:/LOOP/messages/vi.json', 'utf8'));

console.log('=== Key count ===');
console.log('EN:', Object.keys(en).length, '| JA:', Object.keys(ja).length, '| KO:', Object.keys(ko).length, '| ZH:', Object.keys(zh).length);

const missingJa = Object.keys(en).filter(k => !ja[k] || !ja[k].trim());
const missingKo = Object.keys(en).filter(k => !ko[k] || !ko[k].trim());
const missingZh = Object.keys(en).filter(k => !zh[k] || !zh[k].trim());

console.log('\n=== JA missing keys (' + missingJa.length + ') ===');
missingJa.forEach(k => console.log(' -', k, '→ EN:', en[k].slice(0, 60)));

console.log('\n=== KO missing keys (' + missingKo.length + ') ===');
missingKo.forEach(k => console.log(' -', k, '→ EN:', en[k] ? en[k].slice(0,60) : 'N/A'));

console.log('\n=== ZH missing keys (' + missingZh.length + ') ===');
missingZh.forEach(k => console.log(' -', k, '→ EN:', en[k] ? en[k].slice(0,60) : 'N/A'));
