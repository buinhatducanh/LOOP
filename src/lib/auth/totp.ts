/**
 * TOTP 2FA — Time-based One-Time Password
 *
 * Uses RFC 6238 TOTP with SHA-1 (standard, compatible with Google Authenticator).
 *
 * Setup flow:
 * 1. generateTotpSetup() → { secret, otpauthUrl }
 * 2. User scans otpauthUrl in authenticator app
 * 3. User submits TOTP code to verify setup
 * 4. If valid → store encrypted secret in DB, set totpEnabled = true
 *
 * Login flow:
 * 1. POST /api/admin/auth/login → { requiresTotp: true } if TOTP enabled
 * 2. POST /api/admin/auth/login-totp → verify code → issue tokens
 *
 * Security:
 * - Secret stored encrypted (AES-256-GCM) in DB
 * - Backup codes: 8 hashed codes, each single-use
 * - Rate limit: 5 failed TOTP attempts → 5 min lockout
 */

import {
 generateSecret,
 generateURI,
 verify as totpVerify,
} from "otplib";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync, createHash } from "crypto";

// ─── Config ─────────────────────────────────────────────────────────────────────

const TOTP_ISSUER = "LOOP Solutions";
const BACKUP_CODE_COUNT = 8;

// ─── Encryption ────────────────────────────────────────────────────────────────

function getEncryptionKey(): Buffer {
 const secret = process.env.TOTP_ENCRYPTION_KEY ?? process.env.AUTH_SECRET ?? "loop-dev-key-change-in-production";
 return scryptSync(secret, "totp-salt-v1", 32);
}

function encrypt(plaintext: string): string {
 const key = getEncryptionKey();
 const iv = randomBytes(16);
 const cipher = createCipheriv("aes-256-gcm", key, iv);
 const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
 const tag = cipher.getAuthTag();
 return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

function decrypt(ciphertext: string): string {
 const [ivB64, tagB64, encryptedB64] = ciphertext.split(":");
 const key = getEncryptionKey();
 const iv = Buffer.from(ivB64, "base64");
 const tag = Buffer.from(tagB64, "base64");
 const encrypted = Buffer.from(encryptedB64, "base64");
 const decipher = createDecipheriv("aes-256-gcm", key, iv);
 decipher.setAuthTag(tag);
 return decipher.update(encrypted).toString("utf8") + decipher.final("utf8");
}

// ─── Secret Generation ─────────────────────────────────────────────────────────

export interface TotpSetupResult {
 secret: string; // Base32 secret (show to user)
 otpauthUrl: string; // URI for QR code generation
 backupCodes: string[]; // Plaintext codes (show ONCE, never stored plaintext)
}

/**
 * Generate a new TOTP secret for a user.
 * Returns secret + otpauth URI + 8 plain backup codes.
 * Store the encrypted secret + hashed backup codes in DB.
 */
export function generateTotpSetup(email: string): TotpSetupResult {
 const secret = generateSecret();
 const otpauthUrl = generateURI({ issuer: TOTP_ISSUER, label: email, secret });

 // Generate 8 backup codes: XXXX-XXXX format
 const backupCodes: string[] = [];
 for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
 const raw = randomBytes(4).toString("hex").toUpperCase();
 backupCodes.push(`${raw.slice(0, 4)}-${raw.slice(4, 8)}`);
 }

 return { secret, otpauthUrl, backupCodes };
}

/**
 * Encrypt a TOTP secret for DB storage.
 */
export function encryptTotpSecret(secret: string): string {
 return encrypt(secret);
}

/**
 * Decrypt a TOTP secret from DB.
 */
export function decryptTotpSecret(encryptedSecret: string): string {
 return decrypt(encryptedSecret);
}

/**
 * Hash a backup code for DB storage (SHA-256, uppercase, no dashes).
 */
export function hashBackupCode(code: string): string {
 return createHash("sha256")
 .update(code.toUpperCase().replace(/-/g, ""))
 .digest("hex");
}

/**
 * Hash all backup codes (comma-separated) for storage.
 */
export function hashBackupCodes(codes: string[]): string {
 return codes.map(hashBackupCode).join(",");
}

/**
 * Verify a TOTP code against a decrypted secret.
 * Returns true if valid (within ±1 window = 30 seconds).
 */
export async function verifyTotpCode(decryptedSecret: string, code: string): Promise<boolean> {
 try {
 const result = await totpVerify({ token: code, secret: decryptedSecret });
 return result.valid;
 } catch {
 return false;
 }
}

/**
 * Verify a backup code against stored hashed codes.
 * Returns index of matched code if valid, -1 otherwise.
 * After match, caller must remove that code from stored hash list.
 */
export function verifyBackupCode(storedHashes: string, code: string): number {
 const hashes = storedHashes.split(",");
 const inputHash = hashBackupCode(code);
 return hashes.indexOf(inputHash);
}

/**
 * Remove a used backup code from the stored hash list.
 */
export function removeBackupCode(storedHashes: string, usedIndex: number): string {
 const hashes = storedHashes.split(",");
 hashes.splice(usedIndex, 1);
 return hashes.join(",");
}
