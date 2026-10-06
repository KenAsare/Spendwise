const nodemailer = require('nodemailer');

const isEmailConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Wraps the sending address in a "Display Name <email>" format so Gmail
// and other clients show "Spendwise" as the sender instead of the raw
// email address (e.g. kennedyasare530@gmail.com).
const senderAddress = () => `"Spendwise" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`;

const codeBlockHtml = (code) => `
  <div style="background:#f6f7fb;border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
    <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#4f46e5;">${code}</span>
  </div>
`;

// Sends the password reset code, or logs it to the console in dev mode
// if no SMTP is configured, so the flow stays testable without email setup.
const sendPasswordResetEmail = async (toEmail, code) => {
  if (!isEmailConfigured()) {
    console.log('\n========== PASSWORD RESET CODE (dev mode — no SMTP configured) ==========');
    console.log(`To: ${toEmail}`);
    console.log(`Code: ${code}`);
    console.log('===========================================================================\n');
    return;
  }

  const transporter = getTransporter();
  await transporter.sendMail({
    from: senderAddress(),
    to: toEmail,
    subject: 'Your Spendwise password reset code',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Spendwise</h2>
        <p>Use this code to reset your password. It expires in 15 minutes.</p>
        ${codeBlockHtml(code)}
        <p style="color:#6b7080;font-size:13px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
};

// Sends the email verification code, or logs it to the console in dev mode.
const sendVerificationEmail = async (toEmail, code) => {
  if (!isEmailConfigured()) {
    console.log('\n========== EMAIL VERIFICATION CODE (dev mode — no SMTP configured) ==========');
    console.log(`To: ${toEmail}`);
    console.log(`Code: ${code}`);
    console.log('================================================================================\n');
    return;
  }

  const transporter = getTransporter();
  await transporter.sendMail({
    from: senderAddress(),
    to: toEmail,
    subject: 'Verify your Spendwise email',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Spendwise</h2>
        <p>Thanks for signing up! Enter this code in the app to confirm your email. It expires in 15 minutes.</p>
        ${codeBlockHtml(code)}
        <p style="color:#6b7080;font-size:13px;">
          If you didn't create a Spendwise account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
};

module.exports = { sendPasswordResetEmail, sendVerificationEmail, isEmailConfigured };