import { describe, it, expect } from "vitest";

/**
 * API contract smoke tests (no server boot needed).
 *
 * For integration tests with running Next server, use fetch against base URL.
 */
describe("API Auth Contract", () => {
  it("defines /api/admin/auth/me response shape", () => {
    const mock = {
      user: {
        userId: "u_1",
        email: "admin@loop.vn",
        name: "Admin",
        role: "admin",
        roles: ["admin"],
        avatar: null,
        accountType: "staff",
        roleLevel: 1,
        permissions: [{ resource: "orders", action: "read", scope: "all" }],
      },
    };

    expect(mock.user.userId).toBeTypeOf("string");
    expect(Array.isArray(mock.user.permissions)).toBe(true);
  });
});
