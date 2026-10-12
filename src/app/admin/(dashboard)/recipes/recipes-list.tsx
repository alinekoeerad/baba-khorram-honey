'use client';

/**
 * Recipes List Component (Phase 4, Task 3 & Overhaul Enhancements)
 *
 * Implements:
 * - [ADM-UI-01] Zero window.confirm(); Custom ConfirmModal + useToast() integration.
 * - [ADM-UI-02] Unified AdminBadge status matrix.
 */

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { uiStringsFa } from '@/content/ui-strings.fa';
import { duplicateRecipeAction, deleteRecipeAction } from '@/server/actions/recipe-actions';
import { useToast } from '@/components/admin/toast-provider';
import { ConfirmModal } from '@/components/admin/confirm-modal';
import { AdminBadge } from '@/components/admin/admin-badge';
import { Plus } from 'lucide-react';

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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);

  // Confirm Modal state
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; recipe?: RecipeListItem }>({
    isOpen: false,
  });

  const filtered = recipes.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (categoryFilter && !r.categoryIds?.includes(`cat_${categoryFilter}`) && !r.categories?.some((c: any) => c.slug === categoryFilter)) return false;
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

  const handleDuplicate = (recipe: RecipeListItem) => {
    startTransition(async () => {
      const res = await duplicateRecipeAction(recipe.id);
      if (res.success && res.data) {
        toast.success(uiStringsFa.adminRecipes.duplicatedSuccess);
        router.refresh();
      } else {
        toast.error(res.error || 'خطا در کپی دستور');
      }
    });
  };

  const handleConfirmDelete = async () => {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#332115]">{uiStringsFa.adminRecipes.title}</h1>
          <p className="text-xs sm:text-sm text-[#5C5248] mt-1">{uiStringsFa.adminRecipes.subtitle}</p>
        </div>

        <Link
          href="/admin/recipes/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#FBBF24] hover:bg-[#F59E0B] text-[#332115] font-black text-xs rounded-none shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{uiStringsFa.adminRecipes.newRecipe}</span>
        </Link>
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

      {/* Recipes Table */}
      <div className="bg-white border border-[#EFE9E0] rounded-none shadow-xs overflow-x-auto">
        <table className="w-full text-start text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#EFE9E0] text-[#5C5248] bg-[#FDFBF8]">
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
                <td colSpan={7} className="py-8 text-center text-[#5C5248]">
                  هیچ دستوری با معیارهای جستجو یافت نشد.
                </td>
              </tr>
            ) : (
              displayedItems.map((r) => (
                <tr key={r.id} className="hover:bg-[#FFFBEB]/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-[#332115]">
                    <Link href={`/admin/recipes/${r.id}`} className="hover:text-[#D97706]">
                      {r.nameFa}
                    </Link>
                    {r.isFeatured && (
                      <span className="ms-1.5 px-1 py-0.5 text-[9px] bg-[#FEF3C7] text-[#C86A00] font-bold">
                        ویژه
                      </span>
                    )}
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
                    {r.ingredients?.length || 0}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-[#332115]">
                    {r.steps?.length || 0}
                  </td>
                  <td className="py-3 px-4 text-end space-x-reverse space-x-2 whitespace-nowrap">
                    <Link
                      href={`/admin/preview/recipes/${r.id}`}
                      target="_blank"
                      className="px-2 py-1 text-[11px] font-bold text-[#5C5248] hover:bg-[#EFE9E0] border border-[#EFE9E0] rounded-none"
                    >
                      پیش‌نمایش
                    </Link>

                    <Link
                      href={`/admin/recipes/${r.id}`}
                      className="px-2 py-1 text-[11px] font-bold text-[#D97706] hover:bg-[#FEF3C7] border border-[#FDE68A] rounded-none"
                    >
                      ویرایش
                    </Link>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDuplicate(r)}
                      className="px-2 py-1 text-[11px] font-bold text-[#5C5248] hover:bg-[#EFE9E0] border border-[#EFE9E0] rounded-none cursor-pointer"
                    >
                      کپی
                    </button>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setConfirmDelete({ isOpen: true, recipe: r })}
                      className="px-2 py-1 text-[11px] font-bold text-[#9E3556] hover:bg-[#FEF2F2] border border-[#FECACA] rounded-none cursor-pointer"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + 20)}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#332115] font-bold text-xs border border-[#EFE9E0] rounded-none transition-colors cursor-pointer"
          >
            <span>نمایش بیشتر (نمایش {displayedItems.length} از {filtered.length})</span>
          </button>
        </div>
      )}

      {/* [ADM-UI-01] Universal ConfirmModal */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="حذف دستور تهیه"
        itemName={confirmDelete.recipe?.nameFa}
        message="آیا از حذف کامل این دستور اطمینان دارید؟ تمام مواد لازم و مراحل آماده‌سازی حذف خواهند شد."
        confirmLabel="بله، حذف کن"
        cancelLabel="انصراف"
        isLoading={isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete({ isOpen: false })}
      />
    </div>
  );
}
