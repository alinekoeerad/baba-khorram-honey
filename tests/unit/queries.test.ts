import { describe, it, expect, vi } from 'vitest';
import { matchesServingFilter, normalizeSearchText, toPersianDigits } from '@/lib/domain-utils';
import { getPublicProducts } from '@/server/queries/products';
import { getPublicRecipes } from '@/server/queries/recipes';
import { db } from '@/server/db/client';

describe('Public Queries Unit Tests (Phase 8)', () => {
  describe('Serving Toggle Semantics (Brief Section 8 & 9)', () => {
    it('matches COLD toggle when servingTypes contains COLD', () => {
      expect(matchesServingFilter(['COLD'], 'COLD')).toBe(true);
      expect(matchesServingFilter(['COLD'], 'HOT')).toBe(false);
    });

    it('matches HOT toggle when servingTypes contains HOT', () => {
      expect(matchesServingFilter(['HOT'], 'HOT')).toBe(true);
      expect(matchesServingFilter(['HOT'], 'COLD')).toBe(false);
    });

    it('WARM recipes appear under BOTH COLD and HOT toggles', () => {
      expect(matchesServingFilter(['WARM'], 'COLD')).toBe(true);
      expect(matchesServingFilter(['WARM'], 'HOT')).toBe(true);
    });

    it('multi-serving recipes containing WARM appear under both', () => {
      expect(matchesServingFilter(['COLD', 'WARM'], 'COLD')).toBe(true);
      expect(matchesServingFilter(['COLD', 'WARM'], 'HOT')).toBe(true);
      expect(matchesServingFilter(['HOT', 'WARM'], 'COLD')).toBe(true);
      expect(matchesServingFilter(['HOT', 'WARM'], 'HOT')).toBe(true);
    });
  });

  describe('Search Normalizer with Arabic Variants (Brief Section 10)', () => {
    it('normalizes Arabic Yeh (ي) to Persian Yeh (ی)', () => {
      const arabic = 'شربت ليمو ترش و عسل طبيعي';
      const expected = 'شربت لیمو ترش و عسل طبیعی';
      expect(normalizeSearchText(arabic)).toBe(expected);
    });

    it('normalizes Arabic Kaf (ك) to Persian Kaf (ک)', () => {
      const arabic = 'كيك عسلي با كنجد';
      const expected = 'کیک عسلی با کنجد';
      expect(normalizeSearchText(arabic)).toBe(expected);
    });

    it('supports partial word matching through normalized substrings', () => {
      const text = normalizeSearchText('عسل گون کوهستان');
      const partial = normalizeSearchText('گون');
      expect(text.includes(partial)).toBe(true);
    });
  });

  describe('toPersianDigits (Brief Section 9)', () => {
    it('converts English numbers to Persian digits correctly', () => {
      expect(toPersianDigits(1)).toBe('۱');
      expect(toPersianDigits(20)).toBe('۲۰');
      expect(toPersianDigits(1399)).toBe('۱۳۹۹');
      expect(toPersianDigits('Step 4')).toBe('Step ۴');
    });

    it('handles empty or null inputs gracefully', () => {
      expect(toPersianDigits(null)).toBe('');
      expect(toPersianDigits(undefined)).toBe('');
      expect(toPersianDigits('')).toBe('');
    });
  });

  describe('Zero N+1 Query Guarantee (Constraint)', () => {
    it('executes exactly ONE findMany and ONE count query for products listing', async () => {
      const findManySpy = vi.spyOn(db.product, 'findMany').mockResolvedValueOnce([
        {
          id: 'prod_1',
          slug: 'acacia',
          nameFa: 'عسل اقاقیا',
          nameOriginal: 'Acacia Honey',
          status: 'PUBLISHED',
          isAvailable: true,
          isFeatured: false,
          cardTheme: 'GREEN',
          sortOrder: 1,
          shortDescription: 'توضیح کوتاه',
          description: 'توضیحات کامل',
          foodNature: 'معتدل',
          vitamins: 'B1, B2',
          harvestSeason: 'بهار',
          harvestPlace: 'ارسباران',
          color: 'کهربایی روشن',
          usageWarning: null,
          mainImage: {
            id: 'asset_1',
            width: 800,
            height: 600,
            blurDataUrl: 'data:image/webp;base64,abc',
          },
          categories: [{ category: { id: 'cat_1', name: 'عسل کوهستان', slug: 'mountain' } }],
          options: [{ id: 'opt_1', label: '۱ کیلوگرم', isAvailable: true, sortOrder: 0 }],
        } as any,
      ]);

      const countSpy = vi.spyOn(db.product, 'count').mockResolvedValueOnce(1);

      const result = await getPublicProducts({ take: 20 });

      // Verifications
      expect(findManySpy).toHaveBeenCalledTimes(1);
      expect(countSpy).toHaveBeenCalledTimes(1);
      expect(result.items.length).toBe(1);
      expect(result.items[0].title).toBe('عسل اقاقیا');
      expect(result.items[0].imageAsset?.id).toBe('asset_1');

      findManySpy.mockRestore();
      countSpy.mockRestore();
    });

    it('executes exactly ONE findMany and ONE count query for recipes listing', async () => {
      const findManySpy = vi.spyOn(db.recipe, 'findMany').mockResolvedValueOnce([
        {
          id: 'rec_1',
          slug: 'lemon-honey',
          nameFa: 'شربت عسل و لیمو',
          nameOriginal: 'Honey Lemon Drink',
          status: 'PUBLISHED',
          country: 'ایران',
          servingTypes: ['COLD', 'WARM'],
          yieldText: '۲ فنجان',
          isFeatured: false,
          cardTheme: 'YELLOW',
          sortOrder: 1,
          shortDescription: 'نوشیدنی گوارا',
          longDescription: 'توضیحات کامل',
          mainImage: {
            id: 'asset_2',
            width: 800,
            height: 600,
            blurDataUrl: null,
          },
          categories: [{ category: { id: 'cat_2', name: 'نوشیدنی سرد', slug: 'cold-drinks' } }],
        } as any,
      ]);

      const countSpy = vi.spyOn(db.recipe, 'count').mockResolvedValueOnce(1);

      const result = await getPublicRecipes({ serving: 'cold', take: 20 });

      expect(findManySpy).toHaveBeenCalledTimes(1);
      expect(countSpy).toHaveBeenCalledTimes(1);
      expect(result.items.length).toBe(1);
      expect(result.items[0].title).toBe('شربت عسل و لیمو');

      findManySpy.mockRestore();
      countSpy.mockRestore();
    });
  });
});
