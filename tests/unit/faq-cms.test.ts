import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getPublicFaqItems,
  getAdminFaqItems,
  createFaqItem,
  updateFaqItem,
  deleteFaqItem,
  reorderFaqItems,
  toggleFaqPublishStatus,
} from '@/server/services/faq-service';
import {
  createFaqAction,
  updateFaqAction,
  deleteFaqAction,
  reorderFaqsAction,
  toggleFaqPublishAction,
} from '@/server/actions/faq-actions';
import { db } from '@/server/db/client';

// Mock require-admin for action tests
vi.mock('@/server/auth/require-admin', () => ({
  requireAdmin: vi.fn(async () => ({
    user: { id: 'admin_test', email: 'admin@babakhorram.com', role: 'ADMIN' },
    session: { id: 'sess_test' },
  })),
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

describe('FAQ CMS & Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retrieves public FAQ items with proper formatting and fallback', async () => {
    const items = await getPublicFaqItems();
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);

    const first = items[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('question');
    expect(first).toHaveProperty('shortAnswer');
    expect(first).toHaveProperty('category');
    expect(first).toHaveProperty('blocks');
  });

  it('retrieves admin FAQ items for management table', async () => {
    const adminItems = await getAdminFaqItems();
    expect(Array.isArray(adminItems)).toBe(true);
    expect(adminItems.length).toBeGreaterThan(0);
  });

  it('creates, updates and deletes a new FAQ item via service and actions', async () => {
    const uniqueAnchor = `test-anchor-${Date.now()}`;

    // 1. Create via Action
    const createRes = await createFaqAction({
      anchorId: uniqueAnchor,
      question: 'آیا این یک سوال تستی برای آزمون خودکار است؟',
      answer: 'بله، این سوال صرفاً جهت راستی‌آزمایی متدهای سرویس ایجاد شده است.',
      category: 'authenticity',
      categoryLabel: 'اصالت و تشخیص علمی',
      sortOrder: 99,
      isPublished: true,
      featuredOnHome: false,
      featuredInNav: false,
      blocks: [
        {
          type: 'paragraph',
          text: 'توضیحات تفصیلی پاراگراف تستی.',
        },
      ],
    });

    expect(createRes.success).toBe(true);
    expect(createRes.data).toBeDefined();
    const createdId = (createRes.data as any).id;

    // 2. Update via Action
    const updateRes = await updateFaqAction(createdId, {
      question: 'عنوان بروزرسانی‌شده برای سوال تستی؟',
      answer: 'پاسخ بروزرسانی‌شده با موفقیت ثبت شد.',
    });
    expect(updateRes.success).toBe(true);

    // Verify change in DB
    const updatedInDb = await db.faqItem.findUnique({ where: { id: createdId } });
    expect(updatedInDb?.question).toBe('عنوان بروزرسانی‌شده برای سوال تستی؟');

    // 3. Toggle Publish
    const toggleRes = await toggleFaqPublishAction(createdId, false);
    expect(toggleRes.success).toBe(true);
    const toggledInDb = await db.faqItem.findUnique({ where: { id: createdId } });
    expect(toggledInDb?.isPublished).toBe(false);

    // 4. Delete via Action
    const deleteRes = await deleteFaqAction(createdId);
    expect(deleteRes.success).toBe(true);

    const deletedFromDb = await db.faqItem.findUnique({ where: { id: createdId } });
    expect(deletedFromDb).toBeNull();
  });

  it('rejects duplicate anchorId on creation', async () => {
    const existing = await db.faqItem.findFirst();
    if (!existing) return;

    const res = await createFaqAction({
      anchorId: existing.anchorId,
      question: 'یک سوال با شناسه لنگر تکراری',
      answer: 'این درخواست باید با خطای اعتبارسنجی رد شود.',
      category: 'authenticity',
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('قبلاً ثبت شده است');
  });

  it('reorders FAQ items properly', async () => {
    const items = await db.faqItem.findMany({ take: 2 });
    if (items.length < 2) return;

    const reorderRes = await reorderFaqsAction({
      items: [
        { id: items[0].id, sortOrder: 5 },
        { id: items[1].id, sortOrder: 6 },
      ],
    });

    expect(reorderRes.success).toBe(true);
    const item0 = await db.faqItem.findUnique({ where: { id: items[0].id } });
    expect(item0?.sortOrder).toBe(5);
  });
});
