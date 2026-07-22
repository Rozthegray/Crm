import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";

// Helper function to safely delete tables
async function safeDelete(model: any) {
  if (!model) return;
  try {
    await model.deleteMany({});
  } catch (error: any) {
    if (error.code !== 'P2021') {
      console.warn("Non-fatal deletion warning:", error.message);
    }
  }
}

export async function GET() {
  try {
    // ============================================================================
    // 1. SYSTEM PURGE (Complete Wipe)
    // ============================================================================
    await safeDelete(db.message);
    await safeDelete(db.notification);
    await safeDelete(db.leaveRequest);
    await safeDelete(db.workflowStep);
    await safeDelete(db.workflowRequest);
    await safeDelete(db.shift);
    await safeDelete(db.assetRequest);
    await safeDelete(db.offboardingRecord);
    await safeDelete(db.payroll);
    await safeDelete(db.objective);
    await safeDelete(db.certification);
    await safeDelete(db.auditLog);
    await safeDelete(db.user);
    await safeDelete(db.branch); // Wipe branches to ensure clean IDs

    // ============================================================================
    // 2. CREATE MASTER SHOWCASE BRANCHES (Matching Frontend IDs exactly)
    // ============================================================================
    const branches = [
      { id: "br_1", name: "Lagos Mainland HQ", location: "Lagos Mainland, Lagos" },
      { id: "br_2", name: "Victoria Island Branch", location: "Victoria Island, Lagos" },
      { id: "br_3", name: "Abuja Central", location: "Abuja, FCT" },
      { id: "br_4", name: "IKORODU", location: "Ikorodu, Lagos" },
      { id: "br_5", name: "KETU", location: "Ketu, Lagos" },
      { id: "br_6", name: "OYO", location: "Oyo State" },
      { id: "br_7", name: "ABA", location: "Aba, Abia State" }
    ];

    for (const branch of branches) {
      await db.branch.create({
        data: branch
      });
    }

    // ============================================================================
    // 3. SEED THE GOD-MODE ADMIN
    // ============================================================================
    const hashedPassword = await hash("Admin123!", 10);
    
    await db.user.create({
      data: {
        name: "Supreme Commander",
        email: "admin@enterprise.com",
        password: hashedPassword,
        role: "SUPER_ADMIN",
        status: "ACTIVE", 
        isDepartmentLead: true,
        branchId: "br_1", // Link admin to Lagos Mainland HQ
        phone: "09062046678" // Secure contact profile
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "System purged. All branches initialized. God-mode account active.",
      credentials: "Email: admin@enterprise.com | Password: Admin123!"
    });
  } catch (error: any) {
    console.error("Master Seed Error:", error);
    return NextResponse.json({ 
      error: "Failed to seed and purge database.", 
      details: error.message 
    }, { status: 500 });
  }
}