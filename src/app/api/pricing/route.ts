import { serverError } from "@/lib/api/response";
import { getPricingPlans } from "@/lib/db/queries";

export async function GET() {
  try {
    const plans = await getPricingPlans();
    return ok(plans);
  } catch (error) {
    console.error("Failed to fetch pricing plans:", error);
    return serverError();
  }
}
