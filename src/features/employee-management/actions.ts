'use server'

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";

// Helper to generate a unique, human-readable HR ID
const generateEmployeeId = () => {
  const year = new Date().getFullYear();
  const randomHex = randomBytes(2).toString('hex').toUpperCase(); // e.g., '8A9F'
  return `EMP-${year}-${randomHex}`;
};

export async function onboardNewEmployee(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== 'HR' && session.user.role !== 'ADMIN') {
    throw new Error("Unauthorized access.");
  }

  // 1. Extract String Credentials
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const address = formData.get('address') as string;
  const department = formData.get('department') as string;
  const birthDate = new Date(formData.get('birthDate') as string);
  const role = formData.get('role') as "STAFF" | "HR" | "ADMIN";

  // 2. Extract Documents (CV, ID)
  const cvFile = formData.get('cvDocument') as File | null;
  const idFile = formData.get('idDocument') as File | null;

  // Note: In production, you would upload cvFile and idFile to AWS S3 or Vercel Blob here
  // and retrieve their secure URLs to store in the database.
  const cvUrl = cvFile ? `https://secure-storage.bank.com/cv/${cvFile.name}` : null;
  const idUrl = idFile ? `https://secure-storage.bank.com/id/${idFile.name}` : null;

  // 3. Generate Temporary Password & Unique ID
  const tempPassword = randomBytes(4).toString('hex'); // e.g., 'a1b2c3d4'
  const hashedPassword = await hash(tempPassword, 10);
  const uniqueEmpId = generateEmployeeId();

  try {
    // 4. Create the User in Neon DB
    const newUser = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name: `${firstName} ${lastName}`,
        role,
        phone,
        birthDate,
        // Assuming you add `employeeId`, `address`, and `department` to your User model
        // employeeId: uniqueEmpId,
        // address,
        // department,
      }
    });

    // 5. Trigger Welcome Email via Notifications Service
    // await sendWelcomeEmail(email, tempPassword, uniqueEmpId);

    return { success: true, employeeId: uniqueEmpId, tempPassword };
  } catch (error) {
    console.error("Onboarding Error:", error);
    return { success: false, error: "Failed to create employee record. Email might already exist." };
  }
}