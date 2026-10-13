/**
 * HeroSlider Component (Authentic honey.com Fidelity)
 * Features:
 * - Slideshow rotating between high-resolution nature/honey images every 6-7 seconds.
 * - Smooth transition: image blurs and fades out, next image fades in with crisp focus.
 * - Continuous slow Ken Burns zoom animation.
 * - Strictly NO buttons in hero section.
 * - Indicator dots completely removed per user requirement.
 * - Accepts dynamic images, title, subtitle from CMS or defaults.
 */

'use client';

import React, { useState, useEffect } from 'react';

const DEFAULT_HERO_IMAGES = [
  {
    src: '/images/hero/photo_35.jpg',
    alt: 'شهد زرین و کندوهای عسل طبیعی باباخُرم',
  },
  {
    src: '/images/hero/photo_32.jpg',
    alt: 'مراتع سرسبز کوهستانی و زنبورداری سنتی',
  },
  {
    src: '/images/hero/photo_33.jpg',
    alt: 'زنبورداران پرتلاش و متعهد باباخُرم',
  },
  {
    src: '/images/hero/photo_34.jpg',
    alt: 'برداشت مستقیم عسل خالص از شان',
  },
  {
    src: '/images/hero/photo_36.jpg',
    alt: 'کلونی‌های فعال زنبور عسل در طبیعت بکر',
  },
  {
    src: '/images/hero/photo_37.jpg',
    alt: 'عسل کوهستان با بالاترین درجه خلوص و اصالت',
  },
  {
    src: '/images/hero/photo_38.jpg',
    alt: 'شهد ناب و طبیعی دامنه کوهستان',
  },
];

export interface HeroSliderProps {
  images?: Array<{ url?: string; src?: string; alt?: string }>;
  title?: string;
  subtitle?: string;
}

import { PillButton } from '@/components/ui/pill-button';

export function HeroSlider({
  images,
  title = 'عسل خالص و طبیعی باباخُرم',
  subtitle = 'برداشت مستقیم از بهترین مراتع ییلاقی ارسباران، با حفظ ۱۰۰٪ خواص زیستی و دارویی',
}: HeroSliderProps) {
  const slideImages =
    images && images.length > 0
      ? images.map((img) => ({
          src: img.url || img.src || '/images/hero/photo_35.jpg',
          alt: img.alt || title,
        }))
      : DEFAULT_HERO_IMAGES;

  const [currentSlide, setCurrentSlide] = useState(0);

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
                className="hero-bg-image absolute inset-0 w-full h-full object-cover object-center"
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
          className="text-3xl sm:text-5xl lg:text-7xl font-black text-white leading-tight tracking-tight"
          style={{
            textShadow: '2px 2px 4px rgba(0,0,0,0.85), 0 0 16px rgba(0,0,0,0.7)',
          }}
        >
          {title}
        </h1>

        {subtitle && (
          <p
            className="text-base sm:text-xl lg:text-2xl text-white max-w-2xl mx-auto leading-relaxed font-bold"
            style={{
              textShadow: '2px 2px 4px rgba(0,0,0,0.85), 0 0 10px rgba(0,0,0,0.6)',
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
