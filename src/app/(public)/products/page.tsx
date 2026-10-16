/**
 * Products Listing Page (Phase 8 Task 1)
 * URL: /products
 *
 * Requirements:
 * - Whole-page wooden background (WoodBackground)
 * - Centered title (category name when filtered, otherwise default title)
 * - Scoped search box, category chips ("همه" + active categories)
 * - Server-rendered initial 20 items based on URL search params (?category, ?q)
 * - Desktop: 3-column card grid; Mobile: 1-per-row horizontal cards
 * - "نمایش بیشتر" (Load more) cursor pagination without full page reload
 * - generateMetadata with canonical URL and OpenGraph
 */

import React from 'react';
import type { Metadata } from 'next';
import { WoodBackground } from '@/components/ui/wood-background';
import { Container } from '@/components/ui/container';
import { getPublicProducts } from '@/server/queries/products';
import { getPublicCategories } from '@/server/queries/categories';
import { ProductsListingClient } from '@/components/public/products-listing-client';
import { uiStringsFa } from '@/content/ui-strings.fa';

export const revalidate = 3600;

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string;
    q?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: ProductsPageProps): Promise<Metadata> {
  const { category, q } = await searchParams;
  const categories = await getPublicCategories('PRODUCT');
  const activeCategory = categories.find((c: any) => c.slug === category);

  let title = 'محصولات عسل باباخُرم';
  if (activeCategory) {
    title = `${activeCategory.name} | عسل باباخُرم`;
  } else if (q) {
    title = `جستجو: ${q} | محصولات باباخُرم`;
  }

  const description =
    'خرید مستقیم انواع عسل طبیعی و خالص باباخُرم از مراتع ارسباران با برگه آزمایش ساکارز';

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://babakhorram.com';
  const canonicalUrl = `${siteUrl}/products${category ? `?category=${category}` : ''}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      locale: 'fa_IR',
      siteName: 'عسل باباخُرم',
    },
    ...(q
      ? {
          robots: {
            index: false,
            follow: true,
          },
        }
      : {}),
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { category, q } = await searchParams;

  // 1. Fetch categories for chips
  const categories = await getPublicCategories('PRODUCT');
  const activeCategory = categories.find((c: any) => c.slug === category);

  // 2. Fetch first 20 products matching filters
  const result = await getPublicProducts({
    categorySlug: category,
    q,
    take: 20,
  });
  const productsList = result.items || (Array.isArray(result) ? result : []);

  const pageTitle = activeCategory ? activeCategory.name : 'محصولات باباخُرم';

  return (
    <WoodBackground className="py-12 sm:py-20 min-h-screen text-[#3F2A1D]">
      <Container>
        {/* Centered Page Header with Warm Contrast & Artisanal Ornament */}
        <header className="text-center max-w-3xl mx-auto mb-10 sm:mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FAF5EB] border border-[#D9A441]/40 text-[#C58A2A] text-xs font-black shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D9A441] animate-pulse" aria-hidden="true" />
            <span>عسل خالص و طبیعی ارسباران</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#3F2A1D] tracking-tight leading-tight">
            {pageTitle}
          </h1>

          {/* Honeycomb / Diamond Accent Divider */}
          <div className="flex items-center justify-center gap-2 pt-1 pb-1" aria-hidden="true">
            <span className="h-0.5 w-10 sm:w-16 bg-gradient-to-l from-[#D9A441] to-transparent" />
            <span className="w-2 h-2 rotate-45 bg-[#D9A441]" />
            <span className="h-0.5 w-10 sm:w-16 bg-gradient-to-r from-[#D9A441] to-transparent" />
          </div>

          <p className="text-sm sm:text-base lg:text-lg text-[#5C3A21] font-semibold max-w-2xl mx-auto leading-relaxed pt-1">
            {uiStringsFa.listing.productsSubtitle}
          </p>
        </header>

        {/* Interactive Listing Client */}
        <ProductsListingClient
          initialItems={productsList}
          initialCursor={result.nextCursor}
          initialHasMore={result.hasMore}
          totalCount={result.total}
          categories={categories}
          selectedCategorySlug={category}
          initialQuery={q}
        />
      </Container>
    </WoodBackground>
  );
}
