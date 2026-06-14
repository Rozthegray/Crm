import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // 1. Find the first available physical branch in the database
    const primaryBranch = await db.branch.findFirst();

    if (!primaryBranch) {
      return NextResponse.json({ 
        error: "No branches exist in the database. Please log into Super Admin and Provision a branch first." 
      });
    }

    // 2. Assign this branch ID to ANY user who currently doesn't have one
    const updateResult = await db.user.updateMany({
      where: { branchId: null },
      data: { branchId: primaryBranch.id }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Successfully linked ${updateResult.count} floating users to branch: ${primaryBranch.name}.` 
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Database linking failed." }, { status: 500 });
  }
}