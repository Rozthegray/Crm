'use server'

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { transmitSecureMessage } from "@/features/chat/actions";

// --- 1. SUBMIT LEAVE REQUEST ---
export async function submitLeaveRequest(formData: FormData) {
  const session = await auth();
  if (!session || !session.user) {
    return { success: false, error: "Unauthorized access." };
  }

  const type = formData.get('type') as any; // ANNUAL, SICK, etc.
  const startDateStr = formData.get('startDate') as string;
  const endDateStr = formData.get('endDate') as string;
  const reason = formData.get('reason') as string;

  if (!startDateStr || !endDateStr) {
    return { success: false, error: "Start and end dates are required." };
  }

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  // Calculate total days (inclusive)
  const diffTime = endDate.getTime() - startDate.getTime();
  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  if (totalDays <= 0) {
    return { success: false, error: "End date must be after start date." };
  }

  try {
    const leave = await db.leaveRequest.create({
      data: {
        userId: session.user.id,
        type,
        startDate,
        endDate,
        totalDays,
        daysRemaining: totalDays, // Initial remaining days equals total days
        reason,
        status: 'PENDING'
      }
    });

    return { success: true, leave };
  } catch (error: any) {
    console.error("Leave Submission Error:", error.message);
    return { success: false, error: "Failed to submit leave request." };
  }
}

// --- 2. FETCH PERSONAL LEAVE HISTORY (For Employee Portal) ---
export async function getMyLeaveHistory() {
  const session = await auth();
  if (!session || !session.user) {
    return { success: false, error: "Unauthorized access." };
  }

  try {
    const leaves = await db.leaveRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, leaves };
  } catch (error: any) {
    console.error("Leave History Error:", error.message);
    return { success: false, error: "Failed to fetch leave history." };
  }
}

export async function getPendingLeaveRequests() {
  const session = await auth();
  if (!session || !session.user) return { success: false, error: "Unauthorized access." };

const { role, branchId } = session.user as any;
  
  // Hierarchical Routing Logic
  let targetRoles: string[] = [];
  if (role === 'HR') targetRoles = ['STAFF'];
  if (role === 'ADMIN') targetRoles = ['HR', 'STAFF'];
  if (role === 'SUPER_ADMIN') targetRoles = ['ADMIN', 'HR', 'STAFF'];

  if (targetRoles.length === 0) {
    return { success: false, error: "Insufficient clearance to view the approval queue." };
  }

  // Build the dynamic query
  const whereClause: any = {
    status: 'PENDING',
    user: { role: { in: targetRoles } }
  };

  // Lock HR and Admins to their specific branch. Super Admins see the global queue.
  if (role !== 'SUPER_ADMIN') {
    whereClause.user.branchId = branchId;
  }

  try {
    const pendingLeaves = await db.leaveRequest.findMany({
      where: whereClause,
      include: { 
        user: { select: { id: true, name: true, role: true, avatarUrl: true } } 
      },
      orderBy: { createdAt: 'asc' }
    });

    return { success: true, pendingLeaves };
  } catch (error: any) {
    console.error("Queue Fetch Error:", error);
    return { success: false, error: "Failed to retrieve the approval queue." };
  }
}

// --- 4. RESOLVE LEAVE REQUEST (Approve / Reject) ---
export async function resolveLeaveRequest(leaveId: string, resolution: 'APPROVED' | 'REJECTED') {
  const session = await auth();
  if (!session || !session.user) return { success: false, error: "Unauthorized." };

  try {
    // 1. Update the database
    const updatedLeave = await db.leaveRequest.update({
      where: { id: leaveId },
      data: { 
        status: resolution,
        approverId: session.user.id 
      },
      include: { user: { select: { id: true, name: true } } }
    });

    // 2. Fire the Real-Time Socket Notification!
    const message = resolution === 'APPROVED' 
      ? `🟢 Your ${updatedLeave.type.replace('_', ' ')} request has been officially APPROVED.`
      : `🔴 Your ${updatedLeave.type.replace('_', ' ')} request was REJECTED by command.`;
      
    await transmitSecureMessage(updatedLeave.user.id, message);

    return { success: true };
  } catch (error) {
    console.error("Resolution Error:", error);
    return { success: false, error: "Failed to resolve the request." };
  }
}

// --- 5. FETCH MASTER LEAVE LEDGER (For HR/Admin Audit) ---
export async function getCompanyLeaveLedger() {
  const session = await auth();
  if (!session || !session.user) return { success: false, error: "Unauthorized access." };

  const { role, branchId } = session.user;

  // Hierarchical Routing
  let targetRoles: string[] = [];
  if (role === 'HR') targetRoles = ['STAFF'];
  if (role === 'ADMIN') targetRoles = ['HR', 'STAFF'];
  if (role === 'SUPER_ADMIN') targetRoles = ['ADMIN', 'HR', 'STAFF'];

  if (targetRoles.length === 0) return { success: false, error: "Insufficient clearance." };

  const whereClause: any = {
    user: { role: { in: targetRoles } }
  };

  // Branch isolation
  if (role !== 'SUPER_ADMIN') {
    whereClause.user.branchId = branchId;
  }

  try {
    const ledger = await db.leaveRequest.findMany({
      where: whereClause,
      include: { 
        user: { select: { name: true, role: true } } 
      },
      orderBy: { createdAt: 'desc' } // Newest first
    });

    return { success: true, ledger };
  } catch (error: any) {
    console.error("Ledger Fetch Error:", error);
    return { success: false, error: "Failed to retrieve the master ledger." };
  }
}
