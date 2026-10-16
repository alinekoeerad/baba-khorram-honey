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
import { uiStringsFa } from '@/content/ui-strings.fa';

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
  const queryParams = new URLSearchParams();
  if (category) queryParams.set('category', category);
  if (serving === 'hot') queryParams.set('serving', 'hot');
  const queryString = queryParams.toString();
  const canonicalUrl = `${siteUrl}/recipes${queryString ? `?${queryString}` : ''}`;

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
    <WoodBackground className="py-12 sm:py-20 min-h-screen text-[#3F2A1D]">
      <Container>
        {/* Centered Page Header with Warm Contrast & Artisanal Ornament */}
        <header className="text-center max-w-3xl mx-auto mb-10 sm:mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FAF5EB] border border-[#D9A441]/40 text-[#C58A2A] text-xs font-black shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D9A441] animate-pulse" aria-hidden="true" />
            <span>دستورهای اختصاصی و سنتی عسل</span>
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
            {uiStringsFa.listing.recipesSubtitle}
          </p>
        </header>

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
