import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getPublicMagazineArticles,
  getPublicMagazineArticleBySlug,
  getAdminMagazineArticles,
  getMagazineArticleById,
  createMagazineArticle,
  updateMagazineArticle,
  deleteMagazineArticle,
  toggleMagazineArticleStatus,
} from '@/server/services/magazine-service';
import {
  createMagazineArticleAction,
  updateMagazineArticleAction,
  deleteMagazineArticleAction,
  toggleMagazineArticleStatusAction,
  reorderMagazineArticlesAction,
} from '@/server/actions/magazine-actions';
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

describe('Magazine CMS & Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retrieves public magazine articles with proper schema and all 7 articles', async () => {
    const articles = await getPublicMagazineArticles();
    expect(Array.isArray(articles)).toBe(true);
    expect(articles.length).toBeGreaterThanOrEqual(7);

    const first = articles[0];
    expect(first).toHaveProperty('slug');
    expect(first).toHaveProperty('title');
    expect(first).toHaveProperty('category');
    expect(first).toHaveProperty('theme');
    expect(first).toHaveProperty('sections');
    expect(Array.isArray(first.sections)).toBe(true);
  });

  it('retrieves honey-temperament article preserving temperament table block', async () => {
    const article = await getPublicMagazineArticleBySlug('honey-temperament');
    expect(article).toBeDefined();
    expect(article?.slug).toBe('honey-temperament');
    expect(article?.title).toContain('طبع‌شناسی');

    // Verify sections contain temperament guide
    const guideSection = article?.sections.find((s) =>
      s.blocks.some((b: any) => b.type === 'temperament-guide')
    );
    expect(guideSection).toBeDefined();
  });

  it('retrieves admin magazine articles for management table', async () => {
    const adminArticles = await getAdminMagazineArticles();
    expect(Array.isArray(adminArticles)).toBe(true);
    expect(adminArticles.length).toBeGreaterThanOrEqual(7);
  });

  it('creates, updates and deletes a magazine article via server actions', async () => {
    const uniqueSlug = `test-article-${Date.now()}`;

    // 1. Create Article via Action
    const createRes = await createMagazineArticleAction({
      slug: uniqueSlug,
      title: 'مقاله تستی برای آزمون جامع سیستم مجله',
      shortTitle: 'مقاله تستی',
      subtitle: 'زیرعنوان مقاله تستی برای راستی‌آزمایی',
      excerpt: 'این یک خلاصه جامع تستی برای بررسی عملکرد اکشن‌ها و دیتابیس است.',
      category: 'bee-products',
      categoryLabel: 'فرآورده‌های ارزشمند کندو',
      badge: 'تست خودکار',
      theme: 'YELLOW',
      readTime: '۴ دقیقه مطالعه',
      readTimeMinutes: 4,
      status: 'PUBLISHED',
      sortOrder: 10,
      featuredInNav: false,
      navOrder: 0,
      sections: [
        {
          id: 'intro',
          title: 'مقدمه بخش تستی',
          blocks: [
            {
              type: 'paragraph',
              text: 'متن پاراگراف آزمایشی برای صحت ذخیره‌سازی در دیتابیس.',
            },
          ],
        },
      ],
      seoTitle: 'عنوان سئو مقاله تستی',
      seoDescription: 'توضیحات سئو مقاله تستی',
    });

    expect(createRes.success).toBe(true);
    expect(createRes.data).toBeDefined();
    const createdId = (createRes.data as any).id;

    // 2. Fetch by Id
    const fetched = await getMagazineArticleById(createdId);
    expect(fetched).toBeDefined();
    expect(fetched?.slug).toBe(uniqueSlug);

    // 3. Update via Action
    const updateRes = await updateMagazineArticleAction(createdId, {
      title: 'عنوان ویرایش‌شده مقاله تستی',
      excerpt: 'خلاصه جدید ویرایش‌شده برای راستی‌آزمایی آپدیت در دیتابیس.',
    });
    expect(updateRes.success).toBe(true);

    const updatedInDb = await db.magazineArticle.findUnique({ where: { id: createdId } });
    expect(updatedInDb?.title).toBe('عنوان ویرایش‌شده مقاله تستی');

    // 4. Toggle Status
    const toggleRes = await toggleMagazineArticleStatusAction(createdId, 'DRAFT');
    expect(toggleRes.success).toBe(true);

    const draftInDb = await db.magazineArticle.findUnique({ where: { id: createdId } });
    expect(draftInDb?.status).toBe('DRAFT');

    // 5. Reorder
    const reorderRes = await reorderMagazineArticlesAction({
      items: [{ id: createdId, sortOrder: 99 }],
    });
    expect(reorderRes.success).toBe(true);

    const reorderedInDb = await db.magazineArticle.findUnique({ where: { id: createdId } });
    expect(reorderedInDb?.sortOrder).toBe(99);

    // 6. Delete
    const deleteRes = await deleteMagazineArticleAction(createdId);
    expect(deleteRes.success).toBe(true);

    const deletedInDb = await db.magazineArticle.findUnique({ where: { id: createdId } });
    expect(deletedInDb).toBeNull();
  });
});
