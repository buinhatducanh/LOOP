import { handleError } from "@/lib/api/response";
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

const createSchema = z.object({
  projectId: z.string(),   // FK → Order.id (supports both projectId and orderId from frontend)
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  coverImage: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDesc: z.string().optional(),
  authorId: z.string().optional(),   // TeamMember.id — if not provided, resolve from authorName/authorEmail
  authorName: z.string().optional(), // fallback if authorId not given
  authorEmail: z.string().optional(),
  status: z.enum(["draft", "published"]).optional().default("draft"),
  publishedAt: z.string().transform(s => new Date(s)).optional(),
});

export async function GET(_req: NextRequest) {
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
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(_req: NextRequest) {
  try {
    // Auth FIRST — before any body parsing or DB queries
    const _session = await requirePermission("blogs", "create");

    const body = await req.json();

    // Support projectId or orderId from frontend
    const data = { ...body, projectId: body.projectId ?? body.orderId };
    const parsed = createSchema.safeParse(data);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

    // Resolve authorId: use provided, or find by name/email
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
        return NextResponse.json({ error: "Author not found. Please create the team member first." }, { status: 400 });
      }
      authorId = member.id;
    }

    if (!authorId) {
      return NextResponse.json({ error: "authorId, authorName, or authorEmail is required" }, { status: 400 });
    }
    const result = await prisma.blogPost.create({
      data: {
        projectId: parsed.data.projectId,
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
      },
    });

    await createAuditLog({
      userId: session.userId,
      action: "create",
      resource: "blogs",
      resourceId: result.id,
      newValues: { title: result.title, slug: result.slug, authorId },
    });
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
