import { ok, notFound, serverError } from "@/lib/api/response";
import { getProjectBySlug } from "@/lib/db/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const project = await getProjectBySlug(slug);
    if (!project) return notFound("Project not found");
    return ok(project);
  } catch (error) {
    console.error("Failed to fetch project:", error);
    return serverError();
  }
}
