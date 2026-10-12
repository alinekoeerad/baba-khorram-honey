'use client';

/**
 * SearchDrawer Component (Phase 10 Task 1)
 *
 * Requirements:
 * - 250ms input debounce.
 * - Grouped suggestions (up to 8 products, up to 8 recipes).
 * - Thumbnails, titles, links.
 * - "مشاهده همه" links to scoped listings with ?q=.
 * - Global results page link to /search?q=.
 * - Keyboard navigation (ArrowDown, ArrowUp, Enter, Escape).
 * - Focus management and trap.
 * - Empty ("موردی یافت نشد"), loading, and error states.
 */

import React, { useState, useEffect, useRef, useId } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, X, Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { searchGlobalAction } from '@/server/actions/search-actions';
import { Picture } from '@/components/ui/picture';
import { toPersianDigits } from '@/lib/domain-utils';
import type { ProductCardViewModel } from '@/server/queries/products';
import type { RecipeCardViewModel } from '@/server/queries/recipes';

interface SearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SelectableItem {
  id: string;
  type: 'product' | 'recipe' | 'see-all-products' | 'see-all-recipes' | 'see-all-global';
  title: string;
  href: string;
}

export function SearchDrawer({ isOpen, onClose }: SearchDrawerProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<ProductCardViewModel[]>([]);
  const [recipes, setRecipes] = useState<RecipeCardViewModel[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalRecipes, setTotalRecipes] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Auto-focus on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      setActiveIndex(-1);
    } else {
      setQuery('');
      setDebouncedQuery('');
      setProducts([]);
      setRecipes([]);
      setTotalProducts(0);
      setTotalRecipes(0);
      setErrorMessage(null);
    }
  }, [isOpen]);

  // 2. 250ms Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  // 3. Execute search when debouncedQuery changes
  useEffect(() => {
    if (!isOpen) return;

    if (debouncedQuery.length < 2) {
      setProducts([]);
      setRecipes([]);
      setTotalProducts(0);
      setTotalRecipes(0);
      setIsLoading(false);
      setErrorMessage(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setErrorMessage(null);

    searchGlobalAction(debouncedQuery)
      .then((res) => {
        if (!isMounted) return;
        if (res.success) {
          setProducts(res.products || []);
          setRecipes(res.recipes || []);
          setTotalProducts(res.totalProducts || 0);
          setTotalRecipes(res.totalRecipes || 0);
        } else {
          setErrorMessage(res.error || 'خطا در جستجو.');
        }
      })
      .catch(() => {
        if (isMounted) setErrorMessage('خطای ارتباط با سرور.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, isOpen]);

  // 4. Build flattened selectable items list for keyboard navigation
  const selectableItems: SelectableItem[] = [];

  products.forEach((p) => {
    selectableItems.push({
      id: `p_${p.id}`,
      type: 'product',
      title: p.title,
      href: p.href,
    });
  });

  if (totalProducts > products.length && debouncedQuery) {
    selectableItems.push({
      id: 'see-all-products',
      type: 'see-all-products',
      title: `مشاهده تمام محصولات (${toPersianDigits(totalProducts)})`,
      href: `/products?q=${encodeURIComponent(debouncedQuery)}`,
    });
  }

  recipes.forEach((r) => {
    selectableItems.push({
      id: `r_${r.id}`,
      type: 'recipe',
      title: r.title,
      href: r.href,
    });
  });

  if (totalRecipes > recipes.length && debouncedQuery) {
    selectableItems.push({
      id: 'see-all-recipes',
      type: 'see-all-recipes',
      title: `مشاهده تمام دستورها (${toPersianDigits(totalRecipes)})`,
      href: `/recipes?q=${encodeURIComponent(debouncedQuery)}`,
    });
  }

  if (debouncedQuery.length >= 2 && (products.length > 0 || recipes.length > 0)) {
    selectableItems.push({
      id: 'see-all-global',
      type: 'see-all-global',
      title: `صفحه نتایج جامع برای «${debouncedQuery}»`,
      href: `/search?q=${encodeURIComponent(debouncedQuery)}`,
    });
  }

  // 5. Keyboard Navigation (ArrowDown, ArrowUp, Enter, Escape)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < selectableItems.length - 1 ? prev + 1 : 0));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : selectableItems.length - 1));
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < selectableItems.length) {
        const item = selectableItems[activeIndex];
        router.push(item.href);
        onClose();
      } else if (query.trim().length >= 2) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className="fixed inset-x-0 top-[94px] lg:top-20 z-40 bg-[#FDFBF8] border-b-2 border-[#D97706] shadow-2xl animate-in slide-in-from-top-4 duration-200 max-h-[85vh] flex flex-col"
      dir="rtl"
      role="search"
      aria-label="جستجوی همگانی وب‌سایت"
    >
      {/* Search Input Bar */}
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-4 flex items-center gap-3 border-b border-[#EFE9E0]">
        <Search className="w-5 h-5 text-[#D97706] shrink-0" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
          }}
          placeholder="جستجوی نام عسل، خاستگاه گیاهی، دستورها، یا خواص درمانی (حداقل ۲ حرف)..."
          className="flex-1 bg-transparent text-sm sm:text-base text-[#2B2017] font-medium placeholder-stone-400 focus:outline-none"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label="پاک کردن"
            className="p-1.5 text-stone-400 hover:text-stone-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="بستن کادر جستجو"
          className="p-2 text-stone-600 hover:text-[#2B2017] hover:bg-stone-100 rounded-lg transition-colors text-xs font-bold flex items-center gap-1"
        >
          <span className="hidden sm:inline">بستن</span>
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Suggestions Container */}
      <div className="overflow-y-auto flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-5 space-y-6">
        {/* Loading State */}
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-stone-500 text-xs sm:text-sm">
            <Loader2 className="w-6 h-6 animate-spin text-[#D97706]" />
            <span>در حال جستجوی همزمان در محصولات و دستورها...</span>
          </div>
        )}

        {/* Error State */}
        {errorMessage && !isLoading && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Short Query Prompt */}
        {!isLoading && !errorMessage && query.trim().length < 2 && (
          <div className="py-8 text-center text-xs sm:text-sm text-stone-500">
            برای جستجو لطفاً حداقل ۲ حرف تایپ کنید (مثال: «گون»، «آویشن»، «زنجبیل»، «شربت»).
          </div>
        )}

        {/* Empty State */}
        {!isLoading &&
          !errorMessage &&
          debouncedQuery.length >= 2 &&
          products.length === 0 &&
          recipes.length === 0 && (
            <div className="py-10 text-center space-y-2">
              <p className="font-bold text-sm sm:text-base text-stone-700">
                موردی برای «{debouncedQuery}» یافت نشد.
              </p>
              <p className="text-xs text-stone-500">
                می‌توانید املای واژه را بررسی کرده یا نام عمومی‌تری را جستجو کنید.
              </p>
            </div>
          )}

        {/* Grouped Results */}
        {!isLoading &&
          (products.length > 0 || recipes.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 1. Products Suggestions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-black text-stone-700 border-b border-stone-200 pb-1.5">
                  <span>محصولات عسل ({toPersianDigits(totalProducts)})</span>
                  {totalProducts > products.length && (
                    <Link
                      href={`/products?q=${encodeURIComponent(debouncedQuery)}`}
                      onClick={onClose}
                      className="text-[#D97706] hover:underline"
                    >
                      مشاهده همه ←
                    </Link>
                  )}
                </div>

                {products.length === 0 ? (
                  <p className="text-xs text-stone-400 py-2">محصول مرتبطی یافت نشد.</p>
                ) : (
                  <div className="space-y-1.5">
                    {products.map((p) => {
                      const itemIdx = selectableItems.findIndex((s) => s.id === `p_${p.id}`);
                      const isHighlighted = itemIdx === activeIndex;

                      return (
                        <Link
                          key={p.id}
                          href={p.href}
                          onClick={onClose}
                          className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                            isHighlighted ? 'bg-[#FEF3C7] ring-1 ring-[#D97706]' : 'hover:bg-stone-100'
                          }`}
                        >
                          <div className="w-12 h-12 bg-stone-100 border border-stone-200 shrink-0 overflow-hidden rounded">
                            {p.imageAsset ? (
                              <Picture
                                asset={p.imageAsset}
                                width={60}
                                height={60}
                                alt={p.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[9px] text-stone-400">
                                عسل
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-xs sm:text-sm text-stone-900 truncate">
                              {p.title}
                            </p>
                            {p.subtitle && (
                              <p className="text-[11px] text-stone-500 font-mono truncate" dir="ltr">
                                {p.subtitle}
                              </p>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. Recipes Suggestions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-black text-stone-700 border-b border-stone-200 pb-1.5">
                  <span>دسرهای عسل ({toPersianDigits(totalRecipes)})</span>
                  {totalRecipes > recipes.length && (
                    <Link
                      href={`/recipes?q=${encodeURIComponent(debouncedQuery)}`}
                      onClick={onClose}
                      className="text-[#D97706] hover:underline"
                    >
                      مشاهده همه ←
                    </Link>
                  )}
                </div>

                {recipes.length === 0 ? (
                  <p className="text-xs text-stone-400 py-2">دستور مرتبطی یافت نشد.</p>
                ) : (
                  <div className="space-y-1.5">
                    {recipes.map((r) => {
                      const itemIdx = selectableItems.findIndex((s) => s.id === `r_${r.id}`);
                      const isHighlighted = itemIdx === activeIndex;

                      return (
                        <Link
                          key={r.id}
                          href={r.href}
                          onClick={onClose}
                          className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                            isHighlighted ? 'bg-[#FEF3C7] ring-1 ring-[#D97706]' : 'hover:bg-stone-100'
                          }`}
                        >
                          <div className="w-12 h-12 bg-stone-100 border border-stone-200 shrink-0 overflow-hidden rounded">
                            {r.imageAsset ? (
                              <Picture
                                asset={r.imageAsset}
                                width={60}
                                height={60}
                                alt={r.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[9px] text-stone-400">
                                دسر
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-xs sm:text-sm text-stone-900 truncate">
                              {r.title}
                            </p>
                            {r.country && (
                              <p className="text-[11px] text-stone-500 truncate">
                                خاستگاه: {r.country}
                              </p>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
      </div>

      {/* Bottom Action Footer */}
      {debouncedQuery.length >= 2 && (products.length > 0 || recipes.length > 0) && (
        <div className="p-3 bg-stone-100 border-t border-stone-200 text-center text-xs">
          <Link
            href={`/search?q=${encodeURIComponent(debouncedQuery)}`}
            onClick={onClose}
            className="font-bold text-[#D97706] hover:text-[#B45309] inline-flex items-center gap-1.5"
          >
            <span>مشاهده تمام نتایج در صفحه کامل جستجو</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
