'use client';

/**
 * Card Palette Manager Component
 *
 * Provides:
 * - Live interactive preview of real mini-cards for each color.
 * - Selection of curated presets harmonized with honey branding.
 * - Custom hex color picker with Auto-Harmonize and automated WCAG contrast calculation.
 * - Enforces minimum 3 colors rule with helpful tooltips.
 * - Revert to defaults button.
 */

import React, { useState } from 'react';
import {
  CardPaletteItem,
  DEFAULT_CARD_PALETTE,
  CURATED_BRAND_PRESETS,
  autoHarmonizeHex,
  deriveContrastPalette,
} from '@/lib/card-palette';
import {
  Palette,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { toPersianDigits } from '@/lib/domain-utils';
import { DottedArrowIcon } from '@/components/ui/dotted-arrow-icon';

export interface CardPaletteManagerProps {
  palette: CardPaletteItem[];
  onChange: (newPalette: CardPaletteItem[]) => void;
}

export function CardPaletteManager({ palette, onChange }: CardPaletteManagerProps) {
  const [customHex, setCustomHex] = useState<string>('#3E6B48');
  const [customName, setCustomName] = useState<string>('');
  const [autoHarmonize, setAutoHarmonize] = useState<boolean>(true);
  const [showPresets, setShowPresets] = useState<boolean>(true);

  const activePalette = Array.isArray(palette) && palette.length >= 3
    ? palette
    : DEFAULT_CARD_PALETTE;

  // Add custom color
  const handleAddCustomColor = () => {
    let finalHex = customHex.trim();
    if (!finalHex.startsWith('#')) {
      finalHex = `#${finalHex}`;
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(finalHex)) {
      alert('لطفاً یک کد رنگ معتبر هگزادسیمال (مانند #3E6B48) وارد کنید.');
      return;
    }

    if (autoHarmonize) {
      finalHex = autoHarmonizeHex(finalHex);
    }

    const id = `CUSTOM_${Date.now()}`;
    const name = customName.trim() || `رنگ سفارشی ${toPersianDigits(activePalette.length + 1)}`;
    const newItem = deriveContrastPalette(finalHex, id, name);

    onChange([...activePalette, newItem]);
    setCustomName('');
  };

  // Add a curated preset
  const handleAddPreset = (preset: CardPaletteItem) => {
    if (activePalette.some((p) => p.bgHex.toUpperCase() === preset.bgHex.toUpperCase())) {
      return;
    }
    onChange([...activePalette, { ...preset, id: `${preset.id}_${Date.now()}` }]);
  };

  // Remove color (enforcing minimum 3 colors)
  const handleRemoveColor = (index: number) => {
    if (activePalette.length <= 3) {
      alert('برای جلوگیری از همرنگ شدن کارت‌های همسایه، پالت باید حداقل ۳ رنگ فعال داشته باشد.');
      return;
    }
    const updated = activePalette.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  // Reset to default 4 classic colors
  const handleResetDefaults = () => {
    onChange([...DEFAULT_CARD_PALETTE]);
  };

  return (
    <div className="space-y-8">
      {/* Header and Rule Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#FFFBEB] border border-[#FDE68A]">
        <div className="flex items-start gap-3">
          <Palette className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-black text-[#2B2017]">
              مدیریت پالت رنگ کارت‌های سایت (محصولات، دستورها و اسلایدرها)
            </h3>
            <p className="text-xs text-[#5C5248] mt-1 leading-relaxed">
              رنگ‌های فعال در الگوریتم عدم همرنگی همسایه‌ها توزیع می‌شوند. با افزودن یا حذف رنگ، ظاهر کارت‌ها در کل سایت بی‌درنگ تغییر می‌کند.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleResetDefaults}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-[#D5C7B8] hover:bg-stone-50 text-[#332115] text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#D97706]" />
          <span>بازنشانی به رنگ‌های پیش‌فرض</span>
        </button>
      </div>

      {/* Minimum 3 Colors Rule Warning */}
      {activePalette.length <= 3 && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-medium">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>توجه:</strong> حداقل ۳ رنگ فعال برای جلوگیری از تداخل رنگی در گریدها الزامی است. دکمه حذف برای رنگ‌های باقیمانده غیرفعال شده است.
          </span>
        </div>
      )}

      {/* Active Colors Live Previews */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#EFE9E0] pb-2">
          <h4 className="text-sm font-black text-[#2B2017]">
            رنگ‌های فعال در سایت ({toPersianDigits(activePalette.length)} رنگ)
          </h4>
          <span className="text-xs text-[#5C5248]">پیش‌نمایش زنده کارت</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {activePalette.map((color, idx) => (
            <div
              key={color.id || idx}
              className="border border-[#EFE9E0] bg-white p-3 space-y-3 relative group"
            >
              {/* Mini Card Preview */}
              <div
                className="p-4 rounded-none transition-all duration-300 shadow-sm flex flex-col justify-between min-h-[140px]"
                style={{
                  backgroundColor: color.bgHex,
                  color: color.textHex,
                  borderBottom: `4px solid ${color.borderHex}`,
                }}
              >
                <div>
                  <span
                    className="inline-block text-[10px] font-black px-2 py-0.5 rounded-full mb-1.5"
                    style={{
                      backgroundColor: color.badgeBgHex || 'rgba(255,255,255,0.85)',
                      color: color.badgeTextHex || '#2B2017',
                    }}
                  >
                    نمونه کارت
                  </span>
                  <div className="text-xs font-black truncate">{color.nameFa}</div>
                  <div
                    className="text-[11px] font-bold opacity-90 truncate mt-0.5"
                    style={{ color: color.subtextHex }}
                  >
                    عسل ارگانیک باباخُرم
                  </div>
                </div>

                <div className="pt-3 border-t border-black/10 flex items-center justify-between text-[10px] font-black">
                  <span>مشاهده محصول</span>
                  <DottedArrowIcon className="w-4 h-4" />
                </div>
              </div>

              {/* Color Metadata & Controls */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div>
                  <div className="font-bold text-[#2B2017] text-[11px] truncate max-w-[120px]" title={color.nameFa}>
                    {color.nameFa}
                  </div>
                  <div className="font-mono text-[10px] text-stone-500 uppercase">{color.bgHex}</div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveColor(idx)}
                  disabled={activePalette.length <= 3}
                  title={activePalette.length <= 3 ? 'حداقل ۳ رنگ الزامی است' : 'حذف این رنگ از پالت'}
                  className="p-1.5 text-stone-400 hover:text-rose-600 disabled:opacity-30 disabled:hover:text-stone-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add New Color Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-[#EFE9E0]">
        {/* Curated Brand Presets */}
        <div className="bg-[#FDFBF8] border border-[#EFE9E0] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-[#2B2017] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#D97706]" />
              <span>رنگ‌های پیشنهادی و هماهنگ با برند</span>
            </h4>
            <span className="text-[11px] text-stone-500">انتخاب سریع با یک کلیک</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CURATED_BRAND_PRESETS.map((preset) => {
              const isAlreadyAdded = activePalette.some(
                (p) => p.bgHex.toUpperCase() === preset.bgHex.toUpperCase()
              );
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleAddPreset(preset)}
                  disabled={isAlreadyAdded}
                  className={`p-2.5 text-right border transition-all text-xs flex flex-col justify-between h-20 rounded-none cursor-pointer ${
                    isAlreadyAdded
                      ? 'opacity-40 border-stone-200 bg-stone-100 cursor-not-allowed'
                      : 'border-[#EFE9E0] hover:border-[#D97706] hover:shadow-xs bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className="w-4 h-4 rounded-none border border-black/10 inline-block"
                      style={{ backgroundColor: preset.bgHex }}
                    />
                    {isAlreadyAdded && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                  <div>
                    <div className="font-bold text-[10px] text-[#2B2017] leading-tight truncate">
                      {preset.nameFa}
                    </div>
                    <div className="font-mono text-[9px] text-stone-400 uppercase">{preset.bgHex}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Color Creator */}
        <div className="bg-[#FDFBF8] border border-[#EFE9E0] p-4 space-y-4">
          <h4 className="text-xs font-black text-[#2B2017] flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-[#D97706]" />
            <span>افزودن رنگ سفارشی با تطبیق خودکار (Custom Color)</span>
          </h4>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#5C5248] mb-1">
                  نام فارسی رنگ (اختیاری):
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="مثلاً: سبز کوهستان، عسلی بلوط"
                  className="w-full text-xs p-2 bg-white border border-[#D5C7B8] focus:border-[#D97706] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5C5248] mb-1">
                  کد هگزادسیمال رنگ:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customHex.startsWith('#') && customHex.length === 7 ? customHex : '#3E6B48'}
                    onChange={(e) => setCustomHex(e.target.value)}
                    className="w-9 h-8 p-0.5 border border-[#D5C7B8] bg-white cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customHex}
                    onChange={(e) => setCustomHex(e.target.value)}
                    placeholder="#3E6B48"
                    className="w-full text-xs font-mono p-2 bg-white border border-[#D5C7B8] focus:border-[#D97706] outline-none uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Auto Harmonize Switch */}
            <label className="flex items-center gap-2 text-xs font-bold text-[#2B2017] cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={autoHarmonize}
                onChange={(e) => setAutoHarmonize(e.target.checked)}
                className="w-4 h-4 accent-[#D97706] cursor-pointer"
              />
              <span>تطبیق خودکار با تم طبیعی و مات سایت (تنظیم اشباع و روشنایی HSL)</span>
            </label>

            <button
              type="button"
              onClick={handleAddCustomColor}
              className="w-full py-2 bg-[#2B2017] hover:bg-[#433427] text-white text-xs font-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>افزودن این رنگ به پالت فعال سایت</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
