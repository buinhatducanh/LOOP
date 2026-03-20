import { NextRequest, NextResponse } from "next/server";
import { submitContactForm, getContactMessages } from "@/lib/services/contact.service";
import { applyRateLimit } from "@/lib/rate-limit";

export async function GET() {
  try {
    const messages = await getContactMessages();
    return NextResponse.json(messages);
  } catch (error) {
    console.error("[Contact API] Failed to fetch messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
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
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data, { status: 201 });
  } catch (error) {
    console.error("[Contact API] Unexpected error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
