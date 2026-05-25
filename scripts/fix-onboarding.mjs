import { readFileSync, writeFileSync } from 'fs';
let content = readFileSync('src/components/landing/OnboardingClient.tsx', 'utf8');

// Fix hexRgba to handle CSS vars
const old = `function hexRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return \`rgba(\${r}, \${g}, \${b}, \${alpha})\`;
}`;

const newFn = `function hexRgba(hex: string, alpha: number): string {
  if (hex.startsWith("var(")) return \`color-mix(in srgb, \${hex}, transparent \${Math.round((1 - alpha) * 100)}%)\`;
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return \`rgba(\${r}, \${g}, \${b}, \${alpha})\`;
}`;

if (content.includes(old)) {
  content = content.replace(old, newFn);
  console.log('Replaced hexRgba!');
} else {
  const idx = content.indexOf('function hexRgba');
  console.log('hexRgba at:', idx);
  if (idx >= 0) {
    const chunk = content.slice(idx, idx + 300);
    console.log(JSON.stringify(chunk));
  }
}

// Replace StarField with SunnyBurst
const starFieldOld = `function StarField() {
  const stars = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    x: (i * 13) % 100,
    y: (i * 17) % 100,
    size: (i % 4) + 0.5,
    delay: (i % 10) * 0.3,
    opacity: 0.3 + (i % 5) * 0.12,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((s) => (
        <motion.div
          key={s.id}
          className="absolute rounded-full"
          style={{ left: \`\${s.x}%\`, top: \`\${s.y}%\`, width: s.size, height: s.size, background: "#FFF" }}
          animate={{ opacity: [s.opacity, s.opacity * 0.25, s.opacity] }}
          transition={{ duration: 2.5 + (s.id % 4), repeat: Infinity, delay: s.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}`;

const sunnyBurst = `function SunnyBurst() {
  // Warm floating particles for light/sunny mode
  const particles = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: (i * 17) % 100,
    y: (i * 23) % 100,
    size: (i % 5) + 1,
    delay: (i % 8) * 0.4,
    opacity: 0.2 + (i % 4) * 0.1,
  }));
  const colors = ["var(--ds-gold, #E6C75F)", "var(--ds-pink, #EC4899)", "var(--ds-cosmic-purple, #6B3DF5)", "var(--ds-teal, #6EB1A8)"];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{ left: \`\${p.x}%\`, top: \`\${p.y}%\`, width: p.size, height: p.size, background: colors[p.id % colors.length] }}
          animate={{ opacity: [p.opacity, p.opacity * 0.3, p.opacity], y: [-2, 2, -2] }}
          transition={{ duration: 3 + (p.id % 4), repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}`;

if (content.includes('function StarField() {')) {
  content = content.replace(starFieldOld, sunnyBurst);
  console.log('Replaced StarField with SunnyBurst!');
} else {
  console.log('StarField pattern not found');
}

// Replace references to StarField with SunnyBurst
content = content.replace(/<StarField\s*\/>/g, '<SunnyBurst />');
content = content.replace(/<StarField\s*\/>/g, '<SunnyBurst />');
console.log('All StarField → SunnyBurst done');

writeFileSync('src/components/landing/OnboardingClient.tsx', content);
console.log('Done!');
