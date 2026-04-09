/**
 * Email Sender — Resend + React Email templates.
 * All transactional emails go through this module.
 */

import { Resend } from "resend";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

/**
 * Lazy Resend client — only instantiated when RESEND_API_KEY is present.
 * Module-level `new Resend(undefined)` would throw at startup,
 * crashing the app in environments where email is optional (dev, CI).
 */
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

const FROM = "LOOP <hello@loop.vn>";
const FROM_ALERTS = "LOOP Alerts <alerts@loop.vn>";

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmtVND = (n: number) =>
  Intl.NumberFormat("vi-VN").format(n) + " ₫";

const htmlShell = (title: string, body: string, __accent = "#8B5CF6") => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f1a;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
        <!-- Header -->
        <tr><td style="padding:0 0 24px 0;text-align:center">
          <span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px">
            <span style="color:#8B5CF6">LOOP</span> Studio
          </span>
        </td></tr>
        <!-- Card -->
        <tr><td style="background:#16162a;border-radius:16px;border:1px solid rgba(255,255,255,0.08);padding:32px">
          <h1 style="margin:0 0 8px 0;font-size:20px;font-weight:700;color:#fff">${title}</h1>
          ${body}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 0 0 0;text-align:center">
          <p style="margin:0;font-size:12px;color:rgba(209,213,219,0.3)">
            Đây là email tự động từ hệ thống LOOP Studio — vui lòng không reply.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ─── Email Types ─────────────────────────────────────────────────────────────

export interface StandupReminderEmailData {
  memberName: string;
  memberEmail: string;
  projectName: string;
  projectOrderNumber: string;
  standupDate: Date;
}

export interface ContactConfirmationEmailData {
  name: string;
  email: string;
  message: string;
  phone?: string;
  service?: string;
}

export interface OrderConfirmationEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  items: string[];
}

export interface SlaViolationEmailData {
  taskTitle: string;
  taskId: string;
  projectOrderNumber: string;
  deadline: Date;
  assignees: { name: string; email: string }[];
  pmEmail?: string;
}

export interface SlaWarningEmailData {
  taskTitle: string;
  taskId: string;
  projectOrderNumber: string;
  deadline: Date;
  hoursRemaining: number;
  assigneeName: string;
  assigneeEmail: string;
}

export interface SocialPublishEmailData {
  projectName: string;
  projectOrderNumber: string;
  postContent: string;
  platform: string;
  scheduledAt: Date;
}

export interface LpMonthlyReportEmailData {
  totalLp: number;
  completedTasks: number;
  violatedTasks: number;
  completionRate: number;
  violationRate: number;
  period: string;
}

// ─── Senders ─────────────────────────────────────────────────────────────────

/** Daily standup reminder — sent to each team member who hasn't posted */
export async function sendStandupReminder(data: StandupReminderEmailData) {
  const dateStr = format(data.standupDate, "EEEE, dd/MM/yyyy", { locale: vi });
  const html = htmlShell(
    "⏰ Nhắc nhở Daily Standup",
    `<p style="margin:0 0 16px 0;font-size:15px;color:rgba(209,213,219,0.8)">
      Chào ${data.memberName}, bạn chưa post standup hôm nay cho dự án
      <strong style="color:#fff">${data.projectName}</strong> (${data.projectOrderNumber}).
    </p>
    <div style="background:rgba(139,92,246,0.1);border-radius:10px;padding:20px;text-align:center;margin:0 0 16px 0">
      <p style="margin:0;font-size:13px;color:rgba(209,213,219,0.6)">📅 Hôm nay</p>
      <p style="margin:8px 0 0 0;font-size:16px;font-weight:700;color:#fff;text-transform:capitalize">${dateStr}</p>
    </div>
    <p style="margin:0;font-size:13px;color:rgba(209,213,219,0.5)">
      Vui lòng post standup tại <strong style="color:#8B5CF6">/admin/projects/${data.projectOrderNumber}/standups</strong>
      trước 09:00 sáng.
    </p>`
  );

  const { error } = await getResend().emails.send({
    from: FROM_ALERTS,
    to: data.memberEmail,
    subject: `⏰ Nhắc nhở Standup — ${data.projectOrderNumber} — ${dateStr}`,
    html,
  });

  if (error) console.error("[Email] Standup reminder failed:", error);
  return { error };
}

/** SLA violation alert — sent when a task misses its deadline */
export async function sendSlaViolationAlert(data: SlaViolationEmailData) {
  const deadlineStr = format(data.deadline, "HH:mm dd/MM/yyyy", { locale: vi });
  const recipients = [
    ...data.assignees.map(a => a.email),
    ...(data.pmEmail ? [data.pmEmail] : []),
  ].filter(Boolean);

  const html = htmlShell(
    "🚨 SLA Violation — Task quá hạn!",
    `<div style="background:rgba(239,68,68,0.1);border-radius:10px;padding:16px;margin:0 0 20px 0;border-left:3px solid #EF4444">
      <p style="margin:0;font-size:13px;color:#EF4444;font-weight:600">⚠️ Task đã quá hạn SLA</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0">
      <tr><td style="padding:6px 0;font-size:13px;color:rgba(209,213,219,0.5)">Task</td>
          <td style="padding:6px 0;font-size:13px;color:#fff;text-align:right;font-weight:600">${data.taskTitle}</td></tr>
      <tr><td style="padding:6px 0;font-size:13px;color:rgba(209,213,219,0.5)">Dự án</td>
          <td style="padding:6px 0;font-size:13px;color:#fff;text-align:right">${data.projectOrderNumber}</td></tr>
      <tr><td style="padding:6px 0;font-size:13px;color:rgba(209,213,219,0.5)">Deadline</td>
          <td style="padding:6px 0;font-size:13px;color:#EF4444;text-align:right;font-weight:600">${deadlineStr}</td></tr>
    </table>
    <p style="margin:0;font-size:13px;color:rgba(209,213,219,0.5)">
      Task ID: <code style="color:#8B5CF6">${data.taskId}</code>
    </p>`,
    "#EF4444"
  );

  const { error } = await getResend().emails.send({
    from: FROM_ALERTS,
    to: recipients,
    subject: `🚨 SLA Violation — ${data.taskTitle} — ${data.projectOrderNumber}`,
    html,
  });

  if (error) console.error("[Email] SLA violation alert failed:", error);
  return { error };
}

/** SLA warning — sent 24h before deadline */
export async function sendSlaWarning(data: SlaWarningEmailData) {
  const deadlineStr = format(data.deadline, "HH:mm dd/MM/yyyy", { locale: vi });
  const html = htmlShell(
    "⚠️ Task sắp quá hạn SLA",
    `<div style="background:rgba(245,158,11,0.1);border-radius:10px;padding:16px;margin:0 0 20px 0;border-left:3px solid #F59E0B">
      <p style="margin:0;font-size:13px;color:#F59E0B;font-weight:600">
        ⏰ Còn ${data.hoursRemaining}h trước khi deadline — hành động ngay!
      </p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0">
      <tr><td style="padding:6px 0;font-size:13px;color:rgba(209,213,219,0.5)">Task</td>
          <td style="padding:6px 0;font-size:13px;color:#fff;text-align:right;font-weight:600">${data.taskTitle}</td></tr>
      <tr><td style="padding:6px 0;font-size:13px;color:rgba(209,213,219,0.5)">Dự án</td>
          <td style="padding:6px 0;font-size:13px;color:#fff;text-align:right">${data.projectOrderNumber}</td></tr>
      <tr><td style="padding:6px 0;font-size:13px;color:rgba(209,213,219,0.5)">Deadline</td>
          <td style="padding:6px 0;font-size:13px;color:#F59E0B;text-align:right;font-weight:600">${deadlineStr}</td></tr>
    </table>
    <p style="margin:0;font-size:13px;color:rgba(209,213,219,0.5)">
      Task ID: <code style="color:#8B5CF6">${data.taskId}</code>
    </p>`,
    "#F59E0B"
  );

  const { error } = await getResend().emails.send({
    from: FROM_ALERTS,
    to: data.assigneeEmail,
    subject: `⚠️ Warning — ${data.taskTitle} sắp quá hạn (${data.hoursRemaining}h)`,
    html,
  });

  if (error) console.error("[Email] SLA warning failed:", error);
  return { error };
}

/** Social post published notification */
export async function sendSocialPublishNotification(data: SocialPublishEmailData) {
  const timeStr = format(data.scheduledAt, "HH:mm dd/MM/yyyy", { locale: vi });
  const platformIcon = { facebook: "📘", instagram: "📷", tiktok: "🎵", linkedin: "💼", twitter: "🐦" }[data.platform.toLowerCase()] ?? "📱";
  const html = htmlShell(
    `${platformIcon} Bài viết đã được lên lịch`,
    `<p style="margin:0 0 20px 0;font-size:15px;color:rgba(209,213,219,0.8)">
      Bài viết cho dự án <strong style="color:#fff">${data.projectName}</strong> (${data.projectOrderNumber})
      đã được lên lịch xuất bản:
    </p>
    <div style="background:rgba(139,92,246,0.08);border-radius:10px;padding:16px;margin:0 0 16px 0">
      <p style="margin:0 0 8px 0;font-size:12px;color:rgba(209,213,219,0.5)">NỀN TẢNG</p>
      <p style="margin:0;font-size:15px;font-weight:700;color:#fff">${platformIcon} ${data.platform.toUpperCase()}</p>
    </div>
    <div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:16px;margin:0 0 16px 0">
      <p style="margin:0 0 8px 0;font-size:12px;color:rgba(209,213,219,0.5)">NỘI DUNG</p>
      <p style="margin:0;font-size:13px;color:#fff;white-space:pre-wrap">${data.postContent.slice(0, 280)}${data.postContent.length > 280 ? "…" : ""}</p>
    </div>
    <p style="margin:0;font-size:13px;color:rgba(209,213,219,0.5)">
      🕐 Xuất bản lúc: <strong style="color:#10B981">${timeStr}</strong>
    </p>`
  );

  const { error } = await getResend().emails.send({
    from: FROM,
    to: process.env.ADMIN_EMAIL ?? "alerts@loop.vn",
    subject: `${platformIcon} Social Post scheduled — ${data.projectOrderNumber} — ${timeStr}`,
    html,
  });

  if (error) console.error("[Email] Social publish notification failed:", error);
  return { error };
}

/** Monthly LP report — sent to management */
export async function sendLpMonthlyReport(data: LpMonthlyReportEmailData, toEmail: string) {
  const html = htmlShell(
    "📊 LP Monthly Report — LOOP Studio",
    `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:0 0 20px 0">
      <div style="background:rgba(139,92,246,0.08);border-radius:10px;padding:16px;text-align:center">
        <p style="margin:0;font-size:24px;font-weight:900;color:#A78BFA">⬡${Intl.NumberFormat("vi-VN").format(data.totalLp)}</p>
        <p style="margin:4px 0 0 0;font-size:11px;color:rgba(209,213,219,0.5)">Tổng LP tháng</p>
      </div>
      <div style="background:rgba(16,185,129,0.08);border-radius:10px;padding:16px;text-align:center">
        <p style="margin:0;font-size:24px;font-weight:900;color:#10B981">${data.completionRate}%</p>
        <p style="margin:4px 0 0 0;font-size:11px;color:rgba(209,213,219,0.5)">Completion Rate</p>
      </div>
      <div style="background:rgba(59,130,246,0.08);border-radius:10px;padding:16px;text-align:center">
        <p style="margin:0;font-size:24px;font-weight:900;color:#3B82F6">${data.completedTasks}</p>
        <p style="margin:4px 0 0 0;font-size:11px;color:rgba(209,213,219,0.5)">Tasks hoàn thành</p>
      </div>
      <div style="background:rgba(239,68,68,0.08);border-radius:10px;padding:16px;text-align:center">
        <p style="margin:0;font-size:24px;font-weight:900;color:#EF4444">${data.violationRate}%</p>
        <p style="margin:4px 0 0 0;font-size:11px;color:rgba(209,213,219,0.5)">Violation Rate</p>
      </div>
    </div>
    <p style="margin:0;font-size:12px;color:rgba(209,213,219,0.4);text-align:center">
      Kỳ báo cáo: ${data.period}
    </p>`
  );

  const { error } = await getResend().emails.send({
    from: FROM_ALERTS,
    to: toEmail,
    subject: `📊 LP Report — ${data.period} — ${data.totalLp} LP awarded`,
    html,
  });

  if (error) console.error("[Email] LP monthly report failed:", error);
  return { error };
}

// ─── Demo Ready Email ──────────────────────────────────────────────────────────

export interface DemoReadyEmailData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  maskedUrl: string;
  note?: string;
}

/** Demo ready — sent to the customer when designer sends a Figma demo */
export async function sendDemoReadyEmail(data: DemoReadyEmailData) {
  const html = htmlShell(
    `✨ Demo cho đơn hàng ${data.orderNumber} đã sẵn sàng!`,
    `<p style="margin:0 0 20px 0;font-size:15px;color:rgba(209,213,219,0.8)">
      Chào <strong style="color:#fff">${data.customerName}</strong>, demo thiết kế cho đơn hàng <strong style="color:#8B5CF6">${data.orderNumber}</strong> đã sẵn sàng để bạn xem.
    </p>
    <div style="background:rgba(59,130,246,0.1);border-radius:12px;border:1px solid rgba(59,130,246,0.2);padding:20px;margin:0 0 20px 0;text-align:center">
      <p style="margin:0 0 8px 0;font-size:11px;color:rgba(209,213,219,0.5);font-family:monospace;letter-spacing:0.1em">XEM DEMO TẠI</p>
      <a href="https://${data.maskedUrl}" style="font-size:16px;font-weight:700;color:#3B82F6;text-decoration:none;word-break:break-all">${data.maskedUrl}</a>
    </div>
    ${data.note ? `<p style="margin:0 0 20px 0;font-size:14px;color:rgba(209,213,219,0.7)">${data.note}</p>` : ""}
    <p style="margin:0 0 20px 0;font-size:13px;color:rgba(209,213,219,0.5)">
      Bạn có thể phản hồi trực tiếp trên dashboard hoặc liên hệ LOOP qua <a href="mailto:hello@loop.vn" style="color:#8B5CF6">hello@loop.vn</a>.
    </p>
    <div style="background:rgba(139,92,246,0.08);border-radius:10px;padding:16px;margin:0">
      <p style="margin:0;font-size:12px;color:rgba(209,213,219,0.6)">
        💡 <strong style="color:#fff">Lưu ý:</strong> Bạn có thể yêu cầu <strong style="color:#fff">1 lần revision</strong> miễn phí trong vòng <strong style="color:#fff">1 tuần</strong> sau khi nhận demo.
      </p>
    </div>`
  );

  const { error } = await getResend().emails.send({
    from: "LOOP Studio <hello@loop.vn>",
    to: data.customerEmail,
    subject: `✨ Demo "${data.orderNumber}" đã sẵn sàng — LOOP Studio`,
    html,
  });

  if (error) console.error("[Email] Demo ready failed:", error);
  return { error };
}

/** Contact form confirmation — sent to the customer */
export async function sendContactConfirmation(data: ContactConfirmationEmailData) {
  const html = htmlShell(
    `Cảm ơn ${data.name} đã liên hệ với LOOP!`,
    `<p style="margin:0 0 20px 0;font-size:15px;color:rgba(209,213,219,0.8)">
      Chào <strong style="color:#fff">${data.name}</strong>, chúng tôi đã nhận được liên hệ của bạn và sẽ phản hồi trong vòng <strong style="color:#8B5CF6">24 giờ làm việc</strong>.
    </p>
    <div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:16px;margin:0 0 20px 0">
      <p style="margin:0 0 8px 0;font-size:12px;color:rgba(209,213,219,0.5)">NỘI DUNG BẠN ĐÃ GỬI</p>
      ${data.service ? `<p style="margin:0 0 4px 0;font-size:13px;color:rgba(209,213,219,0.6)">Dịch vụ: <strong style="color:#fff">${data.service}</strong></p>` : ""}
      ${data.phone ? `<p style="margin:0 0 4px 0;font-size:13px;color:rgba(209,213,219,0.6)">Điện thoại: <strong style="color:#fff">${data.phone}</strong></p>` : ""}
      <p style="margin:8px 0 0 0;font-size:13px;color:#fff;white-space:pre-wrap">${data.message}</p>
    </div>
    <p style="margin:0;font-size:13px;color:rgba(209,213,219,0.5)">
      LOOP Studio — Chúng tôi biến ý tưởng của bạn thành hiện thực số.
    </p>`
  );

  const { error } = await getResend().emails.send({
    from: FROM,
    to: data.email,
    subject: `Cảm ơn ${data.name} đã liên hệ với LOOP Studio!`,
    html,
  });

  if (error) console.error("[Email] Contact confirmation failed:", error);
  return { error };
}

/** Admin notification — new contact form submission */
export async function sendAdminContactNotification(data: ContactConfirmationEmailData) {
  const html = htmlShell(
    "📩 Yêu cầu liên hệ mới từ website",
    `<div style="background:rgba(239,68,68,0.08);border-radius:10px;padding:16px;margin:0 0 20px 0;border-left:3px solid #EF4444">
      <p style="margin:0;font-size:13px;color:#EF4444;font-weight:600">Khách hàng mới liên hệ — cần phản hồi!</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0">
      <tr><td style="padding:6px 0;font-size:13px;color:rgba(209,213,219,0.5)">Tên</td>
          <td style="padding:6px 0;font-size:13px;color:#fff;text-align:right;font-weight:600">${data.name}</td></tr>
      <tr><td style="padding:6px 0;font-size:13px;color:rgba(209,213,219,0.5)">Email</td>
          <td style="padding:6px 0;font-size:13px;color:#8B5CF6;text-align:right">${data.email}</td></tr>
      ${data.phone ? `<tr><td style="padding:6px 0;font-size:13px;color:rgba(209,213,219,0.5)">Điện thoại</td>
          <td style="padding:6px 0;font-size:13px;color:#fff;text-align:right">${data.phone}</td></tr>` : ""}
      ${data.service ? `<tr><td style="padding:6px 0;font-size:13px;color:rgba(209,213,219,0.5)">Dịch vụ</td>
          <td style="padding:6px 0;font-size:13px;color:#fff;text-align:right">${data.service}</td></tr>` : ""}
    </table>
    <div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:16px">
      <p style="margin:0 0 8px 0;font-size:12px;color:rgba(209,213,219,0.5)">NỘI DUNG</p>
      <p style="margin:0;font-size:13px;color:#fff;white-space:pre-wrap">${data.message}</p>
    </div>`,
    "#EF4444"
  );

  const adminEmail = process.env.ADMIN_EMAIL ?? "alerts@loop.vn";
  const { error } = await getResend().emails.send({
    from: FROM_ALERTS,
    to: adminEmail,
    subject: `📩 Yêu cầu mới — ${data.name} — ${data.email}`,
    html,
  });

  if (error) console.error("[Email] Admin contact notification failed:", error);
  return { error };
}

/** Handover delivered — sent to the customer when their project is handed over */
export async function sendHandoverDelivered(data: {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  handoverDate: Date;
  projectName: string;
  figmaUrl?: string | null;
  githubUrl?: string | null;
  deploymentUrl?: string | null;
  completedItems?: number;
  totalItems?: number;
}) {
  const html = htmlShell(
    `🎉 Gói bàn giao cho đơn hàng ${data.orderNumber} đã sẵn sàng!`,
    `<p style="margin:0 0 20px 0;font-size:15px;color:rgba(209,213,219,0.8)">
      Chào <strong style="color:#fff">${data.customerName}</strong>, dự án <strong style="color:#8B5CF6">${data.projectName}</strong> đã hoàn thành và sẵn sàng bàn giao cho bạn.
    </p>
    <div style="background:rgba(16,185,129,0.08);border-radius:12px;border:1px solid rgba(16,185,129,0.2);padding:20px;margin:0 0 20px 0;text-align:center">
      <p style="margin:0 0 8px 0;font-size:11px;color:rgba(209,213,219,0.5);font-family:monospace;letter-spacing:0.1em">ĐÃ BÀN GIAO NGÀY</p>
      <p style="margin:0;font-size:16px;font-weight:700;color:#10B981">${format(data.handoverDate, "dd/MM/yyyy", { locale: vi })}</p>
    </div>
    ${data.figmaUrl || data.githubUrl || data.deploymentUrl ? `<div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:16px;margin:0 0 16px 0">
      <p style="margin:0 0 12px 0;font-size:12px;color:rgba(209,213,219,0.5);font-family:monospace;letter-spacing:0.1em">TÀI NGUYÊN BÀN GIAO</p>
      ${data.figmaUrl ? `<p style="margin:0 0 6px 0"><a href="${data.figmaUrl}" style="color:#8B5CF6;text-decoration:none;font-size:13px">🎨 Figma Design</a></p>` : ""}
      ${data.githubUrl ? `<p style="margin:0 0 6px 0"><a href="${data.githubUrl}" style="color:#62C5EB;text-decoration:none;font-size:13px">💻 Source Code</a></p>` : ""}
      ${data.deploymentUrl ? `<p style="margin:0"><a href="${data.deploymentUrl}" style="color:#10B981;text-decoration:none;font-size:13px">🌐 Live Website</a></p>` : ""}
    </div>` : ""}
    ${(data.totalItems ?? 0) > 0 ? `<div style="background:rgba(59,130,246,0.08);border-radius:10px;padding:16px;margin:0 0 20px 0;text-align:center">
      <p style="margin:0 0 4px 0;font-size:11px;color:rgba(209,213,219,0.5)">CHECKLIST HOÀN THÀNH</p>
      <p style="margin:8px 0 0 0;font-size:20px;font-weight:900;color:#3B82F6">${data.completedItems}/${data.totalItems} items</p>
    </div>` : ""}
    <p style="margin:0 0 16px 0;font-size:13px;color:rgba(209,213,219,0.6)">
      Truy cập dashboard để xem chi tiết: <a href="https://loops.vn/khach-hang" style="color:#8B5CF6">loops.vn/khach-hang</a>
    </p>
    <div style="background:rgba(139,92,246,0.08);border-radius:10px;padding:16px;margin:0">
      <p style="margin:0;font-size:12px;color:rgba(209,213,219,0.6)">
        💡 Nếu có thắc mắc, liên hệ LOOP qua <a href="mailto:hello@loop.vn" style="color:#8B5CF6">hello@loop.vn</a> — chúng tôi luôn sẵn sàng hỗ trợ.
      </p>
    </div>`
  );

  const { error } = await getResend().emails.send({
    from: FROM,
    to: data.customerEmail,
    subject: `🎉 Đơn hàng ${data.orderNumber} — Gói bàn giao đã sẵn sàng!`,
    html,
  });

  if (error) console.error("[Email] Handover delivered failed:", error);
  return { error };
}

/** Order confirmation — sent to the customer after placing an order */
export async function sendOrderConfirmation(data: OrderConfirmationEmailData) {
  const html = htmlShell(
    `Đơn hàng ${data.orderNumber} đã được tiếp nhận!`,
    `<p style="margin:0 0 20px 0;font-size:15px;color:rgba(209,213,219,0.8)">
      Chào <strong style="color:#fff">${data.customerName}</strong>, đơn hàng của bạn đã được ghi nhận vào hệ thống LOOP Studio.
    </p>
    <div style="background:rgba(16,185,129,0.08);border-radius:10px;padding:16px;margin:0 0 20px 0;text-align:center">
      <p style="margin:0;font-size:12px;color:rgba(209,213,219,0.6)">MÃ ĐƠN HÀNG</p>
      <p style="margin:6px 0 0 0;font-size:20px;font-weight:900;color:#10B981">${data.orderNumber}</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0">
      <tr><td style="padding:6px 0;font-size:13px;color:rgba(209,213,219,0.5)">Tổng tiền</td>
          <td style="padding:6px 0;font-size:13px;color:#fff;text-align:right;font-weight:700">
            ${fmtVND(data.totalAmount)}
          </td></tr>
    </table>
    ${data.items.length > 0 ? `<div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:16px;margin:0 0 20px 0">
      <p style="margin:0 0 8px 0;font-size:12px;color:rgba(209,213,219,0.5)">DỊCH VỤ ĐÃ ĐẶT</p>
      ${data.items.map(item => `<p style="margin:4px 0;font-size:13px;color:#fff">• ${item}</p>`).join("")}
    </div>` : ""}
    <p style="margin:0;font-size:13px;color:rgba(209,213,219,0.5)">
      Đội ngũ LOOP sẽ liên hệ để xác nhận và bắt đầu triển khai trong thời gian sớm nhất.
    </p>`
  );

  const { error } = await getResend().emails.send({
    from: FROM,
    to: data.customerEmail,
    subject: `✅ Đơn hàng ${data.orderNumber} đã được tiếp nhận — LOOP Studio`,
    html,
  });

  if (error) console.error("[Email] Order confirmation failed:", error);
  return { error };
}
