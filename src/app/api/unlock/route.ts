import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. Instantly restore Leadership clearance to you (and any other Admins)
    await db.user.updateMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
      data: { 
        isDepartmentLead: true, 
        status: 'ACTIVE' 
      }
    });
    
    // 2. Erase any ghost delegations causing UI conflicts
    await db.delegation.deleteMany({});
    
    return NextResponse.json({ 
      success: true, 
      message: "SHOWCASE MODE UNLOCKED: Admin powers fully restored!" 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}