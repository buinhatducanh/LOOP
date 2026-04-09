import { NextRequest, NextResponse } from "next/server";

// GET /api/public/figma/review/[token] — DEPRECATED, redirect to canonical
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  return NextResponse.redirect(
    new URL(`/api/public/figma-review/${token}`, _req.url),
    { status: 301 }
  );
}

// POST /api/public/figma/review/[token] — DEPRECATED
export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { error: "This endpoint is deprecated. Use POST /api/public/figma-review/[token]", deprecated: true },
    { status: 410 }
  );
}
