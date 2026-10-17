/**
 * HeroSlider Component (Authentic honey.com Fidelity)
 * Features:
 * - Slideshow rotating between high-resolution nature/honey images every 6-7 seconds.
 * - Smooth transition: image blurs and fades out, next image fades in with crisp focus.
 * - Continuous slow Ken Burns zoom animation.
 * - Strictly NO buttons in hero section.
 * - Indicator dots completely removed per user requirement.
 * - Accepts dynamic images, title, subtitle from CMS or defaults.
 * - Device-specific visibility (desktop vs. mobile) & per-slide focal point positioning.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { PillButton } from '@/components/ui/pill-button';

const DEFAULT_HERO_IMAGES = [
  {
    src: '/images/hero/photo_35.jpg',
    alt: 'شهد زرین و کندوهای عسل طبیعی باباخُرم',
    deviceTarget: 'all' as const,
    focalPoint: 'center' as const,
  },
  {
    src: '/images/hero/photo_32.jpg',
    alt: 'مراتع سرسبز کوهستانی و زنبورداری سنتی',
    deviceTarget: 'all' as const,
    focalPoint: 'center' as const,
  },
  {
    src: '/images/hero/photo_33.jpg',
    alt: 'زنبورداران پرتلاش و متعهد باباخُرم',
    deviceTarget: 'all' as const,
    focalPoint: 'center' as const,
  },
  {
    src: '/images/hero/photo_34.jpg',
    alt: 'برداشت مستقیم عسل خالص از شان',
    deviceTarget: 'all' as const,
    focalPoint: 'center' as const,
  },
  {
    src: '/images/hero/photo_36.jpg',
    alt: 'کلونی‌های فعال زنبور عسل در طبیعت بکر',
    deviceTarget: 'all' as const,
    focalPoint: 'center' as const,
  },
  {
    src: '/images/hero/photo_37.jpg',
    alt: 'عسل کوهستان با بالاترین درجه خلوص و اصالت',
    deviceTarget: 'all' as const,
    focalPoint: 'center' as const,
  },
  {
    src: '/images/hero/photo_38.jpg',
    alt: 'شهد ناب و طبیعی دامنه کوهستان',
    deviceTarget: 'all' as const,
    focalPoint: 'center' as const,
  },
];

export interface HeroSliderImage {
  url?: string;
  src?: string;
  alt?: string;
  deviceTarget?: 'all' | 'desktop' | 'mobile';
  focalPoint?: 'center' | 'top' | 'bottom' | 'left' | 'right';
}

export interface HeroSliderProps {
  images?: HeroSliderImage[];
  title?: string;
  subtitle?: string;
}

const FOCAL_POINT_CLASS: Record<string, string> = {
  center: 'object-center',
  top: 'object-top',
  bottom: 'object-bottom',
  left: 'object-left',
  right: 'object-right',
};

const FOCAL_POINT_STYLE: Record<string, string> = {
  center: 'center center',
  top: 'center top',
  bottom: 'center bottom',
  left: 'left center',
  right: 'right center',
};

export function HeroSlider({
  images,
  title = 'عسل خالص و طبیعی باباخُرم',
  subtitle = 'برداشت مستقیم از بهترین مراتع ییلاقی ارسباران، با حفظ ۱۰۰٪ خواص زیستی و دارویی',
}: HeroSliderProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Viewport detection (< 768px as mobile, >= 768px as desktop)
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const handleMediaChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };
    setIsMobile(mql.matches);

    if (mql.addEventListener) {
      mql.addEventListener('change', handleMediaChange);
      return () => mql.removeEventListener('change', handleMediaChange);
    } else {
      mql.addListener(handleMediaChange);
      return () => mql.removeListener(handleMediaChange);
    }
  }, []);

  const allSlides =
    images && images.length > 0
      ? images.map((img) => ({
          src: img.url || img.src || '/images/hero/photo_35.jpg',
          alt: img.alt || title,
          deviceTarget: img.deviceTarget || 'all',
          focalPoint: img.focalPoint || 'center',
        }))
      : DEFAULT_HERO_IMAGES;

  // Filter slides based on viewport width, fallback to all slides so slider is never empty
  const slideImages = (() => {
    if (isMobile === null) {
      return allSlides;
    }
    const filtered = allSlides.filter((img) => {
      if (img.deviceTarget === 'all') return true;
      if (isMobile && img.deviceTarget === 'mobile') return true;
      if (!isMobile && img.deviceTarget === 'desktop') return true;
      return false;
    });
    return filtered.length > 0 ? filtered : allSlides;
  })();

  // Keep active slide in bounds if filtered length changes
  useEffect(() => {
    if (currentSlide >= slideImages.length) {
      setCurrentSlide(0);
    }
  }, [slideImages.length, currentSlide]);

  useEffect(() => {
    if (slideImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideImages.length);
    }, 6500);

    return () => clearInterval(interval);
  }, [slideImages.length]);

  return (
    <section
      className="relative min-h-[520px] sm:min-h-[580px] lg:min-h-[640px] overflow-hidden flex items-center justify-center text-center px-4 py-24 bg-[#2C1D11]"
      aria-labelledby="hero-heading"
    >
      {/* Background Images with Blur + Fade Out/In & Ken Burns Zoom */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        {slideImages.map((img, idx) => {
          const isActive = idx === currentSlide;
          const focalClass = FOCAL_POINT_CLASS[img.focalPoint] || 'object-center';
          const focalStyle = FOCAL_POINT_STYLE[img.focalPoint] || 'center center';

          return (
            <div
              key={`${img.src}-${idx}`}
              className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out ${
                isActive
                  ? 'opacity-100 blur-0 scale-100 z-1'
                  : 'opacity-0 blur-md scale-105 z-0'
              }`}
            >
              <img
                src={img.src}
                alt={img.alt}
                className={`hero-bg-image absolute inset-0 w-full h-full object-cover ${focalClass}`}
                style={{ objectPosition: focalStyle }}
                loading={idx === 0 ? 'eager' : 'lazy'}
                width={1600}
                height={700}
              />
            </div>
          );
        })}
      </div>

      {/* Hero Content (Strictly Title, Subtitle, and Two Primary Buttons) */}
      <div className="relative z-20 max-w-4xl mx-auto text-white space-y-6 sm:space-y-8">
        <h1
          id="hero-heading"
          className="hero-title-white text-3xl sm:text-5xl lg:text-7xl font-black !text-white leading-tight tracking-tight"
          style={{
            color: '#ffffff',
            textShadow: '2px 2px 4px rgba(0,0,0,0.9), 0 0 16px rgba(0,0,0,0.8)',
          }}
        >
          {title}
        </h1>

        {subtitle && (
          <p
            className="hero-subtitle-white text-base sm:text-xl lg:text-2xl !text-white max-w-2xl mx-auto leading-relaxed font-bold"
            style={{
              color: '#ffffff',
              textShadow: '2px 2px 4px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.7)',
            }}
          >
            {subtitle}
          </p>
        )}

        {/* Call to action buttons */}
        <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <PillButton variant="gold" size="lg" href="/products" className="shadow-2xl font-black text-base px-8 py-3.5">
            خرید عسل طبیعی و خام
          </PillButton>
          <PillButton variant="orange" size="lg" href="/recipes" className="font-bold text-base px-6 py-3.5 shadow-xl">
            دستورهای اختصاصی عسل
          </PillButton>
        </div>
      </div>
    </section>
  );
}
