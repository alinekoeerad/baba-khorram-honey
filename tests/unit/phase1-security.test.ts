import { describe, it, expect, beforeEach } from 'vitest';
import { buildInvoicePrintHtml, buildInvoiceWordHtml } from '@/lib/invoice-export';
import { serializeJsonLd } from '@/lib/utils';
import { validateEnv } from '@/lib/env';
import { isRateLimitLocked, recordLoginFailure, resetRateLimit } from '@/lib/rate-limit';
import { LocalDiskStorage } from '@/server/storage/storage-provider';
import { GET as serveUploadGet } from '@/app/uploads/[...path]/route';
import { NextRequest } from 'next/server';

describe('Phase 1 Security Hardening', () => {
  it('escapes HTML payloads in print and Word invoice exports', () => {
    const xss = '<script>alert("xss")</script>';
    const baseData = {
      orderCode: 'BK-1001',
      invoiceDate: '1405/09/05',
      senderName: 'عسل باباخُرم',
      senderPhone: '09389196010',
      senderAddress: 'تهران',
      senderPostalCode: '1234567890',
      customerName: `علی ${xss}`,
      customerMobile: '09121234567',
      customerCity: 'تهران',
      customerAddress: 'خیابان <b>تست</b>',
      customerNotes: '<img src=x onerror=alert(1)>',
      lines: [
        {
          id: 'l1',
          productNameFa: `عسل <script>evil()</script>`,
          optionLabel: 'یک کیلوگرم',
          qty: 1,
          unitPrice: 500000,
        },
      ],
    };

    const printHtml = buildInvoicePrintHtml(baseData);
    expect(printHtml).not.toContain('<script>alert("xss")</script>');
    expect(printHtml).not.toContain('<img src=x onerror=alert(1)>');
    expect(printHtml).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');

    const wordHtml = buildInvoiceWordHtml(baseData);
    expect(wordHtml).not.toContain('<script>evil()</script>');
    expect(wordHtml).toContain('&lt;script&gt;evil()&lt;/script&gt;');
  });

  it('escapes "<" in JSON-LD serialization to prevent script breakout', () => {
    const out = serializeJsonLd({ name: '</script><script>alert(1)</script>' });
    expect(out).not.toContain('</script>');
    expect(out).toContain('\\u003c/script>');
  });

  it('rejects default BETTER_AUTH_SECRET in production runtime', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        SITE_URL: 'https://babakhorram.com',
        ORDER_LINK_SECRET: 'custom-prod-order-secret-key-at-least-32-chars!',
        BETTER_AUTH_SECRET: 'development-better-auth-secret-key-32-chars-long!',
      })
    ).toThrowError(/BETTER_AUTH_SECRET/);
  });

  describe('Login lock check without double-counting', () => {
    const key = 'login:1.2.3.4:admin@honey.ir';

    beforeEach(() => {
      resetRateLimit(key);
    });

    it('isRateLimitLocked does not increment failure counter', () => {
      for (let i = 0; i < 10; i++) {
        expect(isRateLimitLocked(key).locked).toBe(false);
      }
      // First real failure must still start at attempt 1 (0s backoff)
      expect(recordLoginFailure(key).attempts).toBe(1);
      expect(recordLoginFailure(key).attempts).toBe(2);
      expect(recordLoginFailure(key).attempts).toBe(3);
      // 4th failure triggers 5s lock
      const fourth = recordLoginFailure(key);
      expect(fourth.retryAfterSec).toBe(5);
      expect(isRateLimitLocked(key).locked).toBe(true);
    });
  });

  it('blocks SVG, HTML, and traversal paths in uploads route & storage provider', async () => {
    const storage = new LocalDiskStorage();
    expect(() => storage.resolveSafePath('../../etc/passwd')).not.toThrow(); // basename flattens to 'passwd'
    expect(storage.resolveSafePath('../../etc/passwd').endsWith('passwd')).toBe(true);

    const svgReq = new NextRequest('http://localhost:3000/uploads/evil.svg');
    const svgRes = await serveUploadGet(svgReq, { params: Promise.resolve({ path: ['evil.svg'] }) });
    expect(svgRes.status).toBe(403);

    const htmlReq = new NextRequest('http://localhost:3000/uploads/page.html');
    const htmlRes = await serveUploadGet(htmlReq, { params: Promise.resolve({ path: ['page.html'] }) });
    expect(htmlRes.status).toBe(403);

    const dotdotReq = new NextRequest('http://localhost:3000/uploads/../secret.webp');
    const dotdotRes = await serveUploadGet(dotdotReq, {
      params: Promise.resolve({ path: ['..', 'secret.webp'] }),
    });
    expect(dotdotRes.status).toBe(403);
  });
});
