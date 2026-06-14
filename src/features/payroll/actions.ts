'use server'

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { transmitSecureMessage } from "@/features/chat/actions";

// --- 1. FETCH PAYROLL DASHBOARD DATA ---
export async function getPayrollCommandData() {
  const session = await auth();
  if (!session || !session.user) return { success: false, error: "Unauthorized access." };

  const { role, branchId } = session.user;
  if (!['HR', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
    return { success: false, error: "Insufficient clearance." };
  }

  const userWhere: any = { role: { in: ['STAFF', 'HR'] } };
  const payrollWhere: any = {};

  if (role !== 'SUPER_ADMIN') {
    userWhere.branchId = branchId;
    payrollWhere.user = { branchId };
  }

  try {
    // 1. Get employees for Compensation Management
    const employees = await db.user.findMany({
      where: userWhere,
      select: { id: true, name: true, role: true, baseSalary: true, nextPayDate: true },
      orderBy: { name: 'asc' }
    });

    // 2. Get pending ledgers (Waiting for bulk disbursement)
    const pendingPayrolls = await db.payroll.findMany({
      where: { ...payrollWhere, isPaid: false },
      include: { user: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' }
    });

    // 3. Get historical ledgers
    const historicalPayrolls = await db.payroll.findMany({
      where: { ...payrollWhere, isPaid: true },
      include: { user: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit for performance
    });

    // Calculate KPIs
    const totalDisbursed = historicalPayrolls.reduce((sum, p) => sum + p.netPay, 0);
    const totalPending = pendingPayrolls.reduce((sum, p) => sum + p.netPay, 0);

    return { 
      success: true, 
      employees, 
      pendingPayrolls, 
      historicalPayrolls,
      kpis: { totalDisbursed, totalPending, pendingCount: pendingPayrolls.length }
    };
  } catch (error: any) {
    console.error("Payroll Fetch Error:", error);
    return { success: false, error: "Database transaction failed." };
  }
}

// --- 2. ASSIGN OR UPDATE BASE SALARY ---
export async function updateBaseSalary(userId: string, amount: number) {
  const session = await auth();
  if (!session || !session.user) return { success: false, error: "Unauthorized" };

  try {
    const nextPay = new Date();
    nextPay.setDate(nextPay.getDate() + 30); // Start the 30-day clock immediately

    await db.user.update({
      where: { id: userId },
      data: { baseSalary: amount, nextPayDate: nextPay }
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update compensation." };
  }
}

// --- 3. BULK DISBURSE PAYROLLS ---
export async function disbursePayrolls(payrollIds: string[]) {
  const session = await auth();
  if (!session || !session.user) return { success: false, error: "Unauthorized" };

  try {
    const transactions = payrollIds.map(id => 
      db.payroll.update({
        where: { id },
        data: { isPaid: true },
        include: { user: { select: { id: true, nextPayDate: true } } }
      })
    );

    const completed = await db.$transaction(transactions);

    // Notify employees via WebSocket & reset their 30-day clock
    for (const record of completed) {
      const nextPay = new Date();
      nextPay.setDate(nextPay.getDate() + 30);
      
      await db.user.update({
        where: { id: record.userId },
        data: { nextPayDate: nextPay }
      });

      await transmitSecureMessage(
        record.userId, 
        `💰 Your payroll of $${record.netPay.toLocaleString()} has been officially disbursed to your account.`
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Disbursement Error:", error);
    return { success: false, error: "Failed to process bulk disbursement." };
  }
}

// --- 4. FORCE MANUAL PAYOUT (Bypass Cron) ---
export async function forceManualPayout(userId: string, baseSalary: number) {
  try {
    const today = new Date();
    const nextPay = new Date();
    nextPay.setDate(nextPay.getDate() + 30);

    await db.$transaction([
      db.payroll.create({
        data: {
          userId,
          baseSalary,
          netPay: baseSalary,
          payPeriod: `Manual: ${today.toLocaleDateString()}`,
          isPaid: true
        }
      }),
      db.user.update({
        where: { id: userId },
        data: { nextPayDate: nextPay }
      })
    ]);

    await transmitSecureMessage(userId, `💰 A manual payout of $${baseSalary.toLocaleString()} was just disbursed to you.`);
    return { success: true };
  } catch (error) {
    return { success: false, error: "Manual payout failed." };
  }
}