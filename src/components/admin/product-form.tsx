'use client';

/**
 * Reusable Product Form Component (Phase 4, Task 2 & 4)
 * Contains all Brief Section 8 fields + Order Options editor (Addendum A2/A7):
 * - Auto-suggest slug from nameOriginal
 * - SlugRedirect warning on slug modification
 * - Benefits list editor (add, edit, delete; no reorder)
 * - Order options editor (label, isAvailable; add, edit, delete)
 * - Media uploaders (main image + gallery)
 * - Optimistic concurrency detection (expectedUpdatedAt)
 * - Unsaved changes prompt
 * - Toast / notification banners in Persian
 */

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { uiStringsFa } from '@/content/ui-strings.fa';
import { slugify, parseLocalizedInt } from '@/lib/domain-utils';
import { ImageUploader } from '@/components/admin/image-uploader';
import { MultiImageUploader } from '@/components/admin/multi-image-uploader';
import { createProductAction, updateProductAction } from '@/server/actions/product-actions';
import type { MediaAssetRecord } from '@/server/db/client';
import { useToast } from '@/components/admin/toast-provider';
import { productInputSchema } from '@/server/validation';
import { AlertTriangle } from 'lucide-react';

export interface ProductFormProps {
  initialData?: any;
  categories: Array<{ id: string; name: string; slug: string; status: string }>;
  isEdit?: boolean;
}

export function ProductForm({ initialData, categories, isEdit = false }: ProductFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  // Form Fields
  const [nameFa, setNameFa] = useState(initialData?.nameFa || '');
  const [nameOriginal, setNameOriginal] = useState(initialData?.nameOriginal || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>(initialData?.status || 'DRAFT');
  const [isAvailable, setIsAvailable] = useState<boolean>(initialData?.isAvailable ?? true);
  const [isFeatured, setIsFeatured] = useState<boolean>(initialData?.isFeatured ?? false);
  const [cardTheme, setCardTheme] = useState<'AUTO' | 'GREEN' | 'ORANGE' | 'YELLOW' | 'BURGUNDY'>(initialData?.cardTheme || 'AUTO');
  const [sortOrder, setSortOrder] = useState<number>(initialData?.sortOrder ?? 0);
  const [shortDescription, setShortDescription] = useState(initialData?.shortDescription || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [foodNature, setFoodNature] = useState(initialData?.foodNature || '');
  const [vitamins, setVitamins] = useState(initialData?.vitamins || '');
  const [harvestSeason, setHarvestSeason] = useState(initialData?.harvestSeason || '');
  const [harvestPlace, setHarvestPlace] = useState(initialData?.harvestPlace || '');
  const [color, setColor] = useState(initialData?.color || '');
  const [usageWarning, setUsageWarning] = useState(initialData?.usageWarning || '');

  // Relations & Sub-editors
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    initialData?.categoryIds || (initialData?.categories?.map((c: any) => c.categoryId || c.category?.id) || [])
  );
  const [benefits, setBenefits] = useState<string[]>(
    initialData?.benefits ? initialData.benefits.map((b: any) => (typeof b === 'string' ? b : b.text)) : []
  );
  const [newBenefitText, setNewBenefitText] = useState('');

  const [options, setOptions] = useState<Array<{ id?: string; label: string; isAvailable: boolean; sortOrder?: number }>>(
    initialData?.options && initialData.options.length > 0
      ? initialData.options
      : !isEdit
      ? [
          { label: 'یک کیلوگرم', isAvailable: true, sortOrder: 0 },
          { label: 'نیم کیلوگرم', isAvailable: true, sortOrder: 1 },
        ]
      : []
  );
  const [newOptionLabel, setNewOptionLabel] = useState('');

  const [mainImage, setMainImage] = useState<MediaAssetRecord | null>(initialData?.mainImage || null);
  const [focalPoint, setFocalPoint] = useState<string>((initialData as any)?.focalPoint || 'center');
  const currentImageUrl = (initialData as any)?.imageUrl || (initialData?.mainImage ? (initialData.mainImage.url || `/uploads/${initialData.mainImage.storageKey}`) : null);
  const [galleryImages, setGalleryImages] = useState<MediaAssetRecord[]>(() => {
    if (!initialData?.gallery || !Array.isArray(initialData.gallery)) return [];
    return initialData.gallery
      .map((g: any) => {
        const asset = g?.asset || g;
        if (!asset) return null;
        const url = asset.url || (asset.storageKey ? `/uploads/${asset.storageKey}` : '');
        return {
          id: asset.id || g.assetId || g.id || '',
          url,
          storageKey: asset.storageKey || g.storageKey || '',
          mime: asset.mime || 'image/webp',
          bytes: asset.bytes ?? 0,
          width: asset.width ?? null,
          height: asset.height ?? null,
          blurDataUrl: asset.blurDataUrl || null,
          variants: asset.variants || null,
          alt: asset.alt || g.alt || '',
          createdById: asset.createdById || null,
          createdAt: asset.createdAt ? new Date(asset.createdAt) : new Date(),
          updatedAt: asset.updatedAt ? new Date(asset.updatedAt) : new Date(),
        } as MediaAssetRecord;
      })
      .filter((img: any): img is MediaAssetRecord => Boolean(img && (img.id || img.storageKey || img.url)));
  });

  // UI state
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [conflictError, setConflictError] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const originalSlug = initialData?.slug;
  const isSlugChanged = isEdit && slug !== originalSlug;

  // Track unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const markDirty = () => {
    if (!isDirty) setIsDirty(true);
  };

  const handleNameOriginalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNameOriginal(val);
    markDirty();
    if (!isEdit && !slug) {
      setSlug(slugify(val) || '');
    }
  };

  // Benefits
  const handleAddBenefit = () => {
    if (!newBenefitText.trim()) return;
    setBenefits([...benefits, newBenefitText.trim()]);
    setNewBenefitText('');
    markDirty();
  };

  const handleRemoveBenefit = (idx: number) => {
    setBenefits(benefits.filter((_, i) => i !== idx));
    markDirty();
  };

  const handleEditBenefit = (idx: number, val: string) => {
    const updated = [...benefits];
    updated[idx] = val;
    setBenefits(updated);
    markDirty();
  };

  // Options
  const handleAddOption = () => {
    if (!newOptionLabel.trim()) return;
    setOptions([
      ...options,
      { label: newOptionLabel.trim(), isAvailable: true, sortOrder: options.length },
    ]);
    setNewOptionLabel('');
    markDirty();
  };

  const handleToggleOptionAvailability = (idx: number) => {
    const updated = [...options];
    updated[idx] = { ...updated[idx], isAvailable: !updated[idx].isAvailable };
    setOptions(updated);
    markDirty();
  };

  const handleRemoveOption = (idx: number) => {
    setOptions(options.filter((_, i) => i !== idx));
    markDirty();
  };

  // Categories Multi-Select
  const handleToggleCategory = (catId: string) => {
    markDirty();
    if (selectedCategoryIds.includes(catId)) {
      setSelectedCategoryIds(selectedCategoryIds.filter((id) => id !== catId));
    } else {
      setSelectedCategoryIds([...selectedCategoryIds, catId]);
    }
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    const payload = {
      nameFa,
      nameOriginal: nameOriginal || null,
      slug,
      status,
      isAvailable,
      isFeatured,
      cardTheme,
      sortOrder,
      shortDescription: shortDescription || null,
      description: description || null,
      foodNature: foodNature || null,
      vitamins: vitamins || null,
      harvestSeason: harvestSeason || null,
      harvestPlace: harvestPlace || null,
      color: color || null,
      usageWarning: usageWarning || null,
      benefits,
      options: options.map((o, idx) => ({ id: o.id, label: o.label, isAvailable: o.isAvailable, sortOrder: o.sortOrder ?? idx })),
      categoryIds: selectedCategoryIds,
      mainImageId: mainImage?.id || null,
      focalPoint,
      galleryAssetIds: galleryImages.map((img) => img.id).filter(Boolean),
    };

    // Client-side Zod validation with inline error mapping
    const validation = productInputSchema.safeParse(payload);
    if (!validation.success) {
      const errMap: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const key = issue.path[0]?.toString() || 'general';
        if (!errMap[key]) {
          errMap[key] = issue.message;
        }
      });
      setFieldErrors(errMap);
      toast.error('لطفاً خطاهای مشخص‌شده در فرم را اصلاح نمایید.');
      const firstField = Object.keys(errMap)[0];
      const targetElement = document.getElementById(`field-${firstField}`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetElement.focus();
      }
      return;
    }

    setFieldErrors({});

    startTransition(async () => {
      try {
        let res;
        if (isEdit) {
          res = await updateProductAction({
            id: initialData.id,
            input: payload as any,
            expectedUpdatedAt: initialData.updatedAt,
          });
        } else {
          res = await createProductAction(payload as any);
        }

        if (res.success && res.data) {
          setConflictError(false);
          setIsDirty(false);
          toast.success(uiStringsFa.adminProducts.savedSuccess);
          setNotification({ type: 'success', message: uiStringsFa.adminProducts.savedSuccess });
          if (!isEdit) {
            router.push(`/admin/products/${res.data.id}`);
          } else {
            router.refresh();
          }
        } else {
          if ((res as any).isConflict) {
            setConflictError(true);
          }
          const errorMsg = res.error || 'خطا در ذخیره‌سازی اطلاعات محصول';
          toast.error(errorMsg);
          setNotification({
            type: 'error',
            message: errorMsg,
          });
        }
      } catch (err: any) {
        const errorMsg = err?.message || 'خطا در ارتباط با سرور هنگام ذخیره محصول';
        toast.error(errorMsg);
        setNotification({
          type: 'error',
          message: errorMsg,
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#EFE9E0] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#332115]">
            {isEdit ? `${uiStringsFa.adminProducts.editProduct}: ${initialData?.nameFa}` : uiStringsFa.adminProducts.newProduct}
          </h1>
          <p className="text-xs text-[#5C5248] mt-1">{uiStringsFa.adminProducts.subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          {isEdit && (
            <Link
              href={`/admin/preview/products/${initialData.id}`}
              target="_blank"
              className="px-3.5 py-2 text-xs font-bold text-[#D97706] hover:bg-[#FEF3C7] border border-[#FDE68A] transition-colors"
            >
              {uiStringsFa.adminProducts.preview} ↗
            </Link>
          )}

          <Link
            href="/admin/products"
            className="px-3.5 py-2 text-xs font-bold text-[#5C5248] hover:bg-[#EFE9E0] border border-[#EFE9E0] transition-colors"
          >
            {uiStringsFa.adminForms.cancel}
          </Link>

          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2 bg-[#FBBF24] hover:bg-[#F59E0B] text-[#332115] font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isPending ? uiStringsFa.adminForms.saving : uiStringsFa.adminForms.save}
          </button>
        </div>
      </div>

      {/* Concurrency Conflict Alert Banner */}
      {conflictError && (
        <div className="p-4 bg-amber-50 border-2 border-amber-500 rounded-none text-right space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>هشدار تداخل ویرایش همزمان (Concurrency Conflict)</span>
          </div>
          <p className="text-xs sm:text-sm text-amber-800 font-medium leading-relaxed">
            این محصول از زمان باز شدن توسط کاربر یا تب دیگری تغییر یافته است. برای جلوگیری از پاک شدن تغییرات سایرین، می‌توانید نسخه جدید را در تب دیگر مشاهده و مقایسه کنید.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => window.open(window.location.href, '_blank')}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              باز کردن نسخه جدید در تب دیگر
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 border border-amber-600 text-amber-800 hover:bg-amber-100 text-xs font-bold transition-colors cursor-pointer"
            >
              بارگذاری مجدد صفحه
            </button>
          </div>
        </div>
      )}

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-4 text-xs leading-relaxed border-s-4 ${
            notification.type === 'success'
              ? 'bg-[#F0FDF4] border-[#3F8F3B] text-[#3F8F3B]'
              : 'bg-[#FEF2F2] border-[#9E3556] text-[#9E3556]'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Concurrency Conflict or Slug Warning + 301 Redirect Diff Preview */}
      {isSlugChanged && (
        <div className="p-4 bg-[#FFFBEB] border-s-4 border-[#D97706] text-xs text-[#332115] leading-relaxed space-y-2">
          <div className="flex items-center gap-2 font-bold text-[#D97706]">
            <span>⚠️ پیش‌نمایش ریدایرکت خودکار ۳۰۱ (Permanent Redirect)</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] bg-white p-2.5 border border-[#FDE68A]" dir="ltr">
            <span className="text-red-700 line-through">/products/{originalSlug}</span>
            <span className="text-amber-800 font-bold px-1">➔ 301 ➔</span>
            <span className="text-emerald-700 font-bold">/products/{slug}</span>
          </div>
          <p className="text-[11px] text-[#5C5248]">
            {uiStringsFa.adminProducts.slugWarning}
          </p>
        </div>
      )}

      {/* Section 1: Names and Slugs */}
      <div className="bg-white border border-[#EFE9E0] p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#332115] border-b border-[#EFE9E0] pb-2">
          اطلاعات هویتی و عناوین
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="field-nameFa" className="block text-xs font-bold text-[#332115] mb-1">
              {uiStringsFa.adminProducts.nameFa} *
            </label>
            <input
              id="field-nameFa"
              type="text"
              value={nameFa}
              onChange={(e) => {
                setNameFa(e.target.value);
                markDirty();
                if (fieldErrors.nameFa) {
                  setFieldErrors((prev) => ({ ...prev, nameFa: '' }));
                }
              }}
              placeholder="مثال: عسل زعفران"
              className={`w-full px-3 py-2 border text-xs focus:outline-none transition-colors ${
                fieldErrors.nameFa
                  ? 'border-red-500 bg-red-50/20 focus:border-red-600'
                  : 'border-[#EFE9E0] focus:border-[#D97706]'
              }`}
            />
            {fieldErrors.nameFa && (
              <p className="text-[11px] text-red-600 font-bold mt-1">{fieldErrors.nameFa}</p>
            )}
          </div>

          <div>
            <label htmlFor="field-nameOriginal" className="block text-xs font-bold text-[#332115] mb-1">
              {uiStringsFa.adminProducts.nameOriginal}
            </label>
            <input
              id="field-nameOriginal"
              type="text"
              dir="ltr"
              value={nameOriginal}
              onChange={handleNameOriginalChange}
              placeholder="SAFFRON"
              className="w-full px-3 py-2 border border-[#EFE9E0] text-xs font-mono text-start focus:outline-none focus:border-[#D97706]"
            />
          </div>

          <div>
            <label htmlFor="field-slug" className="block text-xs font-bold text-[#332115] mb-1">
              {uiStringsFa.adminProducts.slug} *
            </label>
            <input
              id="field-slug"
              type="text"
              dir="ltr"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                markDirty();
                if (fieldErrors.slug) {
                  setFieldErrors((prev) => ({ ...prev, slug: '' }));
                }
              }}
              placeholder="saffron"
              className={`w-full px-3 py-2 border text-xs font-mono text-start focus:outline-none transition-colors ${
                fieldErrors.slug
                  ? 'border-red-500 bg-red-50/20 focus:border-red-600'
                  : 'border-[#EFE9E0] focus:border-[#D97706]'
              }`}
            />
            {fieldErrors.slug && (
              <p className="text-[11px] text-red-600 font-bold mt-1">{fieldErrors.slug}</p>
            )}

            {/* 301 Redirect Preview [ADM-WORKFLOW-04] */}
            {isSlugChanged && (
              <div className="mt-2.5 p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs rounded-none space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-none bg-amber-500 animate-pulse" />
                  <span>پیش‌نمایش انتقال نشانی (301 Permanent Redirect):</span>
                </div>
                <div className="font-mono text-[11px] text-amber-800 flex items-center gap-2" dir="ltr">
                  <span className="line-through text-stone-500">/products/{originalSlug}</span>
                  <span>➜</span>
                  <span className="font-bold text-amber-950">/products/{slug}</span>
                </div>
                <p className="text-[10px] text-amber-700 leading-relaxed">
                  جهت حفظ رتبه و اعتبار در موتورهای جستجو (SEO)، لینک قبلی به صورت دائم ۳۰۱ به آدرس جدید منتقل خواهد شد.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 2: Status, Availability & Card Theme */}
      <div className="bg-white border border-[#EFE9E0] p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#332115] border-b border-[#EFE9E0] pb-2">
          وضعیت انتشار، تم و چیدمان
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center">
          <div>
            <label className="block text-xs font-bold text-[#332115] mb-1">
              {uiStringsFa.adminProducts.status}
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as any);
                markDirty();
              }}
              className="w-full px-2.5 py-2 border border-[#EFE9E0] text-xs bg-white"
            >
              <option value="DRAFT">{uiStringsFa.adminProducts.draft}</option>
              <option value="PUBLISHED">{uiStringsFa.adminProducts.published}</option>
              <option value="ARCHIVED">{uiStringsFa.adminProducts.archived}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#332115] mb-1">
              {uiStringsFa.adminProducts.cardTheme}
            </label>
            <select
              value={cardTheme}
              onChange={(e) => {
                setCardTheme(e.target.value as any);
                markDirty();
              }}
              className="w-full px-2.5 py-2 border border-[#EFE9E0] text-xs bg-white"
            >
              <option value="AUTO">خودکار (AUTO - بر مبنای هش شناسه)</option>
              <option value="GREEN">سبز (#4CA849)</option>
              <option value="ORANGE">نارنجی (#E08B38)</option>
              <option value="YELLOW">زرد (#F5A623)</option>
              <option value="BURGUNDY">زرشکی (#9E3556)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#332115] mb-1">
              {uiStringsFa.adminProducts.sortOrder}
            </label>
            <input
              type="text"
              inputMode="numeric"
              dir="ltr"
              value={sortOrder}
              onChange={(e) => {
                const parsed = parseLocalizedInt(e.target.value);
                setSortOrder(Number.isFinite(parsed) ? parsed : 0);
                markDirty();
              }}
              className="w-full px-3 py-2 border border-[#EFE9E0] text-xs font-mono"
            />
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-[#332115]">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => {
                  setIsAvailable(e.target.checked);
                  markDirty();
                }}
                className="w-4 h-4 text-[#D97706]"
              />
              <span>{uiStringsFa.adminProducts.isAvailable}</span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-[#332115]">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => {
                  setIsFeatured(e.target.checked);
                  markDirty();
                }}
                className="w-4 h-4 text-[#D97706]"
              />
              <span>{uiStringsFa.adminProducts.isFeatured}</span>
            </label>
          </div>
        </div>
      </div>

      {/* Section 3: Categories Selection (Active only) */}
      <div className="bg-white border border-[#EFE9E0] p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#332115] border-b border-[#EFE9E0] pb-2">
          {uiStringsFa.adminProducts.categories}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {categories.map((cat) => {
            const isChecked = selectedCategoryIds.includes(cat.id);
            return (
              <label
                key={cat.id}
                className={`flex items-center gap-2 p-2.5 border cursor-pointer text-xs transition-colors ${
                  isChecked ? 'border-[#D97706] bg-[#FEF3C7]/40 font-bold' : 'border-[#EFE9E0] hover:bg-[#FFFBEB]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleCategory(cat.id)}
                  className="w-4 h-4 text-[#D97706]"
                />
                <span>{cat.name}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Section 4: Specifications & Verbatim Attributes */}
      <div className="bg-white border border-[#EFE9E0] p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#332115] border-b border-[#EFE9E0] pb-2">
          مشخصات زیستی و طبیعی محصول
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#332115] mb-1">{uiStringsFa.adminProducts.foodNature}</label>
            <input
              type="text"
              value={foodNature}
              onChange={(e) => {
                setFoodNature(e.target.value);
                markDirty();
              }}
              placeholder="گرم / سرد / معتدل"
              className="w-full px-3 py-1.5 border border-[#EFE9E0] text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#332115] mb-1">{uiStringsFa.adminProducts.vitamins}</label>
            <input
              type="text"
              value={vitamins}
              onChange={(e) => {
                setVitamins(e.target.value);
                markDirty();
              }}
              placeholder="C, B1, B2..."
              className="w-full px-3 py-1.5 border border-[#EFE9E0] text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#332115] mb-1">{uiStringsFa.adminProducts.color}</label>
            <input
              type="text"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                markDirty();
              }}
              placeholder="عنبری / کهربایی / روشن..."
              className="w-full px-3 py-1.5 border border-[#EFE9E0] text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#332115] mb-1">{uiStringsFa.adminProducts.harvestSeason}</label>
            <input
              type="text"
              value={harvestSeason}
              onChange={(e) => {
                setHarvestSeason(e.target.value);
                markDirty();
              }}
              placeholder="تابستان / آبان ماه..."
              className="w-full px-3 py-1.5 border border-[#EFE9E0] text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#332115] mb-1">{uiStringsFa.adminProducts.harvestPlace}</label>
            <input
              type="text"
              value={harvestPlace}
              onChange={(e) => {
                setHarvestPlace(e.target.value);
                markDirty();
              }}
              placeholder="دامنه‌های زاگرس / دماوند..."
              className="w-full px-3 py-1.5 border border-[#EFE9E0] text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#332115] mb-1">{uiStringsFa.adminProducts.usageWarning}</label>
            <input
              type="text"
              value={usageWarning}
              onChange={(e) => {
                setUsageWarning(e.target.value);
                markDirty();
              }}
              placeholder="ممنوع برای کودکان زیر یک سال..."
              className="w-full px-3 py-1.5 border border-[#FECACA] bg-[#FEF2F2]/30 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Section 5: Benefits List Editor (Add, Edit, Delete, No reorder) */}
      <div className="bg-white border border-[#EFE9E0] p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#332115] border-b border-[#EFE9E0] pb-2">
          {uiStringsFa.adminProducts.benefits} ({benefits.length} مورد)
        </h2>

        <div className="space-y-2">
          {benefits.map((b, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-xs text-[#D97706] font-bold">•</span>
              <input
                type="text"
                value={b}
                onChange={(e) => handleEditBenefit(idx, e.target.value)}
                className="flex-1 px-3 py-1.5 border border-[#EFE9E0] text-xs"
              />
              <button
                type="button"
                onClick={() => handleRemoveBenefit(idx)}
                className="px-2 py-1 text-xs text-[#9E3556] hover:bg-[#FEF2F2] border border-[#FECACA]"
              >
                حذف
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <input
            type="text"
            value={newBenefitText}
            onChange={(e) => setNewBenefitText(e.target.value)}
            placeholder="عنوان خاصیت دارویی یا کاربرد..."
            className="flex-1 px-3 py-1.5 border border-[#EFE9E0] text-xs"
          />
          <button
            type="button"
            onClick={handleAddBenefit}
            className="px-4 py-1.5 bg-[#FEF3C7] text-[#C86A00] font-bold text-xs hover:bg-[#FDE68A]"
          >
            + {uiStringsFa.adminProducts.addBenefit}
          </button>
        </div>
      </div>

      {/* Section 6: Order Options Editor (Addendum A2/A7) */}
      <div className="bg-white border border-[#EFE9E0] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#EFE9E0] pb-2">
          <div>
            <h2 className="text-sm font-bold text-[#332115]">{uiStringsFa.adminProducts.orderOptions}</h2>
            <p className="text-xs text-[#5C5248] mt-0.5">
              گزینه‌های سفارش قابل انتخاب توسط مشتری در سبد خرید (مانند وزن یا نوع ظرف)
            </p>
          </div>
          <span className="text-xs font-bold text-[#D97706]">{options.length} گزینه</span>
        </div>

        {/* Quick Add Weight Presets [ADM-MOD-02] */}
        <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
          <button
            type="button"
            onClick={() => {
              const standard = [
                { label: 'یک کیلوگرم', isAvailable: true, sortOrder: 0 },
                { label: 'نیم کیلوگرم', isAvailable: true, sortOrder: 1 },
              ];
              setOptions((prev) => {
                const existingLabels = new Set(prev.map((o) => o.label));
                const toAdd = standard.filter((s) => !existingLabels.has(s.label));
                return [...prev, ...toAdd];
              });
              markDirty();
            }}
            className="px-3 py-1 text-[11px] font-bold bg-[#F59E0B] text-white hover:bg-[#D97706] transition-colors rounded-none shadow-xs"
          >
            + افزودن سریع وزن‌های استاندارد
          </button>
          <span className="text-[11px] font-bold text-[#5C5248] mr-1">پیش‌فرض‌های سریع وزن:</span>
          {[
            'ظرف ۱ کیلوگرمی',
            'شیشه ۵۰۰ گرمی',
            'حلب ۲ کیلوگرمی',
            'شیشه ۲۵۰ گرمی',
          ].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setOptions([...options, { label: preset, isAvailable: true, sortOrder: options.length }]);
                markDirty();
              }}
              className="px-2.5 py-1 text-[11px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] hover:bg-[#FDE68A] transition-colors rounded-none"
            >
              + {preset}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {options.map((opt, idx) => (
            <div key={opt.id || idx} className="flex items-center gap-3 p-2 bg-[#FDFBF8] border border-[#EFE9E0]">
              <input
                type="text"
                value={opt.label}
                onChange={(e) => {
                  const updated = [...options];
                  updated[idx] = { ...updated[idx], label: e.target.value };
                  setOptions(updated);
                  markDirty();
                }}
                className="flex-1 px-3 py-1.5 border border-[#EFE9E0] text-xs bg-white"
              />

              <button
                type="button"
                onClick={() => handleToggleOptionAvailability(idx)}
                className={`px-3 py-1 text-xs font-bold border transition-colors ${
                  opt.isAvailable
                    ? 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]'
                    : 'bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]'
                }`}
              >
                {opt.isAvailable ? uiStringsFa.adminProducts.optionAvailable : uiStringsFa.adminProducts.optionUnavailable}
              </button>

              <button
                type="button"
                onClick={() => handleRemoveOption(idx)}
                className="px-2 py-1 text-xs text-[#9E3556] hover:bg-[#FEF2F2] border border-[#FECACA]"
              >
                حذف
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <input
            type="text"
            value={newOptionLabel}
            onChange={(e) => setNewOptionLabel(e.target.value)}
            placeholder="عنوان گزینه جدید (مثال: شیشه ۵۰۰ گرمی)..."
            className="flex-1 px-3 py-1.5 border border-[#EFE9E0] text-xs"
          />
          <button
            type="button"
            onClick={handleAddOption}
            className="px-4 py-1.5 bg-[#FEF3C7] text-[#C86A00] font-bold text-xs hover:bg-[#FDE68A]"
          >
            + {uiStringsFa.adminProducts.addOption}
          </button>
        </div>
      </div>

      {/* Section 7: Media Uploaders */}
      <div className="bg-white border border-[#EFE9E0] p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EFE9E0] pb-2">
          <h2 className="text-sm font-bold text-[#332115]">
            تصاویر و رسانه محصول
          </h2>
          <p className="text-sm text-amber-600 font-medium">
            💡 توصیه میشود: برای نمایش بهتر، از تصاویر عمودی با نسبت ۳ به ۴ (مثلاً ۹۰۰ در ۱۲۰۰ پیکسل) استفاده کنید.
          </p>
        </div>

        <div className="space-y-4">
          <ImageUploader
            label={uiStringsFa.adminProducts.mainImage}
            value={mainImage}
            currentImageUrl={currentImageUrl}
            onChange={(img) => {
              setMainImage(img);
              markDirty();
            }}
          />

          {/* Focal Point Selector */}
          <div className="p-4 bg-[#FAF8F5] border border-[#EFE9E0] space-y-2 rounded-none">
            <label htmlFor="product-focal-point" className="block text-xs font-bold text-[#332115]">
              نقطه تمرکز تصویر (هنگام برش در کارتها):
            </label>
            <select
              id="product-focal-point"
              value={focalPoint}
              onChange={(e) => {
                setFocalPoint(e.target.value);
                markDirty();
              }}
              className="w-full sm:w-72 px-3 py-2 border border-[#D5C7B8] bg-white text-xs font-bold text-[#2B2017] rounded-none focus:outline-none focus:border-[#D97706]"
            >
              <option value="center">مرکز تصویر (پیشفرض)</option>
              <option value="top">بالای تصویر</option>
              <option value="bottom">پایین تصویر</option>
              <option value="right">سمت راست</option>
              <option value="left">سمت چپ</option>
            </select>
            <p className="text-[11px] text-[#786455] leading-relaxed">
              این گزینه مشخص می‌کند هنگام نمایش تصویر در کادر عمودی ۳:۴ کارت‌ها، تمرکز روی کدام بخش باشد تا سوژه از کادر خارج نشود.
            </p>
          </div>
        </div>

        <MultiImageUploader
          label={uiStringsFa.adminProducts.gallery}
          values={galleryImages}
          onChange={(imgs) => {
            setGalleryImages(imgs);
            markDirty();
          }}
        />
      </div>

      {/* Sticky Action Footer [ADM-WORKFLOW-02] */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs border-t border-[#EFE9E0] p-4 shadow-lg flex justify-between items-center z-20">
        <div className="flex items-center gap-2 text-xs">
          {isDirty ? (
            <span className="text-amber-700 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-none bg-amber-500 animate-pulse"></span>
              تغییرات ذخیره‌نشده دارید
            </span>
          ) : (
            <span className="text-stone-500 text-xs">همه تغییرات ذخیره شده‌اند</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="px-4 py-2 text-xs font-bold text-[#5C5248] hover:bg-[#EFE9E0] border border-[#EFE9E0] transition-colors"
          >
            {uiStringsFa.adminForms.cancel}
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 bg-[#FBBF24] hover:bg-[#F59E0B] text-[#332115] font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isPending ? uiStringsFa.adminForms.saving : uiStringsFa.adminForms.save}
          </button>
        </div>
      </div>
    </form>
  );
}
