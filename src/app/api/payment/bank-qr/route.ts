/**
 * POST /api/payment/bank-qr
 *
 * Generates a VietQR-format bank transfer QR code.
 * Compatible with all Vietnamese banking apps (Techcombank, VietinBank, etc.)
 *
 * EMVCo Payload Format:
 * 00 - Payload Format Indicator (01)
 * 01 - Point of Initiation Method (12 = dynamic)
 * 52 - Merchant Category Code (0000)
 * 53 - Transaction Currency (704 = VND)
 * 54 - Transaction Amount (e.g. 7500000)
 * 58 - Country Code (VN)
 * 63 - CRC16-CCITT (auto-calculated)
 */

import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

// CRC-16 CCITT (used in VietQR spec)
function crc16Ccitt(data: string): string {
 let crc = 0xFFFF;
 for (let i = 0; i < data.length; i++) {
 crc ^= data.charCodeAt(i) << 8;
 for (let j = 0; j < 8; j++) {
 if (crc & 0x8000) {
 crc = (crc << 1) ^ 0x1021;
 } else {
 crc = crc << 1;
 }
 }
 }
 return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, "0");
}

function buildVietQR(bankBin: string, accountNo: string, amount: number, orderRef?: string): string {
 const f = (id: string, val: string) => `${id}${String(val).length.toString().padStart(2, "0")}${val}`;

 const payload = [
 // 00: Payload format (always 01)
 "00",
 // 01: Point of initiation (12 = dynamic QR — new QR each time with amount)
 "0112",
 // 52: Merchant Category Code
 "52040000",
 // 53: Currency — 704 = VND
 "5303",
 "704",
 // 54: Amount (with decimal 00 for VND)
 f("54", amount.toString()),
 // 58: Country code
 "5802",
 "VN",
 // 59: Merchant name (from account name, max 25 chars)
 f("59", accountNo), // placeholder — no merchant name in personal QR
 // 60: Merchant city
 f("60", "Ho Chi Minh"),
 // 69: Merchant ID / BIN
 f("69", bankBin),
 // 70: Transaction Reference (order code)
 orderRef ? f("70", orderRef) : null,
 ].filter(Boolean).join("");

 // CRC-16-CCITT over entire payload
 const crc = crc16Ccitt(payload);
 return payload + "630" + crc.length.toString() + crc;
}

export async function POST(req: NextRequest) {
 try {
 const body = await req.json();
 const { bankBin, accountNo, accountName, amount, orderRef } = body;

 if (!bankBin || !accountNo) {
 return NextResponse.json({ error: "bank info required" }, { status: 400 });
 }
 if (!amount || typeof amount !== "number" || amount < 1000) {
 return NextResponse.json({ error: "amount must be >= 1000" }, { status: 400 });
 }

 const qrPayload = buildVietQR(bankBin, accountNo, Math.round(amount), orderRef);

 const qrDataURL = await QRCode.toDataURL(qrPayload, {
 errorCorrectionLevel: "M",
 type: "image/png",
 width: 256,
 margin: 2,
 color: {
 dark: "#000000",
 light: "#FFFFFF",
 },
 });

 return NextResponse.json({
 data: {
 qrDataURL,
 amount: Math.round(amount),
 orderRef: orderRef || null,
 },
 });
 } catch (err) {
 console.error("[BankQR] Error:", err);
 return NextResponse.json({ error: "Failed to generate QR" }, { status: 500 });
 }
}
