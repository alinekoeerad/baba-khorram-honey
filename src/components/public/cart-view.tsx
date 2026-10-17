'use client';

/**
 * Cart View Client Component
 *
 * Implements the Frictionless 1-Click Direct Order Registration paradigm:
 * 1. Simple Checkout Form: Name, Mobile, Address/Notes (optional), Preferred Contact Method (optional pill selector).
 * 2. Single Primary CTA: "ثبت نهایی سفارش" (Instant database save + Bot dispatch to Bale, Eitaa, Telegram).
 * 3. Reassuring Post-Order Receipt: Luxury Green/Gold Success Card, Order Code Badge, Invoice Summary,
 *    and Optional Fast-Track Chat (WhatsApp, Telegram, Bale, Eitaa, Direct Call/SMS).
 */

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { WoodBackground } from '@/components/ui/wood-background';
import { PillButton } from '@/components/ui/pill-button';
import { Picture } from '@/components/ui/picture';
import {
  useCartStore,
  getSavedCustomer,
  saveCustomerLocally,
  clearSavedCustomer,
  SavedCustomerData,
} from '@/lib/cart-store';
import { toPersianDigits, validateAndNormalizeIranianMobile, normalizeDigits } from '@/lib/domain-utils';
import { copyTextSync, copyTextToClipboard } from '@/lib/clipboard';
import { fetchFreshCartAction } from '@/server/actions/cart-actions';
import { buildOrderAction, BuildOrderResult } from '@/server/actions/order-actions';
import { ChannelIcon } from './channel-icon';
import type { FreshCartLineItem } from '@/server/queries/cart';
import type { PublicChannelItem } from '@/server/queries/settings';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Info,
  Copy,
  Check,
  Loader2,
  CheckCircle2,
  MessageSquare,
  Phone,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface CartViewProps {
  cartNotice: string;
  orderChannels: PublicChannelItem[];
}

const PREFERRED_METHODS = [
  { id: 'PHONE', label: 'تماس تلفنی / پیامک (پیش‌فرض)' },
  { id: 'EITAA', label: 'ایتا' },
  { id: 'BALE', label: 'بله' },
  { id: 'WHATSAPP', label: 'واتساپ' },
  { id: 'TELEGRAM', label: 'تلگرام' },
] as const;

export function CartView({ cartNotice, orderChannels }: CartViewProps) {
  const { lines, totalQuantity, warning, actions } = useCartStore();

  const [freshItems, setFreshItems] = useState<FreshCartLineItem[]>([]);
  const [isLoadingFresh, setIsLoadingFresh] = useState(false);
  const [hasUnavailable, setHasUnavailable] = useState(false);

  // Customer Form State
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [preferredContactMethod, setPreferredContactMethod] = useState<string>('PHONE');
  const [rememberMe, setRememberMe] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Submission State
  const [orderResult, setOrderResult] = useState<BuildOrderResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Feedback states
  const [isCodeCopied, setIsCodeCopied] = useState(false);
  const [isInvoiceCopied, setIsInvoiceCopied] = useState(false);
  const [messengerToast, setMessengerToast] = useState<string | null>(null);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);

  const receiptRef = useRef<HTMLDivElement>(null);

  // 1. Initial Customer "Remember Me" Load
  useEffect(() => {
    const saved = getSavedCustomer();
    if (saved) {
      const name =
        saved.fullName ||
        [saved.firstName, saved.lastName].filter(Boolean).join(' ');
      setFullName(name);
      setMobile(saved.mobile || '');
      setAddress(saved.address || '');
      if (saved.preferredContactMethod) {
        setPreferredContactMethod(saved.preferredContactMethod);
      }
      setRememberMe(true);
    }
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

  // 3. Scroll to top/receipt when orderResult arrives
  useEffect(() => {
    if (orderResult) {
      if (receiptRef.current) {
        receiptRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [orderResult]);

  // Form Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      errors.fullName = 'لطفاً نام و نام خانوادگی خود را وارد فرمایید (حداقل ۲ حرف).';
    }

    const mobileVal = validateAndNormalizeIranianMobile(mobile);
    if (!mobileVal.isValid) {
      errors.mobile = mobileVal.error || 'شماره موبایل وارد شده معتبر نیست.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 1-Click Order Submission
  const handleProceedToOrder = async () => {
    if (lines.length === 0) return;
    if (hasUnavailable) {
      setSubmitError('برخی از اقلام سبد خرید ناموجود هستند. لطفاً ابتدا آن‌ها را حذف یا تغییر دهید.');
      return;
    }

    if (!validateForm()) {
      setSubmitError('لطفاً فیلدهای الزامی مشخصات (نام و شماره موبایل) را با دقت تکمیل فرمایید.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const customerData: SavedCustomerData = {
      fullName: fullName.trim(),
      mobile: normalizeDigits(mobile).trim(),
      address: address.trim(),
      preferredContactMethod,
    };

    if (rememberMe) {
      saveCustomerLocally(customerData);
    } else {
      clearSavedCustomer();
    }

    try {
      const result = await buildOrderAction({
        lines,
        customer: customerData,
        preferredContactMethod,
        createShareLink: true,
      });

      if (result.success && result.orderCode) {
        setOrderResult(result);
        const textToCopy = result.fullMessageText || result.messageText || '';
        if (textToCopy) {
          copyTextSync(textToCopy);
          copyTextToClipboard(textToCopy);
        }
      } else {
        setSubmitError(result.error || 'خطا در ثبت سفارش. لطفاً دوباره تلاش فرمایید.');
      }
    } catch {
      setSubmitError('خطای ارتباط با سرور هنگام ثبت سفارش.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyOrderCode = () => {
    if (!orderResult?.orderCode) return;
    copyTextSync(orderResult.orderCode);
    copyTextToClipboard(orderResult.orderCode);
    setIsCodeCopied(true);
    setTimeout(() => setIsCodeCopied(false), 2500);
  };

  const handleCopyInvoice = async () => {
    const text = orderResult?.fullMessageText || orderResult?.messageText;
    if (!text) return;
    copyTextSync(text);
    const success = await copyTextToClipboard(text);
    if (success) {
      setIsInvoiceCopied(true);
      setTimeout(() => setIsInvoiceCopied(false), 2500);
    }
  };

  // Messenger fast-track chat handlers
  const handleOpenBale = () => {
    const text = orderResult?.fullMessageText || orderResult?.messageText || '';
    if (text) {
      copyTextSync(text);
      copyTextToClipboard(text);
    }
    setMessengerToast('متن سفارش کپی شد — در صفحه چت بله Paste کنید');
    setTimeout(() => setMessengerToast(null), 6000);
    window.open('https://ble.ir/Babakhoram', '_blank', 'noopener,noreferrer');
  };

  const handleOpenEitaa = () => {
    const text = orderResult?.fullMessageText || orderResult?.messageText || '';
    if (text) {
      copyTextSync(text);
      copyTextToClipboard(text);
    }
    setMessengerToast('متن سفارش کپی شد — در صفحه چت ایتا Paste کنید');
    setTimeout(() => setMessengerToast(null), 6000);
    window.open('https://eitaa.com/Babakhoram', '_blank', 'noopener,noreferrer');
  };

  const selectedContactMethodLabel =
    PREFERRED_METHODS.find((m) => m.id === preferredContactMethod)?.label || 'تماس تلفنی / پیامک';

  const customerDisplayName = fullName.trim() || 'مشتری گرامی';
  const friendlySupportText = orderResult
    ? `سلام، سفارش شماره ${orderResult.orderCode} به نام ${customerDisplayName} ثبت شد.\n\n${orderResult.fullMessageText || orderResult.messageText || ''}`
    : '';

  // Empty Cart Screen (Only when not showing confirmation receipt)
  if (lines.length === 0 && !orderResult) {
    return (
      <WoodBackground className="py-16 sm:py-24 min-h-[70vh] flex items-center justify-center">
        <div className="w-full max-w-2xl mx-auto px-4 sm:px-6">
          <div className="bg-white border-2 border-[#FDE68A] p-8 sm:p-12 text-center space-y-6 shadow-xl rounded-none">
            <div className="w-20 h-20 mx-auto rounded-full bg-[#FAF7F2] border border-[#EFE9E0] flex items-center justify-center text-[#D97706]">
              <ShoppingCart className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-[#2B2017]">
                سبد خرید شما در حال حاضر خالی است
              </h1>
              <p className="text-sm text-[#5C5248] max-w-md mx-auto leading-relaxed font-medium">
                شهد‌های طبیعی و خالص باباخُرم مستقیماً از کندوهای طالقان و سبلان برداشت می‌شوند. برای مشاهده محصولات کلیک فرمایید.
              </p>
            </div>

            <div className="pt-2">
              <Link href="/products">
                <PillButton variant="gold" size="lg" className="font-bold">
                  مشاهده و خرید عسل‌های طبیعی
                </PillButton>
              </Link>
            </div>
          </div>
        </div>
      </WoodBackground>
    );
  }

  return (
    <WoodBackground className="py-10 sm:py-16 min-h-screen">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Page Title & Subtitle */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-4xl font-black text-[#2B2017]">
            {orderResult ? 'رسید نهایی سفارش شما' : 'سبد خرید و ثبت نهایی سفارش'}
          </h1>
          <p className="text-xs sm:text-sm text-[#5C5248] font-medium">
            {orderResult
              ? 'سفارش شما در سامانه فروش عسل باباخُرم ثبت گردید'
              : `تعداد کل اقلام: ${toPersianDigits(totalQuantity)} عدد — بدون نیاز به پرداخت آنلاین`}
          </p>
        </div>

        {/* Private Mode In-Memory Warning */}
        {warning && (
          <div className="flex items-center gap-3 p-4 bg-[#FEF3C7] border border-[#F59E0B] text-[#92400E] text-xs sm:text-sm leading-relaxed rounded-none shadow-xs font-medium">
            <Info className="w-5 h-5 shrink-0 text-[#D97706]" />
            <span>{warning}</span>
          </div>
        )}

        {/* Cart Notice from Site Settings */}
        {cartNotice && !orderResult && (
          <div className="p-4 bg-white border-r-4 border-[#F59E0B] text-[#5C5248] text-xs sm:text-sm leading-relaxed shadow-sm rounded-none">
            {cartNotice}
          </div>
        )}

        {/* ========================================================================= */}
        {/* POST-ORDER CONFIRMATION RECEIPT (Rendered immediately upon orderResult)  */}
        {/* ========================================================================= */}
        {orderResult && (
          <div ref={receiptRef} className="w-full max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* 1. Success Header Card (Green/Gold Luxury Theme) */}
            <div className="bg-gradient-to-br from-[#064e3b] via-[#065f46] to-[#047857] text-white border-2 border-[#10b981] p-6 sm:p-8 shadow-2xl rounded-none text-right space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/30 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full bg-emerald-400/20 border border-emerald-300 flex items-center justify-center shrink-0 shadow-inner">
                    <CheckCircle2 className="w-7 h-7 text-emerald-300" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      سفارش شما با موفقیت ثبت شد!
                    </h2>
                    <p className="text-xs sm:text-sm text-emerald-100 font-medium mt-1">
                      فاکتور سفارش شما به واحد فروش عسل باباخُرم ارسال گردید.
                    </p>
                  </div>
                </div>

                {/* Prominent Order Code Badge */}
                <div className="inline-flex items-center gap-2 bg-[#022c22]/80 border border-emerald-400/40 px-4 py-2.5 rounded-none self-start sm:self-auto shadow-inner">
                  <span className="text-xs text-emerald-200 font-medium">کد پیگیری سفارش:</span>
                  <span className="font-mono font-black text-base text-[#FDE68A] tracking-wider select-all">
                    {orderResult.orderCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyOrderCode}
                    className="p-1 hover:bg-emerald-800/60 text-emerald-200 hover:text-white transition-colors cursor-pointer"
                    title="کپی کد پیگیری"
                    aria-label="کپی کد پیگیری سفارش"
                  >
                    {isCodeCopied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed font-medium">
                همکاران ما در اسرع وقت با شماره{' '}
                <strong className="text-white font-mono text-sm underline decoration-emerald-300">
                  {mobile}
                </strong>{' '}
                تماس خواهند گرفت.
              </p>
            </div>

            {/* 2. Collapsible/Clean Invoice Summary Box */}
            <div className="bg-white border border-[#FDE68A] p-5 sm:p-7 shadow-lg rounded-none text-right space-y-4">
              <div className="flex items-center justify-between border-b border-[#EFE9E0] pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-[#D97706]" />
                  <h3 className="text-base sm:text-lg font-black text-[#2B2017]">
                    خلاصه فاکتور و مشخصات تحویل
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setOrderResult(null)}
                    className="text-xs font-bold text-[#B45309] hover:text-[#D97706] hover:underline cursor-pointer"
                  >
                    افزودن یا ویرایش سفارش
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                    className="p-1 text-[#786455] hover:text-[#2B2017] cursor-pointer"
                    aria-label="نمایش یا پنهان‌سازی جزئیات فاکتور"
                  >
                    {isSummaryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isSummaryExpanded && (
                <div className="space-y-4">
                  {/* Customer Info Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#FAF7F2] p-3.5 border border-[#EFE9E0] text-xs">
                    <div>
                      <span className="text-[#786455] font-medium">تحویل‌گیرنده: </span>
                      <strong className="text-[#2B2017]">{customerDisplayName}</strong>
                    </div>
                    <div>
                      <span className="text-[#786455] font-medium">شماره تماس: </span>
                      <strong className="text-[#2B2017] font-mono">{mobile}</strong>
                    </div>
                    <div>
                      <span className="text-[#786455] font-medium">روش هماهنگی: </span>
                      <strong className="text-[#D97706]">{selectedContactMethodLabel}</strong>
                    </div>
                    {address && (
                      <div className="sm:col-span-3 pt-1 border-t border-[#EFE9E0] text-[#5C5248]">
                        <span className="text-[#786455] font-medium">آدرس / توضیحات تحویل: </span>
                        <span>{address}</span>
                      </div>
                    )}
                  </div>

                  {/* Items list */}
                  <div className="divide-y divide-[#EFE9E0] border border-[#EFE9E0]">
                    {lines.map((line) => {
                      const fresh = freshItems.find((f) => f.optionId === line.optionId);
                      const title = fresh?.productNameFa || 'عسل طبیعی';
                      const optionLabel = fresh?.optionLabel || 'وزن نامشخص';
                      return (
                        <div
                          key={line.optionId}
                          className="p-3.5 flex items-center justify-between text-xs sm:text-sm bg-white"
                        >
                          <span className="font-bold text-[#2B2017]">
                            {title} —{' '}
                            <span className="text-[#786455] font-normal">{optionLabel}</span>
                          </span>
                          <span className="font-black text-[#B45309]">
                            {toPersianDigits(line.qty)} عدد
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCopyInvoice}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#FAF7F2] hover:bg-[#FEF3C7] border border-[#D97706] text-[#2B2017] font-bold text-xs transition-colors cursor-pointer rounded-none"
                    >
                      {isInvoiceCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>متن کامل فاکتور کپی شد!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#D97706]" />
                          <span>کپی متن کامل فاکتور</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        actions.clearCart();
                        setOrderResult(null);
                      }}
                      className="text-xs text-stone-500 hover:text-stone-800 underline transition-colors cursor-pointer"
                    >
                      ثبت سفارش جدید (خالی کردن سبد)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Optional "Want to message us right now?" Section */}
            <div className="bg-white border-2 border-[#FDE68A] p-5 sm:p-7 shadow-lg rounded-none text-right space-y-5">
              <div className="border-b border-[#EFE9E0] pb-3">
                <div className="flex items-center gap-2 text-[#2B2017]">
                  <MessageSquare className="w-5 h-5 text-[#D97706]" />
                  <h3 className="text-lg sm:text-xl font-black">
                    گفتگوی سریع با پشتیبانی — اختیاری
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-[#5C5248] mt-1 font-medium leading-relaxed">
                  سفارش شما ثبت شده و نیازی به اقدام دیگری نیست؛ اما اگر مایلید همین لحظه در پیام‌رسان‌ها با ما گفتگو کنید، روی پیام‌رسان دلخواه بزنید:
                </p>
              </div>

              {/* Inline Feedback Toast for Bale/Eitaa */}
              {messengerToast && (
                <div className="p-3 bg-emerald-50 border border-emerald-400 text-emerald-900 text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in rounded-none">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{messengerToast}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* WhatsApp */}
                <a
                  href={`https://wa.me/989389196010?text=${encodeURIComponent(friendlySupportText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 bg-[#F0FDF4] hover:bg-[#DCFCE7] border border-[#22C55E]/40 hover:border-[#22C55E] flex items-center gap-3 transition-all rounded-none cursor-pointer group shadow-2xs"
                >
                  <div className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <ChannelIcon type="WHATSAPP" className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-black text-sm text-[#14532D]">واتساپ</div>
                    <div className="text-[11px] text-[#166534]">ارسال پیام با متن آماده</div>
                  </div>
                </a>

                {/* Telegram */}
                <a
                  href={`https://t.me/Babakhoram?text=${encodeURIComponent(friendlySupportText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 bg-[#F0F9FF] hover:bg-[#E0F2FE] border border-[#38BDF8]/40 hover:border-[#0284C7] flex items-center gap-3 transition-all rounded-none cursor-pointer group shadow-2xs"
                >
                  <div className="w-10 h-10 rounded-full bg-[#229ED9] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <ChannelIcon type="TELEGRAM" className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-black text-sm text-[#0C4A6E]">تلگرام</div>
                    <div className="text-[11px] text-[#0369A1]">ارسال پیام با متن آماده</div>
                  </div>
                </a>

                {/* Bale */}
                <button
                  type="button"
                  onClick={handleOpenBale}
                  className="p-4 bg-[#F0FDF4] hover:bg-[#DCFCE7] border border-[#00A859]/40 hover:border-[#00A859] flex items-center gap-3 transition-all rounded-none cursor-pointer group shadow-2xs text-right"
                >
                  <div className="w-10 h-10 rounded-full bg-[#00A859] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <ChannelIcon type="BALE" className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-black text-sm text-[#14532D]">بله (Bale)</div>
                    <div className="text-[11px] text-[#166534]">کپی خودکار + باز شدن چت</div>
                  </div>
                </button>

                {/* Eitaa */}
                <button
                  type="button"
                  onClick={handleOpenEitaa}
                  className="p-4 bg-[#FFF7ED] hover:bg-[#FFEDD5] border border-[#F97316]/40 hover:border-[#EA580C] flex items-center gap-3 transition-all rounded-none cursor-pointer group shadow-2xs text-right"
                >
                  <div className="w-10 h-10 rounded-full bg-[#FF6600] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <ChannelIcon type="EITAA" className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-black text-sm text-[#7C2D12]">ایتا (Eitaa)</div>
                    <div className="text-[11px] text-[#C2410C]">کپی خودکار + باز شدن چت</div>
                  </div>
                </button>
              </div>

              {/* Direct Phone / SMS bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-[#FAF7F2] border border-[#EFE9E0] text-xs">
                <div className="flex items-center gap-2 text-[#5C5248] font-medium">
                  <Phone className="w-4 h-4 text-[#D97706]" />
                  <span>شماره مستقیم واحد سفارشات و پشتیبانی:</span>
                  <strong className="text-[#2B2017] font-mono text-sm">۰۹۳۸۹۱۹۶۰۱۰</strong>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <a
                    href="tel:09389196010"
                    className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-stone-50 border border-[#EFE9E0] text-[#2B2017] font-bold text-center transition-colors rounded-none"
                  >
                    تماس تلفنی
                  </a>
                  <a
                    href={`sms:09389196010?body=${encodeURIComponent(`سلام، سفارش شماره ${orderResult.orderCode} به نام ${customerDisplayName} ثبت شد.`)}`}
                    className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-stone-50 border border-[#EFE9E0] text-[#2B2017] font-bold text-center transition-colors rounded-none"
                  >
                    ارسال پیامک (SMS)
                  </a>
                </div>
              </div>

              <p className="text-[11px] text-[#786455] leading-relaxed">
                💡 نکته: مدیریت و کارشناسان فروش عسل باباخُرم هم‌اکنون این سفارش را به صورت خودکار دریافت کرده‌اند. بنابراین حتی در صورت عدم ارسال پیام در پیام‌رسان‌ها، جهت هماهنگی ارسال با شما تماس گرفته خواهد شد.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CHECKOUT FLOW (Visible when orderResult is null)                          */}
        {/* ========================================================================= */}
        {!orderResult && (
          <div className="space-y-8 sm:space-y-10">
            {/* 1. Cart Items List */}
            <div className="bg-white border border-[#FDE68A] p-5 sm:p-8 space-y-6 shadow-lg rounded-none text-right">
              <div className="flex items-center justify-between border-b border-[#EFE9E0] pb-3">
                <h2 className="text-xl sm:text-2xl font-black text-[#2B2017]">
                  اقلام انتخابی شما
                </h2>
                <button
                  type="button"
                  onClick={() => actions.clearCart()}
                  className="text-xs text-[#9E3556] hover:text-[#DC2626] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>خالی کردن سبد</span>
                </button>
              </div>

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

                  return (
                    <div
                      key={line.optionId}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      {/* Product Thumbnail & Details */}
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-[#FAF7F2] border border-[#EFE9E0] overflow-hidden shrink-0 rounded-none relative">
                          {fresh?.mainImage ? (
                            <Picture
                              asset={fresh.mainImage as any}
                              alt={title}
                              priority={false}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-[#786455] font-bold">
                              باباخُرم
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <h3 className="font-black text-sm sm:text-base text-[#2B2017]">
                            {title}
                          </h3>
                          <p className="text-xs text-[#786455] font-medium">
                            بسته‌بندی: <span className="font-bold text-[#B45309]">{optionLabel}</span>
                          </p>
                          {!isAvailable && (
                            <span className="inline-block text-[11px] text-rose-700 font-bold bg-rose-100 px-2 py-0.5 border border-rose-200">
                              ناموجود در انبار
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Stepper & Remove */}
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="flex items-center gap-2 bg-[#FAF7F2] border border-[#EFE9E0] p-1 rounded-none shadow-2xs">
                          <button
                            type="button"
                            onClick={() =>
                              actions.updateQuantity(
                                line.optionId,
                                Math.max(1, line.qty - 1)
                              )
                            }
                            aria-label="کاهش تعداد"
                            className="w-7 h-7 flex items-center justify-center text-[#2B2017] hover:bg-stone-200 transition-colors cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center font-black text-sm text-[#2B2017] select-none">
                            {toPersianDigits(line.qty)}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              actions.updateQuantity(
                                line.optionId,
                                Math.min(50, line.qty + 1)
                              )
                            }
                            aria-label="افزایش تعداد"
                            className="w-7 h-7 flex items-center justify-center text-[#2B2017] hover:bg-stone-200 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => actions.removeItem(line.optionId)}
                          aria-label="حذف از سبد خرید"
                          className="p-2 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Order Registration Card ("ثبت اطلاعات گیرنده و نهایی‌سازی سفارش") */}
            <div className="bg-white border-2 border-[#FDE68A] p-5 sm:p-8 space-y-6 shadow-xl rounded-none text-right">
              <div className="border-b border-[#EFE9E0] pb-3">
                <h2 className="text-xl sm:text-2xl font-black text-[#2B2017]">
                  ثبت اطلاعات گیرنده و نهایی‌سازی سفارش
                </h2>
                <p className="text-xs text-[#786455] mt-1 font-medium">
                  جهت ثبت قطعی سفارش و هماهنگی ارسال، لطفاً اطلاعات زیر را تکمیل فرمایید:
                </p>
              </div>

              <div className="space-y-5">
                {/* 1. Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-[#2B2017]">
                    نام و نام خانوادگی <span className="text-[#9E3556]">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: علی محمدی"
                    className="w-full h-11 px-3.5 bg-[#FAF7F2] border border-[#EFE9E0] text-[#2B2017] text-sm focus:outline-none focus:border-[#D97706] focus:bg-white rounded-none transition-colors"
                    dir="rtl"
                  />
                  {formErrors.fullName && (
                    <p className="text-xs text-rose-700 font-bold">{formErrors.fullName}</p>
                  )}
                </div>

                {/* 2. Mobile Phone */}
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-[#2B2017]">
                    شماره موبایل جهت هماهنگی و ارسال <span className="text-[#9E3556]">*</span>
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={mobile}
                    onChange={(e) => setMobile(normalizeDigits(e.target.value))}
                    placeholder="09123456789"
                    className="w-full h-11 px-3.5 bg-[#FAF7F2] border border-[#EFE9E0] text-[#2B2017] text-sm focus:outline-none focus:border-[#D97706] focus:bg-white rounded-none transition-colors text-right"
                    dir="ltr"
                  />
                  {formErrors.mobile && (
                    <p className="text-xs text-rose-700 font-bold">{formErrors.mobile}</p>
                  )}
                </div>

                {/* 3. Address / Notes (Optional) */}
                <div className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-bold text-[#2B2017]">
                    آدرس حدودی یا توضیحات سفارش (اختیاری)
                  </label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    maxLength={500}
                    placeholder="مثال: تهران، نیاوران... یا زمان تماس مورد نظر شما"
                    className="w-full p-3 bg-[#FAF7F2] border border-[#EFE9E0] text-[#2B2017] text-sm focus:outline-none focus:border-[#D97706] focus:bg-white rounded-none transition-colors leading-relaxed"
                    dir="rtl"
                  />
                </div>

                {/* 4. Preferred Contact Method (Optional Pill Select) */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs sm:text-sm font-bold text-[#2B2017]">
                      روش ترجیحی هماهنگی با شما:
                    </label>
                    <span className="text-[11px] text-[#786455] font-medium hidden sm:inline">
                      (صرفاً جهت اطلاع کارشناس فروش)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {PREFERRED_METHODS.map((method) => {
                      const isSelected = preferredContactMethod === method.id;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setPreferredContactMethod(method.id)}
                          className={`px-3 py-2.5 text-xs font-bold transition-all rounded-none cursor-pointer border text-center ${
                            isSelected
                              ? 'bg-[#FFFBEB] border-[#D97706] text-[#B45309] shadow-xs ring-1 ring-[#D97706]'
                              : 'bg-[#FAF7F2] border-[#EFE9E0] text-[#5C5248] hover:bg-[#FFFBEB] hover:border-[#D4AF37]'
                          }`}
                        >
                          {method.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="space-y-2 pt-2 border-t border-[#EFE9E0]">
                  <label className="flex items-center gap-2 text-xs sm:text-sm text-[#2B2017] cursor-pointer select-none font-medium">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded-none text-[#F59E0B] focus:ring-[#F59E0B] bg-white border-[#EFE9E0]"
                    />
                    <span>مرا به خاطر بسپار (ذخیره اطلاعات در مرورگر برای سفارش‌های بعدی)</span>
                  </label>
                </div>
              </div>

              {submitError && (
                <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs sm:text-sm rounded-none font-bold">
                  {submitError}
                </div>
              )}

              {/* 5. Single Primary CTA Button & 6. Reassurance Micro-copy */}
              <div className="pt-4 text-center space-y-3">
                <PillButton
                  variant="gold"
                  size="lg"
                  onClick={handleProceedToOrder}
                  disabled={isSubmitting || hasUnavailable}
                  className="w-full sm:w-auto px-12 font-black text-base shadow-xl cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>در حال ثبت سفارش...</span>
                    </span>
                  ) : (
                    <span>ثبت نهایی سفارش</span>
                  )}
                </PillButton>

                <p className="text-xs text-[#5C5248] leading-relaxed font-medium max-w-lg mx-auto">
                  نیازی به پرداخت آنلاین در این مرحله نیست. پس از ثبت، کارشناسان ما برای هماهنگی ارسال با شما در ارتباط خواهند بود.
                </p>

                <div className="inline-flex items-center justify-center gap-1.5 text-[11px] text-[#786455] pt-1 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>اطلاعات تماس شما نزد عسل باباخُرم محفوظ است.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </WoodBackground>
  );
}
