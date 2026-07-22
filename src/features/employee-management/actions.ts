'use server'

import { db } from "@/lib/db";
import { hash } from "bcryptjs";
import nodemailer from "nodemailer";

// ============================================================================
// SECURE EMAIL DISPATCHER (Can be moved to src/lib/mail.ts later)
// ============================================================================
const sendPendingApprovalEmail = async (email: string, name: string) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"HR & Compliance" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Action Required: Account Pending HR Clearance",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #160f29;">
          <h2 style="color: #2a27fd;">Welcome to the Network, ${name}</h2>
          <p>Your account has been successfully registered and your payroll destination has been secured in our ledger.</p>
          <p><strong>Status: PENDING HR APPROVAL</strong></p>
          <p>For strict security purposes, your network access is currently locked. The Human Resources and Compliance team must review your credentials and documentation before granting you active status.</p>
          <p>You will receive an automated dispatch here the moment your clearance is approved or denied.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888;">This is an automated security message. Do not reply.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("SMTP Dispatch Error:", error);
    // We log the error but don't crash the registration process if email fails
  }
};

// ============================================================================
// PHASE 1: SELF-REGISTRATION & ONBOARDING ACTION
// ============================================================================
export async function registerAndOnboardEmployee(formData: FormData) {
  // 1. Extract Core Credentials
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const phone = formData.get('phone') as string;
  
  // 2. Extract Phase 1 Financial/Onboarding Data
  const salaryAccountNumber = formData.get('salaryAccountNumber') as string;
  const bankName = formData.get('bankName') as string;

  // 3. Extract Documents & Placement Data (THE MISSING LINK)
  const branchId = formData.get('branchId') as string;
  const role = formData.get('role') as any; // Ensure this matches your Prisma Role Enum
  
  const cvFile = formData.get('cvDocument') as string | null; // Assumes URL string from Cloudinary
  const avatarFile = formData.get('idDocument') as string | null;

  try {
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return { success: false, error: "An account with this email already exists." };
    }

    const hashedPassword = await hash(password, 12);

    // 6. Execute Database Write (Now correctly assigned to a Branch)
    const newUser = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name: `${firstName} ${lastName}`.trim(),
        phone,
        salaryAccountNumber,
        bankName,
        cvUrl: cvFile,
        avatarUrl: avatarFile,
        branchId,             // <-- INJECTED: Connects them to the specific branch
        role: role || "STAFF",// <-- INJECTED: Assigns their requested department
        status: "PENDING_APPROVAL", 
      }
    });

    sendPendingApprovalEmail(newUser.email, newUser.name);

    return { success: true, message: "Registration complete. Awaiting HR clearance." };
  } catch (error: any) {
    console.error("Registration Error:", error.message);
    return { success: false, error: "Failed to securely write personnel data." };
  }
}