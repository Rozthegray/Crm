"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// ============================================================================
// 1. FETCH POLICIES (Accessible to all active staff)
// ============================================================================
export async function getPolicies(categoryFilter?: string) {
  try {
    const session = await auth();
    if (!session || !session.user) return { success: false, error: "Unauthorized access." };

    const whereClause: any = { isPublished: true };
    if (categoryFilter && categoryFilter !== 'ALL') {
      whereClause.category = categoryFilter;
    }

    const policies = await db.companyPolicy.findMany({
      where: whereClause,
      include: {
        author: { select: { name: true, role: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return { success: true, policies };
  } catch (error: any) {
    console.error("Knowledge Base Fetch Error:", error.message);
    return { success: false, error: "Failed to retrieve corporate policies." };
  }
}

// ============================================================================
// 2. PUBLISH NEW POLICY (HR / Admin Action)
// ============================================================================
export async function publishPolicy(title: string, content: string, category: string) {
  try {
    const session = await auth();
    // Only HR, Compliance, and Admins can publish corporate policies
    if (!session || !['HR', 'COMPLIANCE', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return { success: false, error: "Security Exception: Insufficient clearance to publish policies." };
    }

    const newPolicy = await db.companyPolicy.create({
      data: {
        title,
        content,
        category: category as any,
        authorId: session.user.id,
        isPublished: true
      }
    });

    // Notify all staff of a critical compliance/policy update
    const allStaff = await db.user.findMany({ where: { status: "ACTIVE" }, select: { id: true } });
    
    // Batch create notifications for efficiency
    const notifications = allStaff.map(staff => ({
      userId: staff.id,
      title: "New Corporate Policy Published",
      message: `A new policy document "${title}" has been added to the Knowledge Base under ${category.replace('_', ' ')}.`,
      type: "SYSTEM"
    }));

    await db.notification.createMany({ data: notifications });

    return { success: true, policy: newPolicy };
  } catch (error: any) {
    console.error("Policy Publishing Error:", error.message);
    return { success: false, error: "Failed to publish the policy document." };
  }
}