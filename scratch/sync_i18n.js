const fs = require('fs');
const path = require('path');

const vi = JSON.parse(fs.readFileSync('src/i18n/admin/messages/vi.json', 'utf8'));
const files = ['ja.json', 'ko.json', 'zh.json'];

files.forEach(f => {
    const p = path.join('src/i18n/admin/messages', f);
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    
    // Sync quotation keys
    // We want to keep existing translations but add missing keys from vi
    // Or just overwrite with vi keys if they are status codes (often better than breaking build)
    
    const missingKeys = Object.keys(vi.quotation).filter(k => !data.quotation[k]);
    if (missingKeys.length > 0) {
        console.log(`Adding missing keys to ${f}: ${missingKeys.join(', ')}`);
        missingKeys.forEach(k => {
            data.quotation[k] = vi.quotation[k];
        });
        fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
    } else {
        console.log(`No missing keys in ${f}`);
    }
});
