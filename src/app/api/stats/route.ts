import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // Run aggregate queries concurrently for high performance
    const [totalUsers, pendingLeaves, totalPayroll] = await Promise.all([
      db.user.count(),
      db.leaveRequest.count({ where: { status: "PENDING" } }),
      db.payroll.aggregate({
        _sum: { netPay: true },
        where: { isPaid: true }
      })
    ]);

    // Format the response for UIs
    return NextResponse.json({
      success: true,
      data: {
        totalHeadcount: totalUsers,
        pendingApprovals: pendingLeaves,
        totalDisbursed: totalPayroll._sum.netPay || 0,
      }
    });
  } catch (error) {
    console.error("Stats aggregation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}