/**
 * Notification Template Service
 *
 * Provides:
 * - renderTemplate(): substitute {{variables}} in templates
 * - getTemplate(): fetch template from DB by key + locale
 * - DEFAULT_TEMPLATES: hardcoded fallback for all notification types
 *
 * Usage:
 * const { title, message } = await renderTemplate("payment_received", { amount: "3,500,000", customer: "FinCorp" });
 */

import { prisma } from "@/lib/prisma";

// ── Types ────────────────────────────────────────────────────────────────────

export interface TemplateVariables {
 [key: string]: string | number | undefined;
}

export interface RenderedTemplate {
 title: string;
 message: string;
}

export interface NotificationTemplateInput {
 key: string;
 locale: string;
 title: string;
 message: string;
 isActive?: boolean;
}

// ── Variable substitution ───────────────────────────────────────────────────────

/**
 * Replace {{variable}} placeholders in a template string.
 * Unknown variables are left as-is ({{unknown}} stays).
 */
function substitute(template: string, vars: TemplateVariables): string {
 return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
 const val = vars[key];
 if (val === undefined || val === null) return `{{${key}}}`;
 return String(val);
 });
}

// ── Default templates (fallback) ──────────────────────────────────────────────

type DefaultTemplate = {
 title: Record<string, string>; // locale → title
 message: Record<string, string>; // locale → message
};

/**
 * Hardcoded fallback templates for all notification types.
 * Keyed by notification type. These are used when:
 * 1. No template exists in the DB for the given locale
 * 2. The template is disabled (isActive = false)
 */
export const DEFAULT_TEMPLATES: Record<string, DefaultTemplate> = {
 // ── Admin notifications ────────────────────────────────────────────────────
 payment_received: {
 title: { vi: "💳 Thanh toán — {{amount}} VNĐ", en: "💳 Payment — {{amount}} VND", ja: "💳 — {{amount}} VND", ko: "💳 결제 — {{amount}} VND", zh: "💳 — {{amount}} VND" },
 message: {
 vi: "Đơn hàng #{{orderNumber}} vừa nhận thanh toán {{amount}} VNĐ{{method}}. Cần xác nhận.",
 en: "Order #{{orderNumber}} received payment of {{amount}} VND{{method}}. Needs confirmation.",
 ja: " #{{orderNumber}} が{{amount}} VNDのをけりました。がです。",
 ko: "주문 #{{orderNumber}}에 {{amount}} VND 결제가 입금되었습니다. 확인이 필요합니다.",
 zh: " #{{orderNumber}} {{amount}} VND {{method}}。。",
 },
 },
 order_created: {
 title: { vi: "📦 Đơn hàng mới #{{orderNumber}}", en: "📦 New Order #{{orderNumber}}", ja: "📦 #{{orderNumber}}", ko: "📦 새 주문 #{{orderNumber}}", zh: "📦 #{{orderNumber}}" },
 message: {
 vi: "{{customer}} vừa đặt dịch vụ {{service}}. Cần phân công PM trong 24h.",
 en: "{{customer}} placed an order for {{service}}. PM assignment needed within 24h.",
 ja: "{{customer}}が{{service}}をしました。24にPMをりててください。",
 ko: "{{customer}}님이 {{service}}을(를) 주문했습니다. 24시간 내에 PM 배정 필요.",
 zh: "{{customer}} {{service}} 。24 PM。",
 },
 },
 demo_ready: {
 title: { vi: "🎨 Demo sẵn sàng — {{orderNumber}}", en: "🎨 Demo Ready — {{orderNumber}}", ja: "🎨 デモ — {{orderNumber}}", ko: "🎨 데모 준비 완료 — {{orderNumber}}", zh: "🎨 Demo — {{orderNumber}}" },
 message: {
 vi: "Demo cho {{customer}} đã sẵn sàng để xem. Chờ phản hồi trong 48h.",
 en: "Demo for {{customer}} is ready to view. Awaiting feedback within 48h.",
 ja: "{{customer}}けデモのができました。48のフィードバックをおちください。",
 ko: "{{customer}}님의 데모가 준비되었습니다. 48시간 내 피드백 대기 중.",
 zh: "{{customer}} Demo 。48。",
 },
 },
 design_approved: {
 title: { vi: "✅ Design được duyệt — {{orderNumber}}", en: "✅ Design Approved — {{orderNumber}}", ja: "✅ デザインがされました — {{orderNumber}}", ko: "✅ 디자인 승인 — {{orderNumber}}", zh: "✅ — {{orderNumber}}" },
 message: {
 vi: "{{customer}} đã duyệt design. Tiến hành phát triển.",
 en: "{{customer}} approved the design. Proceeding to development.",
 ja: "{{customer}}がデザインをしました。にみます。",
 ko: "{{customer}}님이 디자인을 승인했습니다. 개발 진행합니다.",
 zh: "{{customer}} 。。",
 },
 },
 task_assigned: {
 title: { vi: "📋 Task mới: {{taskTitle}}", en: "📋 New Task: {{taskTitle}}", ja: "📋 タスク: {{taskTitle}}", ko: "📋 새 작업: {{taskTitle}}", zh: "📋 : {{taskTitle}}" },
 message: {
 vi: "Bạn được assign task \"{{taskTitle}}\" trong dự án {{project}}. Due: {{dueDate}}. Phần thưởng: {{lp}} LP.",
 en: "You have been assigned task \"{{taskTitle}}\" in project {{project}}. Due: {{dueDate}}. Reward: {{lp}} LP.",
 ja: "プロジェクト{{project}}でタスク\"{{taskTitle}}\"がりてられました。: {{dueDate}}。: {{lp}} LP。",
 ko: "프로젝트 {{project}}에서 작업 \"{{taskTitle}}\"이(가) 할당되었습니다. 기한: {{dueDate}}。보상: {{lp}} LP。",
 zh: " {{project}}  \"{{taskTitle}}\"。{{dueDate}}。{{lp}} LP。",
 },
 },
 task_done: {
 title: { vi: "✅ Task hoàn thành: {{taskTitle}}", en: "✅ Task Done: {{taskTitle}}", ja: "✅ タスク: {{taskTitle}}", ko: "✅ 작업 완료: {{taskTitle}}", zh: "✅ : {{taskTitle}}" },
 message: {
 vi: "{{assignee}} đã hoàn thành task \"{{taskTitle}}\". Đã nhận {{lp}} LP.",
 en: "{{assignee}} completed task \"{{taskTitle}}\". Awarded {{lp}} LP.",
 ja: "{{assignee}}がタスク\"{{taskTitle}}\"をしました。{{lp}} LPをしました。",
 ko: "{{assignee}}님이 작업 \"{{taskTitle}}\"을(를) 완료했습니다. {{lp}} LP 적립.",
 zh: "{{assignee}} \"{{taskTitle}}\"。 {{lp}} LP。",
 },
 },
 lp_award: {
 title: { vi: "⭐ Thưởng LP — {{amount}} LP", en: "⭐ LP Award — {{amount}} LP", ja: "⭐ LP — {{amount}} LP", ko: "⭐ LP 보상 — {{amount}} LP", zh: "⭐ LP — {{amount}} LP" },
 message: {
 vi: "Bạn nhận được {{amount}} LP từ {{reason}}.",
 en: "You received {{amount}} LP from {{reason}}.",
 ja: "{{reason}}により{{amount}} LPをしました。",
 ko: "{{reason}}으로 인해 {{amount}} LP를 받았습니다.",
 zh: " {{reason}} {{amount}} LP。",
 },
 },
 quest_completed: {
 title: { vi: "🏆 Quest hoàn thành: {{questTitle}}", en: "🏆 Quest Completed: {{questTitle}}", ja: "🏆 クエスト: {{questTitle}}", ko: "🏆 퀘스트 완료: {{questTitle}}", zh: "🏆 : {{questTitle}}" },
 message: {
 vi: "Bạn đã hoàn thành quest \"{{questTitle}}\"! Nhận {{xp}} XP.",
 en: "You completed quest \"{{questTitle}}\"! Earned {{xp}} XP.",
 ja: "クエスト\"{{questTitle}}\"をしました{{xp}} XPを。",
 ko: "퀘스트 \"{{questTitle}}\"을(를) 완료했습니다! {{xp}} XP 획득.",
 zh: " \"{{questTitle}}\" {{xp}} XP。",
 },
 },
 project_delivered: {
 title: { vi: "🚀 Dự án bàn giao — {{orderNumber}}", en: "🚀 Project Delivered — {{orderNumber}}", ja: "🚀 プロジェクト — {{orderNumber}}", ko: "🚀 프로젝트 인도 — {{orderNumber}}", zh: "🚀 — {{orderNumber}}" },
 message: {
 vi: "Dự án #{{orderNumber}} đã hoàn thành và bàn giao cho {{customer}}.",
 en: "Project #{{orderNumber}} has been completed and delivered to {{customer}}.",
 ja: "プロジェクト #{{orderNumber}}がし、{{customer}}にされました。",
 ko: "프로젝트 #{{orderNumber}}이(가) 완료되어 {{customer}}에게 인도되었습니다.",
 zh: " #{{orderNumber}}  {{customer}}。",
 },
 },
 member_joined: {
 title: { vi: "👋 Thành viên mới: {{memberName}}", en: "👋 New Member: {{memberName}}", ja: "👋 メンバー: {{memberName}}", ko: "👋 새 멤버: {{memberName}}", zh: "👋 : {{memberName}}" },
 message: {
 vi: "{{memberName}} gia nhập team {{department}} với vai trò {{role}}.",
 en: "{{memberName}} joined the {{department}} team as {{role}}.",
 ja: "{{memberName}}が{{department}}チームに{{role}}としてしました。",
 ko: "{{memberName}}님이 {{department}}팀에 {{role}}(으)로 합류했습니다.",
 zh: "{{memberName}} {{role}} {{department}} 。",
 },
 },
 contact_request: {
 title: { vi: "📩 Yêu cầu tư vấn từ {{name}}", en: "📩 Consultation Request from {{name}}", ja: "📩 {{name}}からのがありました", ko: "📩 {{name}}님의 컨설팅 요청", zh: "📩 {{name}}" },
 message: {
 vi: "Khách: {{name}} ({{email}})\nCông ty: {{company}}\nDịch vụ: {{service}}\nNội dung: {{message}}\nThời gian ưu tiên: {{preferredTime}}",
 en: "Customer: {{name}} ({{email}})\nCompany: {{company}}\nService: {{service}}\nMessage: {{message}}\nPreferred time: {{preferredTime}}",
 ja: ": {{name}} ({{email}})\n: {{company}}\n: {{service}}\n: {{message}}\n: {{preferredTime}}",
 ko: "고객: {{name}} ({{email}})\n회사: {{company}}\n서비스: {{service}}\n메시지: {{message}}\n희망 시간: {{preferredTime}}",
 zh: ": {{name}} ({{email}})\n: {{company}}\n: {{service}}\n: {{message}}\n: {{preferredTime}}",
 },
 },
 quote_expired: {
 title: { vi: "⏰ Quote hết hạn: {{customerName}}", en: "⏰ Quote Expired: {{customerName}}", ja: "⏰ {{customerName}}", ko: "⏰ 견적서 만료: {{customerName}}", zh: "⏰ : {{customerName}}" },
 message: {
 vi: "Admin đã expire quote \"{{quoteId}}\" của {{customerName}}.",
 en: "Admin expired quote \"{{quoteId}}\" for {{customerName}}.",
 ja: "Adminが{{customerName}}の\"{{quoteId}}\"をさせました。",
 ko: "관리자가 {{customerName}}님의 견적서 \"{{quoteId}}\"를 만료 처리했습니다.",
 zh: " {{customerName}} \"{{quoteId}}\"。",
 },
 },
 // ── Customer notifications ────────────────────────────────────────────────────
 order_update: {
 title: { vi: "📦 Cập nhật đơn hàng #{{orderNumber}}", en: "📦 Order Update #{{orderNumber}}", ja: "📦 cập nhật #{{orderNumber}}", ko: "📦 주문 업데이트 #{{orderNumber}}", zh: "📦 cập nhật #{{orderNumber}}" },
 message: {
 vi: "Đơn hàng của bạn đã chuyển sang trạng thái: {{status}}.",
 en: "Your order has moved to status: {{status}}.",
 ja: "ごのステータスがされました{{status}}。",
 ko: "주문 상태가 {{status}}(으)로 변경되었습니다.",
 zh: "cập nhậttrạng thái{{status}}。",
 },
 },
 vip_promotion: {
 title: { vi: "🎉 Chúc mừng bạn lên {{tier}}!", en: "🎉 Congratulations — promoted to {{tier}}!", ja: "🎉 おめでとうございます{{tier}}に", ko: "🎉 축하합니다! {{tier}}(으)로 승급!", zh: "🎉 {{tier}}" },
 message: {
 vi: "Bạn đã được thăng lên hạng {{tier}}. Giờ đây bạn được giảm giá tối đa {{discount}}% khi sử dụng LP!",
 en: "You have been promoted to {{tier}}. You now enjoy up to {{discount}}% discount when using LP!",
 ja: "{{tier}}にしましたLPに{{discount}}%がされます",
 ko: "{{tier}}(으)로 승급했습니다! LP 사용 시 최대 {{discount}}% 할인 혜택을 받습니다!",
 zh: " {{tier}}。 LP {{discount}}% ",
 },
 },
 quest_reward: {
 title: { vi: "🏆 Quest hoàn thành — {{questTitle}}", en: "🏆 Quest Completed — {{questTitle}}", ja: "🏆 クエスト — {{questTitle}}", ko: "🏆 퀘스트 완료 — {{questTitle}}", zh: "🏆 — {{questTitle}}" },
 message: {
 vi: "Bạn đã hoàn thành quest \"{{questTitle}}\"! Nhận {{lp}} LP.",
 en: "You completed quest \"{{questTitle}}\"! Earned {{lp}} LP.",
 ja: "クエスト\"{{questTitle}}\"をしました{{lp}} LPを。",
 ko: "퀘스트 \"{{questTitle}}\"을(를) 완료했습니다! {{lp}} LP 획득.",
 zh: " \"{{questTitle}}\" {{lp}} LP。",
 },
 },
 demo_ready_customer: {
 title: { vi: "🎨 Demo của bạn đã sẵn sàng!", en: "🎨 Your demo is ready!", ja: "🎨 デモのができました", ko: "🎨 데모가 준비되었습니다!", zh: "🎨 Demo " },
 message: {
 vi: "Demo dịch vụ {{service}} đã sẵn sàng để xem. Vui lòng review trong 48h.",
 en: "Your {{service}} demo is ready to review. Please provide feedback within 48h.",
 ja: "{{service}}のデモができました。48にフィードバックをしてください。",
 ko: "{{service}} 데모가 준비되었습니다. 48시간 내 피드백 제공 부탁드립니다.",
 zh: " {{service}} Demo 。48。",
 },
 },
};

// ── Core functions ─────────────────────────────────────────────────────────────

const SUPPORTED_LOCALES = ["vi", "en", "ja", "ko", "zh"];

/**
 * Get a default template for a given notification type and locale.
 * Falls back to "en" if locale not found, then to "vi" as final fallback.
 */
function getDefaultTemplate(key: string, locale: string): DefaultTemplate | null {
 const tpl = DEFAULT_TEMPLATES[key];
 if (!tpl) return null;

 // Try exact locale
 if (tpl.title[locale] && tpl.message[locale]) return tpl;
 // Fallback to English
 if (tpl.title["en"] && tpl.message["en"]) return tpl;
 // Final fallback to Vietnamese
 if (tpl.title["vi"] && tpl.message["vi"]) return tpl;
 return null;
}

/**
 * Render a notification template with variable substitution.
 *
 * Priority:
 * 1. DB template (if exists + active for given locale)
 * 2. DB template (fallback to en locale)
 * 3. Default hardcoded template (by locale → en → vi)
 * 4. Generic fallback string
 *
 * @param key Notification type key (e.g., "payment_received")
 * @param vars Variables for {{placeholder}} substitution
 * @param locale Target locale (default: "vi")
 */
export async function renderTemplate(
 key: string,
 vars: TemplateVariables,
 locale = "vi"
): Promise<RenderedTemplate> {
 // 1. Try DB template
 try {
 const dbTemplate = await prisma.notificationTemplate.findUnique({
 where: { key_locale: { key, locale } },
 });
 if (dbTemplate?.isActive) {
 return {
 title: substitute(dbTemplate.title, vars),
 message: substitute(dbTemplate.message, vars),
 };
 }

 // 2. Fallback: try English template from DB
 if (locale !== "en") {
 const enTemplate = await prisma.notificationTemplate.findUnique({
 where: { key_locale: { key, locale: "en" } },
 });
 if (enTemplate?.isActive) {
 return {
 title: substitute(enTemplate.title, vars),
 message: substitute(enTemplate.message, vars),
 };
 }
 }
 } catch {
 // DB unavailable — fall through to hardcoded defaults
 }

 // 3. Hardcoded default template
 const defaultTpl = getDefaultTemplate(key, locale);
 if (defaultTpl) {
 return {
 title: substitute(defaultTpl.title[locale] ?? defaultTpl.title["vi"], vars),
 message: substitute(defaultTpl.message[locale] ?? defaultTpl.message["vi"], vars),
 };
 }

 // 4. Ultimate fallback
 return {
 title: locale === "vi" ? "Thông báo từ LOOP" : "Notification from LOOP",
 message: locale === "vi" ? "Bạn có một thông báo mới." : "You have a new notification.",
 };
}

/**
 * Get a template from DB (no rendering — for admin CRUD).
 */
export async function getTemplate(key: string, locale: string) {
 return prisma.notificationTemplate.findUnique({
 where: { key_locale: { key, locale } },
 });
}

/**
 * List all templates (optionally filtered by locale).
 */
export async function listTemplates(locale?: string) {
 const where = locale ? { locale } : {};
 return prisma.notificationTemplate.findMany({
 where,
 orderBy: [{ key: "asc" }, { locale: "asc" }],
 });
}

/**
 * Upsert a template (create or update).
 */
export async function upsertTemplate(input: NotificationTemplateInput) {
 return prisma.notificationTemplate.upsert({
 where: { key_locale: { key: input.key, locale: input.locale } },
 create: {
 key: input.key,
 locale: input.locale,
 title: input.title,
 message: input.message,
 isActive: input.isActive ?? true,
 },
 update: {
 title: input.title,
 message: input.message,
 isActive: input.isActive ?? true,
 },
 });
}

/**
 * Delete a template.
 */
export async function deleteTemplate(key: string, locale: string) {
 return prisma.notificationTemplate.delete({
 where: { key_locale: { key, locale } },
 });
}

/**
 * Seed default templates into the DB.
 * Safe to call multiple times — only creates missing templates.
 */
export async function seedDefaultTemplates(): Promise<void> {
 for (const [key, tpl] of Object.entries(DEFAULT_TEMPLATES)) {
 for (const locale of SUPPORTED_LOCALES) {
 const title = tpl.title[locale] ?? tpl.title["vi"];
 const message = tpl.message[locale] ?? tpl.message["vi"];
 await prisma.notificationTemplate.upsert({
 where: { key_locale: { key, locale } },
 create: { key, locale, title, message, isActive: true },
 update: {}, // don't overwrite existing
 }).catch(() => {/* ignore race conditions */});
 }
 }
}
