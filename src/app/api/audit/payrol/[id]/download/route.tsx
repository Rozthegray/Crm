import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { PayslipDocument } from '@/components/pdf/PayslipDocument';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
const session = await auth();
    const currentUser = session?.user as any;
    
    if (!session || !currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 0. Await the params object (Next.js 15+ requirement)
    const resolvedParams = await params;
    const id = resolvedParams.id;

    // 1. Fetch the specific payroll record securely
    const payroll = await db.payroll.findUnique({
      where: { id: id },
      include: { user: true }
    });

    if (!payroll) return new NextResponse("Not Found", { status: 404 });

    // Security Check: Ensure the user is either the owner or an Admin/HR
    const currentUser = session.user as any; // Bypasses NextAuth's default type limits
    if (payroll.userId !== currentUser.id && currentUser.role === 'STAFF') {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // 2. Map DB data to our PDF template props
    const pdfData = {
      id: payroll.id,
      employeeName: payroll.user.name,
      role: 'Staff Member', // Or fetch from a joined Profile table
      payPeriod: payroll.payPeriod,
      baseSalary: payroll.baseSalary,
      allowances: payroll.allowances,
      deductions: payroll.deductions,
      netPay: payroll.netPay,
    };

    // 3. Render the PDF in memory
    const pdfBuffer = await renderToBuffer(<PayslipDocument data={pdfData} />);

    // 4. Return as a downloadable file
    // Casting to any bypasses the strict Web API type check for the Node Buffer
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Payslip_${payroll.payPeriod.replace(' ', '_')}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF Generation Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}