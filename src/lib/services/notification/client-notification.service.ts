/**
 * Client Notification Service
 * CRUD helpers for Notification model (per-user customer notifications).
 */

import { prisma } from "@/lib/prisma";

export interface ClientNotificationInput {
 userId: string;
 type: string;
 title: string;
 message: string;
 link?: string;
 data?: Record<string, unknown>;
}

/**
 * Create a notification for a customer user.
 */
export async function createClientNotification(
 input: ClientNotificationInput
): Promise<void> {
 try {
 await prisma.notification.create({
 data: {
 userId: input.userId,
 type: input.type,
 title: input.title,
 message: input.message,
 link: input.link ?? null,
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 data: input.data as any,
 isRead: false,
 },
 });
 } catch {
 // silent — fire-and-forget
 }
}

/**
 * Get paginated notifications for a user.
 */
export async function getClientNotifications(
 userId: string,
 page = 1,
 limit = 20
) {
 const skip = (page - 1) * limit;

 const [items, total] = await Promise.all([
 prisma.notification.findMany({
 where: { userId },
 orderBy: { createdAt: "desc" },
 skip,
 take: limit,
 }),
 prisma.notification.count({ where: { userId } }),
 ]);

 return { items, total, page, limit };
}

/**
 * Mark a notification as read (only owner can mark).
 */
export async function markNotificationRead(
 id: string,
 userId: string
): Promise<boolean> {
 try {
 await prisma.notification.updateMany({
 where: { id, userId },
 data: { isRead: true, readAt: new Date() },
 });
 return true;
 } catch {
 return false;
 }
}

/**
 * Get unread count for a user.
 */
export async function getUnreadCount(userId: string): Promise<number> {
 return prisma.notification.count({
 where: { userId, isRead: false },
 });
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllRead(userId: string): Promise<void> {
 try {
 await prisma.notification.updateMany({
 where: { userId, isRead: false },
 data: { isRead: true, readAt: new Date() },
 });
 } catch {
 // silent
 }
}
