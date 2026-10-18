'use client';

/**
 * Single Image Uploader Component (Phase 3, Task 5 & Phase 10)
 * Accessible, responsive single image uploader with:
 * - Persistent thumbnail preview with rigid square aspect ratio
 * - Fallback to existing image URLs (currentImageUrl or string values)
 * - Drag-and-drop zone
 * - Replace / Remove actions
 * - Alt text editing
 * - Persian progress and error messaging
 * - Full keyboard navigation (focus rings, enter/space triggers)
 */

import React, { useState, useRef, useTransition, useEffect } from 'react';
import { uploadMediaAction, updateMediaAltAction, updateMediaFocalPointAction } from '@/server/actions/media-actions';
import type { MediaAssetRecord } from '@/server/db/client';
import { uiStringsFa } from '@/content/ui-strings.fa';
import { ImageLightboxModal } from './image-lightbox-modal';
import { ZoomIn, Focus } from 'lucide-react';

export interface ImageUploaderProps {
  value?: MediaAssetRecord | { url?: string; storageKey?: string; alt?: string; id?: string; width?: number; height?: number; bytes?: number; variants?: any; focalPoint?: string } | string | null;
  currentImageUrl?: string | null;
  onChange: (asset: MediaAssetRecord | null) => void;
  label?: string;
  className?: string;
}

export function ImageUploader({
  value,
  currentImageUrl,
  onChange,
  label,
  className = '',
}: ImageUploaderProps) {
  const [isPending, startTransition] = useTransition();
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [altText, setAltText] = useState<string>(
    typeof value === 'object' && value?.alt ? value.alt : ''
  );
  const [isAltSaved, setIsAltSaved] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Extract initial focalPoint from value variants or direct property
  const extractFocalPoint = (val: any): string => {
    if (val && typeof val === 'object') {
      let variants = val.variants;
      if (typeof variants === 'string') {
        try {
          variants = JSON.parse(variants);
        } catch {}
      }
      if (variants?.focalPoint) return variants.focalPoint;
      if (val.focalPoint) return val.focalPoint;
    }
    return 'center center';
  };

  const [focalPoint, setFocalPoint] = useState<string>(() => extractFocalPoint(value));
  const [isFocalSaved, setIsFocalSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Sync alt text and focalPoint when value changes
  useEffect(() => {
    if (value && typeof value === 'object') {
      if ('alt' in value && value.alt) {
        setAltText(value.alt);
      }
      setFocalPoint(extractFocalPoint(value));
    }
    if (value) {
      setIsRemoved(false);
    }
  }, [value]);

  // Determine active display URL
  const activeImageUrl = (() => {
    if (isRemoved) return null;
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (value && typeof value === 'object') {
      if ('url' in value && typeof value.url === 'string' && value.url.trim()) {
        return value.url.trim();
      }
      if ('storageKey' in value && typeof value.storageKey === 'string' && value.storageKey.trim()) {
        return `/uploads/${value.storageKey.trim()}`;
      }
    }
    if (currentImageUrl && typeof currentImageUrl === 'string' && currentImageUrl.trim()) {
      return currentImageUrl.trim();
    }
    return null;
  })();

  const handleFileSelect = async (file: File) => {
    setError(null);
    setProgress(10);

    // Client-side quick checks
    if (file.size > 10 * 1024 * 1024) {
      setError(uiStringsFa.adminMedia.fileTooLarge);
      setProgress(0);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('alt', altText);

    startTransition(async () => {
      setProgress(40);
      const timer = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 15 : prev));
      }, 100);

      try {
        const res = await uploadMediaAction(formData);
        clearInterval(timer);
        setProgress(100);

        if (res?.success && res.data) {
          setIsRemoved(false);
          onChange(res.data);
          setAltText(res.data.alt || '');
          setError(null);
        } else {
          setError(res?.error || uiStringsFa.adminMedia.processingError);
        }
      } catch (err: any) {
        clearInterval(timer);
        setError(err?.message || uiStringsFa.adminMedia.processingError);
      } finally {
        setTimeout(() => setProgress(0), 400);
      }
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleAltSave = async () => {
    if (!value || typeof value !== 'object' || !('id' in value) || !value.id) return;
    try {
      const res = await updateMediaAltAction({ assetId: value.id, alt: altText });
      if (res?.success) {
        setIsAltSaved(true);
        setTimeout(() => setIsAltSaved(false), 2000);
        onChange({ ...(value as MediaAssetRecord), alt: altText });
      }
    } catch (err) {
      console.warn('Failed to save alt text:', err);
    }
  };

  const handleFocalPointChange = async (newFocal: string) => {
    setFocalPoint(newFocal);
    if (value && typeof value === 'object') {
      let variants = (value as any).variants;
      if (typeof variants === 'string') {
        try {
          variants = JSON.parse(variants);
        } catch {}
      }
      const updatedVariants = { ...(variants || {}), focalPoint: newFocal };
      onChange({ ...(value as MediaAssetRecord), variants: updatedVariants });

      if ('id' in value && value.id) {
        try {
          const res = await updateMediaFocalPointAction({ assetId: value.id, focalPoint: newFocal });
          if (res?.success) {
            setIsFocalSaved(true);
            setTimeout(() => setIsFocalSaved(false), 2000);
          }
        } catch (err) {
          console.warn('Failed to update focal point:', err);
        }
      }
    }
  };

  const handleRemove = () => {
    setIsRemoved(true);
    onChange(null);
    setAltText('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-[#332115]">
          {label}
        </label>
      )}

      {/* 3:4 Aspect Ratio Advisory Note */}
      <div className="flex items-start gap-2.5 p-3 bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-xs leading-relaxed rounded-none">
        <span className="text-base shrink-0 leading-none">💡</span>
        <div>
          <span className="font-bold text-[#78350F]">راهنمای نسبت ابعاد بهینه:</span>{' '}
          نسبت استاندارد کادربندی برای کارت‌های ویترین و محصولات <strong className="font-black text-[#78350F]">۳:۴ عمودی</strong> (مانند ۱۲۰۰×۱۶۰۰ پیکسل یا مضارب آن) است. تصاویری با این نسبت، بیشترین تقارن و وضوح را در کارت‌ها خواهند داشت.
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
        aria-label={label || uiStringsFa.adminMedia.uploadTitle}
      />

      {/* Empty State / Upload Dropzone when NO active image */}
      {!activeImageUrl ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={uiStringsFa.adminMedia.uploadPrompt}
          className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-none transition-all cursor-pointer outline-none focus:ring-2 focus:ring-[#D97706] ${
            isDragging
              ? 'border-[#D97706] bg-[#FEF3C7]/40'
              : 'border-[#EFE9E0] bg-[#FFFBEB]/30 hover:border-[#D97706] hover:bg-[#FFFBEB]'
          }`}
        >
          <div className="w-12 h-12 rounded-none bg-[#FEF3C7] text-[#D97706] flex items-center justify-center mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-sm font-bold text-[#332115]">
            {uiStringsFa.adminMedia.uploadPrompt}
          </span>
          <span className="text-xs text-[#5C5248] mt-1 text-center">
            {uiStringsFa.adminMedia.uploadHint}
          </span>
        </div>
      ) : (
        /* Preview & Actions Card with 3:4 Aspect Ratio */
        <div className="bg-white border border-[#D5C7B8] p-4 shadow-xs space-y-4 rounded-none">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {/* Strict 3:4 portrait preview container with click-to-zoom Lightbox */}
            <div
              onClick={() => setIsLightboxOpen(true)}
              className="w-28 sm:w-32 aspect-[3/4] shrink-0 border border-[#D5C7B8] bg-[#FAF8F5] p-1 flex items-center justify-center overflow-hidden rounded-none shadow-xs relative group cursor-zoom-in"
              title="کلیک برای بزرگنمایی تصویر"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsLightboxOpen(true);
                }
              }}
            >
              <img
                src={activeImageUrl}
                alt={altText || (typeof value === 'object' && value?.alt ? value.alt : '') || label || 'تصویر فعال'}
                className="w-full h-full object-cover rounded-none transition-all duration-300 group-hover:scale-105"
                style={{ objectPosition: focalPoint }}
              />
              {/* Subtle hover overlay with magnifying glass */}
              <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 pointer-events-none">
                <ZoomIn className="w-5 h-5 text-amber-300 drop-shadow-sm" />
                <span className="text-[10px] font-bold drop-shadow-sm">بزرگنمایی</span>
              </div>
              <span className="absolute top-1.5 right-1.5 bg-[#2B1B10]/85 backdrop-blur-xs text-amber-300 font-mono text-[9px] font-bold px-1.5 py-0.5 border border-amber-500/30 pointer-events-none">
                کادر ۳:۴
              </span>
            </div>

            <div className="flex-1 space-y-3 text-xs">
              <div className="flex flex-wrap items-center gap-1.5 pb-1">
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold px-2 py-0.5 text-[10px] rounded-none">
                  {value && typeof value === 'object' && 'storageKey' in value ? 'فرمت WebP بهینه‌شده' : 'تصویر فعال شاخص'}
                </span>
                {value && typeof value === 'object' && 'width' in value && value.width && (
                  <span className="bg-amber-50 text-amber-800 border border-amber-200 font-mono font-bold px-2 py-0.5 text-[10px] rounded-none" dir="ltr">
                    {value.width} × {value.height} px
                  </span>
                )}
                {value && typeof value === 'object' && 'bytes' in value && value.bytes && (
                  <span className="bg-stone-100 text-stone-700 border border-stone-200 font-mono font-bold px-2 py-0.5 text-[10px] rounded-none" dir="ltr">
                    {Math.round(value.bytes / 1024)} KB
                  </span>
                )}
              </div>

              {value && typeof value === 'object' && 'storageKey' in value && value.storageKey && (
                <div className="text-[#5C5248]">
                  شناسه ذخیره‌سازی: <span className="font-mono text-[11px] select-all" dir="ltr">{value.storageKey}</span>
                </div>
              )}

              {/* Framing & Focal Point Selector */}
              <div className="p-2.5 bg-[#FAF8F5] border border-[#EFE9E0] space-y-1.5 rounded-none">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#332115]">
                    <Focus className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>تمرکز کادر در کارت ویترین (Focal Point):</span>
                  </div>
                  {isFocalSaved && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 font-bold">
                      ذخیره شد ✓
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { label: 'بالای کادر (سر شیشه / درپوش)', value: 'center top' },
                    { label: 'مرکز کادر (لیبل و بدنه)', value: 'center center' },
                    { label: 'پایین کادر (پایه ظرف / دسر)', value: 'center bottom' },
                  ].map((preset) => {
                    const isSelected = focalPoint === preset.value;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => handleFocalPointChange(preset.value)}
                        className={`px-2.5 py-1 text-[11px] font-bold border transition-colors rounded-none cursor-pointer ${
                          isSelected
                            ? 'bg-[#FEF3C7] text-[#92400E] border-[#D97706] shadow-2xs'
                            : 'bg-white text-[#5C5248] border-[#D5C7B8] hover:bg-[#FFFBEB] hover:border-[#D97706]'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-[#786455] pt-0.5 leading-normal">
                  با کلیک روی گزینه‌ها، کادر پیش‌نمایش ۳:۴ سمت راست بلافاصله موقعیت تمرکز را نمایش می‌دهد.
                </p>
              </div>

              {/* Alt Text Input */}
              <div>
                <label className="block text-xs font-bold text-[#332115] mb-1">
                  {uiStringsFa.adminMedia.altTextLabel}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder={uiStringsFa.adminMedia.altTextPlaceholder}
                    className="flex-1 px-3 py-1.5 border border-[#D5C7B8] text-xs focus:outline-none focus:border-[#D97706] rounded-none"
                  />
                  {value && typeof value === 'object' && 'id' in value && value.id && (
                    <button
                      type="button"
                      onClick={handleAltSave}
                      className="px-3 py-1.5 bg-[#FEF3C7] text-[#C86A00] font-bold text-xs hover:bg-[#FDE68A] transition-colors rounded-none cursor-pointer"
                    >
                      {isAltSaved ? 'ذخیره شد' : 'ثبت'}
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#EFE9E0]">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-bold text-[#D97706] hover:bg-[#FEF3C7] border border-[#FDE68A] transition-colors cursor-pointer rounded-none"
                >
                  {uiStringsFa.adminMedia.replaceImage}
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="px-3 py-1.5 text-xs font-bold text-[#9E3556] hover:bg-[#FEF2F2] border border-[#FECACA] transition-colors cursor-pointer rounded-none"
                >
                  {uiStringsFa.adminMedia.removeImage}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {isPending && progress > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-[#5C5248]">
            <span>{uiStringsFa.adminMedia.uploading}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#EFE9E0] overflow-hidden rounded-none">
            <div
              className="h-full bg-[#D97706] transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-[#FEF2F2] border-s-4 border-[#9E3556] text-[#9E3556] text-xs leading-relaxed rounded-none" role="alert">
          {error}
        </div>
      )}

      {/* Click-to-Zoom Lightbox Modal */}
      {activeImageUrl && (
        <ImageLightboxModal
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          imageUrl={activeImageUrl}
          alt={altText || (typeof value === 'object' && value?.alt ? value.alt : '') || label || ''}
          caption={typeof value === 'object' && value?.storageKey ? value.storageKey : (label || '')}
          dimensions={value && typeof value === 'object' && value?.width && value?.height ? { width: value.width, height: value.height, bytes: value.bytes } : undefined}
        />
      )}
    </div>
  );
}
