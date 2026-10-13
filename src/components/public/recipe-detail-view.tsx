'use client';

/**
 * RecipeDetailView Component
 *
 * Implements:
 * - [UX-03] Recipe-to-Product Bridge: Embedded recommended honey card with 1-click "افزودن عسل پیشنهادی به سبد خرید".
 * - Color Palette Harmonization: Warm Ivory & Amber text over wood (no neon green).
 * - Deterministic card theme rotation on related recipes.
 * - Sharp 90-degree geometric identity (rounded-none).
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { WoodBackground } from '@/components/ui/wood-background';
import { Container } from '@/components/ui/container';
import { Picture } from '@/components/ui/picture';
import { PillButton } from '@/components/ui/pill-button';
import { useCartStore } from '@/lib/cart-store';
import { toPersianDigits, ServingTypeValue, getCardThemeForSlug } from '@/lib/domain-utils';
import { ShoppingCart, Check, Sparkles } from 'lucide-react';
import type { RecipeCardViewModel } from '@/server/queries/recipes';

const THEME_BREADCRUMB_COLORS: Record<string, { primary: string; hover: string; muted: string }> = {
  GREEN: {
    primary: 'text-[#4CA849]',
    hover: 'hover:text-[#4CA849]',
    muted: 'text-[#4CA849]/70',
  },
  ORANGE: {
    primary: 'text-[#E08B38]',
    hover: 'hover:text-[#E08B38]',
    muted: 'text-[#E08B38]/70',
  },
  YELLOW: {
    primary: 'text-[#F5A623]',
    hover: 'hover:text-[#F5A623]',
    muted: 'text-[#F5A623]/70',
  },
  BURGUNDY: {
    primary: 'text-[#9E3556]',
    hover: 'hover:text-[#9E3556]',
    muted: 'text-[#9E3556]/70',
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
  const { actions } = useCartStore();
  const [honeyAdded, setHoneyAdded] = useState(false);

  // Recommended authentic honey pairing for this recipe
  const recommendedHoney = {
    id: 'prod-1',
    name: 'عسل طبیعی گون کوهستان باباخُرم',
    slug: 'mountain-astragalus-honey',
    weight: '۱ کیلوگرمی',
    optionId: 'opt_prod-1_1kg',
  };

  const handleAddHoneyToCart = () => {
    const res = actions.addItem({
      productId: recommendedHoney.id,
      optionId: recommendedHoney.optionId,
      qty: 1,
    });
    if (res.success) {
      setHoneyAdded(true);
      setTimeout(() => setHoneyAdded(false), 3000);
    }
  };

  const rawTheme = (recipe.cardTheme || 'AUTO').toUpperCase();
  const resolvedThemeKey = rawTheme === 'AUTO' || !THEME_BREADCRUMB_COLORS[rawTheme] ? getCardThemeForSlug(recipe.slug) : rawTheme;
  const themeColors = THEME_BREADCRUMB_COLORS[resolvedThemeKey] || THEME_BREADCRUMB_COLORS.GREEN;

  return (
    <WoodBackground className="py-12 sm:py-20 min-h-screen">
      <Container size="narrow" className="space-y-10 sm:space-y-12">
        {/* Breadcrumb Navigation - Transparent with dynamic theme primary color */}
        <div className="flex justify-center">
          <nav
            aria-label="مسیر راهنما"
            className="flex items-center gap-2 text-xs sm:text-sm font-black bg-transparent"
          >
            <Link href="/" className={`${themeColors.primary} hover:underline underline-offset-4 transition-colors`}>
              صفحه اصلی
            </Link>
            <span className={themeColors.muted} aria-hidden="true">/</span>
            <Link href="/recipes" className={`${themeColors.primary} hover:underline underline-offset-4 transition-colors`}>
              دستورها و دسرها
            </Link>
            <span className={themeColors.muted} aria-hidden="true">/</span>
            <span className={`${themeColors.primary} truncate max-w-[200px]`}>
              {recipe.nameFa}
            </span>
          </nav>
        </div>

        {/* 1. Editorial Hero Card (Warm Artisan Paper Showcase) */}
        <div className="max-w-3xl mx-auto bg-white border border-[#EFE9E0] p-6 sm:p-10 rounded-none shadow-md space-y-6 text-center">
          {/* Recipe Photography */}
          <div className="max-w-md mx-auto aspect-4/3 rounded-none overflow-hidden border-4 border-[#FAF7F2] shadow-md bg-[#FAF7F2] flex items-center justify-center">
            {recipe.mainImage ? (
              <Picture
                asset={recipe.mainImage}
                width={recipe.mainImage.width ?? 800}
                height={recipe.mainImage.height ?? 600}
                blurDataUrl={recipe.mainImage.blurDataUrl}
                alt={recipe.nameFa}
                priority={true}
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src="/images/recipe-1.jpg"
                alt={recipe.nameFa}
                className="w-full h-full object-cover"
              />
            )}
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

        {/* 2. [UX-03] Chef's Recommended Honey Box (Parchment Card) */}
        <div className="max-w-3xl mx-auto p-5 sm:p-6 bg-gradient-to-l from-[#FFFBEB] to-[#FEF3C7] border border-[#F59E0B]/40 rounded-none shadow-sm text-right space-y-4">
          <div className="flex items-center justify-between border-b border-[#FDE68A] pb-3">
            <div className="flex items-center gap-2 text-[#2B2017] font-black text-sm sm:text-base">
              <Sparkles className="w-5 h-5 text-[#D97706]" />
              <span>عسل پیشنهادی سرآشپز برای این دستور</span>
            </div>
            <span className="text-xs text-[#92400E] font-black bg-white px-2.5 py-0.5 border border-[#FDE68A] rounded-full">
              بسته‌بندی شیشه‌ای
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-black text-[#2B2017]">
                {recommendedHoney.name}
              </h3>
              <p className="text-xs sm:text-sm text-[#5C5248] font-medium leading-relaxed">
                طعم ملایم، طبع معتدل و بافت مخملی این عسل طعم نوشیدنی و دسر را بدون تلخی یا شیرینی زننده تکمیل می‌کند.
              </p>
            </div>

            <div className="shrink-0 w-full sm:w-auto">
              <PillButton
                variant="gold"
                size="md"
                onClick={handleAddHoneyToCart}
                className="w-full sm:w-auto font-black text-xs sm:text-sm justify-center shadow-md cursor-pointer"
              >
                {honeyAdded ? (
                  <span className="flex items-center gap-1.5 text-emerald-950 font-black">
                    <Check className="w-4 h-4" />
                    به سبد افزوده شد
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <ShoppingCart className="w-4 h-4" />
                    افزودن عسل به سبد
                  </span>
                )}
              </PillButton>
            </div>
          </div>
        </div>

        {/* 3. Story & Long Description */}
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

        {/* 4. Ingredients Checklist (Clean Ivory Card) */}
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

        {/* 5. Step-by-Step Cooking Guide (Continuous Cookbook Timeline) */}
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

        {/* 6. Gallery */}
        {recipe.gallery && recipe.gallery.length > 0 && (
          <div className="space-y-6 pt-4 max-w-3xl mx-auto text-center">
            <h2 className="text-xl sm:text-2xl font-black text-[#FFFBEB] drop-shadow-sm">
              تصاویر مراحل و آماده‌سازی
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {recipe.gallery.map((item) => (
                <div
                  key={item.id}
                  className="aspect-square bg-[#FAF7F2] border-2 border-white/30 overflow-hidden shadow-md rounded-none"
                >
                  <Picture
                    asset={item.asset}
                    width={400}
                    height={400}
                    alt={recipe.nameFa}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

      </Container>
    </WoodBackground>
  );
}
