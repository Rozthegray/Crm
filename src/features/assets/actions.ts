"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// ============================================================================
// 1. INITIATE REQUISITION TICKET (Employee Action)
// ============================================================================
export async function requestAsset(deviceType: string, reason: string) {
  try {
    const session = await auth();
    if (!session || !session.user) return { success: false, error: "Unauthorized access." };

    const request = await db.assetRequest.create({
      data: {
        userId: session.user.id,
        deviceType,
        reason,
        status: "PENDING"
      }
    });

    // Automatically alert IT and Admins about the new ticket
    const itStaff = await db.user.findMany({
      where: { role: { in: ['IT_DIGITAL', 'ADMIN', 'SUPER_ADMIN'] } },
      select: { id: true }
    });
    
    if (itStaff.length > 0) {
        await db.notification.createMany({
          data: itStaff.map((it: any) => ({
          userId: it.id,
          title: "New Asset Requisition",
          message: `${session?.user?.name || 'A team member'} has requested a ${deviceType}.`, 
          type: "SYSTEM"
        }))
      });
    }

    return { success: true, request };
  } catch (error: any) {
    console.error("Asset Request Error:", error.message);
    return { success: false, error: "Failed to submit asset requisition ticket." };
  }
}

// ============================================================================
// 2. PROCESS & FULFILL REQUISITION (IT / Admin Action)
// ============================================================================
export async function processAssetRequest(
  requestId: string, 
  action: "REJECT" | "FULFILL", 
  hardwareAssetId?: string
) {
  try {
    const session = await auth();
    
    // HARD GUARD: Tells TS session.user is guaranteed below this line
    if (!session || !session.user) return { success: false, error: "Unauthorized access." };

    // Role verification using Type Override
    if (!['IT_DIGITAL', 'ADMIN', 'SUPER_ADMIN', 'HR'].includes((session.user as any).role)) {
      return { success: false, error: "Security Exception: Insufficient clearance to process assets." };
    }

    const request = await db.assetRequest.findUnique({ where: { id: requestId } });
    if (!request) return { success: false, error: "Requisition ticket not found." };

    // PATH A: Ticket is Rejected
    if (action === "REJECT") {
      await db.assetRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED", approverId: session.user.id }
      });
      
      await db.notification.create({
        data: { 
          userId: request.userId, 
          title: "Asset Request Denied", 
          message: `Your requisition for a ${request.deviceType} was not approved.`, 
          type: "SYSTEM" 
        }
      });
      return { success: true };
    }

    // PATH B: Ticket is Fulfilled (Atomic Transaction)
    if (action === "FULFILL") {
      if (!hardwareAssetId) {
        return { success: false, error: "A specific Hardware Asset ID must be mapped to fulfill this request." };
      }

    const result = await db.$transaction(async (prisma: any) => {
          // 1. Assign the hardware to the employee in the inventory ledger
        await prisma.hardwareAsset.update({
          where: { id: hardwareAssetId },
          data: { 
            assignedToId: request.userId, 
            status: "ASSIGNED" 
          }
        });

        // 2. Close the ticket and link the specific hardware ID
        const fulfilledRequest = await prisma.assetRequest.update({
          where: { id: requestId },
          data: { 
            status: "FULFILLED", 
            approverId: session.user.id, 
            fulfilledWithId: hardwareAssetId 
          }
        });

        // 3. Notify the employee their gear is ready
        await prisma.notification.create({
          data: { 
            userId: request.userId, 
            title: "Asset Request Fulfilled", 
            message: `Your ${request.deviceType} has been assigned. Please see IT for pickup.`, 
            type: "SYSTEM" 
          }
        });

        return fulfilledRequest;
      });

      return { success: true, request: result };
    }

  } catch (error: any) {
    console.error("Asset Processing Error:", error.message);
    return { success: false, error: "Failed to process the requisition ticket. Transaction rolled back." };
  }
}

// ============================================================================
// 3. FETCH PENDING TICKETS (For IT Dashboard)
// ============================================================================
export async function getPendingAssetRequests() {
  try {
    const session = await auth();
    
    // HARD GUARD + NextAuth Type Override
    if (!session || !session.user || !['IT_DIGITAL', 'ADMIN', 'SUPER_ADMIN'].includes((session.user as any).role)) {
      return { success: false, error: "Unauthorized" };
    }

    const requests = await db.assetRequest.findMany({
      where: { status: "PENDING" },
      include: {
        user: { select: { name: true, role: true, branch: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'asc' }
    });

    return { success: true, requests };
  } catch (error: any) {
    return { success: false, error: "Failed to load requisition queue." };
  }
}