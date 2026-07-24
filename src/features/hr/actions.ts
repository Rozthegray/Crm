'use server'

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import nodemailer from "nodemailer";

// ============================================================================
// SECURE MAIL DISPATCHER (Phase 4)
// ============================================================================
const sendDecisionEmail = async (email: string, name: string, isApproved: boolean) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });

    const subject = isApproved ? "Clearance Granted: Welcome to the Network" : "Clearance Denied: Application Rejected";
    const statusColor = isApproved ? "#10b981" : "#ef4444"; // Green or Red
    const statusText = isApproved ? "APPROVED & ACTIVE" : "REJECTED";
    const nextSteps = isApproved 
      ? "Your network restrictions have been lifted. You may now log into the portal to access your dashboard and departmental tools."
      : "Unfortunately, HR and Compliance could not verify your credentials at this time. Your account data will be purged from the system.";

    const mailOptions = {
      from: `"HR & Compliance" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #160f29;">
          <h2 style="color: #2a27fd;">Status Update, ${name}</h2>
          <p>The Human Resources department has reviewed your onboarding file.</p>
          <p><strong>Clearance Status: <span style="color: ${statusColor};">${statusText}</span></strong></p>
          <p>${nextSteps}</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888;">This is an automated security dispatch. Do not reply.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("SMTP Dispatch Error:", error);
  }
};

// ============================================================================
// SECURITY CLEARANCE (Upgraded with Showcase Override)
// ============================================================================
const verifyHrClearance = async () => {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("Unauthorized access.");
  }

  const { role, id } = session.user as any;


  // 🔴 THE SHOWCASE OVERRIDE: Admins & Super Admins bypass ALL delegation locks automatically!
  if (['ADMIN', 'SUPER_ADMIN'].includes(role)) {
    return session.user;
  }

  // If they are regular HR, enforce the delegation lock check
  if (role === 'HR') {
    // Self-contained DB check to ensure they haven't delegated their authority
    const activeDelegation = await db.delegation.findFirst({
      where: {
        delegatorId: id,
        isActive: true,
        endDate: { gte: new Date() }
      }
    });

    if (activeDelegation) {
      throw new Error("Delegation Lock Active: You cannot perform this action while your role is assigned to an acting lead.");
    }

    return session.user;
  }

  throw new Error("Unauthorized: HR or Branch Admin clearance required.");
};

// ============================================================================
// 1. FETCH ISOLATED BRANCH DATA
// ============================================================================
// ============================================================================
// 1. FETCH ISOLATED BRANCH DATA (With Super Admin Cross-Branch Override)
// ============================================================================
export async function getBranchDirectory() {
  try {
    const user = await verifyHrClearance();
    const isSuperAdmin = (user as any).role === 'SUPER_ADMIN';
    const targetBranchId = (user as any).branchId;  
    if (!isSuperAdmin && !targetBranchId) {
      return { 
        success: false, 
        error: "Critical: Your account is not assigned to a physical branch.",
        pending: [], 
        active: [] 
      };
    }

    const branchInfo = targetBranchId 
      ? await db.branch.findUnique({ where: { id: targetBranchId } })
      : null;

    // 🔴 SUPER ADMIN OVERRIDE: See all pending applications across all branches!
    const pending = await db.user.findMany({
      where: { 
        status: "PENDING_APPROVAL",
        ...(isSuperAdmin ? {} : { branchId: targetBranchId }) 
      },
      include: { branch: { select: { name: true } } },
      orderBy: { createdAt: 'asc' }
    });

    const active = await db.user.findMany({
      where: { 
        status: { not: "PENDING_APPROVAL" },
        ...(isSuperAdmin ? {} : { branchId: targetBranchId })
      },
      include: { branch: { select: { name: true } } },
      orderBy: { name: 'asc' }
    });

    return { 
      success: true, 
      adminName: user.name, 
      branchName: isSuperAdmin ? "Global Network (Super Admin)" : (branchInfo?.name || "Unknown Branch"),
      branchLocation: branchInfo?.location || "All Regional Branches",
      pending, 
      active 
    };
  } catch (error: any) {
    return { success: false, error: error.message, pending: [], active: [] };
  }
}

// ============================================================================
// 2. APPROVE EMPLOYEE (Now with Emails & Live Notifications)
// ============================================================================
export async function approveEmployeeAccount(employeeId: string, baseSalaryAmount: number) {
  try {
    const adminUser = await verifyHrClearance();

    const targetEmployee = await db.user.findUnique({ where: { id: employeeId } });
    
    // Cross-branch manipulation block (Admins bypass this too if they don't have a branchId restriction)
if ((adminUser as any).role === 'HR' && targetEmployee?.branchId !== (adminUser as any).branchId) {
        return { success: false, error: "Cross-branch manipulation strictly prohibited." };
    }

    // Set the 30-Day Rolling Epoch
    const nextPay = new Date();
    nextPay.setDate(nextPay.getDate() + 30);

    // Flip status, set salary, and start the clock
    const updatedEmployee = await db.user.update({
      where: { id: employeeId },
      data: { 
        status: "ACTIVE",
        baseSalary: baseSalaryAmount,
        nextPayDate: nextPay
      }
    });

    // Fire the live UI notification
    await db.notification.create({
      data: {
        userId: updatedEmployee.id,
        title: "Account Authorized",
        message: "Your account has been fully authorized by Human Resources. Welcome aboard.",
        type: "APPROVAL"
      }
    });

    // Fire the external SMTP email
    sendDecisionEmail(updatedEmployee.email, updatedEmployee.name, true);

    return { success: true };
  } catch (error: any) {
    console.error("Approval failed:", error);
    return { success: false, error: error.message || "Database transaction failed." };
  }
}

// ============================================================================
// 3. REJECT EMPLOYEE (Terminate & Notify)
// ============================================================================
export async function rejectEmployeeAccount(employeeId: string) {
  try {
    const adminUser = await verifyHrClearance();

    const targetEmployee = await db.user.findUnique({ where: { id: employeeId } });
    
if ((adminUser as any).role === 'HR' && targetEmployee?.branchId !== (adminUser as any).branchId) {
        return { success: false, error: "Cross-branch manipulation strictly prohibited." };
    }

    const updatedEmployee = await db.user.update({
      where: { id: employeeId },
      data: { status: "TERMINATED" } // Locks them out permanently
    });

    // Fire the external SMTP email
    sendDecisionEmail(updatedEmployee.email, updatedEmployee.name, false);

    return { success: true };
  } catch (error: any) {
    console.error("Rejection failed:", error);
    return { success: false, error: error.message || "Database transaction failed." };
  }
}

// ============================================================================
// 4. GET SINGLE EMPLOYEE BY ID
// ============================================================================
export async function getEmployeeById(userId: string) {
  try {
    const sessionUser = await verifyHrClearance();

    const employee = await db.user.findUnique({
      where: { id: userId },
      include: { branch: { select: { name: true } } }
    });

    if (!employee) {
      return { success: false, error: "Employee record not found in the database." };
    }

    if (sessionUser.role !== 'SUPER_ADMIN' && employee.branchId !== sessionUser.branchId) {
       return { success: false, error: "Clearance Denied: This personnel belongs to a different regional branch." };
    }

    return { success: true, employee };
  } catch (error: any) {
    console.error("Failed to fetch employee details:", error);
    return { success: false, error: error.message || "Internal server error while retrieving documents." };
  }
}

// ============================================================================
// 5. ADMIN UPDATE EMPLOYEE DETAILS
// ============================================================================
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
  try {
    // Utilize the unified clearance check here as well for maximum security parity
    await verifyHrClearance();

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
  } catch (error: any) {
    console.error("Failed to update employee:", error);
    return { success: false, error: error.message || "Database transaction failed." };
  }
}