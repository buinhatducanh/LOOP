#!/usr/bin/env npx tsx
/**
 * Scale Gate CI Runner
 * Invoked by .github/workflows/ci.yml → be-scale-gate job.
 * Passes mode: "ci" to enforce blocking gates.
 */
import { runScaleGates, KNOWN_P0_ENDPOINTS } from "../src/lib/scaleGate";

const result = runScaleGates(KNOWN_P0_ENDPOINTS, { mode: "ci" });

console.log(
  `Scale gates: ${result.passed ? "PASSED" : "BLOCKED"} | Errors: ${result.errors.length} | Warnings: ${result.warnings.length}`
);

for (const w of result.warnings) {
  console.warn(`[WARN] ${w.rule} ${w.location}: ${w.message}`);
}
for (const e of result.errors) {
  console.error(`[ERR] ${e.rule} ${e.location}: ${e.message}`);
}

if (!result.passed) {
  console.error("Scale gates blocked release.");
  process.exit(1);
}
