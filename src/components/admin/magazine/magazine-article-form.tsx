'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  Save,
  Loader2,
  Plus,
  Trash2,
  Code,
  Layout,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { useToast } from '@/components/admin/toast-provider';
import { ImageUploader } from '@/components/admin/image-uploader';
import {
  createMagazineArticleAction,
  updateMagazineArticleAction,
} from '@/server/actions/magazine-actions';
import type { MagazineSection } from '@/content/magazine-articles';

interface MagazineArticleFormProps {
  initialData?: any;
  isEdit?: boolean;
}

const CATEGORY_OPTIONS = [
  { id: 'bee-products', label: 'فرآورده‌های ارزشمند کندو' },
  { id: 'honey-science', label: 'دانش و پژوهش عسل' },
];

const THEME_OPTIONS = [
  { id: 'YELLOW', label: 'زرد گرم (رویال ژل / عسل)' },
  { id: 'GREEN', label: 'سبز طبیعی (بره‌موم / گیاهی)' },
  { id: 'ORANGE', label: 'نارنجی کهربایی (گرده گل)' },
  { id: 'BURGUNDY', label: 'زرشکی فاخر (نان زنبور / تخصصی)' },
];

export function MagazineArticleForm({ initialData, isEdit = false }: MagazineArticleFormProps) {
  const router = useRouter();
  const { success, error } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [jsonMode, setJsonMode] = useState(false);

  const [formData, setFormData] = useState({
    slug: initialData?.slug || '',
    title: initialData?.title || '',
    shortTitle: initialData?.shortTitle || '',
    subtitle: initialData?.subtitle || '',
    excerpt: initialData?.excerpt || '',
    coverImage: initialData?.coverImage || initialData?.imageUrl || '',
    category: initialData?.category || 'bee-products',
    categoryLabel: initialData?.categoryLabel || 'فرآورده‌های ارزشمند کندو',
    badge: initialData?.badge || 'مقاله علمی',
    theme: initialData?.theme || 'YELLOW',
    readTime: initialData?.readTime || '۵ دقیقه مطالعه',
    readTimeMinutes: initialData?.readTimeMinutes ?? 5,
    status: initialData?.status || 'PUBLISHED',
    sortOrder: initialData?.sortOrder ?? 0,
    featuredInNav: Boolean(initialData?.featuredInNav),
    navOrder: initialData?.navOrder ?? 0,
    seoTitle: initialData?.seoTitle || '',
    seoDescription: initialData?.seoDescription || '',
  });

  const [sections, setSections] = useState<MagazineSection[]>(() => {
    if (Array.isArray(initialData?.sections) && initialData.sections.length > 0) {
      return initialData.sections;
    }
    return [
      {
        id: 'intro',
        title: 'مقدمه و تعاریف پایه',
        blocks: [
          {
            type: 'paragraph',
            text: 'توضیحات و متن اصلی مقاله علمی در این بخش قرار می‌گیرد...',
          },
        ],
      },
    ];
  });

  const [jsonRaw, setJsonRaw] = useState(() => JSON.stringify(sections, null, 2));

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cat = e.target.value;
    const found = CATEGORY_OPTIONS.find((c) => c.id === cat);
    setFormData((prev) => ({
      ...prev,
      category: cat,
      categoryLabel: found ? found.label : prev.categoryLabel,
    }));
  };

  const handleToggleJsonMode = () => {
    if (!jsonMode) {
      setJsonRaw(JSON.stringify(sections, null, 2));
      setJsonMode(true);
    } else {
      try {
        const parsed = JSON.parse(jsonRaw);
        if (Array.isArray(parsed)) {
          setSections(parsed);
          setJsonMode(false);
          success('ساختار بخش‌ها با موفقیت اعمال شد.');
        } else {
          error('فرمت JSON باید یک آرایه از بخش‌ها باشد.');
        }
      } catch (err: any) {
        error('خطای ساختار JSON: ' + (err.message || ''));
      }
    }
  };

  const handleAddSection = () => {
    const newSec: MagazineSection = {
      id: `section_${Date.now()}`,
      title: 'بخش جدید',
      blocks: [{ type: 'paragraph', text: 'متن این بخش را وارد کنید...' }],
    };
    setSections((prev) => [...prev, newSec]);
  };

  const handleRemoveSection = (idx: number) => {
    setSections((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSectionTitleChange = (idx: number, title: string) => {
    setSections((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], title };
      return copy;
    });
  };

  const handleAddBlock = (secIdx: number, type: 'paragraph' | 'subheading' | 'callout') => {
    setSections((prev) => {
      const copy = [...prev];
      const blocks = [...copy[secIdx].blocks];
      if (type === 'paragraph') {
        blocks.push({ type: 'paragraph', text: 'متن پاراگراف جدید...' });
      } else if (type === 'subheading') {
        blocks.push({ type: 'subheading', text: 'عنوان فرعی جدید' });
      } else if (type === 'callout') {
        blocks.push({
          type: 'callout',
          variant: 'info',
          title: 'نکته کاربردی',
          text: 'متن پیام یا توصیه علمی...',
        });
      }
      copy[secIdx] = { ...copy[secIdx], blocks };
      return copy;
    });
  };

  const handleRemoveBlock = (secIdx: number, blockIdx: number) => {
    setSections((prev) => {
      const copy = [...prev];
      const blocks = copy[secIdx].blocks.filter((_, i) => i !== blockIdx);
      copy[secIdx] = { ...copy[secIdx], blocks };
      return copy;
    });
  };

  const handleBlockChange = (secIdx: number, blockIdx: number, updated: any) => {
    setSections((prev) => {
      const copy = [...prev];
      const blocks = [...copy[secIdx].blocks];
      blocks[blockIdx] = { ...blocks[blockIdx], ...updated };
      copy[secIdx] = { ...copy[secIdx], blocks };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalSections = sections;
    if (jsonMode) {
      try {
        const parsed = JSON.parse(jsonRaw);
        if (Array.isArray(parsed)) {
          finalSections = parsed;
        } else {
          error('فرمت JSON باید یک آرایه باشد.');
          return;
        }
      } catch (err: any) {
        error('خطای ساختار JSON بخش‌ها: ' + err.message);
        return;
      }
    }

    if (!formData.title.trim()) {
      error('لطفاً عنوان مقاله را وارد کنید.');
      return;
    }

    if (!formData.slug.trim()) {
      error('شناسه آدرس (slug) الزامی است.');
      return;
    }

    if (!formData.excerpt.trim()) {
      error('لطفاً خلاصه مقاله را وارد کنید.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        sections: finalSections,
      };

      if (isEdit && initialData?.id) {
        const res = await updateMagazineArticleAction(initialData.id, payload);
        if (res.success) {
          success('مقاله علمی با موفقیت به‌روزرسانی شد.');
          router.push('/admin/magazine');
          router.refresh();
        } else {
          error(res.error || 'خطا در ویرایش مقاله.');
        }
      } else {
        const res = await createMagazineArticleAction(payload);
        if (res.success) {
          success('مقاله علمی جدید با موفقیت ایجاد شد.');
          router.push('/admin/magazine');
          router.refresh();
        } else {
          error(res.error || 'خطا در ایجاد مقاله.');
        }
      }
    } catch (err: any) {
      error(err.message || 'خطای غیرمنتظره در ذخیره‌سازی.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/magazine"
              className="text-stone-500 hover:text-amber-700 flex items-center gap-1 text-xs font-bold transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              بازگشت به مقالات مجله
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#2B2017]">
            {isEdit ? 'ویرایش مقاله علمی' : 'نگارش مقاله علمی جدید'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 font-medium">
            محتوای دانشنامه‌ای و مقالات مرجع باباخُرم پیرامون فرآورده‌های کندو و عسل
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isEdit && formData.slug && (
            <Link
              href={`/magazine/${formData.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              مشاهده عمومی
            </Link>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F5A623] hover:bg-[#D98E16] text-[#2B2017] font-black text-sm border-2 border-amber-600 shadow-sm transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? 'ذخیره تغییرات' : 'انتشار مقاله'}
          </button>
        </div>
      </div>

      {/* Basic Info Card */}
      <div className="bg-white border-2 border-stone-200 p-6 space-y-6">
        <h2 className="text-base font-black text-[#2B2017] border-b pb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-600" />
          مشخصات اصلی مقاله
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold text-stone-700">
              عنوان کامل مقاله <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => {
                const title = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  title,
                  slug: isEdit ? prev.slug : prev.slug || title.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 50),
                }));
              }}
              required
              placeholder="مثال: همه چیز درباره رویال ژل (ژل سلطنتی)"
              className="w-full px-3.5 py-2.5 text-sm border-2 border-stone-300 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">عنوان کوتاه (برای سایدبار و نویگیشن)</label>
            <input
              type="text"
              value={formData.shortTitle}
              onChange={(e) => setFormData((prev) => ({ ...prev, shortTitle: e.target.value }))}
              placeholder="مثال: همه چیز درباره رویال ژل"
              className="w-full px-3.5 py-2.5 text-sm border-2 border-stone-300 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">
              شناسه آدرس اینترنتی (slug) <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              dir="ltr"
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
              required
              placeholder="royal-jelly"
              className="w-full px-3.5 py-2.5 text-sm border-2 border-stone-300 focus:border-amber-500 focus:outline-none font-mono text-left"
            />
            <p className="text-[11px] text-stone-500">آدرس مقاله: /magazine/{formData.slug || 'slug'}</p>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold text-stone-700">زیرعنوان یا توضیح تکمیلی</label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
              placeholder="مثال: ترکیبات شیمیایی، یافته‌های علمی، تداخلات دارویی و موارد منع مصرف"
              className="w-full px-3.5 py-2.5 text-sm border-2 border-stone-300 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold text-stone-700">
              چکیده و خلاصه مقاله <span className="text-red-600">*</span>
            </label>
            <textarea
              rows={3}
              value={formData.excerpt}
              onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
              required
              placeholder="خلاصه‌ای از مهم‌ترین نکات مقاله برای کارت‌های فهرست و متا تگ‌ها..."
              className="w-full px-3.5 py-2.5 text-sm border-2 border-stone-300 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Media & Meta */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 border-t">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">دسته‌بندی موضوعی</label>
            <select
              value={formData.category}
              onChange={handleCategoryChange}
              className="w-full px-3.5 py-2.5 text-sm border-2 border-stone-300 focus:border-amber-500 focus:outline-none bg-white"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">تم رنگی کارت (Baba Khorram)</label>
            <select
              value={formData.theme}
              onChange={(e) => setFormData((prev) => ({ ...prev, theme: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-sm border-2 border-stone-300 focus:border-amber-500 focus:outline-none bg-white"
            >
              {THEME_OPTIONS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">برچسب کارت (Badge)</label>
            <input
              type="text"
              value={formData.badge}
              onChange={(e) => setFormData((prev) => ({ ...prev, badge: e.target.value }))}
              placeholder="اکسیر تغذیه‌ای کندو"
              className="w-full px-3.5 py-2.5 text-sm border-2 border-stone-300 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">مدت زمان تقریبی مطالعه (دقیقه)</label>
            <input
              type="number"
              min={1}
              max={120}
              value={formData.readTimeMinutes}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  readTimeMinutes: parseInt(e.target.value) || 5,
                  readTime: `${parseInt(e.target.value) || 5} دقیقه مطالعه`,
                }))
              }
              className="w-full px-3.5 py-2.5 text-sm border-2 border-stone-300 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">وضعیت انتشار</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as any }))}
              className="w-full px-3.5 py-2.5 text-sm border-2 border-stone-300 focus:border-amber-500 focus:outline-none bg-white font-bold"
            >
              <option value="PUBLISHED">منتشرشده (PUBLISHED)</option>
              <option value="DRAFT">پیش‌نویس (DRAFT)</option>
              <option value="ARCHIVED">بایگانی‌شده (ARCHIVED)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">ترتیب نمایش (Sort Order)</label>
            <input
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData((prev) => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
              className="w-full px-3.5 py-2.5 text-sm border-2 border-stone-300 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Cover Image */}
        <div className="space-y-3 pt-4 border-t">
          <label className="block text-xs font-bold text-stone-700">تصویر شاخص مقاله</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <ImageUploader
              value={formData.coverImage ? { url: formData.coverImage } : null}
              currentImageUrl={formData.coverImage}
              onChange={(asset) => {
                const url = asset?.url || (asset?.storageKey ? `/uploads/${asset.storageKey}` : '');
                setFormData((prev) => ({ ...prev, coverImage: url }));
              }}
              label="آپلود تصویر شاخص مقاله"
            />
            <div className="space-y-2">
              <label className="block text-xs font-medium text-stone-600">یا نشانی مستقیم تصویر (URL):</label>
              <input
                type="text"
                dir="ltr"
                value={formData.coverImage}
                onChange={(e) => setFormData((prev) => ({ ...prev, coverImage: e.target.value }))}
                placeholder="/images/products/royal-jelly.webp"
                className="w-full px-3.5 py-2 text-xs border-2 border-stone-300 focus:border-amber-500 font-mono text-left"
              />
              <p className="text-[11px] text-stone-500">
                می‌توانید فایل جدید آپلود کنید یا آدرس یک تصویر موجود در پروژه را وارد نمایید.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sections and Content Editor */}
      <div className="bg-white border-2 border-stone-200 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4">
          <div>
            <h2 className="text-base font-black text-[#2B2017] flex items-center gap-2">
              <Layout className="w-4 h-4 text-amber-600" />
              محتوا و بخش‌های علمی مقاله
            </h2>
            <p className="text-xs text-stone-500 font-medium">
              بخش‌ها، پاراگراف‌ها، هشدارهای منع مصرف و جداول علمی مقاله
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleJsonMode}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border transition-colors ${
                jsonMode
                  ? 'bg-amber-100 border-amber-500 text-amber-900'
                  : 'bg-stone-100 border-stone-300 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              {jsonMode ? 'بازگشت به ویرایشگر بصری' : 'ویرایشگر پیشرفته JSON'}
            </button>
            {!jsonMode && (
              <button
                type="button"
                onClick={handleAddSection}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#2B2017] text-white hover:bg-black text-xs font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                افزودن بخش جدید
              </button>
            )}
          </div>
        </div>

        {jsonMode ? (
          <div className="space-y-2">
            <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 text-xs leading-relaxed">
              <strong>حالت ویرایشگر پیشرفته:</strong> در این حالت ساختار کامل بلوک‌های علمی (شامل جدول ۲۹ عسل، کارت‌های پژوهش و گرید آمار) مستقیماً در فرمت JSON قابل ویرایش یا کپی‌پیست است.
            </div>
            <textarea
              rows={18}
              dir="ltr"
              value={jsonRaw}
              onChange={(e) => setJsonRaw(e.target.value)}
              className="w-full p-4 font-mono text-xs border-2 border-stone-300 focus:border-amber-500 focus:outline-none bg-stone-900 text-emerald-400 text-left"
            />
          </div>
        ) : (
          <div className="space-y-6">
            {sections.map((section, secIdx) => (
              <div key={section.id || secIdx} className="border-2 border-stone-200 p-5 bg-stone-50/60 space-y-4">
                <div className="flex items-center justify-between gap-3 border-b pb-3">
                  <div className="flex-1 flex items-center gap-3">
                    <span className="text-xs font-black px-2 py-1 bg-amber-200 text-amber-950">
                      بخش {secIdx + 1}
                    </span>
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => handleSectionTitleChange(secIdx, e.target.value)}
                      placeholder="عنوان بخش (مثال: ترکیبات و خواص علمی)"
                      className="flex-1 px-3 py-1.5 text-sm font-bold border border-stone-300 focus:border-amber-500 bg-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveSection(secIdx)}
                    className="text-stone-400 hover:text-red-600 p-1 transition-colors"
                    title="حذف این بخش"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Blocks */}
                <div className="space-y-3">
                  {section.blocks.map((block: any, bIdx: number) => (
                    <div key={bIdx} className="bg-white border border-stone-300 p-3.5 space-y-2 text-right">
                      <div className="flex items-center justify-between text-xs text-stone-500 border-b pb-1.5">
                        <span className="font-bold">
                          نوع بلوک: {block.type === 'paragraph' ? 'پاراگراف متن' : block.type === 'subheading' ? 'عنوان فرعی' : block.type === 'callout' ? 'کادر پیام/هشدار' : block.type}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBlock(secIdx, bIdx)}
                          className="text-red-600 hover:text-red-800 text-[11px]"
                        >
                          حذف بلوک
                        </button>
                      </div>

                      {block.type === 'paragraph' && (
                        <textarea
                          rows={3}
                          value={block.text || ''}
                          onChange={(e) => handleBlockChange(secIdx, bIdx, { text: e.target.value })}
                          placeholder="متن پاراگراف..."
                          className="w-full p-2 text-xs border border-stone-300 focus:border-amber-500"
                        />
                      )}

                      {block.type === 'subheading' && (
                        <input
                          type="text"
                          value={block.text || ''}
                          onChange={(e) => handleBlockChange(secIdx, bIdx, { text: e.target.value })}
                          placeholder="عنوان فرعی..."
                          className="w-full p-2 text-xs font-bold border border-stone-300 focus:border-amber-500"
                        />
                      )}

                      {block.type === 'callout' && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={block.title || ''}
                              onChange={(e) => handleBlockChange(secIdx, bIdx, { title: e.target.value })}
                              placeholder="عنوان کادر..."
                              className="p-2 text-xs font-bold border border-stone-300"
                            />
                            <select
                              value={block.variant || 'info'}
                              onChange={(e) => handleBlockChange(secIdx, bIdx, { variant: e.target.value })}
                              className="p-2 text-xs border border-stone-300 bg-white"
                            >
                              <option value="info">اطلاعاتی (آبی)</option>
                              <option value="tip">توصیه کاربردی (سبز)</option>
                              <option value="warning">هشدار احتیاط (زرد)</option>
                              <option value="danger">منع مصرف قطعی (قرمز)</option>
                            </select>
                          </div>
                          <textarea
                            rows={2}
                            value={block.text || ''}
                            onChange={(e) => handleBlockChange(secIdx, bIdx, { text: e.target.value })}
                            placeholder="متن داخل کادر..."
                            className="w-full p-2 text-xs border border-stone-300"
                          />
                        </div>
                      )}

                      {/* Fallback for complex blocks */}
                      {!['paragraph', 'subheading', 'callout'].includes(block.type) && (
                        <div className="p-2 bg-stone-100 text-stone-700 text-xs font-mono">
                          بلوک پیشرفته: <code>{block.type}</code> (برای ویرایش جزئیات از «ویرایشگر پیشرفته JSON» استفاده نمایید)
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Block Bar */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <span className="text-xs text-stone-500 font-bold">افزودن بلوک به این بخش:</span>
                  <button
                    type="button"
                    onClick={() => handleAddBlock(secIdx, 'paragraph')}
                    className="px-2.5 py-1 text-xs bg-stone-200 hover:bg-stone-300 text-stone-800 transition-colors"
                  >
                    + پاراگراف
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddBlock(secIdx, 'subheading')}
                    className="px-2.5 py-1 text-xs bg-stone-200 hover:bg-stone-300 text-stone-800 transition-colors"
                  >
                    + عنوان فرعی
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddBlock(secIdx, 'callout')}
                    className="px-2.5 py-1 text-xs bg-stone-200 hover:bg-stone-300 text-stone-800 transition-colors"
                  >
                    + کادر پیام/هشدار
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SEO Card */}
      <div className="bg-white border-2 border-stone-200 p-6 space-y-4">
        <h2 className="text-base font-black text-[#2B2017] border-b pb-3">تنظیمات سئو و متاتگ‌ها</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">عنوان سئو (Page Title)</label>
            <input
              type="text"
              value={formData.seoTitle}
              onChange={(e) => setFormData((prev) => ({ ...prev, seoTitle: e.target.value }))}
              placeholder="پیش‌فرض: همان عنوان مقاله"
              className="w-full px-3.5 py-2.5 text-sm border-2 border-stone-300 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700">توضیحات سئو (Meta Description)</label>
            <textarea
              rows={2}
              value={formData.seoDescription}
              onChange={(e) => setFormData((prev) => ({ ...prev, seoDescription: e.target.value }))}
              placeholder="پیش‌فرض: خلاصه مقاله"
              className="w-full px-3.5 py-2.5 text-sm border-2 border-stone-300 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Bottom Save Bar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-stone-200">
        <Link
          href="/admin/magazine"
          className="px-5 py-2.5 border-2 border-stone-300 text-stone-700 font-bold text-sm hover:bg-stone-100 transition-colors"
        >
          انصراف
        </Link>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#F5A623] hover:bg-[#D98E16] text-[#2B2017] font-black text-sm border-2 border-amber-600 shadow-sm transition-all disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isEdit ? 'ذخیره تغییرات' : 'انتشار مقاله'}
        </button>
      </div>
    </form>
  );
}
