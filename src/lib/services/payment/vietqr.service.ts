/**
 * VietQR Service — LOOP Solutions
 *
 * Creates dynamic QR codes via VietQR API v2 (free plan).
 * Docs: https://vietqr.io/document/api
 *
 * Free plan features:
 * ✅ Create dynamic QR with amount + order reference
 * ❌ Webhook auto-confirmation (paid feature)
 *
 * Flow:
 * 1. Backend calls VietQR API → returns Base64 QR image
 * 2. Frontend displays QR + payment instructions
 * 3. Customer transfers via banking app
 * 4. Admin manually confirms payment in Orders Tab
 */

export interface VietQRPaymentRequest {
 orderId: string;
 orderNumber: string;
 amount: number; // VNĐ, số nguyên
 description?: string;
}

export interface VietQRPaymentResponse {
 qrDataURL: string; // Base64 PNG image (data:image/png;base64,...)
 paymentCode: string; // Mã thanh toán: "LOOP-{ORDER_NUMBER}"
 amount: number;
 expiresAt: string; // ISO date
}

export interface VietQRConfig {
 apiKey: string;
 apiSecret: string;
 accountNo: string; // Số tài khoản LOOP
 accountName: string; // Tên chủ TK
 bankId: string; // VietQR bank code (VD: "970436" = Vietcombank)
 bankBin: string; // 3 số đầu tài khoản (VD: "123")
 bankName: string; // Tên ngân hàng hiển thị (VD: "Vietcombank")
}

// ─── Config Loader ────────────────────────────────────────────────────────────

/**
 * Load VietQR config from SiteSetting DB.
 * Falls back to env vars (deprecated) for backwards compatibility.
 */
export async function loadVietQRConfig(): Promise<VietQRConfig | null> {
 try {
 const { prisma } = await import("@/lib/prisma");

 const setting = await prisma.siteSetting.findUnique({
 where: { key: "vietqr_config" },
 });

 if (setting?.value) {
 let config: Record<string, unknown>;
 try {
 config = JSON.parse(setting.value);
 } catch {
 // Config stored as invalid JSON — silent fallback to null
 return null;
 }
 if (config.apiKey && config.accountNo) {
 return {
 apiKey: String(config.apiKey),
 apiSecret: String(config.apiSecret ?? ""),
 accountNo: String(config.accountNo),
 accountName: String(config.accountName ?? "LOOP Solutions"),
 bankId: String(config.bankId ?? "970436"),
 bankBin: String(config.accountNo).slice(0, 3),
 bankName: String(config.bankName ?? "Vietcombank"),
 };
 }
 }

 // Fallback: env vars (deprecated)
 if (process.env.VIETQR_API_KEY && process.env.VIETQR_ACCOUNT_NO) {
 return {
 apiKey: process.env.VIETQR_API_KEY,
 apiSecret: process.env.VIETQR_API_SECRET ?? "",
 accountNo: process.env.VIETQR_ACCOUNT_NO,
 accountName: process.env.VIETQR_ACCOUNT_NAME ?? "CONG TY TNHH LOOP SOLUTIONS",
 bankId: process.env.VIETQR_BANK_ID ?? "970436",
 bankBin: process.env.VIETQR_ACCOUNT_NO.slice(0, 3),
 bankName: process.env.VIETQR_BANK_NAME ?? "Vietcombank",
 };
 }

 return null;
 } catch {
 return null;
 }
}

// ─── Core Service ────────────────────────────────────────────────────────────

/**
 * Create a dynamic VietQR for an order.
 * Returns Base64 QR image + payment code.
 *
 * @param request - order payment details
 * @param config - VietQR account config (from SiteSetting or env)
 * @returns QR image + payment instructions
 */
export async function createVietQR(
 request: VietQRPaymentRequest,
 config: VietQRConfig
): Promise<VietQRPaymentResponse> {
 const paymentCode = `LOOP-${request.orderNumber}`;
 const amount = Math.round(request.amount); // ensure integer

 // VietQR v2 API
 const payload = {
 accountNo: config.accountNo,
 accountName: config.accountName,
 acqId: config.bankId, // Bank ID (BIC)
 amount,
 addData: paymentCode,
 format: "text",
 template: "compact2", // compact2 = QR with logo + text details
 };

 const response = await fetch("https://api.vietqr.io/v2/create", {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 "x-api-key": config.apiKey,
 "x-client-id": config.apiSecret,
 },
 body: JSON.stringify(payload),
 });

 if (!response.ok) {
 const errText = await response.text().catch(() => "unknown");
 throw new Error(`VietQR API error ${response.status}: ${errText}`);
 }

 const data = await response.json() as {
 data?: {
 qrDataURL?: string;
 };
 code?: string;
 message?: string;
 };

 if (data.code !== "00" && !data.data?.qrDataURL) {
 throw new Error(`VietQR error: ${data.message ?? data.code}`);
 }

 // QR expires in 15 minutes (VietQR standard)
 const expiresAt = new Date();
 expiresAt.setMinutes(expiresAt.getMinutes() + 15);

 return {
 qrDataURL: data.data!.qrDataURL!,
 paymentCode,
 amount,
 expiresAt: expiresAt.toISOString(),
 };
}

/**
 * Bank lookup — fetch bank info by bank ID (BIC code).
 * Useful for admin config UI.
 */
export async function lookupBank(bankId: string): Promise<{
 name: string;
 bin: string;
 logo?: string;
} | null> {
 try {
 const response = await fetch(
 `https://api.vietqr.io/v2/banks?search=${encodeURIComponent(bankId)}`,
 {
 headers: {
 "x-api-key": process.env.VIETQR_API_KEY ?? "",
 "x-client-id": process.env.VIETQR_API_SECRET ?? "",
 },
 }
 );

 if (!response.ok) return null;

 const data = await response.json() as {
 data?: Array<{
 name: string;
 bin: string;
 logo?: string;
 }>;
 };

 const bank = data.data?.find((b) => b.bin === bankId || b.name.includes(bankId));
 return bank ?? null;
 } catch {
 return null;
 }
}

// ─── Bank list for config UI ─────────────────────────────────────────────────

/**
 * Get list of supported banks from VietQR.
 * Use this for admin dropdown when configuring bank account.
 */
export async function getSupportedBanks(): Promise<
 Array<{ id: string; name: string; bin: string; logo: string }>
> {
 try {
 const response = await fetch("https://api.vietqr.io/v2/banks", {
 headers: {
 "x-api-key": process.env.VIETQR_API_KEY ?? "",
 "x-client-id": process.env.VIETQR_API_SECRET ?? "",
 },
 });

 if (!response.ok) return [];

 const data = await response.json() as {
 data?: Array<{
 id: string;
 name: string;
 bin: string;
 logo: string;
 }>;
 };

 return (
 data.data?.map((b) => ({
 id: b.id ?? b.bin,
 name: b.name,
 bin: b.bin,
 logo: b.logo ?? "",
 })) ?? []
 );
 } catch {
 return [];
 }
}
