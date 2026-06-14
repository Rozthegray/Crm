import Pusher from 'pusher';
import { Resend } from 'resend';

// 1. Initialize Resend
export const resend = new Resend(process.env.RESEND_API_KEY);

// 2. Initialize Pusher (Server-Side)
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

// 3. Fallback Email System
export async function sendMissedMessageEmail(toEmail: string, senderName: string, messagePreview: string) {
  try {
    await resend.emails.send({
      from: 'Enterprise Command <hq@yourdomain.com>',
      to: toEmail,
      subject: `New Secure Message from ${senderName}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #0f172a;">Secure Channel Alert</h2>
          <p><strong>${senderName}</strong> has sent you a direct message on the command center:</p>
          <blockquote style="border-left: 4px solid #facc15; padding-left: 16px; color: #475569; font-style: italic;">
            "${messagePreview}"
          </blockquote>
          <a href="https://yourdomain.com/dashboard" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: #0f172a; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Open Workspace to Reply
          </a>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to route fallback email:", error);
  }
}