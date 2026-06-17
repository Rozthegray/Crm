import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { PayslipDocument } from '@/components/pdf/PayslipDocument';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    
    // 1. Ensure session exists
    if (!session || !session.user) return new NextResponse("Unauthorized", { status: 401 });

    // 2. Await the params object (Next.js 15+ requirement)
    const resolvedParams = await params;
    const id = resolvedParams.id;

    // 3. Fetch the specific payroll record securely
    const payroll = await db.payroll.findUnique({
      where: { id: id },
      include: { user: true }
    });

    if (!payroll) return new NextResponse("Not Found", { status: 404 });

    // 4. Security Check: Define currentUser exactly ONCE
    const currentUser = session.user as any; 
    
    if (payroll.userId !== currentUser.id && currentUser.role === 'STAFF') {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // 5. Map DB data to our PDF template props
    const pdfData = {
      id: payroll.id,
      employeeName: payroll.user.name,
      role: 'Staff Member', 
      payPeriod: payroll.payPeriod,
      baseSalary: payroll.baseSalary,
      allowances: payroll.allowances,
      deductions: payroll.dedctions, 
      netPay: payroll.netPay,
    };

    // 6. Render the PDF in memory
    const pdfBuffer = await renderToBuffer(<PayslipDocument data={pdfData} />);

    // 7. Return as a downloadable file
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
