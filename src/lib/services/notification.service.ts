import { prisma } from "@/lib/prisma";

export async function createUserNotification(params: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
        data: params.data ? (params.data as any) : undefined,
      },
    });
  } catch (error) {
    console.error("Failed to create user notification:", error);
    // Don't throw, notifications shouldn't break the main flow
  }
}

export async function createBulkNotifications(params: {
  userIds: string[];
  type: string;
  title: string;
  message: string;
  link?: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  if (!params.userIds.length) return;

  try {
    await prisma.notification.createMany({
      data: params.userIds.map((userId) => ({
        userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
        data: params.data ? (params.data as any) : undefined,
      })),
    });
  } catch (error) {
    console.error("Failed to create bulk notifications:", error);
  }
}
