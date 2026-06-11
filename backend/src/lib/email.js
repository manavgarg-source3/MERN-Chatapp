import nodemailer from "nodemailer";

const getClientUrl = () => {
  if (process.env.NODE_ENV === "production") {
    return process.env.CLIENT_URL || "https://gargx.onrender.com";
  }

  return process.env.DEV_CLIENT_URL || "http://localhost:5173";
};

export const getFriendRequestsUrl = () =>
  `${getClientUrl().replace(/\/$/, "")}/?friendRequests=1`;

export const getAppHomeUrl = () => `${getClientUrl().replace(/\/$/, "")}/`;

// Gmail SMTP transport — works locally, but Render blocks outbound SMTP so it
// hangs/fails in production. Kept only as a fallback when RESEND_API_KEY is unset.
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// "From" address. Resend requires either a verified domain sender or its test
// sender `onboarding@resend.dev` (which can ONLY deliver to your Resend account
// email until you verify a domain). Override with EMAIL_FROM once a domain is set.
const FROM_ADDRESS = process.env.EMAIL_FROM || "GargX <onboarding@resend.dev>";

// Send via Resend's HTTPS API (port 443 — not blocked by Render, unlike SMTP).
const sendViaResend = async ({ to, subject, html }) => {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to, subject, html }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend send failed (${res.status}): ${detail}`);
  }
};

// Single entry point used by every email below. Prefers Resend (works in prod);
// falls back to Gmail SMTP locally when no Resend key is configured.
const sendEmail = async ({ to, subject, html }) => {
  if (process.env.RESEND_API_KEY) {
    return sendViaResend({ to, subject, html });
  }
  return transporter.sendMail({
    from: `"GargX" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

export const sendPasswordResetEmail = async ({ email, fullName, resetUrl }) => {
  await sendEmail({
    to: email,
    subject: "Reset your GargX password",
    html: `
      <div style="background:#f4f6fb;padding:40px 0;font-family: 'Segoe UI', Arial, sans-serif;">
        <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 8px 30px rgba(0,0,0,0.08);">
          
          <h1 style="margin:0;font-size:22px;color:#111827;">🔐 Password Reset</h1>
          <p style="color:#6b7280;margin-top:8px;">Hi ${fullName || "there"},</p>

          <p style="color:#374151;">
            We received a request to reset your password for your <b>GargX</b> account.
          </p>

          <div style="text-align:center;margin:30px 0;">
            <a href="${resetUrl}" 
              style="background:#2563eb;color:#fff;padding:14px 22px;border-radius:10px;
              text-decoration:none;font-weight:600;display:inline-block;">
              Reset Password
            </a>
          </div>

          <p style="font-size:14px;color:#6b7280;">
            This link will expire in <b>1 hour</b>.
          </p>

          <div style="margin-top:20px;padding:12px;background:#f9fafb;border-radius:8px;">
            <p style="font-size:13px;color:#6b7280;word-break:break-all;">
              ${resetUrl}
            </p>
          </div>

          <hr style="margin:30px 0;border:none;border-top:1px solid #e5e7eb;" />

          <p style="font-size:12px;color:#9ca3af;text-align:center;">
            If you didn’t request this, you can safely ignore this email.
          </p>

        </div>
      </div>
    `,
  });
};

export const sendVerificationOtpEmail = async ({ email, fullName, otp }) => {
  await sendEmail({
    to: email,
    subject: "Verify your GargX email",
    html: `
      <div style="background:#f4f6fb;padding:40px 0;font-family: 'Segoe UI', Arial, sans-serif;">
        <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 8px 30px rgba(0,0,0,0.08);">
          
          <h1 style="margin:0;font-size:22px;color:#111827;">📩 Email Verification</h1>
          <p style="color:#6b7280;margin-top:8px;">Hi ${fullName || "there"},</p>

          <p style="color:#374151;">
            Enter the following OTP to verify your <b>GargX</b> account.
          </p>

          <div style="margin:30px 0;text-align:center;">
            <span style="display:inline-block;background:#111827;color:#fff;
              padding:14px 24px;border-radius:12px;
              font-size:26px;font-weight:700;letter-spacing:6px;">
              ${otp}
            </span>
          </div>

          <p style="text-align:center;color:#6b7280;font-size:14px;">
            This OTP is valid for <b>10 minutes</b>
          </p>

          <hr style="margin:30px 0;border:none;border-top:1px solid #e5e7eb;" />

          <p style="font-size:12px;color:#9ca3af;text-align:center;">
            Never share this code with anyone.
          </p>

        </div>
      </div>
    `,
  });
};

export const sendFriendRequestEmail = async ({ toEmail, toName, fromName, requestsUrl }) => {
  await sendEmail({
    to: toEmail,
    subject: `${fromName} sent you a friend request on GargX`,
    html: `
      <div style="background:#f4f6fb;padding:40px 0;font-family:'Segoe UI', Arial, sans-serif;">
        <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:16px;padding:32px;
          box-shadow:0 8px 30px rgba(0,0,0,0.08);">

          <h1 style="margin:0;font-size:22px;color:#111827;">👋 New Friend Request</h1>
          <p style="color:#6b7280;margin-top:8px;">Hi ${toName || "there"},</p>

          <p style="color:#374151;">
            <b>${fromName}</b> wants to connect with you on <b>GargX</b>.
          </p>

          <div style="text-align:center;margin:30px 0;">
            <a href="${requestsUrl}" 
              style="background:#2563eb;color:#fff;padding:14px 22px;border-radius:10px;
              text-decoration:none;font-weight:600;display:inline-block;">
              View Request
            </a>
          </div>

          <p style="font-size:14px;color:#6b7280;text-align:center;">
            Open GargX to accept or ignore the request.
          </p>

          <div style="margin-top:20px;padding:12px;background:#f9fafb;border-radius:8px;">
            <p style="font-size:13px;color:#6b7280;word-break:break-all;">
              ${requestsUrl}
            </p>
          </div>

          <hr style="margin:30px 0;border:none;border-top:1px solid #e5e7eb;" />

          <p style="font-size:12px;color:#9ca3af;text-align:center;">
            Stay connected. Stay social. 🚀
          </p>

        </div>
      </div>
    `,
  });
};

export const sendFriendRequestAcceptedEmail = async ({
  toEmail,
  toName,
  acceptedByName,
  chatUrl,
}) => {
  await sendEmail({
    to: toEmail,
    subject: `${acceptedByName} accepted your friend request on GargX`,
    html: `
      <div style="background:#f4f6fb;padding:40px 0;font-family:'Segoe UI', Arial, sans-serif;">
        <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:16px;padding:32px;
          box-shadow:0 8px 30px rgba(0,0,0,0.08);">

          <h1 style="margin:0;font-size:22px;color:#111827;">🎉 You're Connected!</h1>
          <p style="color:#6b7280;margin-top:8px;">Hi ${toName || "there"},</p>

          <p style="color:#374151;">
            <b>${acceptedByName}</b> accepted your friend request. You can now start chatting!
          </p>

          <div style="text-align:center;margin:30px 0;">
            <a href="${chatUrl}" 
              style="background:#10b981;color:#fff;padding:14px 22px;border-radius:10px;
              text-decoration:none;font-weight:600;display:inline-block;">
              Start Chatting
            </a>
          </div>

          <p style="font-size:14px;color:#6b7280;text-align:center;">
            Jump into GargX and say hello 👋
          </p>

          <div style="margin-top:20px;padding:12px;background:#f9fafb;border-radius:8px;">
            <p style="font-size:13px;color:#6b7280;word-break:break-all;">
              ${chatUrl}
            </p>
          </div>

          <hr style="margin:30px 0;border:none;border-top:1px solid #e5e7eb;" />

          <p style="font-size:12px;color:#9ca3af;text-align:center;">
            Conversations start here 💬
          </p>

        </div>
      </div>
    `,
  });
};
