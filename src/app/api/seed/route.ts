import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";

export async function GET() {
  try {
    const hashedPassword = await hash("Admin123!", 10);
    
    // This injects an active Super Admin into your database
    const admin = await db.user.upsert({
      where: { email: "admin@enterprise.com" },
      update: {}, // Do nothing if it already exists
      create: {
        name: "Supreme Commander",
        email: "admin@enterprise.com",
        password: hashedPassword,
        role: "SUPER_ADMIN",
        status: "ACTIVE", // CRITICAL: This bypasses the lock
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "God-mode account generated.",
      credentials: "Email: admin@enterprise.com | Password: Admin123!"
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to seed database" }, { status: 500 });
  }
}