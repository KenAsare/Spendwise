    const nodemailer = require('nodemailer');

// How emails are sent, in order of preference:
//   1. Brevo web API  (BREVO_API_KEY + EMAIL_FROM)  -> works on Render's free plan
//   2. SMTP           (SMTP_HOST/USER/PASS)         -> fine locally; blocked on Render free
//   3. Neither        -> the code is printed to the server log (dev mode)
// Render's free plan blocks SMTP ports, which is why production uses option 1.

const usesBrevo = () => Boolean(process.env.BREVO_API_KEY && fromEmail());

const usesSmtp = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const isEmailConfigured = () => usesBrevo() || usesSmtp();

// The address emails are sent from. With Brevo this must be a sender you have
// verified in your Brevo account.
function fromEmail() {
  return process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER || '';
}

const getTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

// Wraps the sending address in a "Display Name <email>" format so Gmail
// and other clients show "Spendwise" as the sender instead of the raw address.
const senderAddress = () => `"Spendwise" <${fromEmail()}>`;

const codeBlockHtml = (code) => `
  <div style="background:#f6f7fb;border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
    <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#4f46e5;">${code}</span>
  </div>
`;

// Sends through Brevo's HTTPS API. Gives up after 10 seconds so the app never
// hangs on "Sending..." if the provider is slow or unreachable.
const sendViaBrevo = async ({ to, subject, html }) => {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Spendwise', email: fromEmail() },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    let detail = '';
    try {
      detail = JSON.stringify(await res.json());
    } catch (e) {
      /* response had no JSON body */
    }
    // Full detail goes to the server log only; users just see a generic message.
    console.error(`Brevo email failed (${res.status}): ${detail}`);
    throw new Error('Could not send the email right now. Please try again shortly.');
  }
};

const sendViaSmtp = async ({ to, subject, html }) => {
  await getTransporter().sendMail({ from: senderAddress(), to, subject, html });
};

const deliver = async (message) => {
  if (usesBrevo()) return sendViaBrevo(message);
  return sendViaSmtp(message);
};

// Sends the password reset code, or logs it to the console in dev mode
// if no email provider is configured, so the flow stays testable.
const sendPasswordResetEmail = async (toEmail, code) => {
  if (!isEmailConfigured()) {
    console.log('\n========== PASSWORD RESET CODE (dev mode — no email provider configured) ==========');
    console.log(`To: ${toEmail}`);
    console.log(`Code: ${code}`);
    console.log('====================================================================================\n');
    return;
  }

  await deliver({
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
    console.log('\n========== EMAIL VERIFICATION CODE (dev mode — no email provider configured) ==========');
    console.log(`To: ${toEmail}`);
    console.log(`Code: ${code}`);
    console.log('========================================================================================\n');
    return;
  }

  await deliver({
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
