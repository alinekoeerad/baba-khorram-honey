'use client';

/**
 * ImageLightboxModal
 * Accessible, full-screen lightbox modal for viewing high-resolution image previews in the admin panel.
 * Features:
 * - 90-degree sharp corners (rounded-none)
 * - Click backdrop to close
 * - Escape key to close
 * - Open in new tab action
 * - Dimensions & path info
 */

import React, { useEffect } from 'react';
import { X, ExternalLink, ZoomIn } from 'lucide-react';
import { toPersianDigits } from '@/lib/domain-utils';

export interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt?: string | null;
  caption?: string | null;
  dimensions?: { width?: number | null; height?: number | null; bytes?: number | null };
}

export function ImageLightboxModal({
  isOpen,
  onClose,
  imageUrl,
  alt,
  caption,
  dimensions,
}: ImageLightboxModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="بزرگنمایی تصویر"
    >
      {/* 1. Fixed Top-Left Floating Close Button (Never pushed off-screen) */}
      <button
        type="button"
        onClick={onClose}
        className="fixed top-5 left-5 z-[110] flex items-center gap-2 bg-[#2B2017] hover:bg-red-700 text-white border-2 border-[#F59E0B] px-4 py-2.5 text-sm font-bold shadow-2xl transition-colors cursor-pointer rounded-none"
        title="بستن (Esc)"
        aria-label="بستن پنجره بزرگنمایی"
      >
        <X className="w-5 h-5 text-[#F59E0B]" strokeWidth={2.5} />
        <span>بستن (Esc)</span>
      </button>

      <div
        className="relative flex flex-col items-center max-w-[95vw] max-h-[92vh] w-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="w-full flex items-center justify-between pb-2 text-white/90 gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="bg-[#D97706] text-white px-2 py-0.5 font-bold rounded-none flex items-center gap-1">
              <ZoomIn className="w-3.5 h-3.5" />
              <span>پیش‌نمایش باکیفیت تصویر</span>
            </span>

            {dimensions?.width && dimensions?.height && (
              <span className="bg-stone-900/90 text-stone-300 border border-stone-700 px-2 py-0.5 rounded-none font-mono text-[11px]" dir="ltr">
                {toPersianDigits(dimensions.width)} × {toPersianDigits(dimensions.height)} px
              </span>
            )}

            {dimensions?.bytes && (
              <span className="bg-stone-900/90 text-stone-300 border border-stone-700 px-2 py-0.5 rounded-none font-mono text-[11px]" dir="ltr">
                {toPersianDigits(Math.round(dimensions.bytes / 1024))} KB
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 px-2.5 bg-stone-900/90 hover:bg-stone-800 text-stone-300 hover:text-white border border-stone-700 rounded-none text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              title="باز کردن در برگه جدید مرورگر"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">مشاهده فایل اصلی</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="h-8 px-3 bg-[#D97706] hover:bg-red-700 text-white border border-[#D97706] rounded-none text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              title="بستن (Esc)"
              aria-label="بستن پنجره بزرگنمایی"
            >
              <X className="w-4 h-4" />
              <span>بستن (Esc)</span>
            </button>
          </div>
        </div>

        {/* High-Resolution Centered Image Frame */}
        <div className="relative border-2 border-[#D97706] bg-[#1A130E] flex items-center justify-center overflow-hidden rounded-none shadow-2xl">
          {/* 2. Direct Corner Close Button on Image Frame */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-2 left-2 z-20 w-10 h-10 bg-black/80 hover:bg-red-600 text-white border border-white/30 flex items-center justify-center text-xl font-bold transition-colors cursor-pointer rounded-none shadow-lg"
            title="بستن (Esc)"
            aria-label="بستن پنجره"
          >
            ✕
          </button>

          <img
            src={imageUrl}
            alt={alt || caption || 'بزرگنمایی تصویر'}
            className="max-w-[90vw] max-h-[78vh] object-contain rounded-none select-none block"
          />
        </div>

        {/* Caption & Path Details */}
        <div className="w-full bg-[#1A130E] border-2 border-t-0 border-[#D97706] text-amber-100 px-3 py-2 text-xs flex flex-wrap items-center justify-between gap-2 rounded-none">
          <span className="font-bold truncate max-w-md text-stone-200">
            {caption || alt || 'تصویر بدون متن جایگزین'}
          </span>
          <span className="font-mono text-[11px] text-stone-400 truncate max-w-md select-all" dir="ltr">
            {imageUrl}
          </span>
        </div>
      </div>
    </div>
  );
}
