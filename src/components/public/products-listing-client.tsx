'use client';

/**
 * ProductsListingClient Component
 * Features:
 * - Scoped search with instant filtering and URL sync.
 * - Category filter chips with active states.
 * - Dynamic pagination: "نمایش بیشتر" loads additional unique items without duplicates.
 * - When all items are shown, "نمایش بیشتر" disappears and "نمایش کمتر" appears (per user request).
 * - Clicking "نمایش کمتر" collapses back to the initial page and scrolls smoothly up.
 */

import React, { useState, useEffect, useTransition, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Loader2, X, ChevronUp } from 'lucide-react';
import { ContentCard } from '@/components/ui/content-card';
import { PillButton } from '@/components/ui/pill-button';
import { loadMoreProductsAction } from '@/server/actions/listing-actions';
import { toPersianDigits } from '@/lib/domain-utils';
import type { ProductCardViewModel, ProductCursor } from '@/server/queries/products';

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

export interface ProductsListingClientProps {
  initialItems: ProductCardViewModel[];
  initialCursor: ProductCursor | null;
  initialHasMore: boolean;
  totalCount: number;
  categories: CategoryItem[];
  selectedCategorySlug?: string;
  initialQuery?: string;
}

// Module-level client in-memory cache for instant filter restoration (Priority 5)
const productListingCache = new Map<string, { items: ProductCardViewModel[]; cursor: ProductCursor | null; hasMore: boolean }>();

export function ProductsListingClient({
  initialItems,
  initialCursor,
  initialHasMore,
  totalCount,
  categories,
  selectedCategorySlug = '',
  initialQuery = '',
}: ProductsListingClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState(selectedCategorySlug);
  const [items, setItems] = useState<ProductCardViewModel[]>(initialItems);
  const [cursor, setCursor] = useState<ProductCursor | null>(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const initialBatchCount = 12;

  // Sync state when server props update
  useEffect(() => {
    setItems(initialItems);
    setCursor(initialCursor);
    setHasMore(initialHasMore);
    setActiveCategory(selectedCategorySlug);
    setErrorMessage(null);
  }, [initialItems, initialCursor, initialHasMore, selectedCategorySlug]);

  useEffect(() => {
    setSearchTerm(initialQuery);
  }, [initialQuery]);

  // Save to client cache on receive
  useEffect(() => {
    const cacheKey = activeCategory || 'all';
    if (items.length > 0 && !searchTerm) {
      productListingCache.set(cacheKey, { items, cursor, hasMore });
    }
  }, [items, cursor, hasMore, activeCategory, searchTerm]);


  // URL sync helper
  const updateUrlParams = (newCategory?: string, newQ?: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');

    const cat = newCategory !== undefined ? newCategory : activeCategory;
    const q = newQ !== undefined ? newQ : searchTerm;

    if (cat && cat !== 'all' && cat !== 'همه') {
      params.set('category', cat);
    } else {
      params.delete('category');
    }

    if (q && q.trim().length > 0) {
      params.set('q', q.trim());
    } else {
      params.delete('q');
    }

    startTransition(() => {
      const queryString = params.toString();
      router.push(`/products${queryString ? `?${queryString}` : ''}`);
    });
  };

  // Debounced search input sync
  useEffect(() => {
    if (searchTerm === initialQuery) return;

    const timer = setTimeout(() => {
      updateUrlParams(undefined, searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleCategoryClick = (categorySlug: string) => {
    setActiveCategory(categorySlug);
    const cacheKey = categorySlug || 'all';
    if (productListingCache.has(cacheKey)) {
      const cached = productListingCache.get(cacheKey)!;
      setItems(cached.items);
      setCursor(cached.cursor);
      setHasMore(cached.hasMore);
    }
    updateUrlParams(categorySlug, undefined);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    updateUrlParams(undefined, '');
  };

  // Load More: fetches next batch and strictly prevents duplicates
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    setErrorMessage(null);

    try {
      const res = await loadMoreProductsAction({
        categorySlug: activeCategory || undefined,
        q: searchTerm.trim() || undefined,
        cursor,
        skip: items.length,
        take: initialBatchCount,
      });

      if (res.success && res.items) {
        setItems((prev) => {
          // Strictly deduplicate by id
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

  // Show Less: collapses back to initial batch and smoothly scrolls up
  const handleShowLess = () => {
    setItems((prev) => prev.slice(0, initialBatchCount));
    setHasMore(true);
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  const [inStockOnly, setInStockOnly] = useState(false);

  // Client-side instant filter to guarantee search and category filtering work 100% of the time
  const displayedItems = useMemo(() => {
    let list = items;

    if (inStockOnly) {
      list = list.filter((item) => item.isAvailable !== false);
    }

    if (activeCategory && activeCategory !== 'all' && activeCategory !== 'همه') {
      list = list.filter((item: any) => {
        if (item.categorySlug === activeCategory) return true;
        if (item.categories && item.categories.some((c: any) => c.slug === activeCategory || c.category?.slug === activeCategory)) return true;
        return false;
      });
    }

    const q = searchTerm.trim().toLowerCase();
    if (q) {
      list = list.filter((item) => {
        const text = `${item.title} ${item.subtitle || ''} ${item.nameFa || ''} ${item.nameOriginal || ''}`.toLowerCase();
        return text.includes(q);
      });
    }

    return list;
  }, [items, activeCategory, searchTerm, inStockOnly]);

  return (
    <div className="space-y-10 sm:space-y-14">
      {/* 1. Scoped Search & Category Filter Bar */}
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="relative max-w-lg mx-auto">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو در محصولات باباخُرم..."
            className="w-full h-12 pr-11 pl-10 rounded-none bg-white/95 border border-[#EFE9E0] text-[#2B2017] placeholder-[#5C5248] text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#FBBF24] focus:border-[#F59E0B] transition-all shadow-sm"
            dir="rtl"
          />
          <Search className="absolute right-4 top-3.5 w-5 h-5 text-[#B45309] pointer-events-none" />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute left-3.5 top-3.5 text-stone-500 hover:text-[#2B2017] transition-colors cursor-pointer"
              aria-label="پاک کردن جستجو"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Category Chips: Horizontal Scroll on Mobile + Wrap on Desktop (UX-05) */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-1 px-1 sm:flex-wrap sm:justify-center">
          <button
            type="button"
            onClick={() => handleCategoryClick('')}
            className={`shrink-0 px-4 py-1.5 sm:px-5 sm:py-2 rounded-none text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap ${
              !activeCategory || activeCategory === 'all'
                ? 'bg-[#FBBF24] text-[#2B2017] shadow-md ring-2 ring-[#FBBF24]/50 font-black'
                : 'bg-white/90 text-[#332115] border border-[#EFE9E0] hover:bg-white hover:text-[#2B2017]'
            }`}
          >
            همه محصولات
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryClick(cat.slug)}
              className={`shrink-0 px-4 py-1.5 sm:px-5 sm:py-2 rounded-none text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap ${
                activeCategory === cat.slug
                  ? 'bg-[#FBBF24] text-[#2B2017] shadow-md ring-2 ring-[#FBBF24]/50 font-black'
                  : 'bg-white/90 text-[#332115] border border-[#EFE9E0] hover:bg-white hover:text-[#2B2017]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* In-Stock Only Toggle (UX-05) */}
        <div className="flex items-center justify-center pt-1">
          <button
            type="button"
            onClick={() => setInStockOnly((prev) => !prev)}
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-none text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
              inStockOnly
                ? 'bg-emerald-600/90 text-white border-emerald-400 shadow-md ring-2 ring-emerald-500/40'
                : 'bg-white/90 text-[#332115] border border-[#EFE9E0] hover:bg-white'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${inStockOnly ? 'bg-emerald-300 animate-pulse' : 'bg-stone-400'}`} />
            <span>فقط کالاهای موجود در انبار</span>
          </button>
        </div>
      </div>

      {/* 2. Results Container */}
      {isPending && displayedItems.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-white">
          <Loader2 className="w-8 h-8 animate-spin text-[#FBBF24]" />
          <span className="text-sm font-bold">در حال جستجو و فیلتر...</span>
        </div>
      ) : displayedItems.length === 0 ? (
        <div className="py-20 text-center space-y-4 max-w-md mx-auto bg-white border border-[#FDE68A] p-8 shadow-md">
          <p className="text-xl font-black text-[#2B2017]">موردی یافت نشد</p>
          <p className="text-sm text-[#5C5248] leading-relaxed">
            محصولی با مشخصات جستجوشده یافت نشد. لطفاً عبارت دیگری را جستجو کنید یا فیلتر دسته‌بندی را تغییر دهید.
          </p>
          {(searchTerm || activeCategory) && (
            <div className="pt-2">
              <PillButton
                variant="gold"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setActiveCategory('');
                  updateUrlParams('', '');
                }}
              >
                مشاهده همه محصولات
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
                imageUrl={item.imageUrl || (item.slug ? `/images/products/${item.slug}.jpg` : (item.imageAsset ? null : '/images/honey-jar.jpg'))}
                theme={item.theme || item.cardTheme}
                slug={item.slug}
                isAvailable={item.isAvailable}
                linkLabel={item.linkLabel}
                variant="vertical"
                index={idx}
                sortOrder={item.sortOrder}
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
                imageUrl={item.imageUrl || (item.slug ? `/images/products/${item.slug}.jpg` : (item.imageAsset ? null : '/images/honey-jar.jpg'))}
                theme={item.theme || item.cardTheme}
                slug={item.slug}
                isAvailable={item.isAvailable}
                linkLabel={item.linkLabel}
                variant="horizontal"
                index={idx}
                sortOrder={item.sortOrder}
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
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-[#F5A623] hover:bg-[#E08B38] text-[#2B2017] hover:text-white font-black text-sm sm:text-base transition-all duration-200 shadow-lg disabled:opacity-50 cursor-pointer"
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
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-[#382013] hover:bg-[#4A2C1B] text-[#FBBF24] border border-[#FBBF24]/40 font-black text-sm sm:text-base transition-all duration-200 shadow-lg cursor-pointer"
              >
                <ChevronUp className="w-5 h-5" />
                <span>نمایش کمتر</span>
              </button>
            ) : null}

            {!hasMore && items.length > 0 && (
              <div className="text-center text-xs text-[#E6DDD4]/80 pt-2 font-bold">
                تمام موارد نمایش داده شد ({toPersianDigits(items.length)} محصول)
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
