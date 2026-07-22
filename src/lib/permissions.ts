import { db } from "@/lib/db";
import { Role } from "@prisma/client";

/**
 * Universal Clearance Engine
 * Evaluates if a user can execute an action based on their native role OR an active DoA.
 */
export async function verifyRoleClearance(userId: string, requiredRole: Role) {
  const today = new Date();

  // ============================================================================
  // CHECK 1: NATIVE AUTHORITY (The Regular Duty)
  // The original Department Lead will ALWAYS pass this check instantly.
  // ============================================================================
  const nativeUser = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, status: true }
  });

  if (nativeUser?.status !== "ACTIVE") return false;
  if (nativeUser?.role === requiredRole || nativeUser?.role === "SUPER_ADMIN") return true;

  // ============================================================================
  // CHECK 2: DELEGATED AUTHORITY (The 2IC Bypass)
  // If the user doesn't have the native role, we check if they hold the duplicate keys.
  // ============================================================================
  const activeDelegation = await db.delegation.findFirst({
    where: {
      delegateeId: userId,
      departmentRole: requiredRole,
      isActive: true,
      startDate: { lte: today },
      endDate: { gte: today },
      // The structural lock: Ensures the delegator is actually on active leave
      delegator: {
        leaveRequests: {
          some: { status: "ACTIVE" }
        }
      }
    }
  });

  // Returns true if a valid delegation exists, false otherwise.
  return !!activeDelegation;
}