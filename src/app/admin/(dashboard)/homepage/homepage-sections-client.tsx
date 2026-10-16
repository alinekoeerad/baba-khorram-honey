/**
 * HomepageSectionsClient Component (Brief Section 7)
 * Admin table & management controls for ordering, editing, previewing, and deleting sections.
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HomepageSectionViewModel } from '@/server/queries/homepage-sections';
import {
  deleteHomepageSectionAction,
  toggleHomepageSectionStatusAction,
  reorderHomepageSectionAction,
  seedDefaultHomepageSectionsAction,
} from '@/server/actions/homepage-actions';
import { TemplateSwitchModal } from '@/components/admin/homepage/template-switch-modal';
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Edit,
  ArrowRightLeft,
  Trash2,
  ExternalLink,
  Eye,
  AlertTriangle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { SectionStatus } from '@prisma/client';
import { useToast } from '@/components/admin/toast-provider';

export function HomepageSectionsClient({
  initialSections,
}: {
  initialSections: HomepageSectionViewModel[];
}) {
  const [sections, setSections] = useState<HomepageSectionViewModel[]>(initialSections);
  const [isSeeding, setIsSeeding] = useState(false);
  const [activeModalSection, setActiveModalSection] = useState<HomepageSectionViewModel | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingOrder, setIsLoadingOrder] = useState<string | null>(null);

  const handleToggleStatus = async (id: string, newStatus: SectionStatus) => {
    const res = await toggleHomepageSectionStatusAction(id, newStatus);
    if (res.success) {
      setSections((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
      );
    }
  };

  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    setSections(initialSections);
  }, [initialSections]);

  const handleReorder = async (id: string, direction: 'UP' | 'DOWN') => {
    let originalSections: HomepageSectionViewModel[] = [];
    let updatedSections: HomepageSectionViewModel[] = [];

    // Functional state update: guaranteed latest state, immediate 0ms UI reorder
    setSections((prev) => {
      originalSections = prev;
      const idx = prev.findIndex((s) => s.id === id);
      const targetIdx = direction === 'UP' ? idx - 1 : idx + 1;
      if (idx === -1 || targetIdx < 0 || targetIdx >= prev.length) {
        return prev;
      }
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[targetIdx];
      next[targetIdx] = temp;
      updatedSections = next.map((item, i) => ({ ...item, sortOrder: i + 1 }));
      return updatedSections;
    });

    if (updatedSections.length === 0) return;

    setIsLoadingOrder(id);
    try {
      const res = await reorderHomepageSectionAction(id, direction);
      if (!res.success) {
        setSections(originalSections);
        toast.error(res.error || 'خطا در جابه‌جایی سکشن');
      } else {
        toast.success('ترتیب سکشن‌ها با موفقیت تغییر یافت.');
      }
    } catch {
      setSections(originalSections);
      toast.error('خطا در برقراری ارتباط با سرور');
    } finally {
      setIsLoadingOrder(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    const res = await deleteHomepageSectionAction(deleteTargetId);
    setIsDeleting(false);
    if (res.success) {
      setSections((prev) => prev.filter((s) => s.id !== deleteTargetId));
      setDeleteTargetId(null);
      toast.success('سکشن با موفقیت حذف گردید.');
    } else {
      toast.error(res.error || 'خطا در حذف سکشن');
    }
  };

  const handleSeedDefaults = async () => {
    setIsSeeding(true);
    const res = await seedDefaultHomepageSectionsAction();
    setIsSeeding(false);
    if (res.success) {
      toast.success('چیدمان پیش‌فرض صفحه اصلی با موفقیت بارگذاری شد.');
      router.refresh();
    } else {
      toast.error(res.error || 'خطا در بارگذاری سکشن‌های پیش‌فرض');
    }
  };

  return (
    <div className="space-y-6 text-right">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-black text-[#2B2017] tracking-tight">
            مدیریت بخش‌های صفحه اصلی (Homepage CMS)
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 font-bold mt-1">
            چیدمان سکشن‌ها، تغییر ترتیب نمایش، تنظیم پس‌زمینه چوبی و انتخاب قالب‌های بصری
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/preview/homepage"
            target="_blank"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs sm:text-sm font-bold text-stone-700 transition-colors shadow-xs"
          >
            <Eye className="w-4 h-4 text-stone-500" />
            <span>پیش‌نمایش زنده صفحه اصلی</span>
            <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
          </Link>

          <Link
            href="/admin/homepage/new"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-white font-black text-xs sm:text-sm transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن بخش جدید</span>
          </Link>
        </div>
      </div>

      {/* Sections List */}
      {sections.length === 0 ? (
        <div className="p-12 text-center bg-white border border-stone-200 rounded-2xl space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-black text-lg text-stone-800">هنوز هیچ سکشنی در دیتابیس ثبت نشده است</h3>
          <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed font-bold">
            در حال حاضر صفحه اصلی عمومی از چیدمان پیش‌فرض سیستم استفاده می‌کند. با کلیک بر روی دکمه «بارگذاری چیدمان پیش‌فرض صفحه اصلی» می‌توانید سکشن‌های استاندارد را به دیتابیس منتقل و ویرایش کنید.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              disabled={isSeeding}
              onClick={handleSeedDefaults}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 border-[#F59E0B] text-[#B45309] hover:bg-amber-50 font-black text-xs sm:text-sm transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSeeding ? <Loader2 className="w-4 h-4 animate-spin text-[#F59E0B]" /> : <Sparkles className="w-4 h-4 text-[#F59E0B]" />}
              <span>{isSeeding ? 'در حال بارگذاری...' : 'بارگذاری چیدمان پیش‌فرض صفحه اصلی'}</span>
            </button>
            <Link
              href="/admin/homepage/new"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-white font-black text-xs sm:text-sm transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>ایجاد اولین سکشن</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((section, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === sections.length - 1;
            const isWood = section.background === 'WOOD';

            return (
              <div
                key={section.id}
                id={`admin-section-${section.id}`}
                className="p-4 sm:p-5 bg-white border border-stone-200 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                {/* Reorder Buttons & Status Badge */}
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      disabled={isFirst || isLoadingOrder === section.id}
                      onClick={() => handleReorder(section.id, 'UP')}
                      className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 disabled:opacity-30 transition-colors cursor-pointer"
                      title="انتقال به بالا"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={isLast || isLoadingOrder === section.id}
                      onClick={() => handleReorder(section.id, 'DOWN')}
                      className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 disabled:opacity-30 transition-colors cursor-pointer"
                      title="انتقال به پایین"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="w-8 h-8 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center font-mono font-black text-xs">
                    {idx + 1}
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-base text-[#2B2017]">
                        {section.internalName}
                      </span>

                      {/* Status Badge */}
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          section.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : section.status === 'DRAFT'
                            ? 'bg-amber-50 text-amber-700 border-amber-300'
                            : 'bg-stone-100 text-stone-500 border-stone-300'
                        }`}
                      >
                        {section.status === 'ACTIVE'
                          ? 'فعال (منتشر شده)'
                          : section.status === 'DRAFT'
                          ? 'پیش‌نویس'
                          : 'غیرفعال'}
                      </span>

                      {/* Background Badge */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isWood ? 'bg-amber-950 text-amber-200' : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {isWood ? 'پس‌زمینه چوب' : 'ساده'}
                      </span>
                    </div>

                    <div className="text-xs text-stone-500 font-bold mt-1">
                      نوع: <span className="font-mono text-stone-700">{section.type}</span> | قالب: <span className="font-mono text-stone-700">{section.template}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-stone-100">
                  {/* Status Toggle Dropdown */}
                  <select
                    value={section.status}
                    onChange={(e) => handleToggleStatus(section.id, e.target.value as SectionStatus)}
                    className="h-8 px-2 text-xs font-bold bg-stone-50 border border-stone-300 rounded-lg focus:outline-none"
                  >
                    <option value="ACTIVE">انتشار (ACTIVE)</option>
                    <option value="DRAFT">پیش‌نویس (DRAFT)</option>
                    <option value="DISABLED">غیرفعال (DISABLED)</option>
                  </select>

                  {/* Template Switch Button */}
                  <button
                    type="button"
                    onClick={() => setActiveModalSection(section)}
                    className="flex items-center gap-1 h-8 px-2.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
                    title="تغییر قالب نمایشی"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>تغییر قالب</span>
                  </button>

                  {/* Edit Content Link */}
                  <Link
                    href={`/admin/homepage/${section.id}/edit`}
                    className="flex items-center gap-1 h-8 px-3 text-xs font-black text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>ویرایش</span>
                  </Link>

                  {/* Preview Section */}
                  <Link
                    href={`/admin/preview/homepage#section-${section.id}`}
                    target="_blank"
                    className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
                    title="پیش‌نمایش این سکشن"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => setDeleteTargetId(section.id)}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="حذف سکشن"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Template Switch Modal */}
      {activeModalSection && (
        <TemplateSwitchModal
          isOpen={true}
          onClose={() => setActiveModalSection(null)}
          sectionId={activeModalSection.id}
          currentTemplateId={activeModalSection.template}
          currentContent={activeModalSection.content}
          onSuccess={() => {
            window.location.reload();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setDeleteTargetId(null)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 space-y-4 shadow-2xl z-10 text-right">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-stone-900">آیا از حذف این سکشن اطمینان دارید؟</h3>
            <p className="text-xs text-stone-600 leading-relaxed font-bold">
              این عملیات برگشت‌پذیر نیست و سکشن موردنظر به همراه تمام تنظیمات آن حذف خواهد شد.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-5 py-2 text-xs font-black text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>تأیید و حذف</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
