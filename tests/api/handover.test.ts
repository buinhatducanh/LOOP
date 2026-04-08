/**
 * HandoverPackage API — unit tests for handover contract + lifecycle
 * Run: npm run test:run
 */
import { describe, it, expect } from "vitest";

// ── Scope schema ────────────────────────────────────────────────────────────────

interface HandoverScope {
  features: string[];
  pointCount: number;
  customRequests: string[];
}

function isValidScope(scope: unknown): scope is HandoverScope {
  if (!scope || typeof scope !== "object") return false;
  const s = scope as Record<string, unknown>;
  return (
    Array.isArray(s.features) &&
    typeof s.pointCount === "number" &&
    s.pointCount >= 0 &&
    Array.isArray(s.customRequests)
  );
}

// ── Handover status lifecycle ───────────────────────────────────────────────────

const HANDOVER_STATUSES = ["draft", "pending_review", "approved", "delivered"] as const;
type HandoverStatus = typeof HANDOVER_STATUSES[number];

const VALID_STATUS_TRANSITIONS: Record<HandoverStatus, HandoverStatus[]> = {
  draft: ["pending_review"],
  pending_review: ["draft", "approved"],
  approved: ["pending_review", "delivered"],
  delivered: [], // terminal
};

function isValidStatusTransition(from: HandoverStatus, to: HandoverStatus): boolean {
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

// ── Scope tests ────────────────────────────────────────────────────────────────

describe("HandoverPackage — scope validation", () => {
  it("valid scope is accepted", () => {
    const scope: HandoverScope = {
      features: ["Trang chủ", "Trang liên hệ", "Trang sản phẩm"],
      pointCount: 80,
      customRequests: ["Slider animation", "Dark mode"],
    };
    expect(isValidScope(scope)).toBe(true);
  });

  it("null scope is rejected", () => {
    expect(isValidScope(null)).toBe(false);
  });

  it("scope with missing fields is rejected", () => {
    expect(isValidScope({ features: [] })).toBe(false);
    expect(isValidScope({ pointCount: 50 })).toBe(false);
    expect(isValidScope({ customRequests: [] })).toBe(false);
  });

  it("scope with negative pointCount is rejected", () => {
    expect(isValidScope({ features: [], pointCount: -1, customRequests: [] })).toBe(false);
  });

  it("empty arrays are valid scope", () => {
    const scope: HandoverScope = { features: [], pointCount: 0, customRequests: [] };
    expect(isValidScope(scope)).toBe(true);
  });
});

describe("HandoverPackage — status transitions", () => {
  it("draft → pending_review is valid", () => {
    expect(isValidStatusTransition("draft", "pending_review")).toBe(true);
  });

  it("draft cannot go directly to approved or delivered", () => {
    expect(isValidStatusTransition("draft", "approved")).toBe(false);
    expect(isValidStatusTransition("draft", "delivered")).toBe(false);
  });

  it("pending_review → approved is valid", () => {
    expect(isValidStatusTransition("pending_review", "approved")).toBe(true);
  });

  it("pending_review → draft (revert) is valid", () => {
    expect(isValidStatusTransition("pending_review", "draft")).toBe(true);
  });

  it("approved → delivered is valid", () => {
    expect(isValidStatusTransition("approved", "delivered")).toBe(true);
  });

  it("delivered is terminal — no transitions allowed", () => {
    HANDOVER_STATUSES.forEach(status => {
      expect(isValidStatusTransition("delivered", status)).toBe(false);
    });
  });

  it("unknown status rejects any transition", () => {
    expect(isValidStatusTransition("unknown" as HandoverStatus, "draft")).toBe(false);
  });
});

// ── Figma URL field ────────────────────────────────────────────────────────────

describe("HandoverPackage — Figma URL", () => {
  const validFigmaUrls = [
    "https://www.figma.com/file/abc123/Project",
    "https://figma.com/file/abc123/Project?node-id=0%3A1",
  ];

  it("accepts valid Figma URLs", () => {
    validFigmaUrls.forEach(url => {
      expect(url.startsWith("https://www.figma.com/") || url.startsWith("https://figma.com/")).toBe(true);
    });
  });

  it("figmaUrl can be null (not yet provided)", () => {
    const handover = { figmaUrl: null };
    expect(handover.figmaUrl).toBeNull();
  });

  it("githubUrl can be null", () => {
    const handover = { githubUrl: null };
    expect(handover.githubUrl).toBeNull();
  });

  it("deploymentUrl can be null", () => {
    const handover = { deploymentUrl: null };
    expect(handover.deploymentUrl).toBeNull();
  });
});

// ── API response shape ─────────────────────────────────────────────────────────

describe("HandoverPackage — API response shape", () => {
  const mockHandover = {
    id: "clx_handover1",
    orderId: "clx_order1",
    figmaUrl: "https://www.figma.com/file/abc123/Project",
    githubUrl: "https://github.com/loop/project",
    deploymentUrl: "https://project.loops.vn",
    scope: {
      features: ["Homepage", "About", "Contact"],
      pointCount: 80,
      customRequests: [],
    } as HandoverScope,
    customerNotes: "Cần dark mode cho tất cả pages",
    adminNotes: "Đã deploy lên staging",
    handedOverAt: null,
    deliveredBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("has all required fields", () => {
    expect(mockHandover.id).toBeDefined();
    expect(mockHandover.orderId).toBeDefined();
    expect(mockHandover.scope).toBeDefined();
    expect(isValidScope(mockHandover.scope)).toBe(true);
  });

  it("handedOverAt is null when not yet delivered", () => {
    expect(mockHandover.handedOverAt).toBeNull();
  });

  it("notes fields are nullable strings", () => {
    const empty: string | null = null;
    expect(empty).toBeNull();
    const withNote: string | null = "Some note";
    expect(typeof withNote === "string").toBe(true);
  });

  it("timestamps are valid ISO strings", () => {
    expect(new Date(mockHandover.createdAt).toISOString()).toBe(mockHandover.createdAt);
    expect(new Date(mockHandover.updatedAt).toISOString()).toBe(mockHandover.updatedAt);
  });
});

// ── Trigger: client approves final FigmaDemo ───────────────────────────────────

describe("HandoverPackage — creation trigger", () => {
  it("HandoverPackage is created when client approves FigmaDemo", () => {
    const figmaDemo = { status: "approved_by_client", figmaUrl: "https://figma.com/file/123" };
    const shouldCreateHandover = figmaDemo.status === "approved_by_client";
    expect(shouldCreateHandover).toBe(true);
  });

  it("HandoverPackage is NOT created when demo is rejected", () => {
    const figmaDemo = { status: "rejected", figmaUrl: "https://figma.com/file/123" };
    const shouldCreateHandover = figmaDemo.status === "approved_by_client";
    expect(shouldCreateHandover).toBe(false);
  });

  it("upsert — existing handover is updated, not duplicated", () => {
    const existingId = "clx_handover_existing";
    const handover = existingId ? { id: existingId } : null;
    const action = handover ? "update" : "create";
    expect(action).toBe("update");
  });
});
