'use client';

/**
 * SectionForm Component (Brief Section 7)
 * Comprehensive per-type content form for creating and editing homepage sections.
 * Guarantees zero fields for CSS, custom fonts, or manual styling.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ControlledLinkPicker } from './controlled-link-picker';
import type { ControlledLink, SectionImage } from '@/server/validation/homepage-schemas';
import { createHomepageSectionAction, updateHomepageSectionAction } from '@/server/actions/homepage-actions';
import type { SectionType, SectionStatus, SectionBackground } from '@prisma/client';
import { parseLocalizedInt, toPersianDigits } from '@/lib/domain-utils';
import {
  Save,
  AlertTriangle,
  Plus,
  Trash2,
  Image as ImageIcon,
  ArrowRight,
  Loader2,
  CheckCircle,
  ZoomIn,
} from 'lucide-react';
import Link from 'next/link';
import { ImageLightboxModal } from '@/components/admin/image-lightbox-modal';

interface SectionFormProps {
  initialData?: {
    id?: string;
    internalName: string;
    type: SectionType;
    template: string;
    status: SectionStatus;
    background: SectionBackground;
    sortOrder?: number;
    content: Record<string, any>;
  };
  isNew?: boolean;
}

export function SectionForm({ initialData, isNew = false }: SectionFormProps) {
  const router = useRouter();

  const [internalName, setInternalName] = useState(initialData?.internalName || '');
  const [type] = useState<SectionType>(initialData?.type || 'HERO');
  const [template] = useState<string>(initialData?.template || 'hero-default');
  const [status, setStatus] = useState<SectionStatus>(initialData?.status || 'DRAFT');
  const [background, setBackground] = useState<SectionBackground>(initialData?.background || 'NONE');
  const [content, setContent] = useState<Record<string, any>>(initialData?.content || {});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const updateContentField = (key: string, val: any) => {
    setContent((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const payload = {
      internalName,
      type,
      template,
      status,
      background,
      content,
    };

    let res;
    if (isNew) {
      res = await createHomepageSectionAction(payload as any);
    } else if (initialData?.id) {
      res = await updateHomepageSectionAction(initialData.id, payload as any);
    }

    setIsSubmitting(false);

    if (res?.success) {
      setSuccessMessage('اطلاعات سکشن با موفقیت ذخیره شد.');
      setTimeout(() => {
        router.push('/admin/homepage');
      }, 700);
    } else {
      setErrorMessage(res?.error || 'خطا در ثبت اطلاعات.');
    }
  };

  // Helper for Hero & Gallery image management
  const imagesList: SectionImage[] = Array.isArray(content.images) ? content.images : [];

  const handleAddImage = () => {
    const next = [
      ...imagesList,
      {
        url: '/images/hero/photo_35.jpg',
        alt: '',
        deviceTarget: 'all' as const,
        focalPoint: 'center' as const,
      },
    ];
    updateContentField('images', next);
  };

  const handleUpdateImage = (
    index: number,
    field: keyof SectionImage,
    val: any
  ) => {
    const next = [...imagesList];
    next[index] = { ...next[index], [field]: val };
    updateContentField('images', next);
  };

  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= imagesList.length) return;
    const next = [...imagesList];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    updateContentField('images', next);
  };

  const handleRemoveImage = (index: number) => {
    const next = imagesList.filter((_, i) => i !== index);
    updateContentField('images', next);
  };

  // Helper for Content Grid items
  const gridItems = Array.isArray(content.items) ? content.items : [];

  const handleAddGridItem = () => {
    const next = [
      ...gridItems,
      {
        id: Math.random().toString(36).substring(2, 9),
        title: 'عنوان جدید',
        description: '',
        image: { url: '/images/recipe-1.jpg', alt: '' },
      },
    ];
    updateContentField('items', next);
  };

  const handleUpdateGridItem = (index: number, field: string, val: any) => {
    const next = [...gridItems];
    next[index] = { ...next[index], [field]: val };
    updateContentField('items', next);
  };

  const handleRemoveGridItem = (index: number) => {
    const next = gridItems.filter((_, i) => i !== index);
    updateContentField('items', next);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto pb-16 text-right">
      {/* Top Banner Warning for Active Sections */}
      {status === 'ACTIVE' && (
        <div className="p-4 bg-amber-50 border-2 border-amber-500 rounded-none flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-amber-950 leading-relaxed font-bold">
            <span className="font-black text-amber-950">هشدار اعمال فوری: </span>
            این سکشن در وضعیت <span className="underline decoration-amber-600">فعال (ACTIVE)</span> قرار دارد. هر تغییری پس از ذخیره بلافاصله در صفحه اصلی سایت عمومی نمایش داده خواهد شد.
          </div>
        </div>
      )}

      {/* 1. General Section Configuration */}
      <div className="p-6 bg-white border border-[#D5C7B8] rounded-none shadow-sm space-y-6">
        <h3 className="font-black text-base text-[#2B2017] border-b border-stone-100 pb-3">
          تنظیمات عمومی سکشن
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Internal Name */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-stone-700">
              نام داخلی سکشن (جهت شناسایی در پنل مدیریت) *
            </label>
            <input
              type="text"
              required
              value={internalName}
              onChange={(e) => setInternalName(e.target.value)}
              placeholder="مثلاً: هیرو اصلی پاییزه، بنر زنبورداری..."
              className="w-full h-11 px-3.5 text-sm font-bold bg-[#FDFBF8] border border-[#D5C7B8] rounded-none focus:bg-white focus:ring-1 focus:ring-[#F59E0B] focus:border-[#F59E0B] focus:outline-none"
            />
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-stone-700">
              وضعیت انتشار *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SectionStatus)}
              className="w-full h-11 px-3.5 text-sm font-bold bg-[#FDFBF8] border border-[#D5C7B8] rounded-none focus:bg-white focus:ring-1 focus:ring-[#F59E0B] focus:border-[#F59E0B] focus:outline-none"
            >
              <option value="DRAFT">پیش‌نویس (DRAFT - فقط در پنل ادمین)</option>
              <option value="ACTIVE">فعال (ACTIVE - نمایش در سایت عمومی)</option>
              <option value="DISABLED">غیرفعال (DISABLED - آرشیو)</option>
            </select>
          </div>

          {/* Section Type (Read-only after creation) */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-stone-700">
              نوع بخش (Section Type)
            </label>
            <div className="w-full h-11 px-3.5 text-sm font-black bg-stone-100 border border-[#D5C7B8] rounded-none flex items-center text-stone-600">
              {type} (قالب: {template})
            </div>
          </div>

          {/* Background Selection */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-stone-700">
              نوع پس‌زمینه سکشن *
            </label>
            <select
              value={background}
              onChange={(e) => setBackground(e.target.value as SectionBackground)}
              className="w-full h-11 px-3.5 text-sm font-bold bg-[#FDFBF8] border border-[#D5C7B8] rounded-none focus:bg-white focus:ring-1 focus:ring-[#F59E0B] focus:border-[#F59E0B] focus:outline-none"
            >
              <option value="NONE">ساده (پس‌زمینه سفید / پیش‌فرض)</option>
              <option value="WOOD">طرح چوب اصیل (WoodBackground)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Type-Specific Content Form */}
      <div className="p-6 bg-white border border-[#D5C7B8] rounded-none shadow-sm space-y-6">
        <h3 className="font-black text-base text-[#2B2017] border-b border-stone-100 pb-3">
          محتوا و تنظیمات سکشن ({type})
        </h3>

        {/* HERO Form */}
        {type === 'HERO' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700">عنوان بزرگ هیرو *</label>
              <input
                type="text"
                required
                value={content.title || ''}
                onChange={(e) => updateContentField('title', e.target.value)}
                placeholder="شاهکار بی‌نظیر طبیعت"
                className="w-full h-11 px-3.5 text-sm font-bold bg-[#FDFBF8] border border-[#D5C7B8] rounded-none focus:bg-white focus:ring-1 focus:ring-[#F59E0B] focus:border-[#F59E0B] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700">زیرعنوان توضیحی هیرو</label>
              <textarea
                rows={2}
                value={content.subtitle || ''}
                onChange={(e) => updateContentField('subtitle', e.target.value)}
                placeholder="تغذیه اصیل، طعمی تکرارنشدنی و سرشار از انرژی طلایی برای زندگی روزمره"
                className="w-full p-3.5 text-sm font-bold bg-[#FDFBF8] border border-[#D5C7B8] rounded-none focus:bg-white focus:ring-1 focus:ring-[#F59E0B] focus:border-[#F59E0B] focus:outline-none"
              />
            </div>

            {/* Images Manager (1 to 8 images) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-stone-800">
                  تصاویر اسلایدر هیرو (بین ۱ تا ۸ تصویر)
                </span>
                {imagesList.length < 8 && (
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FEF3C7] text-[#92400E] hover:bg-[#FDE68A] text-xs font-black rounded-none transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن تصویر</span>
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {imagesList.map((img, idx) => (
                  <div key={idx} className="p-4 bg-stone-50 border border-stone-200 rounded-none space-y-3 shadow-xs">
                    {/* Slide Card Header with Badge, Reorder buttons, and Delete button */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-[#332115] text-[#FBBF24] font-black text-xs rounded-none border border-amber-600/30">
                          اسلاید {toPersianDigits(idx + 1)}
                        </span>
                        {img.deviceTarget === 'mobile' && (
                          <span className="text-[10px] font-bold bg-purple-100 text-purple-900 px-2 py-0.5 border border-purple-200 rounded-none">
                            فقط موبایل
                          </span>
                        )}
                        {img.deviceTarget === 'desktop' && (
                          <span className="text-[10px] font-bold bg-blue-100 text-blue-900 px-2 py-0.5 border border-blue-200 rounded-none">
                            فقط دسکتاپ
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveImage(idx, 'up')}
                          className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-amber-50 text-[#332115] border border-stone-300 disabled:opacity-30 disabled:hover:bg-white rounded-none transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="▲ انتقال به بالا / قبلی"
                        >
                          <span>▲</span>
                          <span>انتقال به بالا / قبلی</span>
                        </button>

                        <button
                          type="button"
                          disabled={idx === imagesList.length - 1}
                          onClick={() => handleMoveImage(idx, 'down')}
                          className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-amber-50 text-[#332115] border border-stone-300 disabled:opacity-30 disabled:hover:bg-white rounded-none transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="▼ انتقال به پایین / بعدی"
                        >
                          <span>▼</span>
                          <span>انتقال به پایین / بعدی</span>
                        </button>

                        {imagesList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-none transition-colors cursor-pointer inline-flex items-center gap-1 text-xs font-bold"
                            title="حذف این اسلاید"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">حذف</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                      {/* Click-to-Zoom Thumbnail */}
                      <div
                        onClick={() => setLightboxUrl(img.url)}
                        className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 border border-[#D5C7B8] bg-[#FAF8F5] p-1 flex items-center justify-center overflow-hidden rounded-none shadow-xs relative group cursor-zoom-in"
                        title="کلیک برای بزرگنمایی تصویر"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setLightboxUrl(img.url);
                          }
                        }}
                      >
                        <img
                          src={img.url}
                          alt={img.alt || ''}
                          className="w-full h-full object-cover rounded-none transition-transform duration-200 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 pointer-events-none">
                          <ZoomIn className="w-4 h-4 text-amber-300 drop-shadow-sm" />
                          <span className="text-[9px] font-bold drop-shadow-sm">بزرگنمایی</span>
                        </div>
                      </div>

                      {/* Inputs Grid */}
                      <div className="flex-1 space-y-2.5 w-full">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-stone-700">آدرس تصویر (URL) *</label>
                            <input
                              type="text"
                              required
                              value={img.url}
                              onChange={(e) => handleUpdateImage(idx, 'url', e.target.value)}
                              placeholder="مثلاً /images/hero/photo_35.jpg"
                              className="w-full h-9 px-2.5 text-xs font-bold bg-white border border-stone-300 rounded-none focus:ring-1 focus:ring-[#F59E0B] font-mono"
                              dir="ltr"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-stone-700">متن جایگزین (Alt)</label>
                            <input
                              type="text"
                              value={img.alt || ''}
                              onChange={(e) => handleUpdateImage(idx, 'alt', e.target.value)}
                              placeholder="توضیح تصویر برای دسترس‌پذیری"
                              className="w-full h-9 px-2.5 text-xs font-bold bg-white border border-stone-300 rounded-none focus:ring-1 focus:ring-[#F59E0B]"
                            />
                          </div>
                        </div>

                        {/* Device Target and Focal Point Selectors */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-stone-200">
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-stone-700">
                              نمایش در دستگاه (deviceTarget):
                            </label>
                            <select
                              value={img.deviceTarget || 'all'}
                              onChange={(e) => handleUpdateImage(idx, 'deviceTarget', e.target.value)}
                              className="w-full h-9 px-2 text-xs font-bold bg-white border border-stone-300 rounded-none focus:ring-1 focus:ring-[#F59E0B]"
                            >
                              <option value="all">همه دستگاهها (موبایل و دسکتاپ)</option>
                              <option value="desktop">فقط دسکتاپ (مناسب تصاویر افقی/عریض)</option>
                              <option value="mobile">فقط موبایل (مناسب تصاویر عمودی)</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-stone-700">
                              نقطه کانونی تصویر (focalPoint):
                            </label>
                            <select
                              value={img.focalPoint || 'center'}
                              onChange={(e) => handleUpdateImage(idx, 'focalPoint', e.target.value)}
                              className="w-full h-9 px-2 text-xs font-bold bg-white border border-stone-300 rounded-none focus:ring-1 focus:ring-[#F59E0B]"
                            >
                              <option value="center">مرکز تصویر (پیشفرض)</option>
                              <option value="top">بالای تصویر</option>
                              <option value="bottom">پایین تصویر</option>
                              <option value="right">سمت راست تصویر</option>
                              <option value="left">سمت چپ تصویر</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* IMAGE_TEXT Form */}
        {type === 'IMAGE_TEXT' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700">روتیتر (Kicker)</label>
                <input
                  type="text"
                  value={content.kicker || ''}
                  onChange={(e) => updateContentField('kicker', e.target.value)}
                  placeholder="مثلاً: تنها ماده‌ای که..."
                  className="w-full h-11 px-3 text-sm font-bold bg-[#FDFBF8] border border-[#D5C7B8] rounded-none focus:bg-white focus:ring-1 focus:ring-[#F59E0B] focus:border-[#F59E0B] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700">تم رنگی دکمه و تیتر</label>
                <select
                  value={content.theme || 'GREEN'}
                  onChange={(e) => updateContentField('theme', e.target.value)}
                  className="w-full h-11 px-3 text-sm font-bold bg-[#FDFBF8] border border-[#D5C7B8] rounded-none focus:bg-white focus:ring-1 focus:ring-[#F59E0B] focus:border-[#F59E0B] focus:outline-none"
                >
                  <option value="GREEN">سبز طبیعی (GREEN)</option>
                  <option value="ORANGE">نارنجی کهربایی (ORANGE)</option>
                  <option value="GOLD">طلایی عسلی (GOLD)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700">موقعیت تصویر</label>
                <select
                  value={content.imagePosition || 'RIGHT'}
                  onChange={(e) => updateContentField('imagePosition', e.target.value)}
                  className="w-full h-11 px-3 text-sm font-bold bg-[#FDFBF8] border border-[#D5C7B8] rounded-none focus:bg-white focus:ring-1 focus:ring-[#F59E0B] focus:border-[#F59E0B] focus:outline-none"
                >
                  <option value="RIGHT">سمت راست (پیش‌فرض RTL)</option>
                  <option value="LEFT">سمت چپ</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700">عنوان اصلی سکشن *</label>
              <input
                type="text"
                required
                value={content.title || ''}
                onChange={(e) => updateContentField('title', e.target.value)}
                placeholder="تجلیل از صنعت زنبورداری"
                className="w-full h-11 px-3.5 text-sm font-bold bg-[#FDFBF8] border border-[#D5C7B8] rounded-none focus:bg-white focus:ring-1 focus:ring-[#F59E0B] focus:border-[#F59E0B] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700">متن بدنه *</label>
              <textarea
                rows={4}
                required
                value={content.body || ''}
                onChange={(e) => updateContentField('body', e.target.value)}
                placeholder="توضیحات مفصل این بخش..."
                className="w-full p-3.5 text-sm font-bold bg-[#FDFBF8] border border-[#D5C7B8] rounded-none focus:bg-white focus:ring-1 focus:ring-[#F59E0B] focus:border-[#F59E0B] focus:outline-none"
              />
            </div>

            {/* Single Image Setting */}
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-none space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-stone-800">
                <ImageIcon className="w-4 h-4 text-[#D97706]" />
                <span>تصویر شاخص سکشن *</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {content.image?.url && (
                  <div
                    onClick={() => setLightboxUrl(content.image.url)}
                    className="w-28 h-28 sm:w-32 sm:h-32 shrink-0 border border-[#D5C7B8] bg-[#FAF8F5] p-1 flex items-center justify-center overflow-hidden rounded-none shadow-xs relative group cursor-zoom-in"
                    title="کلیک برای بزرگنمایی تصویر"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setLightboxUrl(content.image.url);
                      }
                    }}
                  >
                    <img
                      src={content.image.url}
                      alt={content.image.alt || ''}
                      className="w-full h-full object-cover rounded-none transition-transform duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 pointer-events-none">
                      <ZoomIn className="w-5 h-5 text-amber-300 drop-shadow-sm" />
                      <span className="text-[10px] font-bold drop-shadow-sm">بزرگنمایی</span>
                    </div>
                  </div>
                )}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  <input
                    type="text"
                    required
                    value={content.image?.url || ''}
                    onChange={(e) =>
                      updateContentField('image', { ...content.image, url: e.target.value })
                    }
                    placeholder="آدرس فایل تصویر (مثلاً /images/beekeeping.jpg)"
                    className="h-10 px-3 text-xs font-bold bg-white border border-stone-300 rounded-none focus:ring-1 focus:ring-[#F59E0B] font-mono"
                    dir="ltr"
                  />
                  <input
                    type="text"
                    value={content.image?.alt || ''}
                    onChange={(e) =>
                      updateContentField('image', { ...content.image, alt: e.target.value })
                    }
                    placeholder="متن جایگزین (Alt)"
                    className="h-10 px-3 text-xs font-bold bg-white border border-stone-300 rounded-none focus:ring-1 focus:ring-[#F59E0B]"
                  />
                </div>
              </div>
            </div>

            {/* Controlled Link Picker */}
            <ControlledLinkPicker
              value={content.cta}
              onChange={(val) => updateContentField('cta', val)}
            />
          </div>
        )}

        {/* FULL_IMAGE_OVERLAY Form */}
        {type === 'FULL_IMAGE_OVERLAY' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700">روتیتر (Kicker)</label>
                <input
                  type="text"
                  value={content.kicker || ''}
                  onChange={(e) => updateContentField('kicker', e.target.value)}
                  placeholder="با افتخار"
                  className="w-full h-11 px-3 text-sm font-bold bg-[#FDFBF8] border border-[#D5C7B8] rounded-none focus:bg-white focus:ring-1 focus:ring-[#F59E0B] focus:border-[#F59E0B] focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700">تم دکمه</label>
                <select
                  value={content.theme || 'ORANGE'}
                  onChange={(e) => updateContentField('theme', e.target.value)}
                  className="w-full h-11 px-3 text-sm font-bold bg-[#FDFBF8] border border-[#D5C7B8] rounded-none focus:bg-white focus:ring-1 focus:ring-[#F59E0B] focus:border-[#F59E0B] focus:outline-none"
                >
                  <option value="ORANGE">نارنجی (ORANGE)</option>
                  <option value="GREEN">سبز (GREEN)</option>
                  <option value="GOLD">طلایی (GOLD)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700">تیتر بزرگ بنر *</label>
              <input
                type="text"
                required
                value={content.heading || content.title || ''}
                onChange={(e) => {
                  updateContentField('heading', e.target.value);
                  updateContentField('title', e.target.value);
                }}
                placeholder="کارِ زنبورها"
                className="w-full h-11 px-3.5 text-sm font-bold bg-[#FDFBF8] border border-[#D5C7B8] rounded-none focus:bg-white focus:ring-1 focus:ring-[#F59E0B] focus:border-[#F59E0B] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700">متن بدنه (اختیاری)</label>
              <textarea
                rows={2}
                value={content.body || ''}
                onChange={(e) => updateContentField('body', e.target.value)}
                placeholder="توضیحات کوتاه اختیاری روی تصویر..."
                className="w-full p-3.5 text-sm font-bold bg-[#FDFBF8] border border-[#D5C7B8] rounded-none focus:bg-white focus:ring-1 focus:ring-[#F59E0B] focus:border-[#F59E0B] focus:outline-none"
              />
            </div>

            {/* Background Image Setting */}
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-none space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-stone-800">
                <ImageIcon className="w-4 h-4 text-[#D97706]" />
                <span>تصویر پس‌زمینه بنر *</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {content.image?.url && (
                  <div
                    onClick={() => setLightboxUrl(content.image.url)}
                    className="w-28 h-28 sm:w-32 sm:h-32 shrink-0 border border-[#D5C7B8] bg-[#FAF8F5] p-1 flex items-center justify-center overflow-hidden rounded-none shadow-xs relative group cursor-zoom-in"
                    title="کلیک برای بزرگنمایی تصویر"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setLightboxUrl(content.image.url);
                      }
                    }}
                  >
                    <img
                      src={content.image.url}
                      alt={content.image.alt || ''}
                      className="w-full h-full object-cover rounded-none transition-transform duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 pointer-events-none">
                      <ZoomIn className="w-5 h-5 text-amber-300 drop-shadow-sm" />
                      <span className="text-[10px] font-bold drop-shadow-sm">بزرگنمایی</span>
                    </div>
                  </div>
                )}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  <input
                    type="text"
                    required
                    value={content.image?.url || ''}
                    onChange={(e) =>
                      updateContentField('image', { ...content.image, url: e.target.value })
                    }
                    placeholder="آدرس فایل تصویر (مثلاً /images/bees-banner.jpg)"
                    className="h-10 px-3 text-xs font-bold bg-white border border-stone-300 rounded-none focus:ring-1 focus:ring-[#F59E0B] font-mono"
                    dir="ltr"
                  />
                  <input
                    type="text"
                    value={content.image?.alt || ''}
                    onChange={(e) =>
                      updateContentField('image', { ...content.image, alt: e.target.value })
                    }
                    placeholder="متن جایگزین (Alt)"
                    className="h-10 px-3 text-xs font-bold bg-white border border-stone-300 rounded-none focus:ring-1 focus:ring-[#F59E0B]"
                  />
                </div>
              </div>
            </div>

            {/* Controlled Link Picker */}
            <ControlledLinkPicker
              value={content.cta}
              onChange={(val) => updateContentField('cta', val)}
            />
          </div>
        )}

        {/* CARD_CAROUSEL Form */}
        {type === 'CARD_CAROUSEL' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700">عنوان اسلایدر</label>
                <input
                  type="text"
                  value={content.title || ''}
                  onChange={(e) => updateContentField('title', e.target.value)}
                  placeholder="محصولات ممتاز باباخُرم یا دستور پخت‌های منتخب"
                  className="w-full h-11 px-3 text-sm font-bold bg-[#FDFBF8] border border-[#D5C7B8] rounded-none focus:bg-white focus:ring-1 focus:ring-[#F59E0B] focus:border-[#F59E0B] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700">منبع محتوای کارت‌ها *</label>
                <select
                  value={content.source || 'RECIPES'}
                  onChange={(e) => updateContentField('source', e.target.value)}
                  className="w-full h-11 px-3 text-sm font-bold bg-[#FDFBF8] border border-[#D5C7B8] rounded-none focus:bg-white focus:ring-1 focus:ring-[#F59E0B] focus:border-[#F59E0B] focus:outline-none"
                >
                  <option value="PRODUCTS">تمام محصولات فعال (PRODUCTS)</option>
                  <option value="RECIPES">تمام دستور پخت‌های فعال (RECIPES)</option>
                  <option value="SELECTED">آیتم‌های گلچین‌شده سفارشی (SELECTED)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700">زیرعنوان اسلایدر</label>
                <input
                  type="text"
                  value={content.subtitle || ''}
                  onChange={(e) => updateContentField('subtitle', e.target.value)}
                  placeholder="ترکیبات، نوشیدنی‌ها و دسرهای اصیل تهیه‌شده با عسل خالص"
                  className="w-full h-11 px-3 text-sm font-bold bg-[#FDFBF8] border border-[#D5C7B8] rounded-none focus:bg-white focus:ring-1 focus:ring-[#F59E0B] focus:border-[#F59E0B] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700">حداکثر تعداد کارت‌ها</label>
                <input
                  type="text"
                  inputMode="numeric"
                  dir="ltr"
                  value={content.maxItems || 12}
                  onChange={(e) => {
                    const parsed = parseLocalizedInt(e.target.value);
                    updateContentField('maxItems', Number.isFinite(parsed) ? parsed : 12);
                  }}
                  className="w-full h-11 px-3 text-sm font-bold font-mono bg-[#FDFBF8] border border-[#D5C7B8] rounded-none focus:bg-white focus:ring-1 focus:ring-[#F59E0B] focus:border-[#F59E0B] focus:outline-none"
                />
              </div>
            </div>

            {/* Controlled Link Picker */}
            <ControlledLinkPicker
              value={content.cta}
              onChange={(val) => updateContentField('cta', val)}
              label="دکمه پیوند پایین کاروسل (اختیاری)"
            />
          </div>
        )}

        {/* CONTENT_GRID Form */}
        {type === 'CONTENT_GRID' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700">عنوان گرید محتوایی</label>
              <input
                type="text"
                value={content.title || ''}
                onChange={(e) => updateContentField('title', e.target.value)}
                placeholder="ویژگی‌ها و استانداردهای عسل باباخُرم"
                className="w-full h-11 px-3.5 text-sm font-bold bg-[#FDFBF8] border border-[#D5C7B8] rounded-none focus:bg-white focus:ring-1 focus:ring-[#F59E0B] focus:border-[#F59E0B] focus:outline-none"
              />
            </div>

            {/* Grid Items List */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-stone-800">آیتم‌های گرید (حداکثر ۱۲ آیتم)</span>
                {gridItems.length < 12 && (
                  <button
                    type="button"
                    onClick={handleAddGridItem}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FEF3C7] text-[#92400E] hover:bg-[#FDE68A] text-xs font-black rounded-none transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن آیتم گرید</span>
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {gridItems.map((item, idx) => (
                  <div key={item.id || idx} className="p-4 bg-stone-50 border border-stone-200 rounded-none space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-700">آیتم شماره {idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveGridItem(idx)}
                        className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف</span>
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 items-start">
                      {item.image?.url && (
                        <div
                          onClick={() => setLightboxUrl(item.image.url)}
                          className="w-20 h-20 shrink-0 border border-[#D5C7B8] bg-[#FAF8F5] p-1 flex items-center justify-center overflow-hidden rounded-none shadow-xs relative group cursor-zoom-in"
                          title="کلیک برای بزرگنمایی تصویر"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setLightboxUrl(item.image.url);
                            }
                          }}
                        >
                          <img
                            src={item.image.url}
                            alt={item.image.alt || item.title || ''}
                            className="w-full h-full object-cover rounded-none transition-transform duration-200 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 pointer-events-none">
                            <ZoomIn className="w-4 h-4 text-amber-300 drop-shadow-sm" />
                            <span className="text-[9px] font-bold drop-shadow-sm">بزرگنمایی</span>
                          </div>
                        </div>
                      )}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                        <input
                          type="text"
                          required
                          value={item.title || ''}
                          onChange={(e) => handleUpdateGridItem(idx, 'title', e.target.value)}
                          placeholder="عنوان آیتم *"
                          className="h-10 px-3 text-xs font-bold bg-white border border-stone-300 rounded-none focus:ring-1 focus:ring-[#F59E0B]"
                        />
                        <input
                          type="text"
                          value={item.image?.url || ''}
                          onChange={(e) =>
                            handleUpdateGridItem(idx, 'image', { url: e.target.value, alt: item.title })
                          }
                          placeholder="آدرس آیکون/تصویر (اختیاری)"
                          className="h-10 px-3 text-xs font-bold bg-white border border-stone-300 rounded-none focus:ring-1 focus:ring-[#F59E0B] font-mono"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      value={item.description || ''}
                      onChange={(e) => handleUpdateGridItem(idx, 'description', e.target.value)}
                      placeholder="توضیحات کوتاه آیتم..."
                      className="w-full p-2.5 text-xs font-bold bg-white border border-stone-300 rounded-none focus:ring-1 focus:ring-[#F59E0B]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border-2 border-red-600 text-red-950 text-xs sm:text-sm font-bold rounded-none shadow-md flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-700" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-600 text-emerald-950 text-xs sm:text-sm font-bold rounded-none shadow-md flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-700" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-[#D5C7B8]">
        <Link
          href="/admin/homepage"
          className="flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-stone-600 hover:text-stone-900 transition-colors whitespace-nowrap min-w-max"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به لیست سکشن‌ها</span>
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-8 py-3 bg-[#F59E0B] hover:bg-[#D97706] text-white font-black text-sm rounded-none transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer whitespace-nowrap min-w-max"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>در حال ذخیره‌سازی...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{isNew ? 'ایجاد سکشن جدید' : 'ذخیره تغییرات'}</span>
            </>
          )}
        </button>
      </div>

      {/* Lightbox Modal */}
      {lightboxUrl && (
        <ImageLightboxModal
          isOpen={Boolean(lightboxUrl)}
          onClose={() => setLightboxUrl(null)}
          imageUrl={lightboxUrl}
        />
      )}
    </form>
  );
}
