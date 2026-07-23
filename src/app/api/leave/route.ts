import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// Fetch all leave requests (For HR Dashboard)
export async function GET(req: Request) {
  try {
    // 1. Strict Security Perimeter
    const session = await auth();
    const user = session?.user as any; // The Override: Forces TS to accept custom fields
    
    if (!session || !user || (user.role !== "HR" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const leaveRequests = await db.leaveRequest.findMany({
      include: {
        user: { select: { name: true, email: true, role: true } } // Join user details
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: leaveRequests });
  } catch (error) {
    console.error("Leave fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Approve or Reject a leave request
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    const user = session?.user as any; // Added override here to bypass Vercel TS checks
    
    if (!session || !user || (user.role !== "HR" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
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
        reviewedBy: user.id,
      },
      include: { user: true }
    });

    return NextResponse.json({ success: true, data: updatedLeave });
  } catch (error) {
    console.error("Leave update error:", error);
    return NextResponse.json({ error: "Failed to update leave request" }, { status: 500 });
  }
}