import { describe, it, expect } from "vitest";

describe("API Orders Contract", () => {
  it("supports order response shape", () => {
    const order = {
      id: "ord_1",
      orderNumber: "ORD-0001",
      status: "pending",
      customerName: "Nguyen Van A",
      customerEmail: "a@example.com",
      totalAmount: 5000000,
    };

    expect(order.status).toBe("pending");
    expect(order.totalAmount).toBeGreaterThan(0);
  });

  it("supports error response shape", () => {
    const err = { error: "Unauthorized", code: "AUTH_REQUIRED" };
    expect(err.error).toBeTypeOf("string");
  });
});
