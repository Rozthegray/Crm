"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function getUserNotifications() {
  try {
    const session = await auth();
    if (!session || !session.user) return { success: false, error: "Unauthorized" };

    const notifications = await db.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20 // Keep the payload light, only show the 20 most recent
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return { success: true, notifications, unreadCount };
  } catch (error: any) {
    console.error("Fetch Notifications Error:", error.message);
    return { success: false, error: "Failed to fetch alerts" };
  }
}

export async function markNotificationsAsRead() {
  try {
    const session = await auth();
    if (!session || !session.user) return { success: false };

    await db.notification.updateMany({
      where: { 
        userId: session.user.id,
        isRead: false 
      },
      data: { isRead: true }
    });

    return { success: true };
  } catch (error) {
    return { success: false };
  }
}