'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Clock, Search, Sparkles, X } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { WoodBackground } from '@/components/ui/wood-background';
import { PillButton } from '@/components/ui/pill-button';
import { DottedArrowIcon } from '@/components/ui/dotted-arrow-icon';
import { normalizeSearchText, toPersianDigits } from '@/lib/domain-utils';
import {
  MAGAZINE_ARTICLES,
  MAGAZINE_CATEGORIES,
  type MagazineArticle,
  type MagazineCardTheme,
  type MagazineCategoryId,
} from '@/content/magazine-articles';

const CARD_THEME_STYLES: Record<
  MagazineCardTheme,
  {
    bg: string;
    border: string;
    topText: string;
    subText: string;
    badgeBg: string;
    actionText: string;
  }
> = {
  GREEN: {
    bg: 'bg-[#4CA849]',
    border: 'border-[#3D8B3A]',
    topText: 'text-[#2B2017]',
    subText: 'text-[#2B2017]/90',
    badgeBg: 'bg-white/85 text-[#2B2017]',
    actionText: 'text-white',
  },
  ORANGE: {
    bg: 'bg-[#E08B38]',
    border: 'border-[#C67325]',
    topText: 'text-[#2B2017]',
    subText: 'text-[#2B2017]/90',
    badgeBg: 'bg-white/85 text-[#2B2017]',
    actionText: 'text-white',
  },
  YELLOW: {
    bg: 'bg-[#F5A623]',
    border: 'border-[#D98E16]',
    topText: 'text-[#2B2017]',
    subText: 'text-[#2B2017]/90',
    badgeBg: 'bg-white/85 text-[#2B2017]',
    actionText: 'text-white',
  },
  BURGUNDY: {
    bg: 'bg-[#9E3556]',
    border: 'border-[#7E2642]',
    topText: 'text-white',
    subText: 'text-white/90',
    badgeBg: 'bg-white/90 text-[#2B2017]',
    actionText: 'text-white',
  },
};

function MagazineArticleCard({ article }: { article: MagazineArticle }) {
  const styles = CARD_THEME_STYLES[article.theme];

  return (
    <Link
      href={`/magazine/${article.slug}`}
      className={`group flex flex-col justify-between overflow-hidden rounded-none border ${styles.border} ${styles.bg} shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg`}
    >
      {/* Image area matching ContentCard 240px height */}
      <div className="relative h-56 sm:h-60 w-full overflow-hidden bg-[#FAF6EE]">
        <Image
          src={article.imageUrl}
          alt={article.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.08]"
        />
        <span
          className={`absolute top-3 right-3 px-2.5 py-1 text-[11px] font-black shadow-xs rounded-full ${styles.badgeBg}`}
        >
          {article.badge}
        </span>
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-[#2B2017]/80 text-white rounded-none">
          <Clock className="w-3 h-3" />
          {toPersianDigits(article.readTimeMinutes)} دقیقه مطالعه
        </span>
      </div>

      {/* Colored Body adhering strictly to Baba Khorram card hierarchy */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-2">
          <span className={`block text-xs font-bold opacity-85 ${styles.topText}`}>
            {article.categoryLabel}
          </span>
          <h2 className={`text-lg sm:text-xl font-black leading-snug ${styles.topText}`}>
            {article.title}
          </h2>
          <p className={`text-xs sm:text-sm font-medium leading-relaxed line-clamp-3 ${styles.subText}`}>
            {article.excerpt}
          </p>
        </div>

        <div className={`pt-2 border-t border-black/10 flex items-center justify-between text-xs sm:text-sm font-black ${styles.actionText}`}>
          <span>مطالعه مقاله کامل</span>
          <DottedArrowIcon
            direction="left"
            className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
          />
        </div>
      </div>
    </Link>
  );
}

export function MagazineListingClient({
  initialArticles = MAGAZINE_ARTICLES,
}: {
  initialArticles?: MagazineArticle[];
} = {}) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | MagazineCategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArticles = useMemo(() => {
    const q = normalizeSearchText(searchQuery);
    return initialArticles.filter((article) => {
      if (selectedCategory !== 'all' && article.category !== selectedCategory) return false;
      if (!q) return true;
      const hay = normalizeSearchText(
        [
          article.title,
          article.subtitle,
          article.excerpt,
          article.categoryLabel,
          article.badge,
          ...(Array.isArray(article.sections) ? article.sections.map((s) => s.title) : []),
        ].join(' ')
      );
      return hay.includes(q);
    });
  }, [initialArticles, selectedCategory, searchQuery]);

  return (
    <WoodBackground className="min-h-screen py-10 sm:py-16">
      <Container className="max-w-7xl space-y-8 sm:space-y-12">
        {/* Page Hero Header matching Website Design System */}
        <header className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FAF5EB] border border-[#D9A441]/40 text-[#C58A2A] text-xs font-bold mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            <span>دانشنامه تخصصی کندو و زنبورداری</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-[#3F2A1D] tracking-tight mb-4">
            مجله علمی عسل باباخُرم
          </h1>

          <div className="flex items-center justify-center gap-3 my-4" aria-hidden="true">
            <span className="h-[1px] w-12 sm:w-20 bg-[#D9A441]/60" />
            <span className="w-2.5 h-2.5 rotate-45 bg-[#D9A441]" />
            <span className="h-[1px] w-12 sm:w-20 bg-[#D9A441]/60" />
          </div>

          <p className="text-sm sm:text-base text-[#5C5248] font-medium leading-relaxed">
            مجموعه مقالات مستند و کاربردی درباره فرآورده‌های ارزشمند کندو (رویال ژل، گرده گل، بره‌موم و نان زنبور) و علم شناخت عسل، فرآیند رس بستن، عسل سفید و طبع‌شناسی عسل‌ها.
          </p>
        </header>

        {/* Search & Filter Toolbar */}
        <div className="bg-white border border-[#EFE9E0] rounded-none shadow-xs p-4 sm:p-5 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-[#78716C] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در مقالات علمی (مثلاً: رویال ژل، بره‌موم، رس بستن، طبع، پرگا)..."
              aria-label="جستجو در مقالات مجله علمی"
              className="w-full pr-10 pl-10 py-2.5 bg-[#FAF6EE] border border-[#D9A441]/40 rounded-none text-sm font-bold text-[#2B2017] placeholder:text-[#78716C] focus:outline-none focus:border-[#D97706] focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="پاک کردن جستجو"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#2B2017] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="دسته‌بندی مقالات">
              {MAGAZINE_CATEGORIES.map((cat) => {
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 text-xs sm:text-sm font-black rounded-none border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#3F2A1D] text-white border-[#3F2A1D]'
                        : 'bg-[#FAF6EE] text-[#5C3A21] border-[#EFE9E0] hover:border-[#D9A441]'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <span className="text-xs font-bold text-[#6B5A4D]">
              نمایش {toPersianDigits(filteredArticles.length)} از {toPersianDigits(MAGAZINE_ARTICLES.length)} مقاله
            </span>
          </div>
        </div>

        {/* Articles Grid */}
        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {filteredArticles.map((article) => (
              <MagazineArticleCard key={article.slug} article={article} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-[#EFE9E0] rounded-none p-10 text-center space-y-4">
            <p className="text-base font-black text-[#3F2A1D]">
              مقاله‌ای با عبارت «{searchQuery}» یافت نشد.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="text-sm font-black text-[#D97706] hover:underline cursor-pointer"
            >
              نمایش همه مقالات علمی
            </button>
          </div>
        )}

        {/* Spotlight Callout to Interactive Temperament Guide & FAQ */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#FAF5EB] border border-[#D9A441]/50 rounded-none p-6 sm:p-8 flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-black text-[#B45309]">
                <Sparkles className="w-4 h-4" />
                <span>راهنمای انتخاب بر اساس مزاج</span>
              </div>
              <h2 className="text-xl font-black text-[#2B2017]">
                نمی‌دانید کدام عسل با طبع شما سازگارتر است؟
              </h2>
              <p className="text-xs sm:text-sm font-medium text-[#5C5248] leading-relaxed">
                جدول کامل طبع‌شناسی ۲۹ عسل تک‌گیاه، چندگیاه و گرده گل را همراه تعریف کامل ۹ طبع اصلی مشاهده و جستجو کنید.
              </p>
            </div>
            <div>
              <PillButton variant="orange" size="md" href="/magazine/honey-temperament">
                مشاهده جدول طبع‌شناسی عسل‌ها
              </PillButton>
            </div>
          </div>

          <div className="bg-white border border-[#EFE9E0] rounded-none p-6 sm:p-8 flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-black text-[#15803D]">
                <BookOpen className="w-4 h-4" />
                <span>پرسش‌های پرتکرار علمی</span>
              </div>
              <h2 className="text-xl font-black text-[#2B2017]">
                سوالات متداول درباره تشخیص اصالت و ویژگی‌های عسل
              </h2>
              <p className="text-xs sm:text-sm font-medium text-[#5C5248] leading-relaxed">
                چرا تست‌های خانگی قابل اتکا نیستند؟ تفاوت عسل طبیعی و تغذیه‌ای چیست؟ چرا بعضی عسل‌ها آبکی یا کم‌عطرند؟
              </p>
            </div>
            <div>
              <PillButton variant="green" size="md" href="/faq">
                مشاهده سوالات متداول
              </PillButton>
            </div>
          </div>
        </section>
      </Container>
    </WoodBackground>
  );
}
