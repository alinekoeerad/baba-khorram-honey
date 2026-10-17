'use client';

/**
 * Single Image Uploader Component (Phase 3, Task 5)
 * Accessible, responsive single image uploader with:
 * - Drag-and-drop zone
 * - Preview using <Picture>
 * - Replace / Remove actions
 * - Alt text editing
 * - Persian progress and error messaging
 * - Full keyboard navigation (focus rings, enter/space triggers)
 */

import React, { useState, useRef, useTransition } from 'react';
import { Picture } from '@/components/ui/picture';
import { uploadMediaAction, updateMediaAltAction } from '@/server/actions/media-actions';
import { MediaAssetRecord } from '@/server/db/client';
import { uiStringsFa } from '@/content/ui-strings.fa';

export interface ImageUploaderProps {
  value?: MediaAssetRecord | null;
  onChange: (asset: MediaAssetRecord | null) => void;
  label?: string;
  className?: string;
}

export function ImageUploader({
  value,
  onChange,
  label,
  className = '',
}: ImageUploaderProps) {
  const [isPending, startTransition] = useTransition();
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [altText, setAltText] = useState<string>(value?.alt || '');
  const [isAltSaved, setIsAltSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

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

      const res = await uploadMediaAction(formData);
      clearInterval(timer);
      setProgress(100);

      if (res.success && res.data) {
        onChange(res.data);
        setAltText(res.data.alt || '');
        setError(null);
      } else {
        setError(res.error || uiStringsFa.adminMedia.processingError);
      }

      setTimeout(() => setProgress(0), 400);
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
    if (!value?.id) return;
    const res = await updateMediaAltAction({ assetId: value.id, alt: altText });
    if (res.success) {
      setIsAltSaved(true);
      setTimeout(() => setIsAltSaved(false), 2000);
      onChange({ ...value, alt: altText });
    }
  };

  const handleRemove = () => {
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

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
        aria-label={label || uiStringsFa.adminMedia.uploadTitle}
      />

      {/* Empty State / Upload Dropzone */}
      {!value ? (
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
          className={`flex flex-col items-center justify-center p-6 border-2 border-dashed transition-all cursor-pointer outline-none focus:ring-2 focus:ring-[#D97706] ${
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
        /* Preview & Actions Card */
        <div className="bg-white border border-[#EFE9E0] p-4 shadow-xs space-y-4 rounded-none">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="w-full sm:w-48 h-36 bg-[#FDFBF8] border border-[#EFE9E0] overflow-hidden shrink-0 relative group">
              <Picture
                asset={value}
                alt={altText}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2 right-2 bg-[#2B1B10]/85 backdrop-blur-xs text-amber-300 font-mono text-[9px] font-bold px-1.5 py-0.5 border border-amber-500/30">
                WebP
              </span>
            </div>

            <div className="flex-1 space-y-2 text-xs">
              <div className="flex flex-wrap items-center gap-1.5 pb-1">
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold px-2 py-0.5 text-[10px] rounded-none">
                  فرمت WebP
                </span>
                <span className="bg-amber-50 text-amber-800 border border-amber-200 font-mono font-bold px-2 py-0.5 text-[10px] rounded-none" dir="ltr">
                  {value.width} × {value.height} px
                </span>
                <span className="bg-stone-100 text-stone-700 border border-stone-200 font-mono font-bold px-2 py-0.5 text-[10px] rounded-none" dir="ltr">
                  {Math.round(value.bytes / 1024)} KB
                </span>
              </div>

              <div className="text-[#5C5248]">
                شناسه ذخیره‌سازی: <span className="font-mono text-[11px] select-all" dir="ltr">{value.storageKey}</span>
              </div>

              {/* Alt Text Input */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-[#332115] mb-1">
                  {uiStringsFa.adminMedia.altTextLabel}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder={uiStringsFa.adminMedia.altTextPlaceholder}
                    className="flex-1 px-3 py-1.5 border border-[#EFE9E0] text-xs focus:outline-none focus:border-[#D97706]"
                  />
                  <button
                    type="button"
                    onClick={handleAltSave}
                    className="px-3 py-1.5 bg-[#FEF3C7] text-[#C86A00] font-bold text-xs hover:bg-[#FDE68A] transition-colors"
                  >
                    {isAltSaved ? 'ذخیره شد' : 'ثبت'}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#EFE9E0]">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-bold text-[#D97706] hover:bg-[#FEF3C7] border border-[#FDE68A] transition-colors cursor-pointer"
                >
                  {uiStringsFa.adminMedia.replaceImage}
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="px-3 py-1.5 text-xs font-bold text-[#9E3556] hover:bg-[#FEF2F2] border border-[#FECACA] transition-colors cursor-pointer"
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
          <div className="w-full h-1.5 bg-[#EFE9E0] overflow-hidden">
            <div
              className="h-full bg-[#D97706] transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-[#FEF2F2] border-s-4 border-[#9E3556] text-[#9E3556] text-xs leading-relaxed" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
