import { NextResponse } from "next/server";
import { logSystemEvent } from "@/lib/audit";
import { auth } from "@/lib/auth"; // Your NextAuth instance

export async function POST(req: Request) {
const session = await auth();
    const currentUser = session?.user as any;
    
    if (!session || !currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

  const body = await req.json();

  await logSystemEvent({
    userId: session.user.id,
    action: body.action,
    entityType: body.entityType,
    details: body.details,
    severity: body.severity,
  });

  return NextResponse.json({ success: true });
}