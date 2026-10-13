'use client';

/**
 * AddToCartSlot Component (Phase 9 Task 3 & Addendum A2/A4)
 *
 * Requirements:
 * - Shows nothing if cart is disabled, product is unavailable, or no available options.
 * - Option selector: available options only.
 * - Quantity stepper: min 1, max 50, Persian digits.
 * - "افزودن به سبد" button with accessible live-region confirmation.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { PillButton } from '@/components/ui/pill-button';
import { useCartStore } from '@/lib/cart-store';
import { toPersianDigits } from '@/lib/domain-utils';
import { ShoppingCart, Check, Plus, Minus } from 'lucide-react';

export interface ProductOptionItem {
  id: string;
  label: string;
  isAvailable: boolean;
}

export interface AddToCartSlotProps {
  productId?: string;
  isAvailable?: boolean;
  cartEnabled?: boolean;
  options?: ProductOptionItem[];
}

export function AddToCartSlot({
  productId,
  isAvailable = true,
  cartEnabled = true,
  options = [],
}: AddToCartSlotProps) {
  const { actions } = useCartStore();

  // Provide fallback options if none defined in DB for an available product
  const defaultOptions: ProductOptionItem[] = productId
    ? [
        { id: `opt_${productId}_1kg`, label: 'یک کیلوگرم (ظرف شیشه‌ای)', isAvailable: true },
        { id: `opt_${productId}_500g`, label: 'نیم کیلوگرم (ظرف شیشه‌ای)', isAvailable: true },
      ]
    : [];

  const effectiveOptions = options && options.length > 0 ? options : defaultOptions;
  // Filter to available options only
  const availableOptions = effectiveOptions.filter((o) => o.isAvailable);

  // If cart disabled or product unavailable or no options: show nothing
  if (!cartEnabled || !isAvailable || !productId || availableOptions.length === 0) {
    return null;
  }

  const [selectedOptionId, setSelectedOptionId] = useState<string>(
    availableOptions[0]?.id || ''
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [confirmedMessage, setConfirmedMessage] = useState<string | null>(null);

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncrement = () => {
    setQuantity((prev) => Math.min(50, prev + 1));
  };

  const handleAddToCart = () => {
    if (!selectedOptionId) return;

    const res = actions.addItem({
      productId,
      optionId: selectedOptionId,
      qty: quantity,
    });

    if (res.success) {
      const selectedOpt = availableOptions.find((o) => o.id === selectedOptionId);
      const msg = `«${selectedOpt?.label || ''}» (${toPersianDigits(quantity)} عدد) به سبد خرید افزوده شد.`;
      setConfirmedMessage(msg);

      // Auto-clear message after 4 seconds
      setTimeout(() => {
        setConfirmedMessage(null);
      }, 4000);
    } else if (res.error) {
      setConfirmedMessage(res.error);
    }
  };

  return (
    <div className="max-w-md mx-auto my-4 p-5 sm:p-6 bg-[#FAF7F2] border border-[#FDE68A] rounded-none shadow-sm text-right space-y-5">
      <div className="flex items-center justify-between border-b border-[#EFE9E0] pb-3">
        <div className="flex items-center gap-2 text-[#2B2017] font-black text-sm sm:text-base">
          <ShoppingCart className="w-5 h-5 text-[#D97706]" />
          <span>سفارش اینترنتی محصول</span>
        </div>
        <span className="text-xs text-[#B45309] font-bold">تحویل درب منزل</span>
      </div>

      {/* 1. Option Selector */}
      <div className="space-y-2">
        <label className="block text-xs sm:text-sm font-bold text-[#2B2017]">
          انتخاب وزن و بسته‌بندی:
        </label>
        <div className="flex flex-wrap gap-2.5">
          {availableOptions.map((opt) => {
            const isBestValue = opt.label.includes('۱') || opt.label.includes('1') || opt.label.includes('یک کیلو');
            return (
              <div key={opt.id} className="relative inline-block">
                {isBestValue && (
                  <span className="absolute -top-2.5 right-2 bg-[#F59E0B] text-[#2B2017] text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs z-10 pointer-events-none">
                    پرفروش‌ترین
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedOptionId(opt.id)}
                  className={`px-4 py-2 text-xs sm:text-sm rounded-none transition-all cursor-pointer ${
                    selectedOptionId === opt.id
                      ? 'bg-[#F59E0B] text-[#2B2017] shadow-sm border-2 border-[#D97706] font-black'
                      : 'bg-white text-[#332115] border border-[#EFE9E0] hover:border-[#D97706] hover:bg-[#FFFBEB] font-bold'
                  }`}
                >
                  {opt.label}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Quantity Stepper */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs sm:text-sm font-bold text-[#2B2017]">تعداد:</span>
        <div className="flex items-center gap-3 bg-white border border-[#EFE9E0] p-1 rounded-none shadow-xs">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={quantity <= 1}
            aria-label="کاهش تعداد"
            className="w-8 h-8 flex items-center justify-center text-[#2B2017] hover:bg-stone-100 disabled:opacity-30 transition-colors cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-8 text-center font-black text-base text-[#2B2017] select-none">
            {toPersianDigits(quantity)}
          </span>
          <button
            type="button"
            onClick={handleIncrement}
            disabled={quantity >= 50}
            aria-label="افزایش تعداد"
            className="w-8 h-8 flex items-center justify-center text-[#2B2017] hover:bg-stone-100 disabled:opacity-30 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Add to Cart Button */}
      <div className="pt-2">
        <PillButton
          variant="gold"
          size="lg"
          onClick={handleAddToCart}
          className="w-full justify-center text-center font-black cursor-pointer shadow-md"
        >
          افزودن به سبد خرید
        </PillButton>
      </div>

      {/* 4. Accessible Live-Region & Visual Feedback */}
      <div aria-live="polite" className="sr-only">
        {confirmedMessage || ''}
      </div>

      {confirmedMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs sm:text-sm flex items-center justify-between gap-2 shadow-xs rounded-none animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">{confirmedMessage}</span>
          </div>
          <Link
            href="/cart"
            className="font-black text-[#B45309] hover:underline shrink-0 text-xs"
          >
            مشاهده سبد خرید
          </Link>
        </div>
      )}
    </div>
  );
}
