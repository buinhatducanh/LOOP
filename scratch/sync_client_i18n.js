const fs = require('fs');
const path = require('path');

const vi = JSON.parse(fs.readFileSync('src/i18n/messages/vi.json', 'utf8'));
const files = ['en.json', 'ja.json', 'ko.json', 'zh.json'];

files.forEach(f => {
    const p = path.join('src/i18n/messages', f);
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    
    // Sync MediaPage keys
    if (!data.MediaPage) data.MediaPage = {};
    
    const missingKeys = Object.keys(vi.MediaPage).filter(k => !data.MediaPage[k]);
    if (missingKeys.length > 0) {
        console.log(`Adding missing MediaPage keys to ${f}: ${missingKeys.join(', ')}`);
        missingKeys.forEach(k => {
            data.MediaPage[k] = vi.MediaPage[k];
        });
        fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
    } else {
        console.log(`No missing MediaPage keys in ${f}`);
    }
});
