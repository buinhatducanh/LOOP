/**
 * POST /api/admin/customer-websites/:id/deploy
 *
 * Triggers a Vercel deployment for a CustomerWebsite.
 * Creates the Vercel project if it doesn't exist, then triggers a deploy.
 *
 * Environment variables required:
 *  VERCEL_TOKEN — Vercel API token (with admin scope)
 * VERCEL_TEAM_ID — Vercel team/org ID (e.g. "team_xxx")
 *
 * Request body (all fields optional — will use package defaults if not provided):
 * repoUrl — Git repo URL (https://github.com/user/repo.git)
 * branch — Git branch to deploy (default: "main")
 * projectName — Vercel project name override (default: domain or name)
 * framework — Vercel framework preset (default: "nextjs")
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { handleError, ok, notFound, badRequest } from "@/lib/api";

const deploySchema = z.object({
 repoUrl: z.string().url().optional(),
 branch: z.string().default("main"),
 projectName: z.string().optional(),
 framework: z.string().default("nextjs"),
});

const VERCEL_API = "https://api.vercel.com/v13";
const VERCEL_TOKEN = process.env.VERCEL_TOKEN ?? "";
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID ?? "";

function vercelHeaders() {
 return {
 Authorization: `Bearer ${VERCEL_TOKEN}`,
 "Content-Type": "application/json",
 };
}

async function createVercelProject(opts: {
 name: string;
 repoUrl: string;
 framework: string;
}): Promise<{ id: string; url: string }> {
 const teamPath = VERCEL_TEAM_ID ? `/teams/${VERCEL_TEAM_ID}` : "";

 const res = await fetch(`${VERCEL_API}${teamPath}/projects`, {
 method: "POST",
 headers: vercelHeaders(),
 body: JSON.stringify({
 name: opts.name,
 gitSource: {
 type: "github",
 repo: opts.repoUrl.replace(/^https:\/\/github\.com\//, ""),
 ref: "main",
 },
 framework: opts.framework,
 buildCommand: undefined,
 outputDirectory: undefined,
 installCommand: undefined,
 devCommand: undefined,
 }),
 });

 if (!res.ok) {
 const error = await res.json().catch(() => ({}));
 throw new Error(`Vercel project create failed: ${res.status} ${JSON.stringify(error)}`);
 }

 const project = await res.json();
 return { id: project.id, url: `https://${project.name}.vercel.app` };
}

async function deployVercelProject(opts: {
 projectId: string;
 repoUrl: string;
 branch: string;
}): Promise<{ url: string; id: string }> {
 const teamPath = VERCEL_TEAM_ID ? `/teams/${VERCEL_TEAM_ID}` : "";

 const res = await fetch(
 `${VERCEL_API}${teamPath}/projects/${opts.projectId}/deployments`,
 {
 method: "POST",
 headers: vercelHeaders(),
 body: JSON.stringify({
 gitSource: {
 type: "github",
 repo: opts.repoUrl.replace(/^https:\/\/github\.com\//, ""),
 ref: opts.branch,
 },
 target: "production",
 forceNew: true,
 }),
 }
 );

 if (!res.ok) {
 const error = await res.json().catch(() => ({}));
 throw new Error(`Vercel deploy failed: ${res.status} ${JSON.stringify(error)}`);
 }

 const deployment = await res.json();
  return { url: `https://${deployment.url}`, id: deployment.id };
}

export async function POST(
 req: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
 await requirePermission("customer-websites", "update");

 if (!VERCEL_TOKEN) {
 return badRequest("Vercel API token not configured (VERCEL_TOKEN env var)");
 }

 const { id } = await params;
 const body = await req.json().catch(() => ({}));
 const parsed = deploySchema.safeParse(body);
 if (!parsed.success) return badRequest(parsed.error.message);
 const { repoUrl, branch, projectName, framework } = parsed.data;

 const website = await prisma.customerWebsite.findUnique({ where: { id } });
 if (!website) return notFound("Website not found");

 // Use provided repoUrl or fall back to package template
 const gitUrl =
 repoUrl ??
 (website.packageId
 ? (
 await prisma.pricingWebPackage
 .findUnique({ where: { id: website.packageId }, select: { templateRepoUrl: true } })
  )?.templateRepoUrl
 : null);

 if (!gitUrl) {
 return badRequest(
 "No repo URL provided and the package has no templateRepoUrl. Provide repoUrl in request body."
 );
 }

 const name = projectName ?? website.domain ?? website.name.replace(/\s+/g, "-").toLowerCase();

 let vercelProjectId = website.vercelProjectId;
 let vercelProjectUrl = website.vercelProjectUrl;

 // Create Vercel project if it doesn't exist
 if (!vercelProjectId) {
 const project = await createVercelProject({ name, repoUrl: gitUrl, framework });
 vercelProjectId = project.id;
 vercelProjectUrl = project.url;

 await prisma.customerWebsite.update({
 where: { id },
 data: { vercelProjectId, vercelProjectUrl },
 });
 }

 // Trigger deployment
 const deployment = await deployVercelProject({
 projectId: vercelProjectId,
 repoUrl: gitUrl,
 branch,
 });

 // Update website record
 await prisma.customerWebsite.update({
 where: { id },
 data: {
 deployedUrl: deployment.url,
 deployedAt: new Date(),
 configStatus: "configured",
 },
 });

 return ok({
 message: "Deployment triggered",
 projectId: vercelProjectId,
 projectUrl: vercelProjectUrl,
 deploymentUrl: deployment.url,
 deploymentId: deployment.id,
 });
 } catch (err) {
 return handleError(err);
 }
}
