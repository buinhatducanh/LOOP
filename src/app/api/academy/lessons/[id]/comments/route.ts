/**
 * GET  /api/academy/lessons/[id]/comments  — list comments for a lesson
 * POST /api/academy/lessons/[id]/comments  — post a new comment
 *
 * Auth: requires userId or memberId
 *
 * GET  query params: ?page=1&limit=20
 *
 * GET  Response:
 * {
 *   data: CommentResponse[]
 *   pagination: { page, limit, total, totalPages }
 * }
 *
 * POST body:
 * {
 *   userId?: string
 *   memberId?: string
 *   content: string        // comment text, 1-2000 chars
 * }
 *
 * POST Response:
 * {
 *   data: CommentResponse
 * }
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError, badRequest, notFound, ok, list, buildPagination } from "@/lib/api/response";

// ─── Shared types ────────────────────────────────────────────────────────────

interface CommentResponse {
  id: string;
  lessonId: string;
  userId: string | null;
  memberId: string | null;
  authorName: string;
  authorAvatar: string | null;
  content: string;
  likes: number;
  createdAt: string;
  timeAgo: string;
}

// Helper: format relative time (Vietnamese)
function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Vừa xong";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} ngày trước`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} tháng trước`;
  return `${Math.floor(diffMonth / 12)} năm trước`;
}

// Build a CommentResponse from a DB record
async function buildComment(
  record: {
    id: string;
    lessonId: string;
    userId: string | null;
    memberId: string | null;
    content: string;
    likes: number;
    createdAt: Date;
  }
): Promise<CommentResponse> {
  let authorName = "Học viên";
  let authorAvatar: string | null = null;

  if (record.memberId) {
    const member = await prisma.teamMember.findUnique({
      where: { id: record.memberId },
      select: { name: true, image: true },
    });
    if (member) {
      authorName = member.name;
      authorAvatar = member.image ?? null;
    }
  } else if (record.userId) {
    const user = await prisma.user.findUnique({
      where: { id: record.userId },
      select: { name: true, avatar: true },
    });
    if (user) {
      authorName = user.name ?? "Học viên";
      authorAvatar = user.avatar ?? null;
    }
  }

  return {
    id: record.id,
    lessonId: record.lessonId,
    userId: record.userId,
    memberId: record.memberId,
    authorName,
    authorAvatar,
    content: record.content,
    likes: record.likes,
    createdAt: record.createdAt.toISOString(),
    timeAgo: timeAgo(record.createdAt),
  };
}

// ─── GET ────────────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lessonId } = await params;

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
    const skip = (page - 1) * limit;

    // Validate lesson exists
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) return notFound("Lesson not found");

    const [records, total] = await Promise.all([
      prisma.lessonComment.findMany({
        where: { lessonId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.lessonComment.count({ where: { lessonId } }),
    ]);

    const data = await Promise.all(records.map(buildComment));

    return list(data, buildPagination(page, limit, total));
  } catch (error) {
    return handleError(error);
  }
}

// ─── POST ────────────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lessonId } = await params;
    const body = await req.json();
    const { userId, memberId, content } = body;

    if (!userId && !memberId) {
      return badRequest("userId or memberId is required");
    }
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return badRequest("content is required and must be a non-empty string");
    }
    if (content.trim().length > 2000) {
      return badRequest("content exceeds maximum length of 2000 characters");
    }

    // Validate lesson exists
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) return notFound("Lesson not found");

    const record = await prisma.lessonComment.create({
      data: {
        lessonId,
        userId: userId ?? null,
        memberId: memberId ?? null,
        content: content.trim(),
        likes: 0,
      },
    });

    const data = await buildComment(record);
    return ok(data, 201);
  } catch (error) {
    return handleError(error);
  }
}
