'use server'

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { sendMissedMessageEmail } from "@/lib/comms";
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
await sendMissedMessageEmail(receiver.email, session?.user?.name || 'A team member', content);
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

const { role, branchId, id } = session.user as any;

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

// --- 4. SEND & SAVE DIRECT MESSAGE (Optimized for Images) ---
export async function sendDirectMessage(receiverId: string, content?: string, imageUrl?: string) {
  const session = await auth();
  if (!session || !session.user) return { success: false, error: "Unauthorized" };

  // Ensure at least text or an image is being sent
  if (!content && !imageUrl) return { success: false, error: "Empty payloads are rejected." };

  try {
    // 1. Save to the immutable database ledger
    const savedMessage = await db.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
        content: content || null,
        imageUrl: imageUrl || null
      }
    });

    // 2. Transmit instantly via WebSockets
    await pusherServer.trigger(`private-user-${receiverId}`, 'secure-message', {
      id: savedMessage.id,
      message: content,
      imageUrl: imageUrl,
      senderId: session.user.id,
      timestamp: savedMessage.createdAt,
      isDeleted: false
    });

    return { success: true, message: savedMessage };
  } catch (error) {
    console.error("Send Error:", error);
    return { success: false, error: "Failed to send message." };
  }
}

// --- 5. BROADCAST MESSAGE (Admin to All/Selected Roles) ---
export async function broadcastMessage(content: string, targetRole?: string, imageUrl?: string) {
  const session = await auth();
  // Ensure only high-level clearances can broadcast
  if (!session?.user || !['ADMIN', 'SUPER_ADMIN', 'HR'].includes(session.user.role)) {
    return { success: false, error: "Security Exception: Insufficient clearance for broadcast." };
  }

  try {
    // Save to DB (receiverId null = global broadcast)
    const savedMessage = await db.message.create({ 
      data: { 
        content, 
        imageUrl: imageUrl || null,
        senderId: session.user.id 
      } 
    });
    
    // Broadcast to a global channel or a targeted role channel
    const channelName = targetRole ? `role-channel-${targetRole}` : 'global-channel';
    
    await pusherServer.trigger(channelName, 'new-broadcast', {
      id: savedMessage.id,
      message: content,
      imageUrl: imageUrl,
      senderId: session.user.id,
      timestamp: savedMessage.createdAt,
      isDeleted: false,
      isBroadcast: true
    });

    return { success: true, message: savedMessage };
  } catch (error) {
    console.error("Broadcast Error:", error);
    return { success: false, error: "Failed to broadcast network message." };
  }
}

// --- 6. DELETE MESSAGE (Soft Delete) ---
export async function deleteMessage(messageId: string) {
  const session = await auth();
  if (!session || !session.user) return { success: false, error: "Unauthorized" };

  try {
    const msg = await db.message.findUnique({ where: { id: messageId } });
    
    if (!msg) return { success: false, error: "Message record not found." };

    // Strict validation: Only the original sender or an Admin can scrub a message
    const canDelete = msg.senderId === session.user.id || ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);
    if (!canDelete) return { success: false, error: "Security Exception: Unauthorized to alter this record." };

    // Soft delete to maintain audit log integrity
    await db.message.update({ 
      where: { id: messageId }, 
      data: { isDeleted: true } 
    });

    // Notify connected clients to instantly mask the UI
    if (msg.receiverId) {
      await pusherServer.trigger(`private-user-${msg.receiverId}`, 'message-deleted', { messageId });
      await pusherServer.trigger(`private-user-${msg.senderId}`, 'message-deleted', { messageId });
    } else {
      await pusherServer.trigger('global-channel', 'message-deleted', { messageId });
    }

    return { success: true };
  } catch (error) {
    console.error("Delete Error:", error);
    return { success: false, error: "Failed to process message deletion protocol." };
  }
}