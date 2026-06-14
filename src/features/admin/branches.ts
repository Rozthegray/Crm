'use server'

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// Ensure only SUPER_ADMIN can execute these actions
const verifySuperAdmin = async () => {
  const session = await auth();
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    throw new Error("Unauthorized: Super Admin clearance required.");
  }
};

export async function createNewBranch(formData: FormData) {
  await verifySuperAdmin();

  const name = formData.get('name') as string;
  const location = formData.get('location') as string;

  try {
    const branch = await db.branch.create({
      data: { name, location }
    });
    return { success: true, branch };
  } catch (error) {
    console.error("Failed to create branch:", error);
    return { success: false, error: "Branch name might already exist." };
  }
}

export async function getGlobalDashboardData() {
  try {
    // 1. Verify clearance inside the try/catch so it fails gracefully
    await verifySuperAdmin();

    // 2. Fetch all branches and their associated users
    const branches = await db.branch.findMany({
      include: {
        users: { select: { id: true, role: true, name: true, status: true } }
      }
    });

    let totalStaff = 0;
    let activeManagers = 0;

    // 3. Format branch data and calculate metrics
    const branchData = branches.map(b => {
      // Only count active staff towards the branch headcount
      const staff = b.users.filter(u => u.status === 'ACTIVE');
      const manager = staff.find(u => u.role === 'ADMIN');
      
      totalStaff += staff.length;
      if (manager) activeManagers++;

      return {
        id: b.id,
        name: b.name,
        location: b.location,
        manager: manager ? manager.name : 'Unassigned',
        staffCount: staff.length,
        established: b.established.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      };
    });

    // 4. Get total pending applications across the entire network
    const globalPendingApprovals = await db.user.count({
      where: { status: 'PENDING_APPROVAL' }
    });

    // 5. Fetch users who applied specifically for the ADMIN (Branch Manager) role
    const pendingAdmins = await db.user.findMany({
      where: { role: 'ADMIN', status: 'PENDING_APPROVAL' },
      include: { branch: { select: { name: true } } }
    });

    return {
      success: true,
      metrics: {
        totalBranches: branches.length,
        totalStaff,
        activeManagers,
        globalPendingApprovals
      },
      branches: branchData, // Replaces the comment that caused the crash!
      pendingAdmins
    };
  } catch (error: any) {
    // GRACEFUL CATCH: Returns the error to the frontend instead of crashing the server
    console.error("Dashboard fetch error:", error.message);
    return { success: false, error: error.message };
  }
}

export async function approveBranchManager(userId: string) {
  await verifySuperAdmin();

  try {
    await db.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' }
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to approve manager:", error);
    return { success: false, error: "Failed to update user status." };
  }
}