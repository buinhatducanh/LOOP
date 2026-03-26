import { ok, serverError } from "@/lib/api/response";
import { getProjects } from "@/lib/db/queries";

export async function GET() {
  try {
    const projects = await getProjects();
    return ok(projects);
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return serverError();
  }
}
