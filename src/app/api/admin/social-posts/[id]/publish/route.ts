import { handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { sendSocialPublishNotification } from "@/lib/email/sender";

/**
 * POST /api/admin/social-posts/[id]/publish
 * Publishes a social post and sends email notification.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePermission("projects", "update");
    const { id } = await params;

    const post = await prisma.socialPost.findUnique({
      where: { id },
      include: { project: { select: { orderNumber: true, customerName: true } } },
    });
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (post.status === "published") {
      return NextResponse.json({ error: "Already published" }, { status: 409 });
    }

    console.log(`[Social Publish] ${post.platform} — ${post.projectId} — ${post.content?.slice(0, 50)}`);

    const updated = await prisma.socialPost.update({
      where: { id },
      data: {
        status: "published",
        publishedAt: new Date(),
        publishedBy: session.userId,
        postUrl: `https://${post.platform}.com/loop-company/post-${id.slice(0, 8)}`,
      },
    });

    // Send publish notification email
    await sendSocialPublishNotification({
      projectName: post.project.customerName,
      projectOrderNumber: post.project.orderNumber,
      postContent: post.content ?? "",
      platform: post.platform,
      scheduledAt: updated.publishedAt ?? new Date(),
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleError(error);
  }
}
