/**
 * Reusable Rate Limiter & Login Exponential Backoff (Phase 2)
 * In-memory sliding-window limiter designed for login and public endpoints.
 * Includes backoff calculator to throttle brute-force attacks without permanent lockouts.
 */

interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  lastAttemptAt: number;
  lockedUntil: number | null;
}

const memoryStore = new Map<string, RateLimitRecord>();

// Periodic garbage collection for expired entries (every 10 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      if (now - record.lastAttemptAt > 60 * 60 * 1000) {
        memoryStore.delete(key);
      }
    }
  }, 10 * 60 * 1000).unref?.();
}

export interface RateLimitOptions {
  windowMs: number;
  maxAttempts: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  retryAfterSec: number;
  attempts: number;
}

/**
 * Checks and increments rate limit counter for a specific key.
 */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const record = memoryStore.get(key);

  // If locked by exponential backoff
  if (record?.lockedUntil && record.lockedUntil > now) {
    const retryAfterSec = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      success: false,
      remaining: 0,
      resetTime: record.lockedUntil,
      retryAfterSec,
      attempts: record.attempts,
    };
  }

  // If entry doesn't exist or window expired
  if (!record || now - record.firstAttemptAt > options.windowMs) {
    memoryStore.set(key, {
      attempts: 1,
      firstAttemptAt: now,
      lastAttemptAt: now,
      lockedUntil: null,
    });
    return {
      success: true,
      remaining: options.maxAttempts - 1,
      resetTime: now + options.windowMs,
      retryAfterSec: 0,
      attempts: 1,
    };
  }

  // Increment within window
  record.attempts += 1;
  record.lastAttemptAt = now;

  if (record.attempts > options.maxAttempts) {
    const retryAfterSec = Math.ceil((record.firstAttemptAt + options.windowMs - now) / 1000);
    return {
      success: false,
      remaining: 0,
      resetTime: record.firstAttemptAt + options.windowMs,
      retryAfterSec: Math.max(1, retryAfterSec),
      attempts: record.attempts,
    };
  }

  return {
    success: true,
    remaining: options.maxAttempts - record.attempts,
    resetTime: record.firstAttemptAt + options.windowMs,
    retryAfterSec: 0,
    attempts: record.attempts,
  };
}

/**
 * Calculates exponential backoff after failed login attempts.
 * 1-3 failures: 0s
 * 4 failures: 5s
 * 5 failures: 15s
 * 6 failures: 60s
 * 7+ failures: 300s (5 minutes)
 */
export function recordLoginFailure(key: string): { attempts: number; retryAfterSec: number } {
  const now = Date.now();
  let record = memoryStore.get(key);

  if (!record || now - record.lastAttemptAt > 60 * 60 * 1000) {
    record = {
      attempts: 1,
      firstAttemptAt: now,
      lastAttemptAt: now,
      lockedUntil: null,
    };
    memoryStore.set(key, record);
    return { attempts: 1, retryAfterSec: 0 };
  }

  record.attempts += 1;
  record.lastAttemptAt = now;

  let backoffSec = 0;
  if (record.attempts === 4) {
    backoffSec = 5;
  } else if (record.attempts === 5) {
    backoffSec = 15;
  } else if (record.attempts === 6) {
    backoffSec = 60;
  } else if (record.attempts >= 7) {
    backoffSec = 300;
  }

  if (backoffSec > 0) {
    record.lockedUntil = now + backoffSec * 1000;
  }

  return { attempts: record.attempts, retryAfterSec: backoffSec };
}

/**
 * Resets rate limit for a key upon successful action.
 */
export function resetRateLimit(key: string): void {
  memoryStore.delete(key);
}

/**
 * Generic login error message preventing user enumeration.
 */
function toPersianDigits(n: number | string): string {
  return String(n).replace(/[0-9]/g, (d) => String.fromCharCode(d.charCodeAt(0) + 1728));
}

export function getGenericAuthError(retryAfterSec: number = 0): string {
  if (retryAfterSec > 0) {
    const pNum = toPersianDigits(retryAfterSec);
    return `تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً ${pNum} ثانیه دیگر دوباره امتحان کنید.`;
  }
  return 'ایمیل یا رمز عبور اشتباه است.';
}
