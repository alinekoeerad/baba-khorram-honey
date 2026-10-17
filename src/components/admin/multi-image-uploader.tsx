'use client';

/**
 * Multi-Image Gallery Uploader Component (Phase 3, Task 5)
 * Handles:
 * - Multi-file selection and sequential upload
 * - Reordering of gallery items (move up/down)
 * - Individual alt text editing
 * - Removal of individual images
 * - Accessible keyboard navigation and Persian messaging
 */

import React, { useState, useRef, useTransition } from 'react';
import { Picture } from '@/components/ui/picture';
import { uploadMediaAction, updateMediaAltAction } from '@/server/actions/media-actions';
import { MediaAssetRecord } from '@/server/db/client';
import { uiStringsFa } from '@/content/ui-strings.fa';

export interface MultiImageUploaderProps {
  values: MediaAssetRecord[];
  onChange: (assets: MediaAssetRecord[]) => void;
  label?: string;
  maxImages?: number;
  className?: string;
}

export function MultiImageUploader({
  values = [],
  onChange,
  label = uiStringsFa.adminMedia.multiUploadTitle,
  maxImages = 10,
  className = '',
}: MultiImageUploaderProps) {
  const [isPending, startTransition] = useTransition();
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (values.length + files.length > maxImages) {
      setError(`حداکثر ${maxImages} تصویر می‌توانید در این گالری اضافه کنید.`);
      return;
    }

    setError(null);
    setProgress(10);

    startTransition(async () => {
      const uploadedAssets: MediaAssetRecord[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 10 * 1024 * 1024) {
          setError(`فایل ${file.name} بیش از ۱۰ مگابایت است و رد شد.`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('alt', '');

        const res = await uploadMediaAction(formData);
        if (res.success && res.data) {
          uploadedAssets.push(res.data);
        } else {
          setError(res.error || uiStringsFa.adminMedia.processingError);
        }

        setProgress(Math.round(((i + 1) / files.length) * 100));
      }

      if (uploadedAssets.length > 0) {
        onChange([...values, ...uploadedAssets]);
      }

      setTimeout(() => setProgress(0), 400);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= values.length) return;

    const updated = [...values];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    const updated = values.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  const handleAltChange = async (index: number, newAlt: string) => {
    const updated = [...values];
    updated[index] = { ...updated[index], alt: newAlt };
    onChange(updated);

    if (updated[index].id) {
      await updateMediaAltAction({ assetId: updated[index].id, alt: newAlt });
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#332115]">{label}</h3>
          <span className="text-xs text-[#5C5248]">
            {values.length} از {maxImages} تصویر اضافه شده است.
          </span>
        </div>

        {values.length < maxImages && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FBBF24] hover:bg-[#F59E0B] text-[#332115] font-bold text-xs transition-colors cursor-pointer"
          >
            <span>+</span>
            <span>{uiStringsFa.adminMedia.addImage}</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFilesSelect}
        className="hidden"
        aria-label={label}
      />

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

      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-[#FEF2F2] border-s-4 border-[#9E3556] text-[#9E3556] text-xs leading-relaxed" role="alert">
          {error}
        </div>
      )}

      {/* Empty State */}
      {values.length === 0 && (
        <div
          onClick={() => fileInputRef.current?.click()}
          tabIndex={0}
          role="button"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#EFE9E0] bg-[#FFFBEB]/30 hover:border-[#D97706] cursor-pointer transition-colors"
        >
          <div className="w-10 h-10 rounded-none bg-[#FEF3C7] text-[#D97706] flex items-center justify-center mb-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-xs font-bold text-[#332115]">
            {uiStringsFa.adminMedia.uploadPrompt}
          </span>
          <span className="text-[11px] text-[#5C5248] mt-1">
            {uiStringsFa.adminMedia.uploadHint}
          </span>
        </div>
      )}

      {/* Gallery Cards List */}
      {values.length > 0 && (
        <div className="space-y-3">
          {values.map((item, idx) => (
            <div
              key={item.id || idx}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 bg-white border border-[#EFE9E0] shadow-xs"
            >
              {/* Thumbnail */}
              <div className="w-24 h-18 bg-[#FDFBF8] border border-[#EFE9E0] shrink-0 overflow-hidden relative group">
                <Picture asset={item} className="w-full h-full object-cover" />
                <span className="absolute top-1 right-1 bg-[#2B1B10]/85 text-amber-300 font-mono text-[8px] font-bold px-1 py-0.2 border border-amber-500/30">
                  WebP
                </span>
              </div>

              {/* Info & Alt Text */}
              <div className="flex-1 space-y-1.5 w-full">
                <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-[#5C5248]">
                  <div className="flex items-center gap-1.5">
                    <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold px-1.5 py-0.2 text-[9px] rounded-none">
                      WebP
                    </span>
                    <span className="bg-amber-50 text-amber-800 border border-amber-200 font-mono font-bold px-1.5 py-0.2 text-[9px] rounded-none" dir="ltr">
                      {item.width} × {item.height}
                    </span>
                    <span className="bg-stone-100 text-stone-700 border border-stone-200 font-mono font-bold px-1.5 py-0.2 text-[9px] rounded-none" dir="ltr">
                      {Math.round(item.bytes / 1024)} KB
                    </span>
                  </div>
                  <span className="font-mono text-[10px]" dir="ltr">{item.storageKey}</span>
                </div>
                <input
                  type="text"
                  value={item.alt || ''}
                  onChange={(e) => handleAltChange(idx, e.target.value)}
                  placeholder={uiStringsFa.adminMedia.altTextPlaceholder}
                  className="w-full px-2.5 py-1 text-xs border border-[#EFE9E0] focus:outline-none focus:border-[#D97706]"
                  aria-label={`متن جایگزین تصویر ${idx + 1}`}
                />
              </div>

              {/* Ordering and Delete Actions */}
              <div className="flex sm:flex-col gap-1.5 shrink-0 self-end sm:self-center">
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'up')}
                    aria-label={uiStringsFa.adminMedia.moveUp}
                    className="p-1 text-xs font-bold border border-[#EFE9E0] hover:bg-[#FEF3C7] disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={idx === values.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    aria-label={uiStringsFa.adminMedia.moveDown}
                    className="p-1 text-xs font-bold border border-[#EFE9E0] hover:bg-[#FEF3C7] disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    ▼
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  aria-label={uiStringsFa.adminMedia.removeImage}
                  className="px-2 py-1 text-[11px] font-bold text-[#9E3556] hover:bg-[#FEF2F2] border border-[#FECACA] transition-colors"
                >
                  {uiStringsFa.adminMedia.removeImage}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
