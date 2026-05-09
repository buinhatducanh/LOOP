/**
 * MoMo Payment Service — LOOP Solutions
 *
 * Implements MoMo Payment API (Open API v2).
 * Docs: https://developers.momo.vn
 *
 * Flow:
 * 1. Customer selects MoMo → POST /api/payment/momo/create
 * 2. Server calls MoMo API → returns payment URL (deep link / QR)
 * 3. Customer pays via MoMo app
 * 4. MoMo sends webhook to /api/webhooks/momo → recordPayment()
 * 5. Customer redirected to returnUrl
 */

import { createHmac } from "crypto";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MoMoConfig {
 partnerCode: string;
 apiKey: string;
 secretKey: string;
 endpoint: string; // "https://checkout.momodev.money" or production
 ipnUrl: string;
 returnUrl: string;
}

export interface MoMoPaymentRequest {
 orderId: string;
 orderNumber: string;
 amount: number; // VND, integer
 customerName?: string;
 customerEmail?: string;
 requestId: string;
}

export interface MoMoPaymentResponse {
 payUrl: string; // Deep link or QR URL
 transId: string;
 requestId: string;
 amount: number;
 resultCode: number; // 0 = success
 message: string;
}

export interface MoMoQueryResponse {
 transId: string;
 requestId: string;
 amount: number;
 resultCode: number;
 status: string; // SUCCESS | FAILED | PENDING
 message: string;
}

// MoMo status codes
export const MOMO_STATUS = {
 SUCCESS: 0,
 PENDING: 1,
 FAILED: 2,
} as const;

// ── Config Loader ─────────────────────────────────────────────────────────────

/**
 * Load MoMo config from SiteSetting DB.
 * Falls back to env vars for backwards compatibility.
 */
export async function loadMoMoConfig(): Promise<MoMoConfig | null> {
 try {
 const { prisma } = await import("@/lib/prisma");

 const setting = await prisma.siteSetting.findUnique({
 where: { key: "momo_config" },
 });

 if (setting?.value) {
 let config: Record<string, unknown>;
 try {
 config = JSON.parse(setting.value);
 } catch {
 return null;
 }
 if (config.partnerCode && config.apiKey && config.secretKey) {
 return {
 partnerCode: String(config.partnerCode),
 apiKey: String(config.apiKey),
 secretKey: String(config.secretKey),
 endpoint: String(config.endpoint ?? "https://test-payment.momo.vn"),
 ipnUrl: String(config.ipnUrl ?? ""),
 returnUrl: String(config.returnUrl ?? ""),
 };
 }
 }

 // Fallback: env vars
 if (process.env.MOMO_PARTNER_CODE && process.env.MOMO_API_KEY && process.env.MOMO_SECRET_KEY) {
 return {
 partnerCode: process.env.MOMO_PARTNER_CODE,
 apiKey: process.env.MOMO_API_KEY,
 secretKey: process.env.MOMO_SECRET_KEY,
 endpoint: process.env.MOMO_ENDPOINT ?? "https://test-payment.momo.vn",
 ipnUrl: process.env.MOMO_IPN_URL ?? "",
 returnUrl: process.env.MOMO_RETURN_URL ?? "",
 };
 }

  return null;
 } catch {
 return null;
 }
}

// ── Signature Helpers ─────────────────────────────────────────────────────────

function buildSignatureString(params: Record<string, string | number>): string {
 // MoMo uses sorted key=value& format
 const sorted = Object.keys(params)
 .sort()
 .map((k: string) => `${k}=${params[k]}`)
 .join("&");
 return sorted;
}

function hmacSha256(data: string, key: string): string {
 return createHmac("sha256", key).update(data).digest("hex");
}

// ── Create Payment ────────────────────────────────────────────────────────────

/**
 * Create a MoMo payment request.
 * Returns a payment URL that the customer is redirected to.
 */
export async function createMoMoPayment(
 request: MoMoPaymentRequest,
 config: MoMoConfig
): Promise<MoMoPaymentResponse> {
 const orderId = request.orderId;

 const params: Record<string, string | number> = {
 partnerCode: config.partnerCode,
 accessKey: config.apiKey,
 requestId: request.requestId,
 amount: request.amount,
 orderId: orderId,
 orderInfo: `Thanh toan don hang ${request.orderNumber}`,
 returnUrl: config.returnUrl,
 notifyUrl: config.ipnUrl,
 requestType: "captureWallet",
 extraData: Buffer.from(JSON.stringify({
 orderNumber: request.orderNumber,
 customerName: request.customerName ?? "",
 customerEmail: request.customerEmail ?? "",
 })).toString("base64"),
 };

 // Build signature: sorted key=value& → HMAC-SHA256
 const rawSignature = buildSignatureString(params);
 const signature = hmacSha256(rawSignature, config.secretKey);

 const payload = {
 ...params,
 signature,
 };

 const response = await fetch(`${config.endpoint}/v2/gateway/api/create`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(payload),
 });

 if (!response.ok) {
 const errText = await response.text().catch(() => "unknown");
 throw new Error(`MoMo API error ${response.status}: ${errText}`);
 }

 const data = (await response.json()) as {
 partnerCode?: string;
 requestId?: string;
 orderId?: string;
 amount?: number;
 payUrl?: string;
 resultCode?: number;
 message?: string;
 qrCodeUrl?: string;
 deeplinkUrl?: string;
 };

 if (data.resultCode !== 0 && !data.payUrl) {
 throw new Error(`MoMo error: ${data.message ?? data.resultCode}`);
 }

 return {
 payUrl: data.deeplinkUrl ?? data.qrCodeUrl ?? data.payUrl ?? "",
 transId: data.orderId ?? orderId,
 requestId: data.requestId ?? request.requestId,
 amount: data.amount ?? request.amount,
 resultCode: data.resultCode ?? 99,
 message: data.message ?? "",
 };
}

// ── Query Status ──────────────────────────────────────────────────────────────

/**
 * Query MoMo transaction status by requestId.
 */
export async function queryMoMoStatus(
 requestId: string,
 orderId: string,
 config: MoMoConfig
): Promise<MoMoQueryResponse> {
 const params: Record<string, string | number> = {
 partnerCode: config.partnerCode,
 accessKey: config.apiKey,
 requestId,
 orderId,
 requestType: "transaction_status",
 };

 const rawSignature = buildSignatureString(params);
 const signature = hmacSha256(rawSignature, config.secretKey);

 const payload = {
 ...params,
 signature,
 };

 const response = await fetch(`${config.endpoint}/v2/gateway/api/query`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(payload),
 });

 if (!response.ok) {
 const errText = await response.text().catch(() => "unknown");
 throw new Error(`MoMo query error ${response.status}: ${errText}`);
 }

 const data = (await response.json()) as {
 partnerCode?: string;
 requestId?: string;
 orderId?: string;
 amount?: number;
 resultCode?: number;
 message?: string;
 transId?: string;
 };

 const statusMap: Record<number, string> = {
 0: "SUCCESS",
 1: "PENDING",
 2: "FAILED",
 };

 return {
 transId: data.transId ?? orderId,
 requestId: data.requestId ?? requestId,
 amount: data.amount ?? 0,
 resultCode: data.resultCode ?? 99,
 status: statusMap[data.resultCode ?? 99] ?? "UNKNOWN",
 message: data.message ?? "",
 };
}

// ── Verify IPN Signature ──────────────────────────────────────────────────────

/**
 * Verify the signature of a MoMo webhook/IPN callback.
 * Raw body: partnerCode, accessKey, amount, orderId, orderInfo, orderType,
 * transId, message, responseTime, errorDescription, payType, signature
 */
export function verifyMoMoSignature(
 body: Record<string, string | number>,
 secretKey: string
): boolean {
 const { signature, ...data } = body;
 if (!signature) return false;

 const rawSignature = buildSignatureString(data as Record<string, string | number>);
 const expectedSignature = hmacSha256(rawSignature, secretKey);

 return expectedSignature === signature;
}
