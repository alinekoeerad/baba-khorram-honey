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
    <WoodBackground className="py-12 sm:py-20 min-h-screen">
      <Container>
        {/* Centered Page Header */}
        <div className="text-center space-y-4 mb-10 sm:mb-14">
          <h1 className="text-3xl sm:text-5xl font-black text-[#FFFBEB] leading-tight drop-shadow-md">
            {pageTitle}
          </h1>
          <p className="text-sm sm:text-base text-[#E5D5C5] font-medium max-w-xl mx-auto leading-relaxed">
            مجموعه کامل عسل‌های طبیعی و ارگانیک باباخُرم؛ برداشت‌شده با روش‌های اصیل زنبورداری کوهستان
          </p>
        </div>

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
