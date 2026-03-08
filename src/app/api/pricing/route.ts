import { NextResponse } from "next/server";
import { getPricingPlans } from "@/lib/db/queries";

export async function GET() {
  try {
    const plans = await getPricingPlans();
    return NextResponse.json(plans);
  } catch (error) {
    console.error("Failed to fetch pricing plans:", error);
    return NextResponse.json({ error: "Failed to fetch pricing plans" }, { status: 500 });
  }
}
