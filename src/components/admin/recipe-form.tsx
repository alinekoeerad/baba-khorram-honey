'use client';

/**
 * Reusable Recipe Form Component (Phase 4, Task 3 & 4)
 * Contains all Brief Section 8 fields for Recipe:
 * - Names, Latin slug with redirect warning
 * - Serving types checkboxes (HOT, WARM, COLD - at least 1 required)
 * - Country, yieldText, short/long descriptions
 * - Ingredients editor (rows: name, quantityText, unit, equivalentText, isOptional, note; add at end, edit, delete, NO reorder)
 * - Steps editor (textarea per step; add at end, edit, delete; NO reorder, NO insert in middle, no images)
 * - Media uploaders (main image + gallery)
 * - Optimistic concurrency detection (expectedUpdatedAt)
 * - Unsaved changes prompt
 */

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { uiStringsFa } from '@/content/ui-strings.fa';
import { slugify, parseLocalizedInt } from '@/lib/domain-utils';
import { ImageUploader } from '@/components/admin/image-uploader';
import { MultiImageUploader } from '@/components/admin/multi-image-uploader';
import { createRecipeAction, updateRecipeAction } from '@/server/actions/recipe-actions';
import type { MediaAssetRecord } from '@/server/db/client';
import { useToast } from '@/components/admin/toast-provider';
import { recipeInputSchema } from '@/server/validation';
import { AlertTriangle, ArrowUp, ArrowDown, Plus } from 'lucide-react';

export interface RecipeFormProps {
  initialData?: any;
  categories: Array<{ id: string; name: string; slug: string; status: string }>;
  products?: Array<{ id: string; nameFa: string; slug: string; status?: string; isAvailable?: boolean }>;
  isEdit?: boolean;
}

export function RecipeForm({ initialData, categories, products = [], isEdit = false }: RecipeFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  // Basic Fields
  const [nameFa, setNameFa] = useState(initialData?.nameFa || '');
  const [nameOriginal, setNameOriginal] = useState(initialData?.nameOriginal || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [country, setCountry] = useState(initialData?.country || '');
  const [servingTypes, setServingTypes] = useState<Array<'HOT' | 'WARM' | 'COLD'>>(
    initialData?.servingTypes || ['COLD']
  );
  const [yieldText, setYieldText] = useState(initialData?.yieldText || '');
  const [shortDescription, setShortDescription] = useState(initialData?.shortDescription || '');
  const [longDescription, setLongDescription] = useState(initialData?.longDescription || '');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>(initialData?.status || 'DRAFT');
  const [isFeatured, setIsFeatured] = useState<boolean>(initialData?.isFeatured ?? false);
  const [cardTheme, setCardTheme] = useState<'AUTO' | 'GREEN' | 'ORANGE' | 'YELLOW' | 'BURGUNDY'>(
    initialData?.cardTheme || 'AUTO'
  );
  const [sortOrder, setSortOrder] = useState<number>(initialData?.sortOrder ?? 0);

  // Categories
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    initialData?.categoryIds || (initialData?.categories?.map((c: any) => c.categoryId || c.category?.id) || [])
  );

  // Ingredients (Add at end, edit, delete, NO reorder)
  const [ingredients, setIngredients] = useState<
    Array<{
      id?: string;
      name: string;
      quantityText: string;
      unit: string;
      equivalentText: string;
      isOptional: boolean;
      note: string;
    }>
  >(
    (initialData?.ingredients || []).map((ing: any) => ({
      id: ing.id,
      name: ing.name || '',
      quantityText: ing.quantityText || '',
      unit: ing.unit || '',
      equivalentText: ing.equivalentText || '',
      isOptional: Boolean(ing.isOptional),
      note: ing.note || '',
    }))
  );

  // Steps
  const [steps, setSteps] = useState<Array<{ id?: string; text: string }>>(
    (initialData?.steps || []).map((s: any) => ({
      id: s.id,
      text: typeof s === 'string' ? s : s.text || '',
    }))
  );

  // Media
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

  // Unsaved changes handler
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

  const handleToggleServingType = (type: 'HOT' | 'WARM' | 'COLD') => {
    markDirty();
    if (servingTypes.includes(type)) {
      if (servingTypes.length === 1) return; // Keep at least one
      setServingTypes(servingTypes.filter((t) => t !== type));
    } else {
      setServingTypes([...servingTypes, type]);
    }
  };

  const handleToggleCategory = (catId: string) => {
    markDirty();
    if (selectedCategoryIds.includes(catId)) {
      setSelectedCategoryIds(selectedCategoryIds.filter((id) => id !== catId));
    } else {
      setSelectedCategoryIds([...selectedCategoryIds, catId]);
    }
  };

  // Ingredients handler (Add at end, edit, delete, NO reorder)
  const handleAddIngredient = () => {
    setIngredients([
      ...ingredients,
      { name: '', quantityText: '', unit: '', equivalentText: '', isOptional: false, note: '' },
    ]);
    markDirty();
  };

  const handleEditIngredient = (idx: number, field: string, value: any) => {
    const updated = [...ingredients];
    updated[idx] = { ...updated[idx], [field]: value };
    setIngredients(updated);
    markDirty();
  };

  const handleRemoveIngredient = (idx: number) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
    markDirty();
  };

  // Steps handler (Add at end, edit, delete, NO reorder, NO insert in middle)
  const handleAddStep = () => {
    setSteps([...steps, { text: '' }]);
    markDirty();
  };

  const handleEditStep = (idx: number, text: string) => {
    const updated = [...steps];
    updated[idx] = { ...updated[idx], text };
    setSteps(updated);
    markDirty();
  };

  const handleRemoveStep = (idx: number) => {
    setSteps(steps.filter((_, i) => i !== idx));
    markDirty();
  };

  const handleMoveStepUp = (idx: number) => {
    if (idx === 0) return;
    const updated = [...steps];
    const temp = updated[idx];
    updated[idx] = updated[idx - 1];
    updated[idx - 1] = temp;
    setSteps(updated);
    markDirty();
  };

  const handleMoveStepDown = (idx: number) => {
    if (idx >= steps.length - 1) return;
    const updated = [...steps];
    const temp = updated[idx];
    updated[idx] = updated[idx + 1];
    updated[idx + 1] = temp;
    setSteps(updated);
    markDirty();
  };

  const handleInsertStepAfter = (idx: number) => {
    const updated = [...steps];
    updated.splice(idx + 1, 0, { text: '' });
    setSteps(updated);
    markDirty();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    const payload = {
      nameFa,
      nameOriginal: nameOriginal || null,
      slug,
      country: country || null,
      servingTypes,
      yieldText: yieldText || null,
      shortDescription: shortDescription || null,
      longDescription: longDescription || null,
      status,
      isFeatured,
      cardTheme,
      sortOrder,
      categoryIds: selectedCategoryIds,
      ingredients: ingredients
        .filter((i) => i.name.trim().length > 0)
        .map((i, idx) => ({ ...i, sortOrder: idx })),
      steps: steps
        .filter((s) => s.text.trim().length > 0)
        .map((s, idx) => ({ text: s.text, sortOrder: idx })),
      mainImageId: mainImage?.id || null,
      focalPoint,
      galleryAssetIds: galleryImages.map((img) => img.id).filter(Boolean),
    };

    // Client-side Zod validation with inline error mapping
    const validation = recipeInputSchema.safeParse(payload);
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
          res = await updateRecipeAction({
            id: initialData.id,
            input: payload,
            expectedUpdatedAt: initialData.updatedAt,
          });
        } else {
          res = await createRecipeAction(payload as any);
        }

        if (res.success && res.data) {
          setConflictError(false);
          setIsDirty(false);
          toast.success(uiStringsFa.adminRecipes.savedSuccess);
          setNotification({ type: 'success', message: uiStringsFa.adminRecipes.savedSuccess });
          if (!isEdit) {
            router.push(`/admin/recipes/${res.data.id}`);
          } else {
            router.refresh();
          }
        } else {
          if ((res as any).isConflict) {
            setConflictError(true);
          }
          const errorMsg = res.error || 'خطا در ذخیره‌سازی اطلاعات دستور';
          toast.error(errorMsg);
          setNotification({
            type: 'error',
            message: errorMsg,
          });
        }
      } catch (err: any) {
        const errorMsg = err?.message || 'خطا در ارتباط با سرور هنگام ذخیره دستور';
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
            {isEdit ? `${uiStringsFa.adminRecipes.editRecipe}: ${initialData?.nameFa}` : uiStringsFa.adminRecipes.newRecipe}
          </h1>
          <p className="text-xs text-[#5C5248] mt-1">{uiStringsFa.adminRecipes.subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          {isEdit && (
            <Link
              href={`/admin/preview/recipes/${initialData.id}`}
              target="_blank"
              className="px-3.5 py-2 text-xs font-bold text-[#D97706] hover:bg-[#FEF3C7] border border-[#FDE68A] transition-colors"
            >
              {uiStringsFa.adminRecipes.preview} ↗
            </Link>
          )}

          <Link
            href="/admin/recipes"
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
            این دستور از زمان باز شدن توسط کاربر یا تب دیگری تغییر یافته است. برای جلوگیری از پاک شدن تغییرات سایرین، می‌توانید نسخه جدید را در تب دیگر مشاهده و مقایسه کنید.
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

      {/* Slug Change Warning & 301 Redirect Diff Preview */}
      {isSlugChanged && (
        <div className="p-4 bg-[#FFFBEB] border-s-4 border-[#D97706] text-xs text-[#332115] leading-relaxed space-y-2">
          <div className="flex items-center gap-2 font-bold text-[#D97706]">
            <span>⚠️ پیش‌نمایش ریدایرکت خودکار ۳۰۱ (Permanent Redirect)</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] bg-white p-2.5 border border-[#FDE68A]" dir="ltr">
            <span className="text-red-700 line-through">/recipes/{originalSlug}</span>
            <span className="text-amber-800 font-bold px-1">➔ 301 ➔</span>
            <span className="text-emerald-700 font-bold">/recipes/{slug}</span>
          </div>
          <p className="text-[11px] text-[#5C5248]">
            با تغییر شناسه لاتین، یک تغییر مسیر دائم ۳۰۱ از نشانی قبلی به نشانی جدید ایجاد خواهد شد.
          </p>
        </div>
      )}

      {/* Section 1: Identity & Serving Types */}
      <div className="bg-white border border-[#EFE9E0] p-4 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#332115] border-b border-[#EFE9E0] pb-2">
          اطلاعات اصلی دستور و نوع سرو
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="field-nameFa" className="block text-xs font-bold text-[#332115] mb-1">
              {uiStringsFa.adminRecipes.nameFa} *
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
              placeholder="مثال: شربت آمالاکی پاناکا"
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
              {uiStringsFa.adminRecipes.nameOriginal}
            </label>
            <input
              id="field-nameOriginal"
              type="text"
              dir="ltr"
              value={nameOriginal}
              onChange={handleNameOriginalChange}
              placeholder="Amalaki Panaka"
              className="w-full px-3 py-2 border border-[#EFE9E0] text-xs font-mono text-start focus:outline-none focus:border-[#D97706]"
            />
          </div>

          <div>
            <label htmlFor="field-slug" className="block text-xs font-bold text-[#332115] mb-1">
              {uiStringsFa.adminRecipes.slug} *
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
              placeholder="amalaki-panaka"
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
                  <span className="line-through text-stone-500">/recipes/{originalSlug}</span>
                  <span>➜</span>
                  <span className="font-bold text-amber-950">/recipes/{slug}</span>
                </div>
                <p className="text-[10px] text-amber-700 leading-relaxed">
                  جهت حفظ رتبه و اعتبار در موتورهای جستجو (SEO)، لینک قبلی به صورت دائم ۳۰۱ به آدرس جدید منتقل خواهد شد.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-[#332115] mb-1">
              {uiStringsFa.adminRecipes.country}
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                markDirty();
              }}
              placeholder="هند / ایران / تونس..."
              className="w-full px-3 py-2 border border-[#EFE9E0] text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#332115] mb-1">
              {uiStringsFa.adminRecipes.yieldText}
            </label>
            <input
              type="text"
              value={yieldText}
              onChange={(e) => {
                setYieldText(e.target.value);
                markDirty();
              }}
              placeholder="برای ۴ نفر / ۱ لیتر..."
              className="w-full px-3 py-2 border border-[#EFE9E0] text-xs"
            />
          </div>

          {/* Serving Types Checkboxes (HOT, WARM, COLD) */}
          <div>
            <label className="block text-xs font-bold text-[#332115] mb-1.5">
              {uiStringsFa.adminRecipes.servingTypes} * (حداقل یک مورد)
            </label>
            <div className="flex flex-wrap gap-4 pt-1">
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={servingTypes.includes('COLD')}
                  onChange={() => handleToggleServingType('COLD')}
                  className="w-4 h-4 text-[#D97706]"
                />
                <span>{uiStringsFa.adminRecipes.servingCold}</span>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={servingTypes.includes('WARM')}
                  onChange={() => handleToggleServingType('WARM')}
                  className="w-4 h-4 text-[#D97706]"
                />
                <span>{uiStringsFa.adminRecipes.servingWarm}</span>
              </label>

              <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={servingTypes.includes('HOT')}
                  onChange={() => handleToggleServingType('HOT')}
                  className="w-4 h-4 text-[#D97706]"
                />
                <span>{uiStringsFa.adminRecipes.servingHot}</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Status & Display Settings */}
      <div className="bg-white border border-[#EFE9E0] p-4 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#332115] border-b border-[#EFE9E0] pb-2">
          وضعیت انتشار و تم
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center">
          <div>
            <label className="block text-xs font-bold text-[#332115] mb-1">وضعیت انتشار</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as any);
                markDirty();
              }}
              className="w-full px-2.5 py-2 border border-[#EFE9E0] text-xs bg-white"
            >
              <option value="DRAFT">پیش‌نویس</option>
              <option value="PUBLISHED">منتشر شده</option>
              <option value="ARCHIVED">بایگانی</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#332115] mb-1">تم کارت</label>
            <select
              value={cardTheme}
              onChange={(e) => {
                setCardTheme(e.target.value as any);
                markDirty();
              }}
              className="w-full px-2.5 py-2 border border-[#EFE9E0] text-xs bg-white"
            >
              <option value="AUTO">خودکار (AUTO)</option>
              <option value="GREEN">سبز</option>
              <option value="ORANGE">نارنجی</option>
              <option value="YELLOW">زرد</option>
              <option value="BURGUNDY">زرشکی</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#332115] mb-1">ترتیب نمایش</label>
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

          <div className="pt-2 sm:pt-4">
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
              <span>دستور برگزیده (Featured)</span>
            </label>
          </div>
        </div>

        {/* Descriptions */}
        <div className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-bold text-[#332115] mb-1">{uiStringsFa.adminRecipes.shortDescription}</label>
            <textarea
              rows={2}
              value={shortDescription}
              onChange={(e) => {
                setShortDescription(e.target.value);
                markDirty();
              }}
              placeholder="توضیح کوتاه ۱ یا ۲ خطی..."
              className="w-full px-3 py-2 border border-[#EFE9E0] text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#332115] mb-1">{uiStringsFa.adminRecipes.longDescription}</label>
            <textarea
              rows={3}
              value={longDescription}
              onChange={(e) => {
                setLongDescription(e.target.value);
                markDirty();
              }}
              placeholder="تاریخچه، پیش‌زمینه فرهنگی یا نکات سرو..."
              className="w-full px-3 py-2 border border-[#EFE9E0] text-xs"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Recipe Categories Selection */}
      <div className="bg-white border border-[#EFE9E0] p-4 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#332115] border-b border-[#EFE9E0] pb-2">
          دسته‌بندی‌های دستور (RECIPE)
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

      {/* Section 4: Ingredients Editor (Add at end, edit, delete, NO reorder) */}
      <div className="bg-white border border-[#EFE9E0] p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#EFE9E0] pb-2 gap-1">
          <div>
            <h2 className="text-sm font-bold text-[#332115]">{uiStringsFa.adminRecipes.ingredients}</h2>
            <p className="text-xs text-[#5C5248] mt-0.5">مواد اولیه با مقادیر دقیق و توضیحات (بدون جابجایی ترتیب)</p>
          </div>
          <span className="text-xs font-bold text-[#D97706] shrink-0">{ingredients.length} قلم ماده</span>
        </div>

        <div className="space-y-3">
          {ingredients.map((ing, idx) => (
            <div key={idx} className="p-3 bg-[#FDFBF8] border border-[#EFE9E0] space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <div className="flex items-center justify-between sm:hidden">
                  <span className="text-xs font-bold text-[#5C5248]">ماده شماره {idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(idx)}
                    className="text-xs font-bold text-[#9E3556] hover:bg-[#FEF2F2] px-2 py-1 border border-[#FECACA] cursor-pointer"
                    aria-label={`حذف ماده ${idx + 1}`}
                  >
                    حذف ماده
                  </button>
                </div>
                <span className="hidden sm:inline sm:col-span-1 text-xs font-bold text-[#5C5248]">{idx + 1}.</span>

                <div className="sm:col-span-4">
                  <input
                    type="text"
                    required
                    placeholder="نام ماده (مثال: عسل طبیعی)..."
                    value={ing.name}
                    onChange={(e) => handleEditIngredient(idx, 'name', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-[#EFE9E0] bg-white"
                  />
                </div>

                <div className="grid grid-cols-3 sm:contents gap-2">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="مقدار (۱۲۰)..."
                      value={ing.quantityText}
                      onChange={(e) => handleEditIngredient(idx, 'quantityText', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-[#EFE9E0] bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="واحد (گرم)..."
                      value={ing.unit}
                      onChange={(e) => handleEditIngredient(idx, 'unit', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-[#EFE9E0] bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="معادل..."
                      value={ing.equivalentText}
                      onChange={(e) => handleEditIngredient(idx, 'equivalentText', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-[#EFE9E0] bg-white"
                    />
                  </div>
                </div>

                <div className="hidden sm:block sm:col-span-1 text-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(idx)}
                    className="text-xs font-bold text-[#9E3556] hover:bg-[#FEF2F2] p-1 border border-[#FECACA] cursor-pointer"
                    aria-label={`حذف ماده ${idx + 1}`}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-[#5C5248]">
                  <input
                    type="checkbox"
                    checked={ing.isOptional}
                    onChange={(e) => handleEditIngredient(idx, 'isOptional', e.target.checked)}
                    className="w-3.5 h-3.5 text-[#D97706]"
                  />
                  <span>اختیاری</span>
                </label>

                <input
                  type="text"
                  placeholder="یادداشت تکمیلی (مثلاً جهت تزئین یا رنده‌شده)..."
                  value={ing.note}
                  onChange={(e) => handleEditIngredient(idx, 'note', e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs border border-[#EFE9E0] bg-white"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddIngredient}
          className="w-full sm:w-auto px-4 py-2 bg-[#FEF3C7] text-[#C86A00] font-bold text-xs hover:bg-[#FDE68A] transition-colors cursor-pointer text-center"
        >
          + {uiStringsFa.adminRecipes.addIngredient}
        </button>
      </div>

      {/* Section 5: Steps Editor */}
      <div className="bg-white border border-[#EFE9E0] p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#EFE9E0] pb-2 gap-1">
          <div>
            <h2 className="text-sm font-bold text-[#332115]">{uiStringsFa.adminRecipes.steps}</h2>
            <p className="text-xs text-[#5C5248] mt-0.5">
              مراحل تهیه با امکان جابجایی ترتیب و درج مرحله در بین خطوط
            </p>
          </div>
          <span className="text-xs font-bold text-[#D97706] shrink-0">{steps.length} مرحله</span>
        </div>

        <div className="space-y-3">
          {steps.map((st, idx) => (
            <div key={idx} className="flex gap-2 sm:gap-2.5 items-start p-2.5 sm:p-3 bg-[#FDFBF8] border border-[#EFE9E0]">
              {/* Reordering Controls */}
              <div className="flex flex-col gap-1 shrink-0 pt-0.5">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMoveStepUp(idx)}
                  className="p-1 text-stone-600 hover:text-stone-900 hover:bg-stone-100 disabled:opacity-30 border border-stone-200 cursor-pointer disabled:cursor-not-allowed"
                  title="انتقال به بالا"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === steps.length - 1}
                  onClick={() => handleMoveStepDown(idx)}
                  className="p-1 text-stone-600 hover:text-stone-900 hover:bg-stone-100 disabled:opacity-30 border border-stone-200 cursor-pointer disabled:cursor-not-allowed"
                  title="انتقال به پایین"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="px-2 py-1 bg-[#D97706] text-white font-bold text-xs shrink-0 mt-0.5">
                {idx + 1}
              </span>

              <textarea
                rows={2}
                required
                value={st.text}
                onChange={(e) => handleEditStep(idx, e.target.value)}
                placeholder={uiStringsFa.adminRecipes.stepPlaceholder}
                className="flex-1 px-3 py-1.5 border border-[#EFE9E0] text-xs bg-white leading-relaxed"
              />

              {/* Insert After & Remove Controls */}
              <div className="flex flex-col gap-1 shrink-0 pt-0.5">
                <button
                  type="button"
                  onClick={() => handleInsertStepAfter(idx)}
                  className="p-1 text-xs font-bold text-[#2E6930] hover:bg-[#F0FDF4] border border-[#BBF7D0] cursor-pointer"
                  title="افزودن مرحله در ادامه این خط (+)"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveStep(idx)}
                  className="text-xs font-bold text-[#9E3556] hover:bg-[#FEF2F2] p-1 border border-[#FECACA] shrink-0 cursor-pointer"
                  aria-label={`حذف مرحله ${idx + 1}`}
                  title="حذف مرحله"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddStep}
          className="w-full sm:w-auto px-4 py-2 bg-[#FEF3C7] text-[#C86A00] font-bold text-xs hover:bg-[#FDE68A] transition-colors cursor-pointer text-center"
        >
          + {uiStringsFa.adminRecipes.addStep}
        </button>
      </div>

      {/* Section 6: Media Uploaders */}
      <div className="bg-white border border-[#EFE9E0] p-4 sm:p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EFE9E0] pb-2">
          <h2 className="text-sm font-bold text-[#332115]">
            تصاویر و رسانه دستور
          </h2>
          <p className="text-sm text-amber-600 font-medium">
            💡 توصیه میشود: برای نمایش بهتر، از تصاویر عمودی با نسبت ۳ به ۴ (مثلاً ۹۰۰ در ۱۲۰۰ پیکسل) استفاده کنید.
          </p>
        </div>

        <div className="space-y-4">
          <ImageUploader
            label="تصویر اصلی دستور"
            value={mainImage}
            currentImageUrl={currentImageUrl}
            onChange={(img) => {
              setMainImage(img);
              markDirty();
            }}
          />

          {/* Focal Point Selector */}
          <div className="p-4 bg-[#FAF8F5] border border-[#EFE9E0] space-y-2 rounded-none">
            <label htmlFor="recipe-focal-point" className="block text-xs font-bold text-[#332115]">
              نقطه تمرکز تصویر (هنگام برش در کارتها):
            </label>
            <select
              id="recipe-focal-point"
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
          label="گالری تصاویر مراحل پخت"
          values={galleryImages}
          onChange={(imgs) => {
            setGalleryImages(imgs);
            markDirty();
          }}
        />
      </div>

      {/* Sticky Action Footer [ADM-WORKFLOW-02] */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs border-t border-[#EFE9E0] p-3 sm:p-4 shadow-lg flex flex-col sm:flex-row justify-between items-center gap-2.5 sm:gap-0 z-20">
        <div className="flex items-center gap-2 text-xs w-full sm:w-auto justify-between sm:justify-start">
          {isDirty ? (
            <span className="text-amber-700 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-none bg-amber-500 animate-pulse"></span>
              تغییرات ذخیره‌نشده دارید
            </span>
          ) : (
            <span className="text-stone-500 text-xs">همه تغییرات ذخیره شده‌اند</span>
          )}
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Link
            href="/admin/recipes"
            className="flex-1 sm:flex-none text-center px-4 py-2 text-xs font-bold text-[#5C5248] hover:bg-[#EFE9E0] border border-[#EFE9E0] transition-colors"
          >
            {uiStringsFa.adminForms.cancel}
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 sm:flex-none px-6 py-2 bg-[#FBBF24] hover:bg-[#F59E0B] text-[#332115] font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 text-center"
          >
            {isPending ? uiStringsFa.adminForms.saving : uiStringsFa.adminForms.save}
          </button>
        </div>
      </div>
    </form>
  );
}
