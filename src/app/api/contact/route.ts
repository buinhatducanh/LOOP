import { NextRequest, NextResponse } from "next/server";
import { createContactMessage, getContactMessages } from "@/lib/db/queries";

export async function GET() {
  try {
    const messages = await getContactMessages();
    return NextResponse.json(messages);
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, message } = body;
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    const contact = await createContactMessage({
      name: name.trim(), email: email.trim(),
      phone: body.phone?.trim() || undefined,
      service: body.service?.trim() || undefined,
      message: message.trim(),
    });
    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error("Failed to create contact message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
