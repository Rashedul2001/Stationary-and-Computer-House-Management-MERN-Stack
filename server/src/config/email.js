import nodemailer from 'nodemailer';

const PLACEHOLDERS = new Set(['', 'your_smtp_email@gmail.com', 'your_smtp_app_password']);

export function isSmtpConfigured() {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  return (
    Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS) &&
    !PLACEHOLDERS.has(SMTP_USER) &&
    !PLACEHOLDERS.has(SMTP_PASS)
  );
}

export async function sendPasswordResetEmail({ to, url, userName }) {
  if (!isSmtpConfigured()) {
    console.log('\n======================================================');
    console.log('[SMTP PLACEHOLDER] Password Reset Requested');
    console.log(`User: ${userName || to} <${to}>`);
    console.log(`Reset URL: ${url}`);
    console.log('Configure SMTP_* in server/.env to deliver real emails.');
    console.log('======================================================\n');
    return { delivered: false, mode: 'console_fallback' };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: 'Password Reset - Laksam IT Knowledge & Paper House',
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #0A1931;">
        <h2>Password Reset Request</h2>
        <p>Hello ${userName || 'User'},</p>
        <p>Click the button below to reset your password for Laksam IT Knowledge &amp; Paper House:</p>
        <p style="margin: 24px 0;">
          <a href="${url}" style="background:#1A3D63;color:#F6FAFD;padding:12px 20px;text-decoration:none;border-radius:8px;display:inline-block;">
            Reset Password
          </a>
        </p>
        <p style="font-size:12px;color:#3E688C;">If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  });

  return { delivered: true, mode: 'smtp' };
}
