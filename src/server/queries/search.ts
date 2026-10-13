/**
 * Global Search Query (Phase 10 Task 1)
 *
 * Rules:
 * - Uses shared normalizer (normalizeSearchText) and indexes (searchText).
 * - Minimum 2 characters.
 * - Grouped results for Products and Recipes.
 * - Single-query execution with includes to prevent N+1 queries.
 */

import { db } from '@/server/db/client';
import { normalizeSearchText } from '@/lib/domain-utils';
import type { ProductCardViewModel } from '@/server/queries/products';
import type { RecipeCardViewModel } from '@/server/queries/recipes';

export interface GlobalSearchParams {
  q: string;
  take?: number;
}

export interface GlobalSearchResult {
  products: ProductCardViewModel[];
  recipes: RecipeCardViewModel[];
  totalProducts: number;
  totalRecipes: number;
}

export async function searchGlobal({
  q,
  take = 8,
}: GlobalSearchParams): Promise<GlobalSearchResult> {
  const queryText = (q || '').trim();

  // Enforce minimum 2 characters rule
  if (queryText.length < 2) {
    return {
      products: [],
      recipes: [],
      totalProducts: 0,
      totalRecipes: 0,
    };
  }

  const normalized = normalizeSearchText(queryText);
  const terms = normalized.split(' ').filter(Boolean);

  if (terms.length === 0) {
    return {
      products: [],
      recipes: [],
      totalProducts: 0,
      totalRecipes: 0,
    };
  }

  const productWhere: any = {
    status: 'PUBLISHED',
    AND: terms.map((term) => ({
      OR: [
        { searchText: { contains: term } },
        { nameFa: { contains: queryText } },
        { nameOriginal: { contains: queryText, mode: 'insensitive' } },
      ],
    })),
  };

  const recipeWhere: any = {
    status: 'PUBLISHED',
    AND: terms.map((term) => ({
      OR: [
        { searchText: { contains: term } },
        { nameFa: { contains: queryText } },
        { nameOriginal: { contains: queryText, mode: 'insensitive' } },
      ],
    })),
  };

  // Run searches in parallel
  const [productsRaw, totalProducts, recipesRaw, totalRecipes] = await Promise.all([
    db.product.findMany({
      where: productWhere,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      take,
      include: {
        categories: { include: { category: true } },
        mainImage: true,
        options: {
          where: { isAvailable: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    }),
    db.product.count({ where: productWhere }),
    db.recipe.findMany({
      where: recipeWhere,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      take,
      include: {
        categories: { include: { category: true } },
        mainImage: true,
      },
    }),
    db.recipe.count({ where: recipeWhere }),
  ]);

  const products: ProductCardViewModel[] = productsRaw.map((p: any) => {
    const imageAsset = p.mainImage
      ? {
          id: p.mainImage.id,
          width: p.mainImage.width ?? 800,
          height: p.mainImage.height ?? 600,
          blurDataUrl: p.mainImage.blurDataUrl ?? null,
        }
      : null;

    return {
      id: p.id,
      slug: p.slug,
      title: p.nameFa,
      subtitle: p.nameOriginal ?? null,
      nameFa: p.nameFa,
      nameOriginal: p.nameOriginal,
      status: p.status,
      isAvailable: p.isAvailable,
      isFeatured: p.isFeatured,
      cardTheme: p.cardTheme,
      theme: p.cardTheme,
      sortOrder: p.sortOrder,
      shortDescription: p.shortDescription,
      description: p.description,
      foodNature: p.foodNature,
      vitamins: p.vitamins,
      harvestSeason: p.harvestSeason,
      harvestPlace: p.harvestPlace,
      color: p.color,
      usageWarning: p.usageWarning,
      href: `/products/${p.slug}`,
      imageAsset,
      imageUrl: (p as any).imageUrl || (p.slug ? `/images/products/${p.slug}.jpg` : null),
      imageAlt: p.nameFa,
      linkLabel: 'مشاهده محصول',
      categories: p.categories.map((c: any) => c.category),
      options: p.options,
    };
  });

  const recipes: RecipeCardViewModel[] = recipesRaw.map((r: any) => {
    const imageAsset = r.mainImage
      ? {
          id: r.mainImage.id,
          width: r.mainImage.width ?? 800,
          height: r.mainImage.height ?? 600,
          blurDataUrl: r.mainImage.blurDataUrl ?? null,
        }
      : null;

    return {
      id: r.id,
      slug: r.slug,
      title: r.nameFa,
      subtitle: r.nameOriginal ?? null,
      nameFa: r.nameFa,
      nameOriginal: r.nameOriginal,
      status: r.status,
      country: r.country,
      servingTypes: r.servingTypes as any,
      yieldText: r.yieldText,
      isFeatured: r.isFeatured,
      cardTheme: r.cardTheme,
      theme: r.cardTheme,
      sortOrder: r.sortOrder,
      shortDescription: r.shortDescription,
      longDescription: r.longDescription,
      href: `/recipes/${r.slug}`,
      imageAsset,
      imageUrl: null,
      imageAlt: r.nameFa,
      linkLabel: 'مشاهده دستور',
      categories: r.categories.map((c: any) => c.category),
    };
  });

  return {
    products,
    recipes,
    totalProducts,
    totalRecipes,
  };
}
