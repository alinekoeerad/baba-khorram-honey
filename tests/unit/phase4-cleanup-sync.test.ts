import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trackFeedbackAction } from '@/server/actions/feedback-actions';
import { db } from '@/server/db/client';
import StyleguidePage from '@/app/styleguide/page';

describe('Phase 4 Cleanup, Sync & Edge Fixes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes 0098 and 989 mobile variants properly in trackFeedbackAction', async () => {
    vi.spyOn(db.feedback, 'findFirst').mockResolvedValue({
      id: 'fb_1',
      trackingCode: 'FB-1405-ABCDE',
      phone: '09123456789',
      status: 'REVIEWED',
      type: 'SUGGESTION',
      createdAt: new Date('2026-11-20T10:00:00Z'),
      publicReply: 'سپاس از پیام شما',
    } as any);

    const resWith0098 = await trackFeedbackAction({
      trackingCode: 'FB-1405-ABCDE',
      phone: '00989123456789',
    });
    expect(resWith0098.success).toBe(true);
    expect(resWith0098.data?.trackingCode).toBe('FB-1405-ABCDE');

    const resWithPersian98 = await trackFeedbackAction({
      trackingCode: 'FB-1405-ABCDE',
      phone: '۹۸۹۱۲۳۴۵۶۷۸۹',
    });
    expect(resWithPersian98.success).toBe(true);
  });

  it('restricts /styleguide to non-production environments (calls notFound in production)', async () => {
    const prevEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'production';
    try {
      await expect(StyleguidePage()).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK;404/);
    } finally {
      (process.env as any).NODE_ENV = prevEnv;
    }
  });
});
