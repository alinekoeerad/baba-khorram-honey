/**
 * RecipeCarousel Component (Infinite Looping, Mobile-Responsive & Touch-Friendly)
 *
 * Requirements:
 * - Seamless infinite looping: 1 -> 2 -> 3 -> 4 -> 1 -> 2 -> 3 -> 4 without resetting/jumping back.
 * - Auto-scroll: advances 1 card every 5 seconds continuously, pauses on hover and touch.
 * - Dynamic card step measurement for pixel-perfect card alignment on all screen widths.
 * - Touch swipe support (left/right swipe) for mobile devices.
 * - Responsive card width (w-[270px] on mobile to w-[340px] on desktop) with zero horizontal overflow.
 * - Four card themes: green, orange, yellow (dark text), burgundy, and AUTO (hashed from slug).
 * - Uniform fixed dimensions matching ProductCarousel (240px image height on desktop, object-cover).
 * - Link label with three dots only (LOCKED: NO ARROW / CHEVRON).
 * - Optional noBackground prop to allow seamless merging inside WoodGroup.
 */

'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { WoodBackground } from '@/components/ui/wood-background';
import { Container } from '@/components/ui/container';
import { PillButton } from '@/components/ui/pill-button';
import { getCardThemeForSlug, getBalancedCardTheme } from '@/lib/domain-utils';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface RecipeItem {
  id: string;
  title: string;
  slug: string;
  imageUrl?: string;
  theme?: string;
  cardTheme?: string;
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

export function RecipeCarousel({
  recipes,
  noBackground = false,
}: {
  recipes: RecipeItem[];
  noBackground?: boolean;
}) {
  const N = recipes.length;
  const firstCardRef = useRef<HTMLElement>(null);
  const [cardStep, setCardStep] = useState(364);
  const touchStartX = useRef<number | null>(null);

  // Dynamic step calculation based on actual rendered card width + gap
  useEffect(() => {
    const updateCardStep = () => {
      if (firstCardRef.current) {
        const isMobile = window.innerWidth < 640;
        const gap = isMobile ? 16 : 24;
        setCardStep(firstCardRef.current.offsetWidth + gap);
      }
    };
    updateCardStep();
    window.addEventListener('resize', updateCardStep);
    return () => window.removeEventListener('resize', updateCardStep);
  }, []);

  // Infinite cyclic list buffer (5 copies of the list)
  const loopItems = useMemo(() => {
    if (N === 0) return [];
    const list: Array<RecipeItem & { key: string }> = [];
    for (let k = 0; k < 5; k++) {
      recipes.forEach((r, idx) => {
        list.push({ ...r, key: `${r.id || r.slug}-${k}-${idx}` });
      });
    }
    return list;
  }, [recipes, N]);

  const [currentIndex, setCurrentIndex] = useState(N * 2);
  const [enableTransition, setEnableTransition] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const slideNext = useCallback(() => {
    setEnableTransition(true);
    setCurrentIndex((prev) => prev + 1);
  }, []);

  const slidePrev = useCallback(() => {
    setEnableTransition(true);
    setCurrentIndex((prev) => prev - 1);
  }, []);

  const handleTransitionEnd = () => {
    if (N === 0) return;
    if (currentIndex >= N * 3) {
      setEnableTransition(false);
      setCurrentIndex((prev) => prev - N);
    } else if (currentIndex < N) {
      setEnableTransition(false);
      setCurrentIndex((prev) => prev + N);
    }
  };

  useEffect(() => {
    if (isPaused || N === 0) return;
    const timer = setInterval(() => {
      slideNext();
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, N, slideNext]);

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX.current;
    if (diff < -40) {
      slideNext();
    } else if (diff > 40) {
      slidePrev();
    }
    touchStartX.current = null;
  };

  const offset = currentIndex * cardStep;

  if (N === 0) return null;

  const content = (
    <Container>
      {/* Section Header with Warm Ivory Title and Cream Subtitle */}
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16 space-y-3 px-2">
        <h2
          id="recipes-heading"
          className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#FFFBEB] drop-shadow-md tracking-tight"
        >
          ترکیبات و دسرهای سلامت‌بخش
        </h2>
        <p className="text-[#E5D5C5] font-bold text-sm sm:text-base lg:text-lg">
          دستورهای غذایی سنتی، معجون‌ها و نوشیدنی‌های شگفت‌انگیز با طعم اصیل عسل
        </p>
      </div>

      {/* Carousel Outer Wrapper */}
      <div
        className="relative flex items-center px-2 sm:px-6"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* RTL Prev Button (Right side) - Safe visible boundary */}
        <button
          type="button"
          onClick={slidePrev}
          aria-label="دستور قبلی"
          className="absolute right-1 sm:right-3 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/95 text-[#332115] shadow-2xl flex items-center justify-center transition-all cursor-pointer border border-[#EFE9E0] hover:bg-[#FBBF24] hover:scale-105 active:scale-95"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Viewport */}
        <div className="overflow-hidden w-full py-4 px-2 sm:px-4">
          <div
            onTransitionEnd={handleTransitionEnd}
            className={`flex gap-4 sm:gap-6 will-change-transform ${
              enableTransition ? 'transition-transform duration-500 ease-out' : ''
            }`}
            style={{
              transform: `translateX(${offset}px)`,
            }}
          >
            {loopItems.map((r, idx) => {
              const rawTheme = (r.theme || r.cardTheme || 'AUTO').toUpperCase();
              const themeKey =
                rawTheme === 'AUTO' || !THEME_CLASSES[rawTheme]
                  ? getBalancedCardTheme(idx)
                  : rawTheme;
              const theme = THEME_CLASSES[themeKey] || THEME_CLASSES.GREEN;

              return (
                <article
                  key={r.key}
                  ref={idx === 0 ? firstCardRef : undefined}
                  className="shrink-0 w-[270px] xs:w-[290px] sm:w-[320px] md:w-[340px] rounded-none overflow-hidden shadow-lg border border-black/10 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_36px_rgba(51,33,21,0.24)] group cursor-pointer bg-white flex flex-col"
                >
                  <Link href={`/recipes/${r.slug}`} className="flex flex-col h-full">
                    {/* Image Wrap - Fixed 240px with uniform object-cover */}
                    <div className="w-full h-48 sm:h-60 overflow-hidden bg-[#2B1B10] shrink-0 relative">
                      <img
                        src={r.imageUrl || `/images/recipe-${((idx % 6) + 1)}.jpg`}
                        alt={r.title}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        loading="lazy"
                        width={360}
                        height={240}
                      />
                    </div>

                    {/* Content Wrap */}
                    <div
                      className={`p-5 sm:p-6 flex-1 flex flex-col justify-between ${theme.bg} ${theme.text}`}
                    >
                      <h3 className="font-black text-base sm:text-xl leading-snug line-clamp-2">
                        {r.title}
                      </h3>

                      <div className="mt-4 sm:mt-6 pt-3 border-t border-black/10 flex items-center justify-between text-xs sm:text-sm font-black">
                        <span>مشاهده دستور پخت</span>
                        <DottedArrowIcon direction="left" className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-2" />
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        </div>

        {/* RTL Next Button (Left side) - Safe visible boundary */}
        <button
          type="button"
          onClick={slideNext}
          aria-label="دستور بعدی"
          className="absolute left-1 sm:left-3 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/95 text-[#332115] shadow-2xl flex items-center justify-center transition-all cursor-pointer border border-[#EFE9E0] hover:bg-[#FBBF24] hover:scale-105 active:scale-95"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* View All Button */}
      <div className="text-center mt-10 sm:mt-12">
        <PillButton variant="gold" size="lg" href="/recipes">
          مشاهده تمام دستورها
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
