import { readFileSync, writeFileSync } from 'fs';
let content = readFileSync('src/components/landing/OnboardingClient.tsx', 'utf8');

// Find and replace hexRgba
const idx = content.indexOf('function hexRgba');
const start = idx;
// Find the closing } of the function (after the return statement)
let braceCount = 0;
let inFn = false;
let end = start;
for (let i = start; i < content.length; i++) {
  const c = content[i];
  if (c === '{') { braceCount++; inFn = true; }
  if (c === '}') {
    braceCount--;
    if (inFn && braceCount === 0) { end = i + 1; break; }
  }
}
console.log('hexRgba fn from', start, 'to', end);
const old = content.slice(start, end);
console.log('Old:', JSON.stringify(old));

// New function
const newFn = `function hexRgba(hex: string, alpha: number): string {
  if (hex.startsWith("var(")) return "color-mix(in srgb, " + hex + ", transparent " + Math.round((1 - alpha) * 100) + "%)";
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
}`;

content = content.replace(old, newFn);
writeFileSync('src/components/landing/OnboardingClient.tsx', content);
console.log('Done!');
