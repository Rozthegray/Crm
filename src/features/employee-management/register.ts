'use server'

import { db } from "@/lib/db";
import { hash } from "bcryptjs";

export async function submitEmployeeApplication(formData: FormData) {
  // Public route: No session check required here

  const email = formData.get('email') as string;
  const rawPassword = formData.get('password') as string;
  const branchId = formData.get('branchId') as string; 
const requestedRole = formData.get('role') as string;


  // THE FIX: Extract the Cloudinary URLs from the frontend interceptor
  const cvUrl = formData.get('cvUrl') as string | null;
  const avatarUrl = formData.get('avatarUrl') as string | null;

  // Hash the password they chose
  const hashedPassword = await hash(rawPassword, 10);

  try {
    // 1. DEVELOPMENT FIX: Ensure the branch exists before linking!
    // This creates the branch on-the-fly if it's missing in your fresh database.
    await db.branch.upsert({
      where: { id: branchId },
      update: {}, // Do nothing if it already exists
      create: {
        id: branchId,
        name: branchId === 'br_1' ? 'Lagos Mainland HQ' : 
              branchId === 'br_2' ? 'Victoria Island Branch' : 'Abuja Central',
        location: 'Nigeria'
      }
    });

    // 2. Create the account in a PENDING state securely linked to the branch
    const application = await db.user.create({
      data: {
        name: `${formData.get('firstName')} ${formData.get('lastName')}`,
        email,
        password: hashedPassword,
        phone: formData.get('phone') as string,
        nin: formData.get('nin') as string,
        bvn: formData.get('bvn') as string,
        address: formData.get('address') as string,
        birthDate: new Date(formData.get('birthDate') as string),
        branchId, 
        role: requestedRole,
        status: "PENDING_APPROVAL", 
        cvUrl,       // Permanently saved to the database!
        avatarUrl    // Permanently saved to the database!
      }
    });

    return { success: true, message: "Application submitted. Awaiting HR approval." };
  } catch (error) {
    console.error("Registration failed:", error);
    return { success: false, error: "Email, NIN, or BVN might already be in use." };
  }
}