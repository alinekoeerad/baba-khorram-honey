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
    id?: string;
    storageKey?: string;
    url?: string;
    width: number;
    height: number;
    blurDataUrl?: string | null;
    variants?: any;
    alt?: string | null;
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
  focalPoint?: string;
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
    const isDessert =
      (r.categories && (
        r.categories.includes('desserts') ||
        r.categories.includes('cat_desserts') ||
        r.categories.some?.((c: any) => (c.category?.slug || c.slug || c) === 'desserts' || (c.category?.slug || c.slug || c) === 'dessert')
      )) ||
      (r.categoryIds && r.categoryIds.includes('cat_desserts'));

    const slugFallback = r.slug ? (isDessert ? `/uploads/recipes/dessert-${r.slug}.webp` : `/uploads/recipes/drink-${r.slug}.webp`) : null;

    const mainImageUrl =
      (r.mainImage?.url ? r.mainImage.url : null) ||
      (r.mainImage?.storageKey
        ? (r.mainImage.storageKey.startsWith('/')
            ? r.mainImage.storageKey
            : `/uploads/${r.mainImage.storageKey}`)
        : null);

    const resolvedImageUrl =
      mainImageUrl ||
      (r as any).imageUrl ||
      (typeof (r as any).mainImage === 'string' ? (r as any).mainImage : null) ||
      (typeof (r as any).image === 'string' ? (r as any).image : null) ||
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

    const firstGallery = (r.gallery && r.gallery.length > 0) ? (r.gallery[0]?.asset || r.gallery[0]) : null;
    const secondaryImageAsset = firstGallery && firstGallery.id
      ? {
          id: firstGallery.id,
          storageKey: firstGallery.storageKey,
          url: firstGallery.url || (firstGallery.storageKey ? (firstGallery.storageKey.startsWith('/') ? firstGallery.storageKey : `/uploads/${firstGallery.storageKey}`) : undefined),
          width: firstGallery.width ?? 800,
          height: firstGallery.height ?? 600,
          blurDataUrl: firstGallery.blurDataUrl ?? null,
        }
      : null;
    const secondaryImageUrl = firstGallery
      ? (firstGallery.url || (firstGallery.storageKey ? (firstGallery.storageKey.startsWith('/') ? firstGallery.storageKey : `/uploads/${firstGallery.storageKey}`) : null))
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
      imageUrl: resolvedImageUrl,
      secondaryImageAsset,
      secondaryImageUrl,
      imageAlt: r.nameFa,
      linkLabel: 'مشاهده دستور',
      categories: r.categories.map((c: any) => c.category),
      focalPoint: r.focalPoint ?? 'center',
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
    const isDessert =
      (recipe.categories && (
        recipe.categories.includes('desserts') ||
        recipe.categories.includes('cat_desserts') ||
        recipe.categories.some?.((c: any) => (c.category?.slug || c.slug || c) === 'desserts' || (c.category?.slug || c.slug || c) === 'dessert')
      )) ||
      (recipe.categoryIds && recipe.categoryIds.includes('cat_desserts'));

    const slugFallback = recipe.slug ? (isDessert ? `/uploads/recipes/dessert-${recipe.slug}.webp` : `/uploads/recipes/drink-${recipe.slug}.webp`) : null;

    const resolvedRecipeImageUrl =
      (recipe as any).imageUrl ||
      (typeof (recipe as any).mainImage === 'string' ? (recipe as any).mainImage : null) ||
      (typeof (recipe as any).image === 'string' ? (recipe as any).image : null) ||
      (recipe.mainImage?.url ? recipe.mainImage.url : null) ||
      (recipe.mainImage?.storageKey
        ? (recipe.mainImage.storageKey.startsWith('/')
            ? recipe.mainImage.storageKey
            : `/uploads/${recipe.mainImage.storageKey}`)
        : null) ||
      slugFallback ||
      null;

    if (!recipe.mainImage && resolvedRecipeImageUrl) {
      (recipe as any).mainImage = {
        url: resolvedRecipeImageUrl,
        width: 800,
        height: 600,
        blurDataUrl: null,
        alt: recipe.nameFa,
      };
    }
    (recipe as any).imageUrl = resolvedRecipeImageUrl;

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

      relatedRecipes = rawRelated.map((r: any) => {
        const isRelDessert =
          (r.categories && (
            r.categories.includes('desserts') ||
            r.categories.includes('cat_desserts') ||
            r.categories.some?.((c: any) => (c.category?.slug || c.slug || c) === 'desserts' || (c.category?.slug || c.slug || c) === 'dessert')
          )) ||
          (r.categoryIds && r.categoryIds.includes('cat_desserts'));

        const relSlugFallback = r.slug ? (isRelDessert ? `/uploads/recipes/dessert-${r.slug}.webp` : `/uploads/recipes/drink-${r.slug}.webp`) : null;

        const relMainImageUrl =
          (r.mainImage?.url ? r.mainImage.url : null) ||
          (r.mainImage?.storageKey
            ? (r.mainImage.storageKey.startsWith('/')
                ? r.mainImage.storageKey
                : `/uploads/${r.mainImage.storageKey}`)
            : null);

        const resolvedRelUrl =
          relMainImageUrl ||
          (r as any).imageUrl ||
          (typeof (r as any).mainImage === 'string' ? (r as any).mainImage : null) ||
          (typeof (r as any).image === 'string' ? (r as any).image : null) ||
          relSlugFallback ||
          null;

        const relImageAsset = r.mainImage && typeof r.mainImage === 'object'
          ? {
              id: r.mainImage.id,
              storageKey: r.mainImage.storageKey,
              url:
                r.mainImage.url ||
                (r.mainImage.storageKey
                  ? (r.mainImage.storageKey.startsWith('/')
                      ? r.mainImage.storageKey
                      : `/uploads/${r.mainImage.storageKey}`)
                  : resolvedRelUrl || undefined),
              width: r.mainImage.width ?? 800,
              height: r.mainImage.height ?? 600,
              blurDataUrl: r.mainImage.blurDataUrl ?? null,
              variants: r.mainImage.variants ?? null,
              alt: r.mainImage.alt ?? r.nameFa,
            }
          : resolvedRelUrl
          ? {
              url: resolvedRelUrl,
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
          servingTypes: r.servingTypes as ServingTypeValue[],
          yieldText: r.yieldText,
          isFeatured: r.isFeatured,
          cardTheme: r.cardTheme,
          theme: r.cardTheme,
          sortOrder: r.sortOrder,
          shortDescription: r.shortDescription,
          longDescription: r.longDescription,
          href: `/recipes/${r.slug}`,
          imageAsset: relImageAsset,
          imageUrl: resolvedRelUrl,
          imageAlt: r.nameFa,
          linkLabel: 'مشاهده دستور',
          categories: r.categories.map((c: any) => c.category),
          focalPoint: r.focalPoint ?? 'center',
        };
      });
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
