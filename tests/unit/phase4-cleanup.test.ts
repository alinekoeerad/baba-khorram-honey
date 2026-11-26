import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trackFeedbackAction } from '@/server/actions/feedback-actions';
import StyleguidePage from '@/app/styleguide/page';
import { db } from '@/server/db/client';

describe('Phase 4 Cleanup, Sync & Hardening', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes +98 / 0098 phone formats in trackFeedbackAction', async () => {
    vi.spyOn(db.feedback, 'findFirst').mockResolvedValueOnce({
      trackingCode: 'FB-1405-AB12C',
      phone: '09123456789',
      status: 'UNREAD',
      type: 'SUGGESTION',
      createdAt: new Date(),
      publicReply: null,
    } as any);

    const res = await trackFeedbackAction({
      trackingCode: 'FB-1405-AB12C',
      phone: '00989123456789',
    });

    expect(res.success).toBe(true);
    expect(res.data?.trackingCode).toBe('FB-1405-AB12C');
  });

  it('restricts /styleguide to development mode (calls notFound otherwise)', async () => {
    await expect(StyleguidePage()).rejects.toThrow();
  });

  it('removed unused contact-bar.tsx and coming-soon.tsx files', () => {
    const root = process.cwd();
    expect(fs.existsSync(path.join(root, 'src', 'components', 'public', 'contact-bar.tsx'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'src', 'components', 'admin', 'coming-soon.tsx'))).toBe(false);
  });
});
