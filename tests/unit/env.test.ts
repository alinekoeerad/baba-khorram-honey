import { describe, it, expect } from 'vitest';
import { validateEnv, envSchema } from '@/lib/env';
import { uiStringsFa } from '@/content/ui-strings.fa';

describe('Environment Module & Zod Validation', () => {
  it('successfully validates a complete environment configuration', () => {
    const validEnv = {
      NODE_ENV: 'development',
      PORT: '3000',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/honey_dev?schema=public',
      SITE_URL: 'http://localhost:3000',
      UPLOAD_DIR: './uploads',
      ORDER_LINK_SECRET: 'a-super-secret-key-that-is-at-least-32-chars-long!',
    };

    const parsed = validateEnv(validEnv);
    expect(parsed.DATABASE_URL).toBe(validEnv.DATABASE_URL);
    expect(parsed.SITE_URL).toBe(validEnv.SITE_URL);
    expect(parsed.PORT).toBe(3000);
    expect(parsed.NODE_ENV).toBe('development');
  });

  it('fails fast with a clear error message when DATABASE_URL is missing', () => {
    const invalidEnv = {
      SITE_URL: 'http://localhost:3000',
      UPLOAD_DIR: './uploads',
    };

    expect(() => validateEnv(invalidEnv)).toThrowError(/DATABASE_URL/);
    expect(() => validateEnv(invalidEnv)).toThrowError(/Invalid environment variables/);
  });

  it('fails fast when SITE_URL is not a valid URL', () => {
    const invalidEnv = {
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/honey_dev',
      SITE_URL: 'not-a-valid-url',
      UPLOAD_DIR: './uploads',
    };

    expect(() => validateEnv(invalidEnv)).toThrowError(/SITE_URL must be a valid URL/);
  });
});

describe('Persian UI Strings Repository', () => {
  it('contains central brand information in Persian', () => {
    expect(uiStringsFa.brand.name).toBe('عسل باباخُرم');
    expect(uiStringsFa.brand.tagline).toBeDefined();
    expect(uiStringsFa.navigation.home).toBe('صفحه اصلی');
    expect(uiStringsFa.cart.confirmSentHeading).toBe('سفارش را ارسال کردید؟');
  });
});
