import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * GitHub Webhook — receives push + pull_request events.
 *
 * Setup in GitHub repo:
 *   Settings → Webhooks → Add webhook
 *   URL: https://your-domain.com/api/webhooks/github/[projectId]
 *   Content-Type: application/json
 *   Events: push, pull_request
 *
 * Validates using X-Hub-Signature-256 header (HMAC-SHA256).
 * Per-project secret stored in Order.gitWebhookSecret.
 */

// Branch → taskId regex: task-{taskId}-{description}
const TASK_BRANCH_REGEX = /task-([a-z0-9]+)/i;

function extractTaskId(branch: string): string | null {
  const match = branch.match(TASK_BRANCH_REGEX);
  return match ? match[1] : null;
}

async function verifySignature(projectId: string, payload: string, signature: string): Promise<boolean> {
  // Check per-project secret first, fall back to global env
  const project = await prisma.order.findUnique({
    where: { id: projectId },
    select: { gitWebhookSecret: true },
  });
  const secret = project?.gitWebhookSecret ?? process.env.GITHUB_WEBHOOK_SECRET ?? "";

  if (!secret) {
    console.warn(`[GitHub Webhook] GITHUB_WEBHOOK_SECRET not set — signature verification skipped`);
    return process.env.NODE_ENV !== "production"; // only bypass in development
  }

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  const expected = `sha256=${hmac.digest("hex")}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

const pushPayload = z.object({
  ref: z.string(),
  commits: z.array(z.object({
    id: z.string(),
    message: z.string(),
    author: z.object({ name: z.string(), email: z.string() }),
    timestamp: z.string(),
  })).default([]),
  repository: z.object({
    full_name: z.string(),
    html_url: z.string(),
  }),
  pusher: z.object({ name: z.string(), email: z.string() }),
});

const prPayload = z.object({
  action: z.string(),
  pull_request: z.object({
    merged: z.boolean(),
    title: z.string(),
    user: z.object({ login: z.string(), email: z.string().optional() }),
    head: z.object({ ref: z.string(), sha: z.string() }),
    base: z.object({ ref: z.string() }),
    merged_at: z.string().nullable(),
  }),
  repository: z.object({
    full_name: z.string(),
    html_url: z.string(),
  }),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256") ?? "";
  const event = req.headers.get("x-github-event") ?? "";

  if (!(await verifySignature(projectId, rawBody, signature))) {
    console.warn(`[GitHub Webhook] Invalid signature for project ${projectId}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // ── PUSH event ──────────────────────────────────────────────────────────────
  if (event === "push") {
    let payload: z.infer<typeof pushPayload>;
    try {
      payload = pushPayload.parse(JSON.parse(rawBody));
    } catch (e) {
      console.error("[GitHub Webhook] Invalid push payload", e);
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const branch = payload.ref.replace("refs/heads/", "");
    const taskId = extractTaskId(branch);

    // Link to task if found via branch convention
    let linkedTask = null;
    if (taskId) {
      linkedTask = await prisma.task.findUnique({
        where: { id: taskId },
        select: { id: true, title: true, lp: true, assigneeId: true, status: true },
      });
    }

    for (const commit of payload.commits) {
      await prisma.gitCommit.upsert({
        where: { sha: commit.id },
        create: {
          projectId,
          taskId: linkedTask?.id ?? null,
          sha: commit.id,
          message: commit.message,
          authorName: commit.author.name,
          authorEmail: commit.author.email,
          branch,
          eventType: "push",
          mergedToMain: branch === "main",
          committedAt: new Date(commit.timestamp),
          receivedAt: new Date(),
        },
        update: {
          message: commit.message,
          authorName: commit.author.name,
          mergedToMain: branch === "main",
        },
      });
    }

    console.log(`[GitHub Webhook] push — ${payload.repository.full_name} · ${branch} · ${payload.commits.length} commits · task: ${linkedTask?.id ?? "none"}`);
    return NextResponse.json({ received: true, event, branch, commits: payload.commits.length });
  }

  // ── PULL_REQUEST event ───────────────────────────────────────────────────────
  if (event === "pull_request") {
    let payload: z.infer<typeof prPayload>;
    try {
      payload = prPayload.parse(JSON.parse(rawBody));
    } catch (e) {
      console.error("[GitHub Webhook] Invalid PR payload", e);
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const pr = payload.pull_request;
    const branch = pr.head.ref;

    if (pr.merged && pr.base.ref === "main") {
      // PR merged to main — create GitCommit with merge flag
      const taskId = extractTaskId(branch);

      let linkedTask = null;
      if (taskId) {
        linkedTask = await prisma.task.findUnique({
          where: { id: taskId },
          select: { id: true, title: true, lp: true, assigneeId: true, status: true },
        });
      }

      await prisma.gitCommit.upsert({
        where: { sha: pr.head.sha },
        create: {
          projectId,
          taskId: linkedTask?.id ?? null,
          sha: pr.head.sha,
          message: pr.title,
          authorName: pr.user.login,
          authorEmail: pr.user.email ?? "",
          branch,
          eventType: "merge",
          mergedToMain: true,
          committedAt: pr.merged_at ? new Date(pr.merged_at) : new Date(),
          receivedAt: new Date(),
        },
        update: {
          eventType: "merge",
          mergedToMain: true,
        },
      });

      // Auto-create pending LP award if task has LP value
      if (linkedTask && linkedTask.lp > 0 && linkedTask.assigneeId) {
        const existingAward = await prisma.lpAward.findFirst({
          where: { taskId: linkedTask.id, projectId, source: "commit_merge", status: { in: ["pending", "approved"] } },
        });

        if (!existingAward) {
          await prisma.lpAward.create({
            data: {
              projectId,
              taskId: linkedTask.id,
              memberId: linkedTask.assigneeId,
              lpAmount: linkedTask.lp,
              expAmount: linkedTask.lp,
              source: "commit_merge",
              status: "pending",
            },
          });

          // Mark commit as LP awarded
          await prisma.gitCommit.update({
            where: { sha: pr.head.sha },
            data: { lpAwarded: true, expAwarded: true },
          });
        }
      }

      console.log(`[GitHub Webhook] merge — ${payload.repository.full_name} · ${branch} · PR merged to main · task: ${linkedTask?.id ?? "none"}`);
    }

    return NextResponse.json({ received: true, event, action: payload.action, merged: pr.merged });
  }

  // Unknown event — acknowledge without processing
  return NextResponse.json({ received: true, event, skipped: true });
}

// Prevent GET errors on the webhook URL
export async function GET() {
  return NextResponse.json({ error: "Webhook endpoint — POST only" }, { status: 405 });
}
