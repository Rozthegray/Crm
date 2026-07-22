import nodemailer from "nodemailer";

// ============================================================================
// SECURE SMTP TRANSPORT INITIALIZATION
// ============================================================================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// ============================================================================
// 1. ONBOARDING & ACCOUNT STATUS
// ============================================================================
export const sendWelcomeEmail = async (email: string, name: string) => {
  const mailOptions = {
    from: `"HR Department" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Action Required: Account Pending HR Clearance",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #160f29;">
        <h2 style="color: #2a27fd;">Welcome to the Corporate Network, ${name}</h2>
        <p>Your account has been successfully registered and your payroll destination has been secured in our ledger.</p>
        <p><strong>Status: <span style="background-color: #ffbb00; padding: 2px 6px; border-radius: 4px;">PENDING HR APPROVAL</span></strong></p>
        <p>For security purposes, your network access is currently locked. The Human Resources and Compliance team must review your credentials before granting you active status.</p>
        <p>You will receive an automated dispatch here the moment your clearance is approved or denied.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">This is an automated security message. Do not reply.</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions).catch(console.error);
};

// ============================================================================
// 2. FINANCIAL PAYROLL NOTIFICATIONS
// ============================================================================
export const sendSalaryDelayEmail = async (email: string, name: string, daysOverdue: number) => {
  const mailOptions = {
    from: `"HR & Finance" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Important: Payroll Disbursement Delay Notice",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #160f29;">
        <h2 style="color: #ef4444;">Payroll Status Update</h2>
        <p>Dear ${name},</p>
        <p>We are writing to inform you that your scheduled salary disbursement is currently <strong>${daysOverdue} day(s) overdue</strong>.</p>
        <p>Please be assured that the Finance and HR departments have been automatically alerted by the CRM system. We are actively processing your ledger to resolve this delay as quickly as possible.</p>
        <p>No action is required on your part. We apologize for any inconvenience.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">This is an automated system alert. Do not reply.</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions).catch(console.error);
};

export const sendSalaryPaymentEmail = async (email: string, name: string, netPay: number, payPeriod: string) => {
  const mailOptions = {
    from: `"Finance Treasury" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Remittance Advice: Salary Disbursed",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #160f29;">
        <h2 style="color: #10b981;">Salary Disbursed</h2>
        <p>Dear ${name},</p>
        <p>Your payroll for the period of <strong>${payPeriod}</strong> has been successfully cleared and routed to your registered bank account.</p>
        <p><strong>Net Disbursed: ₦${netPay.toLocaleString()}</strong></p>
        <p>Please allow standard banking hours for the funds to reflect in your available balance.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">This is an automated financial receipt. Do not reply.</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions).catch(console.error);
};

// ============================================================================
// 3. LEAVE ENGINE NOTIFICATIONS
// ============================================================================
export const sendLeaveApprovalEmail = async (email: string, name: string, type: string, startDate: string, endDate: string) => {
  const formattedType = type.replace('_', ' ');
  
  const mailOptions = {
    from: `"HR Department" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Leave Request Approved: ${formattedType}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #160f29;">
        <h2 style="color: #10b981;">Leave Request Approved</h2>
        <p>Dear ${name},</p>
        <p>Your request for <strong>${formattedType}</strong> leave has been officially approved by Human Resources.</p>
        <ul style="background-color: #f8fafc; padding: 15px 30px; border-radius: 8px;">
          <li><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString()}</li>
          <li><strong>End Date:</strong> ${new Date(endDate).toLocaleDateString()}</li>
        </ul>
        <p>Please ensure all pending handovers are completed prior to your departure.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">This is an automated system message. Do not reply.</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions).catch(console.error);
};

export const sendLeaveDailyNotificationEmail = async (email: string, name: string, type: string, daysRemaining: number) => {
  const formattedType = type.replace('_', ' ');
  
  // Dynamic condition: Inject health message if leave type is SICK
  const healthMessage = type === 'SICK' 
    ? `<div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 12px; margin-top: 15px;">
         <strong>Stay strong and rest well!</strong> Your health and recovery are our absolute priority.
       </div>`
    : "";

  const mailOptions = {
    from: `"HR Department" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Active Leave Status Tracker",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #160f29;">
        <h2 style="color: #2a27fd;">Active Leave Update</h2>
        <p>Dear ${name},</p>
        <p>This is your automated system tracker for your ongoing <strong>${formattedType}</strong> leave.</p>
        <p>You currently have <strong>${daysRemaining} day(s)</strong> remaining on your authorized duration before your expected return date.</p>
        ${healthMessage}
        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">This is an automated system message. Do not reply.</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions).catch(console.error);
};