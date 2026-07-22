import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // This will forcibly upgrade ALL existing accounts in your database to Super Admin
    const upgraded = await db.user.updateMany({
      data: {
        status: "ACTIVE",
        role: "SUPER_ADMIN",
      },
    });
    
    return NextResponse.json({ 
      success: true, 
      message: `System Override Complete. ${upgraded.count} account(s) upgraded to SUPER_ADMIN.` 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}