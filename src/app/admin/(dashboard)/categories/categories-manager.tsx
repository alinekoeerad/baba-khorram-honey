'use client';

/**
 * Category Management Component (Phase 4, Task 1)
 * Features:
 * - Tabs for Product and Recipe category types
 * - Linked item count display
 * - Modal for Create / Edit
 * - Archive / Restore quick toggle
 * - Safe Delete: forbidden and disabled if category has linked items
 */

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { uiStringsFa } from '@/content/ui-strings.fa';
import {
  createCategoryAction,
  updateCategoryAction,
  toggleCategoryStatusAction,
  deleteCategoryAction,
} from '@/server/actions/category-actions';
import { slugify } from '@/lib/domain-utils';
import { useToast } from '@/components/admin/toast-provider';
import { ConfirmModal } from '@/components/admin/confirm-modal';
import { AdminBadge } from '@/components/admin/admin-badge';

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  type: 'PRODUCT' | 'RECIPE';
  status: 'ACTIVE' | 'ARCHIVED';
  sortOrder: number;
  productCount?: number;
  recipeCount?: number;
}

export function CategoriesManager({ initialCategories }: { initialCategories: CategoryItem[] }) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<'PRODUCT' | 'RECIPE'>('PRODUCT');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; cat?: CategoryItem }>({ isOpen: false });

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [sortOrder, setSortOrder] = useState<number>(0);

  const filteredCategories = initialCategories.filter((c) => c.type === activeTab);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setStatus('ACTIVE');
    setSortOrder(filteredCategories.length);
    setNotification(null);
    setModalOpen(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setStatus(cat.status);
    setSortOrder(cat.sortOrder);
    setNotification(null);
    setModalOpen(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!editingCategory && !slug) {
      setSlug(slugify(val) || '');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    startTransition(async () => {
      let res;
      if (editingCategory) {
        res = await updateCategoryAction({
          id: editingCategory.id,
          input: { name, slug, status, sortOrder, type: activeTab },
        });
      } else {
        res = await createCategoryAction({
          name,
          slug,
          type: activeTab,
          status,
          sortOrder,
        });
      }

      if (res.success) {
        setNotification({ type: 'success', message: uiStringsFa.adminCategories.savedSuccess });
        setModalOpen(false);
        router.refresh();
      } else {
        setNotification({ type: 'error', message: res.error || 'خطا در ذخیره' });
      }
    });
  };

  const handleToggleStatus = (cat: CategoryItem) => {
    setNotification(null);
    const newStatus = cat.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
    startTransition(async () => {
      const res = await toggleCategoryStatusAction({ id: cat.id, status: newStatus });
      if (res.success) {
        setNotification({ type: 'success', message: uiStringsFa.adminCategories.savedSuccess });
        router.refresh();
      } else {
        setNotification({ type: 'error', message: res.error || 'خطا در تغییر وضعیت' });
      }
    });
  };

  const handleDelete = (cat: CategoryItem) => {
    const count = activeTab === 'PRODUCT' ? cat.productCount || 0 : cat.recipeCount || 0;
    if (count > 0) {
      toast.error(uiStringsFa.adminCategories.cannotDeleteInUse);
      return;
    }
    setConfirmDelete({ isOpen: true, cat });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete.cat) return;
    const cat = confirmDelete.cat;

    startTransition(async () => {
      const res = await deleteCategoryAction(cat.id);
      if (res.success) {
        toast.success(uiStringsFa.adminCategories.deletedSuccess);
        setConfirmDelete({ isOpen: false });
        router.refresh();
      } else {
        toast.error(res.error || 'خطا در حذف دسته‌بندی');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Create Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#332115]">{uiStringsFa.adminCategories.title}</h1>
          <p className="text-sm text-[#5C5248] mt-1">{uiStringsFa.adminCategories.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-[#FBBF24] hover:bg-[#F59E0B] text-[#332115] font-bold text-xs transition-colors cursor-pointer shadow-xs"
        >
          <span>+</span>
          <span>{uiStringsFa.adminCategories.createCategory}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#EFE9E0] gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('PRODUCT')}
          className={`py-2.5 px-4 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
            activeTab === 'PRODUCT'
              ? 'border-[#D97706] text-[#D97706]'
              : 'border-transparent text-[#5C5248] hover:text-[#332115]'
          }`}
        >
          {uiStringsFa.adminCategories.productTab}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('RECIPE')}
          className={`py-2.5 px-4 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
            activeTab === 'RECIPE'
              ? 'border-[#D97706] text-[#D97706]'
              : 'border-transparent text-[#5C5248] hover:text-[#332115]'
          }`}
        >
          {uiStringsFa.adminCategories.recipeTab}
        </button>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-3.5 text-xs leading-relaxed border-s-4 ${
            notification.type === 'success'
              ? 'bg-[#F0FDF4] border-[#3F8F3B] text-[#3F8F3B]'
              : 'bg-[#FEF2F2] border-[#9E3556] text-[#9E3556]'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Categories Table */}
      <div className="bg-white border border-[#EFE9E0] shadow-xs overflow-x-auto">
        <table className="w-full text-start text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#EFE9E0] text-[#5C5248] bg-[#FDFBF8]">
              <th className="py-3 px-4 text-start">{uiStringsFa.adminCategories.name}</th>
              <th className="py-3 px-4 text-start">{uiStringsFa.adminCategories.slug}</th>
              <th className="py-3 px-4 text-start">{uiStringsFa.adminCategories.status}</th>
              <th className="py-3 px-4 text-center">{uiStringsFa.adminCategories.sortOrder}</th>
              <th className="py-3 px-4 text-center">{uiStringsFa.adminCategories.itemCount}</th>
              <th className="py-3 px-4 text-end">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EFE9E0]">
            {filteredCategories.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#5C5248]">
                  هیچ دسته‌بندی در این بخش ثبت نشده است.
                </td>
              </tr>
            ) : (
              filteredCategories.map((cat) => {
                const count = activeTab === 'PRODUCT' ? cat.productCount || 0 : cat.recipeCount || 0;
                const canDelete = count === 0;

                return (
                  <tr key={cat.id} className="hover:bg-[#FFFBEB]/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#332115]">{cat.name}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#5C5248]" dir="ltr">
                      {cat.slug}
                    </td>
                    <td className="py-3 px-4">
                      <AdminBadge status={cat.status} />
                    </td>
                    <td className="py-3 px-4 text-center text-[#5C5248]">{cat.sortOrder}</td>
                    <td className="py-3 px-4 text-center font-bold text-[#332115]">{count}</td>
                    <td className="py-3 px-4 text-end space-x-reverse space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEditModal(cat)}
                        className="px-2.5 py-1 text-[11px] font-bold text-[#D97706] hover:bg-[#FEF3C7] border border-[#FDE68A] transition-colors cursor-pointer"
                      >
                        {uiStringsFa.adminCategories.editCategory}
                      </button>

                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleToggleStatus(cat)}
                        className="px-2.5 py-1 text-[11px] font-bold text-[#5C5248] hover:bg-[#EFE9E0] border border-[#EFE9E0] transition-colors cursor-pointer"
                      >
                        {cat.status === 'ACTIVE' ? uiStringsFa.adminCategories.archive : uiStringsFa.adminCategories.restore}
                      </button>

                      <button
                        type="button"
                        disabled={isPending || !canDelete}
                        onClick={() => handleDelete(cat)}
                        title={!canDelete ? uiStringsFa.adminCategories.cannotDeleteInUse : undefined}
                        className="px-2.5 py-1 text-[11px] font-bold text-[#9E3556] hover:bg-[#FEF2F2] border border-[#FECACA] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {uiStringsFa.adminCategories.delete}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Create / Edit Category */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-[#EFE9E0] p-6 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-[#332115]">
              {editingCategory ? uiStringsFa.adminCategories.editCategory : uiStringsFa.adminCategories.createCategory}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#332115] mb-1">
                  {uiStringsFa.adminCategories.name}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={handleNameChange}
                  placeholder="عنوان فارسی دسته‌بندی..."
                  className="w-full px-3 py-1.5 border border-[#EFE9E0] text-xs focus:outline-none focus:border-[#D97706]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#332115] mb-1">
                  {uiStringsFa.adminCategories.slug}
                </label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="latin-slug-identifier"
                  className="w-full px-3 py-1.5 border border-[#EFE9E0] text-xs font-mono text-start focus:outline-none focus:border-[#D97706]"
                />
                <span className="text-[11px] text-[#5C5248] mt-1 block">
                  فقط حروف کوچک انگلیسی، اعداد و خط تیره (-)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#332115] mb-1">
                    {uiStringsFa.adminCategories.status}
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-[#EFE9E0] text-xs bg-white"
                  >
                    <option value="ACTIVE">{uiStringsFa.adminCategories.active}</option>
                    <option value="ARCHIVED">{uiStringsFa.adminCategories.archived}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#332115] mb-1">
                    {uiStringsFa.adminCategories.sortOrder}
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-1.5 border border-[#EFE9E0] text-xs focus:outline-none focus:border-[#D97706]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#EFE9E0]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-bold text-[#5C5248] hover:bg-[#EFE9E0] transition-colors"
                >
                  {uiStringsFa.adminForms.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 bg-[#FBBF24] hover:bg-[#F59E0B] text-[#332115] font-bold text-xs transition-colors disabled:opacity-50"
                >
                  {isPending ? uiStringsFa.adminForms.saving : uiStringsFa.adminForms.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* [ADM-UI-01] Universal ConfirmModal */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="حذف دسته‌بندی"
        itemName={confirmDelete.cat?.name}
        message="آیا از حذف کامل این دسته‌بندی اطمینان دارید؟"
        confirmLabel="بله، حذف کن"
        cancelLabel="انصراف"
        isLoading={isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete({ isOpen: false })}
      />
    </div>
  );
}
