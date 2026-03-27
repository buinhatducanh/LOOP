const fs = require('fs');

function flatten(obj, out = {}, prefix = '') {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out[key] = v;
    else if (v && typeof v === 'object') flatten(v, out, key);
  }
  return out;
}

const base = 'D:/LOOP_COMPANY/LOOP/messages';
const en = flatten(JSON.parse(fs.readFileSync(`${base}/en.json`, 'utf8')));
const ja = flatten(JSON.parse(fs.readFileSync(`${base}/ja.json`, 'utf8')));
const ko = flatten(JSON.parse(fs.readFileSync(`${base}/ko.json`, 'utf8')));
const zh = flatten(JSON.parse(fs.readFileSync(`${base}/zh.json`, 'utf8')));

const keys = Object.keys(en);
function missing(locale) {
  return keys.filter((k) => !locale[k] || !locale[k].trim());
}

const missingJa = missing(ja);
const missingKo = missing(ko);
const missingZh = missing(zh);

console.log(`EN keys: ${keys.length}`);
console.log(`JA missing: ${missingJa.length}`);
missingJa.forEach((k) => console.log(` - ${k} => EN: ${en[k]}`));
console.log(`KO missing: ${missingKo.length}`);
missingKo.forEach((k) => console.log(` - ${k} => EN: ${en[k]}`));
console.log(`ZH missing: ${missingZh.length}`);
missingZh.forEach((k) => console.log(` - ${k} => EN: ${en[k]}`));
