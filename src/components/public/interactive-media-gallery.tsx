'use client';

/**
 * InteractiveMediaGallery Component
 * Luxury multi-image presentation for Persian Honey Products & Recipes.
 *
 * Features:
 * - Unifies mainImage + gallery items with deduplication.
 * - Smooth cross-fade transition on active slide change.
 * - Click-to-Zoom Fullscreen Lightbox Modal with keyboard navigation (Esc, ArrowLeft, ArrowRight).
 * - Next/Previous controls with Persian slide counter (e.g. ۱ از ۴).
 * - Clickable thumbnail strip with active golden highlight (border-2 border-[#F59E0B]).
 * - Sharp 90-degree corners (rounded-none) per Brand UI identity.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Picture } from '@/components/ui/picture';
import { toPersianDigits } from '@/lib/domain-utils';
import {
  ZoomIn,
  ChevronRight,
  ChevronLeft,
  X,
  ExternalLink,
} from 'lucide-react';

export interface GallerySlide {
  id?: string;
  url?: string;
  storageKey?: string;
  alt?: string;
  width?: number | null;
  height?: number | null;
  blurDataUrl?: string | null;
  caption?: string | null;
}

export interface InteractiveMediaGalleryProps {
  mainImage?: any;
  gallery?: Array<{ id?: string; asset?: any; sortOrder?: number }>;
  fallbackImageUrl?: string;
  title: string;
  aspectRatio?: 'aspect-4/3' | 'aspect-square' | 'aspect-16/9';
  featuredBadge?: string | null;
  className?: string;
}

export function InteractiveMediaGallery({
  mainImage,
  gallery = [],
  fallbackImageUrl,
  title,
  aspectRatio = 'aspect-4/3',
  featuredBadge,
  className = '',
}: InteractiveMediaGalleryProps) {
  // 1. Unify and deduplicate slides
  const slides: GallerySlide[] = React.useMemo(() => {
    const list: GallerySlide[] = [];
    const seenKeys = new Set<string>();

    const addSlide = (asset: any) => {
      if (!asset) return;
      const key = asset.id || asset.storageKey || asset.url;
      if (key && seenKeys.has(key)) return;
      if (key) seenKeys.add(key);

      const url =
        asset.url ||
        (asset.storageKey ? `/uploads/${asset.storageKey}` : undefined);

      list.push({
        id: asset.id,
        storageKey: asset.storageKey,
        url,
        alt: asset.alt || title,
        width: asset.width ?? 900,
        height: asset.height ?? 675,
        blurDataUrl: asset.blurDataUrl ?? null,
        caption: asset.alt || null,
      });
    };

    if (mainImage) {
      addSlide(mainImage);
    }

    if (Array.isArray(gallery)) {
      gallery.forEach((item) => {
        addSlide(item.asset || item);
      });
    }

    if (list.length === 0) {
      list.push({
        url: fallbackImageUrl || '/images/honey-jar.jpg',
        alt: title,
        width: 800,
        height: 600,
      });
    }

    return list;
  }, [mainImage, gallery, fallbackImageUrl, title]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Keep active index bounded if slides length changes
  useEffect(() => {
    if (activeIndex >= slides.length) {
      setActiveIndex(0);
    }
  }, [slides.length, activeIndex]);

  const currentSlide = slides[activeIndex] || slides[0];

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowRight') {
        // In RTL, right arrow normally moves to previous/earlier item
        handlePrev();
      } else if (e.key === 'ArrowLeft') {
        // In RTL, left arrow normally moves to next item
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, handlePrev, handleNext]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Stage Image */}
      <div
        className={`w-full ${aspectRatio} rounded-none overflow-hidden border border-[#EFE9E0] shadow-md bg-[#FAF7F2] p-6 flex items-center justify-center relative group cursor-zoom-in`}
        onClick={() => setIsLightboxOpen(true)}
        role="button"
        tabIndex={0}
        aria-label="بزرگنمایی تصویر در اندازه اصلی"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsLightboxOpen(true);
          }
        }}
      >
        {/* Active Slide Image */}
        {currentSlide.storageKey ? (
          <Picture
            key={currentSlide.storageKey}
            asset={currentSlide as any}
            width={currentSlide.width ?? 900}
            height={currentSlide.height ?? 675}
            blurDataUrl={currentSlide.blurDataUrl}
            alt={currentSlide.alt || title}
            priority={activeIndex === 0}
            className="w-full h-full max-h-full object-contain transition-transform duration-300 group-hover:scale-102"
          />
        ) : (
          <img
            src={currentSlide.url || fallbackImageUrl || '/images/honey-jar.jpg'}
            alt={currentSlide.alt || title}
            className="w-full h-full max-h-full object-contain transition-transform duration-300 group-hover:scale-102"
          />
        )}

        {/* Featured Badge */}
        {featuredBadge && (
          <span className="absolute top-4 right-4 bg-[#F59E0B] text-[#2B2017] text-xs font-black px-3 py-1 rounded-none shadow-md pointer-events-none z-10">
            {featuredBadge}
          </span>
        )}

        {/* Slide Counter Badge (shown if multiple images) */}
        {slides.length > 1 && (
          <div className="absolute top-4 left-4 bg-[#2B2017]/85 backdrop-blur-xs text-[#FDE68A] text-[11px] font-mono font-bold px-2.5 py-1 rounded-none border border-[#F59E0B]/40 shadow-sm pointer-events-none z-10">
            {toPersianDigits(activeIndex + 1)} از {toPersianDigits(slides.length)}
          </div>
        )}

        {/* Hover Zoom Badge */}
        <div className="absolute bottom-4 left-4 bg-[#2B2017]/85 backdrop-blur-xs text-[#FDE68A] text-xs font-bold px-3 py-1.5 rounded-none flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 border border-[#F59E0B]/40 shadow-md pointer-events-none z-10">
          <ZoomIn className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>بزرگنمایی تصویر</span>
        </div>

        {/* In-Frame Next/Prev Arrows (if multiple slides) */}
        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-[#2B2017]/75 hover:bg-[#F59E0B] text-white hover:text-[#2B2017] flex items-center justify-center rounded-none shadow-md transition-colors opacity-0 group-hover:opacity-100 z-10 cursor-pointer"
              aria-label="تصویر قبلی"
              title="تصویر قبلی"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-[#2B2017]/75 hover:bg-[#F59E0B] text-white hover:text-[#2B2017] flex items-center justify-center rounded-none shadow-md transition-colors opacity-0 group-hover:opacity-100 z-10 cursor-pointer"
              aria-label="تصویر بعدی"
              title="تصویر بعدی"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Interactive Thumbnail Strip */}
      {slides.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 sm:gap-3">
          {slides.map((slide, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={slide.id || slide.storageKey || slide.url || idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`aspect-square bg-[#FAF7F2] p-1.5 flex items-center justify-center rounded-none overflow-hidden transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'border-2 border-[#F59E0B] ring-2 ring-[#F59E0B]/40 shadow-sm opacity-100 scale-100'
                    : 'border border-[#EFE9E0] opacity-70 hover:opacity-100 hover:border-[#D97706] scale-95 hover:scale-100'
                }`}
                aria-label={`نمایش تصویر ${toPersianDigits(idx + 1)}`}
              >
                {slide.storageKey ? (
                  <Picture
                    asset={slide as any}
                    width={180}
                    height={180}
                    alt={slide.alt || title}
                    className="w-full h-full max-h-full object-contain"
                  />
                ) : (
                  <img
                    src={slide.url || fallbackImageUrl || '/images/honey-jar.jpg'}
                    alt={slide.alt || title}
                    className="w-full h-full max-h-full object-contain"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-md flex flex-col justify-between items-center p-4 sm:p-6 select-none animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="بزرگنمایی تصویر"
        >
          {/* 1. Fixed Top-Left Floating Close Button (Never pushed off-screen) */}
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="fixed top-5 left-5 z-[110] flex items-center gap-2 bg-[#2B2017] hover:bg-red-700 text-white border-2 border-[#F59E0B] px-4 py-2.5 text-sm font-bold shadow-2xl transition-colors cursor-pointer rounded-none"
            title="بستن (Esc)"
            aria-label="بستن پنجره بزرگنمایی"
          >
            <X className="w-5 h-5 text-[#F59E0B]" strokeWidth={2.5} />
            <span>بستن (Esc)</span>
          </button>

          {/* Header Bar */}
          <div
            className="w-full max-w-5xl flex items-center justify-between text-white pb-3 border-b border-stone-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-black text-amber-400">
                🍯 {title}
              </span>
              {slides.length > 1 && (
                <span className="text-xs font-mono font-bold px-2 py-0.5 bg-stone-800 text-stone-300 rounded-none border border-stone-700">
                  تصویر {toPersianDigits(activeIndex + 1)} از {toPersianDigits(slides.length)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {currentSlide.url && (
                <a
                  href={currentSlide.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-stone-800 transition-colors rounded-none"
                  title="باز کردن در برگه جدید"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2B2017] hover:bg-red-700 text-white text-xs font-bold transition-colors rounded-none border border-amber-500/50 cursor-pointer shadow-sm"
                title="بستن (Esc)"
              >
                <X className="w-4 h-4 text-amber-400" />
                <span>بستن (Esc)</span>
              </button>
            </div>
          </div>

          {/* Main Stage of Lightbox */}
          <div
            className="relative flex-1 w-full max-w-5xl flex items-center justify-center p-2 my-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev Navigation Button */}
            {slides.length > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-stone-900/80 hover:bg-[#F59E0B] text-white hover:text-[#2B2017] flex items-center justify-center rounded-none border border-stone-700 shadow-lg transition-colors cursor-pointer z-10"
                aria-label="تصویر قبلی"
                title="تصویر قبلی (کلید فلش راست)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Display High-Res Image Frame with Direct Corner Close Button */}
            <div className="relative flex items-center justify-center">
              {/* 2. Direct Corner Close Button on Image Frame */}
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="absolute top-2 left-2 z-20 w-10 h-10 bg-black/80 hover:bg-red-600 text-white border border-white/30 flex items-center justify-center text-xl font-bold transition-colors cursor-pointer rounded-none shadow-lg"
                title="بستن (Esc)"
                aria-label="بستن پنجره"
              >
                ✕
              </button>

              <img
                src={currentSlide.url || fallbackImageUrl || '/images/honey-jar.jpg'}
                alt={currentSlide.alt || title}
                className="max-w-[88vw] max-h-[72vh] object-contain rounded-none border-2 border-stone-800 shadow-2xl bg-[#140E0A]"
              />
            </div>

            {/* Next Navigation Button */}
            {slides.length > 1 && (
              <button
                type="button"
                onClick={handleNext}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-stone-900/80 hover:bg-[#F59E0B] text-white hover:text-[#2B2017] flex items-center justify-center rounded-none border border-stone-700 shadow-lg transition-colors cursor-pointer z-10"
                aria-label="تصویر بعدی"
                title="تصویر بعدی (کلید فلش چپ)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Lightbox Footer & Thumbnail Strip */}
          <div
            className="w-full max-w-5xl pt-3 border-t border-stone-800 flex flex-col items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {currentSlide.caption && (
              <p className="text-xs text-stone-300 font-medium text-center">
                {currentSlide.caption}
              </p>
            )}

            {slides.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1">
                {slides.map((s, idx) => (
                  <button
                    key={s.id || s.storageKey || s.url || idx}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={`w-12 h-12 shrink-0 bg-stone-900 border rounded-none p-1 transition-all cursor-pointer ${
                      idx === activeIndex
                        ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105'
                        : 'border-stone-700 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={s.url || fallbackImageUrl || '/images/honey-jar.jpg'}
                      alt={s.alt || ''}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
