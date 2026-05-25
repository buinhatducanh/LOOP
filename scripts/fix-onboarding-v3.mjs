import { readFileSync, writeFileSync } from 'fs';
let content = readFileSync('src/components/landing/OnboardingClient.tsx', 'utf8');

// Replace StarField function by finding its start and end
const sfStart = content.indexOf('function StarField() {');
if (sfStart >= 0) {
  // Find the closing } of this function
  let bc = 0, end = -1;
  for (let i = sfStart; i < content.length; i++) {
    if (content[i] === '{') bc++;
    if (content[i] === '}') { bc--; if (bc === 0) { end = i + 1; break; } }
  }
  if (end >= 0) {
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
    content = content.slice(0, sfStart) + sunnyBurst + content.slice(end);
    console.log('StarField replaced with SunnyBurst! (start:', sfStart, 'end:', end, ')');
  }
}

// Replace all StarField usages with SunnyBurst
content = content.split('<StarField />').join('<SunnyBurst />');
console.log('All StarField usages replaced');

// Verify
const sfCount = (content.match(/StarField/g) || []).length;
console.log('StarField remaining:', sfCount);
const sbCount = (content.match(/SunnyBurst/g) || []).length;
console.log('SunnyBurst occurrences:', sbCount);

writeFileSync('src/components/landing/OnboardingClient.tsx', content);
console.log('Done!');
