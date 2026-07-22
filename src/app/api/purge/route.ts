import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. Clear Comms & Notifications
    if (db.message) await db.message.deleteMany({});
    if (db.notification) await db.notification.deleteMany({});
    
    // 2. Clear DoA & Leaves
    if (db.delegation) await db.delegation.deleteMany({});
    if (db.leaveRequest) await db.leaveRequest.deleteMany({});
    
    // 3. Clear Workflows
    if (db.workflowStep) await db.workflowStep.deleteMany({});
    if (db.workflowRequest) await db.workflowRequest.deleteMany({});
    
    // 4. Clear Operations & Assets
    if (db.shift) await db.shift.deleteMany({});
    if (db.assetRequest) await db.assetRequest.deleteMany({});
    if (db.offboardingRecord) await db.offboardingRecord.deleteMany({});
    
    // 5. Clear HR / Payroll / Objectives
    if (db.payroll) await db.payroll.deleteMany({});
    if (db.objective) await db.objective.deleteMany({});
    if (db.certification) await db.certification.deleteMany({});
    
    // 6. Clear Audit Logs
    if (db.auditLog) await db.auditLog.deleteMany({});

    // 7. Reset User States (Bring everyone back online and clear leads)
    if (db.user) {
      await db.user.updateMany({
        data: {
          isDepartmentLead: false, 
          status: 'ACTIVE'
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Enterprise Activity Purged. System is clean." 
    });
    
  } catch (error: any) {
    console.error("Purge Error Detailed:", error);
    
    return NextResponse.json({ 
      success: false, 
      error: "Failed to purge system.",
      database_reason: error.message
    }, { status: 500 });
  }
}