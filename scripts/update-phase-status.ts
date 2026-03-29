#!/usr/bin/env tsx

/**
 * FE Phase Status Updater
 *
 * Cập nhật đồng thời:
 * 1) .claude/rules/fe-roadmap.md (Phase Status Tracker table)
 * 2) .claude/rules/fe-phase-status-log.md (append audit log row)
 *
 * Usage:
 * npx tsx scripts/update-phase-status.ts \
 *   --phase F2 \
 *   --status in_progress \
 *   --by "FE Lead" \
 *   --reason "Bắt đầu wiring pricing config" \
 *   --impact medium \
 *   --week F2
 *
 * Blocked status requires:
 * --eta "YYYY-MM-DD" --escalation "Owner Name"
 */

import fs from "node:fs";
import path from "node:path";

const ROADMAP_PATH = path.resolve(process.cwd(), ".claude/rules/fe-roadmap.md");
const PHASE_LOG_PATH = path.resolve(process.cwd(), ".claude/rules/fe-phase-status-log.md");

type Status = "pending" | "in_progress" | "blocked" | "completed";
type PhaseKey = "F0" | "F1" | "F2" | "F3" | "F4" | "F5" | "F6" | "F7" | "F8";

const PHASE_LABEL: Record<PhaseKey, string> = {
  F0: "F0 Infrastructure",
  F1: "F1 Public Pages",
  F2: "F2 Booking/Orders",
  F3: "F3 Team/Effects",
  F4: "F4 Academy",
  F5: "F5 Customer Portal",
  F6: "F6 Admin 23 tabs",
  F7: "F7 Realtime/Polish",
  F8: "F8 Scale Hardening",
};

interface Args {
  phase: PhaseKey;
  status: Status;
  by: string;
  reason: string;
  impact: string;
  week: string;
  eta: string;
  escalation: string;
  owner: string;
  actual: string;
  notes: string;
  related: string;
}

function parseArgs(argv: string[]): Partial<Args> {
  const out: Partial<Args> = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    const val = argv[i + 1];
    if (!key?.startsWith("--")) continue;
    if (!val || val.startsWith("--")) continue;
    const k = key.slice(2) as keyof Args;
    out[k] = val as never;
    i++;
  }
  return out;
}

function assertArgs(args: Partial<Args>): asserts args is Args {
  const required: (keyof Args)[] = ["phase", "status", "by", "reason"];
  for (const k of required) {
    if (!args[k]) {
      throw new Error(`missing required arg --${k}`);
    }
  }

  const phases = Object.keys(PHASE_LABEL) as PhaseKey[];
  if (!phases.includes(args.phase!)) {
    throw new Error(`invalid --phase ${args.phase}. use: ${phases.join(", ")}`);
  }

  const statuses: Status[] = ["pending", "in_progress", "blocked", "completed"];
  if (!statuses.includes(args.status as Status)) {
    throw new Error(`invalid --status ${args.status}. use: ${statuses.join(", ")}`);
  }

  if (args.status === "blocked") {
    if (!args.eta) throw new Error("blocked status requires --eta YYYY-MM-DD");
    if (!args.escalation) throw new Error("blocked status requires --escalation <owner>");
  }

  args.impact = args.impact ?? "medium";
  args.week = args.week ?? args.phase;
  args.eta = args.eta ?? "N/A";
  args.escalation = args.escalation ?? "N/A";
  args.owner = args.owner ?? "";
  args.actual = args.actual ?? "";
  args.notes = args.notes ?? "";
  args.related = args.related ?? "fe-roadmap.md";
}

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function splitTableCols(row: string): string[] {
  return row
    .split("|")
    .map((v) => v.trim())
    .filter((_, idx, arr) => !(idx === 0 || idx === arr.length - 1));
}

function buildTableRow(cols: string[]): string {
  return `| ${cols.join(" | ")} |`;
}

function updateRoadmap(args: Args): { oldStatus: string; newStatus: string } {
  const text = fs.readFileSync(ROADMAP_PATH, "utf8");
  const lines = text.split("\n");

  const phaseLabel = PHASE_LABEL[args.phase];
  const idx = lines.findIndex((l) => l.startsWith(`| ${phaseLabel} |`));
  if (idx === -1) {
    throw new Error(`cannot find phase row in roadmap: ${phaseLabel}`);
  }

  const cols = splitTableCols(lines[idx]);
  // Expected columns:
  // 0 Phase | 1 Status | 2 Owner | 3 Planned Window | 4 Actual Window | 5 Notes
  if (cols.length < 6) {
    throw new Error(`unexpected roadmap table format at row: ${lines[idx]}`);
  }

  const oldStatus = cols[1];
  cols[1] = args.status;
  if (args.owner) cols[2] = args.owner;
  if (args.actual) cols[4] = args.actual;
  if (args.notes) cols[5] = args.notes;

  lines[idx] = buildTableRow(cols);
  fs.writeFileSync(ROADMAP_PATH, `${lines.join("\n")}\n`, "utf8");

  return { oldStatus, newStatus: args.status };
}

function appendPhaseLog(args: Args, oldStatus: string): void {
  const text = fs.readFileSync(PHASE_LOG_PATH, "utf8");
  const marker = "\n\n---\n\n## 4) Mẫu entry nhanh";
  const i = text.indexOf(marker);
  if (i === -1) {
    throw new Error("cannot find log table marker in fe-phase-status-log.md");
  }

  const row = `| ${todayISO()} | ${args.week} | ${PHASE_LABEL[args.phase]} | ${oldStatus} | ${args.status} | ${args.by} | ${args.reason} | ${args.impact} | ${args.eta} | ${args.escalation} | ${args.related} |`;

  const before = text.slice(0, i);
  const after = text.slice(i);

  const patched = `${before}\n${row}${after}`;
  fs.writeFileSync(PHASE_LOG_PATH, patched, "utf8");
}

function main(): void {
  try {
    const args = parseArgs(process.argv.slice(2));
    assertArgs(args);

    const { oldStatus, newStatus } = updateRoadmap(args);
    appendPhaseLog(args, oldStatus);

    // eslint-disable-next-line no-console
    console.log(`✅ Updated ${args.phase}: ${oldStatus} -> ${newStatus}`);
    // eslint-disable-next-line no-console
    console.log(`- roadmap: ${ROADMAP_PATH}`);
    // eslint-disable-next-line no-console
    console.log(`- log:     ${PHASE_LOG_PATH}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // eslint-disable-next-line no-console
    console.error(`❌ ${msg}`);
    // eslint-disable-next-line no-console
    console.error("\nUsage:\n  npx tsx scripts/update-phase-status.ts --phase F2 --status in_progress --by \"FE Lead\" --reason \"...\" [--impact medium] [--week F2] [--owner \"FE Lead\"] [--actual \"Tuần F2\"] [--notes \"...\"] [--eta YYYY-MM-DD] [--escalation \"PO\"]");
    process.exit(1);
  }
}

main();
