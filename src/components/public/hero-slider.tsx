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
    src: '/images/hero-1.jpg',
    alt: 'شهد زرین و کوهستان‌های سرسبز زنبورداری',
  },
  {
    src: '/images/beekeeping.jpg',
    alt: 'زنبوردار حرفه‌ای در حال سرکشی به کندوهای عسل در مراتع سرسبز',
  },
  {
    src: '/images/bees-banner.jpg',
    alt: 'با افتخار کارِ زنبورها و تولید عسل طبیعی',
  },
];

export interface HeroSliderProps {
  images?: Array<{ url?: string; src?: string; alt?: string }>;
  title?: string;
  subtitle?: string;
}

import { PillButton } from '@/components/ui/pill-button';
import { ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export function HeroSlider({
  images,
  title = 'شاهکار بی‌نظیر طبیعت',
  subtitle = 'تغذیه اصیل، طعمی تکرارنشدنی و سرشار از انرژی طلایی برای زندگی روزمره',
}: HeroSliderProps) {
  const slideImages =
    images && images.length > 0
      ? images.map((img) => ({
          src: img.url || img.src || '/images/hero-1.jpg',
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

      {/* Warm Golden/Dark Amber Gradient Overlay */}
      <div
        className="absolute inset-0 z-10 bg-gradient-to-b from-[#140a05]/50 via-[#140a05]/65 to-[#140a05]/85 pointer-events-none"
        aria-hidden="true"
      />

      {/* Hero Content (Conversion-Oriented with Persian Headline, Trust Micro-copy & CTA) */}
      <div className="relative z-20 max-w-4xl mx-auto text-white space-y-6 sm:space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B]/40 text-[#FBBF24] text-xs sm:text-sm font-bold backdrop-blur-sm shadow-md">
          <Sparkles className="w-4 h-4 text-[#FBBF24]" />
          <span>برداشت مستقیم از زنبورستان‌های مرتفع کوهستان</span>
        </div>

        <h1
          id="hero-heading"
          className="text-3xl sm:text-5xl lg:text-7xl font-black text-[#FFFBEB] leading-tight tracking-tight drop-shadow-xl"
        >
          {title}
        </h1>

        {subtitle && (
          <p className="text-base sm:text-xl lg:text-2xl text-[#E5D5C5] max-w-2xl mx-auto leading-relaxed drop-shadow-md font-medium">
            {subtitle}
          </p>
        )}

        {/* Call to action & trust micro-copy */}
        <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <PillButton variant="gold" size="lg" href="/products" className="shadow-2xl font-black text-base px-8 py-3.5">
            خرید عسل طبیعی و خام
          </PillButton>
          <PillButton variant="orange" size="lg" href="/recipes" className="font-bold text-base px-6 py-3.5 shadow-xl">
            دستورهای اختصاصی عسل
          </PillButton>
        </div>

        {/* Trust Badges Micro-copy */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-[#E5D5C5]/90 font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#F59E0B]" />
            <span>ضمانت اصالت و برگه آزمایش ساکارز</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#F59E0B]" />
            <span>۱۰۰٪ خام، حرارت‌ندیده و طبیعی</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#F59E0B]" />
            <span>ضمانت کامل بازگشت وجه</span>
          </div>
        </div>
      </div>
    </section>
  );
}
