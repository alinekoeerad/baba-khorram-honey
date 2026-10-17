'use client';

/**
 * AddToCartSlot Component (Phase 9 Task 3 & Addendum A2/A4 - Luxury Dropdown Pass)
 *
 * Requirements:
 * - Shows nothing if cart is disabled, product is unavailable, or no available options.
 * - Weight variant selector: Luxury Dropdown Menu with gold border and active gold accent.
 * - Closed trigger displays selected weight, formatted price, and subtle chevron.
 * - Quantity stepper: min 1, max 50, Persian digits.
 * - "افزودن به سبد خرید" PillButton with accessible live-region confirmation.
 */

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { PillButton } from '@/components/ui/pill-button';
import { useCartStore } from '@/lib/cart-store';
import { toPersianDigits } from '@/lib/domain-utils';
import { ShoppingCart, Check, Plus, Minus, ChevronDown } from 'lucide-react';

export interface ProductOptionItem {
  id: string;
  label: string;
  isAvailable: boolean;
  price?: number | null;
  priceFormatted?: string | null;
}

export interface AddToCartSlotProps {
  productId?: string;
  isAvailable?: boolean;
  cartEnabled?: boolean;
  options?: ProductOptionItem[];
}

function cleanOptionLabel(label: string): string {
  return label.replace(/\s*-\s*[\d,]+(\s*تومان)?/g, '').trim();
}

function formatOptionPrice(opt?: ProductOptionItem): string {
  if (!opt) return 'تماس بگیرید';
  if (opt.priceFormatted) return opt.priceFormatted;
  if (typeof opt.price === 'number' && opt.price > 0) {
    return `${toPersianDigits(opt.price.toLocaleString())} تومان`;
  }
  // Check if label contains an explicit price (e.g. 450,000 تومان)
  const priceMatch = opt.label.match(/([\d,]+)\s*تومان/);
  if (priceMatch) {
    return toPersianDigits(priceMatch[0]);
  }
  return 'تماس بگیرید';
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

  const [selectedOptionId, setSelectedOptionId] = useState<string>(
    availableOptions[0]?.id || ''
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [confirmedMessage, setConfirmedMessage] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  if (!cartEnabled || !isAvailable || !productId) {
    return null;
  }

  // If cart enabled & product available but 0 options remain: provide inquiry link
  if (availableOptions.length === 0) {
    return (
      <div className="max-w-md mx-auto my-4 p-5 bg-[#FAF7F2] border border-[#FDE68A] text-center space-y-3 rounded-none">
        <p className="text-xs sm:text-sm text-stone-700 font-bold">
          جهت استعلام موجودی بسته‌بندی‌ها و ثبت سفارش این عسل، با پشتیبانی تماس بگیرید.
        </p>
        <Link
          href="/contact"
          className="inline-block px-5 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-[#2E1F14] text-xs font-black transition-colors rounded-none"
        >
          استعلام و سفارش از طریق پشتیبانی
        </Link>
      </div>
    );
  }

  const selectedOption =
    availableOptions.find((o) => o.id === selectedOptionId) || availableOptions[0];
  const isBestValueSelected =
    selectedOption?.label.includes('۱') ||
    selectedOption?.label.includes('1') ||
    selectedOption?.label.includes('یک کیلو');

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncrement = () => {
    setQuantity((prev) => Math.min(50, prev + 1));
  };

  const handleAddToCart = () => {
    if (!selectedOption?.id) return;

    const res = actions.addItem({
      productId,
      optionId: selectedOption.id,
      qty: quantity,
    });

    if (res.success) {
      const msg = `«${selectedOption.label}» (${toPersianDigits(quantity)} عدد) به سبد خرید افزوده شد.`;
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

      {/* 1. Luxury Dropdown Weight & Packaging Selector */}
      <div className="space-y-2 relative" ref={dropdownRef}>
        <div className="flex items-center justify-between">
          <label id="weight-selector-label" className="block text-xs sm:text-sm font-bold text-[#2B2017]">
            انتخاب وزن و بسته‌بندی:
          </label>
          <span className="text-[11px] text-[#8C7A6B] font-medium">ظروف بهداشتی استاندارد</span>
        </div>

        {/* Dropdown Trigger */}
        <button
          type="button"
          id="weight-selector-trigger"
          aria-haspopup="listbox"
          aria-expanded={isDropdownOpen}
          aria-labelledby="weight-selector-label weight-selector-trigger"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className="w-full flex items-center justify-between p-3.5 bg-white border-2 border-[#D4AF37]/60 hover:border-[#B45309] text-[#2B2017] rounded-none shadow-xs transition-all duration-200 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="font-black text-sm sm:text-base text-[#2B2017] truncate">
              {cleanOptionLabel(selectedOption?.label || '')}
            </span>
            {isBestValueSelected && (
              <span className="text-[10px] font-black bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] px-2 py-0.5 rounded-none shrink-0 shadow-2xs">
                پرفروش‌ترین
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs sm:text-sm font-black text-[#B45309] bg-[#FFFBEB] px-2.5 py-1 border border-[#FDE68A] rounded-none">
              {formatOptionPrice(selectedOption)}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-[#8C7A6B] transition-transform duration-200 group-hover:text-[#B45309] ${
                isDropdownOpen ? 'rotate-180 text-[#B45309]' : ''
              }`}
            />
          </div>
        </button>

        {/* Dropdown Menu Popup */}
        {isDropdownOpen && (
          <div
            role="listbox"
            aria-labelledby="weight-selector-label"
            className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border-2 border-[#D4AF37]/80 shadow-2xl rounded-none divide-y divide-[#EFE9E0] max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150"
          >
            {availableOptions.map((opt) => {
              const isSelected = opt.id === selectedOption?.id;
              const isBestValue =
                opt.label.includes('۱') || opt.label.includes('1') || opt.label.includes('یک کیلو');
              const priceText = formatOptionPrice(opt);

              return (
                <button
                  key={opt.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    setSelectedOptionId(opt.id);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full p-3.5 text-right flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#FFFBEB] border-r-4 border-[#D97706] font-bold text-[#2B2017]'
                      : 'bg-white hover:bg-[#FAF7F2] text-[#2B2017] font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-xs sm:text-sm ${
                        isSelected ? 'font-black text-[#2B2017]' : 'text-[#332115]'
                      }`}
                    >
                      {cleanOptionLabel(opt.label)}
                    </span>
                    {isBestValue && (
                      <span className="text-[10px] font-black bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] px-2 py-0.5 rounded-none shadow-2xs">
                        پرفروش‌ترین
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-none hidden xs:inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      موجود
                    </span>
                    <span
                      className={`text-xs sm:text-sm font-black ${
                        isSelected ? 'text-[#B45309]' : 'text-[#5C5248]'
                      }`}
                    >
                      {priceText}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
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
