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
        <nav
          aria-label="مسیر راهنما"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-bold text-white mb-8 shadow-md"
        >
          <Link href="/" className="text-white hover:text-[#FBBF24] transition-colors underline-offset-4 hover:underline">
            صفحه اصلی
          </Link>
          <span className="text-[#FBBF24] font-black" aria-hidden="true">/</span>
          <Link href="/products" className="text-white hover:text-[#FBBF24] transition-colors underline-offset-4 hover:underline">
            محصولات
          </Link>
          <span className="text-[#FBBF24] font-black" aria-hidden="true">/</span>
          <span className="text-[#FDE047] font-black truncate max-w-[240px]">
            {product.nameFa}
          </span>
        </nav>

        {/* [UX-01] Two-Column Desktop Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* RIGHT COLUMN (7 Cols): Gallery, Trust Seals, Certificate, Specs & Description */}
          <div className="lg:col-span-7 space-y-8 text-right">
            {/* 1. Main High-Resolution Image (Full Jar Presentation, Zero Cropping) */}
            <div className="w-full aspect-4/3 rounded-none overflow-hidden border border-[#EFE9E0] shadow-md bg-[#FAF7F2] p-6 flex items-center justify-center relative">
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
                  src={(product as any).imageUrl || `/images/products/${product.slug}.jpg`}
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
                    className="aspect-square bg-[#FAF7F2] p-2 flex items-center justify-center border border-[#EFE9E0] rounded-none overflow-hidden shadow-xs hover:border-[#F59E0B] transition-colors"
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

            {/* Authentic Heritage Postal & Wax Seals */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-none shadow-xs text-center">
              <div className="flex items-center sm:flex-col justify-center gap-2 p-2 bg-white border border-[#EFE9E0]">
                <ShieldCheck className="w-6 h-6 text-[#D97706]" />
                <div>
                  <div className="text-xs font-black text-[#2B2017]">۱۰۰٪ خام و گرما‌ندیده</div>
                  <div className="text-[10px] text-[#786455] font-bold">حفظ کامل آنزیم‌های فعال</div>
                </div>
              </div>
              <div className="flex items-center sm:flex-col justify-center gap-2 p-2 bg-white border border-[#EFE9E0]">
                <Sparkles className="w-6 h-6 text-[#D97706]" />
                <div>
                  <div className="text-xs font-black text-[#2B2017]">پوشش گیاهی کوهستان</div>
                  <div className="text-[10px] text-[#786455] font-bold">شهد گون، آویشن و سدر</div>
                </div>
              </div>
              <div className="flex items-center sm:flex-col justify-center gap-2 p-2 bg-white border border-[#EFE9E0]">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <div>
                  <div className="text-xs font-black text-[#2B2017]">ساکارز آزمایشگاهی &lt; ۳٪</div>
                  <div className="text-[10px] text-[#786455] font-bold">تضمین بازگشت بی قید وجه</div>
                </div>
              </div>
            </div>

            {/* [SEC-01] Laboratory Purity & Sucrose Certificate */}
            <LabCertificateModal productName={product.nameFa} />

            {/* Nutritional Chips: Mountain Flora & Physical Characteristics */}
            {metaChips.length > 0 && (
              <div className="bg-white border border-[#EFE9E0] p-6 rounded-none shadow-sm space-y-4">
                <h3 className="text-base font-black text-[#2B2017] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#D97706]" />
                  <span>مشخصات فیزیکی و ویژگی‌های اقلیمی:</span>
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {metaChips.map((chip, idx) => (
                    <div
                      key={idx}
                      className="px-3.5 py-1.5 bg-[#FFFBEB] border border-[#FDE68A] text-[#2B2017] text-xs sm:text-sm rounded-none font-bold"
                    >
                      <span className="text-[#B45309] font-black ml-1.5">{chip.label}:</span>
                      <span>{chip.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description & Sensory Notes */}
            {(product.shortDescription || product.description) && (
              <div className="space-y-4 text-right bg-white p-6 sm:p-8 border border-[#EFE9E0] rounded-none shadow-sm">
                {product.shortDescription && (
                  <p className="font-black text-[#B45309] text-base sm:text-lg border-b border-[#FDE68A] pb-3">
                    {product.shortDescription}
                  </p>
                )}
                {product.description && (
                  <div className="whitespace-pre-line text-[#332115] font-medium leading-loose text-sm sm:text-base">
                    {product.description}
                  </div>
                )}
              </div>
            )}

            {/* Benefits List (خواص و فواید درمانی) */}
            {product.benefits && product.benefits.length > 0 && (
              <div className="text-right space-y-4 bg-white p-6 sm:p-8 border border-[#EFE9E0] rounded-none shadow-sm">
                <h2 className="text-xl sm:text-2xl font-black text-[#2B2017] mb-4 border-b border-[#EFE9E0] pb-3">
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
                      <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-[#332115] leading-relaxed font-medium">
                        <CheckCircle2 className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
                        <span>{cleanText}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Usage Warning Box */}
            {product.usageWarning && product.usageWarning.trim().length > 0 && (
              <div className="p-5 sm:p-6 bg-[#FEF2F2] border-2 border-[#EF4444]/40 text-right rounded-none shadow-sm">
                <div className="flex items-center gap-2.5 text-[#991B1B] font-black text-base mb-2">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>نکات و موارد منع مصرف</span>
                </div>
                <p className="text-xs sm:text-sm text-[#7F1D1D] leading-relaxed font-medium">
                  {product.usageWarning}
                </p>
              </div>
            )}
          </div>

          {/* LEFT COLUMN (5 Cols): Sticky Purchasing Card on Warm Parchment */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-6 text-right">
            <div className="bg-white border-2 border-[#FDE68A] p-6 sm:p-8 rounded-none shadow-xl space-y-6">
              {/* Product Title & Original Name */}
              <div className="space-y-2 border-b border-[#EFE9E0] pb-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#D97706] uppercase tracking-wider">
                    عسل ارگانیک کوهستان
                  </span>
                  <div>
                    {!product.isAvailable ? (
                      <span className="inline-block px-3 py-1 bg-rose-100 text-rose-800 border border-rose-300 text-xs font-black rounded-none shadow-2xs">
                        ناموجود
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-black rounded-none shadow-2xs">
                        موجود در انبار
                      </span>
                    )}
                  </div>
                </div>

                <h1 className="text-2xl sm:text-4xl font-black text-[#2B2017] leading-tight">
                  {product.nameFa}
                </h1>

                {product.nameOriginal && (
                  <p className="text-xs sm:text-sm text-[#786455] font-mono tracking-wide" dir="ltr">
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
              <div className="pt-4 border-t border-[#EFE9E0] space-y-3 text-xs sm:text-sm text-[#5C5248]">
                <div className="flex items-center gap-2.5">
                  <Truck className="w-4 h-4 text-[#D97706] shrink-0" />
                  <span className="text-[#332115] font-medium">ارسال سریع و رایگان برای سفارش‌های بالای ۱ کیلوگرم</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#D97706] shrink-0" />
                  <span className="text-[#332115] font-medium">ضمانت ۱۰۰٪ اصالت و برگه آزمایش همراه بسته</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#D97706] shrink-0" />
                  <span className="text-[#332115] font-medium">بسته‌بندی ایمن ضدنشت در ظروف شیشه‌ای استاندارد</span>
                </div>
              </div>
            </div>
          </div>
        </div>

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
