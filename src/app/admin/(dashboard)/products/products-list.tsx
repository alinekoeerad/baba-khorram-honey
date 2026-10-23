'use client';

/**
 * Product List Component (Phase 4, Task 2 & Overhaul Enhancements)
 *
 * Implements:
 * - [ADM-UI-01] Zero window.confirm(); Custom ConfirmModal + useToast() integration.
 * - [ADM-UI-02] Unified AdminBadge status matrix.
 * - [ADM-FEAT-02] Persian-compatible CSV / Excel export.
 * - [ADM-WORKFLOW-03] Bulk selection and floating bulk actions bar.
 */

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { uiStringsFa } from '@/content/ui-strings.fa';
import {
  toggleProductAvailabilityAction,
  duplicateProductAction,
  deleteProductAction,
  bulkDeleteProductsAction,
  bulkToggleProductAvailabilityAction,
} from '@/server/actions/product-actions';
import { useToast } from '@/components/admin/toast-provider';
import { ConfirmModal } from '@/components/admin/confirm-modal';
import { AdminBadge } from '@/components/admin/admin-badge';
import { exportToCsv } from '@/lib/csv-export';
import { toPersianDigits } from '@/lib/domain-utils';
import { Download, Trash2, CheckCircle2, XCircle, Plus, Eye, Edit3, Copy } from 'lucide-react';

export interface ProductListItem {
  id: string;
  nameFa: string;
  nameOriginal?: string | null;
  slug: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  isAvailable: boolean;
  isFeatured: boolean;
  cardTheme: string;
  sortOrder: number;
  optionCount: number;
  categorySlug?: string;
  categoryIds?: string[];
  categories?: any[];
  mainImage?: any;
}

export interface ProductsListProps {
  initialProducts: ProductListItem[];
  categories: Array<{ id: string; name: string; slug: string }>;
  totalCount: number;
}

export function ProductsList({ initialProducts, categories, totalCount }: ProductsListProps) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const [products, setProducts] = useState<ProductListItem[]>(initialProducts);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Confirm Modal State
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; prod?: ProductListItem; isBulk?: boolean }>({
    isOpen: false,
  });

  // Client-side quick filter
  const filtered = products.filter((p) => {
    if (statusFilter && p.status !== statusFilter) return false;
    if (availabilityFilter === 'AVAILABLE' && !p.isAvailable) return false;
    if (availabilityFilter === 'UNAVAILABLE' && p.isAvailable) return false;
    if (categoryFilter) {
      const matchCat =
        p.categorySlug === categoryFilter ||
        p.categoryIds?.includes(categoryFilter) ||
        p.categoryIds?.includes(`cat_${categoryFilter}`) ||
        p.categories?.some((c: any) => c.slug === categoryFilter || c.category?.slug === categoryFilter);
      if (!matchCat) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const match =
        (p.nameFa || '').toLowerCase().includes(q) ||
        (p.nameOriginal || '').toLowerCase().includes(q) ||
        (p.slug || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const displayedItems = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  const handleToggleAvailability = (prod: ProductListItem) => {
    startTransition(async () => {
      const newAvail = !prod.isAvailable;
      const res = await toggleProductAvailabilityAction({ id: prod.id, isAvailable: newAvail });
      if (res.success) {
        setProducts((prev) =>
          prev.map((item) => (item.id === prod.id ? { ...item, isAvailable: newAvail } : item))
        );
        toast.success(`وضعیت موجودی «${prod.nameFa}» به ${newAvail ? 'موجود' : 'ناموجود'} تغییر یافت.`);
      } else {
        toast.error(res.error || 'خطا در تغییر وضعیت');
      }
    });
  };

  const handleDuplicate = (prod: ProductListItem) => {
    startTransition(async () => {
      const res = await duplicateProductAction(prod.id);
      if (res.success && res.data) {
        const duplicatedItem: ProductListItem = {
          ...res.data,
          optionCount: (res.data as any).optionCount ?? (res.data as any).options?.length ?? 0,
        };
        setProducts((prev) => [duplicatedItem, ...prev]);
        toast.success(uiStringsFa.adminProducts.duplicatedSuccess);
        router.refresh();
      } else {
        toast.error(res.error || 'خطا در کپی محصول');
      }
    });
  };

  const confirmDeleteAction = async () => {
    if (confirmDelete.isBulk) {
      // Batched bulk delete
      const idsToDelete = Array.from(selectedIds);
      startTransition(async () => {
        const res = await bulkDeleteProductsAction(idsToDelete);
        if (res.success) {
          setProducts((prev) => prev.filter((p) => !selectedIds.has(p.id)));
          setSelectedIds(new Set());
          setConfirmDelete({ isOpen: false });
          toast.success(`${res.data?.count ?? idsToDelete.length} محصول با موفقیت حذف گردید.`);
        } else {
          toast.error(res.error || 'خطا در حذف دسته‌ای');
        }
      });
      return;
    }

    if (!confirmDelete.prod) return;
    const prod = confirmDelete.prod;

    startTransition(async () => {
      const res = await deleteProductAction(prod.id);
      if (res.success) {
        setProducts((prev) => prev.filter((p) => p.id !== prod.id));
        setConfirmDelete({ isOpen: false });
        toast.success(uiStringsFa.adminProducts.deletedSuccess);
      } else {
        toast.error(res.error || 'خطا در حذف محصول');
      }
    });
  };

  // CSV Export
  const handleExportCsv = () => {
    const headers = ['شناسه', 'نام فارسی', 'نام لاتین', 'اسلاگ', 'وضعیت', 'موجودی', 'تعداد وزن‌ها', 'تم کارت'];
    const rows = filtered.map((p) => [
      p.id,
      p.nameFa,
      p.nameOriginal || '',
      p.slug,
      p.status,
      p.isAvailable ? 'موجود' : 'ناموجود',
      p.optionCount || 0,
      p.cardTheme || 'YELLOW',
    ]);
    exportToCsv('products_export', headers, rows);
    toast.success('فایل اکسل محصولات با موفقیت ایجاد و دانلود شد.');
  };

  // Bulk Selection Handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === displayedItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedItems.map((p) => p.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkToggleAvailability = (isAvailable: boolean) => {
    startTransition(async () => {
      const ids = Array.from(selectedIds);
      const res = await bulkToggleProductAvailabilityAction({ ids, isAvailable });
      if (res.success) {
        setProducts((prev) =>
          prev.map((item) => (selectedIds.has(item.id) ? { ...item, isAvailable } : item))
        );
        toast.success(`وضعیت موجودی ${ids.length} محصول به‌روزرسانی شد.`);
        setSelectedIds(new Set());
      } else {
        toast.error(res.error || 'خطا در به‌روزرسانی موجودی');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Add / Export Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#332115]">{uiStringsFa.adminProducts.title}</h1>
          <p className="text-xs sm:text-sm text-[#5C5248] mt-1">{uiStringsFa.adminProducts.subtitle}</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 bg-white border border-stone-300 hover:bg-stone-50 text-[#332115] font-bold text-xs rounded-none shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-stone-600" />
            <span className="truncate">خروجی اکسل</span>
          </button>

          <Link
            href="/admin/products/new"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#FBBF24] hover:bg-[#F59E0B] text-[#332115] font-black text-xs rounded-none shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="truncate">{uiStringsFa.adminProducts.newProduct}</span>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#EFE9E0] p-4 rounded-none shadow-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Search */}
        <div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={uiStringsFa.adminProducts.searchPlaceholder}
            className="w-full px-3 py-1.5 border border-[#EFE9E0] text-xs focus:outline-none focus:border-[#D97706] rounded-none"
          />
        </div>

        {/* Status */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-[#EFE9E0] text-xs bg-white rounded-none"
          >
            <option value="">{uiStringsFa.adminProducts.statusFilter}</option>
            <option value="DRAFT">{uiStringsFa.adminProducts.draft}</option>
            <option value="PUBLISHED">{uiStringsFa.adminProducts.published}</option>
            <option value="ARCHIVED">{uiStringsFa.adminProducts.archived}</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-[#EFE9E0] text-xs bg-white rounded-none"
          >
            <option value="">{uiStringsFa.adminProducts.categoryFilter}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Availability */}
        <div>
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-[#EFE9E0] text-xs bg-white rounded-none"
          >
            <option value="">{uiStringsFa.adminProducts.availabilityFilter}</option>
            <option value="AVAILABLE">{uiStringsFa.adminProducts.availableOnly}</option>
            <option value="UNAVAILABLE">{uiStringsFa.adminProducts.unavailableOnly}</option>
          </select>
        </div>
      </div>

      {/* Floating Bulk Actions Bar (ADM-WORKFLOW-03) */}
      {selectedIds.size > 0 && (
        <div className="sticky top-20 z-20 bg-[#332115] text-white p-3.5 rounded-none shadow-xl flex flex-wrap items-center justify-between gap-4 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="w-5 h-5 rounded-none bg-[#F59E0B] text-[#2B2017] flex items-center justify-center font-black text-[11px]">
              {selectedIds.size}
            </span>
            <span>محصول انتخاب شده است</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleBulkToggleAvailability(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-none text-xs font-bold cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>علامت‌گذاری به عنوان موجود</span>
            </button>

            <button
              type="button"
              onClick={() => handleBulkToggleAvailability(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-none text-xs font-bold cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>علامت‌گذاری به عنوان ناموجود</span>
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

      {/* Products Table (Desktop: md and up) */}
      <div className="hidden md:block bg-white border border-[#EFE9E0] rounded-none shadow-xs overflow-x-auto">
        <table className="w-full text-start text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#EFE9E0] text-[#5C5248] bg-[#FDFBF8]">
              <th className="py-3 px-3 text-center w-10">
                <input
                  type="checkbox"
                  checked={displayedItems.length > 0 && selectedIds.size === displayedItems.length}
                  onChange={toggleSelectAll}
                  className="cursor-pointer"
                  aria-label="انتخاب همه"
                />
              </th>
              <th className="py-3 px-4 text-start">{uiStringsFa.adminProducts.nameFa}</th>
              <th className="py-3 px-4 text-start">{uiStringsFa.adminProducts.nameOriginal}</th>
              <th className="py-3 px-4 text-start">{uiStringsFa.adminProducts.status}</th>
              <th className="py-3 px-4 text-center">{uiStringsFa.adminProducts.isAvailable}</th>
              <th className="py-3 px-4 text-center">{uiStringsFa.adminProducts.optionsCount}</th>
              <th className="py-3 px-4 text-center">تم</th>
              <th className="py-3 px-4 text-end">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EFE9E0]">
            {displayedItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-[#5C5248]">
                  هیچ محصولی با معیارهای جستجو یافت نشد.
                </td>
              </tr>
            ) : (
              displayedItems.map((prod) => {
                const isSelected = selectedIds.has(prod.id);
                return (
                  <tr
                    key={prod.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-amber-50/60' : 'hover:bg-[#FFFBEB]/40'
                    }`}
                  >
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(prod.id)}
                        className="cursor-pointer"
                        aria-label={`انتخاب ${prod.nameFa}`}
                      />
                    </td>
                    <td className="py-3 px-4 font-bold text-[#332115]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link href={`/admin/products/${prod.id}`} className="hover:text-[#D97706]">
                          {prod.nameFa}
                        </Link>
                        {prod.isFeatured && (
                          <span className="px-1 py-0.5 text-[9px] bg-[#FEF3C7] text-[#C86A00] font-bold">
                            ویژه
                          </span>
                        )}
                      </div>
                      {/* Assigned Category Badges */}
                      {(() => {
                        const assigned = categories.filter((c) =>
                          prod.categoryIds?.includes(c.id) ||
                          prod.categoryIds?.includes(c.slug) ||
                          prod.categoryIds?.includes(`cat_${c.slug}`) ||
                          prod.categorySlug === c.slug ||
                          prod.categories?.some((pc: any) => pc.id === c.id || pc.slug === c.slug || pc.category?.id === c.id || pc.category?.slug === c.slug)
                        );
                        return (
                          <div className="flex flex-wrap items-center gap-1 mt-1 font-normal">
                            {assigned.map((c) => (
                              <span key={c.id} className="px-1.5 py-0.5 bg-stone-100 text-stone-600 text-[10px] border border-stone-200">
                                {c.name}
                              </span>
                            ))}
                            {prod.status === 'PUBLISHED' && assigned.length === 0 && (
                              <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 text-[10px] border border-amber-300">
                                بدون دسته‌بندی فعال
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-4 text-[#5C5248] font-mono text-[11px]" dir="ltr">
                      {prod.nameOriginal || prod.slug}
                    </td>
                    <td className="py-3 px-4">
                      {/* [ADM-UI-02] AdminBadge */}
                      <AdminBadge status={prod.status} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleToggleAvailability(prod)}
                        className={`px-2.5 py-0.5 text-[10px] font-bold border rounded-none transition-colors cursor-pointer ${
                          prod.isAvailable
                            ? 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]'
                            : 'bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]'
                        }`}
                      >
                        {prod.isAvailable ? 'موجود' : 'ناموجود'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-[#332115]">
                      {prod.optionCount || 0}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-1.5 py-0.5 text-[10px] bg-[#EFE9E0] text-[#5C5248] rounded-none">
                        {prod.cardTheme}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-end whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 flex-nowrap">
                        <Link
                          href={`/admin/preview/products/${prod.id}`}
                          target="_blank"
                          className="inline-flex items-center justify-center whitespace-nowrap shrink-0 px-3 py-1.5 min-w-max text-xs font-bold text-[#5C5248] hover:bg-[#EFE9E0] border border-[#D5C7B8] rounded-none transition-colors"
                        >
                          پیش‌نمایش
                        </Link>

                        <Link
                          href={`/admin/products/${prod.id}`}
                          className="inline-flex items-center justify-center whitespace-nowrap shrink-0 px-3 py-1.5 min-w-max text-xs font-bold text-[#D97706] hover:bg-[#FEF3C7] border border-[#FDE68A] rounded-none transition-colors"
                        >
                          ویرایش
                        </Link>

                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDuplicate(prod)}
                          className="inline-flex items-center justify-center whitespace-nowrap shrink-0 px-3 py-1.5 min-w-max text-xs font-bold text-[#5C5248] hover:bg-[#EFE9E0] border border-[#D5C7B8] rounded-none cursor-pointer transition-colors"
                        >
                          کپی
                        </button>

                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => setConfirmDelete({ isOpen: true, prod })}
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

      {/* Mobile Products Card View (< 768px) */}
      <div className="block md:hidden space-y-3">
        {displayedItems.length === 0 ? (
          <div className="bg-white border border-[#EFE9E0] p-8 text-center text-[#5C5248]">
            هیچ محصولی با معیارهای جستجو یافت نشد.
          </div>
        ) : (
          displayedItems.map((prod) => {
            const isSelected = selectedIds.has(prod.id);
            const assigned = categories.filter((c) =>
              prod.categoryIds?.includes(c.id) ||
              prod.categoryIds?.includes(c.slug) ||
              prod.categoryIds?.includes(`cat_${c.slug}`) ||
              prod.categorySlug === c.slug ||
              prod.categories?.some((pc: any) => pc.id === c.id || pc.slug === c.slug || pc.category?.id === c.id || pc.category?.slug === c.slug)
            );

            return (
              <div
                key={prod.id}
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
                      onChange={() => toggleSelectOne(prod.id)}
                      className="cursor-pointer w-4 h-4 mt-0.5 shrink-0"
                      aria-label={`انتخاب ${prod.nameFa}`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link href={`/admin/products/${prod.id}`} className="font-black text-sm text-[#332115] hover:text-[#D97706] truncate">
                          {prod.nameFa}
                        </Link>
                        {prod.isFeatured && (
                          <span className="px-1.5 py-0.5 text-[9px] bg-[#FEF3C7] text-[#C86A00] font-bold shrink-0">
                            ویژه
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#5C5248] font-mono mt-0.5 truncate" dir="ltr">
                        {prod.nameOriginal || prod.slug}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <AdminBadge status={prod.status} />
                  </div>
                </div>

                {/* Middle Info: Categories & Options Count & Availability Toggle */}
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
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-[11px] text-stone-600">
                      {prod.optionCount || 0} گزینه
                    </span>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleToggleAvailability(prod)}
                      className={`px-2.5 py-1 text-[10px] font-bold border transition-colors cursor-pointer rounded-none ${
                        prod.isAvailable
                          ? 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]'
                          : 'bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]'
                      }`}
                    >
                      {prod.isAvailable ? 'موجود' : 'ناموجود'}
                    </button>
                  </div>
                </div>

                {/* Bottom Row: Actions */}
                <div className="pt-2.5 border-t border-[#EFE9E0] flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/admin/products/${prod.id}`}
                      className="px-3 py-1.5 text-xs font-bold text-[#D97706] bg-[#FEF3C7]/70 hover:bg-[#FEF3C7] border border-[#FDE68A] transition-colors"
                    >
                      ویرایش
                    </Link>
                    <Link
                      href={`/admin/preview/products/${prod.id}`}
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
                      onClick={() => handleDuplicate(prod)}
                      className="px-2.5 py-1.5 text-xs text-[#5C5248] hover:bg-stone-100 border border-stone-200 cursor-pointer transition-colors"
                    >
                      کپی
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setConfirmDelete({ isOpen: true, prod })}
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

      {/* Load More Button */}
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
        title={confirmDelete.isBulk ? 'حذف گروهی محصولات' : 'حذف محصول'}
        itemName={confirmDelete.prod?.nameFa || (confirmDelete.isBulk ? `${selectedIds.size} محصول انتخاب‌شده` : undefined)}
        message={
          confirmDelete.isBulk
            ? `آیا از حذف کامل ${selectedIds.size} محصول انتخاب‌شده اطمینان دارید؟ این عملیات غیرقابل بازگشت است.`
            : 'آیا از حذف کامل این محصول اطمینان دارید؟ تمام مشخصات و گزینه‌های وزنی آن حذف خواهند شد.'
        }
        confirmLabel="بله، حذف کن"
        cancelLabel="انصراف"
        isLoading={isPending}
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete({ isOpen: false })}
      />
    </div>
  );
}
