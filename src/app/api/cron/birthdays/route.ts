import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resend } from "@/lib/comms";

export async function GET(req: Request) {
  // Absolute Security: Verify the trigger source
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized connection attempt blocked.', { status: 401 });
  }

  try {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // JavaScript months are 0-indexed
    const currentDay = today.getDate();

    // 1. Efficient PostgreSQL Query: Find ACTIVE employees born today
    const birthdayUsers = await db.$queryRaw<Array<{ id: string, name: string, email: string }>>`
      SELECT id, name, email 
      FROM "User" 
      WHERE EXTRACT(MONTH FROM "birthDate") = ${currentMonth} 
        AND EXTRACT(DAY FROM "birthDate") = ${currentDay}
        AND status = 'ACTIVE'
    `;

    if (birthdayUsers.length === 0) {
      return NextResponse.json({ message: "No birthdays to celebrate today." });
    }

    // 2. The Email Generation Loop
    const emailPromises = birthdayUsers.map(user => {
      const firstName = user.name.split(' ')[0];

      return resend.emails.send({
        from: 'Enterprise Command <onboarding@resend.dev>', // Update to your verified domain in production
        to: user.email,
        subject: `Happy Birthday, ${firstName}! 🎉`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 48px;">🎂</span>
            </div>
            <h1 style="color: #0f172a; text-align: center; margin-bottom: 12px; font-size: 28px;">Happy Birthday, ${firstName}!</h1>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; text-align: center;">
              Enterprise Bank wishes you a fantastic day and a prosperous year ahead. Thank you for your continued dedication, excellence, and for being a highly valued member of our operation.
            </p>
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center; color: #94a3b8; font-size: 12px;">
              <p>Automated by the Enterprise CRM Engine</p>
            </div>
          </div>
        `
      });
    });

    // Execute all dispatches simultaneously
    await Promise.all(emailPromises);

    return NextResponse.json({ 
      success: true, 
      message: `Successfully dispatched ${birthdayUsers.length} birthday emails.` 
    });

  } catch (error) {
    console.error("Birthday Engine Error:", error);
    return NextResponse.json({ error: "Fatal Cron Failure" }, { status: 500 });
  }
}