'use server'

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { sendMissedMessageEmail } from "@/lib/comms";
// Import your new central Pusher hub here!
import { pusherServer } from "@/lib/pusher";

// --- 1. SYSTEM NOTIFICATIONS (Ephemeral) ---
export async function transmitSecureMessage(receiverId: string, content: string) {
  const session = await auth();
  if (!session || !session.user) return { success: false, error: "Clearance required." };

  try {
    const messagePayload = {
      id: crypto.randomUUID(),
      senderId: session.user.id,
      senderName: session.user.name,
      content,
      timestamp: new Date().toISOString()
    };

    // Blast the message through the Socket Network
    await pusherServer.trigger(
      `private-user-${receiverId}`, 
      'incoming-message', 
      messagePayload
    );

    // Smart Email Fallback
    const receiver = await db.user.findUnique({ 
      where: { id: receiverId },
      select: { email: true, isOnline: true } 
    });

    if (receiver && !receiver.isOnline) {
    await sendMissedMessageEmail(receiver.email, session.user.name || "A Colleague", content);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Transmission failed:", error);
    return { success: false, error: "Network anomaly detected." };
  }
}

// --- 2. FETCH COLLEAGUE DIRECTORY ---
export async function getChatDirectory() {
  const session = await auth();
  if (!session || !session.user) return { success: false, error: "Unauthorized access." };

  const { role, branchId, id } = session.user;

  try {
    // Basic rule: Don't show the user themselves in their own chat list
    const whereClause: any = {
      id: { not: id },
      status: 'ACTIVE' // Only show active employees
    };

    // Lock everyone except Super Admins to their specific branch
    if (role !== 'SUPER_ADMIN') {
      whereClause.branchId = branchId;
    }

    const contacts = await db.user.findMany({
      where: whereClause,
      select: { 
        id: true, 
        name: true, 
        role: true, 
        avatarUrl: true, 
        isOnline: true 
      },
      orderBy: { name: 'asc' }
    });

    return { success: true, contacts };
  } catch (error) {
    console.error("Directory Fetch Error:", error);
    return { success: false, error: "Failed to retrieve the communications directory." };
  }
}

// --- 3. FETCH DIRECT MESSAGE HISTORY ---
export async function getChatHistory(contactId: string) {
  const session = await auth();
  if (!session || !session.user) return { success: false, error: "Unauthorized" };

  try {
    const messages = await db.message.findMany({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: contactId },
          { senderId: contactId, receiverId: session.user.id }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });

    return { success: true, messages };
  } catch (error) {
    console.error("History Fetch Error:", error);
    return { success: false, error: "Failed to load chat history." };
  }
}

// --- 4. SEND & SAVE DIRECT MESSAGE ---
export async function sendDirectMessage(receiverId: string, content: string) {
  const session = await auth();
  if (!session || !session.user) return { success: false, error: "Unauthorized" };

  try {
    // 1. Save to the immutable database ledger
    const savedMessage = await db.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
        content
      }
    });

    // 2. Transmit instantly via WebSockets (attaching the senderId so it routes correctly)
    await pusherServer.trigger(`private-user-${receiverId}`, 'secure-message', {
      message: content,
      senderId: session.user.id, // CRITICAL: This tells the recipient who sent it
      timestamp: savedMessage.createdAt
    });

    return { success: true, message: savedMessage };
  } catch (error) {
    console.error("Send Error:", error);
    return { success: false, error: "Failed to send message." };
  }
}
