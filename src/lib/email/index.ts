/**
 * Email Service — LOOP Solutions
 *
 * Sends transactional emails via SMTP (Brevo).
 * Free: 300 emails/day, no domain verification needed.
 *
 * Setup:
 *   1. Sign up: https://brevo.com (free tier available)
 *   2. SMTP credentials in Settings → SMTP & SMS
 *   3. Env vars in .env.local:
 *        BREVO_HOST     = smtp-relay.brevo.com
 *        BREVO_PORT     = 587
 *        BREVO_USER     = your Brevo SMTP username
 *        BREVO_PASS     = your Brevo SMTP password
 *        EMAIL_FROM     = LOOP Solutions <your@email.com>
 */

import nodemailer from "nodemailer";

// ─── Transporter ────────────────────────────────────────────────────────────────

function buildTransport() {
  return nodemailer.createTransport({
    host: process.env.BREVO_HOST ?? "smtp-relay.brevo.com",
    port: Number(process.env.BREVO_PORT ?? 587),
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.BREVO_USER,
      pass: process.env.BREVO_PASS,
    },
    connectionTimeout: 10_000,
    socketTimeout: 10_000,
  });
}

const smtpTransport = buildTransport();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").trim();
}

function isSmtpConfigured() {
  return !!process.env.BREVO_HOST && !!process.env.BREVO_PASS;
}

// ─── Brand Assets ───────────────────────────────────────────────────────────────

const BRAND = {
  logoUrl: "https://loops.vn/assets/design-company/logo.png",
  websiteUrl: "https://loops.vn",
  brandName: "LOOP Solutions",
  primaryColor: "#3B82F6",
  accentColor: "#818CF8",
  bgDark: "#020617",
  bgCard: "#0F172A",
  textLight: "#E2E8F0",
  textMuted: "#94A3B8",
  success: "#22C55E",
  warning: "#F59E0B",
  year: new Date().getFullYear(),
};

// ─── Email Templates ────────────────────────────────────────────────────────────

function emailShell(title: string, content: string, __accentColor = BRAND.primaryColor) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <!--[if mso]><style type="text/css">body,table,td{font-family:Arial,sans-serif!important}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:'DM Sans',Arial,sans-serif;-webkit-font-smoothing:antialiased">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1e">
    <tr><td align="center" style="padding:40px 16px">

      <!-- Wrapper Card -->
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#020617;border-radius:20px;overflow:hidden;border:1px solid rgba(59,130,246,0.15);box-shadow:0 24px 80px rgba(0,0,0,0.6)">

        <!-- Header Banner -->
        <tr><td style="background:linear-gradient(135deg,#020617 0%,#0f1a3a 50%,#020617 100%);padding:40px 48px 32px;text-align:center;border-bottom:1px solid rgba(59,130,246,0.2)">
          <!-- Logo -->
          <img src="${BRAND.logoUrl}" alt="LOOP Solutions" width="72" height="72" style="display:inline-block;border-radius:16px;margin-bottom:16px" />
          <!-- Brand Name -->
          <div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:0.05em;margin-bottom:4px">
            <span style="color:${BRAND.primaryColor}">LOOP</span> <span style="color:#fff">SOLUTIONS</span>
          </div>
          <!-- Tagline -->
          <div style="font-size:12px;color:#64748b;letter-spacing:0.1em;text-transform:uppercase">
            Hệ điều hành số · loops.vn
          </div>
        </td></tr>

        <!-- Accent Line -->
        <tr><td style="height:3px;background:linear-gradient(90deg,${BRAND.primaryColor},${BRAND.accentColor},${BRAND.primaryColor})"></td></tr>

        <!-- Content -->
        <tr><td style="padding:40px 48px;color:#e2e8f0;font-size:15px;line-height:1.8">
          ${content}
        </td></tr>

        <!-- CTA Button (if needed) -->
        <!-- Footer -->
        <tr><td style="padding:24px 48px 32px;border-top:1px solid rgba(59,130,246,0.12);text-align:center">
          <div style="font-size:12px;color:#475569;margin-bottom:12px">
            © ${BRAND.year} LOOP Solutions · <a href="${BRAND.websiteUrl}" style="color:${BRAND.primaryColor};text-decoration:none">loops.vn</a>
          </div>
          <div style="font-size:11px;color:#334155">
            Email này được gửi tự động từ hệ thống LOOP Solutions.<br/>
            Vui lòng không reply trực tiếp email này.
          </div>
        </td></tr>

      </table>
      <!-- /Wrapper Card -->

    </td></tr>
  </table>
</body>
</html>`;
}

// ─── OTP Template ─────────────────────────────────────────────────────────────

function otpEmailTemplate(code: string, minutes: number, purpose: string) {
  const purposeLabel = purpose === "password_reset"
    ? "đặt lại mật khẩu"
    : purpose === "email_verify"
    ? "xác thực email"
    : "đăng nhập";

  const html = `
  <!-- Title -->
  <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#ffffff;text-align:center;font-family:'Plus Jakarta Sans',Arial,sans-serif">
    🔐 Mã xác minh
  </h1>
  <p style="margin:0 0 28px 0;color:#94a3b8;font-size:14px;text-align:center">
    Yêu cầu mã OTP để <strong style="color:#e2e8f0">${purposeLabel}</strong>
  </p>

  <!-- OTP Box -->
  <div style="background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.25);border-radius:16px;padding:28px;text-align:center;margin-bottom:28px">
    <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:12px">Mã xác minh của bạn</div>
    <div style="font-family:'JetBrains Mono','Courier New',monospace;font-size:40px;font-weight:700;color:${BRAND.primaryColor};letter-spacing:0.25em;text-shadow:0 0 30px rgba(59,130,246,0.5)">${code}</div>
  </div>

  <!-- Countdown + Warning -->
  <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:10px;padding:16px 20px;margin-bottom:20px">
    <div style="font-size:13px;color:#f59e0b;font-weight:600;margin-bottom:4px">⏱ Mã có hiệu lực trong ${minutes} phút</div>
    <div style="font-size:12px;color:#94a3b8">Vui lòng sử dụng ngay. Không chia sẻ mã này với bất kỳ ai.</div>
  </div>

  <!-- Security Warning -->
  <div style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.15);border-radius:10px;padding:14px 20px;margin-bottom:8px">
    <div style="font-size:12px;color:#ef4444;font-weight:600;margin-bottom:4px">⚠️ Bảo mật</div>
    <div style="font-size:12px;color:#94a3b8">Không chia sẻ mã này với bất kỳ ai — kể cả nhân viên LOOP. Nếu bạn không yêu cầu, hãy bỏ qua email này.</div>
  </div>
  `;

  return emailShell("Mã xác minh — LOOP Solutions", html);
}

// ─── Password Reset Success Template ──────────────────────────────────────────

function passwordResetSuccessTemplate() {
  const html = `
  <!-- Success Icon -->
  <div style="text-align:center;margin-bottom:24px">
    <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;background:rgba(34,197,94,0.1);border:2px solid rgba(34,197,94,0.3);border-radius:50%;margin-bottom:16px">
      <span style="font-size:28px">✅</span>
    </div>
    <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#ffffff;text-align:center;font-family:'Plus Jakarta Sans',Arial,sans-serif">
      Đặt lại mật khẩu thành công
    </h1>
    <p style="margin:0;color:#94a3b8;font-size:14px">
      Mật khẩu của bạn đã được thay đổi thành công.
    </p>
  </div>

  <!-- CTA Button -->
  <div style="text-align:center;margin:28px 0">
    <a href="${BRAND.websiteUrl}/vi/dang-nhap"
       style="display:inline-block;background:${BRAND.primaryColor};color:#ffffff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;box-shadow:0 4px 20px rgba(59,130,246,0.4)">
      Đăng nhập ngay
    </a>
  </div>

  <!-- Security Notice -->
  <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:10px;padding:14px 20px">
    <div style="font-size:12px;color:#f59e0b;font-weight:600;margin-bottom:4px">🔒 Bảo mật</div>
    <div style="font-size:12px;color:#94a3b8">Nếu đây không phải bạn, hãy liên hệ <a href="mailto:admin@loops.vn" style="color:${BRAND.primaryColor}">admin@loops.vn</a> ngay.</div>
  </div>
  `;

  return emailShell("Đặt lại mật khẩu thành công — LOOP Solutions", html);
}

// ─── Core send function ────────────────────────────────────────────────────────

async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: string }> {
  const { to, subject, html } = opts;

  // No SMTP configured: log only (dev fallback)
  if (!isSmtpConfigured()) {
    console.log("\n📧 [DEV EMAIL] ─────────────────────────────");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Body:", stripHtml(html));
    console.log("─────────────────────────────────────────\n");
    return { success: true };
  }

  try {
    const info = await smtpTransport.sendMail({
      from: process.env.EMAIL_FROM ?? `LOOP Solutions <noreply@loops.vn>`,
      to,
      subject,
      html,
    });
    console.log(`[EMAIL] Sent to ${to}: ${info.messageId}`);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[EMAIL] Failed to send to ${to}:`, msg);
    return { success: false, error: msg };
  }
}

// ─── Public API ────────────────────────────────────────────────────────────────

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

export async function sendPasswordChangedNotification(
  email: string
): Promise<{ success: boolean; error?: string }> {
  return sendEmail({
    to: email,
    subject: `🔒 Mật khẩu đã được thay đổi — LOOP Solutions`,
    html: passwordResetSuccessTemplate(),
  });
}
