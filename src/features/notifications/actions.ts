'use server'

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendSystemNotification(to: string, subject: string, message: string) {
  try {
    await resend.emails.send({
      from: 'Enterprise HR <hr@enterprisebank.com>',
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; color: #0A2540; padding: 20px;">
          <h2 style="color: #D4AF37;">Enterprise Bank Portal</h2>
          <p>${message}</p>
          <hr style="border: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">This is an automated system message. Please do not reply.</p>
        </div>
      `
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send notification:", error);
    return { success: false };
  }
}