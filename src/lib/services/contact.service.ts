/**
 * Contact Service — Business logic for contact form submissions.
 *
 * This layer separates validation, business rules, and data access
 * from the API route handler (src/app/api/contact/route.ts).
 */

import { prisma } from "@/lib/prisma";
import { ZodError } from "zod";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContactFormInput {
  name: string;
  email: string;
  phone?: string;
  service?: string;
  message: string;
}

export interface ContactSubmissionResult {
  success: boolean;
  data?: Awaited<ReturnType<typeof prisma.contactMessage.create>>;
  error?: string;
}

// ─── Validation ────────────────────────────────────────────────────────────────

export function validateContactInput(data: unknown): ContactFormInput {
  if (!data || typeof data !== "object") {
    throw new ZodError([{ code: "custom", message: "Request body must be an object" }]);
  }

  const { name, email, message, phone, service } = data as Record<string, unknown>;

  // Trim first so validation works regardless of whitespace padding
  const trimmedName = typeof name === "string" ? name.trim() : "";
  const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const trimmedMessage = typeof message === "string" ? message.trim() : "";

  if (!trimmedName) {
    throw new ZodError([{ code: "custom", path: ["name"], message: "Name is required" }]);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    throw new ZodError([{ code: "custom", path: ["email"], message: "Valid email is required" }]);
  }

  if (!trimmedMessage) {
    throw new ZodError([{ code: "custom", path: ["message"], message: "Message is required" }]);
  }

  return {
    name: trimmedName,
    email: trimmedEmail,
    phone: typeof phone === "string" && phone.trim() ? phone.trim() : undefined,
    service: typeof service === "string" && service.trim() ? service.trim() : undefined,
    message: trimmedMessage,
  };
}

// ─── Business Logic ───────────────────────────────────────────────────────────

/**
 * Submit a contact form.
 * - Validates input
 * - Sanitizes data (trim, lowercase email)
 * - Persists to DB
 * - Returns structured result (never throws to caller)
 */
export async function submitContactForm(
  rawInput: unknown
): Promise<ContactSubmissionResult> {
  try {
    const input = validateContactInput(rawInput);

    // Business rules
    if (input.message.length > 5000) {
      return { success: false, error: "Message must be 5000 characters or fewer" };
    }

    const contact = await prisma.contactMessage.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        service: input.service,
        message: input.message,
      },
    });

    return { success: true, data: contact };
  } catch (err) {
    if (err instanceof ZodError) {
      return { success: false, error: err.issues.map((e) => e.message).join(", ") };
    }
    // Log unexpected errors for monitoring
    console.error("[ContactService] Unexpected error:", err);
    return { success: false, error: "An unexpected error occurred. Please try again." };
  }
}

/**
 * Fetch contact messages for admin dashboard.
 * Supports pagination via cursor-based approach.
 */
export async function getContactMessages(options: { take?: number; skip?: number } = {}) {
  const { take = 50, skip = 0 } = options;
  return prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    take,
    skip,
  });
}
