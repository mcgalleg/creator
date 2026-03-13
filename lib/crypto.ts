import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const key = process.env.CONNECTOR_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("CONNECTOR_ENCRYPTION_KEY environment variable is not set");
  }
  // Accept hex-encoded 32-byte key
  const buf = Buffer.from(key, "hex");
  if (buf.length !== 32) {
    throw new Error("CONNECTOR_ENCRYPTION_KEY must be 64 hex characters (32 bytes)");
  }
  return buf;
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns a base64 string containing IV + ciphertext + auth tag.
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Pack: IV (12) + authTag (16) + ciphertext
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

/**
 * Decrypt a base64-encoded AES-256-GCM ciphertext.
 */
export function decrypt(encoded: string): string {
  const key = getKey();
  const buf = Buffer.from(encoded, "base64");
  const iv = buf.subarray(0, IV_LENGTH);
  const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);
  return decipher.update(ciphertext) + decipher.final("utf8");
}
