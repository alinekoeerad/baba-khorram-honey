/**
 * Public Feedback & Suggestions Page (Phase 10.3)
 * Route: /feedback
 * Allows visitors to submit criticisms, suggestions, product feedback, and questions
 * without creating an account. Displayed privately only to admins.
 */

'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { PillButton } from '@/components/ui/pill-button';
import { submitFeedbackAction } from '@/server/actions/feedback-actions';
import { CheckCircle2, MessageSquareHeart, ShieldCheck, Sparkles, Copy, Check } from 'lucide-react';

const FEEDBACK_TYPES = [
  { value: 'SUGGESTION', label: 'پیشنهاد سازنده', icon: '💡' },
  { value: 'CRITICISM', label: 'انتقاد یا شکایت', icon: '⚠️' },
  { value: 'PRODUCT_QUALITY', label: 'کیفیت محصولات', icon: '🍯' },
  { value: 'OTHER', label: 'سایر موارد', icon: '📝' },
];

export default function FeedbackPage() {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    type: 'SUGGESTION',
    message: '',
    honeypot: '',
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const res = await submitFeedbackAction({
          name: formData.name,
          phone: formData.phone,
          type: formData.type as any,
          message: formData.message,
          honeypot: formData.honeypot,
        });

        if (res.success && res.trackingCode) {
          setSuccessCode(res.trackingCode);
        } else {
          setErrorMessage(res.error || 'خطایی در ثبت فرم رخ داد. لطفاً مجدداً بررسی نمایید.');
        }
      } catch {
        setErrorMessage('خطایی در ارتباط با سرور رخ داد. لطفاً چند لحظه دیگر تلاش فرمایید.');
      }
    });
  };

  const handleCopyCode = () => {
    if (successCode) {
      navigator.clipboard.writeText(successCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setSuccessCode(null);
    setFormData({
      name: '',
      phone: '',
      type: 'SUGGESTION',
      message: '',
      honeypot: '',
    });
  };

  return (
    <div className="py-14 sm:py-20 bg-[#FDFBF8]">
      <Container size="narrow">
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FEF3C7] text-[#D97706] text-xs font-black rounded-none border border-[#FDE68A]">
            <MessageSquareHeart className="w-3.5 h-3.5" />
            <span>صدای شما، سرمایه ماست</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#2B2017] tracking-tight">
            انتقادات و پیشنهادات
          </h1>
          <p className="text-base sm:text-lg text-[#5C5248] leading-relaxed">
            دیدگاه‌ها، پیشنهادات و انتقادات شما مستقیماً توسط مدیریت مجموعه باباخُرم بررسی می‌شود. نظرات شما به ما در ارتقای کیفیت محصولات و خدمات کمک شایانی می‌کند.
          </p>
        </div>

        {/* Success View */}
        {successCode ? (
          <div className="bg-white border-2 border-[#D97706]/40 p-8 sm:p-12 shadow-md rounded-none text-center space-y-6 animate-in fade-in duration-200">
            <div className="w-16 h-16 bg-[#ECFDF5] text-[#059669] rounded-full flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-[#2B2017]">
                پیام شما با موفقیت ثبت شد
              </h2>
              <p className="text-sm sm:text-base text-[#5C5248] max-w-md mx-auto leading-relaxed">
                از اینکه وقت ارزشمند خود را برای بهبود مجموعه با ما به اشتراک گذاشتید سپاسگزاریم. پیام شما به صورت محرمانه در پنل مدیریت قرار گرفت.
              </p>
            </div>

            {/* Tracking Code Box */}
            <div className="bg-[#FFFBEB] border border-[#FDE68A] p-4 max-w-sm mx-auto flex items-center justify-between gap-3 rounded-none">
              <div className="text-right">
                <div className="text-[11px] text-[#92400E] font-medium">کد رهگیری اختصاصی:</div>
                <div className="text-lg font-black text-[#B45309] font-mono tracking-wider" dir="ltr">
                  {successCode}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D97706]/30 text-[#B45309] text-xs font-bold hover:bg-[#FDE68A]/40 transition-colors cursor-pointer rounded-none"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'کپی شد' : 'کپی کد'}</span>
              </button>
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-2.5 bg-stone-100 hover:bg-stone-200 text-[#332115] text-sm font-bold transition-colors cursor-pointer rounded-none"
              >
                ثبت نظر جدید
              </button>
              <PillButton variant="gold" size="md" href="/">
                بازگشت به صفحه اصلی
              </PillButton>
            </div>
          </div>
        ) : (
          /* Form Container */
          <div className="bg-white border border-[#EFE9E0] p-6 sm:p-10 shadow-sm rounded-none">
            {/* Error Banner */}
            {errorMessage && (
              <div
                className="mb-8 p-4 bg-[#FEF2F2] border-s-4 border-[#9E3556] text-[#9E3556] text-sm leading-relaxed"
                role="alert"
              >
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Honeypot field (hidden from real users, traps bots) */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="hp_field">لطفاً این فیلد را خالی بگذارید</label>
                <input
                  id="hp_field"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={formData.honeypot}
                  onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
                />
              </div>

              {/* Grid: Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="fb_name" className="block text-sm font-black text-[#332115] mb-2">
                    نام و نام خانوادگی <span className="text-[#9E3556]">*</span>
                  </label>
                  <input
                    id="fb_name"
                    type="text"
                    required
                    placeholder="مثال: علی احمدی"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={isPending}
                    className="w-full px-4 py-3 bg-[#FFFBEB]/30 border border-[#EFE9E0] text-[#2B2017] text-sm focus:outline-none focus:border-[#D97706] focus:bg-white transition-colors rounded-none disabled:opacity-50"
                  />
                </div>

                <div>
                  <label htmlFor="fb_phone" className="block text-sm font-black text-[#332115] mb-2">
                    شماره تماس / موبایل <span className="text-[#9E3556]">*</span>
                  </label>
                  <input
                    id="fb_phone"
                    type="tel"
                    required
                    dir="ltr"
                    placeholder="09xxxxxxxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={isPending}
                    className="w-full px-4 py-3 bg-[#FFFBEB]/30 border border-[#EFE9E0] text-[#2B2017] text-sm text-right focus:outline-none focus:border-[#D97706] focus:bg-white transition-colors rounded-none disabled:opacity-50"
                  />
                  <p className="text-[11px] text-[#5C5248] mt-1">
                    جهت پیگیری در صورت نیاز به پاسخ یا قدردانی
                  </p>
                </div>
              </div>

              {/* Message Type Selector */}
              <div>
                <label className="block text-sm font-black text-[#332115] mb-2.5">
                  موضوع یا نوع پیام <span className="text-[#9E3556]">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {FEEDBACK_TYPES.map((t) => {
                    const isSelected = formData.type === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: t.value })}
                        disabled={isPending}
                        className={`flex flex-col items-center justify-center p-3.5 border transition-all text-center cursor-pointer rounded-none ${
                          isSelected
                            ? 'bg-[#FEF3C7] border-[#D97706] text-[#332115] font-black shadow-xs'
                            : 'bg-white border-[#EFE9E0] text-[#5C5248] hover:border-stone-400 font-bold'
                        }`}
                      >
                        <span className="text-xl mb-1">{t.icon}</span>
                        <span className="text-xs">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message Content */}
              <div>
                <label htmlFor="fb_message" className="block text-sm font-black text-[#332115] mb-2">
                  متن پیام / شرح نظر <span className="text-[#9E3556]">*</span>
                </label>
                <textarea
                  id="fb_message"
                  required
                  rows={6}
                  placeholder="پیشنهاد، انتقاد، بازخورد کیفیت یا تجربه خرید خود را با جزئیات بنویسید..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  disabled={isPending}
                  className="w-full px-4 py-3 bg-[#FFFBEB]/30 border border-[#EFE9E0] text-[#2B2017] text-sm focus:outline-none focus:border-[#D97706] focus:bg-white transition-colors rounded-none disabled:opacity-50 leading-relaxed"
                />
                <div className="flex justify-between items-center text-[11px] text-[#5C5248] mt-1">
                  <span>حداقل ۱۰ نویسه</span>
                  <span>{formData.message.length} / ۲۰۰۰ نویسه</span>
                </div>
              </div>

              {/* Privacy Notice */}
              <div className="p-3.5 bg-stone-50 border border-[#EFE9E0] flex items-center gap-2.5 text-xs text-[#5C5248]">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  اطلاعات و شماره تماس شما به هیچ عنوان منتشر نخواهد شد و صرفاً در پنل امن مدیریت ثبت می‌گردد.
                </span>
              </div>

              {/* Submit Button */}
              <div className="pt-2 text-center sm:text-right">
                <button
                  type="submit"
                  disabled={isPending}
                  className="group inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#FBBF24] hover:bg-[#F59E0B] text-[#332115] font-black rounded-full shadow-xs hover:shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer text-base"
                >
                  <span>{isPending ? 'در حال ارسال پیام...' : 'ثبت و ارسال دیدگاه'}</span>
                  <span className="mr-1">
                    <Sparkles className="w-4 h-4" />
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}
      </Container>
    </div>
  );
}
