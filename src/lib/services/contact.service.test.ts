import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validateContactInput,
  submitContactForm,
} from "@/lib/services/contact.service";

// ─── Mock Prisma ───────────────────────────────────────────────────────────────
// vi.hoisted() ensures the mock factory can reference `mockPrisma` at initialization
const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    contactMessage: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

describe("contact.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── validateContactInput ───────────────────────────────────────────────

  describe("validateContactInput", () => {
    it("accepts valid input with all fields", () => {
      const input = {
        name: "Nguyễn Văn A",
        email: "test@example.com",
        message: "Tôi muốn tư vấn về dịch vụ website",
        phone: "0901234567",
        service: "Thiết kế website",
      };

      const result = validateContactInput(input);

      expect(result.name).toBe("Nguyễn Văn A");
      expect(result.email).toBe("test@example.com");
      expect(result.message).toBe("Tôi muốn tư vấn về dịch vụ website");
      expect(result.phone).toBe("0901234567");
      expect(result.service).toBe("Thiết kế website");
    });

    it("trims whitespace from input fields", () => {
      const input = {
        name: "  Nguyễn Văn A  ",
        email: "  TEST@EXAMPLE.COM.VN  ",
        message: "  Hello world  ",
      };

      const result = validateContactInput(input);

      expect(result.name).toBe("Nguyễn Văn A");
      expect(result.email).toBe("test@example.com.vn"); // lowercase + trimmed
      expect(result.message).toBe("Hello world");
    });

    it("rejects empty name", () => {
      const input = { name: "   ", email: "test@example.com", message: "Hello" };

      expect(() => validateContactInput(input)).toThrow();
    });

    it("rejects empty email", () => {
      const input = { name: "John", email: "   ", message: "Hello" };

      expect(() => validateContactInput(input)).toThrow();
    });

    it("rejects invalid email format", () => {
      const input = { name: "John", email: "not-an-email", message: "Hello" };

      expect(() => validateContactInput(input)).toThrow();
    });

    it("rejects empty message", () => {
      const input = { name: "John", email: "test@example.com", message: "" };

      expect(() => validateContactInput(input)).toThrow();
    });

    it("accepts input without optional fields", () => {
      const input = { name: "John", email: "test@example.com", message: "Hello" };

      const result = validateContactInput(input);

      expect(result.phone).toBeUndefined();
      expect(result.service).toBeUndefined();
    });

    it("rejects null body", () => {
      expect(() => validateContactInput(null)).toThrow();
    });

    it("rejects non-object body", () => {
      expect(() => validateContactInput("string")).toThrow();
    });
  });

  // ─── submitContactForm ──────────────────────────────────────────────────

  describe("submitContactForm", () => {
    it("creates a contact message successfully", async () => {
      const mockCreated = { id: "1", name: "John", email: "test@example.com", message: "Hello", createdAt: new Date() };
      mockPrisma.contactMessage.create.mockResolvedValue(mockCreated);

      const result = await submitContactForm({
        name: "John",
        email: "test@example.com",
        message: "Hello",
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCreated);
      expect(mockPrisma.contactMessage.create).toHaveBeenCalledTimes(1);
    });

    it("returns error for invalid input", async () => {
      const result = await submitContactForm({
        name: "",
        email: "not-an-email",
        message: "",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(mockPrisma.contactMessage.create).not.toHaveBeenCalled();
    });

    it("returns error for message exceeding 5000 characters", async () => {
      const longMessage = "a".repeat(5001);

      const result = await submitContactForm({
        name: "John",
        email: "test@example.com",
        message: longMessage,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("5000");
    });

    it("returns error on database failure", async () => {
      mockPrisma.contactMessage.create.mockRejectedValue(new Error("DB connection failed"));

      const result = await submitContactForm({
        name: "John",
        email: "test@example.com",
        message: "Hello",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("An unexpected error occurred. Please try again.");
    });
  });
});
