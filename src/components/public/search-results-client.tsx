'use client';

/**
 * Search Results Client Component (Phase 10 Task 2)
 *
 * Implements:
 * - Search query refinement input.
 * - Grouped sections for Products and Recipes.
 * - Independent "نمایش بیشتر" (Load more) cursor pagination per group.
 * - 3-column desktop grid & 1-per-row horizontal mobile cards.
 * - Empty state with helpful suggestions.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { ContentCard } from '@/components/ui/content-card';
import { PillButton } from '@/components/ui/pill-button';
import { loadMoreProductsAction, loadMoreRecipesAction } from '@/server/actions/listing-actions';
import { toPersianDigits } from '@/lib/domain-utils';
import type { ProductCardViewModel, ProductCursor } from '@/server/queries/products';
import type { RecipeCardViewModel, RecipeCursor } from '@/server/queries/recipes';

export interface SearchResultsClientProps {
  initialQuery: string;
  initialProducts: ProductCardViewModel[];
  initialRecipes: RecipeCardViewModel[];
  totalProducts: number;
  totalRecipes: number;
}

export function SearchResultsClient({
  initialQuery,
  initialProducts,
  initialRecipes,
  totalProducts,
  totalRecipes,
}: SearchResultsClientProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(initialQuery);

  // Products group state
  const [products, setProducts] = useState<ProductCardViewModel[]>(initialProducts);
  const [productCursor, setProductCursor] = useState<ProductCursor | null>(
    initialProducts.length >= 20
      ? {
          sortOrder: initialProducts[initialProducts.length - 1].sortOrder,
          id: initialProducts[initialProducts.length - 1].id,
        }
      : null
  );
  const [hasMoreProducts, setHasMoreProducts] = useState(totalProducts > initialProducts.length);
  const [isLoadingMoreProducts, setIsLoadingMoreProducts] = useState(false);

  // Recipes group state
  const [recipes, setRecipes] = useState<RecipeCardViewModel[]>(initialRecipes);
  const [recipeCursor, setRecipeCursor] = useState<RecipeCursor | null>(
    initialRecipes.length >= 20
      ? {
          sortOrder: initialRecipes[initialRecipes.length - 1].sortOrder,
          id: initialRecipes[initialRecipes.length - 1].id,
        }
      : null
  );
  const [hasMoreRecipes, setHasMoreRecipes] = useState(totalRecipes > initialRecipes.length);
  const [isLoadingMoreRecipes, setIsLoadingMoreRecipes] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleLoadMoreProducts = async () => {
    if (!productCursor || isLoadingMoreProducts) return;
    setIsLoadingMoreProducts(true);

    try {
      const res = await loadMoreProductsAction({
        q: initialQuery,
        cursor: productCursor,
        take: 20,
      });

      if (res.success && res.items) {
        setProducts((prev) => [...prev, ...res.items!]);
        setProductCursor(res.nextCursor ?? null);
        setHasMoreProducts(Boolean(res.hasMore));
      }
    } finally {
      setIsLoadingMoreProducts(false);
    }
  };

  const handleLoadMoreRecipes = async () => {
    if (!recipeCursor || isLoadingMoreRecipes) return;
    setIsLoadingMoreRecipes(true);

    try {
      const res = await loadMoreRecipesAction({
        q: initialQuery,
        cursor: recipeCursor,
        take: 20,
      });

      if (res.success && res.items) {
        setRecipes((prev) => [...prev, ...res.items!]);
        setRecipeCursor(res.nextCursor ?? null);
        setHasMoreRecipes(Boolean(res.hasMore));
      }
    } finally {
      setIsLoadingMoreRecipes(false);
    }
  };

  const totalResults = totalProducts + totalRecipes;

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto">
        <div className="relative flex items-center">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="جستجوی مجدد در محصولات و دستورها..."
            className="w-full h-12 pr-12 pl-28 rounded-full bg-white/95 border border-[#EFE9E0] text-[#2B2017] placeholder-[#5C5248] text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#FBBF24] shadow-sm"
            dir="rtl"
          />
          <Search className="absolute right-4 top-3.5 w-5 h-5 text-[#B45309] pointer-events-none" />
          <button
            type="submit"
            className="absolute left-1.5 top-1.5 bottom-1.5 px-5 rounded-full bg-[#FBBF24] hover:bg-[#F59E0B] text-[#2B2017] font-black text-xs sm:text-sm transition-colors shadow"
          >
            جستجو
          </button>
        </div>
      </form>

      {/* Empty State */}
      {totalResults === 0 ? (
        <div className="text-center py-16 px-4 max-w-lg mx-auto bg-white border border-[#FDE68A] p-8 space-y-4 shadow-md">
          <p className="text-xl sm:text-2xl font-black text-[#2B2017]">
            موردی یافت نشد
          </p>
          <p className="text-sm text-[#5C5248] leading-relaxed">
            هیچ محصول یا دستوری مطابق با عبارت «{initialQuery}» یافت نشد. لطفاً عبارت دیگری را امتحان کرده یا املای آن را بررسی فرمایید.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <PillButton variant="gold" size="sm" href="/products">
              مشاهده محصولات
            </PillButton>
            <PillButton variant="green" size="sm" href="/recipes">
              مشاهده دستورها
            </PillButton>
          </div>
        </div>
      ) : (
        <div className="space-y-16">
          {/* 1. Group: Products */}
          {products.length > 0 && (
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-[#EFE9E0] pb-3">
                <h2 className="text-2xl sm:text-3xl font-black text-[#2B2017]">
                  محصولات مرتبط ({toPersianDigits(totalProducts)})
                </h2>
                <span className="text-xs text-[#5C5248] font-bold">
                  نمایش {toPersianDigits(products.length)} از {toPersianDigits(totalProducts)} مورد
                </span>
              </div>

              {/* Desktop & Tablet: Multi-column compact luxury grid */}
              <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
                {products.map((item) => (
                  <ContentCard
                    key={item.id}
                    title={item.title}
                    subtitle={item.subtitle}
                    href={item.href}
                    imageAsset={item.imageAsset}
                    secondaryImageAsset={item.secondaryImageAsset}
                    secondaryImageUrl={item.secondaryImageUrl}
                    theme={item.theme}
                    slug={item.slug}
                    sortOrder={item.sortOrder}
                    isAvailable={item.isAvailable}
                    linkLabel={item.linkLabel}
                    variant="vertical"
                    focalPoint={(item as any).focalPoint}
                  />
                ))}
              </div>

              {/* Mobile: 1 item per row (horizontal) */}
              <div className="sm:hidden space-y-3.5">
                {products.map((item) => (
                  <ContentCard
                    key={item.id}
                    title={item.title}
                    subtitle={item.subtitle}
                    href={item.href}
                    imageAsset={item.imageAsset}
                    secondaryImageAsset={item.secondaryImageAsset}
                    secondaryImageUrl={item.secondaryImageUrl}
                    theme={item.theme}
                    slug={item.slug}
                    sortOrder={item.sortOrder}
                    isAvailable={item.isAvailable}
                    linkLabel={item.linkLabel}
                    variant="horizontal"
                    focalPoint={(item as any).focalPoint}
                  />
                ))}
              </div>

              {/* Load more Products */}
              {hasMoreProducts && (
                <div className="text-center pt-4">
                  <button
                    type="button"
                    onClick={handleLoadMoreProducts}
                    disabled={isLoadingMoreProducts}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-[#F5A623] hover:bg-[#E08B38] text-[#2B2017] hover:text-white font-black text-sm transition-all shadow-lg disabled:opacity-50"
                  >
                    {isLoadingMoreProducts ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>در حال بارگذاری...</span>
                      </>
                    ) : (
                      <span>نمایش بیشتر محصولات</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 2. Group: Recipes */}
          {recipes.length > 0 && (
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-[#EFE9E0] pb-3">
                <h2 className="text-2xl sm:text-3xl font-black text-[#2B2017]">
                  دسرهای مرتبط ({toPersianDigits(totalRecipes)})
                </h2>
                <span className="text-xs text-[#5C5248] font-bold">
                  نمایش {toPersianDigits(recipes.length)} از {toPersianDigits(totalRecipes)} مورد
                </span>
              </div>

              {/* Desktop & Tablet: Multi-column compact luxury grid */}
              <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
                {recipes.map((item) => (
                  <ContentCard
                    key={item.id}
                    title={item.title}
                    subtitle={item.subtitle}
                    href={item.href}
                    imageAsset={item.imageAsset}
                    secondaryImageAsset={item.secondaryImageAsset}
                    secondaryImageUrl={item.secondaryImageUrl}
                    theme={item.theme}
                    slug={item.slug}
                    sortOrder={item.sortOrder}
                    linkLabel={item.linkLabel}
                    variant="vertical"
                    focalPoint={(item as any).focalPoint}
                  />
                ))}
              </div>

              {/* Mobile: 1 item per row (horizontal) */}
              <div className="sm:hidden space-y-3.5">
                {recipes.map((item) => (
                  <ContentCard
                    key={item.id}
                    title={item.title}
                    subtitle={item.subtitle}
                    href={item.href}
                    imageAsset={item.imageAsset}
                    theme={item.theme}
                    slug={item.slug}
                    sortOrder={item.sortOrder}
                    linkLabel={item.linkLabel}
                    variant="horizontal"
                    focalPoint={(item as any).focalPoint}
                  />
                ))}
              </div>

              {/* Load more Recipes */}
              {hasMoreRecipes && (
                <div className="text-center pt-4">
                  <button
                    type="button"
                    onClick={handleLoadMoreRecipes}
                    disabled={isLoadingMoreRecipes}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-[#F5A623] hover:bg-[#E08B38] text-[#2B2017] hover:text-white font-black text-sm transition-all shadow-lg disabled:opacity-50"
                  >
                    {isLoadingMoreRecipes ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>در حال بارگذاری...</span>
                      </>
                    ) : (
                      <span>نمایش بیشتر دستورها</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
