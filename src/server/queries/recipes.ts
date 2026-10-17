/**
 * Public Recipe Queries (Phase 8)
 *
 * Requirements:
 * - Strictly filters out DRAFT and ARCHIVED items (status: PUBLISHED).
 * - Stable order by [sortOrder ASC, id ASC].
 * - Serving filter toggle semantics:
 *     - "cold" / "COLD" matches {COLD, WARM}
 *     - "hot" / "HOT" matches {HOT, WARM}
 *     - WARM recipes appear under both toggles
 * - Cursor pagination with rate-limiting support (returns card view-models & nextCursor).
 * - Scoped search with Phase 1 normalizeSearchText (partial words supported).
 * - Category filtering via category slug.
 * - Single-query fetching with mainImage, categories, ingredients, steps, gallery to prevent N+1 queries.
 * - getPublicRecipeBySlug includes related items (up to 4 sharing category) and 301 SlugRedirect support.
 */

import { db } from '@/server/db/client';
import { normalizeSearchText, toPersianDigits, CardTheme, ServingTypeValue } from '@/lib/domain-utils';

export interface RecipeCursor {
  sortOrder: number;
  id: string;
}

export interface PublicRecipeFilters {
  categorySlug?: string;
  serving?: 'cold' | 'hot' | string;
  servingType?: 'HOT' | 'COLD' | 'WARM';
  search?: string;
  q?: string; // alias
  skip?: number;
  take?: number;
  cursor?: RecipeCursor | null;
}

export interface RecipeCardViewModel {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  nameFa: string;
  nameOriginal: string | null;
  status: string;
  country: string | null;
  servingTypes: ServingTypeValue[];
  yieldText: string | null;
  isFeatured: boolean;
  cardTheme: CardTheme | 'AUTO';
  theme: CardTheme | 'AUTO';
  sortOrder: number;
  shortDescription: string | null;
  longDescription: string | null;
  href: string;
  imageAsset: {
    id: string;
    width: number;
    height: number;
    blurDataUrl?: string | null;
  } | null;
  imageUrl: string | null;
  secondaryImageAsset?: {
    id: string;
    width: number;
    height: number;
    blurDataUrl?: string | null;
  } | null;
  secondaryImageUrl?: string | null;
  imageAlt: string;
  linkLabel: string;
  categories: any[];
}

export async function getPublicRecipes(filters: PublicRecipeFilters = {}) {
  const where: any = {
    status: 'PUBLISHED',
  };

  // Category filter
  if (filters.categorySlug && filters.categorySlug !== 'all' && filters.categorySlug !== 'همه') {
    where.categories = {
      some: {
        category: {
          slug: filters.categorySlug,
          status: 'ACTIVE',
        },
      },
    };
  }

  // Serving toggle filter semantics (Brief Section 8 & 9)
  // "cold" matches {COLD, WARM}; "hot" matches {HOT, WARM}. WARM recipes appear under both.
  const servingParam = (filters.serving || filters.servingType || '').toLowerCase();
  if (servingParam === 'cold') {
    where.servingTypes = { hasSome: ['COLD', 'WARM'] };
  } else if (servingParam === 'hot') {
    where.servingTypes = { hasSome: ['HOT', 'WARM'] };
  } else if (filters.servingType) {
    if (filters.servingType === 'COLD') {
      where.servingTypes = { hasSome: ['COLD', 'WARM'] };
    } else if (filters.servingType === 'HOT') {
      where.servingTypes = { hasSome: ['HOT', 'WARM'] };
    } else {
      where.servingTypes = { hasSome: [filters.servingType] };
    }
  }

  // Scoped search query with normalization
  const queryText = (filters.q ?? filters.search ?? '').trim();
  if (queryText) {
    const normalized = normalizeSearchText(queryText);
    const words = normalized.split(' ').filter(Boolean);
    if (words.length > 0) {
      where.AND = words.map((word) => {
        const persianWord = toPersianDigits(word);
        const orList: any[] = [
          { searchText: { contains: word } },
          { nameFa: { contains: queryText } },
          { nameFa: { contains: word } },
          { nameOriginal: { contains: queryText, mode: 'insensitive' } },
        ];
        if (persianWord !== word) {
          orList.push({ nameFa: { contains: persianWord } });
          orList.push({ searchText: { contains: persianWord } });
        }
        return { OR: orList };
      });
    }
  }

  // Cursor condition for stable pagination [sortOrder ASC, id ASC]
  if (filters.cursor) {
    where.OR = [
      { sortOrder: { gt: filters.cursor.sortOrder } },
      {
        sortOrder: filters.cursor.sortOrder,
        id: { gt: filters.cursor.id },
      },
    ];
  }

  const takeLimit = filters.take ?? 20;

  // Fetch takeLimit + 1 items to determine hasMore and nextCursor
  const rawItems = await db.recipe.findMany({
    where,
    orderBy: [
      { sortOrder: 'asc' },
      { id: 'asc' },
    ],
    skip: filters.skip,
    take: takeLimit + 1,
    include: {
      categories: {
        include: {
          category: true,
        },
      },
      mainImage: true,
      gallery: {
        orderBy: { sortOrder: 'asc' },
        include: { asset: true },
      },
    },
  });

  const hasMore = rawItems.length > takeLimit;
  const items = hasMore ? rawItems.slice(0, takeLimit) : rawItems;

  const cardItems: RecipeCardViewModel[] = items.map((r: any) => {
    const imageAsset = r.mainImage
      ? {
          id: r.mainImage.id,
          width: r.mainImage.width ?? 800,
          height: r.mainImage.height ?? 600,
          blurDataUrl: r.mainImage.blurDataUrl ?? null,
        }
      : null;

    const firstGallery = (r.gallery && r.gallery.length > 0) ? (r.gallery[0]?.asset || r.gallery[0]) : null;
    const secondaryImageAsset = firstGallery && firstGallery.id
      ? {
          id: firstGallery.id,
          width: firstGallery.width ?? 800,
          height: firstGallery.height ?? 600,
          blurDataUrl: firstGallery.blurDataUrl ?? null,
        }
      : null;
    const secondaryImageUrl = firstGallery
      ? (firstGallery.url || (firstGallery.storageKey ? `/uploads/${firstGallery.storageKey}` : null))
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
      servingTypes: r.servingTypes as ServingTypeValue[],
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
      secondaryImageAsset,
      secondaryImageUrl,
      imageAlt: r.nameFa,
      linkLabel: 'مشاهده دستور',
      categories: r.categories.map((c: any) => c.category),
    };
  });

  const nextCursor: RecipeCursor | null =
    hasMore && cardItems.length > 0
      ? {
          sortOrder: cardItems[cardItems.length - 1].sortOrder,
          id: cardItems[cardItems.length - 1].id,
        }
      : null;

  // Count total for listing summary
  const countWhere = { ...where };
  delete countWhere.OR;
  const total = await db.recipe.count({ where: countWhere });

  // Dual return: works as array directly and has named properties
  const result = Object.assign([...cardItems], {
    items: cardItems,
    recipes: cardItems,
    nextCursor,
    total,
    hasMore,
  });

  return result;
}

// Backwards compatibility alias
export async function getPublishedRecipes(filters: PublicRecipeFilters = {}) {
  const result = await getPublicRecipes(filters);
  return result.recipes;
}

export async function getPublicRecipeBySlug(slug: string) {
  // 1. Direct query
  const recipe = await db.recipe.findUnique({
    where: { slug },
    include: {
      categories: {
        include: { category: true },
      },
      mainImage: true,
      ingredients: {
        orderBy: { sortOrder: 'asc' },
      },
      steps: {
        orderBy: { sortOrder: 'asc' },
      },
      gallery: {
        orderBy: { sortOrder: 'asc' },
        include: { asset: true },
      },
    },
  });

  if (recipe && recipe.status === 'PUBLISHED') {
    // 2. Fetch related items (up to 4 published items sharing a category, hidden if none)
    const categoryIds = recipe.categories.map((c: any) => c.categoryId);
    let relatedRecipes: RecipeCardViewModel[] = [];

    if (categoryIds.length > 0) {
      const rawRelated = await db.recipe.findMany({
        where: {
          status: 'PUBLISHED',
          id: { not: recipe.id },
          categories: {
            some: {
              categoryId: { in: categoryIds },
            },
          },
        },
        take: 4,
        orderBy: [
          { sortOrder: 'asc' },
          { id: 'asc' },
        ],
        include: {
          categories: { include: { category: true } },
          mainImage: true,
        },
      });

      relatedRecipes = rawRelated.map((r: any) => ({
        id: r.id,
        slug: r.slug,
        title: r.nameFa,
        subtitle: r.nameOriginal ?? null,
        nameFa: r.nameFa,
        nameOriginal: r.nameOriginal,
        status: r.status,
        country: r.country,
        servingTypes: r.servingTypes as ServingTypeValue[],
        yieldText: r.yieldText,
        isFeatured: r.isFeatured,
        cardTheme: r.cardTheme,
        theme: r.cardTheme,
        sortOrder: r.sortOrder,
        shortDescription: r.shortDescription,
        longDescription: r.longDescription,
        href: `/recipes/${r.slug}`,
        imageAsset: r.mainImage
          ? {
              id: r.mainImage.id,
              width: r.mainImage.width ?? 800,
              height: r.mainImage.height ?? 600,
              blurDataUrl: r.mainImage.blurDataUrl ?? null,
            }
          : null,
        imageUrl: null,
        imageAlt: r.nameFa,
        linkLabel: 'مشاهده دستور',
        categories: r.categories.map((c: any) => c.category),
      }));
    }

    return {
      recipe,
      relatedRecipes,
      redirect: null,
    };
  }

  // 3. Check SlugRedirect for 301 permanent redirect
  const redirect = await db.slugRedirect.findUnique({
    where: {
      entityType_oldSlug: {
        entityType: 'RECIPE',
        oldSlug: slug,
      },
    },
  });

  if (redirect) {
    const targetRecipe = await db.recipe.findUnique({
      where: { id: redirect.targetId },
      select: { slug: true, status: true },
    });

    if (targetRecipe && targetRecipe.status === 'PUBLISHED') {
      return {
        recipe: null,
        relatedRecipes: [],
        redirect: {
          destination: `/recipes/${targetRecipe.slug}`,
          permanent: true,
        },
      };
    }
  }

  return { recipe: null, relatedRecipes: [], redirect: null };
}

// Backwards compatibility alias
export const getPublishedRecipeBySlug = getPublicRecipeBySlug;
