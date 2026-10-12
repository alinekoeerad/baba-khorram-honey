/**
 * Global Search Results Page (Phase 10 Task 2)
 * URL: /search?q=
 *
 * Requirements:
 * - Server-rendered initial results for both products and recipes.
 * - Grouped sections with independent Load More cursor pagination.
 * - noindex, nofollow, noarchive metadata.
 * - Wooden background (WoodBackground).
 */

import React from 'react';
import type { Metadata } from 'next';
import { WoodBackground } from '@/components/ui/wood-background';
import { Container } from '@/components/ui/container';
import { searchGlobal } from '@/server/queries/search';
import { SearchResultsClient } from '@/components/public/search-results-client';

export const dynamic = 'force-dynamic';

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const title = q ? `نتایج جستجو برای «${q}» | عسل باباخُرم` : 'جستجوی محصولات و دستورها | عسل باباخُرم';

  return {
    title,
    robots: {
      index: false,
      follow: false,
      nocache: true,
    },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = '' } = await searchParams;

  const results = await searchGlobal({ q, take: 20 });

  return (
    <WoodBackground className="py-12 sm:py-20 min-h-screen">
      <Container>
        {/* Page Title */}
        <div className="text-center space-y-3 mb-10 sm:mb-14">
          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
            {q ? `نتایج جستجو برای: «${q}»` : 'جستجوی محصولات و دستورها'}
          </h1>
          <p className="text-sm sm:text-base text-[#E8E2D9] max-w-xl mx-auto">
            یافتن انواع عسل طبیعی کوهستان ارسباران و دسرهای سلامت‌محور
          </p>
        </div>

        {/* Client Results with Filter and Load More */}
        <SearchResultsClient
          initialQuery={q}
          initialProducts={results.products}
          initialRecipes={results.recipes}
          totalProducts={results.totalProducts}
          totalRecipes={results.totalRecipes}
        />
      </Container>
    </WoodBackground>
  );
}
