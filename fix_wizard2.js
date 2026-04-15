const fs = require('fs');
const path = 'D:/LOOP_COMPANY/LOOP/src/components/landing/BookingWizardClient.tsx';
let content = fs.readFileSync(path, 'utf8');

// Step 1: Add useRef
content = content.replace(
 'import { useState, useEffect } from "react";',
 'import { useState, useEffect, useRef } from "react";'
);
console.log('Step 1: useRef added');

// Step 2: Find key positions
const fetchMarker = 'fetch(`/api/pricing/config';
const fetchIdx = content.indexOf(fetchMarker);
const useEffectStart = content.lastIndexOf('useEffect(() => {', fetchIdx);
const depsClosing = '}, [locale, email]);';
const depsIdx = content.indexOf(depsClosing, fetchIdx);
const useEffectEnd = depsIdx + depsClosing.length;

console.log('fetch at:', fetchIdx);
console.log('useEffect start:', useEffectStart);
console.log('useEffect end:', useEffectEnd);
console.log('deps at:', depsIdx);

// Old block should be from useEffectStart to useEffectEnd
const oldBlock = content.substring(useEffectStart, useEffectEnd);
console.log('Old block length:', oldBlock.length);

// Build spaces
const S1 = Array(2).join(' '); // 1 space
const S2 = Array(3).join(' '); // 2 spaces
const S3 = Array(5).join(' '); // 4 spaces

// Find useEffect line (just the first line)
const useEffectLineEnd = content.indexOf('\n', useEffectStart) + 1;
const useEffectLine = content.substring(useEffectStart, useEffectLineEnd);
console.log('useEffect line:', JSON.stringify(useEffectLine));

// Find let cancelled line
const cancelMarker = 'let cancelled = false;';
const cancelIdx = content.indexOf(cancelMarker, fetchIdx);
const cancelLineEnd = content.indexOf('\n', cancelIdx) + 1;
const cancelLine = content.substring(cancelIdx, cancelLineEnd);
console.log('cancel line:', JSON.stringify(cancelLine));

// Find return line
const returnMarker = 'return () => { cancelled = true; };';
const returnIdx = content.indexOf(returnMarker, fetchIdx);
console.log('return at:', returnIdx);

// Build new block
// ref + blank + useEffect + cancelled + debounce + fetch to end of depsClosing
const newBlock =
 S2 + 'const emailTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);' + '\n' +
 '\n' +
 useEffectLine +
 cancelLine +
 S3 + 'if (emailTimeout.current) clearTimeout(emailTimeout.current);' + '\n' +
 S3 + 'emailTimeout.current = setTimeout(() => {' + '\n' +
 content.substring(fetchIdx, depsIdx) + // from fetch to just before deps closing (inclusive of closing \n)
 S2 + '}, 500);' + '\n' +
 S2 + '});' + '\n' +
 depsClosing;

console.log('New block length:', newBlock.length);
console.log('Old block length:', oldBlock.length);

// Replace
const newContent = content.substring(0, useEffectStart) + newBlock + content.substring(useEffectEnd);
fs.writeFileSync(path, newContent);
console.log('File written');

// Verify
const lines = newContent.split('\n');
let count = 0;
for (let i = 0; i < lines.length; i++) {
 const l = lines[i];
 if (l.includes('emailTimeout') || l.includes('}, 500')) {
 count++;
 const leading = l.length - l.trimStart().length;
 console.log('L' + (i+1) + '(' + leading + '): ' + l.substring(0, 60));
 }
}
console.log('Found', count, 'debounce lines');
console.log('Total lines:', lines.length);
console.log('Done!');
