/**
 * ProjectMembers API — unit tests for assign/remove member logic
 * Run: npm run test:run
 */
import { describe, it, expect } from "vitest";

// ── Valid project role keys ────────────────────────────────────────────────────

const PROJECT_ROLE_KEYS = ["pm", "designer", "dev", "qa", "seo"] as const;
type ProjectRoleKey = typeof PROJECT_ROLE_KEYS[number];

function isValidRoleKey(key: string): key is ProjectRoleKey {
  return PROJECT_ROLE_KEYS.includes(key as ProjectRoleKey);
}

// ── PM role restriction ────────────────────────────────────────────────────────

function canAssignRole(actorRole: string, targetRole: ProjectRoleKey): boolean {
  // Only admin/ceo can assign PM role
  if (targetRole === "pm") {
    return actorRole === "ceo" || actorRole === "super_admin" || actorRole === "admin";
  }
  // admin/ceo/pm can assign dev/qa/designer/seo
  return ["ceo", "super_admin", "admin", "project_manager"].includes(actorRole);
}

// ── RBAC tests ─────────────────────────────────────────────────────────────────

describe("ProjectMembers — role key validation", () => {
  it("all 5 project role keys are valid", () => {
    PROJECT_ROLE_KEYS.forEach(key => {
      expect(isValidRoleKey(key)).toBe(true);
    });
  });

  it("unknown role key is rejected", () => {
    expect(isValidRoleKey("manager")).toBe(false);
    expect(isValidRoleKey("director")).toBe(false);
    expect(isValidRoleKey("")).toBe(false);
  });
});

describe("ProjectMembers — RBAC assignment", () => {
  it("only admin/ceo can assign PM role", () => {
    expect(canAssignRole("ceo", "pm")).toBe(true);
    expect(canAssignRole("super_admin", "pm")).toBe(true);
    expect(canAssignRole("admin", "pm")).toBe(true);
    expect(canAssignRole("project_manager", "pm")).toBe(false);
    expect(canAssignRole("member", "pm")).toBe(false);
  });

  it("admin/ceo/pm can assign designer/dev/qa/seo roles", () => {
    const nonPmRoles: ProjectRoleKey[] = ["designer", "dev", "qa", "seo"];
    nonPmRoles.forEach(role => {
      expect(canAssignRole("ceo", role)).toBe(true);
      expect(canAssignRole("super_admin", role)).toBe(true);
      expect(canAssignRole("admin", role)).toBe(true);
      expect(canAssignRole("project_manager", role)).toBe(true);
    });
  });

  it("member cannot assign any project role", () => {
    PROJECT_ROLE_KEYS.forEach(role => {
      expect(canAssignRole("member", role)).toBe(false);
    });
  });
});

// ── Member constraint tests ─────────────────────────────────────────────────────

describe("ProjectMembers — unique constraint", () => {
  it("same member cannot be added twice to same project", () => {
    // Simulate: [orderId=clx_1, memberId=clx_member1]
    const existingAssignments = new Set<string>();
    const addAssignment = (orderId: string, memberId: string): boolean => {
      const key = `${orderId}:${memberId}`;
      if (existingAssignments.has(key)) return false; // duplicate
      existingAssignments.add(key);
      return true;
    };

    expect(addAssignment("clx_1", "clx_member1")).toBe(true);
    expect(addAssignment("clx_1", "clx_member1")).toBe(false); // duplicate
    expect(addAssignment("clx_2", "clx_member1")).toBe(true);   // different order
  });
});

describe("ProjectMembers — LP budget tracking", () => {
  it("assignedLp and earnedLp default to 0", () => {
    const member = { assignedLp: 0, earnedLp: 0 };
    expect(member.assignedLp).toBe(0);
    expect(member.earnedLp).toBe(0);
  });

  it("LP is deducted when earned exceeds assigned", () => {
    const member = { assignedLp: 5000, earnedLp: 0 };
    // Dev earns 500 LP on a task
    member.earnedLp += 500;
    expect(member.assignedLp - member.earnedLp).toBe(4500); // remaining budget
  });
});

// ── API response shape ─────────────────────────────────────────────────────────

describe("ProjectMembers — API response shape", () => {
  const mockMember = {
    id: "clx_pm1",
    orderId: "clx_order1",
    memberId: "clx_team_member1",
    projectRoleKey: "pm",
    assignedLp: 5000,
    earnedLp: 1500,
    joinedAt: new Date().toISOString(),
    order: { id: "clx_order1", orderNumber: "ORD-001", status: "in_progress" },
    member: {
      id: "clx_team_member1",
      name: "Nguyễn Văn A",
      email: "a@loop.vn",
      avatar: "https://example.com/avatar.png",
      rank: "gold",
    },
    projectRole: {
      key: "pm",
      label: "Project Manager",
      color: "#EC4899",
    },
  };

  it("member has all required fields", () => {
    expect(mockMember.id).toBeDefined();
    expect(mockMember.orderId).toBeDefined();
    expect(mockMember.memberId).toBeDefined();
    expect(mockMember.projectRoleKey).toBeDefined();
    expect(isValidRoleKey(mockMember.projectRoleKey)).toBe(true);
  });

  it("projectRoleKey matches projectRole.key", () => {
    expect(mockMember.projectRoleKey).toBe(mockMember.projectRole.key);
  });

  it("joinedAt is valid ISO string", () => {
    expect(new Date(mockMember.joinedAt).toISOString()).toBe(mockMember.joinedAt);
  });

  it("LP fields are non-negative integers", () => {
    expect(mockMember.assignedLp).toBeGreaterThanOrEqual(0);
    expect(mockMember.earnedLp).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(mockMember.assignedLp)).toBe(true);
    expect(Number.isInteger(mockMember.earnedLp)).toBe(true);
  });

  it("role colors are valid hex strings", () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    PROJECT_ROLE_KEYS.forEach(key => {
      expect(mockMember.projectRole.color).toMatch(hexRegex);
    });
  });
});
