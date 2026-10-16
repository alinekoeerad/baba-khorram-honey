'use client';

/**
 * Cart View Client Component (Phase 9 Tasks 5, 7, 9 & Addendum A3-A6)
 *
 * Implements:
 * - Fresh item data fetching & verification
 * - Line item quantity changes, option switching, and removal
 * - Delivery-only customer form with Zod validation
 * - "مرا به خاطر بسپار" local storage (cart-customer:v1)
 * - Channel chooser (active channels with acceptsOrders)
 * - Mobile vs Desktop device detection with manual override
 * - Desktop QR panel encoding ONLY SITE_URL/o/<code> (generated client-side)
 * - Copy-then-open fallback for unverified messengers
 * - After-send confirmation dialog ("سفارش را ارسال کردید؟")
 */

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { WoodBackground } from '@/components/ui/wood-background';
import { Container } from '@/components/ui/container';
import { PillButton } from '@/components/ui/pill-button';
import { Picture } from '@/components/ui/picture';
import {
  useCartStore,
  getSavedCustomer,
  saveCustomerLocally,
  clearSavedCustomer,
  SavedCustomerData,
} from '@/lib/cart-store';
import { toPersianDigits, validateAndNormalizeIranianMobile } from '@/lib/domain-utils';
import {
  copyTextSync,
  copyTextToClipboard,
  isIosDevice,
  buildSmsUri,
  resolveOrderShareUrl,
} from '@/lib/clipboard';
import { buildChannelOrderUrl } from '@/lib/contact-channels';
import { fetchFreshCartAction } from '@/server/actions/cart-actions';
import { buildOrderAction, BuildOrderResult } from '@/server/actions/order-actions';
import { generateQrSvg } from '@/lib/qr-code';
import { SmartHandoffPanel } from './smart-handoff-panel';
import type { FreshCartLineItem } from '@/server/queries/cart';
import type { PublicChannelItem } from '@/server/queries/settings';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  AlertTriangle,
  Info,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Share2,
} from 'lucide-react';

export interface CartViewProps {
  cartNotice: string;
  orderChannels: PublicChannelItem[];
}

export function CartView({ cartNotice, orderChannels }: CartViewProps) {
  const { lines, totalQuantity, warning, actions } = useCartStore();

  const [freshItems, setFreshItems] = useState<FreshCartLineItem[]>([]);
  const [isLoadingFresh, setIsLoadingFresh] = useState(false);
  const [hasUnavailable, setHasUnavailable] = useState(false);

  // Customer Form State
  const [customer, setCustomer] = useState<SavedCustomerData>({
    firstName: '',
    lastName: '',
    mobile: '',
    province: '',
    city: '',
    address: '',
    postalCode: '',
    notes: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Automatic device detection (Mobile vs Desktop) with manual override toggle
  const [isMobileClient, setIsMobileClient] = useState(false);

  // Order submission state
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [orderResult, setOrderResult] = useState<BuildOrderResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showConfirmSent, setShowConfirmSent] = useState(false);
  const [canShare, setCanShare] = useState(false);

  // 1. Initial Customer "Remember Me" Load & Auto Device Detection
  useEffect(() => {
    const saved = getSavedCustomer();
    if (saved) {
      setCustomer(saved);
      setRememberMe(true);
    }

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setCanShare(true);
    }

    // Auto-detect mobile device without asking user
    const isMobile =
      typeof window !== 'undefined'
        ? window.innerWidth < 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
        : false;
    setIsMobileClient(isMobile);
  }, []);

  // 2. Fetch fresh cart data on mount and whenever lines change
  useEffect(() => {
    if (lines.length === 0) {
      setFreshItems([]);
      setHasUnavailable(false);
      return;
    }

    let isMounted = true;
    setIsLoadingFresh(true);

    fetchFreshCartAction(lines)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.items) {
          setFreshItems(res.items);
          setHasUnavailable(Boolean(res.hasUnavailableItems));
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingFresh(false);
      });

    return () => {
      isMounted = false;
    };
  }, [lines]);

  // Filter channels based on detected device
  // Desktop cannot use SMS (PHONE)
  const availableChannels = orderChannels.filter((ch) => {
    if (!isMobileClient && ch.type === 'PHONE') {
      return false;
    }
    return true;
  });

  // Set default channel
  useEffect(() => {
    if (availableChannels.length > 0 && !selectedChannelId) {
      if (availableChannels[0]?.id) setSelectedChannelId(availableChannels[0].id);
    } else if (
      selectedChannelId &&
      !availableChannels.some((ch) => ch.id === selectedChannelId)
    ) {
      setSelectedChannelId(availableChannels[0]?.id || '');
    }
  }, [availableChannels, selectedChannelId]);

  // Validate form fields
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!customer.firstName.trim()) errors.firstName = 'نام الزامی است.';
    if (!customer.lastName.trim()) errors.lastName = 'نام خانوادگی الزامی است.';

    const mobileVal = validateAndNormalizeIranianMobile(customer.mobile);
    if (!mobileVal.isValid) {
      errors.mobile = mobileVal.error || 'شماره موبایل وارد شده معتبر نیست.';
    }

    if (!customer.province.trim()) errors.province = 'استان الزامی است.';
    if (!customer.city.trim()) errors.city = 'شهر الزامی است.';
    if (!customer.address.trim() || customer.address.trim().length < 5) {
      errors.address = 'آدرس کامل و دقیق (حداقل ۵ کاراکتر) الزامی است.';
    }

    if (customer.postalCode && customer.postalCode.trim().length > 0) {
      const cleanPostal = customer.postalCode.replace(/[^0-9]/g, '');
      if (cleanPostal.length !== 10) {
        errors.postalCode = 'کد پستی باید دقیقاً ۱۰ رقم باشد.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit and Build Order
  const handleProceedToOrder = async () => {
    if (lines.length === 0) return;
    if (hasUnavailable) {
      setSubmitError('برخی از اقلام سبد خرید ناموجود هستند. لطفاً ابتدا آن‌ها را حذف یا تغییر دهید.');
      return;
    }

    if (!validateForm()) {
      setSubmitError('لطفاً خطاهای فرم آدرس و مشخصات را برطرف نمایید.');
      return;
    }

    // Zero-channel resilience: fallback to GENERAL_FALLBACK if no channels exist
    const channelIdToUse =
      selectedChannelId ||
      (availableChannels.length > 0 ? availableChannels[0]?.id : 'GENERAL_FALLBACK');

    setIsSubmitting(true);
    setSubmitError(null);

    // Save or clear Remember Me
    if (rememberMe) {
      saveCustomerLocally(customer);
    } else {
      clearSavedCustomer();
    }

    try {
      const result = await buildOrderAction({
        lines,
        customer,
        channelId: channelIdToUse,
        createShareLink: !isMobileClient, // Desktop needs share link for QR
      });

      if (result.success && result.messageText) {
        // 1. Dual-Safety: Synchronously copy messageText to clipboard first
        copyTextSync(result.messageText);
        await copyTextToClipboard(result.messageText);
        setIsCopied(true);

        const chosenChannel = availableChannels.find((ch) => ch.id === channelIdToUse);
        const channelType = result.channelType || chosenChannel?.type;
        const channelValue = result.channelValue || chosenChannel?.value || '';
        const isIranian =
          channelType === 'EITAA' ||
          channelType === 'BALE' ||
          channelType === 'RUBIKA';

        // Format platform-aware direct URL with prefilled text parameter for all channels
        let finalDirectUrl = result.directUrl || '#';
        if (channelType && channelValue) {
          finalDirectUrl = buildChannelOrderUrl(
            channelType as any,
            channelValue,
            result.messageText,
            { isIos: isIosDevice() }
          );
        }

        const updatedResult: BuildOrderResult = {
          ...result,
          directUrl: finalDirectUrl,
          isPrefillSupported: !isIranian,
        };
        setOrderResult(updatedResult);
        setShowConfirmSent(true);

        // 2. Dual-Safety: Immediately open the prefilled deep link (?text=...) on mobile ONLY for WhatsApp, Telegram, and SMS
        // For Eitaa, Bale, and Rubika, keep customer on the Smart Handoff Panel so they can use Button 1 (PV) or Button 2 (Share)
        // without landing on a blank chat!
        if (isMobileClient && !isIranian && finalDirectUrl && finalDirectUrl !== '#') {
          window.location.href = finalDirectUrl;
        }
      } else {
        setSubmitError(result.error || 'خطا در آماده‌سازی سفارش.');
      }
    } catch {
      setSubmitError('خطای ارتباط با سرور.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNativeShare = async (text?: string, title?: string) => {
    const shareText = text || orderResult?.messageText;
    if (!shareText) return;
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: title || `سفارش ${orderResult?.orderCode || ''}`,
          text: shareText,
        });
      } catch {}
    }
  };

  const handleCopyText = async () => {
    if (!orderResult?.messageText) return;
    copyTextSync(orderResult.messageText);
    const success = await copyTextToClipboard(orderResult.messageText);
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    }
  };

  const handleConfirmClearCart = () => {
    actions.clearCart();
    setOrderResult(null);
    setShowConfirmSent(false);
  };

  // If cart is empty
  if (lines.length === 0 && !orderResult) {
    return (
      <WoodBackground className="py-20 min-h-screen">
        <Container size="narrow" className="text-center space-y-6 bg-white p-8 sm:p-12 border border-[#FDE68A] shadow-xl rounded-none">
          <div className="w-16 h-16 rounded-full bg-[#FEF3C7] border border-[#F59E0B] flex items-center justify-center mx-auto text-[#D97706] shadow-2xs">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-[#2B2017]">
            سبد خرید شما خالی است
          </h1>
          <p className="text-sm sm:text-base text-[#5C5248] max-w-md mx-auto leading-relaxed font-medium">
            محصولی به سبد خرید اضافه نشده است. می‌توانید با مراجعه به فهرست محصولات، انواع عسل طبیعی باباخُرم را بررسی و سفارش دهید.
          </p>
          <div className="pt-4">
            <PillButton variant="gold" size="lg" href="/products">
              مشاهده و انتخاب محصولات
            </PillButton>
          </div>
        </Container>
      </WoodBackground>
    );
  }

  return (
    <WoodBackground className="py-12 sm:py-20 min-h-screen">
      <Container size="narrow" className="space-y-10 sm:space-y-12">
        {/* Page Title */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-5xl font-black text-[#FFFBEB] leading-tight drop-shadow-md">
            سبد خرید و ثبت سفارش
          </h1>
          <p className="text-xs sm:text-sm text-[#E5D5C5]">
            تعداد کل اقلام: {toPersianDigits(totalQuantity)} عدد (بدون نیاز به پرداخت آنلاین)
          </p>
        </div>

        {/* Private Mode In-Memory Warning */}
        {warning && (
          <div className="flex items-center gap-3 p-4 bg-[#FEF3C7] border border-[#F59E0B] text-[#92400E] text-xs sm:text-sm leading-relaxed rounded-none shadow-xs font-medium">
            <Info className="w-5 h-5 shrink-0 text-[#D97706]" />
            <span>{warning}</span>
          </div>
        )}

        {/* 1. Cart Lines Items Section: Warm Ivory Card */}
        <div className="bg-white border border-[#FDE68A] p-5 sm:p-8 space-y-6 shadow-lg rounded-none text-right">
          <h2 className="text-xl sm:text-2xl font-black text-[#2B2017] border-b border-[#EFE9E0] pb-3">
            اقلام انتخابی شما
          </h2>

          {isLoadingFresh && (
            <div className="py-4 flex items-center justify-center gap-2 text-xs text-[#5C5248]">
              <Loader2 className="w-4 h-4 animate-spin text-[#D97706]" />
              <span>در حال به‌روزرسانی موجودی و مشخصات...</span>
            </div>
          )}

          <div className="divide-y divide-[#EFE9E0]">
            {lines.map((line) => {
              const fresh = freshItems.find((f) => f.optionId === line.optionId);
              const title = fresh?.productNameFa || 'عسل طبیعی';
              const optionLabel = fresh?.optionLabel || 'وزن نامشخص';
              const isAvailable = fresh ? fresh.isAvailable : true;
              const invalidReason = fresh?.invalidReason;

              return (
                <div
                  key={line.optionId}
                  className={`py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    !isAvailable ? 'bg-rose-50 p-3 border border-rose-300' : ''
                  }`}
                >
                  {/* Item Image and Name */}
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#FAF7F2] border border-[#EFE9E0] shrink-0 overflow-hidden flex items-center justify-center">
                      {fresh?.mainImage ? (
                        <Picture
                          asset={fresh.mainImage}
                          alt={title}
                          width={100}
                          height={100}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-[#786455] font-bold">
                          باباخُرم
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <Link
                        href={`/products/${fresh?.productSlug || ''}`}
                        className="font-black text-sm sm:text-base text-[#2B2017] hover:text-[#D97706] transition-colors truncate block"
                      >
                        {title}
                      </Link>
                      {/* In-Cart Option Switching */}
                      {fresh?.options && fresh.options.length > 1 ? (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[11px] text-[#786455] font-bold">بسته‌بندی:</span>
                          <select
                            value={line.optionId}
                            onChange={(e) => actions.switchOption(line.optionId, e.target.value)}
                            className="text-xs font-bold text-[#B45309] bg-[#FAF7F2] border border-[#EFE9E0] px-2 py-0.5 rounded-none focus:outline-none focus:border-[#D97706] cursor-pointer"
                          >
                            {fresh.options.map((opt) => (
                              <option key={opt.id} value={opt.id} disabled={!opt.isAvailable}>
                                {opt.label} {!opt.isAvailable ? '(ناموجود)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="text-xs text-[#B45309] font-bold">
                          بسته‌بندی: {optionLabel}
                        </div>
                      )}
                      {!isAvailable && (
                        <div className="text-xs text-rose-700 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{invalidReason || 'این مورد ناموجود است.'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quantity Stepper & Remove */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="flex items-center gap-2 bg-[#FAF7F2] border border-[#EFE9E0] p-1 rounded-none shadow-2xs">
                      <button
                        type="button"
                        onClick={() => actions.updateQuantity(line.optionId, line.qty - 1)}
                        disabled={line.qty <= 1}
                        aria-label="کاهش"
                        className="w-7 h-7 flex items-center justify-center text-[#2B2017] hover:bg-stone-200 disabled:opacity-30 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center font-black text-sm text-[#2B2017] select-none">
                        {toPersianDigits(line.qty)}
                      </span>
                      <button
                        type="button"
                        onClick={() => actions.updateQuantity(line.optionId, line.qty + 1)}
                        disabled={line.qty >= 50}
                        aria-label="افزایش"
                        className="w-7 h-7 flex items-center justify-center text-[#2B2017] hover:bg-stone-200 disabled:opacity-30 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => actions.removeItem(line.optionId)}
                      aria-label="حذف از سبد"
                      className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-none transition-colors cursor-pointer"
                      title="حذف این مورد"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cart Notice Box */}
          <div className="p-4 bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-xs sm:text-sm leading-relaxed flex items-start gap-2.5 rounded-none shadow-2xs">
            <Info className="w-5 h-5 shrink-0 mt-0.5 text-[#D97706]" />
            <div>
              <span className="font-black text-[#2B2017]">یادداشت فروشگاه: </span>
              <span className="font-medium">{cartNotice}</span>
            </div>
          </div>
        </div>

        {/* 2. Customer Delivery Form (Delivery Only): Warm Ivory Card */}
        <div className="bg-white border border-[#FDE68A] p-5 sm:p-8 space-y-6 shadow-lg rounded-none text-right">
          <div className="space-y-1 border-b border-[#EFE9E0] pb-3">
            <h2 className="text-xl sm:text-2xl font-black text-[#2B2017]">
              مشخصات و نشانی تحویل (فقط ارسال پستی)
            </h2>
            <p className="text-xs text-[#786455] font-medium">
              تحویل سفارشات صرفاً به صورت ارسال پستی و درب منزل می‌باشد و امکان دریافت حضوری وجود ندارد.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* First Name */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-[#2B2017]">
                نام <span className="text-[#9E3556]">*</span>
              </label>
              <input
                type="text"
                value={customer.firstName}
                onChange={(e) => setCustomer({ ...customer, firstName: e.target.value })}
                className="w-full h-11 px-3.5 bg-[#FAF7F2] border border-[#EFE9E0] text-[#2B2017] text-sm focus:outline-none focus:border-[#D97706] focus:bg-white rounded-none transition-colors"
                dir="rtl"
              />
              {formErrors.firstName && (
                <p className="text-xs text-rose-700 font-bold">{formErrors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-[#2B2017]">
                نام خانوادگی <span className="text-[#9E3556]">*</span>
              </label>
              <input
                type="text"
                value={customer.lastName}
                onChange={(e) => setCustomer({ ...customer, lastName: e.target.value })}
                className="w-full h-11 px-3.5 bg-[#FAF7F2] border border-[#EFE9E0] text-[#2B2017] text-sm focus:outline-none focus:border-[#D97706] focus:bg-white rounded-none transition-colors"
                dir="rtl"
              />
              {formErrors.lastName && (
                <p className="text-xs text-rose-700 font-bold">{formErrors.lastName}</p>
              )}
            </div>

            {/* Mobile Number */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-[#2B2017]">
                شماره موبایل (۰۹xxxxxxxxx) <span className="text-[#9E3556]">*</span>
              </label>
              <input
                type="tel"
                value={customer.mobile}
                onChange={(e) => setCustomer({ ...customer, mobile: e.target.value })}
                placeholder="09123456789"
                className="w-full h-11 px-3.5 bg-[#FAF7F2] border border-[#EFE9E0] text-[#2B2017] text-sm focus:outline-none focus:border-[#D97706] focus:bg-white rounded-none transition-colors text-right"
                dir="ltr"
              />
              {formErrors.mobile && (
                <p className="text-xs text-rose-700 font-bold">{formErrors.mobile}</p>
              )}
            </div>

            {/* Province */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-[#2B2017]">
                استان <span className="text-[#9E3556]">*</span>
              </label>
              <input
                type="text"
                value={customer.province}
                onChange={(e) => setCustomer({ ...customer, province: e.target.value })}
                placeholder="مثال: آذربایجان شرقی"
                className="w-full h-11 px-3.5 bg-[#FAF7F2] border border-[#EFE9E0] text-[#2B2017] text-sm focus:outline-none focus:border-[#D97706] focus:bg-white rounded-none transition-colors"
                dir="rtl"
              />
              {formErrors.province && (
                <p className="text-xs text-rose-700 font-bold">{formErrors.province}</p>
              )}
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-[#2B2017]">
                شهر <span className="text-[#9E3556]">*</span>
              </label>
              <input
                type="text"
                value={customer.city}
                onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                placeholder="مثال: تبریز"
                className="w-full h-11 px-3.5 bg-[#FAF7F2] border border-[#EFE9E0] text-[#2B2017] text-sm focus:outline-none focus:border-[#D97706] focus:bg-white rounded-none transition-colors"
                dir="rtl"
              />
              {formErrors.city && (
                <p className="text-xs text-rose-700 font-bold">{formErrors.city}</p>
              )}
            </div>

            {/* Postal Code (Optional) */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-[#2B2017]">
                کد پستی (۱۰ رقم - اختیاری)
              </label>
              <input
                type="text"
                maxLength={10}
                value={customer.postalCode || ''}
                onChange={(e) => setCustomer({ ...customer, postalCode: e.target.value })}
                placeholder="کد پستی ۱۰ رقمی"
                className="w-full h-11 px-3.5 bg-[#FAF7F2] border border-[#EFE9E0] text-[#2B2017] text-sm focus:outline-none focus:border-[#D97706] focus:bg-white rounded-none transition-colors text-right"
                dir="ltr"
              />
              {formErrors.postalCode && (
                <p className="text-xs text-rose-700 font-bold">{formErrors.postalCode}</p>
              )}
            </div>

            {/* Address */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-[#2B2017]">
                نشانی دقیق پستی (خیابان، کوچه، پلاک، واحد) <span className="text-[#9E3556]">*</span>
              </label>
              <textarea
                rows={3}
                value={customer.address}
                onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                maxLength={500}
                className="w-full p-3 bg-[#FAF7F2] border border-[#EFE9E0] text-[#2B2017] text-sm focus:outline-none focus:border-[#D97706] focus:bg-white rounded-none transition-colors leading-relaxed"
                dir="rtl"
              />
              {formErrors.address && (
                <p className="text-xs text-rose-700 font-bold">{formErrors.address}</p>
              )}
            </div>

            {/* Notes (Optional) */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs sm:text-sm font-bold text-[#2B2017]">
                توضیحات تکمیلی (اختیاری - حداکثر ۳۰۰ کاراکتر)
              </label>
              <textarea
                rows={2}
                value={customer.notes || ''}
                onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                maxLength={300}
                className="w-full p-3 bg-[#FAF7F2] border border-[#EFE9E0] text-[#2B2017] text-sm focus:outline-none focus:border-[#D97706] focus:bg-white rounded-none transition-colors leading-relaxed"
                dir="rtl"
              />
            </div>
          </div>

          {/* Remember Me Checkbox & Privacy Policy Line */}
          <div className="space-y-3 pt-2 border-t border-[#EFE9E0]">
            <label className="flex items-center gap-2.5 text-xs sm:text-sm text-[#2B2017] cursor-pointer select-none font-medium">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded-none text-[#F59E0B] focus:ring-[#F59E0B] bg-white border-[#EFE9E0]"
              />
              <span>مرا به خاطر بسپار (ذخیره اطلاعات نشانی در مرورگر شما برای سفارش‌های بعدی)</span>
            </label>

            <p className="text-[11px] sm:text-xs text-[#786455] leading-relaxed">
              🔒 حریم خصوصی: اطلاعات شما به هیچ وجه در دیتابیس سایت ذخیره نمی‌شود و صرفاً جهت ساخت متن پیام سفارش استفاده می‌گردد (در حالت بارکد QR، به مدت ۳۰ دقیقه به صورت رمزنگاری‌شده نگهداری می‌شود).
            </p>
          </div>
        </div>

        {/* 3. Channel Chooser: Warm Ivory Card */}
        <div className="bg-white border border-[#FDE68A] p-5 sm:p-8 space-y-6 shadow-lg rounded-none text-right">
          <div className="border-b border-[#EFE9E0] pb-3">
            <h2 className="text-xl sm:text-2xl font-black text-[#2B2017]">
              انتخاب روش و کانال ارسال سفارش
            </h2>
            <p className="text-xs text-[#786455] mt-1 font-medium">
              سفارش شما مستقیماً به دست کارشناسان فروش باباخُرم خواهد رسید.
            </p>
          </div>

          {/* Device Mode Switcher (Mobile vs Desktop) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 bg-[#FAF7F2] border border-[#EFE9E0] text-xs">
            <span className="text-[#5C5248] font-medium">
              دستگاه شما: <strong className="text-[#2B2017]">{isMobileClient ? 'تلفن همراه (موبایل)' : 'رایانه (کامپیوتر / لپ‌تاپ)'}</strong>
            </span>
            <div className="inline-flex items-center gap-1.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setIsMobileClient(true)}
                className={`px-3 py-1 text-xs font-bold transition-all rounded-none cursor-pointer ${
                  isMobileClient
                    ? 'bg-[#D97706] text-white shadow-xs'
                    : 'bg-white text-[#5C5248] border border-[#EFE9E0] hover:bg-[#FEF3C7]'
                }`}
              >
                با گوشی هستم
              </button>
              <button
                type="button"
                onClick={() => setIsMobileClient(false)}
                className={`px-3 py-1 text-xs font-bold transition-all rounded-none cursor-pointer ${
                  !isMobileClient
                    ? 'bg-[#D97706] text-white shadow-xs'
                    : 'bg-white text-[#5C5248] border border-[#EFE9E0] hover:bg-[#FEF3C7]'
                }`}
              >
                با کامپیوتر هستم
              </button>
            </div>
          </div>

          {/* Channels Selection / Zero-Channel Fallback */}
          {availableChannels.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-300 text-amber-900 text-xs sm:text-sm font-bold rounded-none space-y-1">
              <p>در حال حاضر کانال پیام‌رسان مستقیمی ثبت نشده است.</p>
              <p className="font-normal text-amber-800 leading-relaxed">
                نگران نباشید! با فشردن دکمه «آماده‌سازی و ارسال سفارش»، فاکتور و اطلاعات شما آماده شده و می‌توانید آن را مستقیماً از طریق اشتراک‌گذاری سیستمی گوشی یا کپی متن، برای کارشناسان ما ارسال نمایید.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {availableChannels.map((channel) => {
                const isSelected = selectedChannelId === channel.id;
                const isSms = channel.type === 'PHONE';

                return (
                  <div
                    key={channel.id}
                    onClick={() => channel.id && setSelectedChannelId(channel.id)}
                    className={`p-4 border cursor-pointer transition-all flex items-center justify-between gap-3 rounded-none ${
                      isSelected
                        ? 'bg-[#FFFBEB] border-2 border-[#D97706] shadow-sm'
                        : 'bg-[#FAF7F2] border-[#EFE9E0] hover:bg-[#FFFBEB] hover:border-[#D97706]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-[#D97706] bg-[#D97706]' : 'border-stone-400'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <div className="font-black text-sm sm:text-base text-[#2B2017]">
                          {channel.label || channel.type}
                        </div>
                        <div className="text-xs text-[#786455] font-medium">
                          {isSms ? 'ارسال از طریق پیامک متنی' : 'ارسال در گفتگوی پیام‌رسان'}
                        </div>
                      </div>
                    </div>
                    {isSms && (
                      <span className="text-[10px] px-2 py-0.5 bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] font-bold rounded-none">
                        پیامک گوشی
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs sm:text-sm rounded-none font-bold">
              {submitError}
            </div>
          )}

          {/* Action Trigger */}
          <div className="pt-2 text-center">
            <PillButton
              variant="gold"
              size="lg"
              onClick={handleProceedToOrder}
              disabled={isSubmitting || hasUnavailable}
              className="w-full sm:w-auto px-12 font-black text-base shadow-lg cursor-pointer"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>در حال آماده‌سازی پیام سفارش...</span>
                </span>
              ) : (
                <span>آماده‌سازی و ارسال سفارش</span>
              )}
            </PillButton>
          </div>
        </div>



        {/* 4. Mobile Output Panel (Native Share + Direct Link + Copy) */}
        {isMobileClient && orderResult && (
          <div className="bg-white border-2 border-[#FDE68A] p-5 sm:p-8 space-y-5 shadow-xl rounded-none text-right animate-in fade-in duration-300">
            <div className="border-b border-[#EFE9E0] pb-3">
              <h3 className="text-xl sm:text-2xl font-black text-[#2B2017]">
                سفارش شما با کد {orderResult.orderCode} آماده ارسال است
              </h3>
              <p className="text-xs text-[#786455] mt-1 font-medium">
                می‌توانید مستقیماً پیام‌رسان را باز کنید یا از گزینه اشتراک‌گذاری گوشی استفاده فرمایید:
              </p>
            </div>

            <div className="space-y-4">
              {/* Native Web Share button */}
              {canShare && (
                <button
                  type="button"
                  onClick={() => handleNativeShare()}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#D97706] hover:bg-[#B45309] text-white font-black text-sm shadow-md transition-all cursor-pointer"
                >
                  <Share2 className="w-5 h-5" />
                  <span>ارسال مستقیم به تمام پیام‌رسان‌ها (اشتراک‌گذاری)</span>
                </button>
              )}

              {/* Iranian messengers use SmartHandoffPanel; Others use direct pre-filled link */}
              {orderResult.channelType === 'EITAA' ||
              orderResult.channelType === 'BALE' ||
              orderResult.channelType === 'RUBIKA' ? (
                <SmartHandoffPanel
                  orderCode={orderResult.orderCode || ''}
                  messageText={orderResult.messageText || ''}
                  channelType={orderResult.channelType}
                  channelValue={orderResult.channelValue || ''}
                  directUrl={orderResult.directUrl}
                />
              ) : (
                orderResult.directUrl &&
                orderResult.directUrl !== '#' && (
                  <a
                    href={orderResult.directUrl}
                    onClick={() => {
                      copyTextSync(orderResult.messageText || '');
                      copyTextToClipboard(orderResult.messageText || '');
                      setIsCopied(true);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#15803D] hover:bg-[#166534] text-white font-black text-sm shadow-md transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-5 h-5" />
                    <span>ارسال در پیام‌رسان منتخب</span>
                  </a>
                )
              )}


              {/* Copy order text */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs text-[#2B2017]">
                  <span className="font-bold">متن سفارش:</span>
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="flex items-center gap-1.5 text-[#D97706] hover:text-[#B45309] font-black cursor-pointer"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{isCopied ? 'کپی شد!' : 'کپی متن'}</span>
                  </button>
                </div>
                <pre
                  className="w-full max-h-48 overflow-y-auto whitespace-pre-wrap font-sans text-xs text-[#2B2017] bg-[#FAF7F2] p-3 border border-[#EFE9E0] select-all rounded-none font-medium leading-relaxed"
                  dir="rtl"
                >
                  {orderResult.messageText}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* 4. Desktop Output Panel (Messenger Open + Copy + QR Code) */}
        {!isMobileClient && orderResult && (
          <div className="bg-white border-2 border-[#FDE68A] p-6 sm:p-8 space-y-6 shadow-xl rounded-none text-right animate-in fade-in duration-300">
            <div className="border-b border-[#EFE9E0] pb-3">
              <h3 className="text-xl sm:text-2xl font-black text-[#2B2017]">
                سفارش شما با کد {orderResult.orderCode} آماده ارسال است
              </h3>
              <p className="text-xs text-[#786455] mt-1 font-medium">
                می‌توانید پیام‌رسان را باز کنید، متن را کپی فرمایید، یا بارکد را با گوشی اسکن کنید:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Left Column: Actions & Copy */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#2B2017]">
                    <span className="font-bold">متن سفارش:</span>
                    <button
                      type="button"
                      onClick={handleCopyText}
                      className="flex items-center gap-1.5 text-[#D97706] hover:text-[#B45309] font-black cursor-pointer"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      <span>{isCopied ? 'کپی شد!' : 'کپی متن'}</span>
                    </button>
                  </div>
                  <pre
                    className="w-full max-h-48 overflow-y-auto whitespace-pre-wrap font-sans text-xs text-[#2B2017] bg-[#FAF7F2] p-3 border border-[#EFE9E0] select-all rounded-none font-medium leading-relaxed"
                    dir="rtl"
                  >
                    {orderResult.messageText}
                  </pre>
                </div>

                <div className="space-y-2 pt-2">
                  {orderResult.directUrl && orderResult.directUrl !== '#' && (
                    <a
                      href={orderResult.directUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        copyTextSync(orderResult.messageText || '');
                        copyTextToClipboard(orderResult.messageText || '');
                        setIsCopied(true);
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#15803D] hover:bg-[#166534] text-white font-black text-sm transition-all shadow-md cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>باز کردن برنامه / نسخه وب پیام‌رسان</span>
                    </a>
                  )}

                  <PillButton
                    variant="gold"
                    size="md"
                    onClick={handleCopyText}
                    className="w-full justify-center font-bold cursor-pointer"
                  >
                    {isCopied ? 'متن کپی شد' : 'کپی متن سفارش برای ارسال دستی'}
                  </PillButton>
                </div>

                {orderResult.instructionsFa && (
                  <p className="text-xs text-[#786455] leading-relaxed font-medium">
                    💡 {orderResult.instructionsFa}
                  </p>
                )}
              </div>

              {/* Right Column: In-Browser SVG QR Code */}
              {(orderResult.shareUrl || orderResult.shareCode) && (
                <div className="flex flex-col items-center justify-center p-6 bg-[#FAF7F2] rounded-none border border-[#EFE9E0] text-center space-y-3">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: generateQrSvg(
                        resolveOrderShareUrl(orderResult.shareUrl || orderResult.shareCode || ''),
                        200
                      ),
                    }}
                    className="p-2 bg-white border border-[#EFE9E0] shadow-2xs"
                  />
                  <div className="space-y-1 text-[#2B2017]">
                    <p className="font-black text-xs sm:text-sm">
                      اسکن و ارسال سریع با گوشی
                    </p>
                    <p className="text-[11px] text-[#786455]">
                      دوربین گوشی را روی تصویر بالا بگیرید تا صفحه سفارش با یک لمس باز شود.
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* 5. Persistent After-Send Confirmation Dialog */}
        {showConfirmSent && (
          <div className="p-6 bg-emerald-50 border-2 border-emerald-400 space-y-4 shadow-lg text-center rounded-none">
            <div className="flex items-center justify-center gap-2 text-emerald-950 font-black text-lg">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <span>سفارش را ارسال کردید؟</span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-800 max-w-md mx-auto leading-relaxed font-medium">
              اگر پیام سفارش را در پیام‌رسان یا پیامک برای ما فرستادید، می‌توانید سبد خرید خود را خالی فرمایید.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleConfirmClearCart}
                className="px-6 py-2.5 rounded-full bg-[#15803D] hover:bg-[#166534] text-white font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer"
              >
                بله، سبد را خالی کن
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmSent(false)}
                className="px-6 py-2.5 rounded-full bg-white hover:bg-stone-100 text-[#2B2017] font-bold text-xs sm:text-sm border border-[#EFE9E0] transition-all cursor-pointer"
              >
                نه، هنوز
              </button>
            </div>
          </div>
        )}
      </Container>
    </WoodBackground>
  );
}
