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
import { ContentCard } from '@/components/ui/content-card';
import { PillButton } from '@/components/ui/pill-button';
import { useCartStore } from '@/lib/cart-store';
import { toPersianDigits, ServingTypeValue } from '@/lib/domain-utils';
import { ShoppingCart, Check, Sparkles } from 'lucide-react';
import type { RecipeCardViewModel } from '@/server/queries/recipes';

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

  return (
    <WoodBackground className="py-12 sm:py-20 min-h-screen">
      <Container size="narrow" className="text-center space-y-10 sm:space-y-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="مسیر راهنما" className="flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-[#E5D5C5]">
          <Link href="/" className="hover:text-[#FBBF24] transition-colors">
            صفحه اصلی
          </Link>
          <span className="text-white/40" aria-hidden="true">/</span>
          <Link href="/recipes" className="hover:text-[#FBBF24] transition-colors">
            دستورها و دسرها
          </Link>
          <span className="text-white/40" aria-hidden="true">/</span>
          <span className="text-[#FBBF24] font-black truncate max-w-[200px]">
            {recipe.nameFa}
          </span>
        </nav>

        {/* 1. Main Image */}
        <div className="max-w-md mx-auto aspect-4/3 rounded-none overflow-hidden border-2 border-white/20 shadow-2xl bg-black/20 flex items-center justify-center">
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

        {/* 2. Titles */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-5xl font-black text-[#FFFBEB] drop-shadow-md leading-tight">
            {recipe.nameFa}
          </h1>
          {recipe.nameOriginal && (
            <p className="text-sm sm:text-base text-[#D4C3B3] font-mono tracking-wide drop-shadow-sm" dir="ltr">
              {recipe.nameOriginal}
            </p>
          )}
        </div>

        {/* 3. Meta Area: Country, Serving Chips, Yield */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-xl mx-auto">
          {recipe.country && recipe.country.trim().length > 0 && (
            <div className="px-3.5 py-1.5 bg-black/40 border border-white/25 text-[#E5D5C5] text-xs sm:text-sm rounded-none shadow-sm font-bold">
              <span className="text-[#FBBF24] font-black ml-1.5">خاستگاه:</span>
              <span>{recipe.country}</span>
            </div>
          )}

          {recipe.servingTypes && recipe.servingTypes.length > 0 && (
            recipe.servingTypes.map((st) => (
              <div
                key={st}
                className="px-3.5 py-1.5 bg-[#E08B38]/40 border border-[#E08B38]/60 text-white text-xs sm:text-sm font-black rounded-none shadow-sm"
              >
                {SERVING_LABELS[st] || st}
              </div>
            ))
          )}

          {recipe.yieldText && recipe.yieldText.trim().length > 0 && (
            <div className="px-3.5 py-1.5 bg-black/40 border border-white/25 text-[#E5D5C5] text-xs sm:text-sm rounded-none shadow-sm font-bold">
              <span className="text-[#FBBF24] font-black ml-1.5">مقدار بازدهی:</span>
              <span>{recipe.yieldText}</span>
            </div>
          )}
        </div>

        {/* [UX-03] Recipe-to-Product Bridge: Recommended Honey Pairing Card */}
        <div className="max-w-2xl mx-auto p-5 sm:p-6 bg-black/40 border-2 border-[#F59E0B] rounded-none shadow-2xl text-right space-y-4">
          <div className="flex items-center justify-between border-b border-white/15 pb-3">
            <div className="flex items-center gap-2 text-[#FFFBEB] font-black text-sm sm:text-base">
              <Sparkles className="w-5 h-5 text-[#F59E0B]" />
              <span>عسل پیشنهادی سرآشپز برای این دستور</span>
            </div>
            <span className="text-xs text-[#FBBF24] font-bold">بسته‌بندی شیشه‌ای</span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-black text-[#FFFBEB]">
                {recommendedHoney.name}
              </h3>
              <p className="text-xs sm:text-sm text-[#E5D5C5] font-medium leading-relaxed">
                طعم ملایم، طبع معتدل و بافت مخملی این عسل طعم نوشیدنی و دسر را بدون تلخی یا شیرینی زننده تکمیل می‌کند.
              </p>
            </div>

            <div className="shrink-0 w-full sm:w-auto">
              <PillButton
                variant="gold"
                size="md"
                onClick={handleAddHoneyToCart}
                className="w-full sm:w-auto font-black text-xs sm:text-sm justify-center shadow-lg"
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

        {/* 4. Optional Descriptions */}
        {(recipe.shortDescription || recipe.longDescription) && (
          <div className="max-w-2xl mx-auto space-y-4 text-[#E5D5C5] leading-relaxed text-sm sm:text-base bg-black/40 p-6 sm:p-8 border border-white/20 rounded-none shadow-lg text-right">
            {recipe.shortDescription && (
              <p className="font-black text-[#FBBF24] text-base sm:text-lg">
                {recipe.shortDescription}
              </p>
            )}
            {recipe.longDescription && (
              <div className="whitespace-pre-line text-[#FFFBEB] font-medium leading-loose">
                {recipe.longDescription}
              </div>
            )}
          </div>
        )}

        {/* 5. Ingredients */}
        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <div className="max-w-2xl mx-auto text-right space-y-6 bg-black/40 p-6 sm:p-8 border border-white/20 rounded-none shadow-lg">
            <h2 className="text-2xl font-black text-[#FFFBEB] text-center drop-shadow-sm">
              مواد لازم
            </h2>
            <div className="divide-y divide-white/10">
              {recipe.ingredients.map((ing, idx) => (
                <div
                  key={ing.id || idx}
                  className="py-3 flex flex-wrap items-center justify-between gap-3 text-sm sm:text-base"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#FBBF24] shrink-0" />
                    <span className="font-black text-white">{ing.name}</span>
                    {ing.isOptional && (
                      <span className="text-xs text-[#FBBF24] font-normal">
                        (اختیاری)
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#E5D5C5] font-bold">
                    {(ing.quantityText || ing.unit) && (
                      <span className="bg-black/30 px-2 py-0.5 border border-white/10 text-[#FDFBF8]">
                        {[ing.quantityText, ing.unit].filter(Boolean).join(' ')}
                      </span>
                    )}
                    {ing.equivalentText && (
                      <span className="text-white/70">
                        ({ing.equivalentText})
                      </span>
                    )}
                    {ing.note && (
                      <span className="text-[#FBBF24] italic text-xs">
                        - {ing.note}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. Steps */}
        {recipe.steps && recipe.steps.length > 0 && (
          <div className="max-w-2xl mx-auto text-right space-y-6 bg-black/40 p-6 sm:p-8 border border-white/20 rounded-none shadow-lg">
            <h2 className="text-2xl font-black text-[#FFFBEB] text-center drop-shadow-sm">
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
                    className="flex items-start gap-4 p-4 bg-black/30 border border-white/10"
                  >
                    <div className="w-8 h-8 rounded-none bg-[#FBBF24] text-[#2B2017] font-black flex items-center justify-center shrink-0 text-sm shadow">
                      {toPersianDigits(idx + 1)}
                    </div>
                    <div className="flex-1 text-sm sm:text-base text-[#FFFBEB] leading-relaxed pt-0.5 whitespace-pre-line font-medium">
                      {stepText}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 7. Gallery */}
        {recipe.gallery && recipe.gallery.length > 0 && (
          <div className="space-y-6 pt-4">
            <h2 className="text-xl sm:text-2xl font-black text-[#FBBF24]">
              تصاویر مراحل و آماده‌سازی
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {recipe.gallery.map((item) => (
                <div
                  key={item.id}
                  className="aspect-square bg-black/20 border border-white/20 overflow-hidden shadow-md"
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

        {/* 8. Related Items */}
        {relatedRecipes && relatedRecipes.length > 0 && (
          <div className="pt-12 sm:pt-16 space-y-8 border-t border-white/15">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-[#FFFBEB]">
                دسرهای مشابه و پیشنهادی
              </h2>
              <p className="text-xs sm:text-sm text-[#E5D5C5]">
                پیشنهادهای خوش‌طعم دیگر از خانواده دسرهای عسل باباخُرم
              </p>
            </div>

            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-right">
              {relatedRecipes.map((rel, idx) => (
                <ContentCard
                  key={rel.id}
                  title={rel.title}
                  subtitle={rel.subtitle}
                  href={rel.href}
                  imageAsset={rel.imageAsset}
                  imageUrl={rel.imageUrl || (rel.imageAsset ? null : '/images/recipe-1.jpg')}
                  theme={rel.theme}
                  slug={rel.slug}
                  linkLabel={rel.linkLabel}
                  variant="vertical"
                  index={idx}
                />
              ))}
            </div>

            <div className="md:hidden space-y-4 text-right">
              {relatedRecipes.map((rel, idx) => (
                <ContentCard
                  key={rel.id}
                  title={rel.title}
                  subtitle={rel.subtitle}
                  href={rel.href}
                  imageAsset={rel.imageAsset}
                  imageUrl={rel.imageUrl || (rel.imageAsset ? null : '/images/recipe-1.jpg')}
                  theme={rel.theme}
                  slug={rel.slug}
                  linkLabel={rel.linkLabel}
                  variant="horizontal"
                  index={idx}
                />
              ))}
            </div>
          </div>
        )}
      </Container>
    </WoodBackground>
  );
}
