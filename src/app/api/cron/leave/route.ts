import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  // Absolute Security: Verify the trigger source
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized connection attempt blocked.', { status: 401 });
  }

  try {
    const today = new Date();

    // 1. Activate Pending Leaves
    // Find leaves that are APPROVED and their startDate is today (or in the past)
    await db.leaveRequest.updateMany({
      where: {
        status: 'APPROVED',
        startDate: { lte: today },
      },
      data: { status: 'ACTIVE' }
    });

    // 2. Fetch all currently ACTIVE leaves
    const activeLeaves = await db.leaveRequest.findMany({
      where: { status: 'ACTIVE' }
    });

    if (activeLeaves.length === 0) {
      return NextResponse.json({ message: "No active leaves require processing today." });
    }

    // 3. The Countdown Engine
    const transactions = activeLeaves.map(leave => {
      // Subtract 1 day, ensuring we never drop below 0
      const newRemaining = Math.max(0, leave.daysRemaining - 1);
      
      // If they hit 0, their leave is officially complete
      const newStatus = newRemaining === 0 ? 'COMPLETED' : 'ACTIVE';

      return db.leaveRequest.update({
        where: { id: leave.id },
        data: {
          daysRemaining: newRemaining,
          status: newStatus
        }
      });
    });

    // Execute all updates simultaneously for maximum performance
    await Promise.all(transactions);

    return NextResponse.json({ 
      success: true, 
      message: `Successfully decremented ${activeLeaves.length} active leave ledgers.` 
    });

  } catch (error) {
    console.error("Leave Cron Engine Error:", error);
    return NextResponse.json({ error: "Fatal Cron Failure" }, { status: 500 });
  }
}