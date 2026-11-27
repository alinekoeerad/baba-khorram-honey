'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  XCircle,
  HelpCircle,
  ExternalLink,
  Search,
  Loader2,
  AlertTriangle,
  X,
  Save,
  BookOpen,
} from 'lucide-react';
import { useToast } from '@/components/admin/toast-provider';
import {
  createFaqAction,
  updateFaqAction,
  deleteFaqAction,
  reorderFaqsAction,
  toggleFaqPublishAction,
} from '@/server/actions/faq-actions';
import { toPersianDigits, normalizeSearchText } from '@/lib/domain-utils';
import { FAQ_CATEGORIES } from '@/content/faq-data';

interface FaqItemData {
  id: string;
  anchorId: string;
  question: string;
  answer: string;
  category: string;
  categoryLabel?: string | null;
  sortOrder: number;
  isPublished: boolean;
  featuredInNav: boolean;
  featuredOnHome: boolean;
  relatedArticleSlug?: string | null;
  relatedArticleLabel?: string | null;
  extraData?: any;
}

interface FaqManagerClientProps {
  initialFaqs: FaqItemData[];
}

export function FaqManagerClient({ initialFaqs }: FaqManagerClientProps) {
  const { success, error, info } = useToast();
  const [faqs, setFaqs] = useState<FaqItemData[]>(initialFaqs);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FaqItemData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    anchorId: '',
    question: '',
    answer: '',
    category: 'authenticity',
    categoryLabel: '',
    sortOrder: 0,
    isPublished: true,
    featuredInNav: false,
    featuredOnHome: false,
    relatedArticleSlug: '',
    relatedArticleLabel: '',
    blocks: [] as any[],
  });

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      anchorId: '',
      question: '',
      answer: '',
      category: 'authenticity',
      categoryLabel: 'اصالت و تشخیص علمی',
      sortOrder: faqs.length,
      isPublished: true,
      featuredInNav: false,
      featuredOnHome: false,
      relatedArticleSlug: '',
      relatedArticleLabel: '',
      blocks: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: FaqItemData) => {
    setEditingItem(item);
    const extra = item.extraData as any;
    const blocks = Array.isArray(extra?.blocks) ? extra.blocks : [];
    setFormData({
      anchorId: item.anchorId,
      question: item.question,
      answer: item.answer,
      category: item.category,
      categoryLabel: item.categoryLabel || '',
      sortOrder: item.sortOrder ?? 0,
      isPublished: Boolean(item.isPublished),
      featuredInNav: Boolean(item.featuredInNav),
      featuredOnHome: Boolean(item.featuredOnHome),
      relatedArticleSlug: item.relatedArticleSlug || '',
      relatedArticleLabel: item.relatedArticleLabel || '',
      blocks,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (editingItem) {
        const res = await updateFaqAction(editingItem.id, formData);
        if (res.success && res.data) {
          success('پرسش متداول با موفقیت بروزرسانی شد.');
          setFaqs((prev) => prev.map((f) => (f.id === editingItem.id ? { ...f, ...res.data } : f)));
          setIsModalOpen(false);
        } else {
          error(res.error || 'خطا در ویرایش پرسش.');
        }
      } else {
        const res = await createFaqAction(formData);
        if (res.success && res.data) {
          success('پرسش متداول جدید با موفقیت ایجاد شد.');
          setFaqs((prev) => [...prev, res.data as FaqItemData]);
          setIsModalOpen(false);
        } else {
          error(res.error || 'خطا در ثبت پرسش.');
        }
      }
    } catch (err: any) {
      error(err?.message || 'خطای غیرمنتظره رخ داد.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async (item: FaqItemData) => {
    const nextVal = !item.isPublished;
    const res = await toggleFaqPublishAction(item.id, nextVal);
    if (res.success) {
      setFaqs((prev) => prev.map((f) => (f.id === item.id ? { ...f, isPublished: nextVal } : f)));
      info(`وضعیت به ${nextVal ? 'فعال' : 'غیرفعال'} تغییر یافت.`);
    } else {
      error(res.error || 'خطا در تغییر وضعیت.');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    const res = await deleteFaqAction(deletingId);
    setIsDeleting(false);
    if (res.success) {
      setFaqs((prev) => prev.filter((f) => f.id !== deletingId));
      success('پرسش متداول با موفقیت حذف شد.');
      setDeletingId(null);
    } else {
      error(res.error || 'خطا در حذف پرسش.');
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= faqs.length) return;

    const newFaqs = [...faqs];
    const temp = newFaqs[index];
    newFaqs[index] = newFaqs[targetIndex];
    newFaqs[targetIndex] = temp;

    // re-assign sortOrder
    const payload = newFaqs.map((item, idx) => ({
      id: item.id,
      sortOrder: idx,
    }));

    setFaqs(newFaqs.map((item, idx) => ({ ...item, sortOrder: idx })));
    const res = await reorderFaqsAction({ items: payload });
    if (!res.success) {
      error('خطا در ذخیره ترتیب جدید.');
    }
  };

  // Add content block helper
  const handleAddBlock = (type: 'paragraph' | 'heading' | 'list' | 'callout') => {
    const newBlock =
      type === 'list'
        ? { type, items: ['مورد اول', 'مورد دوم'] }
        : type === 'callout'
        ? { type, title: 'نکته کلیدی', text: '', variant: 'info' }
        : { type, text: '' };
    setFormData((prev) => ({
      ...prev,
      blocks: [...prev.blocks, newBlock],
    }));
  };

  const handleRemoveBlock = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((_, i) => i !== idx),
    }));
  };

  const handleUpdateBlock = (idx: number, patch: any) => {
    setFormData((prev) => {
      const next = [...prev.blocks];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, blocks: next };
    });
  };

  // Filtered List
  const filteredFaqs = useMemo(() => {
    return faqs.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (statusFilter === 'published' && !item.isPublished) return false;
      if (statusFilter === 'draft' && item.isPublished) return false;
      if (searchQuery.trim()) {
        const q = normalizeSearchText(searchQuery);
        const inQ = normalizeSearchText(item.question);
        const inA = normalizeSearchText(item.answer);
        const inSlug = normalizeSearchText(item.anchorId);
        if (!inQ.includes(q) && !inA.includes(q) && !inSlug.includes(q)) return false;
      }
      return true;
    });
  }, [faqs, selectedCategory, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EFE9E0]">
        <div>
          <h1 className="text-2xl font-black text-[#2B2017] tracking-tight flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-[#D97706]" />
            <span>مدیریت سوالات متداول (FAQ)</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 font-bold mt-1">
            مدیریت کامل پرسش‌ها و پاسخ‌های علمی دانشنامه عسل و بخش‌های منتخب صفحه اصلی
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/faq"
            target="_blank"
            className="flex items-center gap-1.5 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs sm:text-sm font-black rounded-none transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-stone-500" />
            <span>مشاهده صفحه عمومی FAQ</span>
          </Link>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-white text-xs sm:text-sm font-black rounded-none transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن پرسش جدید</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white border border-[#EFE9E0] rounded-none shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {FAQ_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-black rounded-none transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#2B2017] text-white shadow-xs'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute right-3 top-3 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در پرسش‌ها یا پاسخ..."
              className="w-full h-10 pr-9 pl-3 text-xs font-bold bg-[#FDFBF8] border border-stone-300 rounded-none focus:bg-white focus:ring-1 focus:ring-[#F59E0B] focus:border-[#F59E0B]"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center justify-between text-xs font-bold text-stone-600 pt-2 border-t border-stone-100">
          <div className="flex items-center gap-3">
            <span>وضعیت:</span>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="statusFilter"
                checked={statusFilter === 'all'}
                onChange={() => setStatusFilter('all')}
              />
              <span>همه ({toPersianDigits(faqs.length)})</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="statusFilter"
                checked={statusFilter === 'published'}
                onChange={() => setStatusFilter('published')}
              />
              <span className="text-emerald-700 font-black">
                فقط فعال ({toPersianDigits(faqs.filter((f) => f.isPublished).length)})
              </span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="statusFilter"
                checked={statusFilter === 'draft'}
                onChange={() => setStatusFilter('draft')}
              />
              <span className="text-amber-800">
                غیرفعال ({toPersianDigits(faqs.filter((f) => !f.isPublished).length)})
              </span>
            </label>
          </div>

          <span className="text-stone-500 font-mono">
            {toPersianDigits(filteredFaqs.length)} مورد نمایش داده شده
          </span>
        </div>
      </div>

      {/* FAQs List Table */}
      <div className="bg-white border border-[#EFE9E0] rounded-none shadow-xs overflow-x-auto">
        {filteredFaqs.length === 0 ? (
          <div className="p-12 text-center text-stone-500 font-bold space-y-2">
            <HelpCircle className="w-8 h-8 text-stone-300 mx-auto" />
            <p>هیچ سوالی با فیلترهای انتخابی یافت نشد.</p>
          </div>
        ) : (
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-[#FAF6EE] border-b border-[#EFE9E0] text-[11px] font-black text-stone-700 uppercase tracking-wider">
                <th className="py-3 px-3 w-16 text-center">ترتیب</th>
                <th className="py-3 px-4">پرسش و پاسخ کوتاه</th>
                <th className="py-3 px-4 w-36">دسته‌بندی</th>
                <th className="py-3 px-3 w-28 text-center">شناسه لنگر</th>
                <th className="py-3 px-3 w-24 text-center">صفحه اصلی</th>
                <th className="py-3 px-3 w-24 text-center">وضعیت</th>
                <th className="py-3 px-4 w-36 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE9E0] text-xs">
              {filteredFaqs.map((item, idx) => (
                <tr key={item.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                  {/* Order Controls */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(idx, 'up')}
                        disabled={idx === 0}
                        title="انتقال به بالا"
                        className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono font-bold text-stone-700 text-[11px]">
                        {toPersianDigits(item.sortOrder ?? idx + 1)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(idx, 'down')}
                        disabled={idx === filteredFaqs.length - 1}
                        title="انتقال به پایین"
                        className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-20 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                  {/* Question and Answer */}
                  <td className="py-3 px-4 space-y-1">
                    <div className="font-black text-stone-900 text-sm leading-snug">
                      {item.question}
                    </div>
                    <div className="text-stone-600 font-medium line-clamp-1 leading-relaxed">
                      {item.answer}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-4">
                    <span className="inline-block px-2.5 py-1 text-[11px] font-black bg-stone-100 text-stone-800 border border-stone-200 rounded-none">
                      {item.categoryLabel || item.category}
                    </span>
                  </td>

                  {/* Anchor Slug */}
                  <td className="py-3 px-3 text-center">
                    <span className="font-mono text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 border border-amber-200/60 rounded-none">
                      #{item.anchorId}
                    </span>
                  </td>

                  {/* Featured on Home */}
                  <td className="py-3 px-3 text-center">
                    {item.featuredOnHome ? (
                      <span className="px-2 py-0.5 text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 rounded-none">
                        ویژه اصلی
                      </span>
                    ) : (
                      <span className="text-stone-400 text-[10px]">-</span>
                    )}
                  </td>

                  {/* Status Toggle */}
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(item)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-black rounded-none cursor-pointer transition-colors ${
                        item.isPublished
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                          : 'bg-stone-100 text-stone-600 border border-stone-300 hover:bg-stone-200'
                      }`}
                    >
                      {item.isPublished ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>فعال</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-stone-400" />
                          <span>غیرفعال</span>
                        </>
                      )}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-black bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-none transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 text-stone-600" />
                        <span>ویرایش</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingId(item.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-black text-red-600 hover:bg-red-50 rounded-none transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Create / Edit FAQ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-[#D5C7B8] shadow-2xl rounded-none w-full max-w-3xl my-8 text-right flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#EFE9E0] flex items-center justify-between bg-[#FAF6EE]">
              <div className="flex items-center gap-2 font-black text-stone-900 text-base">
                <HelpCircle className="w-5 h-5 text-[#D97706]" />
                <span>{editingItem ? 'ویرایش پرسش متداول' : 'افزودن پرسش متداول جدید'}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSave} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Question */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-bold text-stone-700">عنوان پرسش *</label>
                  <input
                    type="text"
                    required
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="مثلاً: آیا شکرک زدن عسل نشانه تقلبی بودن است؟"
                    className="w-full h-11 px-3.5 text-sm font-bold bg-[#FDFBF8] border border-[#D5C7B8] rounded-none focus:bg-white focus:ring-1 focus:ring-[#F59E0B]"
                  />
                </div>

                {/* Anchor ID */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-stone-700">
                    شناسه لنگر آدرس (Anchor ID / Slug) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.anchorId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        anchorId: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                      })
                    }
                    placeholder="crystallization"
                    className="w-full h-11 px-3.5 text-xs font-mono font-bold bg-[#FDFBF8] border border-[#D5C7B8] rounded-none focus:bg-white focus:ring-1 focus:ring-[#F59E0B]"
                    dir="ltr"
                  />
                  <span className="text-[10px] text-stone-500 font-mono">
                    لینک مستقیم: /faq#{formData.anchorId || 'slug'}
                  </span>
                </div>

                {/* Category Selection */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-stone-700">دسته‌بندی پرسش *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const cat = e.target.value;
                      const label = FAQ_CATEGORIES.find((c) => c.id === cat)?.label || '';
                      setFormData({ ...formData, category: cat, categoryLabel: label });
                    }}
                    className="w-full h-11 px-3 text-xs font-bold bg-[#FDFBF8] border border-[#D5C7B8] rounded-none focus:bg-white focus:ring-1 focus:ring-[#F59E0B]"
                  >
                    <option value="authenticity">اصالت و تشخیص علمی (authenticity)</option>
                    <option value="temperament">طبع، عطر و تفاوت‌های طبیعی (temperament)</option>
                    <option value="quality">نگهداری و ویژگی‌های عسل (quality)</option>
                  </select>
                </div>
              </div>

              {/* Short Answer */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700">
                  پاسخ کوتاه و صریح (خلاصه در کارت‌ها و پیش‌نمایش) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="پاسخ کوتاه علمی و مستند که در نگاه اول به کاربر نشان داده می‌شود..."
                  className="w-full p-3 text-xs font-bold bg-[#FDFBF8] border border-[#D5C7B8] rounded-none focus:bg-white focus:ring-1 focus:ring-[#F59E0B]"
                />
              </div>

              {/* Flags */}
              <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-none grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold text-stone-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="rounded-none text-amber-600 focus:ring-[#F59E0B]"
                  />
                  <span>منتشر شده (فعال)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featuredOnHome}
                    onChange={(e) => setFormData({ ...formData, featuredOnHome: e.target.checked })}
                    className="rounded-none text-amber-600 focus:ring-[#F59E0B]"
                  />
                  <span>نمایش در صفحه اصلی</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featuredInNav}
                    onChange={(e) => setFormData({ ...formData, featuredInNav: e.target.checked })}
                    className="rounded-none text-amber-600 focus:ring-[#F59E0B]"
                  />
                  <span>لینک در منوی هدر</span>
                </label>
              </div>

              {/* Related Article in Magazine */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-none space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-900">
                  <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                  <span>پیوند به مقاله مرتبط در مجله علمی (اختیاری)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={formData.relatedArticleSlug || ''}
                    onChange={(e) => setFormData({ ...formData, relatedArticleSlug: e.target.value })}
                    placeholder="اسلاگ مقاله، مثلاً royal-jelly"
                    className="h-9 px-3 text-xs font-mono font-bold bg-white border border-stone-300 rounded-none focus:ring-1 focus:ring-[#F59E0B]"
                    dir="ltr"
                  />
                  <input
                    type="text"
                    value={formData.relatedArticleLabel || ''}
                    onChange={(e) => setFormData({ ...formData, relatedArticleLabel: e.target.value })}
                    placeholder="عنوان نمایشی پیوند، مثلاً راهنمای جامع ژل رویال"
                    className="h-9 px-3 text-xs font-bold bg-white border border-stone-300 rounded-none focus:ring-1 focus:ring-[#F59E0B]"
                  />
                </div>
              </div>

              {/* Detailed Content Blocks */}
              <div className="space-y-3 pt-2 border-t border-stone-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-stone-800">
                    بلوک‌های تفصیلی پاسخ ({toPersianDigits(formData.blocks.length)} بلوک)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddBlock('paragraph')}
                      className="px-2 py-1 text-[11px] font-black bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-none cursor-pointer"
                    >
                      + پاراگراف
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('heading')}
                      className="px-2 py-1 text-[11px] font-black bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-none cursor-pointer"
                    >
                      + تیتر فرعی
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('list')}
                      className="px-2 py-1 text-[11px] font-black bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-none cursor-pointer"
                    >
                      + لیست
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddBlock('callout')}
                      className="px-2 py-1 text-[11px] font-black bg-[#FEF3C7] text-[#92400E] hover:bg-[#FDE68A] rounded-none cursor-pointer"
                    >
                      + کادر نکته
                    </button>
                  </div>
                </div>

                {formData.blocks.length === 0 && (
                  <div className="p-3 bg-stone-100 border border-stone-200 text-xs text-stone-600 rounded-none font-bold">
                    هیچ بلوک تفصیلی اضافه‌ای تعریف نشده است؛ تنها پاسخ کوتاه در صفحه نمایش داده می‌شود.
                  </div>
                )}

                <div className="space-y-3">
                  {formData.blocks.map((block, bIdx) => (
                    <div key={bIdx} className="p-3.5 bg-stone-50 border border-stone-300 rounded-none space-y-2">
                      <div className="flex items-center justify-between text-xs font-black text-stone-700">
                        <span className="text-amber-800">
                          بلوک {toPersianDigits(bIdx + 1)}: {block.type}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBlock(bIdx)}
                          className="text-red-500 hover:text-red-700 cursor-pointer text-xs"
                        >
                          حذف بلوک
                        </button>
                      </div>

                      {block.type === 'heading' && (
                        <input
                          type="text"
                          value={block.text || ''}
                          onChange={(e) => handleUpdateBlock(bIdx, { text: e.target.value })}
                          placeholder="متن تیتر فرعی..."
                          className="w-full h-9 px-2.5 text-xs font-bold bg-white border border-stone-300 rounded-none"
                        />
                      )}

                      {block.type === 'paragraph' && (
                        <textarea
                          rows={2}
                          value={block.text || ''}
                          onChange={(e) => handleUpdateBlock(bIdx, { text: e.target.value })}
                          placeholder="متن پاراگراف توضیحی..."
                          className="w-full p-2 text-xs font-bold bg-white border border-stone-300 rounded-none"
                        />
                      )}

                      {block.type === 'list' && (
                        <textarea
                          rows={3}
                          value={Array.isArray(block.items) ? block.items.join('\n') : ''}
                          onChange={(e) =>
                            handleUpdateBlock(bIdx, {
                              items: e.target.value.split('\n').filter((x: string) => x.trim()),
                            })
                          }
                          placeholder="هر مورد را در یک خط جداگانه بنویسید..."
                          className="w-full p-2 text-xs font-bold bg-white border border-stone-300 rounded-none"
                        />
                      )}

                      {block.type === 'callout' && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={block.title || ''}
                              onChange={(e) => handleUpdateBlock(bIdx, { title: e.target.value })}
                              placeholder="عنوان کادر نکته..."
                              className="h-8 px-2 text-xs font-bold bg-white border border-stone-300 rounded-none"
                            />
                            <select
                              value={block.variant || 'info'}
                              onChange={(e) => handleUpdateBlock(bIdx, { variant: e.target.value })}
                              className="h-8 px-2 text-xs font-bold bg-white border border-stone-300 rounded-none"
                            >
                              <option value="info">راهنمایی (زرد - Info)</option>
                              <option value="warning">هشدار (قرمز - Warning)</option>
                              <option value="tip">پیشنهاد (سبز - Tip)</option>
                            </select>
                          </div>
                          <textarea
                            rows={2}
                            value={block.text || ''}
                            onChange={(e) => handleUpdateBlock(bIdx, { text: e.target.value })}
                            placeholder="متن داخل کادر..."
                            className="w-full p-2 text-xs font-bold bg-white border border-stone-300 rounded-none"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EFE9E0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-black text-stone-600 hover:bg-stone-100 rounded-none cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-white text-xs font-black rounded-none shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>در حال ذخیره...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>{editingItem ? 'ذخیره تغییرات' : 'ایجاد پرسش'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border-2 border-red-500 rounded-none p-6 max-w-md w-full space-y-4 text-right shadow-2xl">
            <div className="flex items-center gap-2 text-red-600 font-black text-base">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>تأیید حذف پرسش متداول</span>
            </div>
            <p className="text-xs sm:text-sm text-stone-700 font-bold leading-relaxed">
              آیا از حذف این پرسش متداول اطمینان دارید؟ این عملیات غیرقابل بازگشت است و پرسش از صفحه عمومی FAQ و دانشنامه حذف خواهد شد.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-xs font-black text-stone-600 hover:bg-stone-100 rounded-none cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-1 px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-none shadow-md cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>تأیید و حذف</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
