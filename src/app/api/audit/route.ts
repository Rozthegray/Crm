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

// Pass them as standard comma-separated arguments
   // Pass them as standard comma-separated arguments
    await logSystemEvent(
      currentUser.id,      // 1st argument: Use the type-safe currentUser we defined above
      body.action,         // 2nd argument: action
      body.entityType,     // 3rd argument: entityType
      body.entityId,       // 4th argument: entityId
      body.details         // 5th argument: details (optional)
    );

  return NextResponse.json({ success: true });
}