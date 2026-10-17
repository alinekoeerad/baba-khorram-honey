/**
 * ControlledLinkPicker Component (Brief Section 7)
 * Safe link picker supporting internal routes, product/recipe/category targets, and validated paths.
 */

'use client';

import React from 'react';
import { ControlledLink, LinkType } from '@/server/validation/homepage-schemas';
import { Link as LinkIcon, AlertCircle } from 'lucide-react';

interface ControlledLinkPickerProps {
  value?: ControlledLink | null;
  onChange: (value: ControlledLink) => void;
  label?: string;
}

const LINK_TYPE_LABELS: Record<LinkType, string> = {
  NONE: 'بدون پیوند (غیرفعال)',
  HOME: 'صفحه اصلی',
  PRODUCTS_PAGE: 'کاتالوگ همه محصولات',
  RECIPES_PAGE: 'کاتالوگ همه دستورها',
  CONTACT_PAGE: 'صفحه تماس با ما',
  PRODUCT: 'محصول خاص (اسلاگ یا شناسه)',
  RECIPE: 'دستور پخت خاص (اسلاگ یا شناسه)',
  CATEGORY: 'دسته‌بندی خاص',
  INTERNAL_PATH: 'مسیر داخلی سفارشی (مانند /feedback)',
};

export function ControlledLinkPicker({
  value = { type: 'NONE', label: 'مشاهده بیشتر' },
  onChange,
  label = 'دکمه اقدام (Call to Action / Link)',
}: ControlledLinkPickerProps) {
  const current = value || { type: 'NONE', label: 'مشاهده بیشتر' };

  const handleTypeChange = (type: LinkType) => {
    onChange({
      ...current,
      type,
      targetId: type === 'NONE' || type === 'HOME' || type === 'PRODUCTS_PAGE' || type === 'RECIPES_PAGE' || type === 'CONTACT_PAGE' ? undefined : current.targetId,
      path: type === 'INTERNAL_PATH' ? current.path || '/' : undefined,
    });
  };

  const isInternalPath = current.type === 'INTERNAL_PATH';
  const hasTarget = current.type === 'PRODUCT' || current.type === 'RECIPE' || current.type === 'CATEGORY';

  const pathError =
    isInternalPath && current.path
      ? !current.path.startsWith('/') || current.path.startsWith('//') || current.path.toLowerCase().includes('javascript:')
        ? 'مسیر باید با / آغاز شود و فاقد کاراکترهای نامعتبر باشد.'
        : null
      : null;

  return (
    <div className="p-4 bg-stone-50 border border-stone-200 rounded-none space-y-4">
      <div className="flex items-center gap-2 text-sm font-black text-[#2B2017] border-b border-stone-200 pb-2">
        <LinkIcon className="w-4 h-4 text-[#D97706]" />
        <span>{label}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Link Type Selector */}
        <div>
          <label className="block text-xs font-bold text-stone-600 mb-1">
            نوع پیوند
          </label>
          <select
            value={current.type}
            onChange={(e) => handleTypeChange(e.target.value as LinkType)}
            className="w-full h-10 px-3 text-xs sm:text-sm font-bold bg-white border border-stone-300 rounded-none focus:ring-2 focus:ring-[#F59E0B] focus:outline-none"
          >
            {Object.entries(LINK_TYPE_LABELS).map(([k, text]) => (
              <option key={k} value={k}>
                {text}
              </option>
            ))}
          </select>
        </div>

        {/* Button Text Label */}
        {current.type !== 'NONE' && (
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">
              عنوان متنی دکمه
            </label>
            <input
              type="text"
              value={current.label || ''}
              onChange={(e) => onChange({ ...current, label: e.target.value })}
              placeholder="مثلاً: مشاهده بیشتر، شناخت بیشتر عسل..."
              className="w-full h-10 px-3 text-xs sm:text-sm font-bold bg-white border border-stone-300 rounded-none focus:ring-2 focus:ring-[#F59E0B] focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Target Identifier Input (for PRODUCT, RECIPE, CATEGORY) */}
      {hasTarget && (
        <div>
          <label className="block text-xs font-bold text-stone-600 mb-1">
            اسلاگ یا شناسه انگلیسی مقصد
          </label>
          <input
            type="text"
            value={current.targetId || ''}
            onChange={(e) => onChange({ ...current, targetId: e.target.value.trim() })}
            placeholder="مثلاً: mountain-astragalus-honey یا blueberry-citrus-honey-smoothie"
            className="w-full h-10 px-3 text-xs sm:text-sm font-bold bg-white border border-stone-300 rounded-none focus:ring-2 focus:ring-[#F59E0B] focus:outline-none font-mono"
            dir="ltr"
          />
        </div>
      )}

      {/* Internal Path Input */}
      {isInternalPath && (
        <div className="space-y-1">
          <label className="block text-xs font-bold text-stone-600 mb-1">
            مسیر داخلی (حتماً با / شروع شود)
          </label>
          <input
            type="text"
            value={current.path || ''}
            onChange={(e) => onChange({ ...current, path: e.target.value.trim() })}
            placeholder="/feedback یا /about"
            className={`w-full h-10 px-3 text-xs sm:text-sm font-bold bg-white border rounded-none focus:ring-2 focus:outline-none font-mono ${
              pathError ? 'border-red-500 focus:ring-red-400' : 'border-stone-300 focus:ring-[#F59E0B]'
            }`}
            dir="ltr"
          />
          {pathError && (
            <div className="flex items-center gap-1.5 text-xs text-red-600 font-bold mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{pathError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
