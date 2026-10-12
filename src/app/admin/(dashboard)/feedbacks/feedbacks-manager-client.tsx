'use client';

/**
 * FeedbacksManagerClient
 * Interactive client table and card manager for feedbacks in the admin panel.
 */

import React, { useState, useTransition } from 'react';
import {
  updateFeedbackStatusAction,
  deleteFeedbackAction,
} from '@/server/actions/feedback-actions';
import {
  Phone,
  Calendar,
  CheckCircle,
  Archive,
  AlertCircle,
  Copy,
  Check,
  Save,
  Search,
  Filter,
  Download,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/components/admin/toast-provider';
import { ConfirmModal } from '@/components/admin/confirm-modal';
import { exportToCsv } from '@/lib/csv-export';

interface FeedbackItem {
  id: string;
  trackingCode: string;
  name: string;
  phone: string;
  type: string;
  message: string;
  status: string;
  adminNote?: string | null;
  createdAt: string;
}

export function FeedbacksManagerClient({
  initialFeedbacks,
}: {
  initialFeedbacks: FeedbackItem[];
}) {
  const toast = useToast();
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(initialFeedbacks);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [notesState, setNotesState] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id?: string; trackingCode?: string }>({
    isOpen: false,
  });

  // Filter items
  const filtered = feedbacks.filter((f) => {
    if (statusFilter !== 'ALL' && f.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && f.type !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        f.name.toLowerCase().includes(q) ||
        f.phone.includes(q) ||
        f.trackingCode.toLowerCase().includes(q) ||
        f.message.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleStatusChange = (id: string, newStatus: string) => {
    startTransition(async () => {
      const res = await updateFeedbackStatusAction({
        id,
        status: newStatus as any,
      });
      if (res.success && res.feedback) {
        setFeedbacks((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
      }
    });
  };

  const handleSaveNote = (id: string) => {
    const note = notesState[id] !== undefined ? notesState[id] : '';
    startTransition(async () => {
      const currentItem = feedbacks.find((x) => x.id === id);
      if (!currentItem) return;
      const res = await updateFeedbackStatusAction({
        id,
        status: currentItem.status as any,
        adminNote: note,
      });
      if (res.success && res.feedback) {
        setFeedbacks((prev) =>
          prev.map((item) => (item.id === id ? { ...item, adminNote: note } : item))
        );
        toast.success('یادداشت داخلی با موفقیت ذخیره شد.');
      } else {
        toast.error('خطا در ذخیره یادداشت');
      }
    });
  };

  const handleDelete = (id: string, trackingCode: string) => {
    setConfirmDelete({ isOpen: true, id, trackingCode });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete.id) return;
    const { id } = confirmDelete;

    startTransition(async () => {
      const res = await deleteFeedbackAction(id);
      if (res.success) {
        setFeedbacks((prev) => prev.filter((item) => item.id !== id));
        setConfirmDelete({ isOpen: false });
        toast.success('پیام با موفقیت حذف گردید.');
      } else {
        toast.error(res.error || 'خطا در حذف پیام');
      }
    });
  };

  const handleExportCsv = () => {
    const headers = ['کد پیگیری', 'نام فرستنده', 'شماره تماس', 'نوع پیام', 'متن پیام', 'وضعیت', 'یادداشت ادمین', 'تاریخ ثبت'];
    const rows = filtered.map((f) => [
      f.trackingCode,
      f.name,
      f.phone,
      f.type === 'SUGGESTION' ? 'پیشنهاد' : 'انتقاد/شکایت',
      f.message,
      f.status,
      f.adminNote || '',
      new Date(f.createdAt).toLocaleDateString('fa-IR'),
    ]);
    exportToCsv('feedbacks_export', headers, rows);
    toast.success('فایل اکسل نظرات با موفقیت دانلود شد.');
  };

  const handleCopyPhone = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'SUGGESTION':
        return (
          <span className="px-2.5 py-1 text-xs font-black bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
            💡 پیشنهاد سازنده
          </span>
        );
      case 'CRITICISM':
        return (
          <span className="px-2.5 py-1 text-xs font-black bg-[#FEF2F2] text-[#9E3556] border border-[#FECDD3]">
            ⚠️ انتقاد / شکایت
          </span>
        );
      case 'PRODUCT_QUALITY':
        return (
          <span className="px-2.5 py-1 text-xs font-black bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]">
            🍯 کیفیت محصول
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-black bg-stone-100 text-stone-700 border border-stone-200">
            📝 سایر موارد
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UNREAD':
        return (
          <span className="px-2.5 py-1 text-xs font-black bg-rose-50 text-rose-800 border border-rose-200">
            خوانده‌نشده
          </span>
        );
      case 'REVIEWED':
        return (
          <span className="px-2.5 py-1 text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
            بررسی‌شده
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="px-2.5 py-1 text-xs font-black bg-stone-100 text-stone-600 border border-stone-200">
            بایگانی
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="bg-white border border-[#EFE9E0] p-4 shadow-xs space-y-4">
        {/* Status Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: 'ALL', label: 'همه وضعیت‌ها' },
              { key: 'UNREAD', label: 'خوانده‌نشده' },
              { key: 'REVIEWED', label: 'بررسی‌شده' },
              { key: 'ARCHIVED', label: 'بایگانی‌شده' },
            ].map((st) => (
              <button
                key={st.key}
                type="button"
                onClick={() => setStatusFilter(st.key)}
                className={`px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === st.key
                    ? 'bg-[#332115] text-white shadow-xs'
                    : 'bg-stone-50 text-[#5C5248] hover:bg-stone-100'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Type Filter & Export */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-50 text-xs font-bold text-[#332115] rounded-none shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>خروجی اکسل (CSV)</span>
            </button>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#5C5248]" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-stone-50 border border-[#EFE9E0] text-xs font-bold px-3 py-1.5 focus:outline-none focus:border-[#D97706] rounded-none"
              >
                <option value="ALL">همه موضوعات</option>
                <option value="SUGGESTION">پیشنهادات</option>
                <option value="CRITICISM">انتقادات</option>
                <option value="PRODUCT_QUALITY">کیفیت محصول</option>
                <option value="OTHER">سایر موارد</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="جستجو بر اساس نام، شماره تماس، کد رهگیری یا متن پیام..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2 bg-stone-50 border border-[#EFE9E0] text-xs focus:outline-none focus:border-[#D97706] focus:bg-white transition-colors"
          />
          <Search className="w-4 h-4 text-stone-400 absolute right-3 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Feedbacks List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-[#EFE9E0] p-12 text-center text-[#5C5248]">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-stone-400" />
          <p className="text-sm font-bold">هیچ نظری با فیلترهای انتخابی یافت نشد.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => {
            const currentNote =
              notesState[item.id] !== undefined ? notesState[item.id] : item.adminNote || '';

            return (
              <div
                key={item.id}
                className={`bg-white border transition-all p-6 shadow-xs ${
                  item.status === 'UNREAD'
                    ? 'border-s-4 border-s-rose-600 border-[#EFE9E0]'
                    : 'border-[#EFE9E0]'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#EFE9E0] pb-4 mb-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono font-black text-sm text-[#B45309] bg-[#FFFBEB] px-2.5 py-0.5 border border-[#FDE68A]">
                      {item.trackingCode}
                    </span>
                    <span className="font-black text-base text-[#332115]">{item.name}</span>
                    {getTypeBadge(item.type)}
                    {getStatusBadge(item.status)}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#5C5248]">
                    <div className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      <span>{new Date(item.createdAt).toLocaleDateString('fa-IR')}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.trackingCode)}
                      disabled={isPending}
                      title="حذف بازخورد"
                      className="p-1.5 text-stone-400 hover:text-rose-700 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Contact and Message */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-xs font-bold text-[#332115]">
                    <span className="text-[#5C5248]">شماره تماس:</span>
                    <a
                      href={`tel:${item.phone}`}
                      className="text-[#D97706] hover:underline font-mono text-sm"
                      dir="ltr"
                    >
                      {item.phone}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopyPhone(item.phone, item.id)}
                      className="p-1 text-stone-400 hover:text-[#332115] cursor-pointer"
                      title="کپی شماره"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Message content */}
                  <div className="bg-[#FDFBF8] border-s-2 border-[#D97706] p-4 text-sm text-[#2B2017] leading-relaxed whitespace-pre-wrap">
                    {item.message}
                  </div>
                </div>

                {/* Footer Controls: Status Changer & Admin Note */}
                <div className="mt-6 pt-4 border-t border-[#EFE9E0] grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  {/* Status buttons */}
                  <div className="lg:col-span-5 flex items-center gap-2">
                    <span className="text-xs font-bold text-[#5C5248]">تغییر وضعیت:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(item.id, 'REVIEWED')}
                        disabled={isPending || item.status === 'REVIEWED'}
                        className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 disabled:opacity-40 transition-colors border border-emerald-200 cursor-pointer"
                      >
                        بررسی شد
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(item.id, 'ARCHIVED')}
                        disabled={isPending || item.status === 'ARCHIVED'}
                        className="px-2.5 py-1 text-xs font-bold bg-stone-100 text-stone-700 hover:bg-stone-200 disabled:opacity-40 transition-colors border border-stone-200 cursor-pointer"
                      >
                        بایگانی
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(item.id, 'UNREAD')}
                        disabled={isPending || item.status === 'UNREAD'}
                        className="px-2.5 py-1 text-xs font-bold bg-rose-50 text-rose-800 hover:bg-rose-100 disabled:opacity-40 transition-colors border border-rose-200 cursor-pointer"
                      >
                        خوانده‌نشده
                      </button>
                    </div>
                  </div>

                  {/* Internal Admin Note */}
                  <div className="lg:col-span-7 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="یادداشت داخلی ادمین برای این پیام..."
                      value={currentNote}
                      onChange={(e) =>
                        setNotesState((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      className="flex-1 px-3 py-1.5 bg-stone-50 border border-[#EFE9E0] text-xs focus:outline-none focus:border-[#D97706] focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveNote(item.id)}
                      disabled={isPending}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#332115] hover:bg-[#4A2C1B] text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Save className="w-3 h-3" />
                      <span>ثبت</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* [ADM-UI-01] Universal ConfirmModal */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="حذف پیام"
        itemName={confirmDelete.trackingCode ? `کد پیگیری: ${confirmDelete.trackingCode}` : undefined}
        message="آیا از حذف کامل این پیام اطمینان دارید؟ این عملیات غیرقابل بازگشت است."
        confirmLabel="بله، حذف کن"
        cancelLabel="انصراف"
        isLoading={isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete({ isOpen: false })}
      />
    </div>
  );
}
