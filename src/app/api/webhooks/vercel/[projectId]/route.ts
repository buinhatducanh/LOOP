import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * Vercel Deploy Webhook — receives deployment status updates from Vercel.
 *
 * Setup in Vercel dashboard:
 *   Project → Settings → Webhooks → Add webhook
 *   URL: https://your-domain.com/api/webhooks/vercel/[projectId]
 *   Events: deployment.succeeded, deployment.failed, deployment.ready
 *
 * Vercel sends a SHA-256 HMAC signature in X-Vercel-Signature header.
 */
const VERCEL_SIGNING_SECRET = process.env.VERCEL_WEBHOOK_SECRET ?? "";

const vercelPayloadSchema = z.object({
  id: z.string(),
  name: z.string(),
  state: z.enum(["READY", "ERROR", "BUILDING", "INITIALIZING", "QUEUED"]),
  url: z.string().optional(),
  target: z.string().optional(),
  meta: z.object({
    githubCommitSha: z.string().optional(),
    githubCommitMessage: z.string().optional(),
    githubCommitUrl: z.string().optional(),
    githubCommitAuthorName: z.string().optional(),
  }).optional(),
  createdAt: z.number().optional(),
  ready: z.number().optional(),
});

function verifySignature(payload: string, signature: string): boolean {
  if (!VERCEL_SIGNING_SECRET) return true; // Skip in dev if no secret set
  const hmac = crypto.createHmac("sha256", VERCEL_SIGNING_SECRET);
  hmac.update(payload);
  const expected = `sha256=${hmac.digest("hex")}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const rawBody = await req.text();
  const signature = req.headers.get("x-vercel-signature") ?? "";

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: z.infer<typeof vercelPayloadSchema>;
  try {
    payload = vercelPayloadSchema.parse(JSON.parse(rawBody));
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const statusMap: Record<string, string> = {
    READY: "success",
    ERROR: "failed",
    BUILDING: "running",
    INITIALIZING: "running",
    QUEUED: "pending",
  };

  const newStatus = statusMap[payload.state] ?? "running";

  // Find deployment by projectId mapped to this Vercel project
  const deployments = await prisma.deployment.findMany({
    where: { projectId: projectId, platform: "vercel" },
    orderBy: { deployedAt: "desc" },
    take: 1,
  });

  if (deployments.length > 0) {
    await prisma.deployment.update({
      where: { id: deployments[0].id },
      data: {
        status: newStatus,
        ...(payload.url ? { deployUrl: payload.url } : {}),
        ...(payload.meta?.githubCommitSha ? { commitSha: payload.meta.githubCommitSha } : {}),
        ...(payload.ready ? { deployedAt: new Date(payload.ready) } : {}),
      },
    });
  } else {
    // Create a new deployment record automatically
    await prisma.deployment.create({
      data: {
        projectId: projectId,
        platform: "vercel",
        environment: payload.target === "production" ? "production" : "staging",
        status: newStatus,
        deployUrl: payload.url ?? "",
        commitSha: payload.meta?.githubCommitSha ?? "",
        deployedAt: payload.ready ? new Date(payload.ready) : new Date(),
      },
    });
  }

  console.log(`[Vercel Webhook] Project ${payload.name} → ${payload.state} (${newStatus})`);
  return NextResponse.json({ received: true, state: payload.state });
}
