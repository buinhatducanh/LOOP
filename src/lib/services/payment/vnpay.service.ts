/**
 * VNPay Payment Service — LOOP Solutions
 *
 * Implements VNPay Payment Gateway API.
 * Docs: https://sandbox.vnpayment.vn/apis/docs/huong-dan-tich-hop
 *
 * Flow:
 * 1. Customer selects VNPay → POST /api/payment/vnpay/create
 * 2. Server creates HMAC-SHA256 signed payment URL
 * 3. Customer redirected to VNPay gateway
 * 4. VNPay redirects back to returnUrl with result params
 * 5. Server verifies signature + processes payment
 */

import { createHmac } from "crypto";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VNPayConfig {
 vnp_TmnCode: string; // Merchant code
 vnp_HashSecret: string; // Secure secret key
 vnp_ReturnUrl: string; // Return URL after payment
 vnp_IpnUrl: string; // IPN (server-to-server) URL
 vnp_ApiUrl: string; // "https://sandbox.vnpayment.vn/merchant_webapi/command" or production
 vnp_Version: string; // "2.1.0"
}

export interface VNPayPaymentRequest {
 orderId: string;
 orderNumber: string;
 amount: number; // VND, integer — VNPay multiplies by 100
 customerName?: string;
 customerEmail?: string;
 ipAddr: string;
}

export interface VNPayPaymentResponse {
 paymentUrl: string; // Full redirect URL
 vnp_TxnRef: string;
  vnp_Amount: number;
}

export interface VNPayReturnParams {
 vnp_Amount: string;
 vnp_BankCode: string;
 vnp_BankTranNo: string;
 vnp_CardType: string;
 vnp_OrderInfo: string;
 vnp_PayDate: string;
 vnp_ResponseCode: string;
  vnp_TmnCode: string;
 vnp_TransactionNo: string;
 vnp_TxnRef: string;
 vnp_SecureHash: string;
}

export interface VNPayVerifyResult {
 valid: boolean;
 success: boolean;
 orderId: string;
 orderNumber: string;
 amount: number;
 bankCode: string;
 bankTranNo: string;
 payDate: string;
 message: string;
}

// VNPay response codes
export const VNPAY_RESPONSE_CODE = {
 SUCCESS: "00",
 NOT_FOUND: "01",
 INVALID_AMOUNT: "02",
 INVALID_CURRENCY: "03",
 INVALID_TRANSACTION: "04",
 SECURITY_ERROR: "97",
} as const;

// ── Config Loader ─────────────────────────────────────────────────────────────

/**
 * Load VNPay config from SiteSetting DB.
 * Falls back to env vars for backwards compatibility.
 */
export async function loadVNPayConfig(): Promise<VNPayConfig | null> {
 try {
 const { prisma } = await import("@/lib/prisma");

 const setting = await prisma.siteSetting.findUnique({
 where: { key: "vnpay_config" },
 });

 if (setting?.value) {
 let config: Record<string, unknown>;
 try {
 config = JSON.parse(setting.value);
 } catch {
 return null;
 }
 if (config.vnp_TmnCode && config.vnp_HashSecret) {
 return {
 vnp_TmnCode: String(config.vnp_TmnCode),
 vnp_HashSecret: String(config.vnp_HashSecret),
 vnp_ReturnUrl: String(config.vnp_ReturnUrl ?? ""),
 vnp_IpnUrl: String(config.vnp_IpnUrl ?? ""),
 vnp_ApiUrl: String(config.vnp_ApiUrl ?? "https://sandbox.vnpayment.vn/merchant_webapi/command"),
 vnp_Version: String(config.vnp_Version ?? "2.1.0"),
 };
 }
 }

 // Fallback: env vars
 if (process.env.VNPAY_TMN_CODE && process.env.VNPAY_HASH_SECRET) {
 return {
 vnp_TmnCode: process.env.VNPAY_TMN_CODE,
 vnp_HashSecret: process.env.VNPAY_HASH_SECRET,
 vnp_ReturnUrl: process.env.VNPAY_RETURN_URL ?? "",
 vnp_IpnUrl: process.env.VNPAY_IPN_URL ?? "",
 vnp_ApiUrl: process.env.VNPAY_API_URL ?? "https://sandbox.vnpayment.vn/merchant_webapi/command",
 vnp_Version: "2.1.0",
 };
 }

 return null;
 } catch {
 return null;
 }
}

// ── Signature ─────────────────────────────────────────────────────────────────

/**
 * Create HMAC-SHA256 signature for VNPay parameters.
 * VNPay requires a sorted list of fields (excluding the signature field itself).
 */
function createVNPaySignature(params: Record<string, string>, secretKey: string): string {
 const sorted = Object.keys(params)
 .filter((k: string) => k.startsWith("vnp_"))
 .sort()
 .map((k: string) => `${k}=${params[k]}`)
 .join("&");
 return createHmac("sha256", secretKey).update(sorted).digest("hex");
}

/**
 * Verify VNPay return/IPN signature.
 */
export function verifyVNPaySignature(
 params: Record<string, string>,
 secretKey: string
): boolean {
  const { vnp_SecureHash, ...data } = params;
 if (!vnp_SecureHash) return false;

 const expected = createVNPaySignature(data, secretKey);
 return expected === vnp_SecureHash;
}

// ── Create Payment URL ─────────────────────────────────────────────────────────

/**
 * Create a VNPay payment URL for customer redirect.
 */
export async function createVNPayUrl(
 request: VNPayPaymentRequest,
 config: VNPayConfig
): Promise<VNPayPaymentResponse> {
 const now = new Date();

 // VNPay uses YYYYMMDDHHmmss format
 const formatDate = (d: Date) => {
 const y = d.getFullYear();
 const mo = String(d.getMonth() + 1).padStart(2, "0");
 const day = String(d.getDate()).padStart(2, "0");
 const h = String(d.getHours()).padStart(2, "0");
 const mi = String(d.getMinutes()).padStart(2, "0");
 const s = String(d.getSeconds()).padStart(2, "0");
 return `${y}${mo}${day}${h}${mi}${s}`;
 };

 const createDate = formatDate(now);
 const expireDate = formatDate(new Date(now.getTime() + 15 * 60 * 1000)); // 15 min

 const params: Record<string, string> = {
 vnp_Version: config.vnp_Version,
 vnp_Command: "pay",
 vnp_TmnCode: config.vnp_TmnCode,
 vnp_Merchant: "", // optional
 vnp_Locale: "vn",
 vnp_CurrCode: "VND",
 vnp_TxnRef: request.orderId,
 vnp_OrderInfo: `Thanh toan don hang ${request.orderNumber}`,
 vnp_OrderType: "other",
 vnp_Amount: String(request.amount * 100), // VNPay multiplies by 100
 vnp_ReturnUrl: config.vnp_ReturnUrl,
 vnp_IpAddr: request.ipAddr,
 vnp_CreateDate: createDate,
 vnp_ExpireDate: expireDate,
 };

 // Add optional fields
 if (request.customerEmail) {
 params.vnp_Bill_Mobile = request.customerEmail;
 }
 if (request.customerName) {
 params.vnp_Bill_FirstName = request.customerName.split(" ")[0] ?? request.customerName;
 params.vnp_Bill_LastName = request.customerName.split(" ").slice(1).join(" ") || "";
 }

 // Build signature
 const signature = createVNPaySignature(params, config.vnp_HashSecret);
 params.vnp_SecureHash = signature;

 // Build URL
 const baseUrl = config.vnp_ApiUrl;
 const queryString = Object.entries(params)
 .map(([k, v]: [string, string]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
 .join("&");

 return {
 paymentUrl: `${baseUrl}?${queryString}`,
 vnp_TxnRef: request.orderId,
  vnp_Amount: request.amount,
 };
}

// ── Verify Return ─────────────────────────────────────────────────────────────

/**
 * Verify VNPay return parameters and extract payment result.
 */
export function verifyVNPayReturn(
 params: Record<string, string>
): VNPayVerifyResult {
 // Parse amount back (VNPay multiplies by 100)
 const amountRaw = params.vnp_Amount ?? "0";
 const amount = parseInt(amountRaw, 10) / 100;

 const isSuccess = params.vnp_ResponseCode === VNPAY_RESPONSE_CODE.SUCCESS;

 const messageMap: Record<string, string> = {
 "00": "Giao dịch thành công",
 "07": "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo)",
 "09": "Thẻ chưa đăng ký Internet Banking",
 "10": "Xác thực OTP failed 3 lần",
 "11": "Đã hết hạn chờ thanh toán",
 "12": "OTP đã hết hạng",
 "24": "Khách hàng hủy giao dịch",
 "51": "Tài khoản không đủ số dư",
 "65": "Tài khoản đã vượt quá hạn mức ngày",
 "81": "Sai mật khẩu OTP",
 "99": "Lỗi không xác định",
  };

 return {
 valid: true, // Caller should verify signature before calling this
 success: isSuccess,
 orderId: params.vnp_TxnRef ?? "",
 orderNumber: params.vnp_OrderInfo?.replace("Thanh toan don hang ", "") ?? "",
 amount,
 bankCode: params.vnp_BankCode ?? "",
 bankTranNo: params.vnp_BankTranNo ?? "",
 payDate: params.vnp_PayDate ?? "",
 message: messageMap[params.vnp_ResponseCode ?? "99"] ?? `Mã lỗi: ${params.vnp_ResponseCode}`,
 };
}
