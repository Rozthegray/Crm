import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    // 1. Strict Security Perimeter (Vercel Cron standard)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized Cron Execution', { status: 401 });
    }

    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // 2. PASS ONE: Flag certifications expiring in the next 30 days
    const expiringCerts = await db.certification.findMany({
      where: {
        status: "VALID",
        expiresAt: {
          lte: thirtyDaysFromNow,
          gt: today
        }
      },
      include: { user: { select: { id: true, email: true, name: true } } }
    });

    for (const cert of expiringCerts) {
      // Update status to EXPIRING_SOON
      await db.certification.update({
        where: { id: cert.id },
        data: { status: "EXPIRING_SOON" }
      });

      // Fire a critical system alert
      await db.notification.create({
        data: {
          userId: cert.userId,
          title: "Compliance Risk: Certificate Expiring",
          message: `Your ${cert.name} certification expires on ${cert.expiresAt.toLocaleDateString()}. Please renew immediately to maintain system clearance.`,
          type: "ALERT"
        }
      });
      
      // Note: You can easily plug in a sendComplianceEmail(cert.user.email, ...) here!
    }

    // 3. PASS TWO: Terminate certifications that have officially expired
    const expiredCerts = await db.certification.findMany({
      where: {
        status: { in: ["VALID", "EXPIRING_SOON"] },
        expiresAt: { lte: today }
      }
    });

    for (const cert of expiredCerts) {
      await db.certification.update({
        where: { id: cert.id },
        data: { status: "EXPIRED" }
      });

      await db.notification.create({
        data: {
          userId: cert.userId,
          title: "Clearance Revoked: Certificate Expired",
          message: `Your ${cert.name} certification has officially expired. HR has been notified.`,
          type: "CRITICAL"
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Scanner complete. Flagged ${expiringCerts.length} expiring, ${expiredCerts.length} expired.` 
    });

  } catch (error: any) {
    console.error("Compliance Scanner Error:", error.message);
    return new NextResponse("Failed to execute compliance scanner.", { status: 500 });
  }
}