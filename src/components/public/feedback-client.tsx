'use client';

/**
 * Public Feedback Client Component
 * Interactive form for submitting suggestions/criticisms and tracking feedback status with public replies.
 */

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { PillButton } from '@/components/ui/pill-button';
import { WoodBackground } from '@/components/ui/wood-background';
import { submitFeedbackAction, trackFeedbackAction } from '@/server/actions/feedback-actions';
import { copyTextToClipboard } from '@/lib/clipboard';
import {
  CheckCircle2,
  MessageSquareHeart,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  Search,
  Clock,
  MessageCircle,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

const FEEDBACK_TYPES = [
  { value: 'SUGGESTION', label: 'پیشنهاد سازنده', icon: '💡' },
  { value: 'CRITICISM', label: 'انتقاد یا شکایت', icon: '⚠️' },
  { value: 'PRODUCT_QUALITY', label: 'کیفیت محصولات', icon: '🍯' },
  { value: 'OTHER', label: 'سایر موارد', icon: '📝' },
];

const TYPE_LABELS: Record<string, string> = {
  SUGGESTION: 'پیشنهاد سازنده',
  CRITICISM: 'انتقاد یا شکایت',
  PRODUCT_QUALITY: 'کیفیت محصول',
  OTHER: 'سایر موارد',
};

export function FeedbackClient() {
  const [activeTab, setActiveTab] = useState<'submit' | 'track'>('submit');
  const [isPending, startTransition] = useTransition();

  // Submit Form State
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

  // Track Form State
  const [trackCode, setTrackCode] = useState('');
  const [trackPhone, setTrackPhone] = useState('');
  const [trackError, setTrackError] = useState<string | null>(null);
  const [trackResult, setTrackResult] = useState<{
    trackingCode: string;
    status: string;
    type: string;
    createdAt: string;
    publicReply: string | null;
  } | null>(null);

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

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError(null);
    setTrackResult(null);

    startTransition(async () => {
      try {
        const res = await trackFeedbackAction({
          trackingCode: trackCode,
          phone: trackPhone,
        });

        if (res.success && res.data) {
          setTrackResult(res.data as any);
        } else {
          setTrackError(res.error || 'پیامی با این مشخصات یافت نشد.');
        }
      } catch {
        setTrackError('خطایی در استعلام وضعیت پیام رخ داد. لطفاً مجدداً امتحان فرمایید.');
      }
    });
  };

  const handleCopyCode = async () => {
    if (successCode) {
      await copyTextToClipboard(successCode);
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

  const switchToTrackWithCode = (code: string) => {
    setTrackCode(code);
    setActiveTab('track');
  };

  return (
    <WoodBackground className="py-12 sm:py-20 min-h-screen text-[#3F2A1D]">
      <Container size="narrow">
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FAF5EB] border border-[#D9A441]/40 text-[#C58A2A] text-xs font-black shadow-xs">
            <MessageSquareHeart className="w-3.5 h-3.5 text-[#C58A2A]" />
            <span>صدای شما، سرمایه ماست</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-[#3F2A1D] tracking-tight leading-tight">
            انتقادات، پیشنهادات و پیگیری
          </h1>

          {/* Honeycomb / Diamond Accent Divider */}
          <div className="flex items-center justify-center gap-2 pt-1 pb-1" aria-hidden="true">
            <span className="h-0.5 w-10 sm:w-16 bg-gradient-to-l from-[#D9A441] to-transparent" />
            <span className="w-2 h-2 rotate-45 bg-[#D9A441]" />
            <span className="h-0.5 w-10 sm:w-16 bg-gradient-to-r from-[#D9A441] to-transparent" />
          </div>

          <p className="text-sm sm:text-base lg:text-lg text-[#5C3A21] leading-relaxed font-semibold">
            دیدگاه‌ها و پیام‌های شما مستقیماً توسط مدیریت مجموعه عسل باباخُرم بررسی می‌شود. همچنین با داشتن کد رهگیری می‌توانید پاسخ عمومی مدیریت را مشاهده کنید.
          </p>

          {/* Tab Selector */}
          <div className="pt-6 flex justify-center">
            <div className="inline-flex p-1 bg-[#FAF6EE] border border-[#DFD3C3] rounded-full shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab('submit')}
                className={`px-6 py-2 rounded-full text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  activeTab === 'submit'
                    ? 'bg-[#3F2A1D] text-white shadow-sm'
                    : 'text-[#7A6553] hover:text-[#3F2A1D]'
                }`}
              >
                ثبت پیام جدید
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('track')}
                className={`px-6 py-2 rounded-full text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  activeTab === 'track'
                    ? 'bg-[#3F2A1D] text-white shadow-sm'
                    : 'text-[#7A6553] hover:text-[#3F2A1D]'
                }`}
              >
                پیگیری وضعیت پیام ثبت‌شده
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: Submit Feedback Form */}
        {activeTab === 'submit' && (
          <>
            {successCode ? (
              <div className="bg-[#FAF6EE] border border-[#DFD3C3] p-8 sm:p-12 shadow-xl rounded-none text-center space-y-6 animate-in fade-in duration-200">
                <div className="w-16 h-16 bg-[#ECFDF5] text-[#059669] rounded-full flex items-center justify-center mx-auto shadow-xs border border-emerald-200">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-black text-[#3F2A1D]">
                    پیام شما با موفقیت ثبت شد
                  </h2>
                  <p className="text-sm sm:text-base text-[#5C3A21] max-w-md mx-auto leading-relaxed font-medium">
                    از اینکه وقت ارزشمند خود را با ما به اشتراک گذاشتید سپاسگزاریم. پیام شما به صورت محرمانه در پنل مدیریت قرار گرفت.
                  </p>
                </div>

                {/* Tracking Code Box */}
                <div className="bg-white border border-[#DFD3C3] p-4 max-w-sm mx-auto flex items-center justify-between gap-3 rounded-none shadow-xs">
                  <div className="text-right">
                    <div className="text-[11px] text-[#7A6553] font-bold">کد رهگیری اختصاصی:</div>
                    <div className="text-lg font-black text-[#C58A2A] font-mono tracking-wider" dir="ltr">
                      {successCode}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF6EE] border border-[#DFD3C3] text-[#5C3A21] text-xs font-bold hover:bg-[#F2ECE0] transition-colors cursor-pointer rounded-none"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'کپی شد' : 'کپی کد'}</span>
                  </button>
                </div>

                <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => switchToTrackWithCode(successCode)}
                    className="px-6 py-2.5 bg-[#D9A441] hover:bg-[#C58A2A] text-[#2E1F14] hover:text-white text-sm font-black transition-colors cursor-pointer rounded-none shadow-sm"
                  >
                    پیگیری وضعیت همین پیام
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-6 py-2.5 bg-white hover:bg-stone-100 text-[#3F2A1D] border border-[#DFD3C3] text-sm font-bold transition-colors cursor-pointer rounded-none"
                  >
                    ثبت نظر جدید
                  </button>
                  <PillButton variant="gold" size="md" href="/">
                    بازگشت به صفحه اصلی
                  </PillButton>
                </div>
              </div>
            ) : (
              <div className="bg-[#FAF6EE] border border-[#DFD3C3] p-6 sm:p-10 shadow-xl rounded-none">
                {errorMessage && (
                  <div
                    className="mb-8 p-4 bg-[#FEF2F2] border-s-4 border-[#9E3556] text-[#9E3556] text-sm leading-relaxed font-bold"
                    role="alert"
                  >
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Honeypot field */}
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
                      <label htmlFor="fb_name" className="block text-sm font-black text-[#3F2A1D] mb-2">
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
                        className="w-full px-4 py-3 bg-white border border-[#DFD3C3] text-[#3F2A1D] placeholder-[#7A6553] text-sm focus:outline-none focus:border-[#C58A2A] focus:ring-2 focus:ring-[#D9A441]/30 transition-colors rounded-none disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label htmlFor="fb_phone" className="block text-sm font-black text-[#3F2A1D] mb-2">
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
                        className="w-full px-4 py-3 bg-white border border-[#DFD3C3] text-[#3F2A1D] placeholder-[#7A6553] text-sm text-right focus:outline-none focus:border-[#C58A2A] focus:ring-2 focus:ring-[#D9A441]/30 transition-colors rounded-none disabled:opacity-50"
                      />
                      <p className="text-[11px] text-[#5C3A21] mt-1 font-bold">
                        جهت پیگیری در صورت نیاز به پاسخ یا قدردانی
                      </p>
                    </div>
                  </div>

                  {/* Message Type Selector */}
                  <div>
                    <label className="block text-sm font-black text-[#3F2A1D] mb-2.5">
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
                                ? 'bg-[#D9A441] border-[#C58A2A] text-[#2E1F14] font-black shadow-xs ring-2 ring-[#D9A441]/30'
                                : 'bg-white border-[#DFD3C3] text-[#5C3A21] hover:bg-[#F2ECE0] hover:text-[#3F2A1D] hover:border-[#C58A2A]/50 font-bold'
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
                    <label htmlFor="fb_message" className="block text-sm font-black text-[#3F2A1D] mb-2">
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
                      className="w-full px-4 py-3 bg-white border border-[#DFD3C3] text-[#3F2A1D] placeholder-[#7A6553] text-sm focus:outline-none focus:border-[#C58A2A] focus:ring-2 focus:ring-[#D9A441]/30 transition-colors rounded-none disabled:opacity-50 leading-relaxed"
                    />
                    <div className="flex justify-between items-center text-[11px] text-[#5C3A21] mt-1 font-bold">
                      <span>حداقل ۱۰ نویسه</span>
                      <span>{formData.message.length} / ۲۰۰۰ نویسه</span>
                    </div>
                  </div>

                  {/* Privacy Notice */}
                  <div className="p-3.5 bg-white border border-[#DFD3C3] flex items-center gap-2.5 text-xs text-[#5C3A21] font-semibold">
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
                      className="group inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#D9A441] hover:bg-[#C58A2A] text-[#2E1F14] hover:text-white font-black rounded-full shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer text-base"
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
          </>
        )}

        {/* Tab 2: Track Feedback Status */}
        {activeTab === 'track' && (
          <div className="bg-[#FAF6EE] border border-[#DFD3C3] p-6 sm:p-10 shadow-xl rounded-none space-y-8 animate-in fade-in duration-200">
            <div className="border-b border-[#DFD3C3] pb-4">
              <h2 className="text-xl sm:text-2xl font-black text-[#3F2A1D]">
                پیگیری پیام‌های ثبت‌شده
              </h2>
              <p className="text-xs sm:text-sm text-[#7A6553] mt-1 font-medium">
                جهت حفظ حریم شخصی، برای مشاهده وضعیت پیام، وارد کردن کد رهگیری اختصاصی و شماره موبایل ثبت‌شده الزامی است.
              </p>
            </div>

            {trackError && (
              <div
                className="p-4 bg-[#FEF2F2] border-s-4 border-[#9E3556] text-[#9E3556] text-sm leading-relaxed font-bold flex items-center gap-2"
                role="alert"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{trackError}</span>
              </div>
            )}

            <form onSubmit={handleTrackSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="track_code" className="block text-sm font-black text-[#3F2A1D] mb-2">
                    کد رهگیری پیام <span className="text-[#9E3556]">*</span>
                  </label>
                  <input
                    id="track_code"
                    type="text"
                    required
                    dir="ltr"
                    placeholder="FB-1405-XXXXX"
                    value={trackCode}
                    onChange={(e) => setTrackCode(e.target.value)}
                    disabled={isPending}
                    className="w-full px-4 py-3 bg-white border border-[#DFD3C3] text-[#3F2A1D] placeholder-[#7A6553] text-sm font-mono focus:outline-none focus:border-[#C58A2A] focus:ring-2 focus:ring-[#D9A441]/30 transition-colors rounded-none disabled:opacity-50"
                  />
                </div>

                <div>
                  <label htmlFor="track_phone" className="block text-sm font-black text-[#3F2A1D] mb-2">
                    شماره موبایل ثبت‌شده <span className="text-[#9E3556]">*</span>
                  </label>
                  <input
                    id="track_phone"
                    type="tel"
                    required
                    dir="ltr"
                    placeholder="09xxxxxxxxx"
                    value={trackPhone}
                    onChange={(e) => setTrackPhone(e.target.value)}
                    disabled={isPending}
                    className="w-full px-4 py-3 bg-white border border-[#DFD3C3] text-[#3F2A1D] placeholder-[#7A6553] text-sm text-right focus:outline-none focus:border-[#C58A2A] focus:ring-2 focus:ring-[#D9A441]/30 transition-colors rounded-none disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#3F2A1D] hover:bg-[#2B1D14] text-white font-black rounded-full shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer text-sm"
                >
                  <Search className="w-4 h-4" />
                  <span>{isPending ? 'در حال بررسی...' : 'استعلام وضعیت پیام'}</span>
                </button>
              </div>
            </form>

            {/* Tracking Result Display */}
            {trackResult && (
              <div className="mt-8 pt-8 border-t border-[#DFD3C3] space-y-6 animate-in fade-in duration-200">
                <div className="bg-white border border-[#DFD3C3] p-6 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EFE9E0] pb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-[#7A6553]">کد رهگیری:</span>
                      <span className="font-mono font-black text-sm text-[#C58A2A] bg-[#FFFBEB] px-2.5 py-0.5 border border-[#FDE68A]">
                        {trackResult.trackingCode}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#7A6553]">موضوع:</span>
                      <span className="text-xs font-bold text-[#3F2A1D]">
                        {TYPE_LABELS[trackResult.type] || trackResult.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#7A6553]">تاریخ ثبت:</span>
                      <span className="text-xs font-bold text-[#3F2A1D] font-mono">
                        {new Date(trackResult.createdAt).toLocaleDateString('fa-IR')}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-3 py-2">
                    <span className="text-xs font-black text-[#3F2A1D]">وضعیت رسیدگی:</span>
                    {trackResult.status === 'UNREAD' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-xs font-black rounded-full">
                        <Clock className="w-3.5 h-3.5 text-[#D97706]" />
                        <span>در انتظار بررسی مدیریت</span>
                      </span>
                    )}
                    {trackResult.status === 'REVIEWED' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] text-xs font-black rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                        <span>بررسی‌شده توسط مدیریت</span>
                      </span>
                    )}
                    {trackResult.status === 'ARCHIVED' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-stone-100 text-stone-700 border border-stone-300 text-xs font-black rounded-full">
                        <ShieldCheck className="w-3.5 h-3.5 text-stone-600" />
                        <span>رسیدگی و بایگانی‌شده</span>
                      </span>
                    )}
                  </div>

                  {/* Public Reply Card */}
                  <div className="pt-2">
                    <div className="text-xs font-black text-[#3F2A1D] mb-2 flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-[#D97706]" />
                      <span>پاسخ عمومی مدیریت عسل باباخُرم:</span>
                    </div>

                    {trackResult.publicReply ? (
                      <div className="p-4 bg-[#FFFBEB] border-s-4 border-[#D97706] text-sm text-[#3F2A1D] leading-relaxed whitespace-pre-wrap font-medium">
                        {trackResult.publicReply}
                      </div>
                    ) : (
                      <div className="p-4 bg-[#F9F6F0] border border-[#EFE9E0] text-xs text-[#7A6553] leading-relaxed font-bold">
                        هنوز پاسخ عمومی برای این دیدگاه ثبت نشده است. همکاران ما در حال بررسی پیام هستند.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Container>
    </WoodBackground>
  );
}
