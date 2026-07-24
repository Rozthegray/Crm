"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// ============================================================================
// 1. FETCH BRANCH ROSTER
// ============================================================================
export async function getBranchRoster(date: Date) {
  try {
    const session = await auth();
    if (!session || !session.user) return { success: false, error: "Unauthorized" };

    // Set boundaries for the specific day
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const shifts = await db.shift.findMany({
      where: {
        // VERCEL FIX: Override strict NextAuth session typing for custom field
        branchId: (session.user as any).branchId!,
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        user: { select: { id: true, name: true, role: true, avatarUrl: true } }
      },
      orderBy: { startTime: 'asc' }
    });

    return { success: true, shifts };
  } catch (error: any) {
    console.error("Roster Fetch Error:", error.message);
    return { success: false, error: "Failed to retrieve branch roster." };
  }
}

// ============================================================================
// 2. ASSIGN OR UPDATE SHIFT
// ============================================================================
export async function assignShift(data: {
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  station: string;
  notes?: string;
}) {
  try {
    const session = await auth();
    
    // VERCEL FIX: Extract custom role and branch safely before checking
    const userRole = (session?.user as any)?.role;
    const branchId = (session?.user as any)?.branchId;

    if (!session || !['HR', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      return { success: false, error: "Insufficient clearance to assign shifts." };
    }

    const shiftDate = new Date(data.date);
    const start = new Date(`${data.date}T${data.startTime}:00`);
    const end = new Date(`${data.date}T${data.endTime}:00`);

    const newShift = await db.shift.create({
      data: {
        userId: data.userId,
        branchId: branchId!,
        date: shiftDate,
        startTime: start,
        endTime: end,
        station: data.station as any,
        notes: data.notes
      }
    });

    // Notify the employee
    await db.notification.create({
      data: {
        userId: data.userId,
        title: "New Shift Assigned",
        message: `You have been assigned to ${data.station.replace('_', ' ')} on ${shiftDate.toLocaleDateString()}.`,
        type: "SYSTEM"
      }
    });

    return { success: true, shift: newShift };
  } catch (error: any) {
    console.error("Shift Assignment Error:", error.message);
    return { success: false, error: "Failed to securely write shift data." };
  }
}