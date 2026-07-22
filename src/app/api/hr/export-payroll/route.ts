import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    // 1. Strict Security Perimeter
    const session = await auth();
    if (!session || (session.user.role !== "HR" && session.user.role !== "SUPER_ADMIN")) {
      return new NextResponse("Unauthorized Access. HR Clearance Required.", { status: 403 });
    }

    // 2. Fetch Active Payroll Data
    const employees = await db.user.findMany({
      where: { 
        status: "ACTIVE",
        baseSalary: { not: null } // Only export users who have a salary configured
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        salaryAccountNumber: true,
        bankName: true,
        baseSalary: true,
      },
      orderBy: { name: "asc" }
    });

    // 3. Construct the CSV Payload
    // Using standard CSV headers that Finance software expects
    const headers = ["Employee ID", "Full Name", "Email", "Department", "Bank Name", "Account Number", "Base Salary (NGN)"];
    
    const csvRows = employees.map(emp => {
      return [
        emp.id,
        `"${emp.name}"`, // Wrap in quotes to prevent comma breaks
        emp.email,
        emp.role,
        `"${emp.bankName || 'NOT_PROVIDED'}"`,
        `"${emp.salaryAccountNumber || 'NOT_PROVIDED'}"`,
        emp.baseSalary
      ].join(",");
    });

    const csvContent = [headers.join(","), ...csvRows].join("\n");

    // 4. Record this highly sensitive action in the Immutable Audit Ledger
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "PAYROLL_DATA_EXPORT",
        entityType: "SYSTEM",
        details: { count: employees.length, exportedAt: new Date().toISOString() },
        severity: "WARNING", // Flagged as warning because data left the system
      }
    });

    // 5. Stream the file directly to the browser
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="payroll_export_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error: any) {
    console.error("Export Error:", error.message);
    return new NextResponse("Failed to generate payroll export.", { status: 500 });
  }
}