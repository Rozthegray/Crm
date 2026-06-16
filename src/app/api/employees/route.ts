import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    // 1. Authenticate & Authorize
    // 1. Authenticate & Authorize
    const session = await auth();
    const currentUser = session?.user as any;

    if (!session || !currentUser || (currentUser.role !== "HR" && currentUser.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // 2. Extract query parameters for search/filtering (Optional but recommended)
    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department");
    const search = searchParams.get("search");

    // 3. Construct Prisma Query
    const employees = await db.user.findMany({
      where: {
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }),
        // If you added department to your Prisma User model, filter here:
        // ...(department && { department }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
        // Exclude password!
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: employees });
  } catch (error) {
    console.error("Failed to fetch employees:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
