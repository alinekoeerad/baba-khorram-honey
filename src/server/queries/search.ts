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
import { normalizeSearchText, toPersianDigits } from '@/lib/domain-utils';
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

  const buildTermCondition = (term: string) => {
    const persianTerm = toPersianDigits(term);
    const orList: any[] = [
      { searchText: { contains: term } },
      { nameFa: { contains: queryText } },
      { nameFa: { contains: term } },
      { nameOriginal: { contains: queryText, mode: 'insensitive' } },
      { nameOriginal: { contains: term, mode: 'insensitive' } },
    ];
    if (persianTerm !== term) {
      orList.push({ nameFa: { contains: persianTerm } });
      orList.push({ searchText: { contains: persianTerm } });
    }
    return { OR: orList };
  };

  const productWhere: any = {
    status: 'PUBLISHED',
    AND: terms.map(buildTermCondition),
  };

  const recipeWhere: any = {
    status: 'PUBLISHED',
    AND: terms.map(buildTermCondition),
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
    const resolvedImageUrl =
      (p as any).imageUrl ||
      (p.mainImage?.url ? p.mainImage.url : null) ||
      (p.mainImage?.storageKey
        ? (p.mainImage.storageKey.startsWith('/')
            ? p.mainImage.storageKey
            : `/uploads/${p.mainImage.storageKey}`)
        : null) ||
      (p.slug ? `/images/products/${p.slug}.webp` : null) ||
      (p.slug ? `/images/products/${p.slug}.jpg` : null) ||
      null;

    const imageAsset = p.mainImage
      ? {
          id: p.mainImage.id,
          storageKey: p.mainImage.storageKey,
          url:
            p.mainImage.url ||
            (p.mainImage.storageKey
              ? (p.mainImage.storageKey.startsWith('/')
                  ? p.mainImage.storageKey
                  : `/uploads/${p.mainImage.storageKey}`)
              : resolvedImageUrl || undefined),
          width: p.mainImage.width ?? 800,
          height: p.mainImage.height ?? 600,
          blurDataUrl: p.mainImage.blurDataUrl ?? null,
          variants: p.mainImage.variants ?? null,
          alt: p.mainImage.alt ?? p.nameFa,
        }
      : resolvedImageUrl
      ? {
          url: resolvedImageUrl,
          width: 800,
          height: 600,
          blurDataUrl: null,
          alt: p.nameFa,
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
      imageUrl: resolvedImageUrl,
      imageAlt: p.nameFa,
      linkLabel: 'مشاهده محصول',
      categories: p.categories.map((c: any) => c.category),
      options: p.options,
    };
  });

  const recipes: RecipeCardViewModel[] = recipesRaw.map((r: any) => {
    const isDessert =
      (r.categories && (
        r.categories.includes('desserts') ||
        r.categories.includes('cat_desserts') ||
        r.categories.some?.((c: any) => (c.category?.slug || c.slug || c) === 'desserts' || (c.category?.slug || c.slug || c) === 'dessert')
      )) ||
      (r.categoryIds && r.categoryIds.includes('cat_desserts'));

    const slugFallback = r.slug ? (isDessert ? `/uploads/recipes/dessert-${r.slug}.webp` : `/uploads/recipes/drink-${r.slug}.webp`) : null;

    const resolvedImageUrl =
      (r as any).imageUrl ||
      (typeof (r as any).mainImage === 'string' ? (r as any).mainImage : null) ||
      (typeof (r as any).image === 'string' ? (r as any).image : null) ||
      (r.mainImage?.url ? r.mainImage.url : null) ||
      (r.mainImage?.storageKey
        ? (r.mainImage.storageKey.startsWith('/')
            ? r.mainImage.storageKey
            : `/uploads/${r.mainImage.storageKey}`)
        : null) ||
      slugFallback ||
      null;

    const imageAsset = r.mainImage && typeof r.mainImage === 'object'
      ? {
          id: r.mainImage.id,
          storageKey: r.mainImage.storageKey,
          url:
            r.mainImage.url ||
            (r.mainImage.storageKey
              ? (r.mainImage.storageKey.startsWith('/')
                  ? r.mainImage.storageKey
                  : `/uploads/${r.mainImage.storageKey}`)
              : resolvedImageUrl || undefined),
          width: r.mainImage.width ?? 800,
          height: r.mainImage.height ?? 600,
          blurDataUrl: r.mainImage.blurDataUrl ?? null,
          variants: r.mainImage.variants ?? null,
          alt: r.mainImage.alt ?? r.nameFa,
        }
      : resolvedImageUrl
      ? {
          url: resolvedImageUrl,
          width: 800,
          height: 600,
          blurDataUrl: null,
          alt: r.nameFa,
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
      imageUrl: resolvedImageUrl,
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
