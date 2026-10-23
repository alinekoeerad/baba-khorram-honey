'use client';

/**
 * Recipes List Component (Phase 4, Task 3 & Overhaul Enhancements)
 *
 * Implements:
 * - [ADM-UI-01] Zero window.confirm(); Custom ConfirmModal + useToast() integration.
 * - [ADM-UI-02] Unified AdminBadge status matrix.
 */

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { uiStringsFa } from '@/content/ui-strings.fa';
import {
  duplicateRecipeAction,
  deleteRecipeAction,
  updateRecipeAction,
  bulkDeleteRecipesAction,
  bulkUpdateRecipeStatusAction,
} from '@/server/actions/recipe-actions';
import { useToast } from '@/components/admin/toast-provider';
import { ConfirmModal } from '@/components/admin/confirm-modal';
import { AdminBadge } from '@/components/admin/admin-badge';
import { Plus, CheckCircle2, Archive, Trash2, Download } from 'lucide-react';
import { exportToCsv } from '@/lib/csv-export';
import { toPersianDigits } from '@/lib/domain-utils';

export interface RecipeListItem {
  id: string;
  nameFa: string;
  nameOriginal?: string | null;
  slug: string;
  country?: string | null;
  servingTypes: string[];
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isFeatured: boolean;
  cardTheme: string;
  sortOrder: number;
  ingredients?: any[];
  steps?: any[];
  categoryIds?: string[];
  categories?: any[];
  mainImage?: any;
}

export interface RecipesListProps {
  initialRecipes: RecipeListItem[];
  categories: Array<{ id: string; name: string; slug: string }>;
  totalCount: number;
}

export function RecipesList({ initialRecipes, categories, totalCount }: RecipesListProps) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const [recipes, setRecipes] = useState<RecipeListItem[]>(initialRecipes);

  useEffect(() => {
    setRecipes(initialRecipes);
  }, [initialRecipes]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Confirm Modal state
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; recipe?: RecipeListItem; isBulk?: boolean }>({
    isOpen: false,
  });

  const filtered = recipes.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (categoryFilter) {
      const matchCat =
        (r as any).categorySlug === categoryFilter ||
        r.categoryIds?.includes(categoryFilter) ||
        r.categoryIds?.includes(`cat_${categoryFilter}`) ||
        r.categories?.some((c: any) => c.slug === categoryFilter || c.category?.slug === categoryFilter);
      if (!matchCat) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const match =
        (r.nameFa || '').toLowerCase().includes(q) ||
        (r.nameOriginal || '').toLowerCase().includes(q) ||
        (r.slug || '').toLowerCase().includes(q) ||
        (r.country || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const displayedItems = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === displayedItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedItems.map((r) => r.id)));
    }
  };

  // Bulk Status Update (Archive / Publish)
  const handleBulkStatusChange = (newStatus: 'ARCHIVED' | 'PUBLISHED') => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    startTransition(async () => {
      const res = await bulkUpdateRecipeStatusAction({ ids, status: newStatus });
      if (res.success) {
        setRecipes((prev) =>
          prev.map((r) => (selectedIds.has(r.id) ? { ...r, status: newStatus } : r))
        );
        setSelectedIds(new Set());
        toast.success(`${res.data?.count ?? ids.length} دستور به وضعیت «${newStatus === 'ARCHIVED' ? 'بایگانی‌شده' : 'منتشرشده'}» تغییر یافت.`);
      } else {
        toast.error(res.error || 'خطا در تغییر وضعیت دسته‌ای');
      }
    });
  };

  const handleDuplicate = (recipe: RecipeListItem) => {
    startTransition(async () => {
      const res = await duplicateRecipeAction(recipe.id);
      if (res.success && res.data) {
        setRecipes((prev) => [res.data, ...prev]);
        toast.success(uiStringsFa.adminRecipes.duplicatedSuccess);
        router.refresh();
      } else {
        toast.error(res.error || 'خطا در کپی دستور');
      }
    });
  };

  const handleConfirmDelete = async () => {
    if (confirmDelete.isBulk) {
      const idsToDelete = Array.from(selectedIds);
      startTransition(async () => {
        const res = await bulkDeleteRecipesAction(idsToDelete);
        if (res.success) {
          setRecipes((prev) => prev.filter((r) => !selectedIds.has(r.id)));
          setSelectedIds(new Set());
          setConfirmDelete({ isOpen: false });
          toast.success(`${res.data?.count ?? idsToDelete.length} دستور با موفقیت حذف گردید.`);
        } else {
          toast.error(res.error || 'خطا در حذف دسته‌ای');
        }
      });
      return;
    }

    if (!confirmDelete.recipe) return;
    const recipe = confirmDelete.recipe;

    startTransition(async () => {
      const res = await deleteRecipeAction(recipe.id);
      if (res.success) {
        setRecipes((prev) => prev.filter((r) => r.id !== recipe.id));
        setConfirmDelete({ isOpen: false });
        toast.success(uiStringsFa.adminRecipes.deletedSuccess);
      } else {
        toast.error(res.error || 'خطا در حذف دستور');
      }
    });
  };

  // CSV Export
  const handleExportCsv = () => {
    const headers = ['شناسه', 'نام فارسی', 'نام لاتین', 'نامک', 'خاستگاه', 'نحوه سرو', 'وضعیت'];
    const rows = filtered.map((r) => [
      r.id,
      r.nameFa,
      r.nameOriginal || '',
      r.slug,
      r.country || '',
      r.servingTypes?.join(', ') || '',
      r.status,
    ]);
    exportToCsv('recipes_export', headers, rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#332115]">{uiStringsFa.adminRecipes.title}</h1>
          <p className="text-xs sm:text-sm text-[#5C5248] mt-1">{uiStringsFa.adminRecipes.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-stone-50 text-[#332115] font-bold text-xs rounded-none border border-[#EFE9E0] shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#C86A00]" />
            <span>خروجی اکسل</span>
          </button>

          <Link
            href="/admin/recipes/new"
            className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2.5 bg-[#FBBF24] hover:bg-[#F59E0B] text-[#332115] font-black text-xs rounded-none shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{uiStringsFa.adminRecipes.newRecipe}</span>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#EFE9E0] p-4 rounded-none shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={uiStringsFa.adminRecipes.searchPlaceholder}
            className="w-full px-3 py-1.5 border border-[#EFE9E0] text-xs focus:outline-none focus:border-[#D97706] rounded-none"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-[#EFE9E0] text-xs bg-white rounded-none"
          >
            <option value="">{uiStringsFa.adminRecipes.statusFilter}</option>
            <option value="DRAFT">{uiStringsFa.adminRecipes.draft}</option>
            <option value="PUBLISHED">{uiStringsFa.adminRecipes.published}</option>
            <option value="ARCHIVED">{uiStringsFa.adminRecipes.archived}</option>
          </select>
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-[#EFE9E0] text-xs bg-white rounded-none"
          >
            <option value="">{uiStringsFa.adminRecipes.categoryFilter}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Floating Bulk Actions Bar (ADM-WORKFLOW-03) */}
      {selectedIds.size > 0 && (
        <div className="sticky top-16 sm:top-20 z-20 bg-[#332115] text-white p-3 sm:p-3.5 rounded-none shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="w-5 h-5 rounded-none bg-[#F59E0B] text-[#2B2017] flex items-center justify-center font-black text-[11px]">
              {selectedIds.size}
            </span>
            <span>دستور انتخاب شده است</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleBulkStatusChange('PUBLISHED')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-none text-xs font-bold cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>انتشار سراسری</span>
            </button>

            <button
              type="button"
              onClick={() => handleBulkStatusChange('ARCHIVED')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-none text-xs font-bold cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>بایگانی موارد انتخابی</span>
            </button>

            <button
              type="button"
              onClick={() => setConfirmDelete({ isOpen: true, isBulk: true })}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-none text-xs font-bold cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف گروهی</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="px-2.5 py-1.5 text-stone-300 hover:text-white text-xs underline cursor-pointer"
            >
              لغو انتخاب
            </button>
          </div>
        </div>
      )}

      {/* Recipes Table (Desktop: md and up) */}
      <div className="hidden md:block bg-white border border-[#EFE9E0] rounded-none shadow-xs overflow-x-auto">
        <table className="w-full text-start text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#EFE9E0] text-[#5C5248] bg-[#FDFBF8]">
              <th className="py-3 px-3 text-center w-10">
                <input
                  type="checkbox"
                  aria-label="انتخاب همه"
                  checked={displayedItems.length > 0 && selectedIds.size === displayedItems.length}
                  onChange={handleSelectAll}
                  className="rounded-none border-stone-300 text-[#C86A00] focus:ring-[#C86A00] cursor-pointer"
                />
              </th>
              <th className="py-3 px-4 text-start">{uiStringsFa.adminRecipes.nameFa}</th>
              <th className="py-3 px-4 text-start">{uiStringsFa.adminRecipes.nameOriginal}</th>
              <th className="py-3 px-4 text-start">{uiStringsFa.adminRecipes.servingType}</th>
              <th className="py-3 px-4 text-start">{uiStringsFa.adminRecipes.status}</th>
              <th className="py-3 px-4 text-center">{uiStringsFa.adminRecipes.ingredientsCount}</th>
              <th className="py-3 px-4 text-center">{uiStringsFa.adminRecipes.stepsCount}</th>
              <th className="py-3 px-4 text-end">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EFE9E0]">
            {displayedItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-[#5C5248]">
                  هیچ دستوری با معیارهای جستجو یافت نشد.
                </td>
              </tr>
            ) : (
              displayedItems.map((r) => {
                const isSelected = selectedIds.has(r.id);
                return (
                  <tr
                    key={r.id}
                    className={`transition-colors ${isSelected ? 'bg-amber-50/70' : 'hover:bg-[#FFFBEB]/40'}`}
                  >
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        aria-label={`انتخاب ${r.nameFa}`}
                        checked={isSelected}
                        onChange={() => handleToggleSelect(r.id)}
                        className="rounded-none border-stone-300 text-[#C86A00] focus:ring-[#C86A00] cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4 font-bold text-[#332115]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link href={`/admin/recipes/${r.id}`} className="hover:text-[#D97706]">
                          {r.nameFa}
                        </Link>
                        {r.isFeatured && (
                          <span className="px-1 py-0.5 text-[9px] bg-[#FEF3C7] text-[#C86A00] font-bold">
                            ویژه
                          </span>
                        )}
                      </div>
                      {/* Assigned Category Badges */}
                      {(() => {
                        const assigned = categories.filter((c) =>
                          r.categoryIds?.includes(c.id) ||
                          r.categoryIds?.includes(c.slug) ||
                          r.categoryIds?.includes(`cat_${c.slug}`) ||
                          (r as any).categorySlug === c.slug ||
                          r.categories?.some((rc: any) => rc.id === c.id || rc.slug === c.slug || rc.category?.id === c.id || rc.category?.slug === c.slug)
                        );
                        return (
                          <div className="flex flex-wrap items-center gap-1 mt-1 font-normal">
                            {assigned.map((c) => (
                              <span key={c.id} className="px-1.5 py-0.5 bg-stone-100 text-stone-600 text-[10px] border border-stone-200">
                                {c.name}
                              </span>
                            ))}
                            {r.status === 'PUBLISHED' && assigned.length === 0 && (
                              <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 text-[10px] border border-amber-300">
                                بدون دسته‌بندی فعال
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-4 text-[#5C5248] font-mono text-[11px]" dir="ltr">
                      {r.nameOriginal || r.slug}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] text-[#5C5248]">
                        {r.servingTypes?.join(' • ') || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {/* [ADM-UI-02] AdminBadge */}
                      <AdminBadge status={r.status} />
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-[#332115]">
                      {toPersianDigits(r.ingredients?.length || 0)}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-[#332115]">
                      {toPersianDigits(r.steps?.length || 0)}
                    </td>
                    <td className="py-3 px-4 text-end whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 flex-nowrap">
                        <Link
                          href={`/admin/preview/recipes/${r.id}`}
                          target="_blank"
                          className="inline-flex items-center justify-center whitespace-nowrap shrink-0 px-3 py-1.5 min-w-max text-xs font-bold text-[#5C5248] hover:bg-[#EFE9E0] border border-[#D5C7B8] rounded-none transition-colors"
                        >
                          پیش‌نمایش
                        </Link>

                        <Link
                          href={`/admin/recipes/${r.id}`}
                          className="inline-flex items-center justify-center whitespace-nowrap shrink-0 px-3 py-1.5 min-w-max text-xs font-bold text-[#D97706] hover:bg-[#FEF3C7] border border-[#FDE68A] rounded-none transition-colors"
                        >
                          ویرایش
                        </Link>

                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDuplicate(r)}
                          className="inline-flex items-center justify-center whitespace-nowrap shrink-0 px-3 py-1.5 min-w-max text-xs font-bold text-[#5C5248] hover:bg-[#EFE9E0] border border-[#D5C7B8] rounded-none cursor-pointer transition-colors"
                        >
                          کپی
                        </button>

                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => setConfirmDelete({ isOpen: true, recipe: r })}
                          className="inline-flex items-center justify-center whitespace-nowrap shrink-0 px-3 py-1.5 min-w-max text-xs font-bold text-[#9E3556] hover:bg-[#FEF2F2] border border-[#FECACA] rounded-none cursor-pointer transition-colors"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Recipes Mobile Card View */}
      <div className="block md:hidden space-y-3">
        {displayedItems.length === 0 ? (
          <div className="bg-white border border-[#EFE9E0] p-8 text-center text-[#5C5248] text-xs">
            هیچ دستوری با معیارهای جستجو یافت نشد.
          </div>
        ) : (
          displayedItems.map((r) => {
            const isSelected = selectedIds.has(r.id);
            const assigned = categories.filter((c) =>
              r.categoryIds?.includes(c.id) ||
              r.categoryIds?.includes(c.slug) ||
              r.categoryIds?.includes(`cat_${c.slug}`) ||
              (r as any).categorySlug === c.slug ||
              r.categories?.some((rc: any) => rc.id === c.id || rc.slug === c.slug || rc.category?.id === c.id || rc.category?.slug === c.slug)
            );

            return (
              <div
                key={r.id}
                className={`bg-white border p-3.5 shadow-xs transition-colors ${
                  isSelected ? 'border-amber-400 bg-amber-50/40' : 'border-[#EFE9E0]'
                }`}
              >
                {/* Top Row: Checkbox, Name, Status Badge */}
                <div className="flex items-start justify-between gap-2.5 pb-2.5 border-b border-[#EFE9E0]">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(r.id)}
                      className="cursor-pointer w-4 h-4 mt-0.5 shrink-0"
                      aria-label={`انتخاب ${r.nameFa}`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link href={`/admin/recipes/${r.id}`} className="font-black text-sm text-[#332115] hover:text-[#D97706] truncate">
                          {r.nameFa}
                        </Link>
                        {r.isFeatured && (
                          <span className="px-1.5 py-0.5 text-[9px] bg-[#FEF3C7] text-[#C86A00] font-bold shrink-0">
                            ویژه
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#5C5248] font-mono mt-0.5 truncate" dir="ltr">
                        {r.nameOriginal || r.slug}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <AdminBadge status={r.status} />
                  </div>
                </div>

                {/* Middle Info: Categories & Ingredients/Steps */}
                <div className="py-2.5 flex items-center justify-between text-xs text-[#5C5248] gap-2">
                  <div className="flex flex-wrap items-center gap-1 min-w-0">
                    {assigned.slice(0, 2).map((c) => (
                      <span key={c.id} className="px-1.5 py-0.5 bg-stone-100 text-stone-600 text-[10px] border border-stone-200 truncate max-w-[100px]">
                        {c.name}
                      </span>
                    ))}
                    {assigned.length > 2 && (
                      <span className="text-[10px] text-stone-400 shrink-0">+{assigned.length - 2}</span>
                    )}
                    {r.status === 'PUBLISHED' && assigned.length === 0 && (
                      <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 text-[10px] border border-amber-300">
                        بدون دسته‌بندی
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-[11px] text-[#332115]">
                    <span>
                      مواد: <strong>{toPersianDigits(r.ingredients?.length || 0)}</strong>
                    </span>
                    <span>
                      مراحل: <strong>{toPersianDigits(r.steps?.length || 0)}</strong>
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Actions */}
                <div className="pt-2.5 border-t border-[#EFE9E0] flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/admin/recipes/${r.id}`}
                      className="px-3 py-1.5 text-xs font-bold text-[#D97706] bg-[#FEF3C7]/70 hover:bg-[#FEF3C7] border border-[#FDE68A] transition-colors"
                    >
                      ویرایش
                    </Link>
                    <Link
                      href={`/admin/preview/recipes/${r.id}`}
                      target="_blank"
                      className="px-2.5 py-1.5 text-xs font-bold text-[#5C5248] hover:bg-stone-100 border border-stone-200 transition-colors"
                    >
                      پیش‌نمایش
                    </Link>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDuplicate(r)}
                      className="px-2.5 py-1.5 text-xs text-[#5C5248] hover:bg-stone-100 border border-stone-200 cursor-pointer transition-colors"
                    >
                      کپی
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setConfirmDelete({ isOpen: true, recipe: r })}
                      className="px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 cursor-pointer transition-colors"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + 20)}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#332115] font-bold text-xs border border-[#EFE9E0] rounded-none transition-colors cursor-pointer"
          >
            <span>نمایش بیشتر (نمایش {toPersianDigits(displayedItems.length)} از {toPersianDigits(filtered.length)})</span>
          </button>
        </div>
      )}

      {/* [ADM-UI-01] Universal ConfirmModal */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title={confirmDelete.isBulk ? `حذف گروهی ${selectedIds.size} دستور` : 'حذف دستور تهیه'}
        itemName={confirmDelete.isBulk ? `${selectedIds.size} دستور انتخاب‌شده` : confirmDelete.recipe?.nameFa}
        message={
          confirmDelete.isBulk
            ? `آیا از حذف گروهی ${selectedIds.size} دستور انتخاب‌شده اطمینان دارید؟ این عمل غیرقابل بازگشت است.`
            : 'آیا از حذف کامل این دستور اطمینان دارید؟ تمام مواد لازم و مراحل آماده‌سازی حذف خواهند شد.'
        }
        confirmLabel="بله، حذف کن"
        cancelLabel="انصراف"
        isLoading={isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete({ isOpen: false })}
      />
    </div>
  );
}
