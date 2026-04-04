/**
 * Email Service — LOOP Solutions
 *
 * Sends transactional emails via Resend API.
 *
 * Setup:
 *   1. Create account: https://resend.com (free: 100 emails/day)
 *   2. Add & verify a domain (Settings → Domains)
 *      e.g. loops.vn or mg.loops.vn — requires DNS access
 *      OR use your Gmail address (free tier only sends TO that address)
 *   3. Add to Vercel env vars:
 *        RESEND_API_KEY   = re_xxxxx
 *        EMAIL_FROM       = LOOP Solutions <noreply@your-domain.com>
 *
 * Dev mode: logs emails to console, no external send.
 */

import { Resend } from "resend";

// ─── Resend client ────────────────────────────────────────────────────────────

function createResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[EMAIL] RESEND_API_KEY not set — emails will be logged only");
    return null;
  }
  return new Resend(apiKey);
}

const resend = createResendClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").trim();
}

function isDev() {
  return process.env.NODE_ENV === "development" && !resend;
}

// ─── Email Templates ────────────────────────────────────────────────────────────

function baseTemplate(content: string) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LOOP Solutions</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f4f8; font-family: 'Inter', Arial, sans-serif; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #020617; border-radius: 16px; overflow: hidden; box-shadow: 0 24px 80px rgba(0,0,0,0.4); }
    .header { padding: 32px 40px 24px; border-bottom: 1px solid rgba(59,130,246,0.2); }
    .logo { font-family: 'Cinzel', serif; font-size: 20px; font-weight: 900; color: #fff; letter-spacing: 0.1em; }
    .logo span { color: #3B82F6; }
    .content { padding: 32px 40px; color: #e2e8f0; font-size: 15px; line-height: 1.7; }
    .otp-code { display: inline-block; background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.4); border-radius: 10px; padding: 14px 28px; font-family: 'JetBrains Mono', monospace; font-size: 32px; font-weight: 700; color: #3B82F6; letter-spacing: 0.2em; margin: 16px 0; }
    .footer { padding: 20px 40px; border-top: 1px solid rgba(59,130,246,0.15); font-size: 12px; color: #64748b; text-align: center; }
    .footer a { color: #3B82F6; text-decoration: none; }
    .warn { color: #f59e0b; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">LOOP <span>SOLUTIONS</span></div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} LOOP Solutions · <a href="https://loops.vn">loops.vn</a>
    </div>
  </div>
</body>
</html>`;
}

function otpEmailTemplate(code: string, minutes: number, purpose: string) {
  const purposeLabel = purpose === "password_reset"
    ? "đặt lại mật khẩu"
    : purpose === "email_verify"
    ? "xác thực email"
    : "đăng nhập";

  return baseTemplate(`
    <h2 style="color:#fff;font-family:Cinzel,serif;margin:0 0 12px;font-size:22px;">
      Mã xác minh
    </h2>
    <p style="margin:0 0 20px;color:#94a3b8;">
      Bạn yêu cầu mã OTP để <strong style="color:#e2e8f0">${purposeLabel}</strong>.
      Mã của bạn:
    </p>
    <div style="text-align:center;">
      <div class="otp-code">${code}</div>
    </div>
    <p style="color:#64748b;font-size:13px;margin:16px 0 0;">
      ⏱ Mã có hiệu lực trong <strong style="color:#f59e0b">${minutes} phút</strong>.
      Nếu bạn không yêu cầu, vui lòng bỏ qua email này.
    </p>
    <p class="warn" style="margin-top:24px;font-size:12px;">
      ⚠ Không chia sẻ mã này với bất kỳ ai — kể cả nhân viên LOOP.
    </p>
  `);
}

function passwordResetSuccessTemplate() {
  return baseTemplate(`
    <h2 style="color:#22c55e;font-family:Cinzel,serif;margin:0 0 12px;font-size:22px;">
      ✅ Đặt lại mật khẩu thành công
    </h2>
    <p style="margin:0 0 20px;color:#94a3b8;">
      Mật khẩu của bạn đã được thay đổi thành công.
      Nếu đây không phải bạn, hãy liên hệ <strong style="color:#e2e8f0">admin@loops.vn</strong> ngay.
    </p>
    <a href="https://loops.vn/vi/dang-nhap"
       style="display:inline-block;background:#3b82f6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px;">
      Đăng nhập ngay
    </a>
  `);
}

// ─── Core send function ────────────────────────────────────────────────────────

function getFromAddress(): string {
  return (
    process.env.EMAIL_FROM ??
    `LOOP Solutions <noreply@loops.vn>`
  );
}

async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: string }> {
  const { to, subject, html } = opts;

  // Dev mode: log only
  if (isDev()) {
    console.log("\n📧 [DEV EMAIL] ─────────────────────────────");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Body:", stripHtml(html));
    console.log("─────────────────────────────────────────\n");
    return { success: true };
  }

  if (!resend) {
    return { success: false, error: "Resend client not initialized" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to,
      subject,
      html,
    });

    if (error) {
      console.error(`[EMAIL] Resend error:`, error);
      return { success: false, error: error.message };
    }

    console.log(`[EMAIL] Sent to ${to}: ${data?.id}`);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[EMAIL] Failed to send to ${to}:`, msg);
    return { success: false, error: msg };
  }
}

// ─── Public API ────────────────────────────────────────────────────────────────

/** Send OTP code for password reset */
export async function sendPasswordResetOtp(
  email: string,
  code: string,
  minutes = 5
): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to: email,
    subject: `🔐 Mã OTP đặt lại mật khẩu — LOOP Solutions`,
    html: otpEmailTemplate(code, minutes, "password_reset"),
  });
}

/** Send OTP code for email verification */
export async function sendEmailVerifyOtp(
  email: string,
  code: string,
  minutes = 10
): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to: email,
    subject: `✅ Xác thực email — LOOP Solutions`,
    html: otpEmailTemplate(code, minutes, "email_verify"),
  });
}

/** Notify user that password was changed */
export async function sendPasswordChangedNotification(
  email: string
): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to: email,
    subject: `🔒 Mật khẩu đã được thay đổi — LOOP Solutions`,
    html: passwordResetSuccessTemplate(),
  });
}
