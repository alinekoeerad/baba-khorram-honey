/**
 * ProductCarousel Component (Infinite Looping, Mobile-Responsive & Touch-Friendly)
 *
 * Requirements:
 * - Seamless infinite looping: 1 -> 2 -> 3 -> 4 -> 1 -> 2 -> 3 -> 4 without resetting/jumping back.
 * - Auto-scroll: advances 1 card every 5 seconds continuously, pauses on hover and touch.
 * - Dynamic card step measurement for pixel-perfect card alignment on all screen widths.
 * - Touch swipe support (left/right swipe) for mobile devices.
 * - Responsive card width (w-[270px] on mobile to w-[340px] on desktop) with zero horizontal overflow.
 * - Four card themes: green, orange, yellow (dark text), burgundy, and AUTO (hashed from slug).
 * - Uniform fixed dimensions matching RecipeCarousel (240px image height on desktop, object-cover).
 * - Link label with three dots only (LOCKED: NO ARROW / CHEVRON).
 * - Optional noBackground prop to allow seamless merging inside WoodGroup.
 */

'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { WoodBackground } from '@/components/ui/wood-background';
import { Container } from '@/components/ui/container';
import { PillButton } from '@/components/ui/pill-button';
import { getCardThemeForSlug, getBalancedCardTheme, resolveItemCardTheme } from '@/lib/domain-utils';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface ProductItem {
  id: string;
  nameFa?: string;
  title?: string;
  slug: string;
  imageUrl?: string | null;
  theme?: string;
  cardTheme?: string;
  sortOrder?: number;
  isAvailable?: boolean;
}

const THEME_CLASSES: Record<string, { bg: string; text: string }> = {
  GREEN: { bg: 'bg-[#4CA849]', text: 'text-white' },
  ORANGE: { bg: 'bg-[#E08B38]', text: 'text-white' },
  YELLOW: { bg: 'bg-[#F5A623]', text: 'text-[#2B2017]' },
  BURGUNDY: { bg: 'bg-[#9E3556]', text: 'text-white' },
  green: { bg: 'bg-[#4CA849]', text: 'text-white' },
  orange: { bg: 'bg-[#E08B38]', text: 'text-white' },
  yellow: { bg: 'bg-[#F5A623]', text: 'text-[#2B2017]' },
  burgundy: { bg: 'bg-[#9E3556]', text: 'text-white' },
};

import { DottedArrowIcon } from '@/components/ui/dotted-arrow-icon';

export function ProductCarousel({
  products,
  noBackground = false,
}: {
  products: ProductItem[];
  noBackground?: boolean;
}) {
  const N = products.length;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Repeat items if small set to allow generous continuous scroll
  const displayItems = useMemo(() => {
    if (N === 0) return [];
    const list: Array<ProductItem & { key: string }> = [];
    const repeatCount = N < 6 ? 3 : 2;
    for (let k = 0; k < repeatCount; k++) {
      products.forEach((p, idx) => {
        list.push({ ...p, key: `${p.id || p.slug}-${k}-${idx}` });
      });
    }
    return list;
  }, [products, N]);

  const slideNext = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const isRtl = document.documentElement.dir === 'rtl';
    const card = el.querySelector('article');
    const step = card ? card.offsetWidth + 16 : 286;
    el.scrollBy({ left: isRtl ? -step : step, behavior: 'smooth' });
  }, []);

  const slidePrev = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const isRtl = document.documentElement.dir === 'rtl';
    const card = el.querySelector('article');
    const step = card ? card.offsetWidth + 16 : 286;
    el.scrollBy({ left: isRtl ? step : -step, behavior: 'smooth' });
  }, []);

  // Continuous auto-advance on desktop when not interacting
  useEffect(() => {
    if (isPaused || N === 0) return;
    const timer = setInterval(() => {
      const el = scrollContainerRef.current;
      if (!el) return;
      const isRtl = document.documentElement.dir === 'rtl';
      const card = el.querySelector('article');
      const step = card ? card.offsetWidth + 16 : 286;
      const maxScroll = el.scrollWidth - el.clientWidth;
      const currentScroll = Math.abs(el.scrollLeft);

      if (currentScroll >= maxScroll - 25) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: isRtl ? -step : step, behavior: 'smooth' });
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused, N]);

  if (N === 0) return null;

  const content = (
    <Container>
      {/* Section Header with High-Contrast Dark Title and Subtitle */}
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16 space-y-3 px-2">
        <h2
          id="products-heading"
          className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#2B2017] drop-shadow-md tracking-tight"
        >
          محصولات ممتاز باباخُرم
        </h2>
        <p className="text-[#5C5248] font-bold text-sm sm:text-base lg:text-lg">
          عسل‌های خام و تک‌گل برداشت‌شده از پوشش گیاهی بکر و کوهستانی
        </p>
      </div>

      {/* Carousel Outer Wrapper */}
      <div
        className="relative flex items-center px-2 sm:px-12"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* RTL Prev Button (Right side) - Hidden on mobile, visible on tablet/desktop */}
        <button
          type="button"
          onClick={slidePrev}
          aria-label="محصول قبلی"
          className="hidden sm:flex absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white text-[#332115] shadow-2xl items-center justify-center transition-all cursor-pointer border border-[#EFE9E0] hover:bg-[#FBBF24] hover:scale-105 active:scale-95"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Viewport: Native Hardware-Accelerated CSS Scroll-Snap Container */}
        <div
          ref={scrollContainerRef}
          className="w-full overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar py-4 px-[calc(50vw-135px)] xs:px-[calc(50vw-145px)] sm:px-4 flex gap-4 sm:gap-6 will-change-scroll"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {displayItems.map((p, idx) => {
            const themeKey = resolveItemCardTheme({ ...p, index: idx });
            const theme = THEME_CLASSES[themeKey] || THEME_CLASSES.GREEN;
            const titleText = p.nameFa || p.title || 'عسل ممتاز باباخُرم';
            const imageSrc = p.imageUrl || (p.slug ? `/images/products/${p.slug}.jpg` : '/images/honey-jar.jpg');

            return (
              <article
                key={p.key}
                className="shrink-0 w-[270px] xs:w-[290px] sm:w-[320px] md:w-[340px] snap-center rounded-none overflow-hidden shadow-lg border border-black/10 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_36px_rgba(51,33,21,0.24)] group cursor-pointer bg-white flex flex-col"
                style={{
                  scrollSnapAlign: 'center',
                  scrollSnapStop: 'always',
                }}
              >
                <Link href={`/products/${p.slug}`} className="flex flex-col h-full">
                  {/* Image Wrap - Edge-to-edge card presentation */}
                  <div className="w-full aspect-[4/3] overflow-hidden shrink-0 relative">
                    <img
                      src={imageSrc}
                      alt={titleText}
                      className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                      loading="lazy"
                      width={360}
                      height={270}
                    />
                    {p.isAvailable === false && (
                      <div className="absolute top-3 right-3 bg-[#9E3556] text-white text-xs font-black px-2.5 py-1 z-10 shadow-xs">
                        ناموجود
                      </div>
                    )}
                  </div>

                  {/* Content Wrap */}
                  <div
                    className={`p-5 sm:p-6 flex-1 flex flex-col justify-between ${theme.bg} ${theme.text}`}
                  >
                    <h3 className="font-black text-base sm:text-xl leading-snug line-clamp-2">
                      {titleText}
                    </h3>

                    <div className="mt-4 sm:mt-6 pt-3 border-t border-black/10 flex items-center justify-between text-xs sm:text-sm font-black">
                      <span>مشاهده محصول</span>
                      <DottedArrowIcon direction="left" className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-2" />
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>

        {/* RTL Next Button (Left side) - Hidden on mobile, visible on tablet/desktop */}
        <button
          type="button"
          onClick={slideNext}
          aria-label="محصول بعدی"
          className="hidden sm:flex absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white text-[#332115] shadow-2xl items-center justify-center transition-all cursor-pointer border border-[#EFE9E0] hover:bg-[#FBBF24] hover:scale-105 active:scale-95"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* View All Button */}
      <div className="text-center mt-10 sm:mt-12">
        <PillButton variant="gold" size="lg" href="/products">
          مشاهده همه محصولات
        </PillButton>
      </div>
    </Container>
  );

  if (noBackground) {
    return <section className="py-14 sm:py-20 lg:py-24 border-none overflow-hidden">{content}</section>;
  }

  return (
    <WoodBackground className="py-14 sm:py-20 lg:py-24 border-none overflow-hidden">
      {content}
    </WoodBackground>
  );
}
