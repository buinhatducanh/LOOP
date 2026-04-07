import { handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

const SEO_LP_REWARD = 1; // 1 LP per published SEO blog post

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const _session = await requirePermission("blogs", "update");
    const { id } = await params;

    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (post.status === "published") {
      return NextResponse.json({ error: "Already published" }, { status: 409 });
    }

    const updated = await prisma.blogPost.update({
      where: { id },
      data: { status: "published", publishedAt: new Date() },
    });

    // Award LP to author once per post
    if (post.authorId && !post.lpEarned) {
      await prisma.lpAward.create({
        data: {
          projectId: post.projectId,
          taskId: null,
          memberId: post.authorId,
          lpAmount: SEO_LP_REWARD,
          expAmount: SEO_LP_REWARD,
          source: "seo_article",
          status: "approved",
          approvedAt: new Date(),
        },
      });

      // Mark post as LP earned
      await prisma.blogPost.update({
        where: { id },
        data: { lpEarned: true, lpAwardedAt: new Date() },
      });

      // Update ProjectMember exp
      const pmRecord = await prisma.projectMember.findUnique({
        where: { projectId_memberId: { projectId: post.projectId, memberId: post.authorId } },
      });
      if (pmRecord) {
        await prisma.projectMember.update({
          where: { id: pmRecord.id },
          data: { exp: pmRecord.exp + SEO_LP_REWARD },
        });
      }

      console.log(`[Blog Publish] "${post.title}" — awarded ⬡${SEO_LP_REWARD} LP to author ${post.authorId}`);
    }

    await createAuditLog({
      userId: session.userId,
      action: "publish",
      resource: "blogs",
      resourceId: id,
      newValues: { status: "published" },
    });

    return NextResponse.json({ data: updated, lpAwarded: !post.lpEarned ? SEO_LP_REWARD : 0 });
  } catch (error) {
    return handleError(error);
  }
}
