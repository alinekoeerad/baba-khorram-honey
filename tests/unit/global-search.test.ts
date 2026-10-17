import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchGlobal } from '@/server/queries/search';
import { searchGlobalAction } from '@/server/actions/search-actions';
import { db } from '@/server/db/client';

describe('Global Search Unit Tests (Phase 10 Task 1/6)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('enforces minimum 2 characters query rule', async () => {
    const emptyRes = await searchGlobal({ q: '' });
    expect(emptyRes.products.length).toBe(0);
    expect(emptyRes.recipes.length).toBe(0);

    const singleCharRes = await searchGlobal({ q: 'ع' });
    expect(singleCharRes.products.length).toBe(0);
    expect(singleCharRes.recipes.length).toBe(0);
  });

  it('searches products and recipes with Persian normalization (e.g. زنجبیل, ي/ی, ك/ک)', async () => {
    vi.spyOn(db.product, 'findMany').mockResolvedValueOnce([
      {
        id: 'p_ginger',
        slug: 'ginger-honey',
        nameFa: 'عسل زنجبیل کوهستان',
        nameOriginal: 'Mountain Ginger Honey',
        status: 'PUBLISHED',
        isAvailable: true,
        isFeatured: false,
        cardTheme: 'ORANGE',
        sortOrder: 1,
        categories: [],
        options: [],
      } as any,
    ]);
    vi.spyOn(db.product, 'count').mockResolvedValueOnce(1);

    vi.spyOn(db.recipe, 'findMany').mockResolvedValueOnce([
      {
        id: 'r_ginger_tea',
        slug: 'ginger-honey-tea',
        nameFa: 'چای زنجبیل و عسل',
        nameOriginal: 'Ginger Honey Tea',
        status: 'PUBLISHED',
        country: 'ایران',
        servingTypes: ['HOT'],
        isFeatured: false,
        cardTheme: 'YELLOW',
        sortOrder: 1,
        categories: [],
      } as any,
    ]);
    vi.spyOn(db.recipe, 'count').mockResolvedValueOnce(1);

    const result = await searchGlobal({ q: 'زنجبيل' }); // with Arabic Yeh (ي)

    expect(result.products.length).toBe(1);
    expect(result.products[0].title).toBe('عسل زنجبیل کوهستان');
    expect(result.recipes.length).toBe(1);
    expect(result.recipes[0].title).toBe('چای زنجبیل و عسل');
    expect(result.totalProducts).toBe(1);
    expect(result.totalRecipes).toBe(1);
  });

  it('normalizes Persian vs English digits in search queries seamlessly (500 vs ۵۰۰)', async () => {
    let capturedWhereEn: any = null;
    let capturedWhereFa: any = null;

    vi.spyOn(db.product, 'findMany').mockImplementation(async (args: any) => {
      if (!capturedWhereEn) {
        capturedWhereEn = args.where;
      } else {
        capturedWhereFa = args.where;
      }
      return [];
    });
    vi.spyOn(db.product, 'count').mockResolvedValue(0);
    vi.spyOn(db.recipe, 'findMany').mockResolvedValue([]);
    vi.spyOn(db.recipe, 'count').mockResolvedValue(0);

    await searchGlobal({ q: '500' });
    await searchGlobal({ q: '۵۰۰' });

    expect(capturedWhereEn).toBeDefined();
    expect(capturedWhereFa).toBeDefined();

    // Both should search for the canonical ASCII digit '500' in searchText
    const clauseEn = capturedWhereEn.AND[0].OR;
    const clauseFa = capturedWhereFa.AND[0].OR;

    expect(clauseEn.some((c: any) => c.searchText?.contains === '500')).toBe(true);
    expect(clauseFa.some((c: any) => c.searchText?.contains === '500')).toBe(true);
    // Both should also match the Persian digit '۵۰۰' in nameFa or searchText
    expect(clauseEn.some((c: any) => c.nameFa?.contains === '۵۰۰')).toBe(true);
    expect(clauseFa.some((c: any) => c.nameFa?.contains === '۵۰۰')).toBe(true);
  });

  it('rate limits excessive search queries', async () => {
    // 60 requests per minute limit
    let lastResult;
    for (let i = 0; i < 65; i++) {
      lastResult = await searchGlobalAction('عسل');
    }

    // 65th request should be rate-limited
    expect(lastResult?.success).toBe(false);
    expect(lastResult?.error).toContain('بیش از حد مجاز');
  });
});
