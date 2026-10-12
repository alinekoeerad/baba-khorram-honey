/**
 * Order Link Encryption Helper (Phase 9 Task 8 & Addendum A2/A8)
 * AES-256-GCM encryption for temporary order share links (/o/[code]).
 */

import crypto from 'crypto';
import { env } from '@/lib/env';

function getEncryptionKey(customSecret?: string): Buffer {
  const secret = customSecret || env.ORDER_LINK_SECRET;
  if (!secret) {
    throw new Error('ORDER_LINK_SECRET must be configured for order link encryption');
  }
  // Hash secret with SHA-256 to ensure exact 32 bytes (256 bits)
  return crypto.createHash('sha256').update(secret).digest();
}

export function encryptOrderPayload(payload: Record<string, any>, customSecret?: string): string {
  const key = getEncryptionKey(customSecret);
  const iv = crypto.randomBytes(12); // Standard 12-byte IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const jsonString = JSON.stringify(payload);
  const encrypted = Buffer.concat([cipher.update(jsonString, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // iv:authTag:ciphertext (all hex encoded)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptOrderPayload<T = Record<string, any>>(
  ciphertext: string,
  customSecret?: string
): T | null {
  try {
    const parts = ciphertext.split(':');
    if (parts.length !== 3) return null;

    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const key = getEncryptionKey(customSecret);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8')) as T;
  } catch {
    return null;
  }
}
