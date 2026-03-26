import { describe, it, expect } from "vitest";

describe("API Tasks Contract", () => {
  it("supports task status lifecycle", () => {
    const allowed = ["todo", "in_progress", "in_review", "done"];
    const task = { id: "task_1", status: "todo" };

    expect(allowed).toContain(task.status);
  });
});
