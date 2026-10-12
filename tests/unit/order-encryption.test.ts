import { describe, it, expect } from 'vitest';
import {
  encryptOrderPayload,
  decryptOrderPayload,
} from '@/server/auth/order-encryption';

describe('Order Link AES-256-GCM Encryption (Phase 9 Task 8 & Addendum A2/A8)', () => {
  const secretKey = 'test-secret-at-least-32-chars-long-for-aes-256-gcm!';
  const payload = {
    orderCode: 'A7K3-92',
    messageText: 'سلام، سفارش عسل طبیعی باباخُرم',
    channelType: 'WHATSAPP',
    channelValue: '09123456789',
    directUrl: 'https://wa.me/989123456789?text=test',
  };

  it('successfully encrypts and decrypts payload in round trip', () => {
    const encrypted = encryptOrderPayload(payload, secretKey);
    expect(encrypted).toBeDefined();
    expect(encrypted.split(':').length).toBe(3); // iv:authTag:ciphertext

    const decrypted = decryptOrderPayload(encrypted, secretKey);
    expect(decrypted).toEqual(payload);
  });

  it('fails decryption and returns null if ciphertext is tampered', () => {
    const encrypted = encryptOrderPayload(payload, secretKey);
    const parts = encrypted.split(':');
    // Tamper with ciphertext
    const tampered = `${parts[0]}:${parts[1]}:bad${parts[2].substring(3)}`;

    const decrypted = decryptOrderPayload(tampered, secretKey);
    expect(decrypted).toBeNull();
  });

  it('fails decryption and returns null if auth tag is tampered', () => {
    const encrypted = encryptOrderPayload(payload, secretKey);
    const parts = encrypted.split(':');
    // Tamper with auth tag
    const tampered = `${parts[0]}:00112233445566778899aabbccddeeff:${parts[2]}`;

    const decrypted = decryptOrderPayload(tampered, secretKey);
    expect(decrypted).toBeNull();
  });

  it('fails decryption if decrypted with wrong secret key', () => {
    const encrypted = encryptOrderPayload(payload, secretKey);
    const wrongKey = 'wrong-secret-key-32-chars-long-different-from-orig!';

    const decrypted = decryptOrderPayload(encrypted, wrongKey);
    expect(decrypted).toBeNull();
  });
});
