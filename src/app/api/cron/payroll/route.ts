import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  // Security Check: Ensure only Vercel Cron or your designated trigger can run this
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const today = new Date();

    // 1. Find all ACTIVE users whose pay date is today or earlier
    const eligibleEmployees = await db.user.findMany({
      where: {
        status: "ACTIVE",
        baseSalary: { not: null },
        nextPayDate: { lte: today }
      }
    });

    if (eligibleEmployees.length === 0) {
      return NextResponse.json({ message: "No payrolls due today." });
    }

    // 2. Process each employee (Generate Ledger & Reset Epoch)
// 2. Process each employee (Generate Ledger & Reset Epoch)
    const transactions = eligibleEmployees.map(emp => {
      const nextPay = new Date();
      nextPay.setDate(nextPay.getDate() + 30); // Advance 30 days

      return db.$transaction([
        // A. Generate the UNPAID ledger for Branch Admins to review
        db.payroll.create({
          data: {
            userId: emp.id,
            baseSalary: emp.baseSalary!,
            netPay: emp.baseSalary!, // Deductions/Taxes can be applied here later
            payPeriod: `${today.toLocaleString('default', { month: 'short' })} Cycle`,
            isPaid: false // Branch Admin must click "Disburse" to flip this to true
          }
        }),
        // B. Reset the employee's countdown clock
        db.user.update({
          where: { id: emp.id },
          data: { nextPayDate: nextPay }
        })
      ]);
    });

    await Promise.all(transactions);

    return NextResponse.json({ 
      success: true, 
      message: `Successfully staged ${eligibleEmployees.length} payroll ledgers for Admin disbursal.` 
    });

  } catch (error) {
    console.error("Cron Payroll Error:", error);
    return NextResponse.json({ error: "Fatal Cron Failure" }, { status: 500 });
  }
}