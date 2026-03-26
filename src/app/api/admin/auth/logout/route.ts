import { NextResponse } from "next/server";
import { ok } from "@/lib/api/response";

export async function POST() {
  const response = ok({ success: true });

  // Clear auth-token cookie
  response.cookies.set("auth-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  // Clear auth-method cookie
  response.cookies.set("auth-method", "", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
