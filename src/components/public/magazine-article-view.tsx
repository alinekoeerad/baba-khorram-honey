'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  AlertTriangle,
  BookOpen,
  ChevronLeft,
  Clock,
  Info,
  Lightbulb,
  Search,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { Container } from '@/components/ui/container';
import { WoodBackground } from '@/components/ui/wood-background';
import { PillButton } from '@/components/ui/pill-button';
import { DottedArrowIcon } from '@/components/ui/dotted-arrow-icon';
import { normalizeSearchText, toPersianDigits } from '@/lib/domain-utils';
import {
  HONEY_TEMPERAMENT_ITEMS,
  MAGAZINE_ARTICLES,
  type ArticleBlock,
  type HoneyTemperamentItem,
  type MagazineArticle,
  type MagazineCardTheme,
} from '@/content/magazine-articles';

const BREADCRUMB_BG: Record<MagazineCardTheme, string> = {
  YELLOW: 'bg-[#F5A623] text-[#2B2017]',
  ORANGE: 'bg-[#E08B38] text-[#2B2017]',
  GREEN: 'bg-[#4CA849] text-white',
  BURGUNDY: 'bg-[#9E3556] text-white',
};

const TEMPERAMENT_FILTERS: {
  id: 'all' | HoneyTemperamentItem['group'];
  label: string;
}[] = [
  { id: 'all', label: 'همه (۲۹ مورد)' },
  { id: 'warm-dry', label: 'گرم و خشک' },
  { id: 'warm-moderate', label: 'گرم و معتدل' },
  { id: 'warm-wet', label: 'گرم و تر' },
  { id: 'cool', label: 'معتدل مایل به خنک' },
];

const GROUP_BADGE_CLASSES: Record<HoneyTemperamentItem['group'], string> = {
  'warm-dry': 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]',
  'warm-moderate': 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]',
  'warm-wet': 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]',
  cool: 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]',
};

function TemperamentDirectoryWidget() {
  const [groupFilter, setGroupFilter] = useState<'all' | HoneyTemperamentItem['group']>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = normalizeSearchText(search);
    return HONEY_TEMPERAMENT_ITEMS.filter((item) => {
      if (groupFilter !== 'all' && item.group !== groupFilter) return false;
      if (!q) return true;
      return normalizeSearchText(`${item.name} ${item.temperament} ${item.note || ''}`).includes(q);
    });
  }, [groupFilter, search]);

  return (
    <div className="space-y-4 pt-2">
      <div className="bg-[#FAF6EE] border border-[#EFE9E0] rounded-none p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#78716C] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="نام عسل یا طبع را جستجو کنید (مثلاً: کنار، آویشن، گرم و معتدل، سماق)..."
            className="w-full pr-10 pl-4 py-2 bg-white border border-[#D9A441]/40 rounded-none text-xs sm:text-sm font-bold text-[#2B2017] placeholder:text-[#78716C] focus:outline-none focus:border-[#D97706]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {TEMPERAMENT_FILTERS.map((f) => {
            const active = groupFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setGroupFilter(f.id)}
                className={`px-3 py-1.5 text-xs font-black rounded-none border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#3F2A1D] text-white border-[#3F2A1D]'
                    : 'bg-white text-[#5C3A21] border-[#EFE9E0] hover:border-[#D9A441]'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto border border-[#EFE9E0] rounded-none">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-[#3F2A1D] text-white text-xs sm:text-sm font-black">
              <th className="py-3 px-4">نوع عسل / فرآورده</th>
              <th className="py-3 px-4">طبع در طب سنتی</th>
              <th className="py-3 px-4">مشاهده محصول</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EFE9E0] bg-white text-xs sm:text-sm">
            {filtered.map((item) => (
              <tr key={item.productSlug} className="hover:bg-[#FAF6EE]/70 transition-colors">
                <td className="py-3.5 px-4 font-black text-[#2B2017]">
                  <div>{item.name}</div>
                  {item.note && (
                    <p className="mt-1 text-[11px] sm:text-xs font-medium text-[#6B5A4D] leading-relaxed">
                      {item.note}
                    </p>
                  )}
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span
                    className={`inline-block px-2.5 py-1 border rounded-none text-xs font-black ${GROUP_BADGE_CLASSES[item.group]}`}
                  >
                    {item.temperament}
                  </span>
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <Link
                    href={`/products/${item.productSlug}`}
                    className="inline-flex items-center gap-1 text-xs font-black text-[#B45309] hover:text-[#78350F] underline underline-offset-4"
                  >
                    مشاهده صفحه عسل
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function renderArticleBlock(block: ArticleBlock, idx: number) {
  switch (block.type) {
    case 'paragraph':
      return (
        <p key={idx} className="text-sm sm:text-[15px] text-[#3F3128] font-medium leading-7 sm:leading-8">
          {block.text}
        </p>
      );

    case 'subheading':
      return (
        <h3
          key={idx}
          className="text-base sm:text-lg font-black text-[#3F2A1D] pt-2 pb-1 border-b border-[#EFE9E0]"
        >
          {block.text}
        </h3>
      );

    case 'list':
      return block.ordered ? (
        <ol key={idx} className="space-y-3 pt-1">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-sm sm:text-[15px] text-[#3F3128] font-medium leading-7"
            >
              <span className="w-6 h-6 shrink-0 mt-0.5 rounded-full bg-[#FAF5EB] border border-[#D9A441]/50 text-[#B45309] text-xs font-black flex items-center justify-center">
                {toPersianDigits(i + 1)}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      ) : (
        <ul key={idx} className="space-y-2.5 pt-1">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 text-sm sm:text-[15px] text-[#3F3128] font-medium leading-7"
            >
              <span
                className="w-2 h-2 mt-2.5 shrink-0 rotate-45 bg-[#D97706]"
                aria-hidden="true"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );

    case 'callout': {
      const variantClasses =
        block.variant === 'danger'
          ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#7F1D1D]'
          : block.variant === 'warning'
            ? 'bg-[#FFF7ED] border-[#FDBA74] text-[#7C2D12]'
            : block.variant === 'tip'
              ? 'bg-[#ECFDF5] border-[#6EE7B7] text-[#064E3B]'
              : 'bg-[#FFFBEB] border-[#FDE68A] text-[#5C3A21]';

      const Icon =
        block.variant === 'danger'
          ? ShieldAlert
          : block.variant === 'warning'
            ? AlertTriangle
            : block.variant === 'tip'
              ? Lightbulb
              : Info;

      return (
        <div
          key={idx}
          className={`border-r-4 border rounded-none p-5 sm:p-6 space-y-3 ${variantClasses}`}
        >
          <div className="flex items-center gap-2 font-black text-sm sm:text-base">
            <Icon className="w-5 h-5 shrink-0" />
            <span>{block.title}</span>
          </div>
          {block.text && (
            <p className="text-xs sm:text-sm font-medium leading-7 opacity-95">{block.text}</p>
          )}
          {block.items && block.items.length > 0 && (
            <ul className="space-y-2 pt-1">
              {block.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs sm:text-sm font-bold leading-7">
                  <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }

    case 'stats-grid':
      return (
        <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {block.items.map((stat, i) => (
            <div
              key={i}
              className="bg-[#FAF6EE] border border-[#D9A441]/35 rounded-none p-4 space-y-1.5"
            >
              <span className="block text-xs font-bold text-[#78716C]">{stat.label}</span>
              <span className="block text-base sm:text-lg font-black text-[#B45309]">
                {stat.value}
              </span>
              {stat.note && (
                <p className="text-xs font-medium text-[#4A3B31] leading-relaxed">{stat.note}</p>
              )}
            </div>
          ))}
        </div>
      );

    case 'comparison-table':
      return (
        <div key={idx} className="overflow-x-auto border border-[#EFE9E0] rounded-none pt-1">
          <table className="w-full text-right border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#3F2A1D] text-white font-black">
                {block.headers.map((h, i) => (
                  <th key={i} className="py-3 px-4">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE9E0] bg-white">
              {block.rows.map((row, rIdx) => (
                <tr key={rIdx} className="odd:bg-white even:bg-[#FAF6EE]/50">
                  <td className="py-3 px-4 font-black text-[#2B2017] whitespace-nowrap">
                    {row[0]}
                  </td>
                  <td className="py-3 px-4 font-medium text-[#4A3B31] leading-relaxed">{row[1]}</td>
                  <td className="py-3 px-4 font-medium text-[#4A3B31] leading-relaxed">{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'study-cards':
      return (
        <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {block.cards.map((card, cIdx) => (
            <div
              key={cIdx}
              className="bg-[#FAF6EE] border border-[#EFE9E0] hover:border-[#D9A441] rounded-none p-4 sm:p-5 space-y-2.5 transition-colors"
            >
              <h4 className="text-sm sm:text-base font-black text-[#2B2017] leading-snug">
                {card.title}
              </h4>
              <p className="text-xs sm:text-sm font-medium text-[#5C5248] leading-relaxed">
                {card.summary}
              </p>
              <ul className="space-y-1.5 pt-1 border-t border-[#EFE9E0]">
                {card.points.map((pt, pIdx) => (
                  <li
                    key={pIdx}
                    className="flex items-start gap-2 text-xs font-bold text-[#3F2A1D] leading-relaxed"
                  >
                    <span className="w-1.5 h-1.5 mt-2 rotate-45 bg-[#D97706] shrink-0" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );

    case 'temperament-guide':
      return <TemperamentDirectoryWidget key={idx} />;

    default:
      return null;
  }
}

export function MagazineArticleView({ article }: { article: MagazineArticle }) {
  const breadcrumbTheme = BREADCRUMB_BG[article.theme];
  const relatedArticles = MAGAZINE_ARTICLES.filter((a) => a.slug !== article.slug).slice(0, 3);

  return (
    <WoodBackground className="min-h-screen py-8 sm:py-14">
      <Container className="max-w-5xl space-y-8">
        {/* Top Colored Breadcrumb Bar matching ProductDetailView */}
        <nav
          aria-label="مسیر راهنما"
          className={`inline-flex flex-wrap items-center gap-2 px-4 py-2 text-xs sm:text-sm font-black rounded-none shadow-xs ${breadcrumbTheme}`}
        >
          <Link href="/" className="hover:underline">
            صفحه اصلی
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 opacity-80" />
          <Link href="/magazine" className="hover:underline">
            مجله علمی
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 opacity-80" />
          <span className="opacity-95">{article.shortTitle}</span>
        </nav>

        {/* Article Hero Box */}
        <header className="bg-white border border-[#EFE9E0] rounded-none shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12">
            <div className="md:col-span-5 relative min-h-[240px] sm:min-h-[300px] bg-[#FAF6EE]">
              <Image
                src={article.imageUrl}
                alt={article.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 42vw"
                className="object-cover"
              />
            </div>

            <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between gap-5">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF5EB] border border-[#D9A441]/40 text-[#B45309] text-xs font-bold">
                    <BookOpen className="w-3.5 h-3.5" />
                    {article.categoryLabel}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FAF6EE] border border-[#EFE9E0] text-[#5C3A21] text-xs font-bold rounded-none">
                    <Clock className="w-3.5 h-3.5 text-[#D97706]" />
                    {toPersianDigits(article.readTimeMinutes)} دقیقه مطالعه
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-black text-[#2B2017] leading-tight">
                  {article.title}
                </h1>

                <p className="text-sm sm:text-base font-medium text-[#5C5248] leading-relaxed">
                  {article.subtitle}
                </p>
              </div>

              {/* Jump Links / Table of Contents */}
              <div className="pt-4 border-t border-[#EFE9E0] space-y-2">
                <span className="block text-xs font-black text-[#78716C]">سرفصل‌های این مقاله:</span>
                <div className="flex flex-wrap gap-2">
                  {article.sections.map((sec, idx) => (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      className="px-2.5 py-1 text-xs font-bold bg-[#FAF6EE] hover:bg-[#FFFBEB] border border-[#EFE9E0] hover:border-[#D9A441] text-[#3F2A1D] rounded-none transition-colors"
                    >
                      {toPersianDigits(idx + 1)}. {sec.title}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Article Sections */}
        <article className="space-y-6">
          {article.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-28 bg-white border border-[#EFE9E0] rounded-none shadow-xs p-5 sm:p-8 space-y-4"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-[#EFE9E0]">
                <span className="w-2.5 h-2.5 rotate-45 bg-[#D97706] shrink-0" aria-hidden="true" />
                <h2 className="text-lg sm:text-2xl font-black text-[#2B2017] leading-snug">
                  {section.title}
                </h2>
              </div>

              <div className="space-y-4">{section.blocks.map(renderArticleBlock)}</div>
            </section>
          ))}
        </article>

        {/* Related Product Spotlight */}
        {article.relatedProduct && (
          <section className="bg-[#FAF5EB] border border-[#D9A441]/50 rounded-none p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-black text-[#B45309]">
                <Sparkles className="w-4 h-4" />
                محصول مرتبط در فروشگاه باباخُرم
              </span>
              <h3 className="text-lg sm:text-xl font-black text-[#2B2017]">
                {article.relatedProduct.nameFa}
              </h3>
              <p className="text-xs sm:text-sm font-medium text-[#5C5248]">
                برای مشاهده مشخصات، ویژگی‌های اقلیمی و ثبت سفارش وارد صفحه محصول شوید.
              </p>
            </div>
            <PillButton
              variant="gold"
              size="lg"
              href={`/products/${article.relatedProduct.slug}`}
              className="shrink-0"
            >
              {article.relatedProduct.label}
            </PillButton>
          </section>
        )}

        {/* Continue Reading Other Articles */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-black text-[#2B2017]">
              سایر مقالات مجله علمی
            </h2>
            <Link
              href="/magazine"
              className="text-xs sm:text-sm font-black text-[#B45309] hover:underline inline-flex items-center gap-1"
            >
              مشاهده همه مقالات
              <ChevronLeft className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedArticles.map((rel) => (
              <Link
                key={rel.slug}
                href={`/magazine/${rel.slug}`}
                className="group bg-white border border-[#EFE9E0] hover:border-[#D9A441] rounded-none p-5 flex flex-col justify-between gap-3 transition-all hover:-translate-y-1 shadow-xs"
              >
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-[#B45309]">{rel.badge}</span>
                  <h3 className="text-base font-black text-[#2B2017] group-hover:text-[#B45309] transition-colors">
                    {rel.shortTitle}
                  </h3>
                  <p className="text-xs font-medium text-[#5C5248] line-clamp-2 leading-relaxed">
                    {rel.excerpt}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-black text-[#3F2A1D]">
                  مطالعه مقاله
                  <DottedArrowIcon direction="left" className="w-4 h-4 text-[#D97706]" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </Container>
    </WoodBackground>
  );
}
