/**
 * Admin Notification Service
 * CRUD helpers for AdminNotification model.
 */

import { prisma } from "@/lib/prisma";

export interface AdminNotificationInput {
 type: string;
 title: string;
 message: string;
 link?: string;
 priority?: string;
}

export interface NotificationFilters {
 type?: string;
 priority?: string;
 isRead?: boolean;
 search?: string;
 page?: number;
 limit?: number;
}

export interface NotifStats {
 total: number;
 unread: number;
 byType: Record<string, number>;
 byPriority: Record<string, number>;
 today: number;
}

/**
 * Create a single admin notification.
 */
export async function createAdminNotification(
 data: AdminNotificationInput
): Promise<void> {
 try {
 await prisma.adminNotification.create({
 data: {
 type: data.type,
 title: data.title,
 message: data.message,
 link: data.link ?? null,
 priority: data.priority ?? "normal",
 },
 });
 } catch {
 // silent — fire-and-forget
 }
}

/**
 * Create multiple notifications in batch.
 */
export async function createBulkNotifications(
 items: AdminNotificationInput[]
): Promise<void> {
 if (items.length === 0) return;
 try {
 await prisma.adminNotification.createMany({
 data: items.map((item) => ({
 type: item.type,
 title: item.title,
 message: item.message,
 link: item.link ?? null,
 priority: item.priority ?? "normal",
 })),
 });
 } catch {
 // silent
 }
}

/**
 * Get notification statistics.
 */
export async function getNotificationStats(): Promise<NotifStats> {
 const [total, unread, byType, byPriority, today] = await Promise.all([
 prisma.adminNotification.count(),
 prisma.adminNotification.count({ where: { isRead: false } }),
 prisma.adminNotification.groupBy({
 by: ["type"],
 _count: { type: true },
 }),
 prisma.adminNotification.groupBy({
 by: ["priority"],
 _count: { priority: true },
 }),
 prisma.adminNotification.count({
 where: {
 createdAt: {
 gte: new Date(new Date().setHours(0, 0, 0, 0)),
 },
 },
 }),
 ]);

 const byTypeMap: Record<string, number> = {};
 for (const row of byType) {
 byTypeMap[row.type] = row._count.type;
 }

 const byPriorityMap: Record<string, number> = {};
 for (const row of byPriority) {
 byPriorityMap[row.priority] = row._count.priority;
 }

 return { total, unread, byType: byTypeMap, byPriority: byPriorityMap, today };
}

/**
 * Mark a notification as read.
 */
export async function markRead(id: string): Promise<void> {
 try {
 await prisma.adminNotification.update({
 where: { id },
 data: { isRead: true, readAt: new Date() },
 });
 } catch {
 // silent
 }
}

/**
 * Mark multiple notifications as read.
 */
export async function markReadBulk(ids: string[]): Promise<void> {
 if (ids.length === 0) return;
 try {
 await prisma.adminNotification.updateMany({
 where: { id: { in: ids } },
 data: { isRead: true, readAt: new Date() },
 });
 } catch {
 // silent
 }
}

/**
 * Delete a notification.
 */
export async function deleteNotification(id: string): Promise<void> {
 try {
 await prisma.adminNotification.delete({ where: { id } });
 } catch {
 // silent
 }
}

/**
 * Archive notifications (mark as read without deleting).
 */
export async function archiveNotification(id: string): Promise<void> {
 await markRead(id);
}

/**
 * Bulk archive.
 */
export async function bulkArchive(ids: string[]): Promise<void> {
 await markReadBulk(ids);
}

/**
 * List notifications with filters + pagination.
 */
export async function listAdminNotifications(filters: NotificationFilters) {
 const where: Record<string, unknown> = {};

 if (filters.type && filters.type !== "all") {
 where.type = filters.type;
 }
 if (filters.priority && filters.priority !== "all") {
 where.priority = filters.priority;
 }
 if (filters.isRead !== undefined) {
 where.isRead = filters.isRead;
 }
 if (filters.search) {
 where.OR = [
 { title: { contains: filters.search, mode: "insensitive" } },
 { message: { contains: filters.search, mode: "insensitive" } },
 ];
 }

 const page = filters.page ?? 1;
 const limit = filters.limit ?? 20;
 const skip = (page - 1) * limit;

 const [items, total] = await Promise.all([
 prisma.adminNotification.findMany({
 where,
 orderBy: { createdAt: "desc" },
 skip,
 take: limit,
 }),
 prisma.adminNotification.count({ where }),
 ]);

 return { items, total, page, limit };
}
