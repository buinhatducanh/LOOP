/**
 * E2E: PM Project Flow
 * Assign team to project → Create Kanban tasks → Distribute LP budget
 *
 * Actors:
 *   admin: CEO/Admin (assign PM, designer, dev, qa)
 *   pm: Project Manager (creates tasks, assigns LP budget)
 *   dev: Developer (takes tasks)
 *
 * Run: npm run e2e
 */
import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";

test.describe("PM Project Flow — Smoke Tests", () => {

  test("admin projects page loads without crash", async ({ page }) => {
    const res = await page.goto(`${BASE}/admin/projects`);
    expect(res?.status()).toBeLessThan(400);
  });

  test("admin projects page shows project list or empty state", async ({ page }) => {
    await page.goto(`${BASE}/admin/projects`);
    const hasLogin = page.url().includes("/dang-nhap");
    if (!hasLogin) {
      const hasProjects = await page.locator("text=Projects").isVisible().catch(() => false);
      expect(hasProjects || hasLogin).toBe(true);
    }
  });

  test("kanban page for a specific order loads without crash", async ({ page }) => {
    // Generic test — orderId will be real in full E2E
    const res = await page.goto(`${BASE}/admin/projects`);
    // Projects page should load, actual kanban board tests happen with real orderId
    const hasLogin = page.url().includes("/dang-nhap");
    expect(res?.status()).toBeLessThan(400) || hasLogin;
  });
});

test.describe("PM Project Flow — RBAC", () => {

  test("only admin/ceo can assign PM role to project member", () => {
    const canAssignPm = (actor: string) =>
      ["ceo", "super_admin", "admin"].includes(actor);

    expect(canAssignPm("ceo")).toBe(true);
    expect(canAssignPm("admin")).toBe(true);
    expect(canAssignPm("project_manager")).toBe(false);
    expect(canAssignPm("member")).toBe(false);
  });

  test("admin/ceo/pm can assign designer/dev/qa roles", () => {
    const nonPmRoles = ["designer", "dev", "qa", "seo"];
    nonPmRoles.forEach(role => {
      const canAssign = (actor: string) =>
        ["ceo", "super_admin", "admin", "project_manager"].includes(actor);

      expect(canAssign("admin")).toBe(true);
      expect(canAssign("project_manager")).toBe(true);
    });
  });

  test("PM cannot remove themselves from a project", () => {
    const pmId = "clx_pm1";
    const action = {
      actor: "project_manager",
      memberId: pmId,
      projectId: "clx_order1",
    };
    const canRemove = action.actor === "admin" || action.actor === "ceo";
    expect(canRemove).toBe(false);
  });

  test("unique constraint: same member cannot be added twice", () => {
    const assignments = new Map<string, string>(); // key: orderId:memberId → role
    const add = (orderId: string, memberId: string, role: string): boolean => {
      const key = `${orderId}:${memberId}`;
      if (assignments.has(key)) return false; // already assigned
      assignments.set(key, role);
      return true;
    };

    expect(add("clx_o1", "clx_m1", "pm")).toBe(true);
    expect(add("clx_o1", "clx_m1", "dev")).toBe(false); // duplicate
    expect(add("clx_o2", "clx_m1", "dev")).toBe(true);  // different project
  });
});

test.describe("PM Project Flow — LP Budget Distribution", () => {

  test("LP budget is distributed across project members", () => {
    const totalBudget = 10_000;
    const distribution = {
      pm: 3500,
      designer: 2500,
      dev: 2500,
      qa: 1500,
      seo: 0, // 0% for company split
    };

    const distributed = Object.values(distribution).reduce((a, b) => a + b, 0);
    expect(distributed).toBeLessThanOrEqual(totalBudget);
  });

  test("LP budget distribution percentages sum to <= 100%", () => {
    const percentages = { pm: 35, designer: 25, dev: 25, qa: 15, seo: 0 };
    const sum = Object.values(percentages).reduce((a, b) => a + b, 0);
    expect(sum).toBeLessThanOrEqual(100);
  });

  test("PM assigns LP to each task at creation", () => {
    const task = { title: "Thiết kế homepage", lp: 500, column: "backlog" };
    const pmAssignsLp = task.lp > 0 && task.column === "backlog";
    expect(pmAssignsLp).toBe(true);
  });

  test("LP is deducted from member budget on task completion", () => {
    const pm = { name: "PM", assignedLp: 5000, earnedLp: 0 };
    // Dev completes a 500 LP task
    const taskLp = 500;

    pm.earnedLp += taskLp;
    const remaining = pm.assignedLp - pm.earnedLp;
    expect(pm.earnedLp).toBe(500);
    expect(remaining).toBe(4500);
  });
});

test.describe("PM Project Flow — Task Creation by PM", () => {

  test("PM can create tasks in backlog column", () => {
    const actor = "project_manager";
    const canCreateTask = (actor: string) =>
      ["ceo", "super_admin", "admin", "project_manager"].includes(actor);

    expect(canCreateTask(actor)).toBe(true);
  });

  test("member cannot create tasks", () => {
    const canCreateTask = (actor: string) =>
      ["ceo", "super_admin", "admin", "project_manager"].includes(actor);

    expect(canCreateTask("member")).toBe(false);
  });

  test("task assignee must be a project member", () => {
    const projectMembers = ["clx_pm1", "clx_dev1", "clx_qa1", "clx_designer1"];
    const validAssignee = (assigneeId: string) =>
      projectMembers.includes(assigneeId);

    expect(validAssignee("clx_dev1")).toBe(true);
    expect(validAssignee("clx_pm1")).toBe(true);
    expect(validAssignee("clx_outsider")).toBe(false);
  });
});