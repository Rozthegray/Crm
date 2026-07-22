"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// ============================================================================
// 1. OBJECTIVES & KEY RESULTS (OKRs)
// ============================================================================

export async function createObjective(data: {
  userId: string;
  title: string;
  description?: string;
  targetValue: number;
  metric: string;
  deadline: string;
}) {
  try {
    const session = await auth();
    // In a real banking app, you'd check if session.user is the lead of this userId
    if (!session || !session.user) return { success: false, error: "Unauthorized" };

    const objective = await db.objective.create({
      data: {
        userId: data.userId,
        title: data.title,
        description: data.description,
        targetValue: data.targetValue,
        metric: data.metric,
        deadline: new Date(data.deadline),
      }
    });

    return { success: true, objective };
  } catch (error: any) {
    return { success: false, error: "Failed to establish performance target." };
  }
}

export async function updateObjectiveProgress(objectiveId: string, newValue: number) {
  try {
    const session = await auth();
    if (!session || !session.user) return { success: false, error: "Unauthorized" };

    const objective = await db.objective.findUnique({ where: { id: objectiveId } });
    if (!objective) return { success: false, error: "Objective not found." };

    let newStatus = objective.status;
    if (newValue >= objective.targetValue) {
      newStatus = "COMPLETED";
    }

    const updated = await db.objective.update({
      where: { id: objectiveId },
      data: { currentValue: newValue, status: newStatus as any }
    });

    return { success: true, objective: updated };
  } catch (error: any) {
    return { success: false, error: "Failed to log progress." };
  }
}

// ============================================================================
// 2. COMPLIANCE CERTIFICATIONS
// ============================================================================

export async function logCertification(data: {
  userId: string;
  name: string;
  issuer: string;
  issuedAt: string;
  expiresAt: string;
  documentUrl?: string;
}) {
  try {
    const session = await auth();
    if (!session || !['HR', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return { success: false, error: "HR Clearance required to log compliance documents." };
    }

    const cert = await db.certification.create({
      data: {
        userId: data.userId,
        name: data.name,
        issuer: data.issuer,
        issuedAt: new Date(data.issuedAt),
        expiresAt: new Date(data.expiresAt),
        documentUrl: data.documentUrl,
        status: "VALID"
      }
    });

    return { success: true, certification: cert };
  } catch (error: any) {
    return { success: false, error: "Failed to secure compliance record." };
  }
}