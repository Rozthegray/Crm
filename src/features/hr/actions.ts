'use server'

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// --- SECURITY CLEARANCE ---
const verifyHrClearance = async () => {
  const session = await auth();
  
  // ALLOW BOTH HR AND BRANCH ADMINS TO MANAGE PERSONNEL
  const currentUser = session?.user as any;
  if (!session || !currentUser || !['HR', 'SUPER_ADMIN', 'ADMIN'].includes(currentUser.role)) {
    throw new Error("Unauthorized: HR or Branch Admin clearance required.");
  }
  return currentUser;
}; // <-- THE MISSING BRACKET FIX IS HERE!

// --- 1. FETCH ISOLATED BRANCH DATA ---
export async function getBranchDirectory() {
  const user = await verifyHrClearance();
  const targetBranchId = user.branchId;

  if (!targetBranchId) {
    return { 
      success: false, 
      error: "Critical: Your account is not assigned to a physical branch.",
      pending: [], 
      active: [] 
    };
  }

  // Fetch REAL Branch Identity
  const branchInfo = await db.branch.findUnique({
    where: { id: targetBranchId }
  });

  // Fetch REAL Pending Staff
  const pending = await db.user.findMany({
    where: { branchId: targetBranchId, status: "PENDING_APPROVAL" },
    orderBy: { createdAt: 'asc' }
  });

  // Fetch REAL Active Staff
  const active = await db.user.findMany({
    where: { branchId: targetBranchId, status: { not: "PENDING_APPROVAL" } },
    include: { branch: { select: { name: true } } },
    orderBy: { name: 'asc' }
  });

  return { 
    success: true, 
    adminName: user.name, 
    branchName: branchInfo?.name || "Unknown Branch",
    branchLocation: branchInfo?.location || "Unknown Location",
    pending, 
    active 
  };
}

// --- 2. APPROVE EMPLOYEE ---
export async function approveEmployeeAccount(employeeId: string, baseSalaryAmount: number) {
  const adminUser = await verifyHrClearance();

  try {
    const targetEmployee = await db.user.findUnique({ where: { id: employeeId } });
    
    if (adminUser.role === 'HR' && targetEmployee?.branchId !== adminUser.branchId) {
      return { success: false, error: "Cross-branch manipulation strictly prohibited." };
    }

    // Set the 30-Day Rolling Epoch
    const nextPay = new Date();
    nextPay.setDate(nextPay.getDate() + 30);

    // Flip status, set salary, and start the clock!
    await db.user.update({
      where: { id: employeeId },
      data: { 
        status: "ACTIVE",
        baseSalary: baseSalaryAmount,
        nextPayDate: nextPay
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Approval failed:", error);
    return { success: false, error: "Database transaction failed." };
  }
}

// --- 3. GET SINGLE EMPLOYEE BY ID ---
export async function getEmployeeById(userId: string) {
  try {
    // Verify who is asking for the data
    const sessionUser = await verifyHrClearance();

    // Fetch the target employee
    const employee = await db.user.findUnique({
      where: { id: userId },
      include: { branch: { select: { name: true } } }
    });

    if (!employee) {
      return { success: false, error: "Employee record not found in the database." };
    }

    // SECURE THE PERIMETER: 
    // If the requester is an ADMIN or HR, they can ONLY view their own branch staff.
    // SUPER_ADMIN skips this check and can view anyone.
    if (sessionUser.role !== 'SUPER_ADMIN' && employee.branchId !== sessionUser.branchId) {
       return { success: false, error: "Clearance Denied: This personnel belongs to a different regional branch." };
    }

    return { success: true, employee };
  } catch (error: any) {
    console.error("Failed to fetch employee details:", error);
    return { success: false, error: "Internal server error while retrieving documents." };
  }
}

// --- 5. ADMIN UPDATE EMPLOYEE DETAILS ---
export async function adminUpdateEmployee(employeeId: string, data: { 
  name?: string, 
  phone?: string, 
  address?: string, 
  nin?: string, 
  birthDate?: string,
  role: string, 
  status: string, 
  baseSalary: number | null 
}) {
  const session = await auth();
  const currentUser = session?.user as any; // Type bypass added here too for safety!
  
  if (!session || !currentUser || currentUser.role === 'STAFF') {
    return { success: false, error: "Unauthorized. Admin credentials required." };
  }

  try {
    await db.user.update({
      where: { id: employeeId },
      data: {
        name: data.name,
        phone: data.phone,
        address: data.address,
        nin: data.nin,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        role: data.role as any,
        status: data.status as any,
        baseSalary: data.baseSalary,
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to update employee:", error);
    return { success: false, error: "Database transaction failed." };
  }
}
