/**
 * i18n Missing Key Checker — LOOP Solutions
 *
 * Utility to verify translation coverage across locales.
 * Run with: npx tsx src/i18n/missing-keys.ts
 *
 * This is a dev-only script, not bundled into the app.
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// ─── Types ────────────────────────────────────────────────────────────────────

type MessageTree = {
  [key: string]: string | MessageTree;
};

type MissingKeysReport = {
  locale: string;
  missingCount: number;
  missingKeys: string[];
};

// ─── Flatten nested message object to dot-notation keys ───────────────────────

function flattenMessages(
  obj: MessageTree,
  prefix = ""
): Map<string, string> {
  const result = new Map<string, string>();

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      const nested = flattenMessages(value as MessageTree, fullKey);
      for (const [nKey, nVal] of nested) {
        result.set(nKey, nVal);
      }
    } else {
      result.set(fullKey, value as string);
    }
  }

  return result;
}

// ─── Find missing keys compared to reference locale ─────────────────────────────

function findMissingKeys(
  source: Map<string, string>,
  target: Map<string, string>,
  sourceLocale: string,
  targetLocale: string
): string[] {
  const missing: string[] = [];

  for (const key of source.keys()) {
    if (!target.has(key)) {
      missing.push(key);
    }
  }

  return missing.sort();
}

// ─── Check placeholder consistency ─────────────────────────────────────────────

function checkPlaceholders(
  source: Map<string, string>,
  target: Map<string, string>
): Array<{ key: string; source: string; target: string }> {
  const mismatches: Array<{ key: string; source: string; target: string }> = [];

  // Match {variable} or {variable:format} patterns
  const placeholderRegex = /\{(\w+)(?::[^}]+)?\}/g;

  for (const key of source.keys()) {
    if (!target.has(key)) continue;

    const sourceVal = source.get(key) ?? "";
    const targetVal = target.get(key) ?? "";

    const sourceMatches = [...sourceVal.matchAll(placeholderRegex)].map((m) => m[1]);
    const targetMatches = [...targetVal.matchAll(placeholderRegex)].map((m) => m[1]);

    const sourceUnique = sourceMatches.filter((v) => !targetMatches.includes(v));
    const targetUnique = targetMatches.filter((v) => !sourceMatches.includes(v));

    if (sourceUnique.length > 0 || targetUnique.length > 0) {
      mismatches.push({
        key,
        source: sourceUnique.join(", "),
        target: targetUnique.join(", "),
      });
    }
  }

  return mismatches;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const messagesDir = resolve("src/messages");

  // Load all locale files
  const locales = ["vi", "en"];
  const messages: Record<string, Map<string, string>> = {};

  for (const locale of locales) {
    try {
      const filePath = resolve(messagesDir, `${locale}.json`);
      const raw = readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw) as MessageTree;
      messages[locale] = flattenMessages(parsed);
      console.log(`✅ Loaded ${locale}.json — ${messages[locale].size} keys`);
    } catch (err) {
      console.error(`❌ Failed to load ${locale}.json:`, err);
      process.exit(1);
    }
  }

  const reference = messages["vi"]!;

  // ─── Missing keys check (compare against VI as reference) ─────────────────
  console.log("\n─── Missing Keys Report ────────────────────────────────");

  const reports: MissingKeysReport[] = [];
  for (const locale of locales) {
    if (locale === "vi") continue; // VI is reference
    const missing = findMissingKeys(reference, messages[locale], "vi", locale);
    reports.push({ locale, missingCount: missing.length, missingKeys: missing });
  }

  // Also check VI against EN if EN is source
  const missingInVi = findMissingKeys(messages["en"], reference, "en", "vi");
  if (missingInVi.length > 0) {
    reports.push({ locale: "vi (vs EN)", missingCount: missingInVi.length, missingKeys: missingInVi });
  }

  let totalMissing = 0;
  for (const report of reports) {
    if (report.missingCount > 0) {
      console.log(`\n⚠️  ${report.locale} — ${report.missingCount} missing keys:`);
      for (const key of report.missingKeys.slice(0, 20)) {
        console.log(`   - ${key}`);
      }
      if (report.missingKeys.length > 20) {
        console.log(`   ... and ${report.missingKeys.length - 20} more`);
      }
      totalMissing += report.missingCount;
    } else {
      console.log(`✅ ${report.locale} — 0 missing keys (full coverage)`);
    }
  }

  // ─── Placeholder consistency ──────────────────────────────────────────────
  console.log("\n─── Placeholder Consistency (VI → EN) ──────────────────");

  const placeholderIssues = checkPlaceholders(reference, messages["en"]);
  if (placeholderIssues.length > 0) {
    console.log(`⚠️  ${placeholderIssues.length} keys with mismatched placeholders:`);
    for (const issue of placeholderIssues.slice(0, 10)) {
      console.log(`   - ${issue.key}:`);
      console.log(`     VI missing: ${issue.source || "(none)"}`);
      console.log(`     EN missing: ${issue.target || "(none)"}`);
    }
  } else {
    console.log("✅ All placeholders match between VI and EN");
  }

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log("\n─── Summary ──────────────────────────────────────────────");
  console.log(`Total keys (VI reference): ${reference.size}`);
  console.log(`Total missing keys across locales: ${totalMissing}`);

  if (totalMissing === 0 && placeholderIssues.length === 0) {
    console.log("✅ All translation files are complete and consistent!");
  } else {
    console.log(
      "\n⚠️  Fix missing keys before proceeding to next phase."
    );
  }
}

main().catch(console.error);
