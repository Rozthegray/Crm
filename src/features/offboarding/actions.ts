"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// ============================================================================
// PHASE 8: THE IDEMPOTENT TERMINATION PROTOCOL
// ============================================================================
export async function terminateEmployee(targetUserId: string, notes: string = "") {
  try {
    const session = await auth();
    
    // 1. Verify Authorization (Must be HR, ADMIN, or SUPER_ADMIN)
    if (!session || !session.user || !['HR', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return { success: false, error: "Unauthorized: Insufficient clearance for termination protocol." };
    }

    // 2. Prevent self-termination
    if (session.user.id === targetUserId) {
      return { success: false, error: "Security Exception: You cannot initiate termination on your own account." };
    }

    // 3. Execute the Atomic Transaction
    const result = await db.$transaction(async (prisma) => {
      
      // A. Lock the Account instantly. 
      // (NextAuth session checks in middleware will bounce them on their next click)
      const terminatedUser = await prisma.user.update({
        where: { id: targetUserId },
        data: { status: "TERMINATED" }
      });

      // B. Freeze Active Leaves
      await prisma.leaveRequest.updateMany({
        where: { 
          userId: targetUserId, 
          status: { in: ['PENDING', 'APPROVED', 'ACTIVE', 'PAUSED'] } 
        },
        data: { 
          status: "REJECTED", 
          reason: "Auto-rejected by system: Employee offboarding protocol initiated." 
        }
      });

      // C. Audit Hardware Assets
      const activeAssets = await prisma.hardwareAsset.findMany({
        where: { assignedToId: targetUserId, status: "ASSIGNED" }
      });
      const hasAssets = activeAssets.length > 0;

      // D. Generate the Immutable Offboarding Ledger Record
      const offboardingRecord = await prisma.offboardingRecord.create({
        data: {
          userId: targetUserId,
          processedById: session.user.id,
          payrollFrozen: true,
          accessRevoked: true,
          assetsRecovered: !hasAssets, // Marked false if they still hold company hardware
          notes: notes || `Offboarding processed automatically.`
        }
      });

      // E. Write to the Immutable Audit Log for Compliance
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: "EMPLOYEE_TERMINATED",
          entityType: "USER",
          entityId: targetUserId,
          details: { assetCount: activeAssets.length, timestamp: new Date().toISOString() },
          severity: "CRITICAL"
        }
      });

      // F. Trigger IT & Recovery Alerts
      if (hasAssets) {
        // Find IT and Admin staff to notify about the unreturned hardware
        const itStaff = await prisma.user.findMany({
          where: { role: { in: ['IT_DIGITAL', 'ADMIN', 'SUPER_ADMIN'] } },
          select: { id: true }
        });
        
        if (itStaff.length > 0) {
          const notifications = itStaff.map(it => ({
            userId: it.id,
            title: "CRITICAL: Hardware Recovery Required",
            message: `Employee ${terminatedUser.name} was terminated. Please recover ${activeAssets.length} assigned asset(s) immediately.`,
            type: "SYSTEM"
          }));
          await prisma.notification.createMany({ data: notifications });
        }
      }

      return { terminatedUser, offboardingRecord };
    });

    return { success: true, data: result };

  } catch (error: any) {
    console.error("Termination Protocol Error:", error.message);
    return { success: false, error: "Failed to execute termination protocol. Transaction rolled back." };
  }
}

// ============================================================================
// FETCH STAFF FOR OFFBOARDING 
// ============================================================================
export async function getStaffForOffboarding() {
  try {
    const session = await auth();
    if (!session || !['HR', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    const staff = await db.user.findMany({
      where: { 
        status: { in: ["ACTIVE", "PENDING_APPROVAL"] },
        role: { not: "SUPER_ADMIN" } // Protect super admins from UI termination
      },
      select: {
        id: true,
        name: true,
        role: true,
        branch: { select: { name: true } },
        assets: {
          where: { status: "ASSIGNED" },
          select: { id: true, tagNumber: true, deviceType: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return { success: true, staff };
  } catch (error: any) {
    return { success: false, error: "Failed to fetch staff data." };
  }
}