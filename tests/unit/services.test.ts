import { describe, it, expect, vi } from 'vitest';
import { ProductService } from '@/server/services/product-service';
import { RecipeService } from '@/server/services/recipe-service';
import { buildProductSearchText, buildRecipeSearchText } from '@/server/services/search-text';
import { db } from '@/server/db/client';

describe('Service Layer Category Type Enforcement (Brief Section 8 & Task 1)', () => {
  it('enforces that product-category links permit only PRODUCT categories', async () => {
    // Mock db.category.findMany
    const findManySpy = vi.spyOn(db.category, 'findMany').mockResolvedValueOnce([
      { id: 'cat-recipe-1', name: 'چای و دمنوش‌ها', type: 'RECIPE' } as any,
    ]);

    await expect(
      ProductService.validateProductCategories(['cat-recipe-1'])
    ).rejects.toThrowError(/نوع دسته‌بندی با نوع آیتم همخوانی ندارد/);

    findManySpy.mockRestore();
  });

  it('accepts valid PRODUCT categories for products', async () => {
    const findManySpy = vi.spyOn(db.category, 'findMany').mockResolvedValueOnce([
      { id: 'cat-prod-1', name: 'انواع عسل', type: 'PRODUCT' } as any,
    ]);

    const result = await ProductService.validateProductCategories(['cat-prod-1']);
    expect(result).toEqual([{ id: 'cat-prod-1', name: 'انواع عسل' }]);

    findManySpy.mockRestore();
  });

  it('enforces that recipe-category links permit only RECIPE categories', async () => {
    const findManySpy = vi.spyOn(db.category, 'findMany').mockResolvedValueOnce([
      { id: 'cat-prod-1', name: 'انواع عسل', type: 'PRODUCT' } as any,
    ]);

    await expect(
      RecipeService.validateRecipeCategories(['cat-prod-1'])
    ).rejects.toThrowError(/نوع دسته‌بندی با نوع آیتم همخوانی ندارد/);

    findManySpy.mockRestore();
  });

  it('accepts valid RECIPE categories for recipes', async () => {
    const findManySpy = vi.spyOn(db.category, 'findMany').mockResolvedValueOnce([
      { id: 'cat-recipe-1', name: 'شربت‌ها و نوشیدنی‌های میوه‌ای', type: 'RECIPE' } as any,
    ]);

    const result = await RecipeService.validateRecipeCategories(['cat-recipe-1']);
    expect(result).toEqual([{ id: 'cat-recipe-1', name: 'شربت‌ها و نوشیدنی‌های میوه‌ای' }]);

    findManySpy.mockRestore();
  });
});

describe('Search Text Generation & Maintenance (Task 5)', () => {
  it('builds normalized search text for a product including all attributes', () => {
    const searchText = buildProductSearchText({
      nameFa: 'عسل زعفران',
      nameOriginal: 'SAFFRON',
      foodNature: 'گرم',
      vitamins: 'C,B6,B2,B1',
      harvestSeason: 'آبان',
      harvestPlace: 'خراسان',
      color: 'کهربایی',
      usageWarning: 'منع مصرف در بارداری',
      benefits: ['باز شدن رگ‌ها', 'تقویت حافظه'],
      categoryNames: ['انواع عسل'],
    });

    // Check normalization: lowercased Latin, unified letters, space-separated
    expect(searchText).toContain('عسل زعفران');
    expect(searchText).toContain('saffron');
    expect(searchText).toContain('باز شدن رگ ها');
    expect(searchText).toContain('خراسان');
    expect(searchText).not.toContain('SAFFRON'); // Must be lowercased
  });

  it('builds normalized search text for a recipe including ingredients and country', () => {
    const searchText = buildRecipeSearchText({
      nameFa: 'چای پوملو',
      nameOriginal: 'Fengmi Youzi Cha',
      country: 'چین',
      yieldText: '۴ لیوان',
      shortDescription: 'نوشیدنی خوش‌طعم و معطر',
      ingredientNames: ['پوملو تازه', 'عسل', 'آب'],
      ingredientNotes: ['پوست نازک'],
      categoryNames: ['شربت‌ها و نوشیدنی‌های میوه‌ای'],
    });

    expect(searchText).toContain('چای پوملو');
    expect(searchText).toContain('fengmi youzi cha');
    expect(searchText).toContain('چین');
    expect(searchText).toContain('4 لیوان'); // Persian digits normalized to Latin
    expect(searchText).toContain('پوملو تازه');
  });
});

describe('Batched Bulk Actions (Eliminate N+1 Loops)', () => {
  it('ProductService.bulkToggleProductAvailability updates multiple product IDs in a single call', async () => {
    const updateManySpy = vi.spyOn(db.product, 'updateMany').mockResolvedValueOnce({ count: 3 } as any);

    const res = await ProductService.bulkToggleProductAvailability(['p-1', 'p-2', 'p-3'], false, 'admin-1');
    expect(res.count).toBe(3);
    expect(updateManySpy).toHaveBeenCalledWith({
      where: { id: { in: ['p-1', 'p-2', 'p-3'] } },
      data: { isAvailable: false },
    });

    updateManySpy.mockRestore();
  });

  it('RecipeService.bulkUpdateRecipeStatus updates multiple recipe IDs in a single call', async () => {
    const updateManySpy = vi.spyOn(db.recipe, 'updateMany').mockResolvedValueOnce({ count: 2 } as any);

    const res = await RecipeService.bulkUpdateRecipeStatus(['r-1', 'r-2'], 'ARCHIVED', 'admin-1');
    expect(res.count).toBe(2);
    expect(updateManySpy).toHaveBeenCalledWith({
      where: { id: { in: ['r-1', 'r-2'] } },
      data: { status: 'ARCHIVED' },
    });

    updateManySpy.mockRestore();
  });
});

