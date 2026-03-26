import { ok, notFound, serverError } from "@/lib/api/response";
import { getServiceBySlug } from "@/lib/db/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const service = await getServiceBySlug(slug);
    if (!service) return notFound("Service not found");
    return ok(service);
  } catch (error) {
    console.error("Failed to fetch service:", error);
    return serverError();
  }
}
