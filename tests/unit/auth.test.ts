import { describe, it, expect, beforeEach } from 'vitest';
import { hashPassword, verifyPassword } from '@/server/auth/password';
import {
  checkRateLimit,
  recordLoginFailure,
  resetRateLimit,
  getGenericAuthError,
} from '@/lib/rate-limit';
import { recordAuditLog, queryAuditLogs } from '@/server/services/audit-log-service';
import { createAdminAction } from '@/server/actions/admin-action-wrapper';
import { db } from '@/server/db/client';
import { z } from 'zod';

describe('Password Hashing & Verification (Argon2id & Scrypt fallback)', () => {
  it('correctly hashes a password and verifies it', async () => {
    const password = 'SuperSecretPassword123!';
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(20);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword('WrongPassword', hash);
    expect(isInvalid).toBe(false);
  });

  it('rejects empty passwords and malformed hashes safely', async () => {
    expect(await verifyPassword('', 'some-hash')).toBe(false);
    expect(await verifyPassword('password', '')).toBe(false);
    expect(await verifyPassword('password', '$invalid$format')).toBe(false);
  });
});

describe('Rate Limiter & Exponential Backoff', () => {
  const testKey = 'test-ip-key-' + Date.now();

  beforeEach(() => {
    resetRateLimit(testKey);
  });

  it('allows attempts within limit and blocks when exceeded', () => {
    const opts = { windowMs: 1000, maxAttempts: 3 };

    const first = checkRateLimit(testKey, opts);
    expect(first.success).toBe(true);
    expect(first.remaining).toBe(2);

    const second = checkRateLimit(testKey, opts);
    expect(second.success).toBe(true);
    expect(second.remaining).toBe(1);

    const third = checkRateLimit(testKey, opts);
    expect(third.success).toBe(true);
    expect(third.remaining).toBe(0);

    const fourth = checkRateLimit(testKey, opts);
    expect(fourth.success).toBe(false);
    expect(fourth.remaining).toBe(0);
    expect(fourth.retryAfterSec).toBeGreaterThan(0);
  });

  it('calculates exponential backoff progression accurately', () => {
    const key = 'backoff-' + Date.now();

    // 1-3 failures -> 0s backoff
    expect(recordLoginFailure(key).retryAfterSec).toBe(0);
    expect(recordLoginFailure(key).retryAfterSec).toBe(0);
    expect(recordLoginFailure(key).retryAfterSec).toBe(0);

    // 4th failure -> 5s backoff
    expect(recordLoginFailure(key).retryAfterSec).toBe(5);

    // 5th failure -> 15s backoff
    expect(recordLoginFailure(key).retryAfterSec).toBe(15);

    // 6th failure -> 60s backoff
    expect(recordLoginFailure(key).retryAfterSec).toBe(60);

    // 7th failure -> 300s backoff
    expect(recordLoginFailure(key).retryAfterSec).toBe(300);

    resetRateLimit(key);
  });

  it('generates generic error messages avoiding user enumeration', () => {
    const defaultErr = getGenericAuthError(0);
    expect(defaultErr).toBe('ایمیل یا رمز عبور اشتباه است.');

    const backoffErr = getGenericAuthError(30);
    expect(backoffErr).toContain('۳۰ ثانیه');
  });
});

describe('Audit Log Service', () => {
  it('records audit events and sanitizes sensitive credentials from summary', async () => {
    const rawSummary = 'User updated password: SuperSecretPass123 and token: eyJhbGciOi...';
    const log = await recordAuditLog({
      action: 'PASSWORD_CHANGE',
      entityType: 'User',
      entityId: 'u-123',
      summary: rawSummary,
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
    });

    expect(log.action).toBe('PASSWORD_CHANGE');
    expect(log.summary).not.toContain('SuperSecretPass123');
    expect(log.summary).toContain('[REDACTED]');
  });

  it('queries audit logs with entity and action filters', async () => {
    await recordAuditLog({
      action: 'TEST_FILTER_ACTION',
      entityType: 'TestEntity',
      summary: 'Test filter entry',
    });

    const res = await queryAuditLogs({ action: 'TEST_FILTER_ACTION' });
    expect(res.logs.length).toBeGreaterThanOrEqual(1);
    expect(res.logs[0].action).toBe('TEST_FILTER_ACTION');
  });
});

describe('Server Authorization Primitives & User Management Rules', () => {
  it('createAdminAction wrapper returns 401 when unauthenticated', async () => {
    const testAction = createAdminAction({
      schema: z.object({ value: z.string() }),
      handler: async (input) => {
        return { echo: input.value };
      },
    });

    // In unauthenticated context outside request
    const res = await testAction({ value: 'hello' });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.status).toBe(401);
      expect(res.error).toBeDefined();
    }
  });
});
