/**
 * Media Test Client Component (Phase 3, Task 8 & Phase 5, Task A)
 * Interactive harness for testing ImageUploader, MultiImageUploader, and Picture components.
 */

'use client';

import React, { useState } from 'react';
import { ImageUploader } from '@/components/admin/image-uploader';
import { MultiImageUploader } from '@/components/admin/multi-image-uploader';
import { Picture } from '@/components/ui/picture';
import { MediaAssetRecord } from '@/server/db/client';

export function MediaTestClient() {
  const [singleImage, setSingleImage] = useState<MediaAssetRecord | null>(null);
  const [galleryImages, setGalleryImages] = useState<MediaAssetRecord[]>([]);

  return (
    <div className="space-y-10">
      {/* 1. Single Image Uploader Section */}
      <div className="bg-white border border-[#EFE9E0] rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-[#332115] border-b border-[#EFE9E0] pb-2">
          ۱. آپلود تک‌تصویر (Single Image Uploader)
        </h2>
        <p className="text-xs text-[#5C5248]">
          پشتیبانی از فرمت‌های JPEG، PNG و WebP با محدودیت ۱۰ مگابایت، اعتبارسنجی بایت‌های جادویی و تغییر متن جایگزین (Alt)
        </p>

        <div className="max-w-md">
          <ImageUploader
            value={singleImage}
            onChange={setSingleImage}
            label="تصویر شاخص محصول"
          />
        </div>

        {singleImage && (
          <div className="mt-4 p-4 bg-amber-50/50 rounded-xl border border-amber-200 space-y-2 text-xs">
            <div className="font-bold text-[#2B2017]">مشخصات فایل آپلود شده:</div>
            <div className="grid grid-cols-2 gap-2 text-stone-600 font-mono">
              <div>شناسه: {singleImage.id}</div>
              <div>ابعاد: {singleImage.width}x{singleImage.height}</div>
              <div>حجم: {Math.round(singleImage.bytes / 1024)} KB</div>
              <div>متن جایگزین: {singleImage.alt || '(خالی)'}</div>
            </div>
            <div className="pt-2">
              <span className="font-bold text-[#2B2017]">پیش‌نمایش با کامپوننت &lt;Picture&gt;:</span>
              <div className="mt-2 w-48 h-32 rounded-lg overflow-hidden border border-stone-200">
                <Picture
                  assetId={singleImage.id}
                  width={singleImage.width ?? undefined}
                  height={singleImage.height ?? undefined}
                  blurDataUrl={singleImage.blurDataUrl}
                  alt={singleImage.alt || 'پیش‌نمایش'}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Multi-Image Uploader Section */}
      <div className="bg-white border border-[#EFE9E0] rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-[#332115] border-b border-[#EFE9E0] pb-2">
          ۲. آپلود چندتصویر و گالری (Multi-Image Uploader)
        </h2>
        <p className="text-xs text-[#5C5248]">
          امکان آپلود گروهی، تغییر ترتیب تصاویر، ویرایش مجزای Alt و حذف تصاویر اضافی
        </p>

        <MultiImageUploader
          values={galleryImages}
          onChange={setGalleryImages}
          label="تصاویر گالری محصول"
          maxImages={6}
        />
      </div>
    </div>
  );
}
