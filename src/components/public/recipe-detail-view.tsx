'use client';

/**
 * RecipeDetailView Component
 *
 * Implements:
 * - Editorial Recipe Presentation (Artisan Paper Showcase, Ingredients Checklist, Cookbook Steps, Gallery)
 * - Auto-scrolling Related Recipes Carousel
 * - Color Palette Harmonization: Dark contrast text over light wood
 * - Sharp 90-degree geometric identity (rounded-none)
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { WoodBackground } from '@/components/ui/wood-background';
import { Container } from '@/components/ui/container';
import { Picture } from '@/components/ui/picture';
import { InteractiveMediaGallery } from '@/components/public/interactive-media-gallery';
import { ImageLightboxModal } from '@/components/admin/image-lightbox-modal';
import { RecipeCarousel } from '@/components/public/recipe-carousel';
import { toPersianDigits, ServingTypeValue, resolveItemCardTheme } from '@/lib/domain-utils';
import { ZoomIn } from 'lucide-react';
import type { RecipeCardViewModel } from '@/server/queries/recipes';

const THEME_BREADCRUMB_COLORS: Record<string, { primary: string; hover: string; muted: string; hex: string }> = {
  GREEN: {
    primary: 'text-[#4CA849]',
    hover: 'hover:text-[#4CA849]',
    muted: 'text-[#4CA849]/70',
    hex: '#4CA849',
  },
  ORANGE: {
    primary: 'text-[#E08B38]',
    hover: 'hover:text-[#E08B38]',
    muted: 'text-[#E08B38]/70',
    hex: '#E08B38',
  },
  YELLOW: {
    primary: 'text-[#F5A623]',
    hover: 'hover:text-[#F5A623]',
    muted: 'text-[#F5A623]/70',
    hex: '#F5A623',
  },
  BURGUNDY: {
    primary: 'text-[#9E3556]',
    hover: 'hover:text-[#9E3556]',
    muted: 'text-[#9E3556]/70',
    hex: '#9E3556',
  },
};

export interface RecipeDetailViewProps {
  recipe: {
    id: string;
    slug: string;
    nameFa: string;
    nameOriginal?: string | null;
    status: string;
    country?: string | null;
    servingTypes: ServingTypeValue[];
    yieldText?: string | null;
    isFeatured: boolean;
    cardTheme: any;
    shortDescription?: string | null;
    longDescription?: string | null;
    mainImage?: any;
    categories?: any[];
    ingredients?: Array<{
      id?: string;
      name: string;
      quantityText?: string | null;
      unit?: string | null;
      equivalentText?: string | null;
      isOptional?: boolean;
      note?: string | null;
      sortOrder?: number;
    }>;
    steps?: Array<string | { id?: string; text?: string; sortOrder?: number }>;
    gallery?: Array<{ id: string; asset: any; sortOrder: number }>;
  };
  relatedRecipes?: RecipeCardViewModel[];
  isAdminPreview?: boolean;
}

const SERVING_LABELS: Record<ServingTypeValue, string> = {
  HOT: 'سرو گرم',
  COLD: 'سرو سرد',
  WARM: 'سرو ولرم',
};

export function RecipeDetailView({
  recipe,
  relatedRecipes = [],
  isAdminPreview = false,
}: RecipeDetailViewProps) {
  const [lightboxSlide, setLightboxSlide] = useState<{ url: string; alt?: string | null; width?: number | null; height?: number | null } | null>(null);
  const resolvedThemeKey = resolveItemCardTheme(recipe);
  const themeColors = THEME_BREADCRUMB_COLORS[resolvedThemeKey] || THEME_BREADCRUMB_COLORS.GREEN;

  return (
    <WoodBackground className="py-12 sm:py-20 min-h-screen">
      <Container size="narrow" className="space-y-10 sm:space-y-12">
        {/* Breadcrumb Navigation - Transparent with dynamic theme primary color matching its card */}
        <div className="flex justify-center">
          <nav
            aria-label="مسیر راهنما"
            className="flex items-center gap-2 text-xs sm:text-sm font-black bg-transparent"
          >
            <Link
              href="/"
              style={{ color: themeColors.hex }}
              className="hover:underline underline-offset-4 transition-colors font-black"
            >
              صفحه اصلی
            </Link>
            <span style={{ color: themeColors.hex, opacity: 0.7 }} aria-hidden="true">/</span>
            <Link
              href="/recipes"
              style={{ color: themeColors.hex }}
              className="hover:underline underline-offset-4 transition-colors font-black"
            >
              دستورها و دسرها
            </Link>
            <span style={{ color: themeColors.hex, opacity: 0.7 }} aria-hidden="true">/</span>
            <span
              style={{ color: themeColors.hex }}
              className="truncate max-w-[200px] font-black"
            >
              {recipe.nameFa}
            </span>
          </nav>
        </div>

        {/* 1. Editorial Hero Card (Warm Artisan Paper Showcase) */}
        <div className="max-w-3xl mx-auto bg-white border border-[#EFE9E0] p-6 sm:p-10 rounded-none shadow-md space-y-6 text-center">
          {/* Interactive Recipe Photography & Gallery */}
          <div className="max-w-xl mx-auto w-full">
            <InteractiveMediaGallery
              mainImage={recipe.mainImage}
              gallery={recipe.gallery}
              fallbackImageUrl={(recipe as any).imageUrl || '/images/recipe-1.jpg'}
              title={recipe.nameFa}
              aspectRatio="aspect-[4/3]"
            />
          </div>

          {/* Titles */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black text-[#2B2017] leading-tight">
              {recipe.nameFa}
            </h1>
            {recipe.nameOriginal && (
              <p className="text-xs sm:text-sm text-[#786455] font-mono tracking-wide" dir="ltr">
                {recipe.nameOriginal}
              </p>
            )}
          </div>

          {/* Metadata Badges on Warm Ivory Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            {recipe.country && recipe.country.trim().length > 0 && (
              <div className="px-3.5 py-1.5 bg-[#FFFBEB] border border-[#FDE68A] text-[#2B2017] text-xs sm:text-sm rounded-full font-bold shadow-2xs">
                <span className="text-[#B45309] font-black ml-1.5">خاستگاه:</span>
                <span>{recipe.country}</span>
              </div>
            )}

            {recipe.servingTypes && recipe.servingTypes.length > 0 && (
              recipe.servingTypes.map((st) => (
                <div
                  key={st}
                  className="px-3.5 py-1.5 bg-[#FEF3C7] border border-[#F59E0B] text-[#92400E] text-xs sm:text-sm font-black rounded-full shadow-2xs"
                >
                  {SERVING_LABELS[st] || st}
                </div>
              ))
            )}

            {recipe.yieldText && recipe.yieldText.trim().length > 0 && (
              <div className="px-3.5 py-1.5 bg-[#FFFBEB] border border-[#FDE68A] text-[#2B2017] text-xs sm:text-sm rounded-full font-bold shadow-2xs">
                <span className="text-[#B45309] font-black ml-1.5">مقدار بازدهی:</span>
                <span>{recipe.yieldText}</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. Story & Long Description */}
        {(recipe.shortDescription || recipe.longDescription) && (
          <div className="max-w-3xl mx-auto space-y-4 text-right bg-white p-6 sm:p-8 border border-[#EFE9E0] rounded-none shadow-sm">
            {recipe.shortDescription && (
              <p className="font-black text-[#B45309] text-base sm:text-lg border-b border-[#FDE68A] pb-3">
                {recipe.shortDescription}
              </p>
            )}
            {recipe.longDescription && (
              <div className="whitespace-pre-line text-[#332115] font-medium leading-loose text-sm sm:text-base">
                {recipe.longDescription}
              </div>
            )}
          </div>
        )}

        {/* 3. Ingredients Checklist (Clean Ivory Card) */}
        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <div className="max-w-3xl mx-auto text-right space-y-6 bg-white p-6 sm:p-8 border border-[#EFE9E0] rounded-none shadow-sm">
            <h2 className="text-2xl font-black text-[#2B2017] text-center border-b border-[#EFE9E0] pb-4">
              مواد لازم
            </h2>
            <div className="divide-y divide-[#EFE9E0]">
              {recipe.ingredients.map((ing, idx) => (
                <div
                  key={ing.id || idx}
                  className="py-3.5 flex flex-wrap items-center justify-between gap-3 text-sm sm:text-base"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D97706] shrink-0" />
                    <span className="font-black text-[#2B2017]">{ing.name}</span>
                    {ing.isOptional && (
                      <span className="text-xs text-[#B45309] font-bold">
                        (اختیاری)
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#5C5248] font-bold">
                    {(ing.quantityText || ing.unit) && (
                      <span className="bg-[#FFFBEB] px-3 py-1 border border-[#FDE68A] text-[#92400E] font-black rounded-none">
                        {[ing.quantityText, ing.unit].filter(Boolean).join(' ')}
                      </span>
                    )}
                    {ing.equivalentText && (
                      <span className="text-[#786455]">
                        ({ing.equivalentText})
                      </span>
                    )}
                    {ing.note && (
                      <span className="text-[#D97706] font-bold">
                        - {ing.note}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Step-by-Step Cooking Guide (Continuous Cookbook Timeline) */}
        {recipe.steps && recipe.steps.length > 0 && (
          <div className="max-w-3xl mx-auto text-right space-y-6 bg-white p-6 sm:p-10 border border-[#EFE9E0] rounded-none shadow-sm">
            <h2 className="text-2xl font-black text-[#2B2017] text-center border-b border-[#EFE9E0] pb-4">
              دستور تهیه گام‌به‌گام
            </h2>
            <div className="space-y-4">
              {recipe.steps.map((step, idx) => {
                const stepText =
                  typeof step === 'string'
                    ? step
                    : (step?.text || '');
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-4 p-4 sm:p-5 bg-[#FAF7F2] border border-[#EFE9E0] rounded-none"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#FEF3C7] text-[#92400E] font-black border border-[#F59E0B] flex items-center justify-center shrink-0 shadow-2xs text-sm">
                      {toPersianDigits(idx + 1)}
                    </div>
                    <div className="flex-1 text-[#332115] text-base leading-relaxed pt-1 whitespace-pre-line font-medium">
                      {stepText}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. Gallery */}
        {recipe.gallery && recipe.gallery.length > 0 && (
          <div className="space-y-6 pt-4 max-w-3xl mx-auto text-center">
            <h2 className="text-xl sm:text-2xl font-black text-[#2B2017] drop-shadow-sm">
              تصاویر مراحل و آماده‌سازی
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {recipe.gallery.map((item, idx) => {
                const asset = item.asset || item;
                const imgUrl = asset.url || (asset.storageKey ? `/uploads/${asset.storageKey}` : '/images/recipe-1.jpg');
                return (
                  <div
                    key={item.id || idx}
                    onClick={() => setLightboxSlide({ url: imgUrl, alt: asset.alt || recipe.nameFa, width: asset.width, height: asset.height })}
                    className="aspect-square bg-[#FAF7F2] border-2 border-white/30 overflow-hidden shadow-md rounded-none relative group cursor-zoom-in"
                    role="button"
                    tabIndex={0}
                    title="کلیک برای بزرگنمایی تصویر"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setLightboxSlide({ url: imgUrl, alt: asset.alt || recipe.nameFa, width: asset.width, height: asset.height });
                      }
                    }}
                  >
                    <Picture
                      asset={asset}
                      width={400}
                      height={400}
                      alt={recipe.nameFa}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 pointer-events-none">
                      <ZoomIn className="w-5 h-5 text-amber-300 drop-shadow-md" />
                      <span className="text-[11px] font-bold drop-shadow-md">بزرگنمایی</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Container>

      {/* Related Recipes Carousel */}
      {relatedRecipes && relatedRecipes.length > 0 && (
        <RecipeCarousel recipes={relatedRecipes} noBackground={true} />
      )}

      {/* Lightbox for Step Photos */}
      {lightboxSlide && (
        <ImageLightboxModal
          isOpen={Boolean(lightboxSlide)}
          onClose={() => setLightboxSlide(null)}
          imageUrl={lightboxSlide.url}
          alt={lightboxSlide.alt}
          dimensions={{ width: lightboxSlide.width, height: lightboxSlide.height }}
        />
      )}
    </WoodBackground>
  );
}
