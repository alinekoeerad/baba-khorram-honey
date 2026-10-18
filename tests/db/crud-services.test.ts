import { describe, it, expect } from 'vitest';
import { CategoryService } from '@/server/services/category-service';
import { ProductService, ConcurrencyConflictError } from '@/server/services/product-service';
import { RecipeService } from '@/server/services/recipe-service';
import { getPublishedProducts, getPublishedProductBySlug } from '@/server/queries/products';
import { getPublishedRecipes } from '@/server/queries/recipes';
import { getActiveCategoriesByType } from '@/server/queries/categories';
import { db } from '@/server/db/client';

describe('Verbatim Text Preservation on Edit-Save (Acceptance Criteria)', () => {
  it('preserves all 31 imported products text fields identically on edit-save with no changes', async () => {
    const products = await db.product.findMany();
    expect(products.length).toBe(31);

    for (const prod of products) {
      // Perform no-change update
      const updated = await ProductService.updateProduct(prod.id, {
        nameFa: prod.nameFa,
        nameOriginal: prod.nameOriginal,
        slug: prod.slug,
        status: prod.status,
        foodNature: prod.foodNature,
        vitamins: prod.vitamins,
        harvestSeason: prod.harvestSeason,
        harvestPlace: prod.harvestPlace,
        color: prod.color,
        usageWarning: prod.usageWarning,
        benefits: (prod as any).benefits,
      });

      expect(updated.nameFa).toBe(prod.nameFa);
      expect(updated.nameOriginal).toBe(prod.nameOriginal);
      expect(updated.slug).toBe(prod.slug);
      expect(updated.foodNature).toBe(prod.foodNature);
      expect(updated.vitamins).toBe(prod.vitamins);
      expect(updated.usageWarning).toBe(prod.usageWarning);
      expect(updated.color).toBe(prod.color);
    }
  });

  it('preserves all 37 imported recipes text fields identically on edit-save with no changes', async () => {
    const recipes = await db.recipe.findMany();
    expect(recipes.length).toBe(37);

    for (const rec of recipes) {
      const updated = await RecipeService.updateRecipe(rec.id, {
        nameFa: rec.nameFa,
        nameOriginal: rec.nameOriginal,
        slug: rec.slug,
        country: rec.country,
        yieldText: rec.yieldText,
        servingTypes: rec.servingTypes,
        ingredients: (rec as any).ingredients,
        steps: (rec as any).steps,
      });

      expect(updated.nameFa).toBe(rec.nameFa);
      expect(updated.nameOriginal).toBe(rec.nameOriginal);
      expect(updated.country).toBe(rec.country);
      expect(updated.yieldText).toBe(rec.yieldText);
      expect((updated as any).ingredients?.length).toBe((rec as any).ingredients?.length);
      expect((updated as any).steps?.length).toBe((rec as any).steps?.length);
    }
  });
});

describe('Category Service & Safe Deletion Guard (Phase 4, Task 1)', () => {
  it('strictly forbids deletion of a category currently in use by products or recipes', async () => {
    // Honey-types category is used by 29 products
    const cat = await db.category.findUnique({ where: { type_slug: { type: 'PRODUCT', slug: 'honey-types' } } });
    expect(cat).toBeDefined();

    await expect(CategoryService.deleteCategory(cat!.id)).rejects.toThrow(
      /دارای اقلام متصل است و نمی‌تواند حذف شود/
    );
  });

  it('active-only query filters out archived categories', async () => {
    const activeCats = await getActiveCategoriesByType('PRODUCT');
    for (const c of activeCats) {
      expect(c.status).toBe('ACTIVE');
    }
  });
});

describe('Slug Redirects & Concurrency Control (Phase 4, Tasks 2 & 3)', () => {
  it('creates permanent 301 SlugRedirect when a product slug is edited', async () => {
    // Create temporary product to test slug edit
    const temp = await ProductService.createProduct({
      nameFa: 'عسل آویشن کوهی',
      slug: 'thyme-honey-test-slug',
      status: 'PUBLISHED',
      isAvailable: true,
      isFeatured: false,
      cardTheme: 'AUTO',
      sortOrder: 100,
      categoryIds: ['cat_honey-types'],
      benefits: [],
      options: [],
    });

    const oldSlug = temp.slug;
    const newSlug = 'thyme-honey-new-slug';

    await ProductService.updateProduct(temp.id, { slug: newSlug });

    // Verify 301 redirect entry exists
    const redirect = await db.slugRedirect.findUnique({
      where: { entityType_oldSlug: { entityType: 'PRODUCT', oldSlug } },
    });

    expect(redirect).toBeDefined();
    expect(redirect?.targetId).toBe(temp.id);

    // Verify public query follows the redirect
    const queryRes = await getPublishedProductBySlug(oldSlug);
    expect(queryRes.redirect).toBeDefined();
    expect(queryRes.redirect?.destination).toBe(`/products/${newSlug}`);

    // Cleanup
    await ProductService.deleteProduct(temp.id);
  });

  it('throws ConcurrencyConflictError when item was modified since opened', async () => {
    const products = await db.product.findMany();
    const prod = products[0];

    const staleTimestamp = new Date(Date.now() - 60000); // 1 minute stale

    await expect(
      ProductService.updateProduct(prod.id, { nameFa: prod.nameFa }, staleTimestamp)
    ).rejects.toThrow(ConcurrencyConflictError);
  });
});

describe('Public Queries & Available Options Filter (Constraints)', () => {
  it('returns only PUBLISHED items in public queries, excluding DRAFT and ARCHIVED', async () => {
    const publishedProducts = await getPublishedProducts();
    for (const p of publishedProducts) {
      expect(p.status).toBe('PUBLISHED');
    }

    const publishedRecipes = await getPublishedRecipes();
    for (const r of publishedRecipes) {
      expect(r.status).toBe('PUBLISHED');
    }
  });

  it('returns only AVAILABLE options when queried for customer cart ordering', async () => {
    const temp = await ProductService.createProduct({
      nameFa: 'عسل کنار با دو گزینه',
      slug: 'konar-with-options',
      status: 'PUBLISHED',
      isAvailable: true,
      isFeatured: false,
      cardTheme: 'AUTO',
      sortOrder: 101,
      categoryIds: ['cat_honey-types'],
      benefits: [],
      options: [
        { label: 'شیشه ۵۰۰ گرمی', isAvailable: true, sortOrder: 0 },
        { label: 'شیشه ۹۰۰ گرمی (ناموجود)', isAvailable: false, sortOrder: 1 },
      ],
    });

    const res = await getPublishedProductBySlug(temp.slug);
    expect(res.product).toBeDefined();
    expect(res.product?.options.length).toBe(1);
    expect(res.product?.options[0].label).toBe('شیشه ۵۰۰ گرمی');

    await ProductService.deleteProduct(temp.id);
  });
});
