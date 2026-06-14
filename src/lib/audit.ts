import { db } from '@/lib/db'; // Ensure this points to your Prisma client file

export async function logSystemEvent(
  action: string,
  entityType: string,
  entityId: string | null,
  details: any,
  userId: string | null = null,
  severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO'
) {
  try {
    // Writes the action to the immutable database ledger
    await db.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        details: details ? JSON.parse(JSON.stringify(details)) : {},
        userId,
        severity,
      }
    });
  } catch (error) {
    console.error("Audit Logger Error:", error);
  }
}