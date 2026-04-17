/**
 * Team Invite Email — Resend template.
 * Sent when admin creates a new team member or clicks "Resend invite".
 */

import { Resend } from "resend";

const FROM = "LOOP Solutions <hello@loop.vn>";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error(
        "[EMAIL] RESEND_API_KEY is not set. Set it in Vercel Dashboard → Environment Variables."
      );
    }
    _resend = new Resend(apiKey);
  }
  return _resend;
}

const BRAND = {
  websiteUrl: "https://loops.vn",
  logoUrl: "https://loops.vn/assets/design-company/logo.png",
  brandName: "LOOP Solutions",
  year: new Date().getFullYear(),
};

// ─── Shared shell ────────────────────────────────────────────────────────────

function htmlShell(title: string, body: string, accent = "#EC4899") {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0a0f1e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1e;padding:40px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

        <!-- Logo header -->
        <tr><td style="padding:0 0 32px 0;text-align:center">
          <img src="${BRAND.logoUrl}" alt="LOOP Solutions" width="64" height="64" style="display:inline-block;border-radius:14px;margin-bottom:12px" />
          <div style="font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.5px">
            <span style="color:${accent}">LOOP</span> Solutions
          </div>
          <div style="font-size:11px;color:#475569;letter-spacing:0.1em;text-transform:uppercase;margin-top:4px">
            Hệ điều hành số · loops.vn
          </div>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#0d1526;border-radius:20px;border:1px solid rgba(236,72,153,0.15);overflow:hidden;padding:40px">
          ${body}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 0 0 0;text-align:center">
          <p style="margin:0;font-size:11px;color:#334155">
            © ${BRAND.year} LOOP Solutions · <a href="${BRAND.websiteUrl}" style="color:#EC4899;text-decoration:none">loops.vn</a>
          </p>
          <p style="margin:8px 0 0 0;font-size:10px;color:#1e293b">
            Email này được gửi tự động từ hệ thống LOOP Solutions.<br/>
            Vui lòng không reply trực tiếp email này.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TeamInviteEmailData {
  memberName: string;
  memberEmail: string;
  inviterName: string;
  inviterEmail: string;
  department: string;
  role: string;
  inviteUrl: string;
  expiresDays: number;
}

// ─── Template ────────────────────────────────────────────────────────────────

function teamInviteTemplate(data: TeamInviteEmailData): string {
  const html = `
  <!-- Greeting -->
  <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:800;color:#ffffff;line-height:1.2">
    Chào mừng đến với <span style="color:#EC4899">LOOP</span>, ${data.memberName}!
  </h1>
  <p style="margin:0 0 28px 0;font-size:15px;color:#94a3b8;line-height:1.6">
    Bạn đã được mời tham gia <strong style="color:#fff">LOOP Solutions</strong> bởi
    <strong style="color:#EC4899">${data.inviterName}</strong>.
    Nhấn nút bên dưới để đăng nhập bằng tài khoản Google của bạn.
  </p>

  <!-- CTA Button -->
  <div style="text-align:center;margin:0 0 32px 0">
    <a href="${data.inviteUrl}"
       style="display:inline-block;background:linear-gradient(135deg,#EC4899,#F472B6);color:#ffffff;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;box-shadow:0 8px 32px rgba(236,72,153,0.4)">
      🚀 Đăng nhập với Google
    </a>
  </div>

  <!-- Info card -->
  <div style="background:rgba(236,72,153,0.06);border:1px solid rgba(236,72,153,0.2);border-radius:14px;padding:20px;margin:0 0 24px 0">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#64748b;width:120px">Email</td>
        <td style="padding:8px 0;font-size:13px;color:#e2e8f0;text-align:right;font-weight:500">${data.memberEmail}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#64748b">Vai trò</td>
        <td style="padding:8px 0;font-size:13px;color:#EC4899;text-align:right;font-weight:600;text-transform:capitalize">${data.role}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#64748b">Phòng ban</td>
        <td style="padding:8px 0;font-size:13px;color:#e2e8f0;text-align:right">${data.department}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-size:13px;color:#64748b">Người mời</td>
        <td style="padding:8px 0;font-size:13px;color:#e2e8f0;text-align:right">${data.inviterName}</td>
      </tr>
    </table>
  </div>

  <!-- Notice -->
  <div style="background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.15);border-radius:10px;padding:14px 16px;margin:0 0 16px 0">
    <p style="margin:0;font-size:12px;color:#f59e0b;font-weight:600;margin-bottom:4px">⏱ Thời hạn</p>
    <p style="margin:0;font-size:12px;color:#94a3b8">
      Link đăng nhập có hiệu lực trong <strong style="color:#f59e0b">${data.expiresDays} ngày</strong>.
      Nếu hết hạn, liên hệ <a href="mailto:${data.inviterEmail}" style="color:#EC4899">${data.inviterEmail}</a> để nhận link mới.
    </p>
  </div>

  <!-- Security note -->
  <p style="margin:0;font-size:12px;color:#475569;line-height:1.6">
    Bạn cần đăng nhập bằng <strong style="color:#e2e8f0">đúng tài khoản Google</strong>
    có email <strong style="color:#e2e8f0">${data.memberEmail}</strong>.
    Nếu tài khoản Google của bạn khác email này, vui lòng liên hệ bộ phận Nhân sự.
  </p>
  `;

  return htmlShell(`Lời mời tham gia LOOP Solutions — ${data.memberName}`, html);
}

// ─── Sender ─────────────────────────────────────────────────────────────────

/**
 * Send team invite email to a newly created member.
 */
export async function sendTeamInviteEmail(
  data: TeamInviteEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = teamInviteTemplate(data);
    const resend = getResend();

    const { error } = await resend.emails.send({
      from: FROM,
      to: data.memberEmail,
      subject: `🚀 Bạn được mời tham gia LOOP Solutions — ${data.memberName}`,
      html,
    });

    if (error) {
      console.error("[EMAIL] Team invite failed:", error);
      return { success: false, error: error.message };
    }

    console.log(`[EMAIL] Team invite sent to ${data.memberEmail}`);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[EMAIL] Team invite error:", msg);
    return { success: false, error: msg };
  }
}
