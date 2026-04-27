
import fs from 'fs';
import path from 'path';

const viMessagesPath = 'd:/WEB/LOOP/src/i18n/messages/vi.json';
const viMessages = JSON.parse(fs.readFileSync(viMessagesPath, 'utf8'));
const seoKeys = Object.keys(viMessages.seo || {});

const baseDir = 'd:/WEB/LOOP/src/app/[locale]';

function findPageFiles(dir: string, fileList: string[] = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            findPageFiles(filePath, fileList);
        } else if (file === 'page.tsx') {
            fileList.push(filePath);
        }
    });
    return fileList;
}

const pageFiles = findPageFiles(baseDir);

pageFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const metadataMatch = content.match(/export async function generateMetadata[\s\S]*?return \{([\s\S]*?)\}/);
    if (metadataMatch) {
        const metadataBlock = metadataMatch[0];
        const tVarMatch = metadataBlock.match(/(?:const|let)\s+(\w+)\s*=\s*await\s+getTranslations\("seo"\)/);
        if (tVarMatch) {
            const tVar = tVarMatch[1];
            const keyMatches = metadataBlock.matchAll(new RegExp(`${tVar}\\("(\\w+)"\\)`, 'g'));
            for (const match of keyMatches) {
                const key = match[1];
                if (!seoKeys.includes(key)) {
                    console.log(`[MISSING SEO KEY] File: ${file} -> Key: ${key}`);
                }
            }
        }
    }
});
