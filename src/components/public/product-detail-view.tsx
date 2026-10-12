'use client';

/**
 * ProductDetailView Component
 *
 * Implements:
 * - [UX-01] Desktop 2-Column Responsive Layout (Right: Gallery & Specs, Left: Sticky Purchasing Sidebar).
 * - [UX-02] Mobile Sticky Buy-Bar.
 * - [SEC-01] Laboratory Purity & Sucrose Certificate Modal.
 * - [UI-01] Color Palette Harmonization: Warm Ivory & Amber text over wood (no neon green).
 * - Sharp 90-degree geometric identity (rounded-none).
 */

import React from 'react';
import Link from 'next/link';
import { WoodBackground } from '@/components/ui/wood-background';
import { Container } from '@/components/ui/container';
import { Picture } from '@/components/ui/picture';
import { ContentCard } from '@/components/ui/content-card';
import { AddToCartSlot } from '@/components/public/add-to-cart-slot';
import { LabCertificateModal } from '@/components/public/lab-certificate-modal';
import { MobileStickyBuyBar } from '@/components/public/mobile-sticky-buy-bar';
import { toPersianDigits } from '@/lib/domain-utils';
import { AlertTriangle, ShieldCheck, Truck, Sparkles, CheckCircle2 } from 'lucide-react';
import type { ProductCardViewModel } from '@/server/queries/products';

export interface ProductDetailViewProps {
  product: {
    id: string;
    slug: string;
    nameFa: string;
    nameOriginal?: string | null;
    status: string;
    isAvailable: boolean;
    isFeatured: boolean;
    cardTheme: any;
    shortDescription?: string | null;
    description?: string | null;
    foodNature?: string | null;
    vitamins?: string | null;
    harvestSeason?: string | null;
    harvestPlace?: string | null;
    color?: string | null;
    usageWarning?: string | null;
    mainImage?: any;
    categories?: any[];
    benefits?: Array<string | { id?: string; text?: string; sortOrder?: number }>;
    options?: any[];
    gallery?: Array<{ id: string; asset: any; sortOrder: number }>;
  };
  relatedProducts?: ProductCardViewModel[];
  isAdminPreview?: boolean;
  cartEnabled?: boolean;
}

export function ProductDetailView({
  product,
  relatedProducts = [],
  isAdminPreview = false,
  cartEnabled = true,
}: ProductDetailViewProps) {
  const metaChips = [
    { label: 'طبع غذایی', value: product.foodNature },
    { label: 'فصل برداشت', value: product.harvestSeason },
    { label: 'محل برداشت', value: product.harvestPlace },
    { label: 'ویتامین‌ها', value: product.vitamins },
    { label: 'رنگ عسل', value: product.color },
  ].filter((chip) => chip.value && chip.value.trim().length > 0);

  return (
    <WoodBackground className="py-10 sm:py-16 min-h-screen">
      <Container>
        {/* Breadcrumb Navigation */}
        <nav aria-label="مسیر راهنما" className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#E5D5C5] mb-8">
          <Link href="/" className="hover:text-[#FBBF24] transition-colors">
            صفحه اصلی
          </Link>
          <span className="text-white/40" aria-hidden="true">/</span>
          <Link href="/products" className="hover:text-[#FBBF24] transition-colors">
            محصولات
          </Link>
          <span className="text-white/40" aria-hidden="true">/</span>
          <span className="text-[#FBBF24] font-black truncate max-w-[240px]">
            {product.nameFa}
          </span>
        </nav>

        {/* [UX-01] Two-Column Desktop Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* RIGHT COLUMN (7 Cols): Gallery, Trust Certificate, Nutritional Specs & Description */}
          <div className="lg:col-span-7 space-y-8 text-right">
            {/* 1. Main High-Resolution Image (Full Jar Presentation, Zero Cropping) */}
            <div className="w-full aspect-4/3 rounded-none overflow-hidden border-2 border-white/20 shadow-2xl bg-[#FAF7F2] p-4 sm:p-6 flex items-center justify-center relative">
              {product.mainImage ? (
                <Picture
                  asset={product.mainImage}
                  width={product.mainImage.width ?? 900}
                  height={product.mainImage.height ?? 675}
                  blurDataUrl={product.mainImage.blurDataUrl}
                  alt={product.nameFa}
                  priority={true}
                  className="w-full h-full max-h-full object-contain"
                />
              ) : (
                <img
                  src="/images/honey-jar.jpg"
                  alt={product.nameFa}
                  className="w-full h-full max-h-full object-contain"
                />
              )}
              {product.isFeatured && (
                <span className="absolute top-4 right-4 bg-[#F59E0B] text-[#2B2017] text-xs font-black px-3 py-1 rounded-none shadow-md">
                  منتخب باباخُرم
                </span>
              )}
            </div>

            {/* Supplementary Gallery Thumbnails */}
            {product.gallery && product.gallery.length > 0 && (
              <div className="grid grid-cols-4 gap-3 sm:gap-4">
                {product.gallery.map((item) => (
                  <div
                    key={item.id}
                    className="aspect-square bg-[#FAF7F2] p-1.5 flex items-center justify-center border border-white/20 rounded-none overflow-hidden shadow-md"
                  >
                    <Picture
                      asset={item.asset}
                      width={300}
                      height={300}
                      alt={product.nameFa}
                      className="w-full h-full max-h-full object-contain hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* [SEC-01] Laboratory Purity & Sucrose Certificate */}
            <LabCertificateModal productName={product.nameFa} />

            {/* Nutritional Chips */}
            {metaChips.length > 0 && (
              <div className="bg-black/40 border border-white/15 p-5 rounded-none shadow-lg space-y-3">
                <h3 className="text-sm font-black text-[#FBBF24]">
                  مشخصات فیزیکی و ویژگی‌های اقلیمی:
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {metaChips.map((chip, idx) => (
                    <div
                      key={idx}
                      className="px-3.5 py-1.5 bg-black/50 border border-white/20 text-[#E5D5C5] text-xs sm:text-sm rounded-none font-bold"
                    >
                      <span className="text-[#FBBF24] font-black ml-1.5">{chip.label}:</span>
                      <span>{chip.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description & Sensory Notes */}
            {(product.shortDescription || product.description) && (
              <div className="space-y-4 text-[#E5D5C5] leading-relaxed text-sm sm:text-base bg-black/40 p-6 sm:p-8 border border-white/15 rounded-none shadow-xl">
                {product.shortDescription && (
                  <p className="font-black text-[#FBBF24] text-base sm:text-lg">
                    {product.shortDescription}
                  </p>
                )}
                {product.description && (
                  <div className="whitespace-pre-line text-[#FFFBEB] font-medium leading-loose">
                    {product.description}
                  </div>
                )}
              </div>
            )}

            {/* Benefits List */}
            {product.benefits && product.benefits.length > 0 && (
              <div className="text-right space-y-4 bg-black/40 p-6 sm:p-8 border border-white/15 rounded-none shadow-xl">
                <h2 className="text-xl sm:text-2xl font-black text-[#FFFBEB] mb-4">
                  خواص و فواید درمانی
                </h2>
                <ul className="space-y-3">
                  {product.benefits.map((benefit, idx) => {
                    const benefitText =
                      typeof benefit === 'string'
                        ? benefit
                        : (benefit?.text || '');
                    const cleanText = benefitText.replace(/^[🔸🔹\s]+/, '');
                    return (
                      <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-[#FFFBEB] leading-relaxed font-medium">
                        <CheckCircle2 className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
                        <span>{cleanText}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Usage Warning Box */}
            {product.usageWarning && product.usageWarning.trim().length > 0 && (
              <div className="p-5 sm:p-6 bg-[#991B1B]/40 border-2 border-[#EF4444]/60 text-right rounded-none shadow-lg">
                <div className="flex items-center gap-2.5 text-[#FCA5A5] font-black text-base mb-2">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>نکات و موارد منع مصرف</span>
                </div>
                <p className="text-xs sm:text-sm text-[#FEE2E2] leading-relaxed font-medium">
                  {product.usageWarning}
                </p>
              </div>
            )}
          </div>

          {/* LEFT COLUMN (5 Cols): Sticky Purchasing Sidebar */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-6 text-right">
            <div className="bg-black/50 border-2 border-[#F59E0B] p-6 sm:p-8 rounded-none shadow-2xl space-y-6">
              {/* Product Title & Original Name */}
              <div className="space-y-2 border-b border-white/15 pb-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider">
                    عسل ارگانیک کوهستان
                  </span>
                  <div>
                    {!product.isAvailable ? (
                      <span className="inline-block px-3 py-1 bg-[#B91C1C] text-white text-xs font-black rounded-none shadow-sm">
                        ناموجود
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 bg-emerald-700 text-white text-xs font-black rounded-none shadow-sm">
                        موجود در انبار
                      </span>
                    )}
                  </div>
                </div>

                <h1 className="text-2xl sm:text-4xl font-black text-[#FFFBEB] leading-tight">
                  {product.nameFa}
                </h1>

                {product.nameOriginal && (
                  <p className="text-xs sm:text-sm text-[#D4C3B3] font-mono tracking-wide" dir="ltr">
                    {product.nameOriginal}
                  </p>
                )}
              </div>

              {/* Add To Cart Slot with Weight Variation Badges */}
              <AddToCartSlot
                productId={product.id}
                isAvailable={product.isAvailable}
                cartEnabled={cartEnabled}
                options={product.options}
              />

              {/* Trust & Delivery Micro-Features */}
              <div className="pt-4 border-t border-white/15 space-y-3 text-xs sm:text-sm text-[#E5D5C5]">
                <div className="flex items-center gap-2.5">
                  <Truck className="w-4 h-4 text-[#F59E0B] shrink-0" />
                  <span>ارسال سریع و رایگان برای سفارش‌های بالای ۱ کیلوگرم</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#F59E0B] shrink-0" />
                  <span>ضمانت ۱۰۰٪ اصالت و برگه آزمایش همراه بسته</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#F59E0B] shrink-0" />
                  <span>بسته‌بندی ایمن ضدنشت در ظروف شیشه‌ای استاندارد</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Showcase */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="pt-16 sm:pt-24 space-y-8 border-t border-white/15 mt-16 text-right">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-4xl font-black text-[#FFFBEB]">
                محصولات مشابه و پیشنهادی
              </h2>
              <p className="text-xs sm:text-sm text-[#E5D5C5] font-medium">
                پیشنهادهای مرتبط از زنبورستان‌های ارگانیک باباخُرم
              </p>
            </div>

            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rel, idx) => (
                <ContentCard
                  key={rel.id}
                  title={rel.title}
                  subtitle={rel.subtitle}
                  href={rel.href}
                  imageAsset={rel.imageAsset}
                  imageUrl={rel.imageUrl || (rel.imageAsset ? null : '/images/honey-jar.jpg')}
                  theme={rel.theme}
                  slug={rel.slug}
                  isAvailable={rel.isAvailable}
                  linkLabel={rel.linkLabel}
                  variant="vertical"
                  index={idx}
                />
              ))}
            </div>

            <div className="md:hidden space-y-4">
              {relatedProducts.map((rel, idx) => (
                <ContentCard
                  key={rel.id}
                  title={rel.title}
                  subtitle={rel.subtitle}
                  href={rel.href}
                  imageAsset={rel.imageAsset}
                  imageUrl={rel.imageUrl || (rel.imageAsset ? null : '/images/honey-jar.jpg')}
                  theme={rel.theme}
                  slug={rel.slug}
                  isAvailable={rel.isAvailable}
                  linkLabel={rel.linkLabel}
                  variant="horizontal"
                  index={idx}
                />
              ))}
            </div>
          </div>
        )}
      </Container>

      {/* [UX-02] Mobile Sticky Buy-Bar */}
      <MobileStickyBuyBar
        productId={product.id}
        productName={product.nameFa}
        isAvailable={product.isAvailable}
        cartEnabled={cartEnabled}
      />
    </WoodBackground>
  );
}
