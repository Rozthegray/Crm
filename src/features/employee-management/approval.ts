'use server'

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function approveEmployeeAccount(userIdToApprove: string) {
  const session = await auth();
  
  // Security Check: Only HR or SUPER_ADMIN can approve
if (!session || !['HR', 'SUPER_ADMIN'].includes((session?.user as any)?.role)) {
      throw new Error("Unauthorized");
  }

  // 1. Fetch the user to ensure HR isn't approving someone from another branch
  const targetUser = await db.user.findUnique({ where: { id: userIdToApprove } });
  
if ((session?.user as any)?.role === 'HR' && targetUser?.branchId !== (session?.user as any)?.branchId) {
      throw new Error("You can only approve employees in your own branch.");
  }

  // 2. Make the account LIVE
  await db.user.update({
    where: { id: userIdToApprove },
    data: { status: "ACTIVE" }
  });

  // 3. Trigger "Welcome to the Bank" email
  // await sendSystemNotification(targetUser.email, "Account Activated", "Your account is now live. You may log in.");

  return { success: true };
}