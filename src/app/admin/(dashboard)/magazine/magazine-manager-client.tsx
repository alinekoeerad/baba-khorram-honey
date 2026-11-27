'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Search,
  BookOpen,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/components/admin/toast-provider';
import { ConfirmModal } from '@/components/admin/confirm-modal';
import {
  deleteMagazineArticleAction,
  toggleMagazineArticleStatusAction,
  reorderMagazineArticlesAction,
} from '@/server/actions/magazine-actions';
import { toPersianDigits, normalizeSearchText } from '@/lib/domain-utils';

export interface MagazineArticleItem {
  id: string;
  slug: string;
  title: string;
  shortTitle?: string | null;
  subtitle?: string | null;
  excerpt: string;
  coverImage?: string | null;
  category: string;
  categoryLabel?: string | null;
  badge?: string | null;
  theme: string;
  readTime?: string | null;
  readTimeMinutes?: number | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  sortOrder: number;
  featuredInNav: boolean;
  navOrder: number;
  sections?: any;
  createdAt?: any;
  updatedAt?: any;
}

interface MagazineManagerClientProps {
  initialArticles: MagazineArticleItem[];
}

const CATEGORY_NAMES: Record<string, string> = {
  'all': 'همه دسته‌ها',
  'bee-products': 'فرآورده‌های کندو',
  'honey-science': 'دانش و پژوهش عسل',
};

export function MagazineManagerClient({ initialArticles }: MagazineManagerClientProps) {
  const { success, error } = useToast();
  const [articles, setArticles] = useState<MagazineArticleItem[]>(initialArticles);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Deletion modal state
  const [deletingArticle, setDeletingArticle] = useState<MagazineArticleItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status toggle state
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Filtered articles
  const filteredArticles = useMemo(() => {
    let result = [...articles];

    if (selectedCategory !== 'all') {
      result = result.filter((a) => a.category === selectedCategory);
    }

    if (statusFilter === 'published') {
      result = result.filter((a) => a.status === 'PUBLISHED');
    } else if (statusFilter === 'draft') {
      result = result.filter((a) => a.status === 'DRAFT');
    }

    if (searchQuery.trim()) {
      const q = normalizeSearchText(searchQuery.trim());
      result = result.filter((a) => {
        const titleNorm = normalizeSearchText(a.title || '');
        const slugNorm = normalizeSearchText(a.slug || '');
        const excerptNorm = normalizeSearchText(a.excerpt || '');
        return titleNorm.includes(q) || slugNorm.includes(q) || excerptNorm.includes(q);
      });
    }

    return result.sort((a, b) => a.sortOrder - b.sortOrder);
  }, [articles, selectedCategory, statusFilter, searchQuery]);

  const handleToggleStatus = async (article: MagazineArticleItem) => {
    const newStatus = article.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    setTogglingId(article.id);
    try {
      const res = await toggleMagazineArticleStatusAction(article.id, newStatus);
      if (res.success) {
        setArticles((prev) =>
          prev.map((a) => (a.id === article.id ? { ...a, status: newStatus } : a))
        );
        success(`وضعیت مقاله به ${newStatus === 'PUBLISHED' ? 'منتشرشده' : 'پیش‌نویس'} تغییر یافت.`);
      } else {
        error(res.error || 'خطا در تغییر وضعیت مقاله.');
      }
    } catch (err: any) {
      error(err.message || 'خطا در برقراری ارتباط.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingArticle) return;
    setIsDeleting(true);
    try {
      const res = await deleteMagazineArticleAction(deletingArticle.id);
      if (res.success) {
        setArticles((prev) => prev.filter((a) => a.id !== deletingArticle.id));
        success('مقاله علمی با موفقیت حذف شد.');
        setDeletingArticle(null);
      } else {
        error(res.error || 'خطا در حذف مقاله.');
      }
    } catch (err: any) {
      error(err.message || 'خطای غیرمنتظره.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredArticles.length) return;

    const newArticles = [...filteredArticles];
    const temp = newArticles[index];
    newArticles[index] = newArticles[targetIndex];
    newArticles[targetIndex] = temp;

    // Update sortOrder
    const updatedWithOrder = newArticles.map((item, idx) => ({
      ...item,
      sortOrder: idx,
    }));

    setArticles(updatedWithOrder);

    try {
      const payload = updatedWithOrder.map((a) => ({ id: a.id, sortOrder: a.sortOrder }));
      await reorderMagazineArticlesAction({ items: payload });
      success('ترتیب مقالات به‌روزرسانی شد.');
    } catch (err: any) {
      error('خطا در ذخیره ترتیب: ' + (err.message || ''));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-stone-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#2B2017] flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-600" />
            مدیریت مجله علمی و پژوهشی
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 font-medium mt-1">
            مدیریت، نگارش و ویرایش مقالات علمی، دانشنامه خواص عسل‌ها و فرآورده‌های کندو
          </p>
        </div>

        <Link
          href="/admin/magazine/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F5A623] hover:bg-[#D98E16] text-[#2B2017] font-black text-sm border-2 border-amber-600 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          افزودن مقاله جدید
        </Link>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white border-2 border-stone-200 p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در عنوان، شناسه آدرس یا خلاصه مقاله..."
            className="w-full pr-9 pl-3.5 py-2 text-xs sm:text-sm border-2 border-stone-300 focus:border-amber-500 focus:outline-none"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm border-2 border-stone-300 focus:border-amber-500 bg-white"
          >
            <option value="all">همه دسته‌ها ({toPersianDigits(articles.length)})</option>
            <option value="bee-products">فرآورده‌های کندو</option>
            <option value="honey-science">دانش و پژوهش عسل</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs sm:text-sm border-2 border-stone-300 focus:border-amber-500 bg-white"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="published">فقط منتشرشده‌ها</option>
            <option value="draft">فقط پیش‌نویس‌ها</option>
          </select>
        </div>
      </div>

      {/* Articles Table */}
      <div className="bg-white border-2 border-stone-200 overflow-hidden">
        {filteredArticles.length === 0 ? (
          <div className="p-12 text-center text-stone-500 space-y-2">
            <BookOpen className="w-10 h-10 mx-auto text-stone-300" />
            <p className="font-bold">مقاله‌ای با این مشخصات یافت نشد.</p>
            <p className="text-xs">می‌توانید فیلترهای جستجو را تغییر دهید یا مقاله جدیدی ایجاد کنید.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-stone-100 border-b-2 border-stone-200 text-stone-700 font-black">
                <tr>
                  <th className="p-3.5 w-14 text-center">ترتیب</th>
                  <th className="p-3.5 w-20">تصویر</th>
                  <th className="p-3.5">عنوان و شناسه مقاله</th>
                  <th className="p-3.5 hidden md:table-cell">دسته‌بندی</th>
                  <th className="p-3.5 hidden sm:table-cell">زمان مطالعه</th>
                  <th className="p-3.5 text-center">وضعیت</th>
                  <th className="p-3.5 text-center w-36">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredArticles.map((article, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === filteredArticles.length - 1;
                  const img = article.coverImage || '/images/products/royal-jelly.webp';

                  return (
                    <tr key={article.id} className="hover:bg-amber-50/40 transition-colors">
                      {/* Sort Controls */}
                      <td className="p-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <button
                            type="button"
                            disabled={isFirst}
                            onClick={() => handleMoveOrder(idx, 'up')}
                            className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-20"
                            title="انتقال به بالا"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[11px] font-bold text-stone-500 font-mono">
                            {toPersianDigits(idx + 1)}
                          </span>
                          <button
                            type="button"
                            disabled={isLast}
                            onClick={() => handleMoveOrder(idx, 'down')}
                            className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-20"
                            title="انتقال به پایین"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Image Thumbnail */}
                      <td className="p-3">
                        <div className="relative w-14 h-14 bg-stone-100 border border-stone-300 overflow-hidden shrink-0">
                          <Image
                            src={img}
                            alt={article.title}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </div>
                      </td>

                      {/* Title & Slug */}
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-[#2B2017] hover:text-amber-700">
                              {article.title}
                            </span>
                            {article.badge && (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                {article.badge}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-stone-500 font-mono">
                            <span>/magazine/{article.slug}</span>
                            <Link
                              href={`/magazine/${article.slug}`}
                              target="_blank"
                              className="text-amber-700 hover:underline inline-flex items-center gap-0.5"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3 hidden md:table-cell">
                        <span className="text-xs font-bold text-stone-700 bg-stone-100 px-2 py-1 border border-stone-200">
                          {CATEGORY_NAMES[article.category] || article.categoryLabel || article.category}
                        </span>
                      </td>

                      {/* Read Time */}
                      <td className="p-3 hidden sm:table-cell">
                        <span className="inline-flex items-center gap-1 text-xs text-stone-600 font-medium">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          {toPersianDigits(article.readTimeMinutes || 5)} دقیقه
                        </span>
                      </td>

                      {/* Status Toggle */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          disabled={togglingId === article.id}
                          onClick={() => handleToggleStatus(article)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-black border transition-all ${
                            article.status === 'PUBLISHED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-500 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-800 border-amber-400 hover:bg-amber-100'
                          }`}
                        >
                          {togglingId === article.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : article.status === 'PUBLISHED' ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              منتشرشده
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-amber-600" />
                              پیش‌نویس
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/admin/magazine/${article.id}`}
                            className="p-1.5 text-stone-600 hover:text-amber-800 hover:bg-stone-100 transition-colors"
                            title="ویرایش مقاله"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeletingArticle(article)}
                            className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                            title="حذف مقاله"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingArticle)}
        title="حذف مقاله علمی"
        itemName={deletingArticle?.title}
        message="آیا از حذف این مقاله اطمینان دارید؟ با حذف مقاله، صفحه عمومی آن از دسترس خارج خواهد شد."
        confirmLabel="حذف قطعی مقاله"
        cancelLabel="انصراف"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingArticle(null)}
      />
    </div>
  );
}
