'use client';

/**
 * RecipesListingClient Component
 * Features:
 * - Scoped search with instant filtering and URL sync.
 * - Category filter chips and Cold/Hot serving filter.
 * - Dynamic pagination: "نمایش بیشتر" loads additional unique items without duplicates.
 * - When all items are shown, "نمایش بیشتر" disappears and "نمایش کمتر" appears (per user request).
 * - Clicking "نمایش کمتر" collapses back to the initial page and scrolls smoothly up.
 */

import React, { useState, useEffect, useTransition, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Loader2, X, ChevronUp } from 'lucide-react';
import { ContentCard } from '@/components/ui/content-card';
import { PillButton } from '@/components/ui/pill-button';
import { loadMoreRecipesAction } from '@/server/actions/listing-actions';
import { toPersianDigits, matchesServingFilter } from '@/lib/domain-utils';
import type { RecipeCardViewModel, RecipeCursor } from '@/server/queries/recipes';

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

export interface RecipesListingClientProps {
  initialItems: RecipeCardViewModel[];
  initialCursor: RecipeCursor | null;
  initialHasMore: boolean;
  totalCount: number;
  categories: CategoryItem[];
  selectedCategorySlug?: string;
  selectedServing?: 'cold' | 'hot';
  initialQuery?: string;
}

// Module-level client in-memory cache for instant filter restoration (Priority 5)
const recipeListingCache = new Map<string, { items: RecipeCardViewModel[]; cursor: RecipeCursor | null; hasMore: boolean }>();

export function RecipesListingClient({
  initialItems,
  initialCursor,
  initialHasMore,
  totalCount,
  categories,
  selectedCategorySlug = '',
  selectedServing = 'cold',
  initialQuery = '',
}: RecipesListingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState(selectedCategorySlug);
  const [serving, setServing] = useState<'cold' | 'hot'>(selectedServing);
  const [items, setItems] = useState<RecipeCardViewModel[]>(initialItems);
  const [cursor, setCursor] = useState<RecipeCursor | null>(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const initialBatchCount = 12;

  useEffect(() => {
    setItems(initialItems);
    setCursor(initialCursor);
    setHasMore(initialHasMore);
    setActiveCategory(selectedCategorySlug);
    setServing(selectedServing);
    setErrorMessage(null);
  }, [initialItems, initialCursor, initialHasMore, selectedCategorySlug, selectedServing]);

  useEffect(() => {
    setSearchTerm(initialQuery);
  }, [initialQuery]);

  // Save to client cache on receive
  useEffect(() => {
    const cacheKey = `${activeCategory || 'all'}_${serving}`;
    if (items.length > 0 && !searchTerm) {
      recipeListingCache.set(cacheKey, { items, cursor, hasMore });
    }
  }, [items, cursor, hasMore, activeCategory, serving, searchTerm]);


  const updateUrlParams = (newCategory?: string, newServing?: 'cold' | 'hot', newQ?: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');

    const cat = newCategory !== undefined ? newCategory : activeCategory;
    const srv = newServing !== undefined ? newServing : serving;
    const q = newQ !== undefined ? newQ : searchTerm;

    if (cat && cat !== 'all' && cat !== 'همه') {
      params.set('category', cat);
    } else {
      params.delete('category');
    }

    if (srv) {
      params.set('serving', srv);
    }

    if (q && q.trim().length > 0) {
      params.set('q', q.trim());
    } else {
      params.delete('q');
    }

    startTransition(() => {
      const queryString = params.toString();
      router.push(`/recipes${queryString ? `?${queryString}` : ''}`);
    });
  };

  useEffect(() => {
    if (searchTerm === initialQuery) return;

    const timer = setTimeout(() => {
      updateUrlParams(undefined, undefined, searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleCategoryClick = (categorySlug: string) => {
    setActiveCategory(categorySlug);
    const cacheKey = `${categorySlug || 'all'}_${serving}`;
    if (recipeListingCache.has(cacheKey)) {
      const cached = recipeListingCache.get(cacheKey)!;
      setItems(cached.items);
      setCursor(cached.cursor);
      setHasMore(cached.hasMore);
    }
    updateUrlParams(categorySlug, undefined, undefined);
  };

  const handleServingToggle = (newServing: 'cold' | 'hot') => {
    setServing(newServing);
    updateUrlParams(undefined, newServing, undefined);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    updateUrlParams(undefined, undefined, '');
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    setErrorMessage(null);

    try {
      const res = await loadMoreRecipesAction({
        categorySlug: activeCategory || undefined,
        serving,
        q: searchTerm.trim() || undefined,
        cursor,
        skip: items.length,
        take: initialBatchCount,
      });

      if (res.success && res.items) {
        setItems((prev) => {
          const existingIds = new Set(prev.map((x) => x.id));
          const newItems = res.items!.filter((x) => !existingIds.has(x.id));
          if (newItems.length === 0 || !res.hasMore) {
            setHasMore(false);
          } else {
            setHasMore(Boolean(res.hasMore));
          }
          return [...prev, ...newItems];
        });
        setCursor(res.nextCursor ?? null);
      } else {
        setHasMore(false);
        if (res.error) setErrorMessage(res.error);
      }
    } catch {
      setErrorMessage('خطای ارتباط با سرور.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleShowLess = () => {
    setItems((prev) => prev.slice(0, initialBatchCount));
    setHasMore(true);
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  const displayedItems = useMemo(() => {
    let list = items;

    if (activeCategory && activeCategory !== 'all' && activeCategory !== 'همه') {
      list = list.filter((item: any) => {
        if (item.categorySlug === activeCategory) return true;
        if (item.categories && item.categories.some((c: any) => c.slug === activeCategory || c.category?.slug === activeCategory)) return true;
        return false;
      });
    }

    if (serving) {
      list = list.filter((item: any) => {
        return matchesServingFilter(item.servingTypes, serving.toUpperCase() as 'COLD' | 'HOT');
      });
    }

    const q = searchTerm.trim().toLowerCase();
    if (q) {
      list = list.filter((item) => {
        const text = `${item.title} ${item.subtitle || ''} ${item.nameFa || ''} ${item.country || ''}`.toLowerCase();
        return text.includes(q);
      });
    }

    return list;
  }, [items, activeCategory, serving, searchTerm]);

  return (
    <div className="space-y-10 sm:space-y-14">
      {/* 1. Search Bar & Filter Controls */}
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="relative max-w-lg mx-auto">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو در دسرهای عسل باباخُرم..."
            className="w-full h-12 pr-11 pl-10 rounded-none bg-[#FAF6EE] border border-[#DFD3C3] text-[#3F2A1D] placeholder-[#7A6553] text-sm sm:text-base focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#D9A441]/40 focus:border-[#C58A2A] transition-all shadow-xs"
            dir="rtl"
          />
          <Search className="absolute right-4 top-3.5 w-5 h-5 text-[#C58A2A] pointer-events-none" />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute left-3.5 top-3.5 text-[#7A6553] hover:text-[#3F2A1D] transition-colors cursor-pointer"
              aria-label="پاک کردن جستجو"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Cold / Hot Serving Toggle */}
        <div className="flex items-center justify-center">
          <div className="inline-flex p-1.5 rounded-none bg-[#F5EFE6] border border-[#DFD3C3] shadow-xs">
            <button
              type="button"
              onClick={() => handleServingToggle('cold')}
              className={`px-6 py-2 rounded-none text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                serving === 'cold'
                  ? 'bg-[#D9A441] text-[#2E1F14] shadow-sm font-black'
                  : 'text-[#5C3A21] hover:text-[#3F2A1D]'
              }`}
            >
              سرو سرد (خنک و تابستانی)
            </button>
            <button
              type="button"
              onClick={() => handleServingToggle('hot')}
              className={`px-6 py-2 rounded-none text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                serving === 'hot'
                  ? 'bg-[#C58A2A] text-white shadow-sm font-black'
                  : 'text-[#5C3A21] hover:text-[#3F2A1D]'
              }`}
            >
              سرو گرم (دمنوش و چای)
            </button>
          </div>
        </div>

        {/* Category Chips ("همه" + active categories) */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-1">
          <button
            type="button"
            onClick={() => handleCategoryClick('')}
            className={`px-4 py-1.5 sm:px-5 sm:py-2 rounded-none text-xs sm:text-sm transition-all shadow-xs cursor-pointer ${
              !activeCategory || activeCategory === 'all'
                ? 'bg-[#D9A441] text-[#2E1F14] border border-[#C58A2A] shadow-md ring-2 ring-[#D9A441]/30 font-black'
                : 'bg-[#FAF6EE] text-[#5C3A21] border border-[#DFD3C3] hover:bg-[#F2ECE0] hover:text-[#3F2A1D] hover:border-[#C58A2A]/50 font-bold'
            }`}
          >
            همه دستورها
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryClick(cat.slug)}
              className={`px-4 py-1.5 sm:px-5 sm:py-2 rounded-none text-xs sm:text-sm transition-all shadow-xs cursor-pointer ${
                activeCategory === cat.slug
                  ? 'bg-[#D9A441] text-[#2E1F14] border border-[#C58A2A] shadow-md ring-2 ring-[#D9A441]/30 font-black'
                  : 'bg-[#FAF6EE] text-[#5C3A21] border border-[#DFD3C3] hover:bg-[#F2ECE0] hover:text-[#3F2A1D] hover:border-[#C58A2A]/50 font-bold'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Centered Divider with Serving Label per Brief Section 8 & 9 */}
        <div className="relative flex items-center justify-center my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-[#DFD3C3]" />
          </div>
          <div className="relative px-6 py-1.5 bg-[#FAF6EE] border border-[#D9A441]/50 text-[#5C3A21] font-black text-xs sm:text-sm shadow-xs">
            {serving === 'hot' ? 'سرو گرم (دمنوش و چای مقوی)' : 'سرو سرد (نوشیدنی و دسر خنک)'}
          </div>
        </div>
      </div>

      {/* 2. Results Container */}
      {isPending && displayedItems.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-[#5C3A21]">
          <Loader2 className="w-8 h-8 animate-spin text-[#C58A2A]" />
          <span className="text-sm font-bold">در حال جستجو و فیلتر...</span>
        </div>
      ) : displayedItems.length === 0 ? (
        <div className="py-20 text-center space-y-4 max-w-md mx-auto bg-[#FAF6EE] border border-[#DFD3C3] p-8 shadow-sm">
          <p className="text-xl font-black text-[#3F2A1D]">موردی یافت نشد</p>
          <p className="text-sm text-[#5C3A21] leading-relaxed">
            دستوری با مشخصات جستجوشده یافت نشد. لطفاً عبارت دیگری را جستجو کنید یا فیلتر دسته‌بندی را تغییر دهید.
          </p>
          {(searchTerm || activeCategory) && (
            <div className="pt-2">
              <PillButton
                variant="gold"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setActiveCategory('');
                  updateUrlParams('', undefined, '');
                }}
              >
                مشاهده همه دستورها
              </PillButton>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-12">
          {/* Desktop & Tablet: 3-column card grid (Brief Section 9) */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {displayedItems.map((item, idx) => (
              <ContentCard
                key={"desk-" + item.id}
                title={item.title}
                subtitle={item.subtitle}
                href={item.href}
                imageAsset={item.imageAsset}
                imageUrl={item.imageUrl}
                secondaryImageAsset={item.secondaryImageAsset}
                secondaryImageUrl={item.secondaryImageUrl}
                theme={item.theme || item.cardTheme}
                slug={item.slug}
                linkLabel={item.linkLabel}
                variant="vertical"
                index={idx}
                sortOrder={item.sortOrder}
                itemType="recipe"
              />
            ))}
          </div>

          {/* Mobile (< sm): One item per row with horizontal card variant (Brief Section 9) */}
          <div className="sm:hidden space-y-3.5">
            {displayedItems.map((item, idx) => (
              <ContentCard
                key={"mob-" + item.id}
                title={item.title}
                subtitle={item.subtitle}
                href={item.href}
                imageAsset={item.imageAsset}
                imageUrl={item.imageUrl}
                secondaryImageAsset={item.secondaryImageAsset}
                secondaryImageUrl={item.secondaryImageUrl}
                theme={item.theme || item.cardTheme}
                slug={item.slug}
                linkLabel={item.linkLabel}
                variant="horizontal"
                index={idx}
                sortOrder={item.sortOrder}
                itemType="recipe"
              />
            ))}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-900/60 border border-red-500 text-white text-xs sm:text-sm text-center max-w-md mx-auto">
              {errorMessage}
            </div>
          )}

          {/* 3. Load More / Show Less Controls (Per User Requirement) */}
          <div className="text-center pt-6 space-y-3">
            {hasMore ? (
              /* Button: نمایش بیشتر */
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-[#D9A441] hover:bg-[#C58A2A] text-[#2E1F14] hover:text-white font-black text-sm sm:text-base transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>در حال بارگذاری...</span>
                  </>
                ) : (
                  <span>نمایش بیشتر</span>
                )}
              </button>
            ) : items.length > initialBatchCount ? (
              /* Button: نمایش کمتر (Replaces نمایش بیشتر when all items are shown) */
              <button
                type="button"
                onClick={handleShowLess}
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-[#FAF6EE] hover:bg-[#F2ECE0] text-[#5C3A21] border border-[#DFD3C3] font-black text-sm sm:text-base transition-all duration-200 shadow-xs hover:shadow-sm cursor-pointer"
              >
                <ChevronUp className="w-5 h-5 text-[#C58A2A]" />
                <span>نمایش کمتر</span>
              </button>
            ) : null}

            {!hasMore && items.length > 0 && (
              <div className="text-center text-xs text-[#5C3A21] pt-2 font-bold">
                تمام موارد نمایش داده شد ({toPersianDigits(items.length)} دستور)
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
