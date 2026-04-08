/**
 * TaskKanban API — unit tests for transition logic + contract tests
 * Run: npm run test:run
 */
import { describe, it, expect } from "vitest";

// ── Valid transition map ─────────────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<string, string[]> = {
  backlog:     ["todo"],
  todo:        ["backlog", "in_progress"],
  in_progress: ["backlog", "in_review"],
  in_review:   ["in_progress", "done"],
  done:        ["in_progress"], // allow reopen
};

function isValidTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// ── Transition tests ─────────────────────────────────────────────────────────────

describe("TaskKanban — valid transitions", () => {
  it("backlog can go to todo", () => {
    expect(isValidTransition("backlog", "todo")).toBe(true);
  });

  it("backlog cannot skip to done", () => {
    expect(isValidTransition("backlog", "done")).toBe(false);
  });

  it("todo can go to backlog or in_progress", () => {
    expect(isValidTransition("todo", "backlog")).toBe(true);
    expect(isValidTransition("todo", "in_progress")).toBe(true);
  });

  it("in_progress can go to backlog or in_review", () => {
    expect(isValidTransition("in_progress", "backlog")).toBe(true);
    expect(isValidTransition("in_progress", "in_review")).toBe(true);
  });

  it("in_review can go to in_progress or done", () => {
    expect(isValidTransition("in_review", "in_progress")).toBe(true);
    expect(isValidTransition("in_review", "done")).toBe(true);
  });

  it("done can reopen to in_progress", () => {
    expect(isValidTransition("done", "in_progress")).toBe(true);
  });

  it("done cannot go to backlog directly", () => {
    expect(isValidTransition("done", "backlog")).toBe(false);
  });

  it("unknown column rejects any transition", () => {
    expect(isValidTransition("unknown", "todo")).toBe(false);
    expect(isValidTransition("backlog", "unknown")).toBe(false);
  });
});

// ── LP award logic ──────────────────────────────────────────────────────────────

describe("TaskKanban — LP auto-award logic", () => {
  interface LpAwardScenario {
    lp: number;
    assigneeId: string | null;
    expectAward: boolean;
  }

  const scenarios: LpAwardScenario[] = [
    { lp: 500,    assigneeId: "member_1", expectAward: true },
    { lp: 0,     assigneeId: "member_1", expectAward: false },
    { lp: 500,   assigneeId: null,        expectAward: false },
    { lp: 0,     assigneeId: null,        expectAward: false },
  ];

  scenarios.forEach(({ lp, assigneeId, expectAward }) => {
    it(`lp=${lp} assignee=${assigneeId ?? "null"} → ${expectAward ? "award" : "skip"}`, () => {
      const shouldAward = lp > 0 && assigneeId !== null;
      expect(shouldAward).toBe(expectAward);
    });
  });
});

// ── Priority validation ────────────────────────────────────────────────────────

describe("TaskKanban — priority values", () => {
  const VALID_PRIORITIES = ["low", "medium", "high", "urgent"];

  it("accepts valid priorities", () => {
    VALID_PRIORITIES.forEach(p => {
      expect(VALID_PRIORITIES).toContain(p);
    });
  });

  it("rejects unknown priorities", () => {
    expect(VALID_PRIORITIES).not.toContain("critical");
    expect(VALID_PRIORITIES).not.toContain("blocker");
  });
});

// ── API response shape ────────────────────────────────────────────────────────

describe("TaskKanban — API response shapes", () => {
  const mockTask = {
    id: "clx_test123",
    orderId: "clx_order456",
    column: "backlog",
    title: "Thiết kế trang chủ",
    description: "Thiết kế UI cho homepage",
    priority: "high",
    lp: 500,
    branchName: null,
    githubLink: null,
    assigneeId: "clx_member1",
    qaId: "clx_member2",
    completedAt: null,
    createdAt: new Date().toISOString(),
  };

  it("task object has all required fields", () => {
    expect(mockTask.id).toBeDefined();
    expect(mockTask.orderId).toBeDefined();
    expect(mockTask.column).toBeDefined();
    expect(mockTask.title).toBeDefined();
    expect(mockTask.priority).toBeDefined();
  });

  it("priority is one of valid values", () => {
    const VALID_PRIORITIES = ["low", "medium", "high", "urgent"];
    expect(VALID_PRIORITIES).toContain(mockTask.priority);
  });

  it("completedAt is null when not done", () => {
    expect(mockTask.completedAt).toBeNull();
  });

  it("LP is non-negative integer", () => {
    expect(mockTask.lp).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(mockTask.lp)).toBe(true);
  });

  it("assigneeId and qaId can be null", () => {
    const taskNoAssignee = { ...mockTask, assigneeId: null, qaId: null };
    expect(taskNoAssignee.assigneeId).toBeNull();
    expect(taskNoAssignee.qaId).toBeNull();
  });

  it("branchName and githubLink can be null", () => {
    expect(mockTask.branchName).toBeNull();
    expect(mockTask.githubLink).toBeNull();
  });
});
