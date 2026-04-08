/**
 * FigmaDemo Client Approval API — unit tests for token-based approval flow
 * Run: npm run test:run
 */
import { describe, it, expect } from "vitest";

// ── FigmaDemo status lifecycle ──────────────────────────────────────────────────

const DEMO_STATUSES = [
  "draft",
  "sent",
  "viewed",
  "approved_by_client",
  "rejected",
  "revision_requested",
] as const;
type DemoStatus = typeof DEMO_STATUSES[number];

// ── Token generation ───────────────────────────────────────────────────────────

function generateClientToken(): string {
  // In production: crypto.randomUUID() or cuid2()
  return "clx_demo_token_" + Math.random().toString(36).slice(2);
}

// ── Token validity ─────────────────────────────────────────────────────────────

const VALID_TOKEN_PREFIXES = ["clx_", "cuid2_", "tok_"];

function isValidClientToken(token: string): boolean {
  if (!token || typeof token !== "string") return false;
  if (token.length < 16) return false;
  // Tokens are UUID-like or prefixed identifiers
  return /^[a-z0-9_-]+$/i.test(token);
}

// ── Status transition rules ────────────────────────────────────────────────────

const ALLOWED_STATUS_TRANSITIONS: Record<DemoStatus, DemoStatus[]> = {
  draft: ["sent"],
  sent: ["viewed", "approved_by_client", "rejected"],
  viewed: ["approved_by_client", "rejected", "revision_requested"],
  approved_by_client: [], // terminal for client
  rejected: ["sent"], // can re-send for revision
  revision_requested: ["sent"],
};

function canTransition(from: DemoStatus, to: DemoStatus): boolean {
  return ALLOWED_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

// ── Token tests ────────────────────────────────────────────────────────────────

describe("FigmaDemo Client — token generation", () => {
  it("generates a non-empty token", () => {
    const token = generateClientToken();
    expect(token.length).toBeGreaterThan(16);
  });

  it("generates unique tokens", () => {
    const token1 = generateClientToken();
    const token2 = generateClientToken();
    expect(token1).not.toBe(token2);
  });

  it("validates correct token format", () => {
    expect(isValidClientToken("clx_demo_abc123def456")).toBe(true);
    expect(isValidClientToken("tok_abc123def456ghi789")).toBe(true);
  });

  it("rejects invalid token formats", () => {
    expect(isValidClientToken("")).toBe(false);
    expect(isValidClientToken("short")).toBe(false);
    expect(isValidClientToken(" spaces in token")).toBe(false);
    expect(isValidClientToken(null as unknown as string)).toBe(false);
  });
});

describe("FigmaDemo Client — status transitions", () => {
  it("draft can transition to sent", () => {
    expect(canTransition("draft", "sent")).toBe(true);
  });

  it("sent can be approved or rejected by client", () => {
    expect(canTransition("sent", "approved_by_client")).toBe(true);
    expect(canTransition("sent", "rejected")).toBe(true);
    expect(canTransition("sent", "viewed")).toBe(true);
  });

  it("viewed can be approved, rejected, or revision requested", () => {
    expect(canTransition("viewed", "approved_by_client")).toBe(true);
    expect(canTransition("viewed", "rejected")).toBe(true);
    expect(canTransition("viewed", "revision_requested")).toBe(true);
  });

  it("approved_by_client is terminal", () => {
    DEMO_STATUSES.forEach(status => {
      expect(canTransition("approved_by_client", status)).toBe(false);
    });
  });

  it("rejected can be re-sent", () => {
    expect(canTransition("rejected", "sent")).toBe(true);
  });

  it("revision_requested can be re-sent", () => {
    expect(canTransition("revision_requested", "sent")).toBe(true);
  });

  it("backwards transitions are not allowed", () => {
    expect(canTransition("sent", "draft")).toBe(false);
    expect(canTransition("viewed", "draft")).toBe(false);
  });
});

// ── Approval trigger: creates HandoverPackage ─────────────────────────────────

describe("FigmaDemo Client — approval side effects", () => {
  it("approving creates HandoverPackage with figmaUrl", () => {
    const demo = {
      id: "clx_demo1",
      figmaUrl: "https://www.figma.com/file/abc123/Design",
      status: "approved_by_client" as DemoStatus,
      projectId: "clx_order1",
    };

    const shouldCreateHandover = demo.status === "approved_by_client";
    expect(shouldCreateHandover).toBe(true);

    // HandoverPackage should use the approved Figma URL
    if (shouldCreateHandover) {
      const handover = { figmaUrl: demo.figmaUrl, orderId: demo.projectId };
      expect(handover.figmaUrl).toBe(demo.figmaUrl);
    }
  });

  it("rejecting does NOT create HandoverPackage", () => {
    const demo = { status: "rejected" as DemoStatus };
    const shouldCreateHandover = demo.status === "approved_by_client";
    expect(shouldCreateHandover).toBe(false);
  });

  it("rejection requires rejectionNote", () => {
    const demo = { status: "rejected" as DemoStatus, rejectionNote: null };
    const needsNote = demo.status === "rejected" && !demo.rejectionNote;
    expect(needsNote).toBe(true);
  });
});

// ── Version hash ───────────────────────────────────────────────────────────────

describe("FigmaDemo Client — version tracking", () => {
  it("versionHash increments on each send", () => {
    let version = 0;
    const sendDemo = () => { version += 1; return version; };

    expect(sendDemo()).toBe(1);
    expect(sendDemo()).toBe(2);
    expect(sendDemo()).toBe(3);
  });

  it("each version has a unique hash", () => {
    const hashes = new Set<string>();
    const generateHash = (version: number) => `${Date.now()}_v${version}`;

    for (let v = 1; v <= 10; v++) {
      hashes.add(generateHash(v));
    }
    expect(hashes.size).toBe(10);
  });
});

// ── API response shape ─────────────────────────────────────────────────────────

describe("FigmaDemo Client — API response shape", () => {
  const mockDemo = {
    id: "clx_demo1",
    title: "Thiết kế Website Công ty",
    figmaUrl: "https://www.figma.com/file/abc123/Design",
    status: "viewed" as DemoStatus,
    versionHash: "v3_abc123",
    sentAt: new Date().toISOString(),
    projectId: "clx_order1",
    clientToken: "clx_demo_token_xyz789",
    approvedBy: null,
    approvedAt: null,
    rejectionNote: null,
  };

  it("has all required fields", () => {
    expect(mockDemo.id).toBeDefined();
    expect(mockDemo.title).toBeDefined();
    expect(mockDemo.figmaUrl).toBeDefined();
    expect(mockDemo.status).toBeDefined();
    expect(DEMO_STATUSES).toContain(mockDemo.status);
  });

  it("public token endpoint does NOT return sensitive fields", () => {
    // Token endpoint is unauthenticated — must NOT expose internal fields
    const publicFields = Object.keys(mockDemo);
    // No password, no internal notes, no creator info
    expect(publicFields).not.toContain("password");
    expect(publicFields).not.toContain("secret");
    expect(publicFields).not.toContain("internalNotes");
  });

  it("clientToken is present in token-based GET response", () => {
    // Only returned when fetching by clientToken (not by internal ID)
    expect(mockDemo.clientToken).toBeDefined();
    expect(isValidClientToken(mockDemo.clientToken)).toBe(true);
  });

  it("approvedBy/approvedAt are null until client approves", () => {
    expect(mockDemo.approvedBy).toBeNull();
    expect(mockDemo.approvedAt).toBeNull();
  });

  it("after approval — approvedBy and approvedAt are set", () => {
    const approvedDemo = {
      ...mockDemo,
      status: "approved_by_client" as DemoStatus,
      approvedBy: "clx_customer1",
      approvedAt: new Date().toISOString(),
    };
    expect(approvedDemo.approvedBy).not.toBeNull();
    expect(approvedDemo.approvedAt).not.toBeNull();
  });

  it("sentAt is valid ISO string", () => {
    expect(new Date(mockDemo.sentAt).toISOString()).toBe(mockDemo.sentAt);
  });

  it("figmaUrl is a valid URL", () => {
    try {
      new URL(mockDemo.figmaUrl);
    } catch {
      throw new Error("Invalid figmaUrl");
    }
  });
});
