/**
 * Public Product Queries (Phase 8)
 *
 * Requirements:
 * - Strictly filters out DRAFT and ARCHIVED items (status: PUBLISHED).
 * - Stable order by [sortOrder ASC, id ASC].
 * - Cursor pagination with rate-limiting support (returns card view-models & nextCursor).
 * - Scoped search with Phase 1 normalizeSearchText (partial words supported).
 * - Category filtering via category slug.
 * - Single-query fetching with mainImage, categories, benefits, gallery to prevent N+1 queries.
 * - getPublicProductBySlug includes related items (up to 4 sharing category) and 301 SlugRedirect support.
 */

import { db } from '@/server/db/client';
import { normalizeSearchText, CardTheme } from '@/lib/domain-utils';

export interface ProductCursor {
  sortOrder: number;
  id: string;
}

export interface PublicProductFilters {
  categorySlug?: string;
  search?: string;
  q?: string; // alias
  skip?: number;
  take?: number;
  cursor?: ProductCursor | null;
}

export interface ProductCardViewModel {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  nameFa: string;
  nameOriginal: string | null;
  status: string;
  isAvailable: boolean;
  isFeatured: boolean;
  cardTheme: CardTheme | 'AUTO';
  theme: CardTheme | 'AUTO';
  sortOrder: number;
  shortDescription: string | null;
  description: string | null;
  foodNature: string | null;
  vitamins: string | null;
  harvestSeason: string | null;
  harvestPlace: string | null;
  color: string | null;
  usageWarning: string | null;
  href: string;
  imageAsset: {
    id: string;
    width: number;
    height: number;
    blurDataUrl?: string | null;
  } | null;
  imageUrl: string | null;
  imageAlt: string;
  linkLabel: string;
  categories: any[];
  options: any[];
}

export async function getPublicProducts(filters: PublicProductFilters = {}) {
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

  // Scoped search query with normalization
  const queryText = (filters.q ?? filters.search ?? '').trim();
  if (queryText) {
    const normalized = normalizeSearchText(queryText);
    const words = normalized.split(' ').filter(Boolean);
    if (words.length > 0) {
      where.AND = words.map((word) => ({
        OR: [
          { searchText: { contains: word } },
          { nameFa: { contains: queryText } },
          { nameOriginal: { contains: queryText, mode: 'insensitive' } },
        ],
      }));
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
  const rawItems = await db.product.findMany({
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
      options: {
        where: { isAvailable: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  const hasMore = rawItems.length > takeLimit;
  const items = hasMore ? rawItems.slice(0, takeLimit) : rawItems;

  const cardItems: ProductCardViewModel[] = items.map((p: any) => {
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
      imageUrl: null,
      imageAlt: p.nameFa,
      linkLabel: 'مشاهده محصول',
      categories: p.categories.map((c: any) => c.category),
      options: p.options,
    };
  });

  const nextCursor: ProductCursor | null =
    hasMore && cardItems.length > 0
      ? {
          sortOrder: cardItems[cardItems.length - 1].sortOrder,
          id: cardItems[cardItems.length - 1].id,
        }
      : null;

  // Count total for listing summary
  const countWhere = { ...where };
  delete countWhere.OR; // remove cursor constraint for total count
  const total = await db.product.count({ where: countWhere });

  // Dual return: works as array directly and has named properties
  const result = Object.assign([...cardItems], {
    items: cardItems,
    products: cardItems,
    nextCursor,
    total,
    hasMore,
  });

  return result;
}

// Backwards compatibility alias
export async function getPublishedProducts(filters: PublicProductFilters = {}) {
  const result = await getPublicProducts(filters);
  return result.products;
}

export async function getPublicProductBySlug(slug: string) {
  // 1. Direct query
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      categories: {
        include: { category: true },
      },
      mainImage: true,
      benefits: {
        orderBy: { sortOrder: 'asc' },
      },
      options: {
        where: { isAvailable: true },
        orderBy: { sortOrder: 'asc' },
      },
      gallery: {
        orderBy: { sortOrder: 'asc' },
        include: { asset: true },
      },
    },
  });

  if (product && product.status === 'PUBLISHED') {
    // 2. Fetch related items (up to 4 published items sharing a category, hidden if none)
    const categoryIds = product.categories.map((c: any) => c.categoryId);
    let relatedProducts: ProductCardViewModel[] = [];

    if (categoryIds.length > 0) {
      const rawRelated = await db.product.findMany({
        where: {
          status: 'PUBLISHED',
          id: { not: product.id },
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
          options: {
            where: { isAvailable: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });

      relatedProducts = rawRelated.map((p: any) => ({
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
        imageAsset: p.mainImage
          ? {
              id: p.mainImage.id,
              width: p.mainImage.width ?? 800,
              height: p.mainImage.height ?? 600,
              blurDataUrl: p.mainImage.blurDataUrl ?? null,
            }
          : null,
        imageUrl: null,
        imageAlt: p.nameFa,
        linkLabel: 'مشاهده محصول',
        categories: p.categories.map((c: any) => c.category),
        options: p.options,
      }));
    }

    return {
      product,
      relatedProducts,
      redirect: null,
    };
  }

  // 3. Check SlugRedirect for 301 permanent redirect
  const redirect = await db.slugRedirect.findUnique({
    where: {
      entityType_oldSlug: {
        entityType: 'PRODUCT',
        oldSlug: slug,
      },
    },
  });

  if (redirect) {
    const targetProduct = await db.product.findUnique({
      where: { id: redirect.targetId },
      select: { slug: true, status: true },
    });

    if (targetProduct && targetProduct.status === 'PUBLISHED') {
      return {
        product: null,
        relatedProducts: [],
        redirect: {
          destination: `/products/${targetProduct.slug}`,
          permanent: true,
        },
      };
    }
  }

  return { product: null, relatedProducts: [], redirect: null };
}

// Backwards compatibility alias
export const getPublishedProductBySlug = getPublicProductBySlug;
