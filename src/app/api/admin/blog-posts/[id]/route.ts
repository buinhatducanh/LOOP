import { ok, handleError } from "@/lib/api/response";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/auth/audit";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  coverImage: z.string().optional().nullable(),
  seoTitle: z.string().optional().nullable(),
  seoDesc: z.string().optional().nullable(),   // schema field is seoDesc, accept seoDescription for compat
  seoDescription: z.string().optional().nullable(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  authorId: z.string().optional(),
  publishedAt: z.string().transform(s => new Date(s)).optional().nullable(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("blogs", "read");
    const { id } = await params;
    const data = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, orderNumber: true, customerName: true } },
        author: { select: { id: true, name: true } },
      },
    });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission("blogs", "update");
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

    const data = parsed.data;

    // Normalise seoDescription → seoDesc
    if (data.seoDescription !== undefined) {
      data.seoDesc = data.seoDescription;
      delete data.seoDescription;
    }

    const updated = await prisma.blogPost.update({ where: { id }, data });
    await createAuditLog({
      userId: session.userId,
      action: "update",
      resource: "blogs",
      resourceId: id,
      newValues: data,
    });
    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission("blogs", "delete");
    const { id } = await params;
    await prisma.blogPost.delete({ where: { id } });
    await createAuditLog({ userId: session.userId, action: "delete", resource: "blogs", resourceId: id });
    return ok({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
