import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// Fetch all leave requests (For HR Dashboard)
export async function GET(req: Request) {
  try {
    const session = await auth();
    const currentUser = session?.user as any;
    
    if (!session || !currentUser || (currentUser.role !== "HR" && currentUser.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const leaveRequests = await db.leaveRequest.findMany({
      include: {
        user: { select: { name: true, email: true, role: true } } // Join user details
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: leaveRequests });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Approve or Reject a leave request
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    const currentUser = session?.user as any;
    
    if (!session || !currentUser || (currentUser.role !== "HR" && currentUser.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { leaveId, status } = body; // status should be "APPROVED" or "REJECTED"

    if (!leaveId || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const updatedLeave = await db.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: status,
      },
      include: { user: true }
    });

    // Optional: Trigger email notification to the user here
    // await sendSystemNotification(updatedLeave.user.email, `Leave Request ${status}`, `Your leave request starting ${updatedLeave.startDate} has been ${status}.`);

    return NextResponse.json({ success: true, data: updatedLeave });
  } catch (error) {
    console.error("Leave update error:", error);
    return NextResponse.json({ error: "Failed to update leave request" }, { status: 500 });
  }
}
