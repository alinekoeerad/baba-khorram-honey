/**
 * Authentication Server Actions (Phase 2, Task 2 & Phase 5, Task A)
 * Admin login and logout actions with sliding-window rate limiting,
 * exponential backoff, anti-enumeration generic error responses,
 * and robust multi-key session cookie persistence.
 */

'use server';

import crypto from 'crypto';
import { cookies, headers } from 'next/headers';
import { db } from '@/server/db/client';
import { verifyPassword } from '@/server/auth/password';
import {
  checkRateLimit,
  recordLoginFailure,
  resetRateLimit,
  getGenericAuthError,
} from '@/lib/rate-limit';
import { recordAuditLog } from '@/server/services/audit-log-service';
import { normalizeDigits } from '@/lib/domain-utils';

export async function adminLoginAction(data: { email: string; password: string }) {
  const { email, password } = data;
  const normalizedEmail = normalizeDigits((email || '').trim().toLowerCase());

  let ip = '127.0.0.1';
  let userAgent = '';
  try {
    const headerList = await headers();
    ip = headerList.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    userAgent = headerList.get('user-agent') || '';
  } catch {}

  const rateLimitKey = `login:${normalizedEmail || ip}`;
  const rateLimitCheck = checkRateLimit(rateLimitKey, {
    windowMs: 15 * 60 * 1000,
    maxAttempts: 5,
  });

  if (!rateLimitCheck.success) {
    return {
      success: false,
      error: getGenericAuthError(rateLimitCheck.retryAfterSec),
    };
  }

  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || !user.isActive || user.role !== 'ADMIN') {
    const { retryAfterSec } = recordLoginFailure(rateLimitKey);
    await recordAuditLog({
      action: 'LOGIN_FAILURE',
      entityType: 'User',
      summary: `Failed login attempt for email: ${normalizedEmail}`,
      ip,
      userAgent,
    });
    return {
      success: false,
      error: getGenericAuthError(retryAfterSec),
    };
  }

  const account = await db.account.findFirst({
    where: { userId: user.id, providerId: 'credential' },
  });

  if (!account || !account.password) {
    const { retryAfterSec } = recordLoginFailure(rateLimitKey);
    return {
      success: false,
      error: getGenericAuthError(retryAfterSec),
    };
  }

  const isValidPassword = await verifyPassword(password, account.password);
  if (!isValidPassword) {
    const { retryAfterSec } = recordLoginFailure(rateLimitKey);
    await recordAuditLog({
      userId: user.id,
      action: 'LOGIN_FAILURE',
      entityType: 'User',
      entityId: user.id,
      summary: `Invalid password attempt for admin: ${user.email}`,
      ip,
      userAgent,
    });
    return {
      success: false,
      error: getGenericAuthError(retryAfterSec),
    };
  }

  // Credentials valid: reset rate limiter
  resetRateLimit(rateLimitKey);

  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.session.create({
    data: {
      userId: user.id,
      token: sessionToken,
      expiresAt: expiresAt.toISOString(),
      ipAddress: ip,
      userAgent,
    },
  });

  // Set HttpOnly, SameSite=Lax cookies (both keys for absolute compatibility)
  const cookieStore = await cookies();
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  };

  cookieStore.set('better-auth.session_token', sessionToken, cookieOptions);
  cookieStore.set('honey.session_token', sessionToken, cookieOptions);

  await recordAuditLog({
    userId: user.id,
    action: 'LOGIN_SUCCESS',
    entityType: 'User',
    entityId: user.id,
    summary: `Admin «${user.name || user.email}» signed in successfully`,
    ip,
    userAgent,
  });

  return { success: true };
}

export async function adminLogoutAction() {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get('better-auth.session_token')?.value ||
      cookieStore.get('honey.session_token')?.value;

    if (token) {
      await db.session.delete({ where: { token } }).catch(() => {});
    }

    cookieStore.delete('better-auth.session_token');
    cookieStore.delete('honey.session_token');
    return { success: true };
  } catch {
    return { success: true };
  }
}
