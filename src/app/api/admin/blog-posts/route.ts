import { handleError, ok, badRequest } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

const createSchema = z.object({
  projectId: z.string().optional(),   // FK → Order.id (optional — will auto-resolve from author session if missing)
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  coverImage: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDesc: z.string().optional(),
  videoUrl: z.string().optional(),
  canonicalUrl: z.string().optional(),
  backlinks: z.string().optional(), // JSON: [{url, label}]
  authorId: z.string().optional(),   // TeamMember.id — if not provided, resolve from authorName/authorEmail or session
  authorName: z.string().optional(), // fallback if authorId not given
  authorEmail: z.string().optional(),
  status: z.enum(["draft", "published"]).optional().default("draft"),
  publishedAt: z.string().transform(s => new Date(s)).optional(),
  // i18n fields
  titleEn: z.string().optional(),
  titleJa: z.string().optional(),
  titleKo: z.string().optional(),
  titleZh: z.string().optional(),
  contentEn: z.string().optional(),
  contentJa: z.string().optional(),
  contentKo: z.string().optional(),
  contentZh: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requirePermission("blogs", "read");
    const { searchParams } = new URL(req.url);
    // Support both orderId and projectId
    const projectId = searchParams.get("projectId") ?? searchParams.get("orderId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    const data = await prisma.blogPost.findMany({
      where,
      include: {
        project: { select: { id: true, orderNumber: true, customerName: true } },
        author: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return ok(data);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    // Auth FIRST — before any body parsing or DB queries
    const session = await requirePermission("blogs", "create");

    const body = await req.json();

    // Support projectId or orderId from frontend
    const data = { ...body, projectId: body.projectId ?? body.orderId };
    const parsed = createSchema.safeParse(data);
    if (!parsed.success) return badRequest(parsed.error.message);

    // Resolve projectId: use provided, or find any active order
    let resolvedProjectId = parsed.data.projectId;
    if (!resolvedProjectId) {
      const fallbackOrder = await prisma.order.findFirst({
        where: { status: { not: "cancelled" } },
        select: { id: true },
        orderBy: { createdAt: "desc" },
      });
      resolvedProjectId = fallbackOrder?.id;
    }

    // Resolve authorId: use provided, or find by name/email, or use session teamMemberId
    let authorId = parsed.data.authorId;
    if (!authorId && (parsed.data.authorName || parsed.data.authorEmail)) {
      const member = await prisma.teamMember.findFirst({
        where: {
          ...(parsed.data.authorName ? { name: parsed.data.authorName } : {}),
          ...(parsed.data.authorEmail ? { email: parsed.data.authorEmail } : {}),
        },
        select: { id: true },
      });
      if (!member) {
        return badRequest("Author not found. Please create the team member first.");
      }
      authorId = member.id;
    }

    if (!authorId) {
      return badRequest("authorId, authorName, or authorEmail is required");
    }

    if (!resolvedProjectId) {
      return badRequest("projectId is required. No active order found to assign this post to.");
    }

    const result = await prisma.blogPost.create({
      data: {
        projectId: resolvedProjectId,
        title: parsed.data.title,
        slug: parsed.data.slug,
        content: parsed.data.content,
        excerpt: parsed.data.excerpt,
        coverImage: parsed.data.coverImage,
        seoTitle: parsed.data.seoTitle,
        seoDesc: parsed.data.seoDesc,
        authorId,
        status: parsed.data.status,
        publishedAt: parsed.data.publishedAt,
        // i18n
        titleEn: parsed.data.titleEn,
        titleJa: parsed.data.titleJa,
        titleKo: parsed.data.titleKo,
        titleZh: parsed.data.titleZh,
        contentEn: parsed.data.contentEn,
        contentJa: parsed.data.contentJa,
        contentKo: parsed.data.contentKo,
        contentZh: parsed.data.contentZh,
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "blogs",
      resourceId: result.id,
      newValues: { title: result.title, slug: result.slug, authorId },
    });
    return ok(result, 201);
  } catch (error) {
    return handleError(error);
  }
}
