/**
 * Recipes Listing Page (Phase 8 Task 1)
 * URL: /recipes
 *
 * Requirements:
 * - Whole-page wooden background (WoodBackground)
 * - Centered title (category name when filtered, otherwise default title)
 * - Scoped search box, category chips ("همه" + active categories)
 * - سرد/گرم toggle (always exactly one selected, default سرد, selected is bolder)
 * - Centered divider line & label ("سرو سرد" / "سرو گرم")
 * - Server-rendered initial 20 items based on URL search params (?category, ?serving, ?q)
 * - Desktop: 3-column card grid; Mobile: 1-per-row horizontal cards
 * - "نمایش بیشتر" (Load more) cursor pagination without full page reload
 * - generateMetadata with canonical URL and OpenGraph
 */

import React from 'react';
import type { Metadata } from 'next';
import { WoodBackground } from '@/components/ui/wood-background';
import { Container } from '@/components/ui/container';
import { getPublicRecipes } from '@/server/queries/recipes';
import { getPublicCategories } from '@/server/queries/categories';
import { RecipesListingClient } from '@/components/public/recipes-listing-client';

export const revalidate = 3600;

interface RecipesPageProps {
  searchParams: Promise<{
    category?: string;
    serving?: 'cold' | 'hot';
    q?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: RecipesPageProps): Promise<Metadata> {
  const { category, serving, q } = await searchParams;
  const categories = await getPublicCategories('RECIPE');
  const activeCategory = categories.find((c: any) => c.slug === category);

  let title = 'دسرهای عسل باباخُرم';
  if (activeCategory) {
    title = `${activeCategory.name} | دسرهای عسل باباخُرم`;
  } else if (serving === 'hot') {
    title = 'دسرهای گرم با عسل | باباخُرم';
  } else if (serving === 'cold') {
    title = 'دسرهای سرد و خنک با عسل | باباخُرم';
  } else if (q) {
    title = `جستجو: ${q} | دسرهای عسل باباخُرم`;
  }

  const description =
    'طرز تهیه انواع نوشیدنی‌ها و دسرهای خوش‌طعم و مقوی سنتی و بین‌المللی با عسل طبیعی باباخُرم';

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://babakhorram.com';
  const canonicalUrl = `${siteUrl}/recipes${category ? `?category=${category}` : ''}`;

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

export default async function RecipesPage({ searchParams }: RecipesPageProps) {
  const { category, serving = 'cold', q } = await searchParams;

  // 1. Fetch categories for chips
  const categories = await getPublicCategories('RECIPE');
  const activeCategory = categories.find((c: any) => c.slug === category);

  // 2. Fetch first 20 recipes matching filters (default serving: cold)
  const result = await getPublicRecipes({
    categorySlug: category,
    serving,
    q,
    take: 20,
  });
  const recipesList = result.items || (Array.isArray(result) ? result : []);

  const pageTitle = activeCategory ? activeCategory.name : 'دسرهای عسل باباخُرم';

  return (
    <WoodBackground className="py-12 sm:py-20 min-h-screen">
      <Container>
        {/* Centered Page Header */}
        <div className="text-center space-y-4 mb-10 sm:mb-14">
          <h1 className="text-3xl sm:text-5xl font-black text-[#FFFBEB] leading-tight drop-shadow-md">
            {pageTitle}
          </h1>
          <p className="text-sm sm:text-base text-[#E5D5C5] font-medium max-w-xl mx-auto leading-relaxed">
            دستورهای اختصاصی و سنتی برای آماده‌سازی انواع نوشیدنی، معجون و دسرهای سالم با عسل طبیعی
          </p>
        </div>

        {/* Interactive Listing Client */}
        <RecipesListingClient
          initialItems={recipesList}
          initialCursor={result.nextCursor}
          initialHasMore={result.hasMore}
          totalCount={result.total}
          categories={categories}
          selectedCategorySlug={category}
          selectedServing={serving}
          initialQuery={q}
        />
      </Container>
    </WoodBackground>
  );
}
