"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function getDepartmentTeam() {
  try {
    const session = await auth();
if (!session || !session.user || !(session.user as any).branchId) {
        return { success: false, error: "Unauthorized or unassigned to a branch." };
    }

    const team = await db.user.findMany({
      where: { 
        branchId: session.user.branchId,
        status: "ACTIVE" 
      },
      select: { 
        id: true, 
        name: true, 
        role: true, 
        avatarUrl: true 
      },
      orderBy: { name: 'asc' }
    });

    return { success: true, team };
  } catch (error: any) {
    return { success: false, error: "Failed to retrieve department personnel." };
  }
}