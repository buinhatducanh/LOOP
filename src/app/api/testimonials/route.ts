import { ok, serverError } from "@/lib/api/response";
import { getTestimonials } from "@/lib/db/queries";

export async function GET() {
  try {
    const testimonials = await getTestimonials();
    return ok(testimonials);
  } catch (error) {
    console.error("Failed to fetch testimonials:", error);
    return serverError();
  }
}
