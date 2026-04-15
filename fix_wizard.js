const fs = require('fs');
const path = 'D:/LOOP_COMPANY/LOOP/src/components/landing/BookingWizardClient.tsx';
let content = fs.readFileSync(path, 'utf8');

// Step 1: Add useRef
content = content.replace(
 'import { useState, useEffect } from "react";',
 'import { useState, useEffect, useRef } from "react";'
);
console.log('Step 1: Added useRef');

// Step 2: Find and replace the useEffect block for pricing/config
// Target: the useEffect that contains 'fetch(`/api/pricing/config'
const fetchMarker = 'fetch(`/api/pricing/config?lang=${locale}${email ? `&email=${encodeURIComponent(email)}` : ""}`)';
const fetchIdx = content.indexOf(fetchMarker);
console.log('fetchMarker at:', fetchIdx);

if (fetchIdx < 0) { console.error('ERROR'); process.exit(1); }

// Find start of this useEffect (going backwards from fetch)
const searchBack = ' useEffect(() => {';
let useEffectStart = content.lastIndexOf(searchBack, fetchIdx);
console.log('useEffect at:', useEffectStart);

// Find end: '}, [locale, email]);'
const depsMarker = '}, [locale, email]);';
let useEffectEnd = content.indexOf(depsMarker, fetchIdx) + depsMarker.length;
console.log('useEffect end at:', useEffectEnd);

const oldBlock = content.substring(useEffectStart, useEffectEnd);
console.log('Old block length:', oldBlock.length);

// Now build new block with correct indentation
// Current old block structure:
// ' useEffect(() => {\n' (2 spaces)
// ' let cancelled = false;\n' (4 spaces)
// ...body...
// ' return () => { cancelled = true; };\n' (4 spaces)
// ' }, [locale, email]);' (2 spaces)

// New structure:
// ' const emailTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);\n' (2 spaces)
// '\n' (blank)
// ' useEffect(() => {\n' (2 spaces)
// ' let cancelled = false;\n' (4 spaces)
// ' if (emailTimeout.current) clearTimeout(emailTimeout.current);\n' (4 spaces)
// ' emailTimeout.current = setTimeout(() => {\n' (4 spaces)
// ...body (same)...
// ' return () => { cancelled = true; };\n' (4 spaces)
// ' }, 500);\n' (4 spaces)
// ' });\n' (4 spaces)
// ' }, [locale, email]);' (2 spaces)

// Build using character arrays for precise spacing
const SP = ' '; // single space
const SP2 = ' '; // double space
const SP4 = ' '; // 4 spaces

const newBlock = [
 SP2 + 'const emailTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);',
 '',
 SP2 + 'useEffect(() => {',
 SP4 + 'let cancelled = false;',
 SP4 + 'if (emailTimeout.current) clearTimeout(emailTimeout.current);',
 SP4 + 'emailTimeout.current = setTimeout(() => {',
].join('\n') + '\n' + oldBlock.substring(oldBlock.indexOf('fetch')) + [
 SP4 + 'return () => { cancelled = true; };',
 SP4 + '}, 500);',
 SP4 + '});',
 SP2 + '}, [locale, email]);',
].join('\n');

console.log('New block length:', newBlock.length);

// Verify new block starts correctly
console.log('New block preview:', JSON.stringify(newBlock.substring(0, 100)));

if (content.includes(oldBlock)) {
 content = content.replace(oldBlock, newBlock);
 console.log('Step 2: Replaced useEffect block');
} else {
 console.error('ERROR: Could not find old block');
 process.exit(1);
}

fs.writeFileSync(path, content);
console.log('File written');

// Verify
const newContent = fs.readFileSync(path, 'utf8');
const lines = newContent.split('\n');
let count = 0;
for (let i = 0; i < lines.length; i++) {
 const l = lines[i];
 if (l.includes('emailTimeout') || l.includes('}, 500') || l.includes('clearTimeout')) {
 count++;
 const leading = l.length - l.trimStart().length;
 console.log('L' + (i+1) + '(' + leading + '):', l.substring(0, 60));
 }
}
console.log('Found', count, 'debounce lines');
console.log('Done!');
