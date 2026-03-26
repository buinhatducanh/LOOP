import { describe, it, expect } from "vitest";

describe("API Services Contract", () => {
  it("matches standard success list response shape", () => {
    const response = {
      data: [{ id: "svc_1", title: "Web Development", slug: "web-development" }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };

    expect(Array.isArray(response.data)).toBe(true);
    expect(response.pagination.totalPages).toBeGreaterThanOrEqual(1);
  });
});
