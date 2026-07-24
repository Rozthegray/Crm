'use server'

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function getEmployeeDashboardData() {
  const session = await auth();
  if (!session || !session.user) {
    return { success: false, error: "Unauthorized access." };
  }

  const userId = session.user.id;

  try {
    // 1. Fetch User Data & Birthday Logic
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true, role: true, birthDate: true, nextPayDate: true }
    });

    let isBirthday = false;
    if (user?.birthDate) {
      const today = new Date();
      const bday = new Date(user.birthDate);
      isBirthday = (today.getMonth() === bday.getMonth() && today.getDate() === bday.getDate());
    }

    // 2. Fetch Payroll History
    const payrolls = await db.payroll.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5 // Last 5 payslips
    });

    // 3. Fetch Leave Balances & Recent Requests
    // Standard limit is 14 days. Subtract any approved/completed ANNUAL days.
    const leaves = await db.leaveRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const usedAnnualDays = leaves
        .filter((l: any) => l.type === 'ANNUAL' && (l.status === 'APPROVED' || l.status === 'COMPLETED'))
        .reduce((acc: any, curr: any) => acc + curr.totalDays, 0);

        
    const remainingAnnualLeave = Math.max(0, 14 - usedAnnualDays);
    const recentLeaves = leaves.slice(0, 3); // Grab latest 3 for the mini-widget

    return {
      success: true,
      userData: {
        name: user?.name,
        role: user?.role,
        isBirthday,
        nextPayDate: user?.nextPayDate
      },
      payrolls,
      leaveData: {
        remainingAnnualLeave,
        recentLeaves
      }
    };

  } catch (error: any) {
    console.error("Dashboard fetch error:", error.message);
    return { success: false, error: "Failed to load workspace data." };
  }
}

export async function updateEmployeeProfile(data: { phone: string; address: string }) {
  const session = await auth();
  if (!session || !session.user) return { success: false, error: "Unauthorized" };

  try {
    await db.user.update({
      where: { id: session.user.id },
      data: {
        phone: data.phone,
        address: data.address,
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Profile Update Error:", error);
    return { success: false, error: "Database transaction failed." };
  }
}