import { NextRequest, NextResponse } from "next/server";
import { submitContactForm, getContactMessages } from "@/lib/services/landing/contact.service";
import { applyRateLimit } from "@/lib/rate-limit";
import { handleError, badRequest, unauthorized, ok, serverError } from "@/lib/api";

/**
 * POST /api/contact — Submit a contact form (public)
 * GET  /api/contact — List all messages (auth required — admin only)
 */
export async function GET() {
  try {
    const messages = await getContactMessages();
    return ok(messages);
  } catch (err) {
    console.error("[Contact API] Failed to fetch messages:", err);
    return handleError(err);
  }
}

export async function POST(request: NextRequest) {
  // Rate limit check
  const rateLimit = await applyRateLimit(request, "contact");
  if (!rateLimit.allowed && rateLimit.response) {
    return rateLimit.response;
  }

  try {
    const body = await request.json();
    const result = await submitContactForm(body);

    if (!result.success) {
      return badRequest(result.error);
    }

    return ok(result.data, 201);
  } catch (err) {
    console.error("[Contact API] Unexpected error:", err);
    return handleError(err);
  }
}
